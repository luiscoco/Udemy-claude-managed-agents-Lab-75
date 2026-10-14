import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { approvalExpiredMessage, lab04DecisionSchema, lab04Prompt, lab04RequestSchema, lab04Toolset } from '../shared/lab04-permissions.js';
import type { Lab04Frame, Lab04Request } from '../shared/lab04-permissions.js';
import { ApprovalAbandoned, ApprovalQueueFull, ApprovalRegistry } from '../server/lib/lab04-approvals.js';
import type { Schedule } from '../server/lib/lab04-approvals.js';
import { createFixtureLab04Port, createLiveLab04Port, lab04SessionParams } from '../server/lib/lab04-port.js';
import { runLab04 } from '../server/lib/lab04-run.js';
import { createLab04Router } from '../server/concepts/04-permissions.js';
import { createSandbox, fixtureFiles } from '../server/lib/lab03-sandbox.js';
import type { Sandbox } from '../server/lib/lab03-sandbox.js';

const base: Lab04Request = { mode: 'scripted', prompt: lab04Prompt, deadlineSeconds: 10, approvalSeconds: 30 };
const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test' };

/** A clock the test advances by hand; expiry fires only when the test says so. */
function manualClock() {
  let time = 0, next = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const schedule: Schedule = (fn, ms) => { const id = ++next; timers.set(id, { at: time + ms, fn }); return () => { timers.delete(id); }; };
  return { now: () => time, schedule, timers, advance(ms: number) {
    time += ms;
    for (const [id, timer] of [...timers]) if (timer.at <= time) { timers.delete(id); timer.fn(); }
  } };
}
async function withSandbox<T>(action: (sandbox: Sandbox) => Promise<T>) {
  const sandbox = await createSandbox();
  try { return await action(sandbox); } finally { await sandbox.dispose(); }
}
const disk = (sandbox: Sandbox, relative: string) => readFile(path.join(sandbox.dir, relative), 'utf8').catch(() => null);
type Reviewer = (frame: Extract<Lab04Frame, { kind: 'review' }>, run: { runId: string; decisionToken: string }, registry: ApprovalRegistry) => void;
async function runFixture(request: Lab04Request, sandbox: Sandbox, reviewer: Reviewer, options: { registry?: ApprovalRegistry; signal?: AbortSignal } = {}) {
  const registry = options.registry ?? new ApprovalRegistry({ schedule: manualClock().schedule });
  const port = createFixtureLab04Port(request, sandbox, 0);
  const run = registry.openRun(); const frames: Lab04Frame[] = [];
  const result = await runLab04(request, port, sandbox, registry, run, options.signal ?? new AbortController().signal,
    (frame) => { frames.push(frame); if (frame.kind === 'review') reviewer(frame, run, registry); }, 10);
  return { result, port, frames, registry, run };
}
const decide = (registry: ApprovalRegistry, run: { runId: string; decisionToken: string }, toolUseId: string, decision: 'allow' | 'deny', denyMessage?: string) =>
  registry.decide({ runId: run.runId, decisionToken: run.decisionToken, toolUseId, decision, ...(denyMessage ? { denyMessage } : {}) });

