import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { lab05Prompt, lab05RequestSchema, lab05Tools, toolShapes } from '../shared/lab05-custom-tools.js';
import type { Lab05Frame, Lab05Request, Lab05Result, ToolName } from '../shared/lab05-custom-tools.js';
import { dispatch, handlers, seedTasks, TaskStore, TaskStoreRegistry } from '../server/lib/lab05-tasks.js';
import { createFixtureLab05Port, createLiveLab05Port, lab05ToolMismatch } from '../server/lib/lab05-port.js';
import type { Lab05Port } from '../server/lib/lab05-port.js';
import { runLab05 } from '../server/lib/lab05-run.js';
import { createLab05Router } from '../server/concepts/05-custom-tools.js';
import type { StreamEvent } from '../server/lib/session-events.js';

const base: Lab05Request = { mode: 'scripted', prompt: lab05Prompt, deadlineSeconds: 10 };
const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only', MANAGED_AGENT_ID: 'agent_base', MANAGED_ENVIRONMENT_ID: 'env_test',
  CLAUDE_MANAGED_LAB05_AGENT_ID: 'agent_lab05' };
const at = '2026-01-01T00:00:00Z';
const agentTemplate = async () => JSON.parse(await readFile('managed/lab05-agent.json', 'utf8')) as { tools: unknown[]; mcp_servers: unknown[]; skills: unknown[] };
const dispatchOptions = { timeoutMs: 1000, signal: new AbortController().signal };

async function runFixture(request: Lab05Request, options: { stores?: TaskStoreRegistry; signal?: AbortSignal; stepMs?: number; onFrame?: (frame: Lab05Frame) => void } = {}) {
  const stores = options.stores ?? new TaskStoreRegistry();
  const port = createFixtureLab05Port(request, options.stepMs ?? 0);
  const runId = randomUUID(); const frames: Lab05Frame[] = [];
  const result = await runLab05(request, port, stores, runId, options.signal ?? new AbortController().signal,
    (frame) => { frames.push(frame); options.onFrame?.(frame); }, 10);
  return { result, port, frames, stores, runId };
}

test('inventory: three custom tools generated from the Zod shapes, identical to managed/lab05-agent.json', async () => {
  assert.deepEqual(lab05Tools.map((tool) => [tool.type, tool.name]), [['custom', 'list_tasks'], ['custom', 'add_task'], ['custom', 'complete_task']]);
  for (const tool of lab05Tools) {
    const { $schema: _dialect, ...expected } = z.toJSONSchema(toolShapes[tool.name], { target: 'draft-2020-12', io: 'input' });
    assert.deepEqual(tool.input_schema, expected, tool.name);
    assert.equal(tool.input_schema.additionalProperties, false, `${tool.name} is a closed object`);
  }
  assert.deepEqual(lab05Tools.map((tool) => tool.input_schema.required ?? []), [[], ['title'], ['id']]);
  const agent = await agentTemplate();
  assert.deepEqual(agent.tools, JSON.parse(JSON.stringify(lab05Tools)), 'the agent template declares exactly the generated tools');
  assert.deepEqual([agent.mcp_servers, agent.skills], [[], []]);
  assert.equal(agent.tools.some((tool) => (tool as { type: string }).type !== 'custom'), false, 'no agent toolset: no built-in tools');
  assert.equal(lab05ToolMismatch(agent.tools as never), null);
  assert.match(lab05ToolMismatch([...lab05Tools, { type: 'agent_toolset_20260401' }])!, /non-custom/);
  assert.match(lab05ToolMismatch(lab05Tools.slice(0, 2))!, /not exactly/);
  const loosened = lab05Tools.map((tool) => tool.name === 'add_task' ? { ...tool, input_schema: { ...tool.input_schema, additionalProperties: true } } : tool);
  assert.match(lab05ToolMismatch(loosened as never)!, /not exactly/, 'an open add_task schema is a different tool');
});

