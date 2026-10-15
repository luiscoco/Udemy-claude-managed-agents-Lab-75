import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab38Error, Lab38Suggestions } from '../server/lib/lab38-suggestions.js';
import { createLab38Router } from '../server/concepts/38-prompt-suggestions.js';

test('suggestions bind conversation, turn and response; copy cannot auto-send', () => {
  const manager = new Lab38Suggestions(); try {
    const opened = manager.chat('alice', { mode: 'scripted', scenario: 'normal' });
    const shown = manager.when('alice', opened.conversationId); assert.equal(shown.suggestions.length, 1);
    assert.equal(shown.sentCount, 1); assert.equal(shown.autoSendCount, 0);
    const suggestion = shown.suggestions[0]!;
    assert.equal(suggestion.turn, shown.turn); assert.equal(suggestion.responseVersion, shown.responseVersion);
    const done = manager.send('alice', { conversationId: shown.conversationId, text: suggestion.text, suggestionId: suggestion.id,
      expectedTurn: shown.turn, expectedResponseVersion: shown.responseVersion });
    assert.equal(done.sentCount, 2); assert.equal(done.turn, 2); assert.equal(done.autoSendCount, 0);
    assert.throws(() => manager.send('alice', { conversationId: shown.conversationId, text: suggestion.text, suggestionId: suggestion.id,
      expectedTurn: shown.turn, expectedResponseVersion: shown.responseVersion }), Lab38Error);
  } finally { manager.close(); }
});
test('delayed, suppressed and disabled suggestions may be absent without changing answer usage', () => {
  let now = 0; const manager = new Lab38Suggestions(() => now); try {
    const delayed = manager.chat('alice', { mode: 'scripted', scenario: 'delayed' });
    assert.equal(manager.when('alice', delayed.conversationId).suggestions.length, 0);
    now = 1200; assert.equal(manager.when('alice', delayed.conversationId).suggestions.length, 1);
    for (const scenario of ['suppressed', 'disabled'] as const) {
      const opened = manager.chat('alice', { mode: 'scripted', scenario });
      const snapshot = manager.when('alice', opened.conversationId);
      assert.equal(snapshot.suggestions.length, 0); assert.equal(snapshot.suggestionUsage, null); assert.equal(snapshot.answerUsage.source, 'authored-fixture');
    }
  } finally { manager.close(); }
});
test('newer turn makes older suggestion stale; feature switch and close clear suggestions', () => {
  const manager = new Lab38Suggestions(); try {
    const opened = manager.chat('alice', { mode: 'scripted', scenario: 'stale' });
    const old = manager.when('alice', opened.conversationId).suggestions[0]!;
    const newer = manager.send('alice', { conversationId: opened.conversationId, text: 'A different question',
      expectedTurn: opened.turn, expectedResponseVersion: opened.responseVersion });
    assert.throws(() => manager.send('alice', { conversationId: opened.conversationId, text: old.text, suggestionId: old.id,
      expectedTurn: newer.turn, expectedResponseVersion: newer.responseVersion }), Lab38Error);
    const checked = manager.when('alice', opened.conversationId); assert.equal(checked.staleRejected, true); assert.equal(checked.suggestions.length, 0);
    assert.equal(manager.switches('alice', opened.conversationId, false).enabled, false);
    assert.equal(manager.end('alice', opened.conversationId).status, 'closed');
    assert.throws(() => manager.send('alice', { conversationId: opened.conversationId, text: 'Again',
      expectedTurn: newer.turn, expectedResponseVersion: newer.responseVersion }), Lab38Error);
  } finally { manager.close(); }
});
test('HTTP closed schemas and owner gate reject live and foreign sends', async () => {
  const app = express(), instance = createLab38Router(); app.use('/api/c38', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c38`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, custom: Record<string, string> = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: custom, body: JSON.stringify(body) });
  assert.equal((await post('chat', { mode: 'live', scenario: 'normal' })).status, 422);
  assert.equal((await post('chat', { mode: 'scripted', scenario: 'normal', prompt_suggestion: true })).status, 400);
  const opened = await (await post('chat', { mode: 'scripted', scenario: 'normal' })).json() as { conversationId: string; turn: number; responseVersion: number };
  const body = { conversationId: opened.conversationId, text: 'Continue', expectedTurn: opened.turn, expectedResponseVersion: opened.responseVersion };
  assert.equal((await post('send', body, { ...headers, 'X-Lab-Owner': 'bob' })).status, 404);
  assert.equal((await post('send', body)).status, 200);
  assert.equal((await post('send', body)).status, 409);
});
