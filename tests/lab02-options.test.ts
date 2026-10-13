import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lab02RequestSchema, formatCents } from '../shared/lab02-options.js';
import type { Lab02Request } from '../shared/lab02-options.js';
import type { Lab01Frame } from '../shared/lab01-events.js';
import { createFixtureLab02Port, createLiveLab02Port, sessionOptions } from '../server/lib/lab02-port.js';
import { runLab02 } from '../server/lib/lab02-run.js';
import { createLab02Router } from '../server/concepts/02-options.js';

const input: Lab02Request = { mode: 'scripted', prompt: 'Explain sessions briefly.', scenario: 'normal',
  model: 'claude-sonnet-5-5', system: { choice: 'inherit' }, budgetCents: 50, previews: true, deadlineSeconds: 1 };
const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only', MANAGED_AGENT_ID: 'agent_test',
  MANAGED_ENVIRONMENT_ID: 'env_test', MANAGED_AGENT_VERSION: '3' };
async function collect(request = input) {
  const port = createFixtureLab02Port(request, 0); const frames: Lab01Frame[] = [];
  const result = await runLab02(request, port, new AbortController().signal, (frame) => frames.push(frame), 10);
  return { result, port, frames };
}
const invalid = [ ...['maxTurns', 'maxBudgetUsd', 'includePartialMessages', 'unknown'].map((key) => ({ ...input, [key]: true })),
  { ...input, model: 'unknown' }, { ...input, system: { choice: 'unknown' } },
  { ...input, system: { choice: 'inherit', text: 'extra' } }, { ...input, system: { choice: 'clear', text: 'extra' } },
  { ...input, system: { choice: 'override', text: '' } }, { ...input, system: { choice: 'override', text: 'a'.repeat(4001) } },
  ...[0, 501, 1.5, '50', -1].map((budgetCents) => ({ ...input, budgetCents })),
  ...[0, 121, 1.5].map((deadlineSeconds) => ({ ...input, deadlineSeconds })),
  { ...input, previews: 'true' }, { ...input, mode: 'live', scenario: 'deadline' } ];

test('strict schema and SDK parameter builder reject invalid settings; cents and version policy are exact', () => {
  for (const value of invalid) {
    assert.equal(lab02RequestSchema.safeParse(value).success, false);
    assert.throws(() => sessionOptions(value as Lab02Request, env));
  }
  assert.throws(() => sessionOptions(input, { ...env, MANAGED_DEADLINE_MS: '500' }));
  assert.throws(() => sessionOptions(input, { ...env, MANAGED_AGENT_VERSION: 'NaN' }));
  assert.deepEqual(sessionOptions(input, env).budget, { type: 'limit', max_list_cost: { amount: '50', currency: 'USD' } });
  const params = sessionOptions(input, env);
  assert.deepEqual(params.agent, { type: 'agent_with_overrides', id: 'agent_test', version: 3,
    model: { id: input.model }, tools: [], mcp_servers: [], skills: [] });
  assert.equal(formatCents('50'), '50 US cents ($0.50)'); assert.equal(formatCents(1), '1 US cents ($0.01)');
  assert.equal('version' in (sessionOptions(input, { ...env, MANAGED_AGENT_VERSION: undefined }).agent as object), false);
});

test('preview comparison preserves authoritative text, fresh session IDs and no invented usage', async () => {
  const on = await collect(); const off = await collect({ ...input, previews: false });
  assert.deepEqual(on.result.messages, off.result.messages); assert.equal(on.result.messages.length, 1);
  assert.notEqual(on.result.sessionId, off.result.sessionId);
  assert.equal(on.result.previews[0]?.state, 'replaced'); assert.deepEqual(off.result.previews, []);
  assert.equal(on.frames.some((f) => f.kind === 'preview'), true); assert.equal(off.frames.some((f) => f.kind === 'preview'), false);
  assert.equal(on.result.reportedUsage, null); assert.equal(off.result.reportedUsage, null);
  assert.deepEqual(on.port.calls.slice(0, 3), ['create', 'open', 'send']);
  assert.equal(on.result.outcome.stopReason, 'end_turn');
  const repeat = await collect({ ...input, scenario: 'repeated-events' });
  assert.equal(repeat.result.messages[0]?.text, 'Same Same '); assert.equal(repeat.result.duplicatesIgnored, 2);
});