test('strict request schema rejects Agent SDK fields, bad bounds and offline-only options in live mode', () => {
  assert.equal(lab05RequestSchema.safeParse(base).success, true);
  for (const value of [...['mcpServers', 'allowedTools', 'createSdkMcpServer', 'tools', 'unknown'].map((key) => ({ ...base, [key]: [] })),
    { ...base, handlerTimeoutMs: 99 }, { ...base, handlerTimeoutMs: 5001 }, { ...base, deadlineSeconds: 0 },
    { ...base, mode: 'live', scenario: 'hang' }, { ...base, mode: 'live', challengeInput: { title: 1 } },
    { ...base, challengeInput: { title: 'x'.repeat(400) } }, { ...base, challengeInput: [1] }])
    assert.equal(lab05RequestSchema.safeParse(value).success, false, JSON.stringify(value).slice(0, 80));
});

test('student challenge: malformed input is rejected before any handler runs and changes nothing', async () => {
  const original = handlers.add_task; let executed = 0;
  handlers.add_task = (input, store) => { executed++; return original(input, store); };
  try {
    for (const input of [{ priority: 'high' }, { title: 42 }, { title: '   ' }, { title: 'ok', owner: 'me' }, { title: 'x'.repeat(121) }, null, 'add']) {
      const store = new TaskStore();
      const call = await dispatch('add_task', input, store, dispatchOptions);
      assert.equal(call.outcome, 'rejected', JSON.stringify(input));
      assert.equal(call.handlerRan, false); assert.equal(call.result.isError, true);
      assert.equal(call.validation.ok, false); assert.ok(call.validation.issues.length > 0);
      assert.match(call.result.text, /^Invalid input for add_task: .*The handler did not run and nothing changed\.$/);
      assert.deepEqual(store.handlerCalls, { list_tasks: 0, add_task: 0, complete_task: 0 });
      assert.deepEqual(call.before, call.after); assert.deepEqual(store.snapshot(), seedTasks);
    }
    assert.equal(executed, 0, 'the add_task handler never executed');
    const wrongType = await dispatch('add_task', { title: 42 }, new TaskStore(), dispatchOptions);
    assert.deepEqual(wrongType.validation.issues.map((issue) => issue.path), ['title']);
    assert.match(wrongType.validation.issues[0]!.message, /expected string/);
  } finally { handlers.add_task = original; }
});

test('valid state transitions and meaningful is_error results for unknown IDs, repeats and unknown tools', async () => {
  const store = new TaskStore();
  const run = (name: string, input: unknown) => dispatch(name, input, store, dispatchOptions);
  const added = await run('add_task', { title: 'Write the guide', priority: 'high' });
  assert.equal(added.outcome, 'ok'); assert.equal(added.result.isError, false);
  assert.deepEqual(JSON.parse(added.result.text), { task: { id: 'task_3', title: 'Write the guide', priority: 'high', status: 'open' } });
  assert.equal(added.after.length, added.before.length + 1);
  const done = await run('complete_task', { id: 'task_3' });
  assert.deepEqual([done.outcome, done.before.find((t) => t.id === 'task_3')?.status, done.after.find((t) => t.id === 'task_3')?.status], ['ok', 'open', 'done']);
  const again = await run('complete_task', { id: 'task_3' });
  assert.deepEqual([again.outcome, again.handlerRan, again.result.isError], ['tool-error', true, true]);
  assert.match(again.result.text, /task_3 is already done; nothing was changed/);
  const unknown = await run('complete_task', { id: 'task_99' });
  assert.equal(unknown.outcome, 'tool-error'); assert.match(unknown.result.text, /No task has the ID task_99\. Call list_tasks/);
  assert.equal((await run('complete_task', { id: 'task-1' })).outcome, 'rejected', 'pattern checked before the handler');
  const duplicate = await run('add_task', { title: 'read the LAB 05 guide' });
  assert.deepEqual([duplicate.outcome, duplicate.before.length === duplicate.after.length], ['tool-error', true]);
  assert.match(duplicate.result.text, /open task titled "Read the Lab 05 guide" already exists as task_1/);
  assert.equal((await run('add_task', { title: 'write the GUIDE' })).outcome, 'ok', 'a done task\'s title can be reused');
  const tool = await run('delete_task', { id: 'task_1' });
  assert.deepEqual([tool.outcome, tool.handlerRan], ['unknown-tool', false]);
  assert.deepEqual(JSON.parse((await run('list_tasks', { status: 'done' })).result.text).tasks.map((t: { id: string }) => t.id), ['task_2', 'task_3']);
  assert.deepEqual(store.handlerCalls, { list_tasks: 1, add_task: 3, complete_task: 3 });
});

