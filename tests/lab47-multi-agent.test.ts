import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab47MultiAgent } from '../server/lib/lab47-multi-agent.js';
import { createLab47Router } from '../server/concepts/47-multi-agent.js';

test('native workers keep thread identity separate from shared session usage', () => {
  const manager = new Lab47MultiAgent(), run = manager.run('orchestrator', 'regional-sales');
  assert.equal(run.gate, 'passed'); assert.equal(run.architecture, 'native');
  assert.equal(run.workers[0]?.sessionId, run.workers[1]?.sessionId);
  assert.notEqual(run.workers[0]?.threadId, run.workers[1]?.threadId);
  assert.ok(run.sessionUsage); assert.equal(run.hostAggregate, null); assert.equal(run.providerCalls, 0);
});
test('one corrective round verifies the fixture before host handoff', () => {
  const run = new Lab47MultiAgent().run('pipeline', 'incorrect-total');
  assert.equal(run.gate, 'passed'); assert.equal(run.architecture, 'host');
  assert.notEqual(run.workers[0]?.sessionId, run.workers[1]?.sessionId);
  assert.equal(run.workers[1]?.state, 'corrected'); assert.equal(run.workers[1]?.attempts, 2);
  assert.match(run.workers[1]?.rawReport ?? '', /800/); assert.equal(run.workers[1]?.verifiedReport?.sales, 80);
  assert.ok(run.hostAggregate); assert.equal(run.sessionUsage, null);
});
test('late or failed dependencies block the gate regardless of parent prose', () => {
  const manager = new Lab47MultiAgent();
  for (const [scenario, gate] of [['delayed-worker', 'waiting'], ['dependency-failure', 'blocked']] as const) {
    const run = manager.run('fanout', scenario); assert.equal(run.gate, gate);
    assert.match(run.parentFinalText ?? '', /complete/);
    assert.ok(run.workers.some(worker => worker.verifiedReport === null));
  }
});
test('HTTP routes enforce closed offline requests and owner boundary', async () => {
  const app = express(), instance = createLab47Router(); app.use('/api/c47', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c47`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, addHeaders = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: addHeaders, body: JSON.stringify(body) });
  assert.equal((await post('pipeline', { mode: 'live', scenario: 'regional-sales' })).status, 400);
  assert.equal((await post('pipeline', { mode: 'scripted', scenario: 'regional-sales', extra: 1 })).status, 400);
  assert.equal((await post('pipeline', { mode: 'scripted', scenario: 'regional-sales' }, { ...headers, 'X-Lab-Owner': '' })).status, 403);
  const run = await (await post('evaluator', { mode: 'scripted', scenario: 'regional-sales' })).json() as { gate: string };
  assert.equal(run.gate, 'passed'); assert.equal((await fetch(`${base}/facts`, { headers })).status, 200);
});
