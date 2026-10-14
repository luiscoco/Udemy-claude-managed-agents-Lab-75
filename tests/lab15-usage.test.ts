import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { readFile } from 'node:fs/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lab15BudgetSchema, lab15RequestSchema } from '../shared/lab15-usage.js';
import { createLab15Ledger, lab15Delta, normalizeLab15Usage, parseUsdCents } from '../server/lib/lab15-accounting.js';
import { createFixtureLab15Port, createLiveLab15Port } from '../server/lib/lab15-port.js';
import { Lab15Sessions } from '../server/lib/lab15-sessions.js';
import { createLab15Router } from '../server/concepts/15-cost-usage.js';

const input = lab15RequestSchema.parse({ mode: 'scripted', prompt: 'Notebook summary', deadlineSeconds: 2 });
const signal = new AbortController().signal;
const start = (sessions: Lab15Sessions, patch: object = {}) => sessions.prepare('alice', { ...input, ...patch });
const send = (sessions: Lab15Sessions, id: string, upstream = signal) => sessions.execute(id, 'alice', { type: 'send', prompt: input.prompt }, upstream, () => {});

test('canonical USD cent conversion rejects decimal dollars, wrong currencies, coercion and unsafe integers', () => {
  for (const [amount, expected] of [['0', 0], ['1', 1], ['125', 125], ['9007199254740991', Number.MAX_SAFE_INTEGER]] as const) assert.equal(parseUsdCents({ amount, currency: 'USD' }), expected);
  for (const amount of ['01', '-1', '+2', '1.25', '25.00', ' 50', '1e3', '9007199254740992', '9'.repeat(1000), 125, null]) assert.equal(parseUsdCents({ amount, currency: 'USD' }), null);
  assert.equal(parseUsdCents({ amount: '50', currency: 'EUR' }), null); assert.equal(parseUsdCents(null), null);
});
test('unknown usage stays null; deltas never fabricate zero or negative consumption', () => {
  const before = normalizeLab15Usage({ input_tokens: 10, output_tokens: 5, cache_creation: { ephemeral_5m_input_tokens: 4 }, active_seconds: 2, list_cost: { amount: '50', currency: 'USD' } });
  assert.equal(before.cacheCreationTokens, null); assert.equal(before.cache1hTokens, null);
  const after = normalizeLab15Usage({ input_tokens: 15, output_tokens: 3, active_seconds: 2.5 });
  const change = lab15Delta(before, after); assert.equal(change.delta.inputTokens, 5); assert.equal(change.delta.outputTokens, null); assert.equal(change.delta.listCostCents, null); assert.equal(change.delta.activeSeconds, 0.5);
  assert.match(change.deltaNote, /decreased/); assert.equal(normalizeLab15Usage({ input_tokens: -1, active_seconds: Infinity }).inputTokens, null);
});
test('cumulative snapshots replace, deduplicate and keep retrieval, events and threads separate', () => {
  const ledger = createLab15Ledger(); const event = { type: 'session.usage' as const, id: 'usage_1', processed_at: '2026-10-14T00:00:01Z', usage: { input_tokens: 10 } };
  ledger.event(event, 'sesn_test'); ledger.event(event, 'sesn_test');
  ledger.event({ ...event, id: 'usage_2', processed_at: '2026-10-14T00:00:02Z', usage: { input_tokens: 15 } }, 'sesn_test');
  ledger.event({ ...event, id: 'older', processed_at: '2026-10-14T00:00:00Z', usage: { input_tokens: 1 } }, 'sesn_test');
  ledger.replace({ scope: 'session', identity: 'sesn_test', via: 'retrieval', asOf: '2026-10-14T00:00:03Z', metrics: normalizeLab15Usage({ input_tokens: 20 }), agentName: null });
  ledger.replace({ scope: 'thread', identity: 'sthr_child', via: 'retrieval', asOf: '2026-10-14T00:00:03Z', metrics: normalizeLab15Usage({ input_tokens: 6 }), agentName: 'child' });
  const snapshot = ledger.snapshot(); assert.equal(snapshot.duplicateEvents, 1); assert.equal(snapshot.staleSnapshots, 1); assert.equal(snapshot.readings.length, 3);
  assert.equal(snapshot.readings[0]?.metrics.inputTokens, 15); assert.equal(snapshot.readings[0]?.delta.inputTokens, 5); assert.equal(snapshot.readings[1]?.delta.inputTokens, null);
  ledger.replace({ scope: 'session', identity: 'sesn_test', via: 'retrieval', asOf: '2026-10-14T00:00:04Z', metrics: normalizeLab15Usage({}), agentName: null });
  assert.equal(ledger.snapshot().readings[1]?.metrics.inputTokens, null, 'missing fields replace old values instead of inheriting them');
});
test('repeated usage and spans do not double count; successive turns have comparable cumulative deltas', async () => {
  const sessions = new Lab15Sessions(); const prepared = start(sessions, { scenario: 'repeated-usage' });
  try { let report = await send(sessions, prepared.runId); assert.equal(report.state, 'idle'); assert.equal(report.duplicateEvents, 2);
    assert.equal(report.readings.find(row => row.via === 'session.usage')?.metrics.inputTokens, 10);
    assert.equal(report.readings.find(row => row.scope === 'session' && row.via === 'retrieval')?.metrics.inputTokens, 14);
    assert.equal(report.readings.find(row => row.via === 'model-request-end')?.metrics.cacheCreationTokens, 2);
    report = await send(sessions, prepared.runId); assert.equal(report.duplicateEvents, 4);
    const final = report.readings.find(row => row.scope === 'session' && row.via === 'retrieval')!; assert.equal(final.metrics.inputTokens, 28); assert.equal(final.delta.inputTokens, 14);
    assert.equal(report.turnsUsed, 2); assert.equal(report.messagesUsed, 2);
  } finally { await sessions.close(); }
});
test('child attribution overlaps totals, missing usage stays unknown and reads never raise a budget', async () => {
  const ports: ReturnType<typeof createFixtureLab15Port>[] = []; const sessions = new Lab15Sessions(q => { const port = createFixtureLab15Port(q); ports.push(port); return port; });
  try { const child = start(sessions, { scenario: 'child-activity' }); let report = await send(sessions, child.runId);
    assert.equal(report.readings.filter(row => row.scope === 'thread').length, 2); assert.equal(report.readings.find(row => row.scope === 'session' && row.via === 'retrieval')?.metrics.inputTokens, 14);
    await sessions.usage(child.runId, 'alice'); assert.equal(ports[0]?.calls.includes('raise'), false); await sessions.end(child.runId, 'alice');
    const missing = start(sessions, { scenario: 'missing-usage' }); report = await send(sessions, missing.runId); assert.equal(report.readings.length, 1); assert.equal(report.readings[0]?.metrics.listCostCents, null);
  } finally { await sessions.close(); }
});
test('host message, turn, context and zero-tool limits reject effects before dispatch', async () => {
  let port!: ReturnType<typeof createFixtureLab15Port>; const sessions = new Lab15Sessions(q => (port = createFixtureLab15Port(q)));
  const prepared = start(sessions, { maxTurns: 1 }); assert.equal(port.calls.length, 0);
  try { await send(sessions, prepared.runId); assert.throws(() => send(sessions, prepared.runId), /turn limit/); assert.equal(port.calls.filter(call => call === 'send').length, 1);
    await sessions.context(prepared.runId, 'alice', 'Explicit context'); await assert.rejects(sessions.context(prepared.runId, 'alice', 'Again'), /One context/);
    assert.equal(port.calls.filter(call => call === 'context').length, 1);
  } finally { await sessions.close(); }
  const limited = new Lab15Sessions(); const e = start(limited, { maxMessages: 1 }); try { await send(limited, e.runId); assert.throws(() => send(limited, e.runId), /message limit/); } finally { await limited.close(); }
  const tools = new Lab15Sessions(q => { const p = createFixtureLab15Port(q); p.open = async () => (async function* () {
    yield { type: 'user.message' as const, id: 'user', processed_at: '2026-10-14T00:00:00Z', content: [] };
    yield { type: 'agent.custom_tool_use' as const, id: 'tool', processed_at: '2026-10-14T00:00:00Z', name: 'unexpected', input: {} };
  })(); p.send = async () => 'user'; return p; });
  try { const e = start(tools); const report = await send(tools, e.runId); assert.equal(report.outcome?.kind, 'error'); assert.equal(report.state, 'closed'); assert.equal(report.toolCallsAllowed, 0); } finally { await tools.close(); }
});
test('budget pause retains session; one explicit raise resumes without another user message', async () => {
  let port!: ReturnType<typeof createFixtureLab15Port>; const sessions = new Lab15Sessions(q => (port = createFixtureLab15Port(q))); const prepared = start(sessions, { scenario: 'budget-reached' });
  try { const paused = await send(sessions, prepared.runId); assert.equal(paused.state, 'budget-paused'); assert.equal(paused.outcome?.stopReason, 'budget_reached');
    assert.equal(paused.readings.find(row => row.via === 'retrieval')?.metrics.listCostCents, 53);
    await sessions.usage(prepared.runId, 'alice'); assert.equal(port.calls.includes('raise'), false); assert.throws(() => send(sessions, prepared.runId));
    const resumed = await sessions.execute(prepared.runId, 'alice', { type: 'raise', cents: 100 }, signal, () => {});
    assert.equal(resumed.state, 'idle'); assert.equal(resumed.sessionId, paused.sessionId); assert.equal(resumed.turnsUsed, 2); assert.equal(resumed.messagesUsed, 1); assert.equal(resumed.budgetCents, 100);
    assert.equal(resumed.readings.find(row => row.via === 'retrieval')?.metrics.listCostCents, 57); assert.equal(port.calls.filter(call => call === 'raise').length, 1);
    assert.throws(() => sessions.execute(prepared.runId, 'alice', { type: 'raise', cents: 150 }, signal, () => {}));
  } finally { await sessions.close(); }
});
test('budget creation/update constraints and closed schemas forbid hidden increases, removal or late caps', async () => {
  for (const patch of [{ budgetCents: null }, { budgetCents: 0 }, { budgetCents: 1.5 }, { maxBudgetUsd: 2 }, { total_cost_usd: 1 }, { modelUsage: {} }, { usage: {} }, { maxTurns: 9 }, { mode: 'live', scenario: 'child-activity' }]) assert.equal(lab15RequestSchema.safeParse({ ...input, ...patch }).success, false);
  for (const patch of [{ budgetCents: null, acknowledgeResume: true }, { budgetCents: 100 }, { budgetCents: 100, acknowledgeResume: false }]) assert.equal(lab15BudgetSchema.safeParse({ runId: 'fe0e8ae0-ff09-4fe3-8eab-35255407476e', ...patch }).success, false);
  const installed = await readFile('node_modules/@anthropic-ai/sdk/resources/beta/sessions/sessions.d.ts', 'utf8'); assert.match(installed, /budget_create_only/); assert.match(installed, /removed budget cannot be re-added/);
  let port!: ReturnType<typeof createFixtureLab15Port>; const sessions = new Lab15Sessions(q => { port = createFixtureLab15Port(q); const read = port.read;
    port.read = async id => ({ ...await read(id), usage: {} }); return port; });
  try { const prepared = start(sessions, { scenario: 'budget-reached' }); await send(sessions, prepared.runId);
    const result = await sessions.execute(prepared.runId, 'alice', { type: 'raise', cents: 100 }, signal, () => {}); assert.equal(result.outcome?.kind, 'error'); assert.equal(port.calls.includes('raise'), false);
  } finally { await sessions.close(); }
});
test('ownership/capacity, cancellation, deadlines and uncertain creation retain cleanup boundaries', async () => {
  const sessions = new Lab15Sessions(undefined, { MANAGED_MAX_CONCURRENT: '1' }); const e = start(sessions, { scenario: 'hang', deadlineSeconds: 1 });
  assert.throws(() => sessions.prepare('bob', input), /previous/); assert.throws(() => sessions.execute(e.runId, 'bob', { type: 'send', prompt: 'Wrong owner' }, signal, () => {}), /unowned/);
  const timed = await send(sessions, e.runId); assert.equal(timed.outcome?.kind, 'deadline'); assert.equal(timed.state, 'closed'); await sessions.close();
  const cancelled = new Lab15Sessions(); const c = start(cancelled, { scenario: 'hang' }), abort = new AbortController(); const work = send(cancelled, c.runId, abort.signal); await delay(20); abort.abort();
  assert.equal((await work).outcome?.kind, 'cancelled'); await cancelled.close();
  const unknown = new Lab15Sessions(q => { const p = createFixtureLab15Port(q); p.create = async () => { p.creation = 'uncertain'; throw new Error('Lost response'); }; return p; });
  const u = start(unknown); const result = await send(unknown, u.runId); assert.equal(result.state, 'cleanup-pending'); assert.equal(result.sessionId, null); assert.equal((await unknown.end(u.runId, 'alice')).state, 'cleanup-pending');
  assert.throws(() => start(unknown), /reconcile/); await unknown.close();
});
test('late creation during shutdown archives the returned ID without sending; failed archive blocks reuse', async () => {
  let port!: ReturnType<typeof createFixtureLab15Port>; const sessions = new Lab15Sessions(q => { port = createFixtureLab15Port(q); const create = port.create;
    port.create = async () => { await delay(30); return create(); }; return port; });
  const e = start(sessions), work = send(sessions, e.runId); await sessions.close(); const result = await work;
  assert.ok(result.sessionId); assert.equal(result.state, 'closed'); assert.equal(port.calls.includes('send'), false); assert.equal(port.calls.includes('archive'), true);
  let allowed = false; const pending = new Lab15Sessions(q => { const p = createFixtureLab15Port(q); p.archive = async () => { if (!allowed) throw new Error('Unavailable'); }; return p; });
  const p = start(pending); await send(pending, p.runId); assert.equal((await pending.end(p.runId, 'alice')).state, 'cleanup-pending'); assert.throws(() => start(pending)); allowed = true;
  assert.equal((await pending.end(p.runId, 'alice')).state, 'closed'); await pending.close();
});