test('tour: one user.custom_tool_result per sevt_ ID, in order, with is_error where it belongs', async () => {
  const { result, port, frames, stores, runId } = await runFixture({ ...base, scenario: 'tour' });
  assert.equal(result.outcome.kind, 'completed', result.message);
  assert.deepEqual(port.calls.filter((call) => call.startsWith('respond')), ['respond:sevt_custom_1=ok', 'respond:sevt_custom_2=ok',
    'respond:sevt_custom_3=ok', 'respond:sevt_custom_4=error', 'respond:sevt_custom_5=error,sevt_custom_6=error', 'respond:sevt_custom_7=ok']);
  assert.deepEqual([...port.fixture.results.keys()], ['sevt_custom_1', 'sevt_custom_2', 'sevt_custom_3', 'sevt_custom_4', 'sevt_custom_5', 'sevt_custom_6', 'sevt_custom_7']);
  assert.deepEqual(result.calls.map((call) => [call.id, call.name, call.outcome]), [
    ['sevt_custom_1', 'list_tasks', 'ok'], ['sevt_custom_2', 'add_task', 'ok'], ['sevt_custom_3', 'complete_task', 'ok'],
    ['sevt_custom_4', 'add_task', 'rejected'], ['sevt_custom_5', 'complete_task', 'tool-error'], ['sevt_custom_6', 'complete_task', 'tool-error'],
    ['sevt_custom_7', 'list_tasks', 'ok']]);
  assert.equal(result.resultsSent, 7);
  assert.deepEqual(result.handlerCalls, { list_tasks: 2, add_task: 1, complete_task: 3 }, 'the rejected add_task never reached its handler');
  assert.deepEqual(result.tasks.initial, seedTasks);
  assert.deepEqual(result.tasks.final.find((t) => t.id === 'task_3'), { id: 'task_3', title: 'Write the custom tools guide', priority: 'high', status: 'done' });
  assert.deepEqual(result.calls[3]!.before, result.calls[3]!.after);
  assert.equal(frames.filter((f) => f.kind === 'custom_call').length, 7);
  assert.equal(frames.filter((f) => f.kind === 'other' && f.type === 'agent.custom_tool_use').length, 7, 'raw events are shown');
  assert.deepEqual(stores.get(runId)?.store.snapshot(), result.tasks.final);
  assert.equal(stores.get(runId)?.active, false);
});

