import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import { lab18AvailabilityResultSchema, lab18AvailabilitySchema, lab18RunSchema } from '../shared/lab18-sandbox.js';
import { createLab18Router } from '../server/concepts/18-sandbox.js';
import { hostFixtureMount, hostFixtureText, lab18Confirmation, Lab18Service } from '../server/lib/lab18-sandbox.js';

const env = { ANTHROPIC_API_KEY: 'offline-test-only', MANAGED_AGENT_ID: 'agent_fixture', MANAGED_ENVIRONMENT_ID: 'env_fixture', MANAGED_LIVE_ENABLED: 'true' };
const input = lab18RunSchema.parse({ mode: 'scripted', scenario: 'allowed-mount', deadlineSeconds: 5, budgetCents: 25 });
const restricted = { id: 'env_fixture', updated_at: '2026-01-01T00:00:00Z', archived_at: null,
  config: { type: 'cloud', networking: { type: 'limited', allowed_hosts: [], allow_mcp_servers: false, allow_package_managers: false },
    packages: { apt: [], cargo: [], gem: [], go: [], npm: [], pip: [] } } };

test('closed contracts reject native sandbox flags and unsupported live failure scenarios', () => {
  for (const patch of [{ nativeSandboxFlags: { enabled: true } }, { sandbox: { enabled: true } }, { cwd: 'C:\\Users' },
    { mode: 'live', scenario: 'blocked-network' }, { budgetCents: 0 }, { deadlineSeconds: 121 }])
    assert.equal(lab18RunSchema.safeParse({ ...input, ...patch }).success, false);
  assert.equal(lab18AvailabilitySchema.safeParse({ mode: 'live', scenario: 'missing-environment' }).success, false);
});

test('host confirms only the exact remote pwd command', () => {
  assert.equal(lab18Confirmation('sevt_one', 'bash', { command: 'pwd' }).result, 'allow');
  for (const [name, input] of [['bash', { command: 'pwd; cat /etc/passwd' }], ['bash', { command: 'curl https://example.com' }],
    ['read', { path: '/etc/passwd' }], ['bash', null]] as const)
    assert.equal(lab18Confirmation('sevt_two', name, input).result, 'deny');
});

test('offline host test reads only the approved file, while all other scenarios have no read or network effect', async () => {
  const service = new Lab18Service(undefined, {});
  const platform = service.platform(); assert.equal(platform.liveReady, false); assert.deepEqual(platform.approvedMounts, [hostFixtureMount]);
  const expected = createHash('sha256').update(hostFixtureText).digest('hex');
  const allowed = await service.offline(input);
  assert.equal(allowed.host.readCalls, 1); assert.equal(allowed.host.networkCalls, 0); assert.equal(allowed.host.fileHash, expected);
  assert.equal(allowed.remote.sessionId, null); assert.equal(allowed.availability.sessionStarted, false);
  for (const scenario of ['outside-mount', 'blocked-network', 'missing-environment'] as const) {
    const report = await service.offline({ ...input, scenario });
    assert.equal(report.host.readCalls, 0); assert.equal(report.host.networkCalls, 0); assert.equal(report.host.fileHash, null);
    assert.equal(report.remote.sessionId, null);
    if (scenario === 'missing-environment') { assert.equal(report.availability.ready, false); assert.equal(report.host.fixtureId, null); }
  }
});

test('live metadata inspection starts no session and rejects unexpected cloud networking', async () => {
  let created = 0;
  const fake = { beta: { environments: { retrieve: async () => restricted }, sessions: { create: async () => { created++; } } } } as unknown as Anthropic;
  const service = new Lab18Service(fake, env);
  assert.equal(service.platform().environmentVersion, 'not exposed by SDK 0.133.0');
  const availability = await service.availability('live', 'allowed-mount');
  assert.equal(availability.ready, true); assert.equal(availability.environmentUpdatedAt, restricted.updated_at);
  assert.equal(availability.sessionStarted, false); assert.equal(created, 0);
  const unrestricted = { beta: { environments: { retrieve: async () => ({ ...restricted,
    config: { ...restricted.config, networking: { type: 'unrestricted' } } }) }, sessions: { create: async () => { created++; } } } } as unknown as Anthropic;
  const blocked = await new Lab18Service(unrestricted, env).availability('live', 'allowed-mount');
  assert.equal(blocked.ready, false); assert.equal(created, 0);
  const invalidPin = new Lab18Service(fake, { ...env, MANAGED_AGENT_VERSION: '0' });
  assert.equal(invalidPin.platform().liveReady, false);
  assert.equal((await invalidPin.availability('live', 'allowed-mount')).ready, false);
});

