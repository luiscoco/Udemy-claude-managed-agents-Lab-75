import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import express from 'express';
import { lab17RestoreSchema, lab17SendSchema, lab17SessionSchema } from '../shared/lab17-checkpointing.js';
import { createLab17Router } from '../server/concepts/17-checkpointing.js';
import { initialNotes } from '../server/lib/lab17-files.js';
import { Lab17Manager } from '../server/lib/lab17-run.js';

const sessionInput = lab17SessionSchema.parse({ mode: 'scripted', deadlineSeconds: 5, budgetCents: 50 });
const signal = new AbortController().signal;

test('closed host contracts reject Agent SDK rewind fields, foreign paths and unplanned confirmation', () => {
  for (const body of [{ ...sessionInput, enableFileCheckpointing: true }, { ...sessionInput, mode: 'other' }, { ...sessionInput, budgetCents: 0 }])
    assert.equal(lab17SessionSchema.safeParse(body).success, false);
  const id = crypto.randomUUID();
  assert.equal(lab17SendSchema.safeParse({ runId: id, action: 'edit-notes', prompt: 'x', text: 'reviewed', expectedVersion: 1, path: '../../.env' }).success, false);
  assert.equal(lab17RestoreSchema.safeParse({ runId: id, snapshotId: crypto.randomUUID(), expectedVersion: 1, dryRun: false }).success, false);
});

test('snapshot restores only tracked disk paths and preserves conversation and untracked file', async () => {
  const manager = new Lab17Manager();
  try {
    let state = await manager.session('alice', sessionInput); const id = state.runId;
    assert.equal(state.state, 'prepared'); assert.equal(state.files[0]?.content, initialNotes);
    state = await manager.snapshot(id, 'alice'); const snapshotId = state.snapshots[0]!.snapshotId;
    assert.equal(state.snapshots[0]?.files[1]?.exists, false);
    for (const [action, text] of [['edit-notes', 'reviewed'], ['create-draft', 'A new tracked draft.'], ['create-untracked', 'Keep this note.']] as const) {
      state = await manager.send('alice', { runId: id, action, prompt: `Record ${action} in the conversation.`, text, expectedVersion: state.version }, signal, () => {});
      assert.equal(state.state, 'idle');
    }
    assert.equal(state.version, 4); assert.equal(state.turns.length, 3); assert.equal(state.files[0]?.content?.includes('reviewed'), true);
    state = await manager.snapshot(id, 'alice');
    assert.equal(state.snapshots[1]?.sessionId, state.sessionId);
    assert.equal(state.snapshots[1]?.relatedHostEventIds.length, 3);
    assert.equal(state.snapshots[1]?.relatedManagedEventIds.length > 0, true);
    assert.equal(state.files[1]?.exists, true); assert.equal(state.files[2]?.content, 'Keep this note.');
    const beforeSessionId = state.sessionId, beforeTurns = state.turns;
    state = await manager.restore('alice', { runId: id, snapshotId, expectedVersion: state.version, dryRun: true });
    assert.deepEqual(state.plan?.changes.map(change => `${change.operation}:${change.path}`), ['restore:notes.md', 'delete:draft.md']);
    assert.equal(state.plan?.untrackedUntouched, true); assert.equal(state.plan?.remoteSessionUntouched, true);
    await assert.rejects(manager.restore('bob', { runId: id, snapshotId, expectedVersion: state.version, dryRun: true }), /Unknown or unowned/);
    await assert.rejects(manager.restore('alice', { runId: id, snapshotId: crypto.randomUUID(), expectedVersion: state.version, dryRun: true }), /Unknown snapshot/);
    await assert.rejects(manager.restore('alice', { runId: id, snapshotId, expectedVersion: state.version, dryRun: false, planId: crypto.randomUUID() }), /missing or stale/);
    state = await manager.restore('alice', { runId: id, snapshotId, expectedVersion: state.version, dryRun: false, planId: state.plan!.planId });
    assert.equal(state.state, 'idle'); assert.equal(state.version, 5); assert.equal(state.files[0]?.content, initialNotes);
    assert.equal(state.files[1]?.exists, false); assert.equal(state.files[2]?.content, 'Keep this note.');
    assert.equal(state.sessionId, beforeSessionId); assert.deepEqual(state.turns, beforeTurns);
    const disk = join(process.cwd(), 'generated', 'lab17', id);
    assert.equal(await readFile(join(disk, 'notes.md'), 'utf8'), initialNotes);
    assert.equal(await readFile(join(disk, 'scratch.md'), 'utf8'), 'Keep this note.');
    assert.deepEqual(JSON.parse(await readFile(join(disk, 'snapshots', `${snapshotId}.json`), 'utf8')), { 'notes.md': initialNotes, 'draft.md': null });
    await assert.rejects(manager.restore('alice', { runId: id, snapshotId, expectedVersion: 4, dryRun: true }), /version changed/);
    state = await manager.end(id, 'alice'); assert.equal(state.state, 'closed'); assert.equal(state.turns.length, 3);
  } finally { await manager.close(); }
});

