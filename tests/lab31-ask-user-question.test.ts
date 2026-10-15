import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab31AnswerSchema, lab31AskUserShape } from '../shared/lab31-ask-user-question.js';
import { Lab31Error, Lab31Questions } from '../server/lib/lab31-questions.js';
import { createLab31Router } from '../server/concepts/31-ask-user-question.js';

test('one selected option yields exactly one correlated custom-tool result', () => {
  const questions = new Lab31Questions(); const opened = questions.run('alice', { mode: 'scripted', scenario: 'deployment-target' });
  const answer = { runId: opened.runId, sessionId: opened.sessionId, eventId: opened.eventId, selectedOption: 'staging' };
  const done = questions.answer('alice', answer);
  assert.equal(done.status, 'answered'); assert.equal(done.answer, 'staging'); assert.equal(done.resultSendCount, 1);
  assert.equal(done.resultEvent?.custom_tool_use_id, opened.eventId); assert.equal(done.resultEvent?.type, 'user.custom_tool_result');
  assert.equal(done.unrelatedToolEffects, 0);
  assert.throws(() => questions.answer('alice', answer), (error: unknown) => error instanceof Lab31Error && error.statusCode === 409);
  questions.close();
});
test('invalid, partial, foreign and unsupported custom answers cannot consume a question', () => {
  const questions = new Lab31Questions(); const opened = questions.run('alice', { mode: 'scripted', scenario: 'invalid-answer' });
  const base = { runId: opened.runId, sessionId: opened.sessionId, eventId: opened.eventId };
  assert.throws(() => questions.answer('bob', { ...base, selectedOption: 'dev' }), Lab31Error);
  assert.throws(() => questions.answer('alice', { ...base, eventId: 'sevt_wrong', selectedOption: 'dev' }), Lab31Error);
  assert.throws(() => questions.answer('alice', { ...base, selectedOption: 'unknown' }), Lab31Error);
  assert.throws(() => questions.answer('alice', { ...base, customText: 'Elsewhere' }), Lab31Error);
  assert.equal(questions.inspect('alice', opened.runId).resultSendCount, 0);
  assert.equal(lab31AnswerSchema.safeParse({ ...base }).success, true); // Cross-field selection is checked against stored question.
  assert.equal(lab31AskUserShape.safeParse({ question: 'X', options: [{ id: 'a', label: 'A' }], allowCustom: true }).success, false);
  const custom = questions.run('alice', { mode: 'scripted', scenario: 'allowed-custom-text' });
  assert.equal(questions.answer('alice', { runId: custom.runId, sessionId: custom.sessionId, eventId: custom.eventId,
    customText: 'Private lab' }).answer, 'Private lab'); questions.close();
});
test('expiry and cancellation release waiters; browser disconnect releases only its waiter', async () => {
  let now = 0; const questions = new Lab31Questions(() => now);
  const expiring = questions.run('alice', { mode: 'scripted', scenario: 'expiry' });
  const waitExpiry = questions.wait('alice', expiring.runId, 5000, new AbortController().signal);
  now = 1300; assert.equal(questions.inspect('alice', expiring.runId).status, 'expired');
  assert.equal((await waitExpiry).status, 'expired');
  const cancel = questions.run('alice', { mode: 'scripted', scenario: 'cancel-waiting' });
  const waitCancel = questions.wait('alice', cancel.runId, 5000, new AbortController().signal);
  questions.cancel('alice', cancel.runId); assert.equal((await waitCancel).status, 'canceled');
  const disconnected = questions.run('alice', { mode: 'scripted', scenario: 'option-selection' });
  const controller = new AbortController(), wait = questions.wait('alice', disconnected.runId, 5000, controller.signal);
  controller.abort(); await assert.rejects(wait, Lab31Error);
  assert.equal(questions.inspect('alice', disconnected.runId).status, 'pending'); questions.close();
});
test('HTTP routes reject live, unsupported fields, repeated and foreign decisions', async () => {
  const app = express(), instance = createLab31Router(); app.use('/api/c31', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c31`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  assert.equal((await fetch(`${base}/run`, { method: 'POST', headers, body: JSON.stringify({ mode: 'live', scenario: 'deployment-target' }) })).status, 422);
  const response = await fetch(`${base}/run`, { method: 'POST', headers, body: JSON.stringify({ mode: 'scripted', scenario: 'deployment-target' }) });
  const opened = await response.json() as { runId: string; sessionId: string; eventId: string }; assert.equal(response.status, 200);
  const body = { runId: opened.runId, sessionId: opened.sessionId, eventId: opened.eventId, selectedOption: 'dev' };
  assert.equal((await fetch(`${base}/answer`, { method: 'POST', headers: { ...headers, 'X-Lab-Owner': 'bob' }, body: JSON.stringify(body) })).status, 404);
  assert.equal((await fetch(`${base}/answer`, { method: 'POST', headers, body: JSON.stringify({ ...body, writeFile: true }) })).status, 400);
  assert.equal((await fetch(`${base}/answer`, { method: 'POST', headers, body: JSON.stringify(body) })).status, 200);
  assert.equal((await fetch(`${base}/answer`, { method: 'POST', headers, body: JSON.stringify(body) })).status, 409);
});
