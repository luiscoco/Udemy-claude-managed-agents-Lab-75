import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import express from 'express';
import { Lab67Workshop, createLab67Router } from '../server/concepts/67-multi-tenant-saas.js';

test('two tenants reserve independently and every foreign object boundary refuses', async () => {
  const store = new Lab67Workshop(1);
  try { const a = store.authenticate('alice').token, b = store.authenticate('bob').token;
    const first = store.start(a, { requestId: randomUUID(), scenario: 'hold' });
    const second = store.start(b, { requestId: randomUUID(), scenario: 'hold' });
    assert.equal(store.usage(a).active, 1); assert.equal(store.usage(b).active, 1);
    assert.throws(() => store.start(a, { requestId: randomUUID(), scenario: 'normal' }), /concurrency/);
    for (const read of [() => store.get(a, second.id), () => store.session(a, second.sessionId),
      () => store.source(a, 'policy-birch'), () => store.transcript(a, second.id), () => store.cancel(a, second.id)])
      assert.throws(read, /not found/);
    assert.equal(store.get(b, second.id).state, 'running');
    store.cancel(a, first.id); store.cancel(b, second.id); await Promise.all([store.settle(a, first.id), store.settle(b, second.id)]);
    assert.equal(store.usage(a).reserved, 0); assert.equal(store.usage(b).reserved, 0);
    assert.equal(store.usage(a).spent, 0); assert.equal(store.usage(b).spent, 0);
  } finally { await store.close(); }
});
test('failure releases once, request id deduplicates, quota and rate are enforced', async () => {
  const store = new Lab67Workshop(1, () => 1000);
  try { const token = store.authenticate('alice').token;
    const failed = store.start(token, { requestId: randomUUID(), scenario: 'failure' }); await store.settle(token, failed.id);
    assert.equal(store.usage(token).reserved, 0); assert.equal(store.usage(token).spent, 0);
    const requestId = randomUUID(); const first = store.start(token, { requestId, scenario: 'normal' });
    const duplicate = store.start(token, { requestId, scenario: 'normal' }); assert.equal(duplicate.id, first.id); assert.equal(duplicate.duplicate, true);
    await store.settle(token, first.id);
    for (let index = 0; index < 2; index++) { const run = store.start(token, { requestId: randomUUID(), scenario: 'normal' }); await store.settle(token, run.id); }
    assert.equal(store.usage(token).spent, 6); assert.throws(() => store.start(token, { requestId: randomUUID(), scenario: 'normal' }), /quota/);
    const released = store.usage(token).ledger.filter(row => row.runId === failed.id && row.event === 'released'); assert.equal(released.length, 1);
  } finally { await store.close(); }
  const rateStore = new Lab67Workshop(1, () => 1000);
  try { const token = rateStore.authenticate('bob').token;
    for (let index = 0; index < 6; index++) { const run = rateStore.start(token, { requestId: randomUUID(), scenario: 'failure' }); await rateStore.settle(token, run.id); }
    assert.throws(() => rateStore.start(token, { requestId: randomUUID(), scenario: 'failure' }), /rate limit/);
  } finally { await rateStore.close(); }
});
test('missing principal and model-supplied tenant authority are rejected', async () => {
  const store = new Lab67Workshop(1);
  try { for (const access of [() => store.usage(undefined), () => store.get(undefined, randomUUID()),
      () => store.source(undefined, 'policy-acme'), () => store.session(undefined, 'sesn_unknown'),
      () => store.transcript(undefined, randomUUID()), () => store.cancel(undefined, randomUUID())]) assert.throws(access, /principal required/);
    const token = store.authenticate('alice').token;
    assert.throws(() => store.handleTool(token, { id: 'sevt_abc', name: 'read_project_policy',
      input: { sourceId: 'policy-acme', tenant: 'birch' } }));
    assert.throws(() => store.handleTool(token, { id: 'sevt_abc', name: 'read_project_policy', input: { sourceId: 'policy-birch' } }), /not found/);
    const result = store.handleTool(token, { id: 'sevt_valid123', name: 'read_project_policy', input: { sourceId: 'policy-acme' } });
    assert.equal(result.custom_tool_use_id, 'sevt_valid123'); assert.match(result.content[0]!.text, /30 days/);
  } finally { await store.close(); }
});
test('HTTP routes require bearer principal and reject client tenant fields', async () => {
  const app = express(); const feature = createLab67Router(new Lab67Workshop(1)); app.use('/api/c67', feature.router);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  try { const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
    const base = `http://127.0.0.1:${address.port}/api/c67`;
    assert.equal((await fetch(`${base}/usage`)).status, 401);
    const auth = await fetch(`${base}/auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ principal: 'alice' }) });
    const token = (await auth.json()).token;
    const response = await fetch(`${base}/runs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ requestId: randomUUID(), scenario: 'normal', tenant: 'birch' }) }); assert.equal(response.status, 400);
  } finally { await feature.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
