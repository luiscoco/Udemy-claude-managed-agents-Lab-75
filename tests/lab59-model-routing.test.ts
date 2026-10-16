import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { createLab59Router } from '../server/concepts/59-model-routing.js';
import { answerKeys } from '../server/routing/lab59-keys.js';
import { delegateTask, planRouting, resolveReport, runRouting, tasks } from '../server/routing/lab59.js';

test('13 checkable tasks use independent keys and closed report verification', () => {
  assert.equal(tasks.length, 13); assert.equal(Object.keys(answerKeys).length, 13);
  assert.equal(planRouting().answerKeysExposed, false);
  assert.equal(resolveReport('task-01', '{"answer":"37","confidence":0.8}').correct, true);
  assert.equal(resolveReport('task-01', '{"answer":"0","confidence":0.99}').correct, false);
  assert.equal(resolveReport('task-01', '{"answer":"37","confidence":0.8,"override":true}').valid, false);
});

test('strategies count classifier and reviewer sessions; confidence never substitutes for the key', () => {
  const light = runRouting('fixed-light', 10000), rule = runRouting('rule', 10000);
  assert.ok(light.correctCount < rule.correctCount); assert.equal(rule.correctCount, 13);
  const wrong = light.taskResults.find(item => item.difficulty === 'deep')!;
  assert.equal(wrong.attempts[0]?.confidence, 0.94); assert.equal(wrong.attempts[0]?.verified, false);
  const classifier = runRouting('classifier', 10000), review = runRouting('draft-review', 10000);
  assert.equal(classifier.sessionsCreated, 26); assert.equal(review.sessionsCreated, 26);
  assert.equal(delegateTask(tasks[10]!, 'cascade').length, 3);
  assert.ok(classifier.spendUnits > rule.spendUnits);
});

test('budget stops before admission and all attempts have distinct hypothetical sessions', () => {
  const result = runRouting('cascade', 100);
  assert.equal(result.stoppedByBudget, true); assert.ok(result.spendUnits <= 100);
  const sessions = result.taskResults.flatMap(item => item.attempts.map(attempt => attempt.sessionId));
  assert.equal(new Set(sessions).size, sessions.length);
  assert.equal(result.providerCalls, 0);
});

test('closed HTTP routes reject model-switch and client answer-key fields', async () => {
  const app = express(), instance = createLab59Router(); app.use('/api/c59', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c59`;
  const post = (path: string, body: unknown) => fetch(`${root}/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' }, body: JSON.stringify(body) });
  assert.equal((await fetch(`${root}/facts`)).status, 403);
  assert.equal((await post('run', { strategy: 'rule', budgetUnits: 1000, setModel: 'deep' })).status, 400);
  const result = await (await post('run', { strategy: 'rule', budgetUnits: 1000 })).json() as { correctCount: number };
  assert.equal(result.correctCount, 13);
});
