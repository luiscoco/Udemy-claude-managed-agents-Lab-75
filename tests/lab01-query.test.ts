import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createLab01Router } from '../server/concepts/01-query.js';
import { runLab01 } from '../server/lib/lab01-run.js';
import { createFixturePort, createLiveLab01Port, fixtureSession } from '../server/lib/lab01-port.js';
import type { Lab01Port } from '../server/lib/lab01-port.js';
import { fixtureAnswer } from '../server/lib/lab01-fixtures.js';
import { lab01RequestSchema, lab01ResultSchema, lab01Scenarios } from '../shared/lab01-events.js';
import type { Lab01Frame, Lab01Request } from '../shared/lab01-events.js';

async function collect(scenario: Lab01Request['scenario'], options: { deadlineMs?: number; signal?: AbortSignal; port?: Lab01Port; onFrame?: (frame: Lab01Frame) => void } = {}) {
  const port = options.port ?? createFixturePort(scenario, 0);
  const frames: Lab01Frame[] = [];
  const result = await runLab01({ mode: 'scripted', prompt: 'three bullets', port, signal: options.signal ?? new AbortController().signal,
    deadlineMs: options.deadlineMs ?? 2_000, cleanupWaitMs: 50, emit: (frame) => { frames.push(frame); options.onFrame?.(frame); } });
  return { frames, result, port: port as ReturnType<typeof createFixturePort> };
}
const label = (frame: Lab01Frame) => frame.kind === 'lifecycle' || frame.kind === 'span' ? `${frame.kind}:${frame.type}`
  : frame.kind === 'duplicate' ? `duplicate:${frame.eventType}` : frame.kind === 'other' ? `other:${frame.type}` : frame.kind;

test('normal fixture: exact order, preview replaced once, completed by end_turn', async () => {
  const { frames, result, port } = await collect('normal');
  assert.deepEqual(frames.map(label), ['session', 'notice', 'notice', 'lifecycle:session.status_running', 'span:span.model_request_start',
    'preview', 'preview', 'preview', 'preview', 'message', 'span:span.model_request_end', 'lifecycle:session.status_idle']);
  assert.deepEqual(frames.map((frame) => frame.seq), frames.map((_, index) => index + 1));
  const previews = frames.filter((frame) => frame.kind === 'preview');
  assert.equal(previews.at(-1)?.text, fixtureAnswer, 'accumulated preview equals the final text');
  const messages = frames.filter((frame) => frame.kind === 'message');
  assert.equal(messages.length, 1); assert.equal(messages[0]?.replacedPreview, true);
  assert.deepEqual(result.messages, [{ eventId: 'sevt_msg_1', text: fixtureAnswer }]);
  assert.equal(result.outcome.kind, 'completed'); assert.equal(result.outcome.stopReason, 'end_turn');
  assert.equal(result.source, 'authored-fixture'); assert.equal(result.session?.id, fixtureSession.id);
  assert.deepEqual(port.calls.slice(0, 3), ['create', 'open', 'send']);
  lab01ResultSchema.parse(result);
  // No synthetic provider "result" frame and no text appended after the turn ended.
  assert.equal(frames.some((frame) => frame.kind === 'message' && frame.seq > (frames.find((f) => f.kind === 'lifecycle' && f.type === 'session.status_idle')?.seq ?? 0)), false);
});

test('repeated persisted events are deduplicated; repeated deltas are all applied; orphan preview is incomplete', async () => {
  const { frames, result } = await collect('repeated-events');
  assert.equal(result.duplicatesIgnored, 2);
  assert.deepEqual(frames.filter((frame) => frame.kind === 'duplicate').map(label), ['duplicate:session.status_running', 'duplicate:agent.message']);
  assert.deepEqual(result.messages, [{ eventId: 'sevt_msg_1', text: 'Same Same ' }]);
  const first = frames.filter((frame) => frame.kind === 'preview' && frame.eventId === 'sevt_msg_1').map((frame) => frame.kind === 'preview' ? frame.text : '');
  assert.deepEqual(first, ['', 'Same ', 'Same Same ', 'Same Same '], 'a repeated start must not reset accumulated text');
  assert.deepEqual(result.previews.map((p) => [p.eventId, p.state]).sort(), [['sevt_msg_1', 'replaced'], ['sevt_msg_2', 'incomplete']]);
  assert.equal(result.outcome.kind, 'completed');
});

test('terminal outcomes come from stop_reason, session.error or stream end', async () => {
  const expected: Record<string, [string, string | null]> = {
    'session-error': ['error', 'unknown_error'], 'stream-ended': ['incomplete', null],
    'requires-action': ['paused', 'requires_action'], 'budget-reached': ['paused', 'budget_reached'] };
  for (const [scenario, [kind, reason]] of Object.entries(expected)) {
    const { result } = await collect(scenario as Lab01Request['scenario']);
    assert.deepEqual([result.outcome.kind, result.outcome.stopReason], [kind, reason], scenario);
    assert.equal(result.interruption, kind === 'paused' ? 'not-needed' : 'simulated', scenario);
  }
  const ended = await collect('stream-ended');
  assert.deepEqual(ended.result.previews, [{ eventId: 'sevt_msg_1', text: '- A session is one running agent instance.\n', state: 'incomplete' }]);
  assert.equal(ended.result.messages.length, 0);
  const error = await collect('session-error');
  assert.equal(error.result.previews[0]?.state, 'incomplete');
});