test('strict schemas reject Agent SDK fields and bad bounds; the toolset and session params are exact', () => {
  for (const value of [ ...['canUseTool', 'allowedTools', 'permissionMode', 'updatedInput', 'behavior', 'unknown'].map((key) => ({ ...base, [key]: true })),
    { ...base, approvalSeconds: 4 }, { ...base, approvalSeconds: 121 }, { ...base, deadlineSeconds: 0 }, { ...base, mode: 'live', scenario: 'preallowed-only' } ])
    assert.equal(lab04RequestSchema.safeParse(value).success, false, JSON.stringify(value).slice(0, 80));
  const decision = { runId: '6f1c7a52-5f1b-4a5a-9c6e-2d1f3a4b5c6d', toolUseId: 'sevt_1', decisionToken: 'a'.repeat(32), decision: 'deny' };
  assert.equal(lab04DecisionSchema.safeParse(decision).success, true);
  for (const value of [{ ...decision, updatedInput: {} }, { ...decision, behavior: 'deny' }, { ...decision, decision: 'allow', denyMessage: 'x' },
    { ...decision, runId: 'not-a-uuid' }, { ...decision, decisionToken: 'short' }, { ...decision, denyMessage: 'x'.repeat(301) }])
    assert.equal(lab04DecisionSchema.safeParse(value).success, false);
  const enabled = Object.fromEntries(lab04Toolset.configs.map((c) => [c.name, c.enabled ? c.permission_policy.type : 'disabled']));
  assert.deepEqual(enabled, { bash: 'disabled', read: 'always_allow', write: 'always_ask', edit: 'always_ask', glob: 'always_allow',
    grep: 'disabled', web_fetch: 'disabled', web_search: 'disabled' });
  const params = lab04SessionParams(base, { 'notes.md': 'file_n', 'draft.md': 'file_d' }, env);
  assert.deepEqual(params.agent, { type: 'agent_with_overrides', id: 'agent_test', tools: [lab04Toolset], mcp_servers: [], skills: [] });
});

test('registry: a decision applies once, races have one winner, and other runs, tokens and replays are rejected', async () => {
  const clock = manualClock();
  const registry = new ApprovalRegistry({ now: clock.now, schedule: clock.schedule });
  const a = registry.openRun(), b = registry.openRun();
  const first = registry.request(a.runId, { toolUseId: 'sevt_1', tool: 'edit', input: {} }, 30_000);
  clock.advance(1200);
  const race = [decide(registry, a, 'sevt_1', 'allow'), decide(registry, a, 'sevt_1', 'deny')];
  assert.deepEqual(race.map((r) => r.status), [200, 409]);
  assert.deepEqual(await first.outcome, { decision: 'allow', decidedBy: 'reviewer', denyMessage: null, latencyMs: 1200 });
  assert.equal(decide(registry, a, 'sevt_1', 'allow').status, 409, 'replay after consumption');
  registry.request(a.runId, { toolUseId: 'sevt_2', tool: 'edit', input: {} }, 30_000);
  assert.equal(registry.decide({ runId: a.runId, decisionToken: b.decisionToken, toolUseId: 'sevt_2', decision: 'allow' }).status, 404, 'other run token');
  assert.equal(registry.decide({ runId: b.runId, decisionToken: a.decisionToken, toolUseId: 'sevt_2', decision: 'allow' }).status, 404, 'other run id');
  assert.equal(decide(registry, b, 'sevt_2', 'allow').status, 404, 'tool use belongs to another run');
  assert.equal(decide(registry, a, 'sevt_9', 'allow').status, 404, 'unknown tool use');
  const denied = decide(registry, a, 'sevt_2', 'deny', 'Use notes.md instead.');
  assert.equal(denied.status, 200); assert.equal(denied.status === 200 && denied.outcome.denyMessage, 'Use notes.md instead.');
  assert.equal(clock.timers.size, 0, 'decided entries clear their expiry timers');
});

test('registry: expiry denies once, host validation keeps the entry pending, release rejects every waiter', async () => {
  const clock = manualClock();
  const registry = new ApprovalRegistry({ now: clock.now, schedule: clock.schedule, maxPerRun: 2 });
  const run = registry.openRun();
  const expiring = registry.request(run.runId, { toolUseId: 'sevt_1', tool: 'write', input: {} }, 5000);
  clock.advance(5000);
  assert.deepEqual(await expiring.outcome, { decision: 'deny', denyMessage: approvalExpiredMessage, decidedBy: 'expiry', latencyMs: 5000 });
  assert.equal(decide(registry, run, 'sevt_1', 'allow').status, 409, 'after expiry');
  const unsafe = registry.request(run.runId, { toolUseId: 'sevt_2', tool: 'write', input: { file_path: '/etc/passwd' } }, 5000);
  const blocked = registry.decide({ runId: run.runId, decisionToken: run.decisionToken, toolUseId: 'sevt_2', decision: 'allow' }, () => 'outside the roots.');
  assert.equal(blocked.status, 422); assert.equal(registry.pendingCount(run.runId), 1, 'still pending after 422');
  registry.request(run.runId, { toolUseId: 'sevt_3', tool: 'edit', input: {} }, 5000);
  assert.throws(() => registry.request(run.runId, { toolUseId: 'sevt_4', tool: 'edit', input: {} }, 5000), ApprovalQueueFull);
  const abandoned = registry.releaseRun(run.runId);
  assert.deepEqual(abandoned.map((a) => a.toolUseId), ['sevt_2', 'sevt_3']);
  await assert.rejects(unsafe.outcome, ApprovalAbandoned);
  assert.equal(registry.pendingCount(), 0); assert.equal(clock.timers.size, 0);
  assert.equal(decide(registry, run, 'sevt_2', 'deny').status, 409, 'after abandonment');
  assert.throws(() => registry.request(run.runId, { toolUseId: 'sevt_5', tool: 'edit', input: {} }, 5000), ApprovalAbandoned);
});

