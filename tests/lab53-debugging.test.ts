import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab53TraceStore } from '../server/debugging/lab53.js';
import { createLab53Router } from '../server/concepts/53-debugging.js';

test('trace replay uses the actual consumer and recorded effects match the host ledger', () => {
  const store = new Lab53TraceStore(), control = store.run('alice', 'valid-control');
  assert.equal(control.eventOutcome, 'completed'); assert.equal(control.refundLedgerCount, 1);
  assert.equal(control.replay.outcome, 'completed'); assert.equal(control.replay.effectsMatch, true);
  assert.equal(control.trace[control.firstUsefulSequence - 1]?.kind, 'host-decision');
  assert.equal(control.providerCalls, 0); assert.equal(control.resolvedConfig.agentVersion, null);
  const denied = store.run('alice', 'denied-tool');
  assert.equal(denied.eventOutcome, 'paused'); assert.equal(denied.refundLedgerCount, 0);
  assert.equal(denied.trace[denied.firstUsefulSequence - 1]?.kind, 'host-decision');
  assert.match(denied.cause, /foreign-customer/);
});

test('malformed report, missing idle, EOF, turn limit and cleanup timeout have distinct evidence', () => {
  const store = new Lab53TraceStore(), cases = ['malformed-report', 'missing-idle', 'stream-eof',
    'local-turn-limit', 'cleanup-timeout'] as const;
  const results = cases.map(scenario => store.run('alice', scenario));
  assert.equal(results[0]?.eventOutcome, 'completed'); assert.equal(results[0]?.reportValid, false);
  assert.equal(results[0]?.remoteStop, 'confirmed-idle');
  for (const result of results.slice(1)) { assert.equal(result.eventOutcome, 'incomplete');
    assert.equal(result.remoteStop, 'unconfirmed'); assert.equal(result.historyGap, true);
    assert.equal(result.replay.outcome, result.eventOutcome); assert.equal(result.replay.effectsMatch, true); }
  assert.equal(results.at(-1)?.cleanup, 'pending');
  assert.equal(results.find(item => item.scenario === 'stream-eof')?.trace[0]?.kind, 'transport');
  assert.ok(results.every(item => item.trace.length <= 40 && item.trace.every(entry => !entry.summary.includes('sk-ant'))));
});

test('closed, owner-scoped HTTP routes keep saved traces private and reject unsupported fields', async () => {
  const app = express(), instance = createLab53Router(); app.use('/api/c53', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c53`;
  const headers = (owner: string) => ({ 'Content-Type': 'application/json', 'X-Lab-Owner': owner });
  assert.equal((await fetch(`${root}/facts`)).status, 403);
  const post = (body: unknown) => fetch(`${root}/run`, { method: 'POST', headers: headers('alice'), body: JSON.stringify(body) });
  assert.equal((await post({ scenario: 'stream-eof', hook: 'forbidden' })).status, 400);
  const result = await (await post({ scenario: 'stream-eof' })).json() as { id: string; eventOutcome: string };
  assert.equal(result.eventOutcome, 'incomplete');
  assert.equal((await fetch(`${root}/runs/${result.id}`, { headers: headers('bob') })).status, 404);
  assert.equal((await fetch(`${root}/runs/${result.id}`, { headers: headers('alice') })).status, 200);
});
