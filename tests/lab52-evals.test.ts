import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab52EvalStore } from '../server/evals/lab52.js';
import { createLab52Router } from '../server/concepts/52-evals.js';

test('baseline and recovered candidate use real host effects and allow only a local promotion pointer', () => {
  const store = new Lab52EvalStore();
  const baseline = store.run('alice', 'baseline', 2, 'none');
  assert.equal(baseline.cases.length, 8); assert.equal(baseline.hostPassRate, 1);
  assert.equal(baseline.promotable, false); assert.equal(baseline.providerCalls, 0);
  assert.equal(baseline.model, null); assert.equal(baseline.costCents, null);
  const recovered = store.run('alice', 'recovered', 2, 'agree');
  assert.equal(recovered.baselineRunId, baseline.id); assert.equal(recovered.promotable, true);
  assert.deepEqual(recovered.regressions, []);
  const pair = store.pairwise('alice', baseline.id, recovered.id);
  assert.equal(pair.deltaPassRate, 0); assert.equal(pair.promotionAllowed, true);
  assert.equal(store.promote('alice', recovered.id).promotedRunId, recovered.id);
});

test('missing baseline, false claims, safety failures, judge disagreement and invalid JSON block promotion', () => {
  const store = new Lab52EvalStore(); const missing = store.run('alice', 'recovered', 1, 'none');
  assert.equal(missing.promotable, false); assert.throws(() => store.promote('alice', missing.id), /Missing baseline/);
  const baseline = store.run('alice', 'baseline', 1, 'none');
  const regression = store.run('alice', 'regression', 2, 'none');
  assert.equal(regression.safetyPass, false); assert.equal(regression.hostPassRate, 0.25);
  assert.ok(regression.regressions.includes('hallucinated-refund trial 1'));
  assert.equal(regression.cases.find(item => item.caseId === 'over-refund')?.actualRefunds, 0);
  assert.equal(regression.cases.find(item => item.caseId === 'injection')?.toolRejected, true);
  assert.throws(() => store.promote('alice', regression.id), /safety failure/);
  const disagreement = store.run('alice', 'recovered', 1, 'disagree');
  assert.equal(disagreement.promotable, false);
  const invalid = store.run('alice', 'recovered', 1, 'invalid-json');
  assert.equal(invalid.cases[0]?.judge, 'invalid'); assert.equal(invalid.promotable, false);
  assert.equal(store.calibrate('disagreement').agrees, false);
  assert.equal(store.calibrate('invalid-json').usableForPromotion, false);
  assert.equal(store.pairwise('alice', baseline.id, regression.id).promotionAllowed, false);
});

test('owner and closed HTTP contracts prevent foreign report promotion and unsupported model fields', async () => {
  const app = express(), instance = createLab52Router(); app.use('/api/c52', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c52`;
  const headers = (owner: string) => ({ 'Content-Type': 'application/json', 'X-Lab-Owner': owner });
  const post = (route: string, body: unknown, owner = 'alice') => fetch(`${root}/${route}`, {
    method: 'POST', headers: headers(owner), body: JSON.stringify(body) });
  assert.equal((await fetch(`${root}/facts`)).status, 403);
  assert.equal((await post('run', { variant: 'baseline', trials: 2, judge: 'none', model: 'forged' })).status, 400);
  const baseline = await (await post('run', { variant: 'baseline', trials: 1, judge: 'none' })).json() as { id: string };
  const candidate = await (await post('run', { variant: 'recovered', trials: 1, judge: 'agree' })).json() as { id: string };
  assert.equal((await post('promote', { runId: candidate.id }, 'bob')).status, 409);
  assert.equal((await post('pairwise', { baselineRunId: baseline.id, candidateRunId: candidate.id })).status, 200);
  assert.equal((await post('promote', { runId: candidate.id })).status, 200);
});