test('approve one edit, deny another: only the approved change reaches disk and each decision is confirmed once', async () => {
  await withSandbox(async (sandbox) => {
    const plan: Record<string, 'allow' | 'deny'> = { sevt_tool_2: 'allow', sevt_tool_3: 'allow', sevt_tool_4: 'deny' };
    const { result, port, frames } = await runFixture(base, sandbox, (frame, run, registry) => {
      if (frame.toolUseId === 'sevt_tool_5') {
        // The second file fails the host's "only draft.md" rule: allow is refused, so the reviewer denies.
        assert.equal(frame.guard.ok, false);
        assert.equal(registry.decide({ runId: run.runId, decisionToken: run.decisionToken, toolUseId: frame.toolUseId, decision: 'allow' },
          ({ tool, input }) => tool === 'write' && input.file_path !== '/mnt/session/outputs/draft.md' ? 'Only draft.md may be changed.' : null).status, 422);
        decide(registry, run, frame.toolUseId, 'deny'); return;
      }
      decide(registry, run, frame.toolUseId, plan[frame.toolUseId]!, plan[frame.toolUseId] === 'deny' ? 'Keep the reviewer line as it is.' : undefined);
    });
    assert.equal(result.outcome.kind, 'completed');
    assert.deepEqual(port.calls.filter((c) => c.startsWith('confirm')),
      ['confirm:sevt_tool_2=allow', 'confirm:sevt_tool_3=allow', 'confirm:sevt_tool_4=deny', 'confirm:sevt_tool_5=deny']);
    assert.equal(frames.some((f) => f.kind === 'review' && f.toolUseId === 'sevt_tool_1'), false, 'the preallowed read never reached the reviewer');
    const draft = await disk(sandbox, 'outputs/draft.md');
    assert.match(draft!, /^Status: reviewed$/m); assert.match(draft!, /Reviewer notes are in notes\.md\./, 'the denied edit changed nothing');
    assert.equal(await disk(sandbox, 'outputs/summary.md'), null);
    assert.equal(await disk(sandbox, 'uploads/draft.md'), fixtureFiles['draft.md']);
    assert.deepEqual(result.decisions.map((d) => [d.toolUseId, d.decision, d.decidedBy, d.confirmationSent]), [
      ['sevt_tool_2', 'allow', 'reviewer', true], ['sevt_tool_3', 'allow', 'reviewer', true],
      ['sevt_tool_4', 'deny', 'reviewer', true], ['sevt_tool_5', 'deny', 'reviewer', true]]);
    assert.deepEqual(result.denials.map((d) => [d.toolUseId, d.by]), [['sevt_tool_4', 'host'], ['sevt_tool_5', 'host']]);
    assert.equal(result.toolUses.find((u) => u.id === 'sevt_tool_4')?.result?.text, 'Keep the reviewer line as it is.');
    assert.ok(result.messages.some((m) => m.text.includes('denied edit with "Keep the reviewer line as it is."')), 'authored acknowledgement');
  });
});

