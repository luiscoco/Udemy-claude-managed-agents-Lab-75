import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab26CallSchema } from '../shared/lab26-query-control.js';
import { Lab26Controls, Lab26Error } from '../server/lib/lab26-controls.js';
import { createLab26Router } from '../server/concepts/26-query-control.js';

test('strict operation catalog rejects unsupported SDK fields and arbitrary method names', () => {
  assert.equal(lab26CallSchema.safeParse({ sessionId: crypto.randomUUID(), operation: 'update', model: 'x' }).success, false);
  assert.equal(lab26CallSchema.safeParse({ sessionId: crypto.randomUUID(), operation: 'retrieve', model: 'x' }).success, false);
});
test('owned slow fixture interrupts to confirmed idle and permits a subsequent turn', async () => {
  const controls = new Lab26Controls(() => Date.now(), 200);
  const opened = controls.open('owner', { mode: 'scripted', scenario: 'slow', budgetCents: 10 });
  const id = opened.sessionId;
  assert.equal(controls.call('owner', { sessionId: id, operation: 'send', message: 'Observe' }).status, 'running');
  assert.throws(() => controls.call('owner', { sessionId: id, operation: 'idle-tools-mcp', tools: [], mcpServers: [] }), (error: unknown) => error instanceof Lab26Error && error.statusCode === 409);
  const interrupted = controls.call('owner', { sessionId: id, operation: 'interrupt' });
  assert.equal(interrupted.status, 'idle'); assert.equal(interrupted.interruption, 'confirmed-idle');
  assert.equal(controls.call('owner', { sessionId: id, operation: 'send', message: 'Continue' }).status, 'running');
  await new Promise(resolve => setTimeout(resolve, 220));
  assert.equal(controls.call('owner', { sessionId: id, operation: 'retrieve' }).status, 'idle');
  controls.close();
});
test('full replacement, budget opt-in, fresh model handoff and archive enforce boundaries', () => {
  const controls = new Lab26Controls(); const id = controls.open('alice', { mode: 'scripted', scenario: 'normal', budgetCents: 10 }).sessionId;
  assert.throws(() => controls.call('bob', { sessionId: id, operation: 'retrieve' }), (error: unknown) => error instanceof Lab26Error && error.statusCode === 404);
  assert.deepEqual(controls.call('alice', { sessionId: id, operation: 'idle-tools-mcp', tools: ['read_report'], mcpServers: [] }).tools, ['read_report']);
  assert.throws(() => controls.call('alice', { sessionId: id, operation: 'budget-change', budgetCents: 20, confirmResume: false }), Lab26Error);
  assert.equal(controls.call('alice', { sessionId: id, operation: 'budget-change', budgetCents: 20, confirmResume: true }).budgetCents, 20);
  const next = controls.call('alice', { sessionId: id, operation: 'fresh-model-handoff', model: 'fixture-model-b', summary: 'Explicit facts only.' });
  assert.notEqual(next.sessionId, id); assert.equal(next.model, 'fixture-model-b'); assert.equal(next.parentSessionId, id);
  assert.equal(controls.call('alice', { sessionId: id, operation: 'archive' }).status, 'archived');
  assert.throws(() => controls.call('alice', { sessionId: id, operation: 'send', message: 'Again' }), Lab26Error);
  controls.close();
});
test('HTTP validates origin, ownership, live denial and catalog before provider access', async () => {
  const app = express(); const instance = createLab26Router(); app.use('/api/c26', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c26`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  assert.equal((await fetch(`${base}/catalog`, { headers })).status, 200);
  const live = await fetch(`${base}/open`, { method: 'POST', headers, body: JSON.stringify({ mode: 'live', scenario: 'slow', budgetCents: 10 }) });
  assert.equal(live.status, 422);
  const opened = await fetch(`${base}/open`, { method: 'POST', headers, body: JSON.stringify({ mode: 'scripted', scenario: 'slow', budgetCents: 10 }) });
  const data = await opened.json() as { sessionId: string }; assert.equal(opened.status, 200);
  const foreign = await fetch(`${base}/call`, { method: 'POST', headers: { ...headers, 'X-Lab-Owner': 'bob' },
    body: JSON.stringify({ operation: 'retrieve', sessionId: data.sessionId }) }); assert.equal(foreign.status, 404);
});
