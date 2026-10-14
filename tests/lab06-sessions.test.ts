import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
import { lab06FollowUp, lab06Prompt, lab06RequestSchema } from '../shared/lab06-sessions.js';
import type { Lab06Result } from '../shared/lab06-sessions.js';
import { FixtureLab06Port } from '../server/lib/lab06-port.js';
import { Lab06ConversationStore } from '../server/lib/lab06-store.js';
import { createLab06Router } from '../server/concepts/06-sessions.js';

const input = { mode: 'scripted' as const, action: 'new' as const, prompt: lab06Prompt, scenario: 'normal' as const, deadlineSeconds: 10 };

test('Lab 06 request contract requires the right conversation identity for each action', () => {
  assert.equal(lab06RequestSchema.safeParse(input).success, true);
  assert.equal(lab06RequestSchema.safeParse({ ...input, conversationId: randomUUID() }).success, false);
  assert.equal(lab06RequestSchema.safeParse({ ...input, action: 'continue' }).success, false);
  assert.equal(lab06RequestSchema.safeParse({ ...input, action: 'reconnect', conversationId: randomUUID(), prompt: '' }).success, true);
  assert.equal(lab06RequestSchema.safeParse({ ...input, mode: 'live', scenario: 'hang' }).success, false);
});

test('same fixture session retains context while a fresh session does not', async () => {
  const port = new FixtureLab06Port(); const signal = new AbortController().signal;
  const first = await port.create(input); let stream = await port.open(first.id, signal, 'normal');
  await port.send(first.id, lab06Prompt, signal); for await (const _event of stream.events) { /* drain */ }
  stream = await port.open(first.id, signal, 'normal'); await port.send(first.id, lab06FollowUp, signal); for await (const _event of stream.events) { /* drain */ }
  const retained = await port.history(first.id);
  assert.equal(retained.filter((event) => event.type === 'user.message').length, 2);
  assert.match(retained.at(-1)!.text, /Aurora Finch/);

  const fresh = await port.create(input); stream = await port.open(fresh.id, signal, 'normal');
  await port.send(fresh.id, lab06FollowUp, signal); for await (const _event of stream.events) { /* drain */ }
  assert.match((await port.history(fresh.id)).at(-1)!.text, /No fictional project name/);
  assert.notEqual(first.id, fresh.id);
});

test('conversation index enforces ownership, expiry, archive and persisted-event deduplication', () => {
  let now = 1_000; const store = new Lab06ConversationStore(100, () => now); const entry = store.create('alice', 'sesn_fixture_one');
  assert.equal(store.read(entry.conversationId, 'bob').kind, 'foreign');
  const event = { id: 'sevt_1', type: 'user.message' as const, text: 'hello' };
  assert.equal(store.merge(entry, [event, event]), 1); assert.deepEqual(entry.history, [event]);
  now = 1_050; assert.equal(store.read(entry.conversationId, 'alice').kind, 'ok');
  entry.archived = true; assert.equal(store.read(entry.conversationId, 'alice').kind, 'archived');
  const expiring = store.create('alice', 'sesn_fixture_two'); now = expiring.expiresAt + 1;
  assert.equal(store.read(expiring.conversationId, 'alice').kind, 'expired');
  assert.equal(store.read(randomUUID(), 'alice').kind, 'missing');
});

test('fixture returns actual sent event IDs, opens before send, and archives explicitly', async () => {
  const port = new FixtureLab06Port(); const session = await port.create(input); const signal = new AbortController().signal;
  const stream = await port.open(session.id, signal, 'normal'); const sent = await port.send(session.id, 'hello', signal);
  assert.match(sent, /^sevt_fixture_/); for await (const _event of stream.events) { /* drain */ }
  assert.deepEqual(port.calls.slice(0, 3).map((call) => call.split(':')[0]), ['create', 'open', 'send']);
  assert.equal(await port.status(session.id), 'idle'); await port.archive(session.id);
  await assert.rejects(port.history(session.id), /Unknown or archived/);
});

async function readSse(response: Response) {
  const text = await response.text(); const blocks = text.split('\n\n'); let result: Lab06Result | null = null;
  for (const block of blocks) {
    const event = /^event: (.+)$/m.exec(block)?.[1];
    const data = block.split('\n').filter((line) => line.startsWith('data: ')).map((line) => line.slice(6)).join('\n');
    if (event === 'result') result = JSON.parse(data) as Lab06Result;
  }
  return result;
}

test('router reuses one session, reconnects with deduplication, enforces ownership, and closes explicitly', async () => {
  const fixture = new FixtureLab06Port(); const lab = createLab06Router({ fixture }); const app = express(); app.use('/api/c6', lab.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c6`; const post = (path: string, body: unknown, signal?: AbortSignal) => fetch(`${root}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' }, body: JSON.stringify(body), signal,
  });
  try {
    const first = await readSse(await post('/query', input)); assert(first); assert.equal(first.outcome, 'completed');
    const continued = await readSse(await post('/query', { ...input, action: 'continue', conversationId: first.conversationId, prompt: lab06FollowUp }));
    assert(continued); assert.equal(continued.sessionId, first.sessionId); assert.match(continued.history.at(-1)!.text, /Aurora Finch/);
    assert.equal(fixture.calls.filter((call) => call.startsWith('create:')).length, 1, 'one create across both turns');
    assert.match(continued.sentEventId!, /^sevt_fixture_/); assert.equal(continued.duplicatesIgnored, 2);

    const reconnected = await readSse(await post('/query', { ...input, action: 'reconnect', conversationId: first.conversationId, prompt: '' }));
    assert(reconnected); assert.equal(reconnected.outcome, 'reconnected'); assert.equal(reconnected.history.length, 4); assert.equal(reconnected.duplicatesIgnored, 4);
    const inspect = await fetch(`${root}/conversation?conversationId=${first.conversationId}`, { headers: { 'X-Lab-Owner': 'alice' } });
    assert.equal(inspect.status, 200); assert.equal((await inspect.json() as { turnCount: number }).turnCount, 2);
    assert.equal((await fetch(`${root}/conversation?conversationId=${first.conversationId}`, { headers: { 'X-Lab-Owner': 'bob' } })).status, 403);
    assert.equal((await fetch(`${root}/conversation?conversationId=${randomUUID()}`, { headers: { 'X-Lab-Owner': 'alice' } })).status, 404);

    const closed = await post('/close', { mode: 'scripted', conversationId: first.conversationId }); assert.equal(closed.status, 200);
    assert.equal((await post('/query', { ...input, action: 'continue', conversationId: first.conversationId, prompt: lab06FollowUp })).status, 409);

    const eof = await readSse(await post('/query', { ...input, scenario: 'stream-eof' })); assert.equal(eof?.outcome, 'incomplete'); assert.equal(eof?.archived, false);
    const controller = new AbortController(); const hanging = await post('/query', { ...input, scenario: 'hang' }, controller.signal); assert.equal(hanging.status, 200);
    controller.abort(); for (let i = 0; i < 40 && !fixture.calls.some((call) => call.startsWith('interrupt:')); i++) await delay(25);
    assert.equal(fixture.calls.some((call) => call.startsWith('interrupt:')), true);
  } finally { await lab.close(); server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
});