test('runner: a repeated pause or event is never answered twice; an unseen call still gets an is_error result', async () => {
  const sent: string[] = []; let responded!: () => void;
  const answered = new Promise<void>((resolve) => { responded = resolve; });
  const use: StreamEvent = { type: 'agent.custom_tool_use', id: 'sevt_a', name: 'list_tasks', input: {}, processed_at: at };
  const idle = (id: string, ids: string[]): StreamEvent => ({ type: 'session.status_idle', id, processed_at: at, stop_details: null, stop_reason: { type: 'requires_action', event_ids: ids } });
  const port: Lab05Port = {
    source: 'authored-fixture',
    async create() { return { effectiveTools: [], session: { source: 'authored-fixture', id: 'sesn_t', status: 'idle', agentId: 'a', agentVersion: 1, environmentId: 'e', budget: null, toolCount: 3, mcpServerCount: 0 } }; },
    async open() { return (async function* () {
      yield use; yield use; yield idle('sevt_idle_1', ['sevt_a']); await answered;
      yield idle('sevt_idle_2', ['sevt_a']); yield idle('sevt_idle_3', ['sevt_ghost']);
      yield { type: 'session.status_idle', id: 'sevt_end', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } } as StreamEvent;
    })(); },
    async send() {}, async confirm() { assert.fail('no confirmations'); },
    async respond(_id, results) { sent.push(...results.map((r) => `${r.customToolUseId}=${r.isError}`)); responded(); },
    async interrupt() {}, async status() { return 'idle'; }, async archive() {},
    async collectOutputs() { return { status: 'none', detail: '' }; }, async cleanup() { return 'not-needed'; },
  };
  const frames: Lab05Frame[] = [];
  const result = await runLab05(base, port, new TaskStoreRegistry(), randomUUID(), new AbortController().signal, (f) => frames.push(f), 10);
  assert.equal(result.outcome.kind, 'completed');
  assert.deepEqual(sent, ['sevt_a=false', 'sevt_ghost=true']);
  assert.ok(frames.some((f) => f.kind === 'notice' && f.text === 'Already answered sevt_a; no second answer was sent.'));
  assert.ok(frames.some((f) => f.kind === 'duplicate' && f.id === 'sevt_a'), 'the repeated event is reported as a duplicate');
  assert.deepEqual(result.calls.map((c) => [c.id, c.outcome, c.handlerRan]), [['sevt_a', 'ok', true], ['sevt_ghost', 'not-seen', false]]);
  assert.equal(result.handlerCalls.list_tasks, 1);
});

test('handler deadline: a slow handler gets an is_error result, saves nothing, and the session keeps going', async () => {
  const { result, port } = await runFixture({ ...base, scenario: 'slow-handler', handlerTimeoutMs: 100 });
  assert.equal(result.outcome.kind, 'completed');
  const [slow, list] = result.calls;
  assert.deepEqual([slow!.outcome, slow!.handlerRan, slow!.result.isError], ['timeout', true, true]);
  assert.match(slow!.result.text, /exceeded the 100 ms host handler deadline; no change was saved/);
  assert.ok(slow!.durationMs < 1000, 'answered at the deadline, not when the handler would have finished');
  assert.equal(result.tasks.final.some((task) => task.title === 'Slow handler demo'), false);
  assert.equal(list!.outcome, 'ok');
  assert.deepEqual(port.calls.filter((c) => c.startsWith('respond')), ['respond:sevt_custom_1=error', 'respond:sevt_custom_2=ok']);
  await delay(700); // the abandoned handler would have committed by now
  assert.deepEqual(result.tasks.final, seedTasks);
});

test('cancel and deadline stop the run, attempt user.interrupt and keep the task store readable', async () => {
  for (const kind of ['cancel', 'deadline'] as const) {
    const controller = new AbortController();
    const { result, port, stores, runId } = await runFixture({ ...base, scenario: 'hang', deadlineSeconds: kind === 'deadline' ? 1 : 10 },
      { signal: controller.signal, onFrame: (frame) => { if (kind === 'cancel' && frame.kind === 'other' && frame.type === 'user.custom_tool_result') controller.abort(); } });
    assert.equal(result.outcome.kind, kind === 'cancel' ? 'cancelled' : 'deadline');
    assert.equal(result.interruption, 'simulated'); assert.ok(port.calls.includes('interrupt'));
    assert.deepEqual(result.calls.map((c) => c.name), ['list_tasks'], 'the hanging agent never made its second call');
    assert.equal(stores.get(runId)?.active, false);
  }
});

