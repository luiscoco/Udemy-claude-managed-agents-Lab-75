import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import { Lab35Error, Lab35Mirror } from '../server/lib/lab35-mirror.js';
import { createLab35Router } from '../server/concepts/35-session-stores.js';

test('eager events survive second host; batched pending events are lost in simulated crash', () => {
  const mirror = new Lab35Mirror(); try {
    const eager = mirror.run('alice', { mode: 'scripted', scenario: 'normal', flush: 'eager' });
    const batched = mirror.run('alice', { mode: 'scripted', scenario: 'normal', flush: 'batched' });
    assert.equal(eager.persistedCount, 2); assert.equal(eager.pendingCount, 0);
    assert.equal(batched.persistedCount, 0); assert.equal(batched.pendingCount, 2);
    const restarted = new Lab35Mirror(mirror.root);
    assert.equal(restarted.inspect('alice', eager.conversationId).persistedCount, 2);
    assert.equal(restarted.inspect('alice', batched.conversationId).pendingCount, 0);
    assert.equal(mirror.manage('alice', { operation: 'crash-restart', conversationId: batched.conversationId }).mirrorStatus, 'incomplete');
    assert.equal(readFileSync(join(mirror.root, 'effects.json'), 'utf8'), '[]');
    restarted.close();
  } finally { mirror.destroy(); }
});
test('reconciliation deduplicates canonical events and partitions threads', () => {
  const mirror = new Lab35Mirror(); try {
    const opened = mirror.run('alice', { mode: 'scripted', scenario: 'reconnect', flush: 'eager' });
    const once = mirror.manage('alice', { operation: 'reconcile', conversationId: opened.conversationId });
    const twice = mirror.manage('alice', { operation: 'reconcile', conversationId: opened.conversationId });
    assert.equal(once.persistedCount, 3); assert.equal(twice.persistedCount, 3);
    assert.equal(new Set(twice.events.map(event => event.eventId)).size, 3);
    assert.equal(new Set(twice.events.map(event => event.threadId)).size, 2);
    assert.equal(twice.events.some(event => /preview/i.test(event.kind)), false);
    assert.throws(() => mirror.inspect('bob', opened.conversationId), Lab35Error);
    mirror.manage('alice', { operation: 'archive', conversationId: opened.conversationId });
    assert.throws(() => mirror.manage('alice', { operation: 'reconcile', conversationId: opened.conversationId }), Lab35Error);
  } finally { mirror.destroy(); }
});
test('append failure marks an incomplete mirror without changing remote state; index keys are guarded', () => {
  const mirror = new Lab35Mirror(); try {
    const opened = mirror.run('alice', { mode: 'scripted', scenario: 'append-failure', flush: 'eager' });
    assert.equal(opened.persistedCount, 0); assert.equal(opened.mirrorStatus, 'incomplete'); assert.equal(opened.remoteState, 'idle');
    const index = JSON.parse(readFileSync(join(mirror.root, 'index.json'), 'utf8')) as Array<Record<string, unknown>>;
    assert.equal(index.length, 1); assert.equal(index[0]?.conversationId, opened.conversationId);
    index[0]!.conversationId = '../outside'; writeFileSync(join(mirror.root, 'index.json'), JSON.stringify(index));
    assert.throws(() => new Lab35Mirror(mirror.root), Lab35Error);
  } finally { mirror.destroy(); }
});
test('HTTP ownership, live denial, closed requests and reset work', async () => {
  const app = express(), instance = createLab35Router(); app.use('/api/c35', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c35`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, custom: Record<string, string> = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: custom, body: JSON.stringify(body) });
  assert.equal((await post('run', { mode: 'live', scenario: 'normal', flush: 'eager' })).status, 422);
  assert.equal((await post('run', { mode: 'scripted', scenario: 'normal', flush: 'eager', sessionStore: true })).status, 400);
  const opened = await (await post('run', { mode: 'scripted', scenario: 'normal', flush: 'batched' })).json() as { conversationId: string };
  assert.equal((await post('manage', { operation: 'flush', conversationId: opened.conversationId }, { ...headers, 'X-Lab-Owner': 'bob' })).status, 404);
  assert.equal((await post('manage', { operation: 'flush', conversationId: opened.conversationId })).status, 200);
  assert.equal((await post('reset', { conversationId: opened.conversationId })).status, 200);
});
