import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { buildToolset, lab03Presets, lab03RequestSchema, presets } from '../shared/lab03-tools.js';
import type { Lab03Frame, Lab03Request } from '../shared/lab03-tools.js';
import { checkBash, createSandbox, decideConfirmation, fixtureFiles, PathRejected, resolveContainerPath } from '../server/lib/lab03-sandbox.js';
import type { Sandbox } from '../server/lib/lab03-sandbox.js';
import { createFixtureLab03Port, createLiveLab03Port, lab03SessionParams } from '../server/lib/lab03-port.js';
import { runLab03 } from '../server/lib/lab03-run.js';
import { createLab03Router } from '../server/concepts/03-tools.js';

const base: Lab03Request = { mode: 'scripted', preset: 'read-only', prompt: 'Try the tools.', deadlineSeconds: 5 };
const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test' };
const fileIds = { 'notes.md': 'file_notes', 'draft.md': 'file_draft' };

async function withSandbox<T>(action: (sandbox: Sandbox) => Promise<T>) {
  const sandbox = await createSandbox();
  try { return await action(sandbox); } finally { await sandbox.dispose(); }
}
async function runFixture(request: Lab03Request, sandbox: Sandbox) {
  const port = createFixtureLab03Port(request, sandbox, 0); const frames: Lab03Frame[] = [];
  const result = await runLab03(request, port, sandbox, new AbortController().signal, (frame) => { frames.push(frame); }, 10);
  return { result, port, frames };
}
// Evidence comes from disk, never from the agent's message.
const disk = (sandbox: Sandbox, relative: string) => readFile(path.join(sandbox.dir, relative), 'utf8').catch(() => null);

test('strict request schema rejects Agent SDK fields and bad bounds; toolset and session params are exact', () => {
  for (const value of [ ...['allowedTools', 'disallowedTools', 'permissionMode', 'cwd', 'canUseTool', 'unknown'].map((key) => ({ ...base, [key]: ['Read'] })),
    { ...base, preset: 'everything' }, { ...base, prompt: ' ' }, { ...base, deadlineSeconds: 0 }, { ...base, deadlineSeconds: 121 },
    { ...base, budgetCents: 1.5 }, { ...base, removeTools: ['edit', 'edit'] }, { ...base, removeTools: ['web_fetch'] },
    { ...base, mode: 'live', scenario: 'hang' } ])
    assert.equal(lab03RequestSchema.safeParse(value).success, false, JSON.stringify(value));
  for (const preset of lab03Presets) {
    const toolset = buildToolset(preset);
    assert.deepEqual(toolset.default_config.enabled, false);
    assert.deepEqual(toolset.configs.filter((c) => c.name === 'web_fetch' || c.name === 'web_search'), [{ name: 'web_fetch', enabled: false }, { name: 'web_search', enabled: false }]);
    const bash = toolset.configs.find((c) => c.name === 'bash')!;
    if (bash.enabled) assert.equal(bash.permission_policy.type, 'always_ask');
  }
  assert.equal(buildToolset('auto').default_config.permission_policy.type, 'auto');
  assert.deepEqual(buildToolset('permitted-edit', ['edit']).configs.find((c) => c.name === 'edit'), { name: 'edit', enabled: false });
  const params = lab03SessionParams({ ...base, preset: 'denied-write', budgetCents: 20 }, fileIds, env);
  assert.deepEqual(params.agent, { type: 'agent_with_overrides', id: 'agent_test', tools: [buildToolset('denied-write')], mcp_servers: [], skills: [] });
  assert.deepEqual(params.resources, [{ type: 'file', file_id: 'file_notes', mount_path: '/notes.md' }, { type: 'file', file_id: 'file_draft', mount_path: '/draft.md' }]);
  assert.deepEqual(params.budget, { type: 'limit', max_list_cost: { amount: '20', currency: 'USD' } });
  assert.throws(() => createLiveLab03Port(base, null as unknown as Sandbox, undefined, {}), /disabled or configuration is incomplete/);
});

