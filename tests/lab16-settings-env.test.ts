import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import type Anthropic from '@anthropic-ai/sdk';
import { lab16AccessSchema, lab16RequestSchema } from '../shared/lab16-settings-env.js';
import { createLab16Router } from '../server/concepts/16-settings-env.js';
import { createLiveLab16Port } from '../server/lib/lab16-port.js';
import { authoredEnvironment, checkLab16Access, fixtureMount, lab16Manifest, resolveLab16 } from '../server/lib/lab16-provenance.js';

const input = lab16RequestSchema.parse({ mode: 'scripted', scenario: 'winning-host-layer', userRegion: 'south', sessionRegion: null,
  prompt: 'Explain the synthetic observation configuration.', deadlineSeconds: 5, budgetCents: 25 });
const fakeEnv = { ANTHROPIC_API_KEY: 'offline-test-only', MANAGED_AGENT_ID: 'agent_fixture', MANAGED_ENVIRONMENT_ID: 'env_fixture',
  CLAUDE_MANAGED_LAB16_FILE_ID: 'file_fixture', MANAGED_LIVE_ENABLED: 'true' };

test('synthetic precedence changes only host provenance, never remote variable injection', () => {
  const base = resolveLab16({ ...input, userRegion: null });
  const user = resolveLab16(input);
  const session = resolveLab16({ ...input, sessionRegion: 'north' });
  assert.deepEqual([base.rows[0]?.hostValue, user.rows[0]?.hostValue, session.rows[0]?.hostValue], ['north', 'south', 'north']);
  assert.deepEqual([base.rows[0]?.hostSource, user.rows[0]?.hostSource, session.rows[0]?.hostSource], ['course default', 'user override', 'session override']);
  for (const row of [base, user, session]) assert.equal(row.rows[0]?.remoteValue, 'not injected');
});

test('missing credential, missing mount and restricted path have distinct authored evidence', () => {
  assert.equal(resolveLab16({ ...input, scenario: 'missing-credential' }).credentialReady, false);
  assert.equal(resolveLab16({ ...input, scenario: 'absent-remote-mount' }).remoteMountReady, false);
  assert.equal(resolveLab16({ ...input, scenario: 'restricted-path' }).accessAllowed, false);
  assert.deepEqual(checkLab16Access(fixtureMount, true).allowed, true);
  for (const path of ['/etc/passwd', '../field-guide.txt', '/mnt/session/outputs/note.txt']) assert.equal(checkLab16Access(path, true).allowed, false);
  assert.equal(checkLab16Access(fixtureMount, false).allowed, false);
  assert.equal(lab16AccessSchema.safeParse({ path: 'C:\\Users\\personal.txt', scenario: 'winning-host-layer' }).success, false);
});

test('manifest is names and redacted readiness; installed environment shape rejects Agent SDK settings', () => {
  const manifest = lab16Manifest(fakeEnv);
  assert.equal(manifest.liveReady, true); assert.equal(manifest.credentialReady, true);
  assert.equal(JSON.stringify(manifest).includes(fakeEnv.ANTHROPIC_API_KEY), false);
  assert.equal(JSON.stringify(manifest).includes(fakeEnv.CLAUDE_MANAGED_LAB16_FILE_ID), false);
  assert.deepEqual(authoredEnvironment, { type: 'cloud', networking: { type: 'limited', allowed_hosts: [], allow_mcp_servers: false, allow_package_managers: false }, packages: null });
  for (const patch of [{ env: { OBSERVATION_REGION: 'south' } }, { settingSources: ['project'] }, { resolveSettings: true },
    { additionalDirectories: ['/home'] }, { sandbox: { enabled: true } }, { mode: 'live', scenario: 'restricted-path' }])
    assert.equal(lab16RequestSchema.safeParse({ ...input, ...patch }).success, false);
  assert.equal(lab16Manifest({}).liveReady, false);
});

