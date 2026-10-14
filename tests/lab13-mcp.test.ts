import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lab13RequestSchema, lab13ConfigureSchema } from '../shared/lab13-mcp.js';
import { Lab13LocalMcp, startNotesClient, inventoryClient } from '../server/lib/lab13-local-mcp.js';
import { startInventoryServer, mcpVersion } from '../mcp-servers/lab13-inventory.js';
import { Lab13Sessions } from '../server/lib/lab13-sessions.js';
import { createFixtureLab13Port, createLiveLab13Port, lab13BridgeTools, lab13NativeConfig, lab13RemoteSettings } from '../server/lib/lab13-port.js';
import { createLab13Router } from '../server/concepts/13-mcp-servers.js';
import type { StreamEvent } from '../server/lib/session-events.js';

const input = lab13RequestSchema.parse({ mode: 'scripted' }); const signal = new AbortController().signal;
const initialize = { protocolVersion: mcpVersion, capabilities: {}, clientInfo: { name: 'test', version: '1' } };
const token = 'authored-local-test-credential-12345';

test('closed input contracts reject arbitrary URLs, SDK fields and unsupported native writes', () => {
  for (const patch of [{ mcpServers: {} }, { url: 'https://untrusted.example/mcp' }, { token: 'injection' }, { command: 'cmd.exe' }, { deadlineSeconds: 121 }]) assert.equal(lab13RequestSchema.safeParse({ ...input, ...patch }).success, false);
  assert.equal(lab13RequestSchema.safeParse({ ...input, mode: 'live', scenario: 'unauthorized' }).success, false);
  assert.equal(lab13RequestSchema.safeParse({ ...input, integration: 'managed-url' }).success, false);
  assert.equal(lab13ConfigureSchema.safeParse({ runId: crypto.randomUUID(), config: { ...input.config, url: 'http://localhost' } }).success, false);
  for (const url of ['http://public.example.net/mcp', 'https://127.0.0.1/mcp', 'https://[::1]/mcp', 'https://localhost/mcp', 'https://user:secret@api.example.net/mcp', 'https://api.example.net/mcp?token=x']) assert.equal(lab13RemoteSettings({ CLAUDE_MANAGED_LAB13_INVENTORY_URL: url, CLAUDE_MANAGED_LAB13_VAULT_ID: 'vlt_test' }).ready, false);
});