test('remote outputs stay separate and one-shot archives its session', async () => {
  const manager = new Lab17Manager();
  try {
    let state = await manager.session('alice', sessionInput);
    state = await manager.send('alice', { runId: state.runId, action: 'read-notes', prompt: 'Read the fictional note.', text: '', expectedVersion: 1 }, signal, () => {});
    assert.equal(state.hostHandlerCalls, 1); assert.equal(state.version, 1);
    state = await manager.send('alice', { runId: state.runId, action: 'inspect-remote-outputs', prompt: 'Inspect outputs.', text: '', expectedVersion: 1 }, signal, () => {});
    assert.equal(state.remoteOutputs.status, 'authored-none'); assert.equal(state.turns.length, 1);
    await manager.end(state.runId, 'alice');
    const one = await manager.oneshot('alice', { session: sessionInput, action: 'read-notes', prompt: 'Read the note once.', text: '' }, signal);
    assert.equal(one.state, 'closed'); assert.equal(one.turns.length, 1); assert.equal(one.sessionId === state.sessionId, false);
  } finally { await manager.close(); }
});

test('active turn blocks snapshots and restoration until confirmed idle', async () => {
  const manager = new Lab17Manager();
  try {
    let state = await manager.session('alice', sessionInput);
    state = await manager.snapshot(state.runId, 'alice');
    const snapshotId = state.snapshots[0]!.snapshotId;
    const running = manager.send('alice', { runId: state.runId, action: 'edit-notes', prompt: 'Review the fictional notebook.', text: 'reviewed', expectedVersion: state.version }, signal, () => {});
    await assert.rejects(manager.snapshot(state.runId, 'alice'), /confirmed idle/);
    await assert.rejects(manager.restore('alice', { runId: state.runId, snapshotId, expectedVersion: state.version, dryRun: true }), /confirmed idle/);
    state = await running;
    assert.equal(state.state, 'idle');
    state = await manager.restore('alice', { runId: state.runId, snapshotId, expectedVersion: state.version, dryRun: true });
    assert.equal(state.plan?.changes[0]?.path, 'notes.md');
  } finally { await manager.close(); }
});

test('strict HTTP routes expose dry run and block malformed restore before file effects', async () => {
  const manager = new Lab17Manager(), concept = createLab17Router(manager), app = express(); app.use('/api/c17', concept.router);
  const server = app.listen(0); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c17`;
  const post = (path: string, body: unknown, owner = 'alice') => fetch(`${root}/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner }, body: JSON.stringify(body) });
  try {
    const started = await (await post('session', sessionInput)).json(); const id = started.runId;
    const snap = await (await post('snapshot', { runId: id })).json(); const snapshotId = snap.snapshots[0].snapshotId;
    assert.equal((await post('restore', { runId: id, snapshotId, expectedVersion: 1, dryRun: false })).status, 400);
    assert.equal((await post('snapshot', { runId: id }, 'bob')).status, 404);
    const stream = await (await post('send', { runId: id, action: 'edit-notes', prompt: 'Change the fictional note.', text: 'reviewed', expectedVersion: 1 })).text();
    assert.match(stream, /event: result/); assert.match(stream, /Status: reviewed/);
    const plan = await (await post('restore', { runId: id, snapshotId, expectedVersion: 2, dryRun: true })).json();
    assert.equal(plan.plan.changes[0].path, 'notes.md');
    const restored = await (await post('restore', { runId: id, snapshotId, expectedVersion: 2, dryRun: false, planId: plan.plan.planId })).json();
    assert.equal(restored.files[0].content, initialNotes); await post('end', { runId: id });
  } finally { await concept.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
