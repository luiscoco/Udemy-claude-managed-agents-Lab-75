import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lab12CreateSchema, lab12MessageSchema, lab12TinyImage, lab12SendSchema, lab12ModelSchema } from '../shared/lab12-streaming-input.js';
import { createFixtureLab12Port, createLiveLab12Port, lab12Content, lab12ReadTools } from '../server/lib/lab12-port.js';
import { Lab12Queues, boundedLab12Text } from '../server/lib/lab12-queue.js';
import { createLab12Router } from '../server/concepts/12-streaming-input.js';
import type { Lab12Entry } from '../server/lib/lab12-queue.js';

const input = lab12CreateSchema.parse({ mode: 'scripted', deadlineSeconds: 2 });
const message = (text = 'Aurora Finch', scenario: 'normal' | 'slow' | 'hang' | 'error' | 'duplicate-events' | 'stream-ended' | 'interrupt-unconfirmed' = 'normal') => lab12MessageSchema.parse({ commandId: randomUUID(), text, scenario });
async function started(stepMs = 0) { const queues = new Lab12Queues(2, 0); const port = createFixtureLab12Port(stepMs); const e = await queues.create('alice', input, port); return { queues, port, e }; }
async function until(check: () => boolean) { for (let i = 0; i < 500; i++) { if (check()) return; await delay(5); } throw new Error('Timed out waiting for queue evidence.'); }
async function finished(e: Lab12Entry) { await until(() => e.snapshot.commands.length > 0 && e.snapshot.commands.every(c => ['completed', 'failed', 'cancelled'].includes(c.state)) && !e.worker); }

test('closed contracts reject oversized input, invented setters and invalid PNGs', () => {
  assert.equal(lab12MessageSchema.safeParse(message()).success, true);
  for (const patch of [{ text: 'x'.repeat(1001) }, { setModel: 'fake' }, { priority: 'now' }, { commandId: 'bad' }, { image: { media_type: 'image/png', data: 'aGVsbG8=' } }])
    assert.equal(lab12MessageSchema.safeParse({ ...message(), ...patch }).success, false);
  const png = { ...message(), image: { media_type: 'image/png' as const, data: lab12TinyImage } };
  assert.equal(lab12MessageSchema.safeParse(png).success, true);
  assert.equal(lab12Content(png)[1]?.type, 'image');
  assert.equal(lab12SendSchema.safeParse({ ...message(), runId: randomUUID(), model: 'fake' }).success, false);
  assert.equal(lab12ModelSchema.safeParse({ runId: randomUUID(), model: 'claude-sonnet-5-5', effort: 'high', context: 'Explicit context' }).success, true);
});

test('retained text bounds include UTF-8 and JSON escaping overhead', () => {
  for (const text of ['x'.repeat(20000), '鳥'.repeat(20000), '\u0000'.repeat(20000)]) {
    const clipped = boundedLab12Text(text, 20000); assert.ok(clipped.length <= 16000); assert.ok(Buffer.byteLength(JSON.stringify(clipped)) <= 20000);
    assert.ok(clipped.length < text.length);
  }
});

test('one retained stream serializes scripts and correlates returned user events', async () => {
  const { queues, port, e } = await started();
  try {
    const messages = [message('first'), message('follow-up')]; queues.admit(e, messages); await finished(e);
    assert.deepEqual(e.snapshot.commands.map(c => c.state), ['completed', 'completed']);
    assert.equal(port.calls.filter(c => c === 'open').length, 1); assert.equal(port.calls.filter(c => c.startsWith('send:')).length, 2);
    for (const command of e.snapshot.commands) {
      assert.ok(command.userEventId); assert.equal(command.agentEventIds.length, 1);
      assert.ok(e.snapshot.events.some(event => event.type === 'user.message' && event.id === command.userEventId && event.commandId === command.commandId));
    }
    assert.ok(e.snapshot.commands[1]!.startedAt! >= e.snapshot.commands[0]!.finishedAt!);
    assert.equal(e.snapshot.state, 'idle');
  } finally { await queues.close(); }
});

