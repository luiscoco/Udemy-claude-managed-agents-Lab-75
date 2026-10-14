import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lab14RequestSchema } from '../shared/lab14-models.js';
import { createLab14Port, lab14Catalog } from '../server/lib/lab14-port.js';
import { createLab14Manager } from '../server/lib/lab14-run.js';
import { createLab14Router } from '../server/concepts/14-thinking-effort-models.js';
import type { StreamEvent } from '../server/lib/session-events.js';
import { createFixturePort } from '../server/lib/lab01-port.js';

const input = lab14RequestSchema.parse({ mode: 'scripted', prompt: 'Three notebook sync steps.', configuration: { model: 'claude-sonnet-5-5', effort: 'high', budgetCents: 25 }, deadlineSeconds: 2 });
const fallback = { model: 'claude-opus-5-5' as const, effort: 'high' as const, budgetCents: 30 };
const signal = new AbortController().signal;
const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'offline-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test', CLAUDE_MANAGED_LAB14_MODELS: 'claude-sonnet-5-5,claude-opus-5-5' };

test('closed configuration rejects incompatible effort, unknown models and Agent SDK controls', () => {
  for (const patch of [{ configuration: { ...input.configuration, model: 'claude-sonnet-4-6', effort: 'xhigh' } }, { configuration: { ...input.configuration, effort: 'adaptive' } },
    { configuration: { ...input.configuration, model: 'invented' } }, { thinking: { budget_tokens: 123 } }, { fallbackModel: 'other' }, { supportedModels: [] }, { mode: 'live', scenario: 'uncertain' }, { fallback: input.configuration }]) {
    assert.equal(lab14RequestSchema.safeParse({ ...input, ...patch }).success, false);
  }
  const catalog = lab14Catalog(env); assert.equal(catalog.providerVerified, false); assert.equal(catalog.models[0]?.accountReady, true);
  assert.equal(lab14Catalog({}).models.every(model => !model.accountReady), true);
});

test('fresh effort comparisons preserve requested prompt and report no fixture measurements', async () => {
  const manager = createLab14Manager(); const ids = new Set<string>();
  try { for (const effort of ['low', 'medium', 'high'] as const) {
    const prepared = manager.prepare('alice', { ...input, configuration: { ...input.configuration, effort } });
    assert.equal(prepared.state, 'prepared'); assert.equal(prepared.attempts.length, 0);
    const result = await manager.send(prepared.runId, 'alice', input.prompt, signal, () => {}); const attempt = result.attempts[0]!;
    assert.equal(result.prompt, input.prompt); assert.equal(attempt.resolved?.effort, effort); assert.equal(attempt.result.outcome.kind, 'completed');
    assert.equal(attempt.reportedUsage, null); assert.equal(attempt.elapsedMs, null); ids.add(attempt.result.sessionId!);
    await assert.rejects(manager.send(prepared.runId, 'alice', input.prompt, signal, () => {}), /fresh session/);
    await manager.end(prepared.runId, 'alice');
  } assert.equal(ids.size, 3); } finally { await manager.close(); }
});

test('fallback is separately budgeted and only follows a reconciled failed attempt', async () => {
  const manager = createLab14Manager();
  try { const prepared = manager.prepare('alice', { ...input, scenario: 'primary-unavailable', fallback });
    const report = await manager.send(prepared.runId, 'alice', input.prompt, signal, () => {});
    assert.equal(report.attempts.length, 2); assert.equal(report.attempts[0]?.creation, 'rejected'); assert.equal(report.attempts[0]?.result.sessionId, null);
    assert.equal(report.attempts[1]?.requested.budgetCents, 30); assert.equal(report.attempts[1]?.result.outcome.kind, 'completed'); assert.match(report.fallbackDecision, /separately/);
    await manager.end(prepared.runId, 'alice');
    const normal = manager.prepare('alice', { ...input, fallback }); const completed = await manager.send(normal.runId, 'alice', input.prompt, signal, () => {}); assert.equal(completed.attempts.length, 1);
  } finally { await manager.close(); }
});

test('a failed created session is archived before fallback creates a distinct session', async () => {
  const order: string[] = [];
  const manager = createLab14Manager(q => {
    const port = createLab14Port(q); const create = port.create, archive = port.archive;
    port.create = async () => { order.push(`create:${q.configuration.model}`); return create(); };
    port.archive = async id => { await archive(id); order.push(`archive:${q.configuration.model}`); };
    if (q.configuration.model === input.configuration.model) port.open = (id, upstream) => createFixturePort('session-error', 0).open(id, upstream);
    return port;
  });
  try { const prepared = manager.prepare('alice', { ...input, fallback }); const report = await manager.send(prepared.runId, 'alice', input.prompt, signal, () => {});
    assert.equal(report.attempts.length, 2); assert.notEqual(report.attempts[0]?.result.sessionId, report.attempts[1]?.result.sessionId);
    assert.deepEqual(order, ['create:claude-sonnet-5-5', 'archive:claude-sonnet-5-5', 'create:claude-opus-5-5', 'archive:claude-opus-5-5']);
  } finally { await manager.close(); }
});