test('container and host path guards reject traversal, outside absolutes, Windows paths, NUL bytes and symlink escapes', async () => {
  assert.equal(resolveContainerPath('draft.md').path, '/workspace/draft.md');
  assert.deepEqual(resolveContainerPath('/mnt/session/outputs/draft.md'), { root: 'outputs', relative: 'draft.md', path: '/mnt/session/outputs/draft.md' });
  for (const value of ['../etc/passwd', '/workspace/../etc/passwd', '/mnt/session/outputs/../uploads/notes.md', '/etc/passwd', '/mnt/session',
    '/workspacex/a', 'C:\\Windows\\win.ini', 'C:/Windows/win.ini', '\\\\server\\share\\x', '//server/share/x', 'a\\b', 'draft\0.md', '', 42])
    assert.throws(() => resolveContainerPath(value), PathRejected, String(value));
  await withSandbox(async (sandbox) => {
    assert.equal(await sandbox.hostPath('outputs/draft.md'), path.join(sandbox.dir, 'outputs', 'draft.md'));
    const outside = await mkdtemp(path.join(tmpdir(), 'lab03-outside-'));
    try {
      for (const value of [outside, path.join(outside, 'x.md'), '../x.md', 'outputs/../../x.md', 'C:\\x.md', '\\\\server\\share', 'a\0b'])
        await assert.rejects(sandbox.hostPath(value), PathRejected, value);
      // Junctions need no Windows privilege and are reported as symbolic links.
      await symlink(outside, path.join(sandbox.dir, 'outputs', 'escape'), 'junction');
      await assert.rejects(sandbox.hostPath('outputs/escape/x.md'), /symlink escapes/);
      await assert.rejects(sandbox.writeText('outputs/escape/x.md', 'no'), PathRejected);
      assert.equal(await readFile(path.join(outside, 'x.md'), 'utf8').catch(() => null), null);
      assert.equal((await sandbox.list()).some((file) => file.path.includes('escape')), false);
      await assert.rejects(sandbox.containerToHost('/mnt/session/outputs/escape/x.md'), /symlink escapes/);
    } finally { await rm(outside, { recursive: true, force: true }); }
  });
});

test('bash allowlist is exact and host confirmations run inputs through the same guard', () => {
  assert.deepEqual(checkBash('cp /mnt/session/uploads/draft.md /mnt/session/outputs/draft.md'), { allowed: true });
  for (const command of ['cat /etc/passwd', 'ls /workspace; rm -rf /', 'ls  /workspace', 'cat /mnt/session/uploads/../../etc/passwd',
    'rm -rf /workspace', 'ls /workspace && curl example.com', 42, undefined])
    assert.equal(checkBash(command).allowed, false, String(command));
  const deniedWrite = decideConfirmation('denied-write', 'sevt_1', 'write', { file_path: '/mnt/session/outputs/draft.md', content: 'x' });
  assert.equal(deniedWrite.result, 'deny'); assert.match(deniedWrite.denyMessage!, /host denied write/);
  assert.equal(decideConfirmation('permitted-edit', 'sevt_2', 'edit', { file_path: '/mnt/session/outputs/draft.md' }).result, 'allow');
  for (const file_path of ['/mnt/session/uploads/draft.md', '/mnt/session/outputs/../../../etc/hosts', '/etc/hosts', '/mnt/session/outputs/other.md', 'C:\\draft.md'])
    assert.equal(decideConfirmation('permitted-edit', 'sevt_3', 'edit', { file_path }).result, 'deny', file_path);
  assert.equal(decideConfirmation('permitted-edit', 'sevt_4', 'bash', { command: 'cat /etc/passwd' }).result, 'deny');
  assert.equal(decideConfirmation('permitted-edit', 'sevt_5', 'mcp_tool', {}).result, 'deny');
});