test('an abandoned approval expires: the host denies it and no file changes', async () => {
  await withSandbox(async (sandbox) => {
    const clock = manualClock();
    const registry = new ApprovalRegistry({ now: clock.now, schedule: clock.schedule });
    const { result, port, frames } = await runFixture({ ...base, approvalSeconds: 5 }, sandbox, () => clock.advance(5000), { registry });
    assert.ok(result.decisions.length > 0);
    assert.ok(result.decisions.every((d) => d.decidedBy === 'expiry' && d.decision === 'deny' && d.denyMessage === approvalExpiredMessage));
    assert.ok(result.confirmations.every((c) => c.result === 'deny'));
    assert.equal(frames.filter((f) => f.kind === 'expired').length, result.decisions.length);
    assert.equal(port.calls.filter((c) => c.startsWith('confirm')).length, result.decisions.length, 'one confirmation per expiry');
    assert.equal(await disk(sandbox, 'outputs/draft.md'), null);
    assert.equal(registry.pendingCount(), 0); assert.equal(clock.timers.size, 0);
  });
});

test('cancel and deadline release every waiter, send no confirmation and attempt user.interrupt', async () => {
  for (const kind of ['cancel', 'deadline'] as const) await withSandbox(async (sandbox) => {
    const controller = new AbortController();
    const request = { ...base, deadlineSeconds: kind === 'deadline' ? 1 : 10 };
    const { result, port, registry, run } = await runFixture(request, sandbox, () => { if (kind === 'cancel') controller.abort(); }, { signal: controller.signal });
    assert.equal(result.outcome.kind, kind === 'cancel' ? 'cancelled' : 'deadline');
    assert.equal(result.interruption, 'simulated'); assert.ok(port.calls.includes('interrupt'));
    assert.equal(port.calls.some((c) => c.startsWith('confirm')), false, 'abandoned approvals get no confirmation');
    assert.deepEqual(result.decisions.map((d) => [d.decision, d.decidedBy, d.confirmationSent]), [['abandoned', 'cancellation', false]]);
    assert.equal(registry.pendingCount(), 0);
    assert.equal(decide(registry, run, 'sevt_tool_2', 'allow').status, 409);
    assert.equal(await disk(sandbox, 'outputs/draft.md'), null);
  });
});

test('preallowed calls never reach the reviewer and never get a confirmation', async () => {
  await withSandbox(async (sandbox) => {
    const { result, port, frames } = await runFixture({ ...base, scenario: 'preallowed-only' }, sandbox, () => assert.fail('no review expected'));
    assert.equal(result.outcome.kind, 'completed');
    assert.deepEqual(result.toolUses.map((u) => [u.name, u.evaluatedPermission]), [['read', 'allow'], ['glob', 'allow']]);
    assert.equal(frames.some((f) => f.kind === 'review'), false); assert.deepEqual(result.decisions, []);
    assert.equal(port.calls.some((c) => c.startsWith('confirm')), false);
  });
});