test('live port rechecks restricted environment and creates only an always-ask bash session', async () => {
  const calls: string[] = []; let params: Record<string, unknown> | undefined;
  const fake = { beta: { environments: { retrieve: async () => { calls.push('environment.retrieve'); return restricted; } },
    agents: { retrieve: async () => { calls.push('agent.retrieve'); return { id: 'agent_fixture', version: 7, multiagent: null }; } },
    sessions: { create: async (value: Record<string, unknown>) => { calls.push('session.create'); params = value;
      const agent = value.agent as { tools: unknown[] }; return { id: 'sesn_fixture', status: 'idle', environment_id: 'env_fixture',
        agent: { id: 'agent_fixture', version: 7, tools: agent.tools, mcp_servers: [], skills: [], multiagent: null },
        budget: { max_list_cost: { amount: '25', currency: 'USD' } } }; }, events: { stream: async () => { calls.push('events.stream');
      return { controller: new AbortController(), async *[Symbol.asyncIterator]() {} }; } } } } } as unknown as Anthropic;
  const service = new Lab18Service(fake, env), availability = await service.availability('live', 'allowed-mount');
  const port = service.livePort({ ...input, mode: 'live' }, availability);
  assert.deepEqual(calls, ['environment.retrieve']);
  const result = await port.create(); assert.equal(result.session.id, 'sesn_fixture');
  assert.deepEqual(calls, ['environment.retrieve', 'environment.retrieve', 'agent.retrieve', 'session.create']);
  const toolset = (params?.agent as { tools: { configs: { name: string; enabled: boolean; permission_policy?: { type: string } }[] }[] }).tools[0]!;
  assert.deepEqual(toolset.configs.filter(item => item.enabled).map(item => [item.name, item.permission_policy?.type]), [['bash', 'always_ask']]);
  assert.equal('resources' in (params ?? {}), false); assert.equal('sandbox' in (params ?? {}), false);
  await port.open(result.session.id, new AbortController().signal); assert.equal(calls.at(-1), 'events.stream');
});

test('live port fails closed before session creation when the environment changed', async () => {
  let created = 0;
  const fake = { beta: { environments: { retrieve: async () => ({ ...restricted,
    config: { ...restricted.config, networking: { type: 'unrestricted' } } }) },
    agents: { retrieve: async () => { throw new Error('agent retrieval must not occur'); } },
    sessions: { create: async () => { created++; } } } } as unknown as Anthropic;
  const service = new Lab18Service(fake, env);
  await assert.rejects(service.livePort({ ...input, mode: 'live' }, { source: 'managed-api', ready: true, environmentId: 'env_fixture',
    environmentUpdatedAt: restricted.updated_at, environmentVersion: 'not exposed by SDK 0.133.0', cloud: true, archived: false,
    networking: 'limited', allowedHosts: [], approvedMounts: [], sessionStarted: false, reason: 'Previously checked.' }).create(), /changed/);
  assert.equal(created, 0);
});

test('HTTP validates before effects, serves local platform, and keeps offline results separate from live', async () => {
  const service = new Lab18Service(undefined, {}), concept = createLab18Router(service), app = express(); app.use('/api/c18', concept.router);
  const server = app.listen(0); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c18`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: unknown) => fetch(`${root}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  try {
    const platform = await (await fetch(`${root}/platform`)).json(); assert.equal(platform.liveReady, false);
    assert.equal((await post('run', { ...input, sandbox: { enabled: true } })).status, 400);
    assert.equal((await post('run', { ...input, mode: 'live' })).status, 422);
    const availability = await (await post('availability', { mode: 'scripted', scenario: 'missing-environment' })).json();
    assert.equal(availability.ready, false); assert.equal(availability.sessionStarted, false);
    const report = await (await post('run', input)).json(); assert.equal(report.host.readCalls, 1); assert.equal(report.remote.sessionId, null);
  } finally { await concept.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('concurrent live requests reserve the owner before the environment read finishes', async () => {
  let entered!: () => void, release!: () => void;
  const began = new Promise<void>(resolve => { entered = resolve; });
  const held = new Promise<void>(resolve => { release = resolve; });
  const service = new Lab18Service(undefined, {});
  service.availability = async () => { entered(); await held; return lab18AvailabilityResultSchema.parse({ source: 'managed-api', ready: false,
    environmentId: null, environmentUpdatedAt: null, environmentVersion: 'not exposed by SDK 0.133.0', cloud: false,
    archived: false, networking: 'unavailable', allowedHosts: [], approvedMounts: [], sessionStarted: false, reason: 'Unavailable fixture.' }); };
  const concept = createLab18Router(service), app = express(); app.use('/api/c18', concept.router);
  const server = app.listen(0); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/c18/run`;
  const post = () => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' },
    body: JSON.stringify({ ...input, mode: 'live' }) });
  try {
    const first = post(); await began;
    assert.equal((await post()).status, 429);
    release(); assert.equal((await first).status, 422);
  } finally { release(); await concept.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
