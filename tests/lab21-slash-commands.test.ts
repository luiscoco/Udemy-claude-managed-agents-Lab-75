import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { expandLab21Command, lab21RunSchema } from '../shared/lab21-slash-commands.js';
import { createLab21Router } from '../server/concepts/21-slash-commands.js';
import { Lab21Commands } from '../server/lib/lab21-commands.js';

test('fixed command grammar expands exact content and rejects paths, executable text, extra fields', () => {
  assert.equal(expandLab21Command('observation', { species: 'Aurora Finch', count: 3, location: 'north marsh' }),
    'Format a fictional observation note. Species: Aurora Finch. Count: 3. Location: north marsh.');
  assert.equal(expandLab21Command('checklist', { location: 'river bend' }), 'Create a three-item fictional field checklist for river bend.');
  for (const args of [{ species: 'Aurora Finch', count: 3, location: '../secret' },
    { species: 'Aurora Finch', count: 3, location: 'north marsh', path: '/tmp/a' },
    { species: '$(whoami)', count: 3, location: 'north marsh' }]) assert.throws(() => expandLab21Command('observation', args));
  assert.throws(() => expandLab21Command('execute', {}));
  assert.throws(() => expandLab21Command('inspect', { path: '/tmp/a' }));
  assert.equal(lab21RunSchema.safeParse({ runId: crypto.randomUUID(), command: 'inspect', args: {}, shell: 'echo' }).success, false);
});

test('local actions on an owned retained session send no provider message', async () => {
  const commands = new Lab21Commands();
  try {
    const first = commands.prepare('alice', 'scripted');
    const local = await commands.run(first.runId, 'alice', 'inspect', {}, new AbortController().signal);
    assert.equal(local.kind, 'local'); assert.equal(local.providerSends, 0); assert.deepEqual(local.history, []);
    await assert.rejects(commands.run(first.runId, 'bob', 'inspect', {}, new AbortController().signal), /unowned/);
    const model = await commands.run(first.runId, 'alice', 'observation', { species: 'Aurora Finch', count: 3, location: 'north marsh' }, new AbortController().signal);
    assert.equal(model.kind, 'model'); assert.equal(model.providerSends, 1); assert.equal(model.snapshot?.messagesUsed, 1);
    assert.equal(model.expanded, 'Format a fictional observation note. Species: Aurora Finch. Count: 3. Location: north marsh.');
    const inspect = await commands.run(first.runId, 'alice', 'inspect', {}, new AbortController().signal);
    assert.equal(inspect.providerSends, 0); assert.equal(inspect.history.length, 1);
    const reset = await commands.run(first.runId, 'alice', 'reset', {}, new AbortController().signal);
    assert.equal(reset.providerSends, 0); assert.deepEqual(reset.history, []);
    const closed = await commands.close(first.runId, 'alice'); assert.equal(closed.state, 'closed');
    await assert.rejects(commands.run(first.runId, 'alice', 'inspect', {}, new AbortController().signal), /unowned/);
  } finally { await commands.shutdown(); }
});

test('HTTP command registry and session reject foreign owners and invalid commands', async () => {
  const concept = createLab21Router(), app = express(); app.use('/api/c21', concept.router);
  const server = app.listen(0); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c21`, headers = (owner = 'alice') => ({ 'Content-Type': 'application/json', 'X-Lab-Owner': owner });
  const post = (path: string, body: unknown, owner = 'alice') => fetch(`${root}/${path}`, { method: 'POST', headers: headers(owner), body: JSON.stringify(body) });
  try {
    const registry = await fetch(`${root}/commands`, { headers: headers() });
    assert.equal(registry.status, 200); assert.equal(((await registry.json()) as { commands: unknown[] }).commands.length, 4);
    const prepared = await post('session', { action: 'prepare', mode: 'scripted' });
    assert.equal(prepared.status, 200); const { runId } = await prepared.json() as { runId: string };
    assert.equal((await post('run', { runId, command: 'inspect', args: {} }, 'bob')).status, 404);
    assert.equal((await post('run', { runId, command: 'execute', args: {} })).status, 400);
    assert.equal((await post('run', { runId, command: 'observation', args: { species: 'Aurora Finch', count: 3, location: '../secret' } })).status, 400);
    const local = await post('run', { runId, command: 'inspect', args: {} });
    assert.equal(local.status, 200); assert.equal((await local.json() as { providerSends: number }).providerSends, 0);
    assert.equal((await post('session', { action: 'close', runId })).status, 200);
  } finally { await concept.close(); server.close(); }
});
