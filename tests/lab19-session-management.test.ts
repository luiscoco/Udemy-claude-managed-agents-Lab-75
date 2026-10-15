import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { lab19BranchSchema, lab19DeleteSchema, lab19TurnSchema } from '../shared/lab19-session-management.js';
import { createLab19Router } from '../server/concepts/19-session-management.js';
import { Lab19Manager } from '../server/lib/lab19-sessions.js';

const input = lab19TurnSchema.parse({ mode: 'scripted', action: 'new', prompt: 'Remember that my fictional project is Aurora Finch.',
  deadlineSeconds: 5, budgetCents: 50 });
const signal = new AbortController().signal;

test('closed operations reject native resume/fork fields and deletion requires explicit selection', () => {
  for (const patch of [{ continue: true }, { forkSession: true }, { resumeSessionAt: 'x' }, { conversationId: crypto.randomUUID() },
    { deadlineSeconds: 0 }]) assert.equal(lab19TurnSchema.safeParse({ ...input, ...patch }).success, false);
  assert.equal(lab19TurnSchema.safeParse({ ...input, action: 'continue' }).success, false);
  assert.equal(lab19BranchSchema.safeParse({ boundaryEventId: 'foreign', prompt: 'x', deadlineSeconds: 5, budgetCents: 50 }).success, false);
  assert.equal(lab19DeleteSchema.safeParse({ confirmDelete: false }).success, false);
});

test('two turns and a derived conversation preserve original history and use distinct session IDs', async () => {
  const manager = new Lab19Manager();
  try {
    let original = await manager.turn('alice', input, signal, () => {});
    const originalId = original.session.conversationId, originalSession = original.session.sessionId;
    assert.equal(original.session.state, 'idle'); assert.equal(original.hostEvents.length, 2);
    original = await manager.turn('alice', { ...input, action: 'continue', conversationId: originalId,
      prompt: 'What is the fictional project name?' }, signal, () => {});
    assert.equal(original.session.sessionId, originalSession); assert.equal(original.hostEvents.length, 4);
    const boundary = original.hostEvents[2]!.id;
    const branch = await manager.branch(originalId, 'alice', { boundaryEventId: boundary, prompt: 'Continue the observation note.',
      deadlineSeconds: 5, budgetCents: 50 }, signal, () => {});
    assert.notEqual(branch.session.conversationId, originalId); assert.notEqual(branch.session.sessionId, originalSession);
    assert.equal(branch.session.lineageParentId, originalId); assert.equal(branch.session.lineageBoundaryEventId, boundary);
    assert.match(branch.summaryHandoff!, /Aurora Finch/);
    assert.match(branch.hostEvents[0]!.text, /Selected-history summary/);
    const retained = await manager.detail(originalId, 'alice');
    assert.deepEqual(retained.hostEvents, original.hostEvents); assert.equal(retained.session.sessionId, originalSession);
    assert.equal((await manager.list('alice')).sessions.length, 2);
    await assert.rejects(manager.branch(originalId, 'alice', { boundaryEventId: crypto.randomUUID(), prompt: 'x',
      deadlineSeconds: 5, budgetCents: 50 }, signal, () => {}), /unknown/);
  } finally { await manager.close(); }
});

test('host history pages expose omission, while ownership, archive and deletion stay distinct', async () => {
  const manager = new Lab19Manager();
  try {
    let detail = await manager.turn('alice', input, signal, () => {}), id = detail.session.conversationId;
    for (const prompt of ['Second turn.', 'Third turn.']) detail = await manager.turn('alice', { ...input, action: 'continue', conversationId: id, prompt }, signal, () => {});
    const first = await manager.detail(id, 'alice'); assert.equal(first.page.events.length, 4); assert.equal(first.page.omittedPages, true);
    const second = await manager.detail(id, 'alice', first.page.nextCursor!); assert.equal(second.page.events.length, 2);
    assert.equal(second.page.nextCursor, null); assert.equal(second.page.omittedPages, false);
    await assert.rejects(manager.detail(id, 'bob'), /unowned/);
    await assert.rejects(manager.detail(id, 'alice', 'foreign-cursor'), /cursor/);
    detail = await manager.rename(id, 'alice', 'Aurora field notes'); assert.equal(detail.session.title, 'Aurora field notes');
    detail = await manager.tag(id, 'alice', 'reviewed'); assert.equal(detail.session.tag, 'reviewed');
    detail = await manager.archive(id, 'alice'); assert.equal(detail.session.state, 'archived'); assert.equal(detail.hostEvents.length, 6);
    await assert.rejects(manager.turn('alice', { ...input, action: 'continue', conversationId: id, prompt: 'After archive?' }, signal, () => {}), /confirmed-idle/);
    await assert.rejects(manager.delete(id, 'alice'), /confirmed-idle/);
    const other = await manager.turn('alice', input, signal, () => {});
    await assert.rejects(manager.delete(other.session.conversationId, 'bob'), /unowned/);
    const deleted = await manager.delete(other.session.conversationId, 'alice'); assert.equal(deleted.deleted, true);
    await assert.rejects(manager.detail(other.session.conversationId, 'alice'), /unowned/);
  } finally { await manager.close(); }
});

test('HTTP inventory, history pages and mutations reject foreign or malformed requests before effects', async () => {
  const manager = new Lab19Manager(), concept = createLab19Router(manager), app = express(); app.use('/api/c19', concept.router);
  const server = app.listen(0); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c19`;
  const headers = (owner = 'alice') => ({ 'Content-Type': 'application/json', 'X-Lab-Owner': owner });
  const post = (path: string, body: unknown, owner = 'alice') => fetch(`${root}/${path}`, { method: 'POST', headers: headers(owner), body: JSON.stringify(body) });
  try {
    const availability = await fetch(`${root}/availability`, { headers: headers() });
    assert.equal(availability.status, 200);
    assert.equal((await availability.json()).liveReady, false);
    assert.equal((await post('turn', { ...input, forkSession: true })).status, 400);
    const response = await post('turn', input), body = await response.text();
    assert.match(body, /event: result/);
    const parsed = /event: result\ndata: ([^\n]+)/.exec(body); assert(parsed);
    const result = JSON.parse(parsed[1]!) as { session: { conversationId: string }; hostEvents: { id: string }[] };
    const id = result.session.conversationId;
    assert.equal((await fetch(`${root}/sessions`, { headers: headers('bob') })).status, 200);
    assert.equal((await fetch(`${root}/sessions/${id}`, { headers: headers('bob') })).status, 404);
    assert.equal((await post(`sessions/${id}/rename`, { title: 'Foreign' }, 'bob')).status, 404);
    assert.equal((await post(`sessions/${id}/delete`, {})).status, 400);
    assert.equal((await post(`sessions/${id}/rename`, { title: 'Notebook' })).status, 200);
    assert.equal((await post(`sessions/${id}/tag`, { tag: 'field' })).status, 200);
    assert.equal((await post(`sessions/${id}/branch`, { boundaryEventId: 'unknown', prompt: 'x', deadlineSeconds: 5, budgetCents: 50 })).status, 400);
    assert.equal((await post(`sessions/${id}/delete`, { confirmDelete: true })).status, 200);
    assert.equal((await fetch(`${root}/sessions/${id}`, { headers: headers() })).status, 404);
    assert.equal((await post('reset', { mode: 'scripted', confirmReset: true })).status, 200);
  } finally { await concept.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