test('exact command replay has one effect and script capacity rejection is atomic', async () => {
  const { queues, port, e } = await started(30);
  try {
    const first = message('first'); queues.admit(e, [first]); queues.admit(e, [first]);
    assert.throws(() => queues.admit(e, [{ ...first, text: 'changed' }]), /different input/);
    assert.throws(() => queues.admit(e, [message(), message(), message()]), /two waiting/);
    assert.equal(e.snapshot.commands.length, 1); await finished(e);
    queues.admit(e, [first]); assert.equal(port.calls.filter(c => c.startsWith('send:')).length, 1);
  } finally { await queues.close(); }
});

test('close cancels waiting commands without sending and rejects future admissions', async () => {
  const { queues, port, e } = await started();
  queues.admit(e, [message('busy', 'hang'), message('waiting')]); await until(() => e.snapshot.commands[0]?.state === 'accepted');
  assert.equal(e.snapshot.queueDepth, 1); await queues.end(e); await finished(e);
  assert.equal(e.snapshot.state, 'closed'); assert.equal(e.snapshot.cleanup, 'simulated');
  assert.equal(e.snapshot.commands[1]?.outcome, 'cancelled-before-submission'); assert.equal(e.snapshot.commands[1]?.userEventId, null);
  assert.equal(port.calls.filter(c => c.startsWith('send:')).length, 1); assert.throws(() => queues.admit(e, [message()]), /closed/);
  await queues.close();
});

test('unconfirmed interrupt preserves pending cleanup and never archives', async () => {
  const { queues, port, e } = await started(); queues.admit(e, [message('busy', 'interrupt-unconfirmed')]);
  await until(() => e.snapshot.commands[0]?.state === 'accepted'); await queues.end(e);
  assert.equal(e.snapshot.state, 'cleanup-pending'); assert.equal(e.snapshot.interruption, 'unconfirmed');
  assert.equal(e.snapshot.cleanup, 'pending'); assert.equal(port.calls.includes('archive'), false); await queues.close();
});

test('duplicates, refusal, stream EOF and deadlines do not fabricate success', async () => {
  for (const scenario of ['duplicate-events', 'error', 'stream-ended', 'hang'] as const) {
    const { queues, e } = await started(); if (scenario === 'hang') e.input.deadlineSeconds = 0.05;
    try { queues.admit(e, [message('first', scenario), message('next')]); await finished(e);
      if (scenario === 'duplicate-events') { assert.equal(e.snapshot.commands[0]?.state, 'completed'); assert.equal(e.snapshot.commands[0]?.agentEventIds.length, 1); }
      else { assert.equal(e.snapshot.commands[0]?.state, 'failed'); assert.equal(e.snapshot.commands[1]?.state, 'cancelled'); assert.equal(e.snapshot.state, 'closed'); }
    } finally { await queues.close(); }
  }
});

test('owner, capacity and idle updates protect retained queue state', async () => {
  const { queues, e, port } = await started();
  try {
    assert.throws(() => queues.read(e.runId, 'bob'), /another/);
    await queues.idleUpdate(e, async () => { await port.tools(e.session.id, 'read-only'); e.snapshot.tools = 'read-only'; });
    assert.equal(e.snapshot.tools, 'read-only');
    queues.admit(e, [message('busy', 'hang')]);
    await assert.rejects(queues.idleUpdate(e, async () => {}), /idle/);
    const second = await queues.create('bob', input, createFixtureLab12Port());
    await assert.rejects(queues.create('carol', input, createFixtureLab12Port()), /existing/); await queues.end(second);
  } finally { await queues.close(); }
});

