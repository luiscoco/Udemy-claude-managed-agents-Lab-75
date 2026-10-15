import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab36Error, Lab36Runner, consumeLab36Events } from '../server/lib/lab36-transport.js';
import { createLab36Router } from '../server/concepts/36-process-spawning.js';

test('loopback Managed port separates success, connection failure and early close', async () => {
  const runner = new Lab36Runner(); try {
    const good = await runner.run('alice', { mode: 'scripted', scenario: 'success' });
    assert.equal(good.outcome, 'completed'); assert.equal(good.eventCount, 3); assert.equal(good.cleanup, 'confirmed');
    assert.equal(good.providerCalls, 0); assert.deepEqual(good.remoteLifecycle.slice(0, 2), ['created', 'stream-open']);
    const connection = await runner.run('alice', { mode: 'scripted', scenario: 'connection-failure' });
    assert.equal(connection.outcome, 'connection-error'); assert.equal(connection.sessionId, null);
    const early = await runner.run('alice', { mode: 'scripted', scenario: 'early-stream-close' });
    assert.equal(early.outcome, 'incomplete'); assert.equal(early.eventCount, 1);
  } finally { runner.close(); }
});
test('host worker failure has one exit and redacted stderr; cancel leaves remote stop unconfirmed', async () => {
  const runner = new Lab36Runner(); try {
    const worker = await runner.run('alice', { mode: 'scripted', scenario: 'handler-worker-failure' });
    assert.equal(worker.outcome, 'worker-error'); assert.equal(worker.worker.started, true); assert.equal(worker.worker.exitCount, 1);
    assert.equal(worker.worker.stderrRedacted, true); assert.doesNotMatch(JSON.stringify(worker), /worker-format-failed/);
    const cancel = await runner.run('alice', { mode: 'scripted', scenario: 'cancel-pending-cleanup' });
    assert.equal(cancel.outcome, 'canceled'); assert.equal(cancel.localAbort, true); assert.equal(cancel.remoteStopConfirmed, false);
    assert.equal(cancel.cleanup, 'pending'); assert.ok(cancel.remoteLifecycle.includes('interrupt-requested'));
  } finally { runner.close(); }
});
test('event queue bound, event validation and ownership are host enforced', async () => {
  assert.throws(() => consumeLab36Events(Array.from({ length: 5 }, (_, index) => JSON.stringify({ id: `sevt_${index}`, type: 'agent.message' }))), Lab36Error);
  assert.throws(() => consumeLab36Events([JSON.stringify({ id: 'bad', type: 'agent.message' })]), Lab36Error);
  const runner = new Lab36Runner(); try {
    const run = await runner.run('alice', { mode: 'scripted', scenario: 'success' });
    assert.equal(runner.state('bob').length, 0); assert.throws(() => runner.reset('bob', run.runId), Lab36Error);
    assert.deepEqual(runner.reset('alice', run.runId), { deleted: true });
  } finally { runner.close(); }
});
test('HTTP validates live denial, unsupported Agent SDK fields and host-only routes', async () => {
  const app = express(), instance = createLab36Router(); app.use('/api/c36', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c36`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object) => fetch(`${base}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await post('run', { mode: 'live', scenario: 'success' })).status, 422);
  assert.equal((await post('run', { mode: 'scripted', scenario: 'success', toolAlias: 'claude' })).status, 400);
  assert.equal((await post('alias', {})).status, 400); assert.equal((await post('dry', {})).status, 200);
  const response = await post('run', { mode: 'scripted', scenario: 'success' }); assert.equal(response.status, 200);
});