test('public output flooding is bounded before result parsing and SSE serialization', async () => {
  const manager = createLab14Manager(q => { const port = createLab14Port(q);
    port.open = async () => (async function* () {
      for (let index = 0; index < 120; index++) yield { type: 'agent.message' as const, id: `message_${index}`, processed_at: '2026-10-14T00:00:00Z', content: [{ type: 'text' as const, text: '\u0001'.repeat(100000) }] };
      yield { type: 'session.status_idle' as const, id: 'idle', processed_at: '2026-10-14T00:00:00Z', stop_details: null, stop_reason: { type: 'end_turn' as const } };
    })(); return port;
  });
  try { const prepared = manager.prepare('alice', input); const report = await manager.send(prepared.runId, 'alice', input.prompt, signal, () => {});
    assert.equal(report.attempts[0]?.result.messages.length, 4); assert.ok(report.attempts[0]!.result.messages.every(message => message.text.length === 4000));
    assert.ok(Buffer.byteLength(JSON.stringify(report)) < 130000); assert.equal(report.attempts[0]?.result.outcome.kind, 'completed');
  } finally { await manager.close(); }
});

test('unknown creation blocks fallback and stays quarantined after close', async () => {
  const manager = createLab14Manager(undefined, { MANAGED_MAX_CONCURRENT: '1' });
  const prepared = manager.prepare('alice', { ...input, scenario: 'uncertain', fallback });
  const report = await manager.send(prepared.runId, 'alice', input.prompt, signal, () => {});
  assert.equal(report.attempts.length, 1); assert.equal(report.state, 'pending'); assert.match(report.fallbackDecision, /blocked/);
  assert.equal((await manager.end(prepared.runId, 'alice')).state, 'pending');
  assert.throws(() => manager.prepare('bob', input), /capacity/);
  await assert.rejects(manager.newConfiguration(prepared.runId, 'alice', input), /Reconcile/); await manager.close();
});

test('snapshot mismatch sends no prompt, and failed archival prevents fallback until idle reconciliation', async () => {
  let sends = 0; const manager = createLab14Manager(q => { const port = createLab14Port(q); port.send = async () => { sends++; }; return port; });
  try { const prepared = manager.prepare('alice', { ...input, scenario: 'mismatch', fallback }); const result = await manager.send(prepared.runId, 'alice', input.prompt, signal, () => {});
    assert.equal(sends, 0); assert.equal(result.attempts.length, 1); assert.equal(result.attempts[0]?.resolved?.matches, false); assert.equal(result.attempts[0]?.result.cleanup, 'simulated');
  } finally { await manager.close(); }
  let archiveAllowed = false;
  const pending = createLab14Manager(q => { const port = createLab14Port(q); const open = port.open;
    port.open = (id, upstream) => createLab14Port({ ...q, scenario: 'normal' }).open(id, upstream);
    void open; port.send = async () => { throw new Error('Authored failed send'); };
    port.archive = async () => { if (!archiveAllowed) throw new Error('Authored archive failure'); }; return port;
  }, process.env, 1);
  try { const prepared = pending.prepare('alice', { ...input, fallback }); const result = await pending.send(prepared.runId, 'alice', input.prompt, signal, () => {});
    assert.equal(result.state, 'pending'); assert.equal(result.attempts.length, 1); archiveAllowed = true; assert.equal((await pending.end(prepared.runId, 'alice')).state, 'closed');
  } finally { await pending.close(); }
});

test('ownership, capacity and new configuration are enforced before a fresh attempt', async () => {
  let creates = 0; const manager = createLab14Manager(q => { const port = createLab14Port(q); const create = port.create; port.create = async () => { creates++; return create(); }; return port; }, { MANAGED_MAX_CONCURRENT: '1' });
  try { const prepared = manager.prepare('alice', input); assert.equal(creates, 0);
    assert.throws(() => manager.prepare('bob', input), /capacity/); await assert.rejects(manager.send(prepared.runId, 'bob', 'Wrong owner', signal, () => {}), /unowned/);
    await assert.rejects(manager.newConfiguration(prepared.runId, 'alice', { ...input, thinking: {} })); assert.equal(manager.inspect(prepared.runId, 'alice').state, 'prepared');
    const next = await manager.newConfiguration(prepared.runId, 'alice', { ...input, configuration: { ...input.configuration, effort: 'low' } });
    assert.notEqual(next.runId, prepared.runId); assert.equal(creates, 0);
    await manager.send(next.runId, 'alice', input.prompt, signal, () => {}); assert.equal(creates, 1);
  } finally { await manager.close(); }
});

