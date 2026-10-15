import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { checkedPath, Lab39Error, Lab39ProjectConfigRoot } from '../server/lib/lab39-project-config-root.js';
import { createLab39Router } from '../server/concepts/39-project-config-root.js';

test('host manifest wins conflicting branch markers and refuses takeover without a hook', () => {
  const manager = new Lab39ProjectConfigRoot(); try {
    const first = manager.start('alice', { mode: 'scripted', scenario: 'conflict' });
    assert.equal(first.status, 'ready'); assert.equal(first.branchHookRuns, 0);
    assert.match(first.effectiveSystemMarker ?? '', /^HOST_RULE/);
    const branch = manager.attempt('alice', { runId: first.runId, operation: 'read', path: 'CLAUDE.md' });
    assert.match(branch.lastOperation?.content ?? '', /^BRANCH_RULE/);
    assert.equal(branch.effectiveSystemMarker, first.effectiveSystemMarker);
    const takeover = manager.takeover('alice', first.runId);
    assert.equal(takeover.lastOperation?.decision, 'refused'); assert.equal(takeover.branchHookRuns, 0);
    assert.equal(takeover.providerCalls, 0);
  } finally { manager.close(); }
});

test('missing and changed hashes cannot acquire trusted tools', () => {
  const manager = new Lab39ProjectConfigRoot(); try {
    for (const scenario of ['missing-manifest', 'modified-hash'] as const) {
      const opened = manager.start('alice', { mode: 'scripted', scenario });
      assert.equal(opened.status, 'rejected'); assert.equal(opened.effectiveSystemMarker, null);
      assert.throws(() => manager.attempt('alice', { runId: opened.runId, operation: 'read', path: 'notes.txt' }), Lab39Error);
    }
  } finally { manager.close(); }
});

test('checked operations protect configuration and refuse traversal, absolute paths and links', () => {
  const manager = new Lab39ProjectConfigRoot(); try {
    const opened = manager.start('alice', { mode: 'scripted', scenario: 'conflict' });
    const edit = manager.attempt('alice', { runId: opened.runId, operation: 'edit', path: 'notes.txt', text: 'Safe fictional note' });
    assert.equal(edit.lastOperation?.decision, 'allowed'); assert.match(edit.lastOperation?.content ?? '', /Safe fictional note/);
    for (const path of ['CLAUDE.md', '../fixture-repo/notes.txt', '/tmp/outside', '.git/config', 'sub/../../notes.txt']) {
      const denied = manager.attempt('alice', { runId: opened.runId, operation: 'edit', path, text: 'bad' });
      assert.equal(denied.lastOperation?.decision, 'refused');
    }
    assert.equal(manager.attempt('alice', { runId: opened.runId, operation: 'read', path: 'notes.txt' }).lastOperation?.content, 'Safe fictional note\n');
    const root = mkdtempSync(join(tmpdir(), 'lab39-guard-'));
    try { mkdirSync(join(root, 'outside')); writeFileSync(join(root, 'outside', 'secret.txt'), 'outside'); mkdirSync(join(root, 'checkout'));
      symlinkSync(join(root, 'outside'), join(root, 'checkout', 'link'), 'junction');
      assert.throws(() => checkedPath(join(root, 'checkout'), 'link/secret.txt'), Lab39Error);
    } finally { rmSync(root, { recursive: true, force: true }); }
  } finally { manager.close(); }
});

test('HTTP closed schemas, local owner and live refusal', async () => {
  const app = express(), instance = createLab39Router(); app.use('/api/c39', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c39`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, custom: Record<string, string> = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: custom, body: JSON.stringify(body) });
  assert.equal((await post('start', { mode: 'live', scenario: 'conflict' })).status, 422);
  assert.equal((await post('start', { mode: 'scripted', scenario: 'conflict', cwd: '/tmp' })).status, 400);
  const opened = await (await post('start', { mode: 'scripted', scenario: 'conflict' })).json() as { runId: string };
  assert.equal((await post('where', { runId: opened.runId }, { ...headers, 'X-Lab-Owner': 'bob' })).status, 404);
  assert.equal((await post('where', { runId: opened.runId })).status, 200);
  assert.equal((await post('try', { runId: opened.runId, operation: 'read', path: 'notes.txt', bad: true })).status, 400);
  assert.equal((await post('dry', {})).status, 200);
});