test('read-only and unavailable Write leave files untouched; unavailable is a deny with no evaluation', async () => {
  await withSandbox(async (sandbox) => {
    const { result } = await runFixture(base, sandbox);
    assert.equal(result.outcome.kind, 'completed'); assert.deepEqual(result.denials, []); assert.deepEqual(result.confirmations, []);
    assert.deepEqual(result.toolUses.map((u) => [u.name, u.state]), [['read', 'allowed'], ['glob', 'allowed'], ['grep', 'allowed']]);
    assert.match(result.toolUses[2]!.result!.text, /notes\.md:4:TODO/);
    assert.equal(await disk(sandbox, 'uploads/draft.md'), fixtureFiles['draft.md']);
    assert.equal(await disk(sandbox, 'outputs/draft.md'), null);
  });
  await withSandbox(async (sandbox) => {
    const { result, port } = await runFixture({ ...base, preset: 'unavailable-write' }, sandbox);
    const write = result.toolUses.find((u) => u.name === 'write')!;
    assert.deepEqual([write.evaluatedPermission, write.evaluationType, write.state], ['deny', null, 'unavailable']);
    assert.equal(write.result?.isError, true);
    assert.deepEqual(result.denials.map((d) => [d.tool, d.kind, d.by]), [['write', 'unavailable', 'session-toolset']]);
    assert.equal(port.calls.some((call) => call.startsWith('confirm')), false, 'nothing to confirm for a tool that is not enabled');
    assert.equal(await disk(sandbox, 'outputs/draft.md'), null);
  });
});

test('denied Write pauses, the host denies by sevt_ ID with a deny_message, and nothing is written', async () => {
  await withSandbox(async (sandbox) => {
    const { result, port, frames } = await runFixture({ ...base, preset: 'denied-write' }, sandbox);
    const write = result.toolUses.find((u) => u.name === 'write')!;
    assert.deepEqual([write.evaluatedPermission, write.evaluationType, write.state], ['ask', 'always_ask', 'denied-by-host']);
    assert.ok(frames.some((f) => f.kind === 'lifecycle' && /requires_action for sevt_tool_2/.test(f.detail)));
    assert.deepEqual(port.calls.filter((c) => c.startsWith('confirm')), ['confirm:sevt_tool_2=deny']);
    assert.equal(write.result?.isError, true); assert.match(write.result!.text, /host denied write/);
    assert.deepEqual(result.denials.map((d) => [d.tool, d.kind, d.by]), [['write', 'denied', 'host']]);
    assert.equal(result.outcome.kind, 'completed');
    assert.equal(await disk(sandbox, 'outputs/draft.md'), null);
  });
});

test('permitted edit changes only the fixture copy; traversal attempts are denied by the host', async () => {
  await withSandbox(async (sandbox) => {
    const { result, port } = await runFixture({ ...base, preset: 'permitted-edit' }, sandbox);
    assert.deepEqual(port.calls.filter((c) => c.startsWith('confirm')),
      ['confirm:sevt_tool_2=allow', 'confirm:sevt_tool_3=deny', 'confirm:sevt_tool_4=allow', 'confirm:sevt_tool_5=deny']);
    assert.deepEqual(result.toolUses.map((u) => u.state), ['allowed', 'allowed-by-host', 'denied-by-host', 'allowed-by-host', 'denied-by-host']);
    assert.match((await disk(sandbox, 'outputs/draft.md'))!, /^Status: reviewed$/m);
    assert.equal(await disk(sandbox, 'uploads/draft.md'), fixtureFiles['draft.md'], 'the read-only upload is unchanged');
    assert.equal(result.files.find((f) => f.path === 'outputs/draft.md')?.writable, true);
  });
});

test('auto denies a high-risk call server-side; it is denied, not unavailable', async () => {
  await withSandbox(async (sandbox) => {
    const { result } = await runFixture({ ...base, preset: 'auto' }, sandbox);
    const write = result.toolUses.find((u) => u.name === 'write')!;
    assert.deepEqual([write.evaluatedPermission, write.evaluationType, write.reasonCode, write.state], ['deny', 'auto', 'high_risk', 'denied-by-server']);
    assert.deepEqual(result.denials.map((d) => [d.kind, d.by]), [['denied', 'server-auto']]);
    assert.match((await disk(sandbox, 'outputs/draft.md'))!, /Status: reviewed/);
  });
});