test('router validates origin/ownership and exposes restricted updates and explicit handoff', async () => {
  const lesson = createLab12Router({ queues: new Lab12Queues(2, 0), fixture: () => createFixtureLab12Port(0) });
  const app = express(); app.use('/api/c12', lesson.router); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No address');
  const base = `http://127.0.0.1:${address.port}/api/c12`;
  const post = (route: string, body: object, owner = 'alice') => fetch(`${base}/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner }, body: JSON.stringify(body) });
  try {
    assert.equal((await post('session', { mode: 'scripted', SDKUserMessage: {} })).status, 400);
    const e = await (await post('session', { mode: 'scripted' })).json();
    assert.equal((await post('send', { runId: e.runId, ...message() }, 'bob')).status, 403);
    assert.equal((await post('tools', { runId: e.runId, preset: 'read-only' })).status, 200);
    const context = await (await post('context', { runId: e.runId, text: 'Explicit context' })).json(); assert.equal(context.contextEventIds.length, 1);
    const handoff = await (await post('new-model-session', { runId: e.runId, model: 'claude-sonnet-5-5', effort: 'high', context: 'Aurora Finch notebook' })).json();
    assert.notEqual(handoff.sessionId, e.sessionId); assert.equal(handoff.handoffFrom, e.sessionId); assert.equal(handoff.commands.length, 1);
    assert.equal((await post('send', { runId: e.runId, ...message() })).status, 409);
    assert.equal((await post('end', { runId: handoff.runId })).status, 200);
    assert.equal((await fetch(`${base}/state?runId=${e.runId}`, { headers: { 'X-Lab-Owner': 'alice', Origin: 'https://untrusted.example' } })).status, 403);
  } finally { await lesson.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('real SDK injected transport uses supported overrides, image/system events and idle tool updates', async () => {
  const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'offline-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test' };
  const base = { id: 'agent_test', version: 3, system: 'Base instructions.', model: { id: 'base-model', effort: 'medium' }, multiagent: null };
  let resolved = { ...base, tools: [] as unknown[], mcp_servers: [], skills: [] };
  const calls: { path: string; method: string; body: any }[] = [];
  const sdk = new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    const path = new URL(String(url)).pathname; const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ path, method: init?.method ?? 'GET', body });
    if (path.startsWith('/v1/agents/')) return Response.json(base);
    if (path === '/v1/sessions' && init?.method === 'POST') resolved = { ...resolved, ...body.agent, model: body.agent.model ?? base.model };
    if (path === '/v1/sessions/sesn_test' && init?.method === 'POST' && body?.agent) resolved = { ...resolved, ...body.agent };
    if (path.endsWith('/events/stream')) return new Response('', { headers: { 'Content-Type': 'text/event-stream' } });
    if (body?.events) return Response.json({ data: body.events.map((event: object) => ({ ...event, id: 'sevt_accepted' })) });
    return Response.json({ id: 'sesn_test', agent: resolved, status: 'idle' });
  } });
  const port = createLiveLab12Port(sdk, env); const session = await port.create({ ...input, mode: 'live' }, 'claude-sonnet-5-5', 'high');
  assert.equal(session.configurationValid, true); assert.equal(session.effort, 'high');
  await port.open(session.id, new AbortController().signal);
  const command = { ...message(), image: { media_type: 'image/png' as const, data: lab12TinyImage } };
  assert.equal(await port.send(session.id, command, new AbortController().signal), 'sevt_accepted');
  assert.equal(await port.context(session.id, 'Explicit context'), 'sevt_accepted');
  await port.tools(session.id, 'read-only'); await port.archive(session.id);
  const created = calls.find(call => call.path === '/v1/sessions')!.body;
  assert.equal(created.agent.version, 3); assert.deepEqual(created.agent.model, { id: 'claude-sonnet-5-5', effort: 'high' });
  assert.deepEqual(created.agent.tools, []); assert.deepEqual(created.agent.mcp_servers, []); assert.deepEqual(created.agent.skills, []);
  const submitted = calls.find(call => call.body?.events?.[0]?.type === 'user.message')!.body;
  assert.deepEqual(submitted.events[0].content, lab12Content(command)); assert.equal(Object.hasOwn(submitted.events[0], 'commandId'), false);
  assert.ok(calls.findIndex(call => call.path.endsWith('/events/stream')) < calls.findIndex(call => call.body?.events?.[0]?.type === 'user.message'));
  assert.deepEqual(calls.find(call => call.path === '/v1/sessions/sesn_test' && call.body?.agent)!.body, { agent: { tools: lab12ReadTools, mcp_servers: [] } });
});

test('stale initial idle cannot finish a command before the echoed user event', async () => {
  const queues = new Lab12Queues(2, 0); const port = createFixtureLab12Port(0); const open = port.open;
  port.open = async (id, signal) => {
    const events = await open(id, signal); return (async function* () {
      await delay(1); yield { type: 'session.status_idle' as const, id: 'sevt_stale', processed_at: new Date().toISOString(), stop_details: null, stop_reason: { type: 'end_turn' as const } };
      for await (const event of events) yield event;
    })();
  };
  const e = await queues.create('alice', input, port);
  try { queues.admit(e, [message()]); await finished(e); assert.equal(e.snapshot.commands[0]?.state, 'completed'); assert.equal(e.snapshot.commands[0]?.agentEventIds.length, 1); }
  finally { await queues.close(); }
});

test('missing acceptance ID stops queued work without automatic resubmission', async () => {
  const { queues, e, port } = await started(); const send = port.send;
  port.send = async (...args) => { await send(...args); throw new Error('Authored lost acceptance response'); };
  try { queues.admit(e, [message(), message()]); await finished(e); assert.equal(e.snapshot.commands[0]?.state, 'failed');
    assert.equal(e.snapshot.commands[1]?.userEventId, null); assert.equal(port.calls.filter(call => call.startsWith('send:')).length, 1); assert.equal(e.snapshot.state, 'closed'); }
  finally { await queues.close(); }
});

test('mismatched resolved config keeps a cleanup checkpoint and blocks new capacity until archived', async () => {
  const queues = new Lab12Queues(1, 0); const port = createFixtureLab12Port(0); const create = port.create;
  port.create = async (...args) => ({ ...await create(...args), configurationValid: false });
  port.archive = async () => { throw new Error('Authored archive failure'); };
  await assert.rejects(queues.create('alice', input, port), /cleanup pending/);
  const e = [...queues.entries.values()][0]!; assert.equal(e.snapshot.state, 'cleanup-pending'); assert.equal(e.snapshot.commands.length, 0);
  await assert.rejects(queues.create('bob', input, createFixtureLab12Port()), /existing/);
  port.archive = async () => {}; await queues.end(e); assert.equal(e.snapshot.state, 'closed'); await queues.close();
});

test('shutdown waits for late creation and closes its returned session', async () => {
  const queues = new Lab12Queues(1, 0); const port = createFixtureLab12Port(0); const create = port.create;
  port.create = async (...args) => { await delay(20); return create(...args); };
  const pending = queues.create('alice', input, port); await delay(1); await queues.close(); const e = await pending;
  assert.equal(e.snapshot.state, 'closed'); assert.ok(port.calls.includes('archive'));
});

test('close waits for an in-flight idle update before archiving', async () => {
  const { queues, e, port } = await started(); const order: string[] = []; const archive = port.archive;
  port.archive = async id => { order.push('archive'); await archive(id); };
  const update = queues.idleUpdate(e, async () => { await delay(20); order.push('update'); });
  await delay(1); await queues.end(e); await update; assert.deepEqual(order, ['update', 'archive']); assert.equal(e.snapshot.state, 'closed'); await queues.close();
});

test('disconnect during new-model creation archives the late session without sending handoff', async () => {
  const ports: ReturnType<typeof createFixtureLab12Port>[] = []; let began!: () => void;
  const creating = new Promise<void>(resolve => { began = resolve; });
  const lesson = createLab12Router({ queues: new Lab12Queues(2, 0), fixture: () => {
    const port = createFixtureLab12Port(0); ports.push(port);
    if (ports.length === 2) { const create = port.create; port.create = async (...args) => { began(); await delay(50); return create(...args); }; }
    return port;
  } });
  const app = express(); app.use('/api/c12', lesson.router); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No address');
  const base = `http://127.0.0.1:${address.port}/api/c12`; const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  try {
    const response = await fetch(`${base}/session`, { method: 'POST', headers, body: JSON.stringify({ mode: 'scripted' }) }); const e = await response.json();
    const controller = new AbortController();
    const request = fetch(`${base}/new-model-session`, { method: 'POST', headers, signal: controller.signal,
      body: JSON.stringify({ runId: e.runId, model: 'claude-sonnet-5-5', effort: 'high', context: 'Explicit context' }) }).catch(() => null);
    await creating; controller.abort(); await request;
    await until(() => ports[1]?.calls.includes('archive') ?? false);
    assert.equal(ports[1]!.calls.some(call => call.startsWith('send:')), false);
  } finally { await lesson.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