test('cancellation interrupts before the stream closes and is never reported as completed', async () => {
  const controller = new AbortController();
  const order: string[] = [];
  const base = createFixturePort('cancel', 0);
  const port: Lab01Port = { ...base, source: 'managed-api',
    async open(id, signal) { signal.addEventListener('abort', () => order.push('stream-closed')); return base.open(id, signal); },
    async interrupt() { order.push('interrupt'); },
    async status() { return 'idle'; }, async archive() { order.push('archive'); } };
  const { result } = await collect('cancel', { port, signal: controller.signal,
    onFrame: (frame) => { if (frame.kind === 'preview') controller.abort('user'); } });
  assert.equal(result.outcome.kind, 'cancelled');
  assert.deepEqual(order, ['interrupt', 'stream-closed', 'archive']);
  assert.equal(result.interruption, 'confirmed'); assert.equal(result.cleanup, 'archived');
});

test('deadline expiry interrupts and reports deadline; unconfirmed interruption is stated plainly', async () => {
  const fixture = await collect('deadline', { deadlineMs: 30 });
  assert.equal(fixture.result.outcome.kind, 'deadline');
  assert.equal(fixture.result.interruption, 'simulated'); assert(fixture.port.calls.includes('interrupt'));
  const base = createFixturePort('deadline', 0);
  const stuck: Lab01Port = { ...base, source: 'managed-api', async interrupt() { throw new Error('private upstream detail'); }, async status() { return 'running'; } };
  const { result } = await collect('deadline', { port: stuck, deadlineMs: 30 });
  assert.equal(result.outcome.kind, 'deadline'); assert.equal(result.interruption, 'unconfirmed'); assert.equal(result.cleanup, 'pending');
  assert.match(result.message, /unconfirmed/i); assert.match(result.message, /does not stop remote work/);
  assert.doesNotMatch(JSON.stringify(result), /private upstream/);
});

test('end_turn that races a local cancellation is not reported as completed', async () => {
  const controller = new AbortController();
  const { result } = await collect('normal', { signal: controller.signal,
    onFrame: (frame) => { if (frame.kind === 'lifecycle' && frame.type === 'session.status_idle') controller.abort('user'); } });
  assert.equal(result.outcome.kind, 'cancelled');
});

test('empty prompt is rejected by the contract and by the runner before any provider call', async () => {
  for (const prompt of ['', '   ']) assert.equal(lab01RequestSchema.safeParse({ mode: 'scripted', prompt }).success, false);
  assert.equal(lab01RequestSchema.safeParse({ mode: 'live', prompt: 'x', scenario: 'cancel' }).success, false);
  assert.equal(lab01RequestSchema.safeParse({ mode: 'scripted', prompt: 'x', extra: 1 }).success, false);
  const port = createFixturePort('normal', 0);
  const result = await runLab01({ mode: 'scripted', prompt: ' ', port, signal: new AbortController().signal, deadlineMs: 1000, emit: () => {} });
  assert.deepEqual(port.calls, []); assert.equal(result.outcome.kind, 'error'); assert.equal(result.sessionId, null);
  assert.equal(result.interruption, 'not-needed');
});

async function withRouter(live: () => Lab01Port, action: (url: string) => Promise<void>) {
  const lab = createLab01Router(live, 0);
  const app = express(); app.use('/api/c1', lab.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string');
  try { await action(`http://127.0.0.1:${address.port}/api/c1/query`); }
  finally { await lab.close(); server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
}
const post = (url: string, body: unknown, signal?: AbortSignal) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body), ...(signal ? { signal } : {}) });

test('router validates before provider access and streams a result for every offline scenario', async () => {
  let factoryCalls = 0;
  await withRouter(() => { factoryCalls++; throw new Error('not configured'); }, async (url) => {
    assert.equal((await post(url, { mode: 'scripted', prompt: '' })).status, 400);
    assert.equal((await post(url, { mode: 'live', prompt: '   ' })).status, 400);
    assert.equal((await post(url, { mode: 'scripted', prompt: 'hi', agentId: 'agent_x' })).status, 400);
    assert.equal(factoryCalls, 0);
    assert.equal((await post(url, { mode: 'live', prompt: 'hi' })).status, 422); assert.equal(factoryCalls, 1);
    assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: '{}' })).status, 403);
    for (const scenario of lab01Scenarios.filter((name) => name !== 'cancel')) {
      const text = await (await post(url, { mode: 'scripted', prompt: 'hi', scenario })).text();
      assert.match(text, /event: result/, scenario);
    }
  });
});