test('isolation: two concurrent runs never share task state', async () => {
  const stores = new TaskStoreRegistry();
  const [tour, valid] = await Promise.all([runFixture({ ...base, scenario: 'tour' }, { stores, stepMs: 3 }),
    runFixture({ ...base, scenario: 'valid-only' }, { stores, stepMs: 2 })]);
  assert.equal(stores.size, 2);
  assert.notEqual(stores.get(tour.runId)?.store, stores.get(valid.runId)?.store);
  for (const run of [tour, valid]) {
    assert.equal(run.result.outcome.kind, 'completed');
    assert.deepEqual(run.result.tasks.initial, seedTasks, 'each run starts from the seed');
    assert.deepEqual(run.result.tasks.final.map((t) => t.id), ['task_1', 'task_2', 'task_3'], 'each run added exactly its own task_3');
  }
  assert.deepEqual(tour.result.handlerCalls, { list_tasks: 2, add_task: 1, complete_task: 3 });
  assert.deepEqual(valid.result.handlerCalls, { list_tasks: 2, add_task: 1, complete_task: 1 });
  const bounded = new TaskStoreRegistry(2);
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  bounded.open(ids[0]!); bounded.finish(ids[0]!); bounded.open(ids[1]!); bounded.open(ids[2]!);
  assert.equal(bounded.get(ids[0]!), undefined, 'the oldest finished store is evicted');
  assert.ok(bounded.get(ids[1]!) && bounded.get(ids[2]!)); assert.throws(() => bounded.open(ids[1]!));
});

type Call = { method: string; path: string; body: unknown };
function mockSdk(log: Call[], tools: unknown[]) {
  const agent = { id: 'agent_lab05', version: 3, type: 'agent', name: 'Lab 05', model: { id: 'm' }, system: null, archived_at: null,
    mcp_servers: [], skills: [], multiagent: null, tools };
  return new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    const location = new URL(String(url));
    log.push({ method: init?.method ?? 'GET', path: location.pathname, body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined });
    if (location.pathname.startsWith('/v1/agents/')) return Response.json(agent);
    if (location.pathname.endsWith('/events/stream')) {
      const events = [
        { type: 'agent.custom_tool_use', id: 'sevt_c1', name: 'add_task', input: { title: 'Live demo' }, processed_at: at },
        { type: 'session.status_idle', id: 'sevt_idle_1', processed_at: at, stop_details: null, stop_reason: { type: 'requires_action', event_ids: ['sevt_c1'] } },
        { type: 'agent.message', id: 'sevt_msg', processed_at: at, content: [{ type: 'text', text: 'Added task_3.' }] },
        { type: 'session.status_idle', id: 'sevt_idle_2', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } }];
      return new Response(events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
    }
    return Response.json({ id: 'sesn_test', type: 'session', status: 'idle', environment_id: 'env_test', agent,
      budget: { type: 'limit', max_list_cost: { amount: '50', currency: 'USD' } } });
  } });
}

test('real installed SDK: the session uses the verified Lab 05 agent and each result is one user.custom_tool_result', async () => {
  const request: Lab05Request = { ...base, mode: 'live' }; const log: Call[] = [];
  const result = await runLab05(request, createLiveLab05Port(request, mockSdk(log, (await agentTemplate()).tools), env), new TaskStoreRegistry(),
    randomUUID(), new AbortController().signal, () => {}, 10);
  assert.equal(result.outcome.kind, 'completed', result.message);
  const create = log.find((c) => c.method === 'POST' && c.path === '/v1/sessions')!.body as Record<string, unknown>;
  assert.deepEqual(create.agent, { type: 'agent', id: 'agent_lab05', version: 3 }, 'pinned to the verified version, no tool overrides');
  assert.equal(create.environment_id, 'env_test');
  const sends = log.filter((c) => c.path.endsWith('/events') && c.method === 'POST').map((c) => (c.body as { events: unknown[] }).events);
  assert.deepEqual(sends[1], [{ type: 'user.custom_tool_result', custom_tool_use_id: 'sevt_c1', is_error: false,
    content: [{ type: 'text', text: JSON.stringify({ task: { id: 'task_3', title: 'Live demo', priority: 'normal', status: 'open' } }) }] }]);
  assert.equal(sends.length, 2, 'prompt and one result; nothing else');
  assert.deepEqual(result.sessionTools?.map((t) => t.name), ['list_tasks', 'add_task', 'complete_task']);

  const wrong: Call[] = [];
  const extra = [...(await agentTemplate()).tools, { type: 'agent_toolset_20260401', default_config: { enabled: true }, configs: [] }];
  const refused = await runLab05(request, createLiveLab05Port(request, mockSdk(wrong, extra), env), new TaskStoreRegistry(),
    randomUUID(), new AbortController().signal, () => {}, 10);
  assert.equal(refused.outcome.kind, 'error'); assert.match(refused.message, /Lab 05 agent cannot be used: it has non-custom tools/);
  assert.equal(wrong.some((c) => c.path === '/v1/sessions'), false, 'no session was created');
  assert.throws(() => createLiveLab05Port(request, mockSdk([], []), { ...env, CLAUDE_MANAGED_LAB05_AGENT_ID: '' }), /CLAUDE_MANAGED_LAB05_AGENT_ID/);
});