test('fixture outcomes distinguish budget pause, requires_action, terminal error, EOF and local deadline', async () => {
  for (const [scenario, kind, reason] of [ ['budget-reached', 'paused', 'budget_reached'],
    ['requires-action', 'paused', 'requires_action'], ['session-error', 'error', 'unknown_error'],
    ['stream-ended', 'incomplete', null], ['deadline', 'deadline', null] ] as const) {
    const { result, port } = await collect({ ...input, scenario });
    assert.deepEqual([result.outcome.kind, result.outcome.stopReason], [kind, reason]);
    assert.equal(result.reportedUsage, null);
    assert.equal(port.calls.includes('interrupt'), kind !== 'paused');
    assert.equal(result.interruption, kind === 'paused' ? 'not-needed' : 'simulated');
  }
});

test('cancel cleanup is independent, precedes upstream closure and reports unconfirmed remote stop', async () => {
  const controller = new AbortController(); const order: string[] = [];
  const base = createFixtureLab02Port({ ...input, scenario: 'cancel' }, 0);
  const port = { ...base, source: 'managed-api' as const,
    async open(id: string, upstream: AbortSignal) { upstream.addEventListener('abort', () => order.push('close')); return base.open(id, upstream); },
    async interrupt() { assert.equal(controller.signal.aborted, true); order.push('interrupt'); throw new Error('fixture cleanup failure'); },
    async status() { throw new Error('unknown'); }, closeStream() { order.push('finally-close'); } };
  const result = await runLab02({ ...input, scenario: 'cancel' }, port, controller.signal,
    (frame) => { if (frame.kind === 'preview') controller.abort(); }, 10);
  assert.equal(result.outcome.kind, 'cancelled'); assert.equal(result.interruption, 'unconfirmed');
  assert.equal(result.cleanup, 'pending'); assert.match(result.message, /does not stop remote work/);
  assert.deepEqual(order, ['interrupt', 'close', 'finally-close']);
});

type Call = { method: string; path: string; search: string; body: any };
function mockSdk(log: Call[], configuration: { multiagent?: boolean; reject?: boolean } = {}) {
  const baseAgent = { id: 'agent_test', version: 3, type: 'agent', name: 'Fixture', model: { id: 'base-model' },
    system: 'Base system.', tools: [], mcp_servers: [], skills: [], multiagent: configuration.multiagent ? { type: 'coordinator', agents: [] } : null };
  let agent = structuredClone(baseAgent);
  const sdk = new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    const location = new URL(String(url)); const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    log.push({ method: init?.method ?? 'GET', path: location.pathname, search: location.search, body });
    if (location.pathname.startsWith('/v1/agents/')) return Response.json(baseAgent);
    if (init?.method === 'POST' && location.pathname === '/v1/sessions') {
      if (configuration.reject) return Response.json({ type: 'error', error: { type: 'invalid_request_error', message: 'secret-provider-detail' } }, { status: 400 });
      agent = { ...baseAgent, model: body.agent.model, system: 'system' in body.agent ? body.agent.system : baseAgent.system };
    }
    if (location.pathname.endsWith('/events/stream')) {
      const at = '2026-01-01T00:00:00Z';
      const span = { type: 'span.model_request_end', id: 'span1', processed_at: at, model_request_start_id: 'start1', is_error: false,
        model_usage: { input_tokens: 7, output_tokens: 3, cache_creation_input_tokens: 2, cache_read_input_tokens: 1 } };
      const events = [ ...(location.search ? [{ type: 'event_start', event: { type: 'agent.message', id: 'm1' } },
        { type: 'event_delta', event_id: 'm1', delta: { type: 'content_delta', index: 0, content: { type: 'text', text: 'Hello' } } }] : []),
        { type: 'agent.message', id: 'm1', processed_at: at, content: [{ type: 'text', text: 'Hello' }] }, span, span,
        { type: 'session.status_idle', id: 'idle1', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } } ];
      return new Response(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
    }
    return Response.json({ id: 'sesn_test', type: 'session', status: 'idle', environment_id: 'env_test', agent,
      budget: { type: 'limit', max_list_cost: { amount: '50', currency: 'USD' } } });
  } });
  return { sdk, baseAgent };
}