test('client cancellation releases the concurrency slot after attempting interruption', async () => {
  const previous = process.env.MANAGED_MAX_CONCURRENT; process.env.MANAGED_MAX_CONCURRENT = '1';
  try {
    await withRouter(() => { throw new Error('live is not used'); }, async (url) => {
      const controller = new AbortController();
      const first = await post(url, { mode: 'scripted', prompt: 'hi', scenario: 'cancel' }, controller.signal);
      assert.equal(first.status, 200);
      assert.equal((await post(url, { mode: 'scripted', prompt: 'hi' })).status, 429);
      controller.abort();
      let status = 429;
      for (let attempt = 0; attempt < 100 && status === 429; attempt++) {
        await delay(20); const next = await post(url, { mode: 'scripted', prompt: 'hi' }); status = next.status; await next.text();
      }
      assert.equal(status, 200);
    });
  } finally { if (previous === undefined) delete process.env.MANAGED_MAX_CONCURRENT; else process.env.MANAGED_MAX_CONCURRENT = previous; }
});

function sdkClient(options: { tools?: unknown[]; log: { method: string; path: string; search: string; body: unknown; beta: string | null }[] }) {
  return new Anthropic({ apiKey: 'test-only', maxRetries: 0, fetch: async (input, init) => {
    const request = new Request(input, init); const url = new URL(request.url);
    const text = await request.text();
    options.log.push({ method: request.method, path: url.pathname, search: url.search, body: text ? JSON.parse(text) : null, beta: request.headers.get('anthropic-beta') });
    if (url.pathname.endsWith('/events/stream')) {
      const events = [
        { type: 'session.status_running', id: 'e1', processed_at: 'x' },
        { type: 'event_start', event: { type: 'agent.message', id: 'm1' } },
        { type: 'event_delta', event_id: 'm1', delta: { type: 'content_delta', index: 0, content: { type: 'text', text: 'Hel' } } },
        { type: 'event_delta', event_id: 'm1', delta: { type: 'content_delta', index: 0, content: { type: 'text', text: 'lo' } } },
        { type: 'agent.message', id: 'm1', processed_at: 'x', content: [{ type: 'text', text: 'Hello' }] },
        { type: 'session.status_idle', id: 'e2', processed_at: 'x', stop_details: null, stop_reason: { type: 'end_turn' } },
      ];
      return new Response(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
    }
    return Response.json({ id: 'sesn_sdk', type: 'session', status: 'idle', environment_id: 'env_test',
      agent: { id: 'agent_test', version: 3, tools: options.tools ?? [], mcp_servers: [] },
      budget: { type: 'limit', max_list_cost: { amount: '50', currency: 'USD' } }, usage: {} });
  } });
}
const liveEnv = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test', MANAGED_BUDGET_CENTS: '50' };

test('live adapter through the real SDK: stream is established before user.message, beta header and deltas are sent', async () => {
  const log: Parameters<typeof sdkClient>[0]['log'] = [];
  const port = createLiveLab01Port(sdkClient({ log }), liveEnv);
  const frames: Lab01Frame[] = [];
  const result = await runLab01({ mode: 'live', prompt: 'three bullets', port, signal: new AbortController().signal,
    deadlineMs: 5000, cleanupWaitMs: 50, emit: (frame) => frames.push(frame) });
  assert.deepEqual(log.map((entry) => `${entry.method} ${entry.path}`), ['POST /v1/sessions', 'GET /v1/sessions/sesn_sdk/events/stream',
    'POST /v1/sessions/sesn_sdk/events', 'GET /v1/sessions/sesn_sdk', 'POST /v1/sessions/sesn_sdk/archive']);
  assert(log.every((entry) => entry.beta?.includes('managed-agents-2026-04-01')));
  assert.match(decodeURIComponent(log[1]!.search), /event_deltas\[\]=agent\.message/);
  assert.deepEqual(log[2]!.body, { events: [{ type: 'user.message', content: [{ type: 'text', text: 'three bullets' }] }] });
  assert.deepEqual((log[0]!.body as { budget: unknown }).budget, { type: 'limit', max_list_cost: { amount: '50', currency: 'USD' } });
  assert.deepEqual(result.messages, [{ eventId: 'm1', text: 'Hello' }]);
  assert.equal(result.outcome.kind, 'completed'); assert.equal(result.source, 'managed-api');
  assert.equal(result.session?.agentVersion, 3); assert.equal(result.session?.budget, '50 US cents ($0.50)');
  assert.equal(result.cleanup, 'archived'); assert.equal(result.interruption, 'not-needed');
  assert.equal(frames.filter((frame) => frame.kind === 'message').length, 1);
});

test('live adapter refuses to send a prompt to an agent with tools', async () => {
  const log: Parameters<typeof sdkClient>[0]['log'] = [];
  const port = createLiveLab01Port(sdkClient({ log, tools: [{ type: 'agent_toolset_20260401' }] }), liveEnv);
  const result = await runLab01({ mode: 'live', prompt: 'hi', port, signal: new AbortController().signal, deadlineMs: 5000, cleanupWaitMs: 50, emit: () => {} });
  assert.equal(result.outcome.kind, 'error'); assert.match(result.outcome.detail, /text-only agent/);
  assert.equal(log.some((entry) => entry.path.endsWith('/events')), false, 'no user.message or interrupt was sent');
});