type Call = { method: string; path: string; body: unknown };
function mockSdk(log: Call[]) {
  const at = '2026-01-01T00:00:00Z';
  const agent = { id: 'agent_test', version: 2, type: 'agent', name: 'Fixture', model: { id: 'm' }, system: null, mcp_servers: [], skills: [], multiagent: null,
    tools: [{ ...lab04Toolset, configs: lab04Toolset.configs.map((c) => ({ ...c, type: c.name, permission_policy: 'permission_policy' in c ? c.permission_policy : { type: 'always_allow' } })) }] };
  let uploads = 0;
  return new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    const location = new URL(String(url));
    log.push({ method: init?.method ?? 'GET', path: location.pathname, body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined });
    if (location.pathname.startsWith('/v1/agents/')) return Response.json({ ...agent, tools: [] });
    if (location.pathname === '/v1/files' && init?.method === 'POST')
      return Response.json({ id: `file_up_${++uploads}`, type: 'file', filename: 'x.md', mime_type: 'text/markdown', size_bytes: 10, created_at: at });
    if (location.pathname === '/v1/files') return Response.json({ data: [], has_more: false, first_id: null, last_id: null });
    if (location.pathname.startsWith('/v1/files/') && init?.method === 'DELETE') return Response.json({ id: 'x', type: 'file_deleted' });
    if (location.pathname.endsWith('/events/stream')) {
      const events = [
        { type: 'agent.tool_use', id: 'sevt_read', name: 'read', input: { file_path: '/mnt/session/uploads/notes.md' }, processed_at: at, evaluated_permission: 'allow', evaluation: { type: 'always_allow' } },
        { type: 'agent.tool_use', id: 'sevt_abc', name: 'write', input: { file_path: '/mnt/session/outputs/draft.md', content: 'x' }, processed_at: at,
          evaluated_permission: 'ask', evaluation: { type: 'always_ask' } },
        { type: 'session.status_idle', id: 'sevt_idle_1', processed_at: at, stop_details: null, stop_reason: { type: 'requires_action', event_ids: ['sevt_abc'] } },
        { type: 'agent.tool_result', id: 'sevt_res', tool_use_id: 'sevt_abc', processed_at: at, is_error: true, content: [{ type: 'text', text: 'Write somewhere else.' }] },
        { type: 'agent.message', id: 'sevt_msg', processed_at: at, content: [{ type: 'text', text: 'The reviewer denied the write.' }] },
        { type: 'session.status_idle', id: 'sevt_idle_2', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } } ];
      return new Response(events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
    }
    return Response.json({ id: 'sesn_test', type: 'session', status: 'idle', environment_id: 'env_test', agent,
      budget: { type: 'limit', max_list_cost: { amount: '50', currency: 'USD' } } });
  } });
}

test('real installed SDK: the reviewer decision becomes one user.tool_confirmation keyed by the sevt_ ID', async () => {
  await withSandbox(async (sandbox) => {
    const request: Lab04Request = { ...base, mode: 'live' }; const log: Call[] = [];
    const registry = new ApprovalRegistry({ schedule: manualClock().schedule }); const run = registry.openRun();
    const reviewed: string[] = [];
    const result = await runLab04(request, createLiveLab04Port(request, sandbox, mockSdk(log), env), sandbox, registry, run,
      new AbortController().signal, (frame) => { if (frame.kind === 'review') { reviewed.push(frame.toolUseId); decide(registry, run, frame.toolUseId, 'deny', 'Write somewhere else.'); } }, 10);
    assert.equal(result.outcome.kind, 'completed', result.message);
    assert.deepEqual(reviewed, ['sevt_abc'], 'the always_allow read was never reviewed');
    const create = log.find((c) => c.path === '/v1/sessions')!.body as { agent: unknown };
    assert.deepEqual(create.agent, { type: 'agent_with_overrides', id: 'agent_test', tools: [lab04Toolset], mcp_servers: [], skills: [] });
    const sends = log.filter((c) => c.path.endsWith('/events') && c.method === 'POST').map((c) => (c.body as { events: unknown[] }).events);
    assert.deepEqual(sends.slice(1), [[{ type: 'user.tool_confirmation', tool_use_id: 'sevt_abc', result: 'deny', deny_message: 'Write somewhere else.' }]]);
    assert.deepEqual(result.denials.map((d) => [d.toolUseId, d.by]), [['sevt_abc', 'host']]);
    assert.equal(result.uploads, 'deleted');
  });
});

/** Reads an SSE response frame by frame, handing each progress frame to `onFrame`. */
async function readSse(response: Response, onFrame: (frame: Lab04Frame) => Promise<void> | void) {
  const reader = response.body!.getReader(); const decoder = new TextDecoder(); let buffer = '', result: unknown = null;
  for (;;) {
    const part = await reader.read(); if (part.done) break;
    buffer += decoder.decode(part.value, { stream: true });
    let index: number;
    while ((index = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, index); buffer = buffer.slice(index + 2);
      const event = /^event: (.+)$/m.exec(block)?.[1]; const data = block.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6)).join('\n');
      if (!event || !data) continue;
      if (event === 'progress') await onFrame(JSON.parse(data) as Lab04Frame);
      if (event === 'result') result = JSON.parse(data);
    }
  }
  return result as { outcome: { kind: string }; files: { path: string; content: string }[]; decisions: { decision: string }[] } | null;
}