test('student challenge: removing edit makes the edit unavailable and the copy stays identical to the original', async () => {
  await withSandbox(async (sandbox) => {
    const { result } = await runFixture({ ...base, preset: 'permitted-edit', removeTools: ['edit'] }, sandbox);
    assert.deepEqual(result.toolUses.filter((u) => u.name === 'edit').map((u) => u.state), ['unavailable', 'unavailable']);
    assert.equal(result.confirmations.some((c) => c.tool === 'edit'), false);
    assert.equal(await disk(sandbox, 'outputs/draft.md'), fixtureFiles['draft.md']);
  });
});

test('cancel stops waiting, attempts user.interrupt and still reports files', async () => {
  await withSandbox(async (sandbox) => {
    const controller = new AbortController(); const request = { ...base, preset: 'permitted-edit' as const, scenario: 'hang' as const };
    const port = createFixtureLab03Port(request, sandbox, 0);
    const result = await runLab03(request, port, sandbox, controller.signal, (frame) => { if (frame.kind === 'tool_result') controller.abort(); }, 10);
    assert.equal(result.outcome.kind, 'cancelled'); assert.equal(result.interruption, 'simulated');
    assert.ok(port.calls.indexOf('interrupt') > port.calls.indexOf('send'));
    assert.equal(result.files.length, 2);
    const deadline = await runLab03({ ...request, deadlineSeconds: 1 }, createFixtureLab03Port(request, sandbox, 0), sandbox, new AbortController().signal, () => {}, 10);
    assert.equal(deadline.outcome.kind, 'deadline');
  });
});

type Call = { method: string; path: string; search: string; body: unknown };
function mockSdk(log: Call[]) {
  const at = '2026-01-01T00:00:00Z';
  const agent = { id: 'agent_test', version: 2, type: 'agent', name: 'Fixture', model: { id: 'm' }, system: null, mcp_servers: [], skills: [], multiagent: null,
    tools: [{ type: 'agent_toolset_20260401', default_config: { enabled: false, permission_policy: { type: 'always_allow' } },
      configs: [{ name: 'write', type: 'write', enabled: true, permission_policy: { type: 'always_ask' } }, { name: 'edit', type: 'edit', enabled: false, permission_policy: { type: 'always_allow' } }] }] };
  let uploads = 0;
  return new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    const location = new URL(String(url));
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body ? '[multipart]' : undefined;
    log.push({ method: init?.method ?? 'GET', path: location.pathname, search: location.search, body });
    if (location.pathname.startsWith('/v1/agents/')) return Response.json({ ...agent, tools: [] });
    if (location.pathname === '/v1/files' && init?.method === 'POST')
      return Response.json({ id: `file_up_${++uploads}`, type: 'file', filename: 'x.md', mime_type: 'text/markdown', size_bytes: 10, created_at: at });
    // Like the real API: filtering by scope_id is rejected without the managed-agents beta header.
    if (location.pathname === '/v1/files' && location.searchParams.has('scope_id')
      && !new Headers(init?.headers).get('anthropic-beta')?.split(',').includes('managed-agents-2026-04-01'))
      return Response.json({ type: 'error', error: { type: 'invalid_request_error', message: 'scope_id requires the managed-agents beta' } }, { status: 400 });
    if (location.pathname === '/v1/files') return Response.json({ data: [
      // Like the real API: the session copy of a mounted upload is listed too, with the same name, and is not downloadable.
      { id: 'file_in_copy', type: 'file', filename: 'draft.md', mime_type: 'text/markdown', size_bytes: 18, created_at: at, downloadable: false },
      { id: 'file_out', type: 'file', filename: 'draft.md', mime_type: 'text/markdown', size_bytes: 20, created_at: at, downloadable: true },
      { id: 'file_bad', type: 'file', filename: '../escape.md', mime_type: 'text/markdown', size_bytes: 5, created_at: at, downloadable: true }],
      has_more: false, first_id: 'file_out', last_id: 'file_bad' });
    if (location.pathname === '/v1/files/file_out/content') return new Response('# Draft\n\nStatus: reviewed\n');
    if (location.pathname.startsWith('/v1/files/') && init?.method === 'DELETE') return Response.json({ id: location.pathname.split('/').pop(), type: 'file_deleted' });
    if (location.pathname.endsWith('/events/stream')) {
      const events = [
        { type: 'session.status_running', id: 'sevt_run', processed_at: at },
        { type: 'agent.tool_use', id: 'sevt_abc', name: 'write', input: { file_path: '/mnt/session/outputs/draft.md', content: 'x' }, processed_at: at,
          evaluated_permission: 'ask', evaluation: { type: 'always_ask' } },
        { type: 'session.status_idle', id: 'sevt_idle_1', processed_at: at, stop_details: null, stop_reason: { type: 'requires_action', event_ids: ['sevt_abc'] } },
        { type: 'agent.tool_result', id: 'sevt_res', tool_use_id: 'sevt_abc', processed_at: at, is_error: true, content: [{ type: 'text', text: 'denied' }] },
        { type: 'agent.tool_use', id: 'sevt_edit', name: 'edit', input: { file_path: 'draft.md' }, processed_at: at, evaluated_permission: 'deny' },
        { type: 'agent.message', id: 'sevt_msg', processed_at: at, content: [{ type: 'text', text: 'I could not write.' }] },
        { type: 'session.status_idle', id: 'sevt_idle_2', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } } ];
      return new Response(events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
    }
    return Response.json({ id: 'sesn_test', type: 'session', status: 'idle', environment_id: 'env_test', agent,
      budget: { type: 'limit', max_list_cost: { amount: '50', currency: 'USD' } } });
  } });
}