test('real installed SDK verifies overrides, shared agent unchanged, stream ordering, opt-in and scoped usage', async () => {
  for (const choice of ['inherit', 'override', 'clear'] as const) for (const previews of [true, false]) {
    const request = { ...input, mode: 'live' as const, previews, system: choice === 'override' ? { choice, text: 'New system.' } : { choice } };
    const log: Call[] = []; const { sdk, baseAgent } = mockSdk(log); const before = structuredClone(baseAgent);
    const result = await runLab02(request, createLiveLab02Port(request, sdk, env), new AbortController().signal, () => {}, 10);
    assert.equal(result.outcome.kind, 'completed'); assert.deepEqual(baseAgent, before);
    assert.equal(log.some((c) => c.path.startsWith('/v1/agents') && c.method !== 'GET'), false);
    const create = log.find((c) => c.path === '/v1/sessions')!.body;
    assert.equal(create.agent.type, 'agent_with_overrides'); assert.equal(create.agent.id, 'agent_test'); assert.equal(create.agent.version, 3);
    if (choice === 'inherit') assert.equal('system' in create.agent, false);
    else assert.equal(create.agent.system, choice === 'clear' ? null : 'New system.');
    assert.equal(result.effective?.system, choice === 'inherit' ? 'Base system.' : choice === 'clear' ? null : 'New system.');
    const streamIndex = log.findIndex((c) => c.path.endsWith('/events/stream'));
    const sendIndex = log.findIndex((c) => c.body?.events?.[0]?.type === 'user.message');
    assert(streamIndex >= 0 && streamIndex < sendIndex);
    assert.equal(log[streamIndex]!.search.includes('event_deltas'), previews);
    assert.deepEqual(result.messages, [{ eventId: 'm1', text: 'Hello' }]);
    assert.deepEqual(result.reportedUsage, { scope: 'model-request spans from this stream', requests: 1,
      inputTokens: 7, outputTokens: 3, cacheCreationTokens: 2, cacheReadTokens: 1 });
    assert.equal(result.cleanup, 'archived');
  }
});

test('multiagent base is rejected before session creation and model access rejection is clear', async () => {
  for (const configuration of [{ multiagent: true }, { reject: true }]) {
    const request = { ...input, mode: 'live' as const }; const log: Call[] = [];
    const { sdk } = mockSdk(log, configuration);
    const result = await runLab02(request, createLiveLab02Port(request, sdk, env), new AbortController().signal, () => {}, 10);
    assert.equal(result.outcome.kind, 'error'); assert.equal(log.some((c) => c.path.endsWith('/events')), false);
    if (configuration.multiagent) assert.equal(log.some((c) => c.path === '/v1/sessions'), false);
    else { assert.match(result.message, /Provider rejected.*HTTP 400/); assert.doesNotMatch(result.message, /secret-provider-detail/); }
  }
});

test('router rejects all invalid input before provider factory; cancellation releases capacity', async () => {
  let calls = 0; let interrupts = 0;
  const router = createLab02Router((request) => { calls++; const fixture = createFixtureLab02Port({ ...request, mode: 'scripted', scenario: 'cancel' }, 0);
    return { ...fixture, async interrupt() { interrupts++; await fixture.interrupt('fixture'); } }; }, 0);
  const app = express(); app.use('/api/c2', router.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/c2/query`;
  try {
    for (const value of invalid) {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...value, mode: 'live' }) });
      // A live normal request is used except for the explicit invalid live scenario.
      assert.equal(response.status, 400);
    }
    assert.equal(calls, 0);
    const controllers = [new AbortController(), new AbortController()];
    for (const controller of controllers) await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, mode: 'live' }), signal: controller.signal });
    const full = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    assert.equal(full.status, 429);
    controllers.forEach((c) => c.abort());
    for (let i = 0; i < 40 && interrupts < 2; i++) await delay(25);
    assert.equal(interrupts, 2);
    await delay(50);
    const next = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    assert.equal(next.status, 200); assert.match(await next.text(), /"kind":"completed"/);
  } finally { await router.close(); server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
});
