import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import express from 'express';
import { Lab68Queue, createLab68Router, signLab68, verifyLab68 } from '../server/concepts/68-scheduled-event-driven.js';

const now = 1800000000000; const secret = 'offline-test-signing-key';
const queue = (step = 1) => new Lab68Queue(secret, () => now, `artifacts/lab68/test-${randomUUID()}.sqlite`, step);
test('raw HMAC binds timestamp and exact bytes; scheduling clock never changes freshness', async () => {
  const store = queue(); try {
    const body = Buffer.from('{"owner":"a","eventId":"evt-1","incident":"fictional-finches"}');
    const timestamp = String(now / 1000); const signature = signLab68(secret, timestamp, body);
    assert.equal(verifyLab68(secret, timestamp, signature, body, now), true);
    assert.equal(verifyLab68(secret, timestamp, signature, Buffer.concat([body, Buffer.from(' ')]), now), false);
    const admitted = store.webhook(body, timestamp, signature); assert.equal(admitted.duplicate, false);
    assert.equal(store.webhook(body, timestamp, signature).duplicate, true);
    store.advance('a', 3600); assert.throws(() => store.fixture('a', 'stale', 'stale'), /freshness/);
    assert.throws(() => store.fixture('a', 'bad', 'bad-signature'), /signature/);
    assert.equal(store.snapshot('a').effects.length, 0); assert.equal(store.snapshot('a').jobs[0]?.state, 'queued');
  } finally { await store.close(); }
});
test('interval ticks coalesce, remain owner-scoped and require explicit worker claim', async () => {
  const store = queue(); try {
    assert.throws(() => store.schedule('a', 4)); assert.throws(() => store.schedule('a', 3601));
    store.schedule('a', 5); store.schedule('b', 5); store.advance('a', 60);
    const state = store.tick('a'); assert.equal(state.jobs.length, 1); assert.equal(state.jobs[0]?.coalesced, 12);
    assert.equal(store.tick('a').jobs.length, 1); assert.equal(store.tick('b').jobs.length, 0);
    assert.equal(state.effects.length, 0); const completed = await store.worker('a', 'success');
    assert.equal(completed.jobs[0]?.state, 'succeeded'); assert.equal(completed.effects.length, 1);
    assert.match(completed.jobs[0]!.audit.join(' '), /sevt_/);
    await assert.rejects(store.worker('a', 'success'), /No due job/);
  } finally { await store.close(); }
});
test('claim is synchronous; retry waits 1/2 seconds then dead-letters third failure', async () => {
  const store = queue(20); try {
    store.fixture('a', 'retry-event', 'valid'); const first = store.worker('a', 'failure');
    await assert.rejects(store.worker('a', 'success'), /already has a claim/); await first;
    assert.equal(store.snapshot('a').jobs[0]?.state, 'retry'); await assert.rejects(store.worker('a', 'failure'), /No due/);
    store.advance('a', 1); await store.worker('a', 'failure'); assert.equal(store.snapshot('a').jobs[0]?.attempts, 2);
    store.advance('a', 1); await assert.rejects(store.worker('a', 'failure'), /No due/);
    store.advance('a', 1); await store.worker('a', 'failure');
    assert.equal(store.snapshot('a').jobs[0]?.state, 'dead-letter'); assert.equal(store.snapshot('a').effects.length, 0);
    store.fixture('a', 'cancel-event', 'valid'); const pending = store.worker('a', 'success');
    const running = store.snapshot('a').jobs.find(job => job.state === 'running')!;
    assert.throws(() => store.cancel('b', running.id), /not found/); store.cancel('a', running.id); await pending;
    assert.equal(store.snapshot('a').jobs.find(job => job.id === running.id)?.state, 'cancelled');
  } finally { await store.close(); }
});
test('queue admits at most 100 jobs but duplicates remain acknowledged', async () => {
  const store = queue(); try {
    for (let index = 0; index < 100; index++) store.fixture('a', `evt-${index}`, 'valid');
    assert.equal(store.fixture('a', 'evt-0', 'valid').duplicate, true);
    assert.throws(() => store.fixture('a', 'evt-100', 'valid'), /capacity/);
  } finally { await store.close(); }
});
test('HTTP webhook verifies raw JSON before parsing and returns 202 on duplicates', async () => {
  const app = express(); const feature = createLab68Router(queue()); app.use('/api/c68', feature.router);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  try { const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
    const base = `http://127.0.0.1:${address.port}/api/c68`; const body = Buffer.from('{ "owner": "a", "eventId": "raw-1", "incident": "fictional-finches" }');
    const timestamp = String(now / 1000); const headers = { 'Content-Type': 'application/json',
      'X-Lab68-Timestamp': timestamp, 'X-Lab68-Signature': signLab68(secret, timestamp, body) };
    const first = await fetch(`${base}/webhook`, { method: 'POST', headers, body }); assert.equal(first.status, 202);
    const duplicate = await fetch(`${base}/webhook`, { method: 'POST', headers, body }); assert.equal(duplicate.status, 202);
    assert.equal((await duplicate.json()).duplicate, true);
    const tampered = await fetch(`${base}/webhook`, { method: 'POST', headers, body: Buffer.concat([body, Buffer.from(' ')]) });
    assert.equal(tampered.status, 401); assert.equal((await fetch(`${base}/state`)).status, 403);
  } finally { await feature.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