test('real installed SDK: uploads, overrides, sevt_ tool_confirmation round-trip, scoped output download and upload cleanup', async () => {
  await withSandbox(async (sandbox) => {
    const request: Lab03Request = { ...base, mode: 'live', preset: 'denied-write' }; const log: Call[] = [];
    const result = await runLab03(request, createLiveLab03Port(request, sandbox, mockSdk(log), env), sandbox, new AbortController().signal, () => {}, 10);
    assert.equal(result.outcome.kind, 'completed', result.message);
    assert.equal(log.filter((c) => c.path === '/v1/files' && c.method === 'POST').length, 2);
    const create = log.find((c) => c.path === '/v1/sessions')!.body as { agent: Record<string, unknown>; resources: unknown[] };
    assert.deepEqual(create.agent, { type: 'agent_with_overrides', id: 'agent_test', tools: [buildToolset('denied-write')], mcp_servers: [], skills: [] });
    assert.deepEqual(create.resources, [{ type: 'file', file_id: 'file_up_1', mount_path: '/notes.md' }, { type: 'file', file_id: 'file_up_2', mount_path: '/draft.md' }]);
    assert.equal(log.some((c) => c.path.startsWith('/v1/agents') && c.method !== 'GET'), false, 'the shared agent is never updated');
    const sends = log.filter((c) => c.path.endsWith('/events') && c.method === 'POST').map((c) => (c.body as { events: { type: string }[] }).events);
    assert.deepEqual(sends.map((events) => events[0]!.type), ['user.message', 'user.tool_confirmation']);
    assert.deepEqual(sends[1], [{ type: 'user.tool_confirmation', tool_use_id: 'sevt_abc', result: 'deny',
      deny_message: 'The host denied write. Leave the draft unchanged and report this.' }]);
    assert.deepEqual(result.denials.map((d) => [d.toolUseId, d.kind, d.by]), [['sevt_abc', 'denied', 'host'], ['sevt_edit', 'unavailable', 'session-toolset']]);
    assert.ok(log.some((c) => c.path === '/v1/files' && c.method === 'GET' && c.search.includes('scope_id=sesn_test')));
    assert.equal(log.some((c) => c.path.includes('file_bad')), false, 'unsafe output names are never downloaded');
    assert.equal(log.some((c) => c.path.includes('file_in_copy')), false, 'session copies of uploads are never downloaded');
    assert.equal(result.outputs.status, 'downloaded'); assert.match(result.outputs.detail, /Skipped: \.\.\/escape\.md/);
    assert.equal(await disk(sandbox, 'outputs/draft.md'), '# Draft\n\nStatus: reviewed\n');
    assert.deepEqual(log.filter((c) => c.method === 'DELETE').map((c) => c.path), ['/v1/files/file_up_1', '/v1/files/file_up_2']);
    assert.equal(result.uploads, 'deleted'); assert.equal(result.cleanup, 'archived');
    assert.deepEqual(result.effectiveTools?.map((t) => [t.name, t.enabled, t.policy]), [['write', true, 'always_ask'], ['edit', false, null]]);
  });
});

