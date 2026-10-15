import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab30CallSchema, lab30ToolShapes } from '../shared/lab30-todo-tracking.js';
import { Lab30BoardManager, Lab30Error } from '../server/lib/lab30-board.js';
import { createLab30Router } from '../server/concepts/30-todo-tracking.js';

test('agent claim cannot complete tasks; dependency and evidence gates decide', () => {
  const manager = new Lab30BoardManager(); const board = manager.run('alice', { mode: 'scripted', scenario: 'three-step' });
  assert.equal(board.tasks.filter(task => task.status === 'done').length, 0); assert.match(board.agentClaim ?? '', /complete/);
  const attempt = manager.call('alice', { boardId: board.boardId, eventId: 'sevt_review', name: 'update_task',
    input: { id: 'task_2', expectedVersion: 1, action: 'complete', evidence: 'review-approved' } });
  assert.equal(attempt.latest.isError, true); assert.equal(attempt.latest.effectApplied, false);
  const draft = manager.call('alice', { boardId: board.boardId, eventId: 'sevt_draft', name: 'update_task',
    input: { id: 'task_1', expectedVersion: 1, action: 'complete', evidence: 'draft-checked' } });
  assert.equal(draft.tasks[0]?.status, 'done');
  const wrong = manager.call('alice', { boardId: board.boardId, eventId: 'sevt_wrong', name: 'update_task',
    input: { id: 'task_2', expectedVersion: 1, action: 'complete', evidence: 'agent-says-done' } });
  assert.equal(wrong.latest.isError, true); assert.equal(wrong.tasks[1]?.status, 'open');
  assert.equal(manager.run('bob', { mode: 'scripted', scenario: 'validated-completion' }).tasks.every(task => task.status === 'done'), true);
  manager.close();
});
test('repeated event ID is idempotent; conflicting input, versions and invalid plan fail atomically', () => {
  const manager = new Lab30BoardManager(); const board = manager.run('alice', { mode: 'scripted', scenario: 'three-step' });
  const input = { boardId: board.boardId, eventId: 'sevt_create', name: 'create_task' as const, input: { title: 'Extra', dependsOn: [] } };
  const first = manager.call('alice', input), second = manager.call('alice', input);
  assert.equal(first.tasks.length, 4); assert.equal(second.tasks.length, 4); assert.equal(second.results.length, first.results.length);
  assert.throws(() => manager.call('alice', { ...input, input: { title: 'Changed', dependsOn: [] } }), Lab30Error);
  const stale = manager.call('alice', { boardId: board.boardId, eventId: 'sevt_stale', name: 'update_task',
    input: { id: 'task_1', expectedVersion: 9, action: 'rename', title: 'No' } });
  assert.equal(stale.latest.isError, true);
  const plan = manager.replace('alice', { boardId: board.boardId, eventId: 'host_plan', operation: 'replace_plan',
    expectedBoardVersion: stale.boardVersion, tasks: [{ title: 'Cycle', dependsOn: [1] }, { title: 'Later', dependsOn: [] }] });
  assert.equal(plan.latest.isError, true); assert.equal(plan.tasks.length, 4);
  assert.throws(() => manager.call('bob', input), Lab30Error); manager.close();
});
test('tool inputs are closed and scenario fixtures include refused and invalid plan results', () => {
  assert.equal(lab30ToolShapes.create_task.safeParse({ title: 'X', dependsOn: [], approval: true }).success, false);
  assert.equal(lab30CallSchema.safeParse({ boardId: crypto.randomUUID(), eventId: 'sevt_x', name: 'TodoWrite', input: {} }).success, false);
  const manager = new Lab30BoardManager();
  const refused = manager.run('alice', { mode: 'scripted', scenario: 'refused-completion' });
  assert.equal(refused.results.at(-1)?.isError, true);
  const invalid = manager.run('alice', { mode: 'scripted', scenario: 'invalid-plan-replacement' });
  assert.equal(invalid.results.at(-1)?.isError, true); assert.equal(invalid.tasks.length, 3); manager.close();
});
test('HTTP routes reject foreign owners, unsupported live and malformed tool calls', async () => {
  const app = express(), instance = createLab30Router(); app.use('/api/c30', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c30`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  assert.equal((await fetch(`${base}/run`, { method: 'POST', headers, body: JSON.stringify({ mode: 'live', scenario: 'three-step' }) })).status, 422);
  const opened = await fetch(`${base}/run`, { method: 'POST', headers, body: JSON.stringify({ mode: 'scripted', scenario: 'three-step' }) });
  assert.equal(opened.status, 200); const board = await opened.json() as { boardId: string };
  const foreign = await fetch(`${base}/tools`, { method: 'POST', headers: { ...headers, 'X-Lab-Owner': 'bob' },
    body: JSON.stringify({ boardId: board.boardId, eventId: 'sevt_list', name: 'list_tasks', input: {} }) });
  assert.equal(foreign.status, 404);
  const invalid = await fetch(`${base}/tools`, { method: 'POST', headers,
    body: JSON.stringify({ boardId: board.boardId, eventId: 'sevt_bad', name: 'arbitrary_tool', input: {} }) });
  assert.equal(invalid.status, 400);
});
