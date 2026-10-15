import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab28RequestSchema } from '../shared/lab28-errors-retries.js';
import { boundedRead, invokeSideEffect, Lab28Ledger, runLab28, sideEffectRequestOptions } from '../server/lib/lab28-faults.js';
import { createLab28Router } from '../server/concepts/28-errors-retries.js';

const input = (scenario: Parameters<typeof runLab28>[0]['scenario']) => ({ mode: 'scripted' as const, scenario, deadlineMs: 2000 });
test('bounded GET retries transient 429, while invalid, denied and cancellation do not retry', async () => {
  const waited: number[] = []; const result = await runLab28(input('read-rate-limit'), new AbortController().signal, async ms => { waited.push(ms); }, () => 0);
  assert.equal(result.readAttempts, 3); assert.deepEqual(waited, [20, 40]); assert.equal(result.mutationAttempts, 0);
  for (const scenario of ['invalid', 'auth', 'cancel'] as const) { const fault = await runLab28(input(scenario), new AbortController().signal);
    assert.equal(fault.readAttempts, 0); assert.equal(fault.mutationAttempts, 0); assert.equal(fault.retryAllowed, false); }
  let calls = 0; const denied = await boundedRead(async () => { calls++; return { status: 403 }; }, async () => {}, () => 0, new AbortController().signal);
  assert.equal(calls, 1); assert.equal(denied.attempts, 1);
  const controller = new AbortController(); let waiting!: () => void;
  const pending = boundedRead(async () => ({ status: 429 }), () => new Promise<void>(resolve => { waiting = resolve; }), () => 0, controller.signal);
  await new Promise(resolve => setTimeout(resolve, 0)); controller.abort(new Error('Canceled during backoff'));
  await assert.rejects(pending, /Canceled during backoff/); waiting();
  assert.equal(sideEffectRequestOptions.maxRetries, 0);
  const operations: string[] = [];
  const port = { async read() { return { status: 200, events: [] }; },
    async mutate(operation: 'create' | 'send' | 'confirm' | 'result' | 'interrupt', _signal: AbortSignal, options: typeof sideEffectRequestOptions) {
      assert.equal(options.maxRetries, 0); operations.push(operation); return { id: null }; } };
  for (const operation of ['create', 'send', 'confirm', 'result', 'interrupt'] as const)
    await invokeSideEffect(port, operation, new AbortController().signal);
  assert.deepEqual(operations, ['create', 'send', 'confirm', 'result', 'interrupt']);
});
test('unknown create ID is quarantined and a known effect is never applied twice', async () => {
  const missing = await runLab28(input('missing-create-response'), new AbortController().signal);
  assert.equal(missing.mutationAttempts, 1); assert.equal(missing.sessionId, null); assert.equal(missing.reconcile, 'unknown-create-id');
  assert.equal(missing.retryAllowed, false); assert.equal(missing.cleanup, 'pending');
  const tool = await runLab28(input('tool-result-failure'), new AbortController().signal);
  assert.equal(tool.mutationAttempts, 1); assert.equal(tool.effectCount, 1); assert.equal(tool.reconcile, 'host-ledger');
  const ledger = new Lab28Ledger(); assert.equal(ledger.applyOnce('call-1'), true); assert.equal(ledger.applyOnce('call-1'), false);
});
test('reconnect deduplicates known history and local disconnect leaves remote stop unknown', async () => {
  const reconnect = await runLab28(input('reconnect-duplicates'), new AbortController().signal);
  assert.equal(reconnect.effectCount, 2); assert.equal(reconnect.mutationAttempts, 0); assert.equal(reconnect.reconcile, 'known-session-history');
  const disconnect = await runLab28(input('disconnect'), new AbortController().signal);
  assert.equal(disconnect.classification, 'local-disconnect'); assert.equal(disconnect.remoteStopped, null);
  assert.equal(lab28RequestSchema.safeParse({ ...input('invalid'), maxRetries: 5 }).success, false);
});
test('HTTP routes validate before faults and deny live mode', async () => {
  const app = express(), instance = createLab28Router(); app.use('/api/c28', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c28`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const invalid = await fetch(`${base}/run`, { method: 'POST', headers, body: JSON.stringify({ ...input('invalid'), method: 'POST' }) });
  assert.equal(invalid.status, 400);
  const live = await fetch(`${base}/run`, { method: 'POST', headers, body: JSON.stringify({ ...input('invalid'), mode: 'live' }) });
  assert.equal(live.status, 422);
  const valid = await fetch(`${base}/run`, { method: 'POST', headers, body: JSON.stringify(input('reconnect-duplicates')) });
  assert.equal(valid.status, 200); assert.equal((await valid.json() as { classification: string }).classification, 'reconciled');
});
