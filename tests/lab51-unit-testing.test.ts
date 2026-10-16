import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { runLab51Scenario } from '../server/unit-testing/lab51.js';
import { createLab51Router } from '../server/concepts/51-unit-testing.js';
import { CapstoneStore } from '../server/capstone/store.js';
import { eligibleDamageRefund, handleCapstoneTool } from '../server/capstone/tools.js';

test('actual store and handler are tested offline across all host boundaries', async () => {
  const result = await runLab51Scenario('all');
  assert.equal(result.source, 'offline-injected-host'); assert.equal(result.providerCalls, 0);
  assert.equal(result.pass, true); assert.equal(result.mutationDetected, true);
  assert.equal(result.assertions.length, 11);
  assert.equal(result.assertions.filter(item => !item.pass).length, 1);
  assert.equal(result.assertions.find(item => !item.pass)?.name, 'mutated-policy-window');
});

test('virtual-time mutation fails a relevant assertion while the real 30-day host gate refuses the effect', async () => {
  const now = Date.parse('2026-11-11T12:00:00Z'), store = new CapstoneStore(() => now);
  const conversation = store.createConversation('owner', 'C-1'); const order = store.order('C-1', 'O-1001');
  assert.equal(eligibleDamageRefund(order, now), false);
  assert.equal(eligibleDamageRefund(order, now, 60), true);
  const response = handleCapstoneTool(store, { owner: 'owner', customerId: 'C-1', conversationId: conversation.id },
    { id: 'sevt_policy_case', name: 'propose_refund', input: { orderId: 'O-1001', amountCents: 100, reason: 'damaged-item' } });
  assert.equal(response.is_error, true); assert.equal(store.refunds.size, 0); assert.equal(store.approvals.size, 0);
  const result = await runLab51Scenario('policy-mutation');
  assert.equal(result.assertions.find(item => item.name === 'mutated-policy-window')?.pass, false);
});

test('closed HTTP routes expose local evidence and reject unsupported input without a provider', async () => {
  const instance = createLab51Router(), app = express(); app.use('/api/c51', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const url = `http://127.0.0.1:${address.port}/api/c51`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  assert.equal((await fetch(`${url}/facts`)).status, 403);
  const facts = await (await fetch(`${url}/facts`, { headers })).json() as { providerCalls: number };
  assert.equal(facts.providerCalls, 0);
  const post = (path: string, body: unknown) => fetch(`${url}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await post('run', { scenario: 'all', apiKey: 'forbidden' })).status, 400);
  assert.equal((await post('replay', { scenario: 'policy-mutation' })).status, 400);
  const replay = await (await post('replay', { scenario: 'duplicate-events' })).json() as { assertions: { pass: boolean }[] };
  assert.equal(replay.assertions[0]?.pass, true);
  const result = await (await post('run', { scenario: 'foreign-order' })).json() as { pass: boolean; providerCalls: number };
  assert.equal(result.pass, true); assert.equal(result.providerCalls, 0);
});