test('official SDK injected transport verifies creation, observes real fields, and only explicit update resumes', async () => {
  const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'offline-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test' };
  const base = { id: 'agent_test', version: 3, model: { id: 'claude-sonnet-5-5' }, multiagent: null };
  let resolved: any, budget: any, usage: any = {}, stream: ReadableStreamDefaultController<Uint8Array> | undefined, turns = 0;
  const calls: { path: string; body: any }[] = [];
  function finish(marker: Record<string, unknown>) { const at = new Date().toISOString(), cost = turns === 1 ? 53 : 57;
    usage = { input_tokens: turns * 14, output_tokens: turns * 8, cache_read_input_tokens: 4, cache_creation: { ephemeral_5m_input_tokens: 2, ephemeral_1h_input_tokens: 0 }, active_seconds: 1.5, list_cost: { amount: String(cost), currency: 'USD' } };
    const span = { type: 'span.model_request_end', id: `span_${turns}`, processed_at: at, model_request_start_id: `start_${turns}`, is_error: false, model_usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 4, cache_creation_input_tokens: 2 } };
    const events = [{ type: 'session.status_idle', id: 'stale', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } }, marker,
      { type: 'agent.thinking', id: `private_${turns}`, processed_at: at, content: [{ type: 'thinking', thinking: 'PRIVATE_SENTINEL' }] },
      { type: 'session.usage', id: `usage_${turns}`, processed_at: at, usage, budget }, span, span,
      { type: 'agent.message', id: `answer_${turns}`, processed_at: at, content: [{ type: 'text', text: 'Public result.' }] },
      { type: 'session.status_idle', id: `idle_${turns}`, processed_at: at, stop_details: null, stop_reason: { type: turns === 1 ? 'budget_reached' : 'end_turn' } }];
    stream!.enqueue(new TextEncoder().encode(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''))); stream!.close();
  }
  const sdk = new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    const path = new URL(String(url)).pathname, body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined; calls.push({ path, body });
    if (path.startsWith('/v1/agents/')) return Response.json(base);
    if (path === '/v1/sessions') { budget = body.budget; resolved = { ...base, ...body.agent }; }
    if (path.endsWith('/events/stream')) return new Response(new ReadableStream({ start(controller) { stream = controller; } }), { headers: { 'Content-Type': 'text/event-stream' } });
    if (path.endsWith('/threads')) return Response.json({ data: [{ id: 'sthr_primary', agent: { name: 'primary' }, usage }], has_more: false, next_page: null });
    if (body?.events?.[0]?.type === 'user.message') { turns++; const marker = { ...body.events[0], id: `user_${turns}`, processed_at: new Date().toISOString() }; finish(marker); return Response.json({ data: [marker] }); }
    if (path === '/v1/sessions/sesn_test' && body?.budget) { budget = body.budget; turns++; finish({ type: 'session.updated', id: 'updated', processed_at: new Date().toISOString(), budget }); }
    return Response.json({ id: 'sesn_test', agent: resolved, environment_id: 'env_test', budget, usage, status: 'idle' });
  } });
  const sessions = new Lab15Sessions(q => createLiveLab15Port(q, sdk, env), env); const progress: unknown[] = [];
  try { const prepared = sessions.prepare('alice', { ...input, mode: 'live' }); assert.equal(calls.length, 0);
    const report = await sessions.execute(prepared.runId, 'alice', { type: 'send', prompt: input.prompt }, signal, snapshot => progress.push(snapshot));
    assert.equal(report.state, 'budget-paused'); assert.equal(report.duplicateEvents, 1); assert.equal(report.response.trim(), 'Public result.'); assert.equal(JSON.stringify([report, progress]).includes('PRIVATE_SENTINEL'), false);
    const create = calls.find(call => call.path === '/v1/sessions')!.body; assert.deepEqual(create.budget, { type: 'limit', max_list_cost: { amount: '50', currency: 'USD' } }); assert.equal(create.agent.version, 3); assert.deepEqual(create.agent.tools, []);
    await sessions.usage(prepared.runId, 'alice'); assert.equal(calls.some(call => call.path === '/v1/sessions/sesn_test' && call.body?.budget), false);
    const resumed = await sessions.execute(prepared.runId, 'alice', { type: 'raise', cents: 100 }, signal, () => {}); assert.equal(resumed.state, 'idle'); assert.equal(resumed.budgetCents, 100);
    assert.deepEqual(calls.find(call => call.path === '/v1/sessions/sesn_test' && call.body?.budget)!.body, { budget: { type: 'limit', max_list_cost: { amount: '100', currency: 'USD' } } });
    assert.equal(calls.filter(call => call.body?.events?.[0]?.type === 'user.message').length, 1); assert.equal(resumed.readings.find(row => row.scope === 'session' && row.via === 'retrieval')?.metrics.listCostCents, 57);
  } finally { await sessions.close(); }
});