test('router: 400, 404, 409, 422 and 429 over HTTP, one winner per race, and cancellation empties the approvals map', async () => {
  const router = createLab04Router((request, sandbox) => createFixtureLab04Port({ ...request, mode: 'scripted' }, sandbox, 0), 0);
  const app = express(); app.use('/api/c4', router.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c4`;
  const post = (route: string, body: unknown, signal: AbortSignal | null = null) => fetch(`${root}/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  try {
    const sdkOnly = await post('query', { ...base, canUseTool: 'host' });
    assert.equal(sdkOnly.status, 400); assert.match((await sdkOnly.json()).error.message, /canUseTool is an Agent SDK option/);
    const updated = await post('decide', { runId: '6f1c7a52-5f1b-4a5a-9c6e-2d1f3a4b5c6d', toolUseId: 'sevt_1', decisionToken: 'a'.repeat(32), decision: 'allow', updatedInput: {} });
    assert.equal(updated.status, 400); assert.match((await updated.json()).error.message, /updatedInput is an Agent SDK option.*cannot change the input/);
    const unknown = await post('decide', { runId: '6f1c7a52-5f1b-4a5a-9c6e-2d1f3a4b5c6d', toolUseId: 'sevt_1', decisionToken: 'a'.repeat(32), decision: 'allow' });
    assert.equal(unknown.status, 404); assert.equal((await unknown.json()).error.code, 'NOT_FOUND');

    let run = { runId: '', decisionToken: '' }; const statuses: Record<string, number[]> = {};
    const response = await post('query', base);
    const result = await readSse(response, async (frame) => {
      if (frame.kind === 'run') run = { runId: frame.runId, decisionToken: frame.decisionToken };
      if (frame.kind !== 'review') return;
      const body = (decision: 'allow' | 'deny', token = run.decisionToken) => ({ ...run, decisionToken: token, toolUseId: frame.toolUseId, decision });
      const record = async (r: Promise<Response>) => (await r).status;
      if (frame.toolUseId === 'sevt_tool_2') statuses.first = [await record(post('decide', body('allow', 'b'.repeat(32)))),
        await record(post('decide', body('allow'))), await record(post('decide', body('allow')))];
      else if (frame.toolUseId === 'sevt_tool_3') statuses.race = (await Promise.all([post('decide', body('allow')), post('decide', body('deny'))])).map((r) => r.status).sort();
      else if (frame.toolUseId === 'sevt_tool_4') statuses.deny = [await record(post('decide', body('deny')))];
      else statuses.unsafe = [await record(post('decide', body('allow'))), await record(post('decide', body('deny')))];
    });
    assert.deepEqual(statuses, { first: [404, 200, 409], race: [200, 409], deny: [200], unsafe: [422, 200] });
    assert.equal(result?.outcome.kind, 'completed');
    assert.equal(result?.decisions.length, 4);
    assert.equal(router.registry.pendingCount(), 0);

    // Capacity: two runs wait at their first review; a third query is refused.
    const controllers = [new AbortController(), new AbortController()];
    for (const controller of controllers) await post('query', base, controller.signal);
    for (let i = 0; i < 80 && router.registry.pendingCount() < 2; i++) await delay(25);
    assert.equal(router.registry.pendingCount(), 2);
    assert.equal((await post('query', base)).status, 429);
    controllers.forEach((c) => c.abort());
    for (let i = 0; i < 80 && router.registry.pendingCount() > 0; i++) await delay(25);
    assert.equal(router.registry.pendingCount(), 0, 'disconnect released every waiter');
    // Pending reviews clear before asynchronous session cleanup releases capacity.
    // Probe admission with a finite bound instead of assuming cleanup takes 100 ms.
    let admission: Response | undefined;
    const until = Date.now() + 5000;
    do { admission = await post('query', { ...base, scenario: 'preallowed-only' });
      if (admission.status !== 429) break;
      await admission.arrayBuffer(); await delay(25);
    } while (Date.now() < until);
    assert.notEqual(admission.status, 429, 'capacity released');
    await readSse(admission, async () => {});
  } finally { await router.close(); server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
});