test('router: 400 before any provider work, 422 for unconfigured live, 429 at capacity, files, reset and cancellation', async () => {
  let factoryCalls = 0, interrupts = 0;
  const router = createLab03Router((request, sandbox) => {
    factoryCalls++;
    if (request.prompt === 'unconfigured') throw new Error('not ready');
    const fixture = createFixtureLab03Port({ ...request, mode: 'scripted', scenario: 'hang' }, sandbox, 0);
    return { ...fixture, async interrupt() { interrupts++; } };
  }, 0);
  const app = express(); app.use('/api/c3', router.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c3`;
  const post = (body: unknown, signal: AbortSignal | null = null) => fetch(`${root}/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  try {
    const sdkOnly = await post({ ...base, mode: 'live', allowedTools: ['Write'], cwd: '/tmp' });
    assert.equal(sdkOnly.status, 400); assert.match((await sdkOnly.json()).error.message, /allowedTools, cwd are Agent SDK options/);
    for (const body of [{ ...base, mode: 'live', preset: 'all' }, { ...base, mode: 'live', deadlineSeconds: 500 }, { ...base, mode: 'live', removeTools: ['bash', 'bash'] }])
      assert.equal((await post(body)).status, 400);
    assert.equal(factoryCalls, 0);
    assert.equal((await post({ ...base, mode: 'live', prompt: 'unconfigured' })).status, 422);

    const files = await (await fetch(`${root}/files`)).json();
    assert.deepEqual(files.files.map((f: { path: string }) => f.path), ['uploads/draft.md', 'uploads/notes.md']);

    const controllers = [new AbortController(), new AbortController()];
    for (const controller of controllers) await post({ ...base, mode: 'live', preset: 'permitted-edit' }, controller.signal);
    assert.equal((await post(base)).status, 429);
    assert.equal((await fetch(`${root}/reset`, { method: 'POST' })).status, 429, 'reset waits for the active run');
    controllers.forEach((c) => c.abort());
    for (let i = 0; i < 80 && interrupts < 2; i++) await delay(25);
    assert.equal(interrupts, 2);
    // Interrupt acknowledgment precedes archive/output cleanup and slot release.
    let done: Response;
    const until = Date.now() + 5000;
    do { done = await post({ ...base, preset: 'permitted-edit' });
      if (done.status !== 429) break;
      await done.arrayBuffer(); await delay(25);
    } while (Date.now() < until);
    assert.equal(done.status, 200); assert.match(await done.text(), /"kind":"completed"/);
    const after = await (await fetch(`${root}/files`)).json();
    assert.match(after.files.find((f: { path: string }) => f.path === 'outputs/draft.md').content, /Status: reviewed/);
    const reset = await (await fetch(`${root}/reset`, { method: 'POST' })).json();
    assert.equal(reset.files.some((f: { path: string }) => f.path.startsWith('outputs/')), false);
    assert.equal((await fetch(`${root}/files`, { headers: { Origin: 'http://evil.example' } })).status, 403);
  } finally { await router.close(); server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
});

test('every preset prompt is valid and names only container paths', () => {
  for (const preset of lab03Presets) {
    assert.equal(lab03RequestSchema.safeParse({ ...base, preset, prompt: presets[preset].prompt }).success, true);
    for (const match of presets[preset].prompt.matchAll(/\/[\w./-]+/g)) assert.doesNotThrow(() => resolveContainerPath(match[0].replace(/\.$/, '')), match[0]);
  }
});
