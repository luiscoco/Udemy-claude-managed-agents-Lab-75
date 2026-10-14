import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lab11Question, lab11RequestSchema, lab11Variants, pinManifestSchema } from '../shared/lab11-skills.js';
import { readSkillBundle } from '../server/lib/lab11-bundle.js';
import { createFixtureLab11Port, createLiveLab11Port, lab11SessionParams, lab11Toolset, verifyLab11ResolvedSkills } from '../server/lib/lab11-port.js';
import { runLab11 } from '../server/lib/lab11-run.js';
import { createLab11Router } from '../server/concepts/11-skills.js';
import { uploadSkillBundle } from '../scripts/lab11-skills-setup.js';
import type { StreamEvent } from '../server/lib/session-events.js';

const input = { mode: 'scripted' as const, variant: 'with-skill' as const, prompt: lab11Question, deadlineSeconds: 10 };
const env = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test' };
const run = async (extra: Partial<import('../shared/lab11-skills.js').Lab11Request> = {}) => { const q = { ...input, ...extra };
  return runLab11(q, await createFixtureLab11Port(q, 0), new AbortController().signal, () => {}, 10); };

test('authored bundles verify frontmatter, complete snapshots, omitted reference and distinct hashes', async () => {
  const bundles = await Promise.all(['v1', 'missing-reference', 'v2'].map(v => readSkillBundle(v as 'v1')));
  assert.deepEqual(bundles.map(b => b.files.length), [2, 1, 2]); assert.equal(new Set(bundles.map(b => b.hash)).size, 3);
  for (const b of bundles) assert.match(b.files[0]!.text, /^---\nname: format-observation/);
  assert.match(bundles[2]!.files[1]!.text, /Data gaps/);
  await assert.rejects(readSkillBundle('../../.env' as 'v1'));
});
test('closed requests reject Agent SDK fields, path injection, live fixture control and unpinned latest', () => {
  for (const key of ['allowedTools', 'disable-model-invocation', 'skillPath', 'skills', 'plugins', 'sessionId', 'subagentPreload'])
    assert.equal(lab11RequestSchema.safeParse({ ...input, [key]: '../../.env' }).success, false);
  assert.equal(lab11RequestSchema.safeParse({ ...input, mode: 'live', scenario: 'metadata-only' }).success, false);
  assert.equal(pinManifestSchema.safeParse({ schemaVersion: 1, pins: { v1: { skillId: 'skill_test', version: 'latest', bundleHash: 'a'.repeat(64) } } }).success, false);
});
test('five comparisons use four fresh sessions and separate attachment, instruction and reference evidence', async () => {
  const ids = new Set<string>();
  for (const variant of lab11Variants) { const r = await run({ variant }); assert.equal(r.reportedUsage, null);
    if (variant === 'missing-id') { assert.equal(r.sessionId, null); assert.equal(r.outcome.kind, 'error'); continue; }
    ids.add(r.sessionId!); assert.equal(r.cleanup, 'simulated'); assert.equal(r.outcome.kind, 'completed');
    if (variant === 'without-skill') { assert.equal(r.configured, null); assert.deepEqual(r.reads, []); }
    else { assert.equal(r.resolvedSkills?.length, 1); assert.equal(r.reads[0]!.state, 'succeeded'); assert.equal(r.reads[0]!.contentMatchesBundle, true);
      assert.equal(r.reads[1]!.state, variant === 'absent-reference' ? 'failed' : 'succeeded'); }
  } assert.equal(ids.size, 4);
});
test('metadata-only, failed and duplicate reads never manufacture successful loading or usage', async () => {
  const metadata = await run({ scenario: 'metadata-only' }); assert(metadata.configured); assert.deepEqual(metadata.reads, []);
  const failure = await run({ scenario: 'failed-read' }); assert(failure.reads.every(r => r.state === 'failed' && r.contentMatchesBundle === null));
  const repeated = await run({ scenario: 'duplicate-events' }); assert.equal(repeated.reads.length, 2); assert.equal(repeated.toolUses.length, 2);
  assert(repeated.reads.every(r => r.state === 'succeeded'));
});
test('agent claims, unmatched tool results, unrelated paths and worker cross-posts are not skill reads', async () => {
  const p = await createFixtureLab11Port(input, 0); const at = '2026-10-14T00:00:00Z';
  p.open = async () => (async function* () {
    for (const [id, path, thread] of [['wrong', '/tmp/SKILL.md', null], ['traversal', '/skills/x/../format-observation/SKILL.md', null], ['worker', '/skills/format-observation/SKILL.md', 'thread_other']])
      yield { type: 'agent.tool_use', id, processed_at: at, name: 'read', input: { file_path: path }, session_thread_id: thread } as StreamEvent;
    yield { type: 'agent.tool_result', id: 'unmatched', processed_at: at, tool_use_id: 'missing', is_error: false, content: [{ type: 'text', text: 'Read successfully' }] } as StreamEvent;
    yield { type: 'agent.message', id: 'claim', processed_at: at, content: [{ type: 'text', text: 'I read SKILL.md and the reference' }] } as StreamEvent;
    yield { type: 'session.status_idle', id: 'idle', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } } as StreamEvent;
  })();
  assert.deepEqual((await runLab11(input, p, new AbortController().signal, () => {}, 10)).reads, []);
});
test('cancel, deadline and cancellation during creation preserve returned ID for bounded cleanup', async () => {
  for (const late of [false, true]) {
    const controller = new AbortController(); const p = await createFixtureLab11Port({ ...input, scenario: 'hang' }, 0); const create = p.create;
    if (late) p.create = async () => { await delay(30); return create(); };
    const pending = runLab11({ ...input, scenario: 'hang' }, p, controller.signal, () => {}, 10); await delay(10); controller.abort(); const r = await pending;
    assert.equal(r.outcome.kind, 'cancelled'); assert(r.sessionId); assert(p.calls.includes('archive')); assert.equal(p.calls.includes('interrupt'), !late);
  }
  const timed = await run({ scenario: 'hang', deadlineSeconds: 1 }); assert.equal(timed.outcome.kind, 'deadline'); assert.equal(timed.interruption, 'simulated');
});
test('real SDK transport pins exact skill/version and base, opens stream first and never uploads in a run', async () => {
  const bundle = await readSkillBundle('v1'); const pin = { skillId: 'skill_test', version: 'version_test', bundleHash: bundle.hash };
  const log: Array<{ path: string; method: string; body: any }> = []; let mismatch = false; let alias = false; let aliasLookupFailed = false;
  const base = { id: 'agent_test', version: 3, model: { id: 'base-model' }, system: 'Base.', multiagent: null, archived_at: null };
  let resolved: any = { ...base, tools: [lab11Toolset], skills: [{ type: 'custom', skill_id: pin.skillId, version: pin.version }], mcp_servers: [] };
  const fixture = await createFixtureLab11Port(input, 0); await fixture.send('id', 'prompt', new AbortController().signal);
  const events: StreamEvent[] = []; for await (const e of await fixture.open('id', new AbortController().signal)) events.push(e);
  const span: StreamEvent = { type: 'span.model_request_end', id: 'span', processed_at: '2026-10-14T00:00:00Z', model_request_start_id: 'start', is_error: false,
    model_usage: { input_tokens: 12, output_tokens: 6, cache_creation_input_tokens: 3, cache_read_input_tokens: 2 } };
  events.splice(events.length - 1, 0, span, span);
  const sdk = new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    const path = new URL(String(url)).pathname; const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    log.push({ path, method: init?.method ?? 'GET', body });
    if (path.startsWith('/v1/agents/')) return Response.json(base);
    if (path.includes('/versions/')) { if (aliasLookupFailed && path.endsWith('/1791993629073853')) return Response.json({ error: { type: 'not_found_error', message: 'Authored unavailable alias' } }, { status: 404 });
      return Response.json({ id: pin.version, skill_id: pin.skillId, name: bundle.name, description: bundle.description }); }
    if (path === '/v1/sessions' && init?.method === 'POST') { resolved = { ...base, ...body.agent, model: base.model };
      if (alias) resolved.skills = [{ type: 'custom', skill_id: pin.skillId, version: '1791993629073853' }];
      if (mismatch) resolved.skills = [{ type: 'custom', skill_id: 'skill_unwanted', version: 'unexpected' }]; }
    if (path.endsWith('/events/stream')) return new Response(events.map(e => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
    return Response.json({ id: 'sesn_test', status: 'idle', agent: resolved, environment_id: 'env_test', budget: null });
  } });
  const q = { ...input, mode: 'live' as const }; const p = await createLiveLab11Port(q, sdk, env, pin);
  const r = await runLab11(q, p, new AbortController().signal, () => {}, 10); assert.equal(r.outcome.kind, 'completed'); assert.equal(r.cleanup, 'archived'); assert.equal(r.reads.length, 2);
  assert.equal(r.reportedUsage?.requests, 1); assert.equal(r.reportedUsage?.inputTokens, 12); assert.equal(r.reportedUsage?.cacheReadTokens, 2);
  const create = log.find(x => x.path === '/v1/sessions')!.body;
  assert.equal(create.agent.version, 3); assert.deepEqual(create.agent.skills, [{ type: 'custom', skill_id: pin.skillId, version: pin.version }]);
  assert.deepEqual(create.agent.tools, [lab11Toolset]); assert.equal(Object.hasOwn(create.agent, 'system'), false); assert.equal(Object.hasOwn(create.agent, 'model'), false);
  assert(log.findIndex(x => x.path.endsWith('/events/stream')) < log.findIndex(x => x.body?.events?.[0]?.type === 'user.message'));
  assert.equal(log.some(x => x.path.startsWith('/v1/skills') && x.method !== 'GET'), false);
  assert.throws(() => lab11SessionParams(q, base, null, env));
  assert.throws(() => lab11SessionParams(q, base, { ...pin, version: 'latest' }, env));
  await assert.rejects(createLiveLab11Port({ ...q, variant: 'missing-id' }, sdk, env, pin), /No skill ID/);
  alias = true; log.length = 0;
  const aliased = await runLab11(q, await createLiveLab11Port(q, sdk, env, pin), new AbortController().signal, () => {}, 10);
  assert.equal(aliased.outcome.kind, 'completed'); assert.equal(aliased.cleanup, 'archived');
  assert.equal(aliased.resolvedSkills?.[0]?.version, '1791993629073853'); assert.equal(aliased.resolvedSkills?.[0]?.canonicalVersion, pin.version);
  assert(log.some(x => x.path.endsWith('/versions/1791993629073853')));
  aliasLookupFailed = true; log.length = 0;
  const unverified = await runLab11(q, await createLiveLab11Port(q, sdk, env, pin), new AbortController().signal, () => {}, 10);
  assert.equal(unverified.outcome.kind, 'error'); assert.equal(unverified.sessionId, 'sesn_test'); assert.equal(unverified.cleanup, 'archived');
  assert.equal(log.some(x => x.body?.events?.[0]?.type === 'user.message'), false);
  aliasLookupFailed = false;
  mismatch = true; log.length = 0;
  const rejected = await runLab11(q, await createLiveLab11Port(q, sdk, env, pin), new AbortController().signal, () => {}, 10);
  assert.equal(rejected.outcome.kind, 'error'); assert.equal(rejected.sessionId, 'sesn_test'); assert.equal(rejected.cleanup, 'archived');
  assert.equal(log.some(x => x.body?.events?.[0]?.type === 'user.message'), false);
  assert(log.some(x => x.path.endsWith('/archive')));
});
test('numeric resolved versions require exact scoped identity; wrong, latest and failed lookups fail closed', async () => {
  const pin = { skillId: 'skill_test', version: 'skver_pinned', bundleHash: 'a'.repeat(64) };
  for (const scenario of ['matching', 'wrong-version', 'wrong-skill', 'unavailable']) {
    const calls: string[] = [];
    const sdk = new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async url => {
      calls.push(new URL(String(url)).pathname);
      if (scenario === 'unavailable') return Response.json({ error: { type: 'not_found_error', message: 'Authored unavailable alias' } }, { status: 404 });
      return Response.json({ id: scenario === 'wrong-version' ? 'skver_other' : pin.version, skill_id: scenario === 'wrong-skill' ? 'skill_other' : pin.skillId });
    } });
    const resolved: NonNullable<import('../shared/lab11-skills.js').Lab11Result['resolvedSkills']> = [{ type: 'custom', skillId: pin.skillId, version: '1791993629073853' }];
    assert.equal(await verifyLab11ResolvedSkills(sdk, resolved, pin), scenario === 'matching');
    assert.equal(resolved[0]!.canonicalVersion, scenario === 'matching' ? pin.version : null);
    assert.deepEqual(calls, ['/v1/skills/skill_test/versions/1791993629073853']);
    calls.length = 0;
    for (const version of ['latest', 'skver_other', '../../latest']) assert.equal(await verifyLab11ResolvedSkills(sdk, [{ type: 'custom', skillId: pin.skillId, version }], pin), false);
    assert.equal(await verifyLab11ResolvedSkills(sdk, [{ type: 'custom', skillId: 'skill_other', version: '1791993629073853' }], pin), false);
    assert.deepEqual(calls, []);
  }
});
test('explicit upload uses Skills multipart API and full relative filenames, returns immutable pin', async () => {
  const bundle = await readSkillBundle('v2'); const paths: string[] = [], files: string[] = [];
  const sdk = new Anthropic({ apiKey: 'offline-only', maxRetries: 0, fetch: async (url, init) => {
    if (String(url).startsWith('data:')) return fetch(url, init); // SDK multipart capability probe; no network.
    paths.push(new URL(String(url)).pathname); const request = new Request(String(url), init); const form = await request.formData();
    for (const value of form.values()) if (value instanceof File) files.push(value.name);
    return Response.json({ id: 'version_new', skill_id: 'skill_test', name: bundle.name });
  } });
  const pin = await uploadSkillBundle(sdk, bundle, 'skill_test'); assert.equal(pin.version, 'version_new'); assert.equal(pin.bundleHash, bundle.hash);
  assert.deepEqual(paths, ['/v1/skills/skill_test/versions']); assert.deepEqual(files.sort(), ['format-observation/SKILL.md', 'format-observation/references/format.md'].sort());
});
test('HTTP previews are host-only, absent files are 404 and injection is rejected before provider access', async () => {
  let calls = 0; const lab = createLab11Router(async q => { calls++; return createFixtureLab11Port(q, 0); }, 0);
  const app = express(); app.use('/api/c11', lab.router); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string'); const root = `http://127.0.0.1:${address.port}/api/c11`;
  const post = (path: string, body: unknown, owner = 'test') => fetch(root + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner }, body: JSON.stringify(body) });
  try {
    const catalog = await (await fetch(root + '/skills')).json() as any; assert.equal(catalog.bundles.length, 3); assert.equal(calls, 0);
    const preview = await (await post('/load', { revision: 'v1', file: 'SKILL.md' })).json() as any; assert.equal(preview.agentRead, false);
    assert.equal((await post('/load', { revision: 'missing-reference', file: 'references/format.md' })).status, 404);
    assert.equal((await post('/load', { revision: 'v1', file: '../../.env' })).status, 400);
    assert.equal((await post('/invoke', { ...input, mode: 'live', skills: [] })).status, 400); assert.equal(calls, 0);
    for (const path of ['/invoke', '/new-session']) { const response = await post(path, input); assert.equal(response.status, 200); assert.match(await response.text(), /succeeded/); }
    const badOrigin = await fetch(root + '/skills', { headers: { Origin: 'https://example.invalid' } }); assert.equal(badOrigin.status, 403);
  } finally { await lab.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
test('router reserves owner and global capacity before async preparation, rejects remote ID injection and closes pending preparation', async () => {
  let release!: () => void; const gate = new Promise<void>(r => { release = r; }); let creates = 0;
  const lab = createLab11Router(async q => { await gate; const p = await createFixtureLab11Port(q, 0); const create = p.create; p.create = async () => { creates++; return create(); }; return p; });
  const app = express(); app.use('/api/c11', lab.router); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); const a = server.address(); assert(a && typeof a !== 'string');
  const url = `http://127.0.0.1:${a.port}/api/c11/invoke`;
  const post = (owner: string, extra = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner }, body: JSON.stringify({ ...input, mode: 'live', ...extra }) });
  let pending: Promise<Response>[] = [];
  try {
    assert.equal((await post('one', { sessionId: 'sesn_other' })).status, 400);
    pending = [post('one')]; await delay(30); assert.equal((await post('one')).status, 429);
    pending.push(post('two')); await delay(30); assert.equal((await post('three')).status, 429);
    const closed = lab.close(); release(); await closed; assert.equal(creates, 0);
  } finally { release(); await lab.close(); server.closeAllConnections(); await Promise.allSettled(pending); await new Promise<void>(r => server.close(() => r())); }
});