test('notes stdio is real, protocol-only, correlated and stopped on close', async () => {
  const rpc = startNotesClient();
  try { const ready = await rpc.request('initialize', initialize, AbortSignal.timeout(3000)) as { protocolVersion: string }; assert.equal(ready.protocolVersion, mcpVersion);
    await rpc.notify('notifications/initialized'); const list = await rpc.request('tools/list', {}, AbortSignal.timeout(3000)) as { tools: { name: string }[] };
    assert.deepEqual(list.tools.map(tool => tool.name), ['list_notes', 'read_note']);
    const result = await rpc.request('tools/call', { name: 'read_note', arguments: { id: 'note_1' } }, AbortSignal.timeout(3000)) as { isError: boolean; content: { text: string }[] };
    assert.equal(result.isError, false); assert.match(result.content[0]!.text, /Aurora Finches/);
  } finally { await rpc.close(); }
  await assert.rejects(rpc.request('tools/list', {}, signal), /closed/);
  const child = spawn(process.execPath, ['mcp-servers/lab13-notes.mjs'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }); let stdout = '';
  child.stdout.on('data', chunk => { stdout += chunk; }); child.stdin.end(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: initialize })}\n`); await once(child, 'exit');
  const lines = stdout.trim().split('\n'); assert.equal(lines.length, 1); assert.equal(JSON.parse(lines[0]!).jsonrpc, '2.0');
});

test('authenticated HTTP MCP rejects unauthorized/origin/method/protocol and closes its listener', async () => {
  const server = await startInventoryServer(token); const rpc = inventoryClient(server.url, token);
  try {
    assert.equal((await fetch(server.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
    assert.equal((await fetch(server.url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await fetch(server.url, { headers: { Authorization: `Bearer ${token}` } })).status, 405);
    await rpc.request('initialize', initialize, signal); await rpc.notify('notifications/initialized');
    const result = await rpc.request('tools/call', { name: 'reserve_stock', arguments: { sku: 'NOTEBOOK', quantity: 2 } }, signal) as { isError: boolean };
    assert.equal(result.isError, false); assert.equal(server.state.snapshot()[0]?.available, 6);
    const invalid = await rpc.request('tools/call', { name: 'reserve_stock', arguments: { sku: 'NOTEBOOK', quantity: 100 } }, signal) as { isError: boolean };
    assert.equal(invalid.isError, true); assert.equal(server.state.snapshot()[0]?.available, 6);
    assert.equal((await fetch(server.url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) })).status, 400);
  } finally { await rpc.close(); await server.close(); }
  await assert.rejects(fetch(server.url));
});

test('local working, missing and unauthorized evidence never claims cloud reachability', async () => {
  for (const scenario of ['working', 'missing', 'unauthorized'] as const) {
    const local = new Lab13LocalMcp({ ...input, scenario });
    try { await local.start(); const notes = local.connections[0]!; const inventory = local.connections[1]!;
      if (scenario === 'working') { assert.equal(notes.state, 'ready-local'); assert.equal(inventory.state, 'ready-local'); assert.match(inventory.detail, /Cloud reachability is untested/); }
      else { assert.equal(inventory.state, 'failed-local'); assert.equal(inventory.httpStatus, scenario === 'missing' ? 404 : 401); }
      assert.ok(local.evidence.every(record => record.requestId > 0));
    } finally { await local.close(); }
  }
});

test('disabled servers/tools and bad arguments have no handler effect; valid reservation changes owned stock', async () => {
  const local = new Lab13LocalMcp(input);
  try {
    await local.start(); const before = local.stock.snapshot(); assert.equal((await local.call('reserve_stock', { sku: 'NOTEBOOK', quantity: 1 }, signal)).handlerRan, false);
    assert.equal((await local.call('get_stock', { sku: 'NOTEBOOK', unexpected: true }, signal)).handlerRan, false); assert.deepEqual(local.stock.snapshot(), before);
    await local.start({ ...input.config, reserveEnabled: true }); const reserved = await local.call('reserve_stock', { sku: 'NOTEBOOK', quantity: 1 }, signal);
    assert.equal(reserved.isError, false); assert.equal(local.stock.snapshot()[0]?.available, 7);
    await local.start({ ...input.config, inventoryEnabled: false, reserveEnabled: true }); const disabled = await local.call('reserve_stock', { sku: 'NOTEBOOK', quantity: 1 }, signal);
    assert.equal(disabled.handlerRan, false); assert.equal(local.stock.snapshot()[0]?.available, 7);
  } finally { await local.close(); }
});

test('retained offline session uses real MCP calls, applies idle disable and separates tool errors from completion', async () => {
  const sessions = new Lab13Sessions(); const e = await sessions.create('alice', { ...input, config: { ...input.config, reserveEnabled: true } });
  try {
    const first = await sessions.run(e, 'Reserve one notebook', 'reserve', signal, () => {}); assert.equal(first.stock[0]?.available, 7); assert.equal(first.cleanup, 'retained');
    const id = first.sessionId; assert.equal(first.calls[0]?.path, 'host-mcp'); assert.equal(first.calls[0]?.resultSent, true); assert.equal(first.turns[0]?.outcome.kind, 'completed');
    await sessions.configure(e, { ...input.config, inventoryEnabled: false, reserveEnabled: true });
    const second = await sessions.run(e, 'Try again', 'reserve', signal, () => {}); assert.equal(second.sessionId, id); assert.equal(second.stock[0]?.available, 7);
    assert.equal(second.calls.at(-1)?.path, 'host-rejected'); assert.equal(second.calls.at(-1)?.isError, true); assert.equal(second.turns.at(-1)?.outcome.kind, 'completed');
    await sessions.end(e); assert.equal(e.snapshot.state, 'closed'); await assert.rejects(sessions.run(e, 'again', 'inspect', signal, () => {}), /idle/);
  } finally { await sessions.close(); }
});

test('cancellation/deadline stop host transports and do not complete a hanging turn', async () => {
  const sessions = new Lab13Sessions(); const e = await sessions.create('alice', { ...input, scenario: 'hang' }); const controller = new AbortController();
  const run = sessions.run(e, 'Hang', 'inspect', controller.signal, () => {}); await delay(10); controller.abort(); const result = await run;
  assert.equal(result.turns[0]?.outcome.kind, 'cancelled'); assert.equal(result.state, 'closed');
  await sessions.close();
  const deadlines = new Lab13Sessions(); const timed = await deadlines.create('alice', { ...input, scenario: 'hang', deadlineSeconds: 1 });
  try { const result = await deadlines.run(timed, 'Hang until deadline', 'inspect', signal, () => {}); assert.equal(result.turns[0]?.outcome.kind, 'deadline'); assert.equal(result.state, 'closed'); }
  finally { await deadlines.close(); }
});

test('ownership, owner reservation and global capacity are bounded before effects', async () => {
  const sessions = new Lab13Sessions(1); const e = await sessions.create('alice', input);
  try { assert.throws(() => sessions.read(e.runId, 'bob'), /another/); await assert.rejects(sessions.create('bob', input), /existing/); }
  finally { await sessions.close(); }
});

test('native MCP and bridge parameter builders never put auth tokens in agent definitions', () => {
  const env = { CLAUDE_MANAGED_LAB13_INVENTORY_URL: 'https://inventory.course-tools.net/mcp', CLAUDE_MANAGED_LAB13_VAULT_ID: 'vlt_test' };
  const config = { notesEnabled: false, inventoryEnabled: true, reserveEnabled: false }; const native = lab13NativeConfig(config, env);
  assert.deepEqual(native.mcp_servers, [{ type: 'url', name: 'inventory', url: env.CLAUDE_MANAGED_LAB13_INVENTORY_URL }]);
  assert.equal(native.tools?.[0]?.type, 'mcp_toolset'); assert.equal(JSON.stringify(native).includes('authorization_token'), false);
  assert.deepEqual(lab13NativeConfig({ ...config, inventoryEnabled: false }, env), { tools: [], mcp_servers: [] });
  assert.deepEqual(lab13BridgeTools(input.config).map(tool => tool.name), ['list_notes', 'read_note', 'get_stock']);
});

test('injected real SDK validates native URL/vault configuration, correlated events and idle updates', async () => {
  const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'offline-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test',
    CLAUDE_MANAGED_LAB13_INVENTORY_URL: 'https://inventory.course-tools.net/mcp', CLAUDE_MANAGED_LAB13_VAULT_ID: 'vlt_test' };
  const config = { notesEnabled: false, inventoryEnabled: true, reserveEnabled: false }; const q = { ...input, mode: 'live' as const, integration: 'managed-url' as const, config };
  const base = { id: 'agent_test', version: 3, system: 'Base.', model: { id: 'base-model' }, multiagent: null };
  let resolved: any; const log: { path: string; body: any }[] = []; const observed: unknown[] = [];
  const at = new Date().toISOString(); const events: StreamEvent[] = [
    { type: 'session.status_idle', id: 'stale', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } },
    { type: 'user.message', id: 'user_new', processed_at: at, content: [{ type: 'text', text: 'Get stock' }] },
    { type: 'agent.mcp_tool_use', id: 'use', processed_at: at, mcp_server_name: 'inventory', name: 'get_stock', input: {}, evaluated_permission: 'allow' },
    { type: 'agent.mcp_tool_result', id: 'result', processed_at: at, mcp_tool_use_id: 'use', is_error: false, content: [{ type: 'text', text: 'Real SDK-injected fixture result.' }] },
    { type: 'session.status_idle', id: 'idle_new', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } },
  ];
  const sdk = new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    const path = new URL(String(url)).pathname; const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined; log.push({ path, body });
    if (path.startsWith('/v1/agents/')) return Response.json(base);
    if (path === '/v1/sessions' && body) resolved = { ...base, ...body.agent };
    if (path === '/v1/sessions/sesn_test' && body?.agent) resolved = { ...resolved, ...body.agent };
    if (path.endsWith('/events/stream')) return new Response(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
    if (body?.events?.[0]?.type === 'user.message') return Response.json({ data: [{ ...body.events[0], id: 'user_new' }] });
    return Response.json({ id: 'sesn_test', agent: resolved, status: 'idle', environment_id: 'env_test', vault_ids: ['vlt_test'] });
  } });
  const port = createLiveLab13Port(q, call => observed.push(call), sdk, env); const created = await port.create(); assert.equal(port.verificationError, null);
  const stream = await port.open(created.session.id, signal); await port.send(created.session.id, 'Get stock', signal); const seen: StreamEvent[] = []; for await (const event of stream) seen.push(event);
  assert.equal(seen.some(event => 'id' in event && event.id === 'stale'), false); assert.equal(observed.length, 2);
  await port.configure({ ...config, inventoryEnabled: false });
  assert.deepEqual(log.find(call => call.path === '/v1/sessions')!.body.vault_ids, ['vlt_test']);
  assert.deepEqual(log.find(call => call.path === '/v1/sessions/sesn_test' && call.body?.agent)!.body, { agent: { tools: [], mcp_servers: [] } });
});

test('router catalog is read-only, rejects remote input and exposes owned stock/reset/close', async () => {
  let created = 0; const sessions = new Lab13Sessions(2, q => { created++; return createFixtureLab13Port(q); }); const lesson = createLab13Router({ sessions });
  const app = express(); app.use('/api/c13', lesson.router); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No address'); const base = `http://127.0.0.1:${address.port}/api/c13`;
  const post = (route: string, body: object, owner = 'alice') => fetch(`${base}/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner }, body: JSON.stringify(body) });
  try { const catalog = await (await fetch(`${base}/servers`)).json(); assert.equal(catalog.cloudReachability, 'not-tested'); assert.equal(created, 0);
    assert.equal((await post('session', { mode: 'scripted', url: 'https://untrusted.example' })).status, 400); assert.equal(created, 0);
    const e = await (await post('session', { mode: 'scripted' })).json(); assert.equal(created, 1);
    assert.equal((await post('configure', { runId: e.runId, config: input.config }, 'bob')).status, 403);
    assert.equal((await post('stock/reset', { runId: e.runId })).status, 200);
    assert.equal((await post('end', { runId: e.runId })).status, 200);
    const closed = await (await fetch(`${base}/stock?runId=${e.runId}`, { headers: { 'X-Lab-Owner': 'alice' } })).json(); assert.equal(closed.state, 'closed');
  } finally { await lesson.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('late creation during shutdown retains the provider ID for archive and stops local transports', async () => {
  let archived = false; let begin!: () => void; const entered = new Promise<void>(resolve => { begin = resolve; });
  const sessions = new Lab13Sessions(1, q => {
    const port = createFixtureLab13Port(q); const create = port.create; const archive = port.archive;
    port.create = async () => { begin(); await delay(30); return create(); }; port.archive = async id => { archived = true; await archive(id); }; return port;
  });
  const creation = sessions.create('alice', input).catch(error => error); await entered; await sessions.close(); await creation;
  const e = [...sessions.entries.values()][0]!; assert.equal(e.snapshot.state, 'closed'); assert.ok(e.session?.id); assert.equal(archived, true);
});

test('mismatched session capabilities quarantine failed cleanup without sending a prompt', async () => {
  let sent = false; const sessions = new Lab13Sessions(1, q => { const port = createFixtureLab13Port(q); port.verificationError = 'Authored mismatched capabilities.';
    port.send = async () => { sent = true; }; port.archive = async () => { throw new Error('Authored archive failure'); }; return port; });
  await assert.rejects(sessions.create('alice', input), /cleanup pending/); const e = [...sessions.entries.values()][0]!;
  assert.equal(sent, false); assert.equal(e.snapshot.state, 'cleanup-pending'); assert.ok(e.session?.id);
  await assert.rejects(sessions.create('bob', input), /existing/);
  e.port.archive = async () => {}; await sessions.end(e); assert.equal(e.snapshot.state, 'closed'); await sessions.close();
});

test('a failed custom-result submission is never reported as acknowledged', async () => {
  const sessions = new Lab13Sessions(1, q => { const port = createFixtureLab13Port(q); port.respond = async () => { throw new Error('Authored send failure'); }; return port; });
  const e = await sessions.create('alice', input);
  try { const result = await sessions.run(e, 'Inspect local MCP', 'inspect', signal, () => {}); assert.equal(result.calls.length, 2); assert.ok(result.calls.every(call => !call.resultSent)); assert.equal(result.state, 'closed'); assert.notEqual(result.turns[0]?.outcome.kind, 'completed'); }
  finally { await sessions.close(); }
});
