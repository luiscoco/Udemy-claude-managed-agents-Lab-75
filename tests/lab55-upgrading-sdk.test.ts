import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFileSync } from 'node:fs';
import express from 'express';
import { Lab55UpgradeStore } from '../server/upgrades/lab55.js';
import { createLab55Router } from '../server/concepts/55-upgrading-sdk.js';

test('installed official SDK baseline is locked and distinct from authored candidate/API identity', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    dependencies: Record<string, string> };
  assert.equal(packageJson.dependencies['@anthropic-ai/sdk'], '1.7.0');
  const facts = new Lab55UpgradeStore().facts();
  assert.equal(facts.baseline.npmVersion, '1.7.0');
  assert.equal(facts.baseline.betaHeader, 'managed-agents-2026-04-01');
  assert.ok(facts.baseline.sendEvents.includes('user.custom_tool_result'));
  assert.equal(facts.candidateNpmVersion, null); assert.equal(facts.candidateIsInstalled, false);
});

test('compatible fixture advances only through canary, simulated promotion and rollback', () => {
  const store = new Lab55UpgradeStore(), first = store.run('alice', 'compatible-change', true);
  assert.equal(first.eligible, true); assert.equal(first.apiCompatibility, 'compatible');
  assert.throws(() => store.transition('alice', first.id, 'promote', true), /requires server eligibility/);
  const canary = store.transition('alice', first.id, 'canary'); assert.equal(canary.state, 'canary');
  assert.equal(canary.canaryEvidence, 'authored-pass');
  const promoted = store.transition('alice', first.id, 'promote'); assert.equal(promoted.state, 'promoted');
  const rolledBack = store.transition('alice', first.id, 'rollback'); assert.equal(rolledBack.state, 'rolled-back');
  assert.equal(rolledBack.remoteSessionsRewound, false); assert.match(rolledBack.note, /remote sessions/);
});

test('server gates block removed types, stream change, policy drift, absent usage, quality regression and missing evidence', () => {
  const store = new Lab55UpgradeStore();
  const cases = [
    ['removed-type', 'event-union', 'incompatible'], ['stream-change', 'stream-order', 'incompatible'],
    ['policy-drift', 'permission-policy', 'incompatible'], ['missing-usage', 'usage-evidence', 'compatible'],
    ['quality-regression', 'eval-gate', 'compatible'], ['missing-evidence', 'candidate-evidence', 'unknown'],
  ] as const;
  for (const [scenario, check, compatibility] of cases) {
    const result = store.run('alice', scenario, true);
    assert.equal(result.eligible, false); assert.equal(result.apiCompatibility, compatibility);
    assert.deepEqual(result.checks.filter(item => !item.pass).map(item => item.name), [check]);
    assert.throws(() => store.transition('alice', result.id, 'canary', true), /does not permit/);
  }
});

test('closed owner-scoped HTTP routes ignore client eligibility and reject unsupported SDK fields', async () => {
  const app = express(), instance = createLab55Router(); app.use('/api/c55', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c55`, headers = (owner: string) => ({
    'Content-Type': 'application/json', 'X-Lab-Owner': owner });
  const post = (path: string, body: unknown, owner = 'alice') => fetch(`${root}/${path}`, {
    method: 'POST', headers: headers(owner), body: JSON.stringify(body) });
  assert.equal((await fetch(`${root}/facts`)).status, 403);
  assert.equal((await post('run', { scenario: 'compatible-change', canUseTool: 'host' })).status, 400);
  const failed = await (await post('run', { scenario: 'policy-drift', clientEligible: true })).json() as { id: string; eligible: boolean };
  assert.equal(failed.eligible, false);
  assert.equal((await post('transition', { runId: failed.id, action: 'canary', clientEligible: true })).status, 409);
  assert.equal((await post('transition', { runId: failed.id, action: 'canary' }, 'bob')).status, 409);
});
