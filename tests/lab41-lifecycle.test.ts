import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFileSync } from 'node:fs';
import express from 'express';
import { Lab41Error, Lab41Lifecycle } from '../server/lib/lab41-lifecycle.js';
import { createLab41Router } from '../server/concepts/41-v2-session-api.js';

test('pinned official SDK and no legacy Agent SDK imports in production sources', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies: Record<string, string> };
  assert.equal(packageJson.dependencies['@anthropic-ai/sdk'], '1.7.0');
  for (const path of ['server/lib/lab06-port.ts', 'server/lib/lab41-lifecycle.ts', 'server/concepts/41-v2-session-api.ts']) {
    const source = readFileSync(path, 'utf8');
    assert.doesNotMatch(source, /(?:unstable_v2|from ['"]@anthropic-ai\/claude-agent-sdk['"]|claude-agent-sdk-v2)/);
  }
  const adapter = readFileSync('server/lib/lab06-port.ts', 'utf8');
  for (const method of ['sessions.create', 'events.stream', 'events.send', 'events.list', 'sessions.retrieve', 'sessions.archive'])
    assert.match(adapter, new RegExp(method.replace('.', '\\.')));
});

test('one-shot archives once after a verified turn and refuses continuation', async () => {
  const manager = new Lab41Lifecycle(); try {
    const opened = await manager.start('alice', 'one-shot');
    assert.equal(opened.status, 'archived'); assert.equal(opened.archiveCount, 1);
    assert.equal(opened.userEventIds.length, 1); assert.equal(opened.agentEventIds.length, 1);
    assert.equal(opened.history.length, 2); assert.equal(opened.createdSessions, 1);
    await assert.rejects(manager.act('alice', opened.runId, 'second-turn'), Lab41Error);
  } finally { await manager.close(); }
});

test('retained two-turn, reconnect and interrupt use the same resolved session', async () => {
  const manager = new Lab41Lifecycle(); try {
    const opened = await manager.start('alice', 'retained'); const id = opened.sessionId;
    const reconnected = await manager.act('alice', opened.runId, 'reconnect');
    assert.equal(reconnected.sessionId, id); assert.equal(reconnected.reconnectCreates, 0);
    const second = await manager.act('alice', opened.runId, 'second-turn');
    assert.equal(second.sessionId, id); assert.equal(second.history.length, 4);
    assert.equal(new Set(second.userEventIds).size, 2); assert.match(second.history[3]?.text ?? '', /Aurora Notebook/);
    const interrupted = await manager.act('alice', opened.runId, 'interrupt');
    assert.equal(interrupted.status, 'interrupted-idle');
    const continued = await manager.act('alice', opened.runId, 'second-turn');
    assert.equal(continued.sessionId, id); assert.equal(continued.history.length, 6);
  } finally { await manager.close(); }
});

test('archived session refusal and owner gate do not create another session', async () => {
  const manager = new Lab41Lifecycle(); try {
    const opened = await manager.start('alice', 'archived-refusal');
    const refused = await manager.act('alice', opened.runId, 'send-after-archive');
    assert.equal(refused.createdSessions, 1); assert.equal(refused.reconnectCreates, 0);
    await assert.rejects(manager.state('bob', opened.runId), Lab41Error);
    await assert.rejects(manager.act('alice', opened.runId, 'reconnect'), Lab41Error);
  } finally { await manager.close(); }
});

test('HTTP schemas reject live and unsupported legacy selectors', async () => {
  const app = express(), instance = createLab41Router(); app.use('/api/c41', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c41`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object) => fetch(`${base}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await post('oneshot', { mode: 'live', scenario: 'one-shot' })).status, 422);
  assert.equal((await post('compare', { mode: 'scripted', scenario: 'retained', unstable_v2: true })).status, 400);
  const opened = await (await post('compare', { mode: 'scripted', scenario: 'retained' })).json() as { runId: string };
  assert.equal((await fetch(`${base}/state?runId=${opened.runId}`, { headers: { 'X-Lab-Owner': 'bob' } })).status, 404);
  assert.equal((await post('continue', { runId: opened.runId, action: 'reconnect' })).status, 200);
  assert.equal((await fetch(`${base}/facts`, { headers })).status, 200);
});
