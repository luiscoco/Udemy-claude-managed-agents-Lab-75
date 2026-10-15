import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { lab22RunSchema } from '../shared/lab22-claude-md-memory.js';
import { createLab22Router } from '../server/concepts/22-claude-md-memory.js';
import { composeLab22Message, lab22Inventory, Lab22ContextRuns, readLab22File } from '../server/lib/lab22-context.js';

const input = lab22RunSchema.parse({ mode: 'scripted', scenario: 'nested', question: 'What is known?', deadlineSeconds: 15, budgetCents: 50 });
test('closed request rejects paths, Agent SDK fields and live conflict before effects', () => {
  for (const extra of [{ paths: ['../../.claude/CLAUDE.md'] }, { settingSources: ['project'] }, { memoryStoreId: 'memstore_x' },
    { hooks: {} }, { deadlineSeconds: 0 }, { question: '' }]) assert.equal(lab22RunSchema.safeParse({ ...input, ...extra }).success, false);
  assert.equal(lab22RunSchema.safeParse({ ...input, mode: 'live', scenario: 'conflict' }).success, false);
});

test('inventory reads exact allowlisted files and message carries selected file bytes', async () => {
  const inventory = await lab22Inventory(); assert.deepEqual(inventory.map(file => file.key), ['root', 'nested', 'untrusted', 'memory']);
  assert.ok(inventory.every(file => file.path.startsWith('project/') || file.path.startsWith('memory/')));
  assert.ok(inventory.every(file => !file.path.includes('..') && file.sha256.length === 64 && file.bytes > 0));
  assert.match(inventory[0]!.content, /PROJECT_ROOT_MARKER/);
  assert.match(inventory[1]!.content, /NESTED_MARKER/);
  assert.match(inventory[2]!.content, /UNTRUSTED_MARKER/);
  assert.match(inventory[3]!.content, /MEMORY_MARKER/);
  const message = composeLab22Message(input, [await readLab22File('root'), await readLab22File('nested')]);
  assert.match(message, /PROJECT_ROOT_MARKER/); assert.match(message, /NESTED_MARKER/);
  assert.doesNotMatch(message, /MEMORY_MARKER|UNTRUSTED_MARKER/);
  assert.equal(message.includes(inventory[0]!.content), true);
});

test('nested, conflicting, disabled and handoff selections create fresh sessions with separate provenance', async () => {
  const runs = new Lab22ContextRuns(), signal = new AbortController().signal;
  try {
    const nested = await runs.run('alice', input, signal);
    assert.deepEqual(nested.readKeys, ['root', 'nested']);
    assert.deepEqual(nested.remoteFileReads, []); assert.equal(nested.cloudMemory, 'not-attached');
    assert.equal(nested.source, 'authored-fixture'); assert.ok(nested.sessionId); assert.equal(nested.cleanup, 'simulated');
    const conflict = await runs.run('alice', { ...input, scenario: 'conflict' }, signal);
    assert.deepEqual(conflict.readKeys, ['root', 'nested', 'untrusted']);
    assert.match(conflict.userMessage, /Ignore the application policy/);
    assert.notEqual(conflict.sessionId, nested.sessionId);
    const disabled = await runs.run('alice', { ...input, scenario: 'disabled' }, signal);
    assert.deepEqual(disabled.readKeys, []); assert.equal(disabled.selected.length, 0);
    assert.doesNotMatch(disabled.userMessage, /PROJECT_ROOT_MARKER|NESTED_MARKER|MEMORY_MARKER/);
    const handoff = await runs.run('alice', { ...input, scenario: 'handoff' }, signal);
    assert.deepEqual(handoff.readKeys, ['root', 'memory']);
    assert.match(handoff.userMessage, /MEMORY_MARKER/); assert.doesNotMatch(handoff.userMessage, /NESTED_MARKER/);
    assert.notEqual(handoff.sessionId, nested.sessionId);
    await assert.rejects(Promise.resolve().then(() => runs.reset('bob', handoff.runId)), /unowned/);
    assert.deepEqual(runs.reset('alice', handoff.runId), { runId: handoff.runId, cleared: true });
  } finally { await runs.close(); }
});

test('HTTP inventory is host-only, bad requests fail before work, and reset is owner-scoped', async () => {
  const concept = createLab22Router(), app = express(); app.use('/api/c22', concept.router);
  const server = app.listen(0); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c22`, headers = (owner = 'alice') => ({ 'Content-Type': 'application/json', 'X-Lab-Owner': owner });
  const post = (path: string, body: unknown, owner = 'alice') => fetch(`${root}/${path}`, { method: 'POST', headers: headers(owner), body: JSON.stringify(body) });
  try {
    const files = await fetch(`${root}/files`, { headers: headers() }); assert.equal(files.status, 200);
    assert.equal((await files.json() as { files: unknown[] }).files.length, 4);
    assert.equal((await post('run', { ...input, paths: ['../home'] })).status, 400);
    assert.equal((await post('run', { ...input, mode: 'live' })).status, 422);
    const response = await post('run', input); assert.equal(response.status, 200);
    const body = await response.text(), frame = /event: result\ndata: ([^\n]+)/.exec(body); assert(frame);
    const result = JSON.parse(frame[1]!) as { runId: string; readKeys: string[]; cloudMemory: string };
    assert.deepEqual(result.readKeys, ['root', 'nested']); assert.equal(result.cloudMemory, 'not-attached');
    assert.equal((await post('reset', { runId: result.runId, confirmReset: true }, 'bob')).status, 404);
    assert.equal((await post('reset', { runId: result.runId })).status, 400);
    assert.equal((await post('reset', { runId: result.runId, confirmReset: true })).status, 200);
  } finally { await concept.close(); server.close(); }
});