test('local cancellation and deadline do not report a hanging turn as completed', async () => {
  const manager = createLab14Manager(); const abort = new AbortController();
  try { const prepared = manager.prepare('alice', { ...input, scenario: 'hang', fallback }); const work = manager.send(prepared.runId, 'alice', input.prompt, abort.signal, () => {});
    await delay(30); abort.abort(); const result = await work; assert.equal(result.attempts.length, 1); assert.equal(result.attempts[0]?.result.outcome.kind, 'cancelled'); await manager.end(prepared.runId, 'alice');
    const timed = manager.prepare('alice', { ...input, scenario: 'hang', deadlineSeconds: 1 }); const result2 = await manager.send(timed.runId, 'alice', input.prompt, signal, () => {}); assert.equal(result2.attempts[0]?.result.outcome.kind, 'deadline');
  } finally { await manager.close(); }
});

test('injected official SDK verifies model object, pins version, ignores stale idle/private thinking and deduplicates usage', async () => {
  const at = '2026-10-14T00:00:00Z'; let resolved: any, budget: any; const bodies: any[] = [];
  const base = { id: 'agent_test', version: 3, model: { id: 'base-model' }, multiagent: null };
  const end: StreamEvent = { type: 'span.model_request_end', id: 'end', processed_at: at, model_request_start_id: 'start', is_error: false,
    model_usage: { input_tokens: 11, output_tokens: 7, cache_creation_input_tokens: 2, cache_read_input_tokens: 5 } };
  const events = [
    { type: 'session.status_idle', id: 'stale', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } },
    { type: 'user.message', id: 'new_user', processed_at: at, content: [{ type: 'text', text: input.prompt }] },
    { type: 'agent.thinking', id: 'private', processed_at: at, content: [{ type: 'thinking', thinking: 'PRIVATE_SENTINEL' }] },
    { type: 'agent.message', id: 'answer', processed_at: at, content: [{ type: 'text', text: 'Public notebook summary.' }] }, end, end,
    { type: 'session.status_idle', id: 'idle', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } },
  ];
  const sdk = new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    const path = new URL(String(url)).pathname, body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    if (path.startsWith('/v1/agents/')) return Response.json(base);
    if (path === '/v1/sessions') { bodies.push(body); budget = body.budget; resolved = { ...base, ...body.agent, model: { ...body.agent.model, effort: { type: body.agent.model.effort } } }; }
    if (path.endsWith('/events/stream')) return new Response(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
    if (body?.events?.[0]?.type === 'user.message') return Response.json({ data: [{ ...body.events[0], id: 'new_user' }] });
    return Response.json({ id: 'sesn_injected', agent: resolved, budget, status: 'idle', environment_id: 'env_test' });
  } });
  const manager = createLab14Manager(q => createLab14Port(q, sdk, env), env); const progress: unknown[] = [];
  try { const prepared = manager.prepare('alice', { ...input, mode: 'live' }); assert.equal(bodies.length, 0);
    const result = await manager.send(prepared.runId, 'alice', input.prompt, signal, frame => progress.push(frame)); const attempt = result.attempts[0]!;
    assert.deepEqual(bodies[0].agent.model, { id: input.configuration.model, effort: 'high' }); assert.equal(bodies[0].agent.version, 3);
    assert.deepEqual(bodies[0].agent.tools, []); assert.equal(attempt.resolved?.matches, true); assert.equal(attempt.result.cleanup, 'archived');
    assert.equal(attempt.reportedUsage?.requests, 1); assert.equal(attempt.reportedUsage?.inputTokens, 11); assert.equal(attempt.reportedUsage?.cacheReadTokens, 5);
    assert.equal(attempt.result.messages[0]?.text, 'Public notebook summary.'); assert.equal(JSON.stringify([result, progress]).includes('PRIVATE_SENTINEL'), false);
    assert.equal(JSON.stringify(progress).includes('stale'), false);
  } finally { await manager.close(); }
});

test('route catalog and local preparation never create sessions; strict input and owners gate sending', async () => {
  let creates = 0; const manager = createLab14Manager(q => { const port = createLab14Port(q); const create = port.create; port.create = async () => { creates++; return create(); }; return port; });
  const lesson = createLab14Router(manager), app = express(); app.use('/api/c14', lesson.router); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('address'); const url = `http://127.0.0.1:${address.port}/api/c14`;
  const post = (path: string, body: unknown, owner = 'alice') => fetch(`${url}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner }, body: JSON.stringify(body) });
  try { assert.equal((await fetch(`${url}/models`)).status, 200); assert.equal(creates, 0);
    assert.equal((await post('run', { ...input, thinking: {} })).status, 400); assert.equal(creates, 0);
    const prepared = await (await post('session', input)).json(); assert.equal(creates, 0);
    assert.equal((await post('send', { runId: prepared.runId, prompt: input.prompt }, 'bob')).status, 409); assert.equal(creates, 0);
    const next = await (await post('new-configuration', { runId: prepared.runId, request: input })).json(); assert.equal(creates, 0);
    const run = await post('send', { runId: next.runId, prompt: input.prompt }); assert.match(await run.text(), /event: result/); assert.equal(creates, 1);
    assert.equal((await post('end', { runId: next.runId })).status, 200);
  } finally { await lesson.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
