import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createLab24Router } from '../server/concepts/24-harnesses.js';
import { createInventoryHandler, runLab24 } from '../server/lib/lab24-harnesses.js';
import { installedHarnessMethods, manualMessagesLoop, manualMessagesParams, managedSessionParams, messagesToolRunner } from '../server/lib/lab24-sdk-contracts.js';
import type Anthropic from '@anthropic-ai/sdk';

test('three typed adapters call the same checked host handler and preserve effects', async () => {
  for (const harness of ['manual-messages', 'messages-tool-runner', 'managed-session'] as const) {
    const result = await runLab24({ mode: 'scripted', harness, scenario: 'reserve', callLimit: 2 });
    assert.equal(result.outcome, 'reserved'); assert.equal(result.stock, 3); assert.equal(result.providerCalls, 0);
    assert.equal(result.effects.length, 1); assert.equal(result.effects[0]?.accepted, true);
    assert.deepEqual(result.trace.map(item => item.stage), ['request', 'call', 'checked-effect', 'result', 'answer', 'cleanup']);
    assert.equal(result.trace[1]?.adapter, { 'manual-messages': 'messages-tool-use',
      'messages-tool-runner': 'messages-runner-callback', 'managed-session': 'managed-custom-tool-use' }[harness]);
  }
});

test('large call rejects and host call-count limit blocks the second effect', async () => {
  for (const harness of ['manual-messages', 'messages-tool-runner', 'managed-session'] as const) {
    const rejected = await runLab24({ mode: 'scripted', harness, scenario: 'large-reservation', callLimit: 2 });
    assert.equal(rejected.outcome, 'rejected'); assert.equal(rejected.stock, 5); assert.equal(rejected.effects[0]?.accepted, false);
    const limited = await runLab24({ mode: 'scripted', harness, scenario: 'call-limit', callLimit: 1 });
    assert.equal(limited.outcome, 'call-limit'); assert.equal(limited.toolCalls, 1);
    assert.deepEqual(limited.effects.map(effect => effect.tool), ['get_stock']); assert.equal(limited.stock, 5);
  }
  const inventory = createInventoryHandler();
  assert.equal(inventory.execute({ name: 'reserve_stock', input: { sku: 'NOTEBOOK', quantity: 5 } }).accepted, false);
  assert.equal(inventory.stock, 5);
});

test('HTTP inventory is read-only and strict runs reject live, SDK fields and foreign origin', async () => {
  const app = express(), feature = createLab24Router(); app.use('/api/c24', feature.router);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/c24`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'student24' };
  try {
    const tools = await fetch(base + '/tools', { headers }); assert.equal(tools.status, 200);
    assert.equal((await tools.json()).providerCalls, 0);
    const code = await fetch(base + '/code', { headers }); assert.equal((await code.json()).liveReady, false);
    const run = (body: unknown, extra = {}) => fetch(base + '/run', { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) });
    const good = { mode: 'scripted', harness: 'managed-session', scenario: 'reserve', callLimit: 2 };
    assert.equal((await run(good)).status, 200);
    assert.equal((await run({ ...good, mode: 'live' })).status, 422);
    assert.equal((await run({ ...good, allowedTools: ['bash'] })).status, 400);
    assert.equal((await run(good, { Origin: 'https://elsewhere.example' })).status, 403);
  } finally { await feature.close(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});

test('installed SDK surfaces and direct/Managed request shapes remain separate', () => {
  assert.deepEqual(installedHarnessMethods(), { messagesCreate: true, toolRunner: true, managedSessions: true, providerCalls: 0 });
  const message = manualMessagesParams('claude-test-model');
  assert.equal(message.model, 'claude-test-model'); assert.equal('agent' in message, false);
  const session = managedSessionParams('agent_test', 2, 'env_test');
  assert.equal(session.environment_id, 'env_test'); assert.equal('messages' in session, false);
  assert.equal('max_tokens' in session, false);
});

test('injected Messages SDK loop appends a checked tool result; runner callback uses the same host policy', async () => {
  const requests: unknown[] = [];
  const fakeMessages = { messages: { create: async (request: unknown) => {
    requests.push(request);
    return requests.length === 1 ? { content: [{ type: 'tool_use', id: 'toolu_fixture', name: 'reserve_stock', input: { sku: 'NOTEBOOK', quantity: 2 } }] }
      : { content: [{ type: 'text', text: 'I reserved two.' }] };
  } } } as unknown as Pick<Anthropic, 'messages'>;
  const manual = await manualMessagesLoop(fakeMessages, 'claude-test-model', new AbortController().signal);
  assert.equal(manual.stock, 3); assert.equal(manual.effects[0]?.accepted, true); assert.equal(requests.length, 2);
  assert.match(JSON.stringify(requests[1]), /tool_result/);
  const fakeRunner = { beta: { messages: { toolRunner: async (request: { tools: { run: (input: unknown) => Promise<string> }[] }) => {
    const text = await request.tools[0]!.run({ sku: 'NOTEBOOK', quantity: 5 });
    assert.match(text, /Host policy allows/); return { content: [{ type: 'text', text: 'Rejected.' }] };
  } } } } as unknown as Anthropic;
  const runner = await messagesToolRunner(fakeRunner, 'claude-test-model', new AbortController().signal);
  assert.equal(runner.stock, 5); assert.equal(runner.effects[0]?.accepted, false);
});

test('owner concurrency is bounded and shutdown aborts an unfinished run', async () => {
  let started!: () => void; const running = new Promise<void>(resolve => { started = resolve; });
  const feature = createLab24Router(async (_input, signal) => { started(); await new Promise<never>((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('stopped')), { once: true });
  }); throw new Error('unreachable'); });
  const app = express(); app.use('/api/c24', feature.router);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/c24/run`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'same-owner' };
  const body = JSON.stringify({ mode: 'scripted', harness: 'manual-messages', scenario: 'reserve', callLimit: 2 });
  try {
    const first = fetch(url, { method: 'POST', headers, body }); await running;
    const second = await fetch(url, { method: 'POST', headers, body }); assert.equal(second.status, 429);
    await feature.close(); assert.equal((await first).status, 504);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