test('injected Managed SDK pins approved file and verifies listed mount before a prompt', async () => {
  const calls: string[] = []; let creation: unknown;
  const fake = { beta: {
    environments: { retrieve: async () => { calls.push('environment.retrieve'); return { archived_at: null,
      config: { type: 'cloud', networking: { type: 'limited', allowed_hosts: [], allow_mcp_servers: false, allow_package_managers: false },
        packages: { apt: [], cargo: [], gem: [], go: [], npm: [], pip: [] } } }; } },
    agents: { retrieve: async () => { calls.push('agent.retrieve'); return { id: 'agent_fixture', version: 9, multiagent: null }; } },
    sessions: { create: async (params: unknown) => { calls.push('session.create'); creation = params; return { id: 'sesn_fixture', status: 'idle', environment_id: 'env_fixture',
      agent: { id: 'agent_fixture', version: 9, tools: [], mcp_servers: [], skills: [] }, budget: { max_list_cost: { amount: '50', currency: 'USD' } } }; },
      resources: { list: async () => { calls.push('resources.list'); return { data: [{ type: 'file', mount_path: fixtureMount, file_id: 'file_scoped' }] }; } },
      events: { stream: async () => { calls.push('events.stream'); return { controller: new AbortController(), async *[Symbol.asyncIterator]() {} }; } } } } } as unknown as Anthropic;
  const port = createLiveLab16Port(fake, fakeEnv); assert.deepEqual(calls, []);
  const session = await port.create(); assert.equal(session.id, 'sesn_fixture'); assert.equal(port.evidence.observedMount, 'listed');
  assert.equal(port.evidence.verified, true); assert.deepEqual(calls, ['environment.retrieve', 'agent.retrieve', 'session.create', 'resources.list']);
  assert.deepEqual((creation as { resources: unknown }).resources, [{ type: 'file', file_id: 'file_fixture', mount_path: fixtureMount }]);
  assert.equal(JSON.stringify(creation).includes('settings.env'), false);
  await port.open(session.id, new AbortController().signal); assert.equal(calls.at(-1), 'events.stream');
});

test('unrestricted configured environment is rejected before session creation', async () => {
  let created = 0;
  const fake = { beta: { environments: { retrieve: async () => ({ archived_at: null,
    config: { type: 'cloud', networking: { type: 'unrestricted' }, packages: { apt: [], cargo: [], gem: [], go: [], npm: [], pip: [] } } }) },
    agents: { retrieve: async () => { throw new Error('agent retrieval should not occur'); } },
    sessions: { create: async () => { created++; } } } } as unknown as Anthropic;
  const port = createLiveLab16Port(fake, fakeEnv);
  await assert.rejects(port.create(), /restricted policy/); assert.equal(created, 0);
});

test('router rejects unsupported fields and live setup before effects; offline route streams a closed result', async () => {
  const app = express(); const concept = createLab16Router(); app.use('/api/c16', concept.router);
  const server = app.listen(0); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c16`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: unknown) => fetch(`${root}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  try {
    const manifest = await (await fetch(`${root}/files`)).json(); assert.equal(manifest.source, 'host-allowlist');
    assert.equal((await post('resolve', { ...input, env: { API_KEY: 'x' } })).status, 400);
    assert.equal((await post('access-run', { path: '../../private', scenario: 'restricted-path' })).status, 400);
    assert.equal((await post('env-run', { ...input, mode: 'live' })).status, 422);
    const resolved = await (await post('resolve', input)).json(); assert.equal(resolved.rows[0].hostSource, 'user override');
    const layers = await (await post('layers-run', input)).json(); assert.deepEqual(layers.comparisons.map((row: { rows: { hostSource: string }[] }) => row.rows[0]?.hostSource), ['course default', 'user override', 'session override']);
    const denied = await (await post('access-run', { path: '/etc/passwd', scenario: 'restricted-path' })).json(); assert.equal(denied.allowed, false);
    const stream = await (await post('env-run', input)).text(); assert.match(stream, /event: result/);
    assert.match(stream, /"source":"authored-fixture"/); assert.match(stream, /"cleanup":"simulated"/);
  } finally { await concept.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
