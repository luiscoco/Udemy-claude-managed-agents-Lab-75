import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { lab23ManifestSchema, lab23RunSchema, lab23SelectionSchema } from '../shared/lab23-plugins.js';
import { createLab23Router } from '../server/concepts/23-plugins.js';
import { Lab23Bundles, readLab23Bundle } from '../server/lib/lab23-bundles.js';

const on = lab23SelectionSchema.parse({ enabled: true, includeSkill: false, includeMcp: false, location: 'north marsh' });
test('reviewed manifest pins six allowlisted contributions and a restricted worker', async () => {
  const bundle = await readLab23Bundle();
  assert.equal(bundle.manifest.contributions.length, 6); assert.equal(bundle.manifest.version, '1.0.0');
  assert.equal(bundle.manifestHash.length, 64);
  assert.deepEqual(bundle.manifest.contributions.map(item => item.kind), ['command', 'tool', 'primary-agent', 'worker-agent', 'mcp', 'skill']);
  assert.equal(lab23ManifestSchema.safeParse({ ...bundle.manifest, contributions: [...bundle.manifest.contributions, { kind: 'hook', path: 'hook.js', sha256: '0'.repeat(64) }] }).success, false);
  assert.equal(lab23RunSchema.safeParse({ ...on, mode: 'scripted', script: 'powershell' }).success, false);
  assert.equal(lab23SelectionSchema.safeParse({ ...on, location: '../secret' }).success, false);
});

test('malformed, missing-directory, changed-hash and elevated-worker variants fail before inventory replacement', async () => {
  const manager = new Lab23Bundles();
  try {
    const before = await manager.catalog('alice');
    for (const variant of ['malformed', 'missing-directory', 'changed-hash', 'elevated-worker'] as const) {
      await assert.rejects(manager.reload(variant));
      assert.equal((await manager.catalog('alice')).manifestHash, before.manifestHash);
    }
    assert.equal((await manager.reload('valid')).manifestHash, before.manifestHash);
  } finally { await manager.close(); }
});

test('bundle off/on, skill and MCP inclusion, and actual host handler preserve least privilege', async () => {
  const manager = new Lab23Bundles();
  try {
    const off = await manager.run('alice', { ...on, enabled: false });
    assert.equal(off.handlerInvocations, 0); assert.deepEqual(off.effectLedger, []); assert.deepEqual(off.requested.tools, []);
    const active = await manager.run('alice', on);
    assert.equal(active.handlerInvocations, 1); assert.equal(active.providerSends, 0);
    assert.deepEqual(active.effectLedger[0]?.result, [{ species: 'Aurora Finch', location: 'north marsh', count: 3 }]);
    assert.deepEqual(active.resolved.workerTools, []); assert.equal(active.resolved.dynamicDelegation, false);
    const expanded = await manager.run('alice', { ...on, includeSkill: true, includeMcp: true, location: 'pine grove' });
    assert.deepEqual(expanded.requested.skills, ['bird.format_observation']);
    assert.deepEqual(expanded.resolved.mcpServers, ['bird.catalog']);
    assert.equal(expanded.skillReadObserved, false); assert.equal(expanded.mcpContacted, false);
    assert.deepEqual(expanded.effectLedger[0]?.result, [{ species: 'Forest Wren', location: 'pine grove', count: 2 }]);
    assert.equal((await manager.catalog('bob')).recent.length, 0);
    assert.equal((await manager.catalog('alice')).recent.length, 3);
    manager.reset('alice'); assert.equal((await manager.catalog('alice')).recent.length, 0);
  } finally { await manager.close(); }
});

test('HTTP routes validate before work and keep reload and comparisons host-local', async () => {
  const concept = createLab23Router(), app = express(); app.use('/api/c23', concept.router);
  const server = app.listen(0); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c23`, headers = (owner = 'alice') => ({ 'Content-Type': 'application/json', 'X-Lab-Owner': owner });
  const post = (path: string, body: unknown, owner = 'alice') => fetch(`${root}/${path}`, { method: 'POST', headers: headers(owner), body: JSON.stringify(body) });
  try {
    const catalog = await fetch(`${root}/plugins`, { headers: headers() }); assert.equal(catalog.status, 200);
    const before = (await catalog.json() as { manifestHash: string }).manifestHash;
    assert.equal((await post('run', { ...on, mode: 'live' })).status, 422);
    assert.equal((await post('run', { ...on, mode: 'scripted', path: '/tmp' })).status, 400);
    assert.equal((await post('reload', { variant: 'changed-hash' })).status, 422);
    const after = await fetch(`${root}/plugins`, { headers: headers() }); assert.equal((await after.json() as { manifestHash: string }).manifestHash, before);
    const inventory = await post('inventory', on); assert.equal(inventory.status, 200);
    const run = await post('run', { ...on, mode: 'scripted' }); assert.equal(run.status, 200);
    assert.equal((await run.json() as { handlerInvocations: number }).handlerInvocations, 1);
    const other = await fetch(`${root}/plugins`, { headers: headers('bob') }); assert.equal((await other.json() as { recent: unknown[] }).recent.length, 0);
    assert.equal((await post('reset', {})).status, 400);
    assert.equal((await post('reset', { confirmReset: true })).status, 200);
  } finally { await concept.close(); server.close(); }
});
