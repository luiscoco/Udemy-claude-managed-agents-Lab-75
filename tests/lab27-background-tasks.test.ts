import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab27CallSchema } from '../shared/lab27-background-tasks.js';
import { Lab27Error, Lab27Ledger } from '../server/lib/lab27-ledger.js';
import { createLab27Router } from '../server/concepts/27-background-tasks.js';

const request = { mode: 'scripted' as const, backgroundAllowed: true, scenario: 'slow' as const, request: 'Fictional field note' };
test('detach and reconnect preserve task, session and thread IDs without duplicate effects', async () => {
  const ledger = new Lab27Ledger(() => Date.now(), 150); const opened = ledger.open('alice', request);
  const detached = ledger.call('alice', { operation: 'detach', taskId: opened.taskId });
  assert.equal(detached.browserConnection, 'detached'); assert.equal(detached.taskState, 'running');
  const connected = ledger.call('alice', { operation: 'reconnect', taskId: opened.taskId });
  assert.equal(connected.sessionId, opened.sessionId); assert.equal(connected.threadId, opened.threadId);
  assert.equal(connected.createCount, 1); assert.equal(connected.duplicateCards, 0); assert.deepEqual(connected.eventIds, opened.eventIds);
  await new Promise(resolve => setTimeout(resolve, 180));
  const complete = ledger.call('alice', { operation: 'reconnect', taskId: opened.taskId });
  assert.equal(complete.taskState, 'completed'); assert.equal(complete.remoteStatus, 'idle'); assert.equal(complete.reportVerified, false);
  assert.deepEqual(complete.eventIds, ['task-started', 'child-started', 'task-completed']); ledger.close();
});
test('explicit stop confirms idle before archive; policy, ownership and expiry fail closed', () => {
  let now = 0; const ledger = new Lab27Ledger(() => now, 3000);
  assert.throws(() => ledger.open('alice', { ...request, backgroundAllowed: false }), Lab27Error);
  const opened = ledger.open('alice', request);
  assert.throws(() => ledger.call('alice', { operation: 'close', taskId: opened.taskId }), Lab27Error);
  assert.throws(() => ledger.call('bob', { operation: 'inspect', taskId: opened.taskId }), Lab27Error);
  const stopped = ledger.call('alice', { operation: 'stop', taskId: opened.taskId });
  assert.equal(stopped.taskState, 'stopped'); assert.equal(stopped.stopEvidence, 'confirmed-idle');
  assert.equal(ledger.call('alice', { operation: 'close', taskId: opened.taskId }).remoteStatus, 'archived');
  const later = ledger.open('alice', request); now = 300_001;
  assert.throws(() => ledger.call('alice', { operation: 'inspect', taskId: later.taskId }), (error: unknown) => error instanceof Lab27Error && error.statusCode === 410);
  ledger.close();
});
test('one-shot closes an already completed fixture and report stays unverified', () => {
  const ledger = new Lab27Ledger(); const result = ledger.oneshot('alice', { ...request, scenario: 'completed' });
  assert.equal(result.remoteStatus, 'archived'); assert.equal(result.reportVerified, false); ledger.close();
});
test('HTTP restricts task catalog and live mode before effects', async () => {
  const app = express(), instance = createLab27Router(); app.use('/api/c27', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c27`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  assert.equal(lab27CallSchema.safeParse({ operation: 'background_tasks_changed', taskId: crypto.randomUUID() }).success, false);
  assert.equal((await fetch(`${base}/open`, { method: 'POST', headers, body: JSON.stringify({ ...request, mode: 'live' }) })).status, 422);
  const response = await fetch(`${base}/open`, { method: 'POST', headers, body: JSON.stringify(request) });
  assert.equal(response.status, 200); const opened = await response.json() as { taskId: string };
  const foreign = await fetch(`${base}/call`, { method: 'POST', headers: { ...headers, 'X-Lab-Owner': 'bob' },
    body: JSON.stringify({ operation: 'inspect', taskId: opened.taskId }) }); assert.equal(foreign.status, 404);
});