test('strict HTTP operations reject SDK fields, missing resume acknowledgment and foreign owners before effects', async () => {
  let effects = 0; const sessions = new Lab15Sessions(q => { const p = createFixtureLab15Port(q); const create = p.create; p.create = async () => { effects++; return create(); }; return p; });
  const lesson = createLab15Router(sessions), app = express(); app.use('/api/c15', lesson.router); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); const address = server.address(); if (!address || typeof address === 'string') throw new Error('address');
  const base = `http://127.0.0.1:${address.port}/api/c15`, post = (path: string, body: unknown, owner = 'alice') => fetch(`${base}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner }, body: JSON.stringify(body) });
  try { assert.equal((await post('run', { ...input, maxBudgetUsd: 1 })).status, 400); assert.equal(effects, 0);
    const prepared = await (await post('session', input)).json(); assert.equal(effects, 0);
    assert.equal((await post('send', { runId: prepared.runId, prompt: 'Wrong' }, 'bob')).status, 404); assert.equal(effects, 0);
    assert.equal((await post('budget', { runId: prepared.runId, budgetCents: 100 })).status, 400);
    const stream = await post('send', { runId: prepared.runId, prompt: 'First' }); assert.match(await stream.text(), /event: result/); assert.equal(effects, 1);
    assert.equal((await post('usage', { runId: prepared.runId })).status, 200); assert.equal((await post('context', { runId: prepared.runId, text: 'Context' })).status, 200);
    assert.equal((await post('end', { runId: prepared.runId })).status, 200);
  } finally { await lesson.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
