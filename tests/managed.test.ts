import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import express from 'express';
import { setTimeout as delay } from 'node:timers/promises';
import { runFoundation, fixtureOutput } from '../server/lib/managed-run.js';
import { createManagedRouter } from '../server/routes/managed.js';
import { managedSettings } from '../server/lib/managed-port.js';
import type { ManagedPort, RemoteEvent } from '../server/lib/managed-port.js';
import { managedResultSchema } from '../shared/managed.js';

test('managed router releases concurrency capacity after cancellation and remote cleanup', async () => {
  const previousLimit = process.env.MANAGED_MAX_CONCURRENT;
  process.env.MANAGED_MAX_CONCURRENT = '1';
  const { port, calls } = fake();
  port.stream = async (_id, signal) => (async function* () {
    yield { type: 'session.status_running' };
    await delay(10000, undefined, { signal });
  })();
  const managed = createManagedRouter(() => port);
  const app = express(); app.use('/api/managed', managed.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/managed/stream`;
  const controller = new AbortController();
  const post = (mode: string, signal?: AbortSignal) => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }), ...(signal ? { signal } : {}) });
  try {
    const first = await post('live', controller.signal);
    assert.equal(first.status, 200);
    assert.equal((await post('scripted')).status, 429);
    controller.abort();
    for (let attempt = 0; attempt < 100 && !calls.includes('archive'); attempt++) await delay(10);
    assert(calls.includes('interrupt')); assert(calls.includes('archive'));
    const next = await post('scripted'); assert.equal(next.status, 200);
    await next.text();
  } finally {
    controller.abort(); await managed.close(); server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    if (previousLimit === undefined) delete process.env.MANAGED_MAX_CONCURRENT;
    else process.env.MANAGED_MAX_CONCURRENT = previousLimit;
  }
});

const usage = { inputTokens: 12, outputTokens: 30, cacheReadInputTokens: 0, activeSeconds: 1.2,
  listCost: { amount: '2', currency: 'USD' } };
function fake(events: RemoteEvent[] = [{ type: 'agent.message', text: fixtureOutput }, { type: 'session.status_idle', stopReason: 'end_turn' }]) {
  const calls: string[] = [];
  const port: ManagedPort = {
    async create() { calls.push('create'); return 'sesn_test'; },
    async stream() { calls.push('stream'); return (async function* () { for (const event of events) yield event; })(); },
    async send() { calls.push('send'); },
    async inspect() { calls.push('inspect'); return { status: 'idle', usage }; },
    async interrupt() { calls.push('interrupt'); },
    async archive() { calls.push('archive'); },
  };
  return { port, calls };
}
test('scripted check is verified and never invokes a remote port', async () => {
  const { port, calls } = fake(); const events: string[] = [];
  const result = await runFoundation('scripted', port, new AbortController().signal, event => events.push(event.type));
  assert.equal(result.verified, true); assert.equal(result.source, 'authored-fixture');
  assert.equal(result.usage, null); assert.equal(result.sessionId, null); assert.deepEqual(calls, []);
  assert.equal(events.length, 4); managedResultSchema.parse(result);
});
test('live opens stream before send, verifies real output and retrieves usage before archive', async () => {
  const { port, calls } = fake();
  const result = await runFoundation('live', port, new AbortController().signal, () => {});
  assert.equal(result.status, 'succeeded'); assert.equal(result.verified, true);
  assert.deepEqual(result.usage, usage); assert.equal(result.cleanup, 'archived');
  assert.deepEqual(calls, ['create', 'stream', 'send', 'inspect', 'archive']);
});
for (const reason of ['requires_action', 'budget_reached', 'refusal']) test(`idle ${reason} is paused, never successful`, async () => {
  const { port } = fake([{ type: 'session.status_idle', stopReason: reason }]);
  const result = await runFoundation('live', port, new AbortController().signal, () => {});
  assert.equal(result.status, 'paused'); assert.equal(result.verified, false); assert.equal(result.stopReason, reason);
});
test('wrong response, missing terminal, remote error and excess output fail with cleanup', async () => {
  for (const events of [[{ type: 'agent.message', text: 'agent environment session event' }, { type: 'session.status_idle', stopReason: 'end_turn' }],
    [], [{ type: 'session.error' }], [{ type: 'agent.message', text: 'x'.repeat(16000) }, { type: 'agent.message', text: 'x'.repeat(16000) }]]) {
    const { port, calls } = fake(events);
    const result = await runFoundation('live', port, new AbortController().signal, () => {});
    assert.equal(result.status, 'failed'); assert.equal(result.cleanup, 'archived'); assert.ok(calls.includes('interrupt'));
  }
});
test('cancellation during creation still interrupts and archives the returned session', async () => {
  const { port, calls } = fake(); const controller = new AbortController();
  port.create = async () => { controller.abort('user'); return 'sesn_delayed'; };
  const result = await runFoundation('live', port, controller.signal, () => {});
  assert.equal(result.status, 'cancelled'); assert.equal(result.sessionId, 'sesn_delayed');
  assert.deepEqual(calls, ['interrupt', 'inspect', 'archive']);
});
test('stream cancellation uses independent cleanup and bounded waiting', async () => {
  const { port, calls } = fake(); const controller = new AbortController();
  port.stream = async (_id, signal) => (async function* () {
    yield { type: 'session.status_running' }; controller.abort('user');
    await delay(1000, undefined, { signal });
  })();
  const result = await runFoundation('live', port, controller.signal, () => {});
  assert.equal(result.status, 'cancelled'); assert.ok(calls.includes('interrupt')); assert.equal(result.cleanup, 'archived');
});
test('cleanup failure preserves remote ID and unknown usage, without false confirmation', async () => {
  const { port } = fake(); port.inspect = async () => { throw new Error('private upstream detail'); };
  const result = await runFoundation('live', port, new AbortController().signal, () => {}, 1);
  assert.equal(result.cleanup, 'pending'); assert.equal(result.usage, null); assert.equal(result.sessionId, 'sesn_test');
  assert.doesNotMatch(JSON.stringify(result), /private upstream/);
});
test('setup reports missing field names without revealing secrets', () => {
  assert.equal(managedSettings({}).configured, false);
  const result = managedSettings({ ANTHROPIC_API_KEY: 'private', MANAGED_AGENT_ID: 'agent', MANAGED_ENVIRONMENT_ID: 'env', MANAGED_BUDGET_CENTS: '0' });
  assert.equal(result.configured, false); assert.doesNotMatch(JSON.stringify(result), /private/);
});
test('HTTP validates origin, strict requests and configuration before any execution', async () => {
  let calls = 0;
  const managed = createManagedRouter(() => { calls++; throw new Error('missing'); });
  const app = express(); app.use('/api/managed', managed.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/managed`;
  try {
    assert.equal((await fetch(`${base}/setup`)).status, 200); assert.equal(calls, 0);
    const post = (data: unknown, origin?: string) => fetch(`${base}/stream`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(data) });
    assert.equal((await post({ mode: 'live' }, 'https://untrusted.example')).status, 403);
    assert.equal((await post({ mode: 'live', prompt: 'override' })).status, 400);
    assert.equal((await post({ mode: 'live' })).status, 422); assert.equal(calls, 1);
    const response = await post({ mode: 'scripted' }); const text = await response.text();
    assert.match(text, /event: result/); assert.match(text, /"verified":true/); assert.equal(calls, 1);
    assert.equal((await fetch(`${base}/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  } finally { await managed.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
