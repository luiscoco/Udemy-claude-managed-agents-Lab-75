import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { runWorktreeScenario } from '../server/worktrees/lab57.js';
import { createLab57Router } from '../server/concepts/57-parallel-worktrees.js';

test('serial integration uses two allowlisted worktrees and passes combined behavior', () => {
  const result = runWorktreeScenario('serial-integration');
  assert.match(result.baseSha, /^[a-f0-9]{40}$/); assert.equal(result.workers.length, 2);
  assert.deepEqual(result.workers.map(worker => worker.changedPaths), [['greeting.js'], ['tax.js']]);
  assert.ok(result.workers.every(worker => worker.testPassed && worker.committed && !worker.untrackedPaths.length));
  assert.equal(result.integration, 'passed'); assert.equal(result.combinedTestsPassed, true);
  assert.equal(result.providerCalls, 0);
});

test('competing edits abort cherry-pick and preserve branches; failed or cancelled work blocks integration', () => {
  const conflict = runWorktreeScenario('competing-edits');
  assert.equal(conflict.integration, 'conflicted'); assert.equal(conflict.conflictAborted, true);
  assert.equal(conflict.branchesPreserved, true); assert.equal(conflict.combinedTestsPassed, false);
  const failed = runWorktreeScenario('failed-worker');
  assert.equal(failed.integration, 'blocked'); assert.equal(failed.workers[1]?.testPassed, false);
  assert.equal(failed.workers[1]?.committed, false);
  const cancelled = runWorktreeScenario('cancel-worker');
  assert.equal(cancelled.integration, 'cancelled'); assert.equal(cancelled.workers[1]?.committed, false);
  assert.equal(cancelled.branchesPreserved, true);
});

test('closed HTTP route rejects invented worker instructions and bounds retained runs', async () => {
  const app = express(), instance = createLab57Router(); app.use('/api/c57', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c57`;
  const post = (body: unknown) => fetch(`${root}/run`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' }, body: JSON.stringify(body) });
  assert.equal((await fetch(`${root}/code`)).status, 403);
  assert.equal((await post({ scenario: 'serial-integration', filename: '../../secret' })).status, 400);
  const result = await (await post({ scenario: 'serial-integration' })).json() as { integration: string };
  assert.equal(result.integration, 'passed');
});