async function readSse(response: Response, onFrame: (frame: Lab05Frame) => void = () => {}) {
  const reader = response.body!.getReader(); const decoder = new TextDecoder(); let buffer = '', result: Lab05Result | null = null;
  for (;;) {
    const part = await reader.read(); if (part.done) break;
    buffer += decoder.decode(part.value, { stream: true });
    let index: number;
    while ((index = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, index); buffer = buffer.slice(index + 2);
      const event = /^event: (.+)$/m.exec(block)?.[1]; const data = block.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6)).join('\n');
      if (event === 'progress') onFrame(JSON.parse(data) as Lab05Frame);
      if (event === 'result') result = JSON.parse(data) as Lab05Result;
    }
  }
  return result;
}

test('router: GET /tools, POST /query, GET /tasks, SDK-only fields, origin guard and capacity over HTTP', async () => {
  const router = createLab05Router((request) => createFixtureLab05Port({ ...request, mode: 'scripted' }, 0), 0);
  const app = express(); app.use('/api/c5', router.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c5`;
  const post = (body: unknown, signal: AbortSignal | null = null) => fetch(`${root}/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  try {
    const tools = await (await fetch(`${root}/tools`)).json() as { tools: { name: ToolName }[]; liveAgent: { envVar: string } };
    assert.deepEqual(tools.tools.map((t) => t.name), ['list_tasks', 'add_task', 'complete_task']);
    assert.equal(tools.liveAgent.envVar, 'CLAUDE_MANAGED_LAB05_AGENT_ID');
    const sdkOnly = await post({ ...base, mcpServers: { tasks: {} }, allowedTools: [] });
    assert.equal(sdkOnly.status, 400);
    assert.match((await sdkOnly.json()).error.message, /mcpServers, allowedTools are Agent SDK options.*cannot add, remove or replace tools/);
    assert.equal((await fetch(`${root}/tools`, { headers: { Origin: 'http://evil.example' } })).status, 403);

    let runId = '';
    const result = await readSse(await post(base), (frame) => { if (frame.kind === 'run') runId = frame.runId; });
    assert.equal(result?.outcome.kind, 'completed'); assert.equal(result?.runId, runId);
    const tasks = await fetch(`${root}/tasks?runId=${runId}`);
    assert.equal(tasks.status, 200);
    assert.deepEqual(await tasks.json(), { runId, active: false, tasks: result!.tasks.final, handlerCalls: result!.handlerCalls });
    assert.equal((await fetch(`${root}/tasks?runId=not-a-uuid`)).status, 400);
    assert.equal((await fetch(`${root}/tasks?runId=${randomUUID()}&extra=1`)).status, 400);
    assert.equal((await fetch(`${root}/tasks?runId=${randomUUID()}`)).status, 404);

    // Capacity: two hanging runs are active; a third query is refused until they end.
    const controllers = [new AbortController(), new AbortController()];
    for (const controller of controllers) await post({ ...base, scenario: 'hang' }, controller.signal);
    for (let i = 0; i < 80 && router.stores.activeCount() < 2; i++) await delay(25);
    assert.equal(router.stores.activeCount(), 2);
    assert.equal((await post(base)).status, 429);
    controllers.forEach((c) => c.abort());
    for (let i = 0; i < 80 && router.stores.activeCount() > 0; i++) await delay(25);
    await delay(100);
    const after = await post({ ...base, scenario: 'valid-only' });
    assert.equal(after.status, 200, 'capacity released'); await readSse(after);
  } finally { await router.close(); server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
});
