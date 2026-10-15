import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab32DecisionSchema, lab32RunSchema } from '../shared/lab32-plan-mode.js';
import { Lab32Error, Lab32PlanGate } from '../server/lib/lab32-plan-gate.js';
import { createLab32Router } from '../server/concepts/32-plan-mode.js';

test('planning is read-only; approval starts a distinct restricted session and one checked effect', () => {
  const gate = new Lab32PlanGate(); try {
    const opened = gate.run('alice', { mode: 'scripted', scenario: 'planning-write' });
    assert.equal(opened.planningFileEffects, 0); assert.equal(opened.currentFileHash, opened.initialFileHash);
    assert.equal(opened.lastTool?.allowed, false);
    const approved = gate.decide('alice', { runId: opened.runId, planVersion: opened.planVersion, planHash: opened.planHash, decision: 'approve' });
    assert.equal(approved.status, 'executed'); assert.notEqual(approved.executionSessionId, approved.planningSessionId);
    assert.equal(approved.executionFileEffects, 1); assert.notEqual(approved.currentFileHash, opened.initialFileHash);
    assert.match(approved.fileText, /Approved fictional deployment checklist/);
    const denied = gate.who('alice', { operation: 'attempt-write', runId: opened.runId, phase: 'execution', tool: 'write_anywhere' });
    assert.equal(denied.lastTool?.allowed, false); assert.equal(denied.executionFileEffects, 1);
    assert.throws(() => gate.decide('alice', { runId: opened.runId, planVersion: opened.planVersion, planHash: opened.planHash,
      decision: 'approve' }), (error: unknown) => error instanceof Lab32Error && error.statusCode === 409);
  } finally { gate.close(); }
});
test('revision invalidates an older hash and version; rejection and cancellation make no file effect', () => {
  const gate = new Lab32PlanGate(); try {
    const opened = gate.run('alice', { mode: 'scripted', scenario: 'revision' });
    const old = { runId: opened.runId, planVersion: opened.planVersion, planHash: opened.planHash };
    const revised = gate.decide('alice', { ...old, decision: 'revise', feedback: 'Shorter checklist' });
    assert.equal(revised.planVersion, 2); assert.notEqual(revised.planHash, opened.planHash);
    assert.throws(() => gate.decide('alice', { ...old, decision: 'approve' }), Lab32Error);
    assert.equal(gate.inspect('alice', opened.runId).currentFileHash, opened.initialFileHash);
    const rejected = gate.decide('alice', { runId: revised.runId, planVersion: revised.planVersion, planHash: revised.planHash,
      decision: 'reject' });
    assert.equal(rejected.status, 'rejected'); assert.equal(rejected.executionFileEffects, 0);
    const cancel = gate.run('alice', { mode: 'scripted', scenario: 'approval' });
    assert.equal(gate.who('alice', { operation: 'cancel', runId: cancel.runId }).status, 'canceled');
    assert.throws(() => gate.decide('alice', { runId: cancel.runId, planVersion: cancel.planVersion, planHash: cancel.planHash,
      decision: 'approve' }), Lab32Error);
  } finally { gate.close(); }
});
test('owner, phase, capacity, deadline and closed schemas fail before unrelated effects', () => {
  let now = 0; const gate = new Lab32PlanGate(() => now); try {
    const opened = gate.run('alice', { mode: 'scripted', scenario: 'approval' });
    assert.throws(() => gate.inspect('bob', opened.runId), Lab32Error);
    const denied = gate.who('alice', { operation: 'attempt-write', runId: opened.runId, phase: 'planning', tool: 'append_checklist' });
    assert.equal(denied.lastTool?.allowed, false); assert.equal(denied.currentFileHash, opened.initialFileHash);
    assert.equal(lab32RunSchema.safeParse({ mode: 'scripted', scenario: 'approval', permissionMode: 'plan' }).success, false);
    assert.equal(lab32DecisionSchema.safeParse({ runId: opened.runId, planVersion: 1, planHash: opened.planHash,
      decision: 'approve', tool: 'write_anywhere' }).success, false);
    now = 60_001; assert.equal(gate.inspect('alice', opened.runId).status, 'expired');
    assert.throws(() => gate.decide('alice', { runId: opened.runId, planVersion: 1, planHash: opened.planHash,
      decision: 'approve' }), Lab32Error);
  } finally { gate.close(); }
});
test('HTTP routes validate origin and ownership, reject live and stale approvals', async () => {
  const app = express(), instance = createLab32Router(); app.use('/api/c32', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c32`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, custom: Record<string, string> = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: custom, body: JSON.stringify(body) });
  assert.equal((await post('run', { mode: 'live', scenario: 'approval' })).status, 422);
  assert.equal((await post('run', { mode: 'scripted', scenario: 'approval' }, { ...headers, Origin: 'http://evil.test' })).status, 403);
  const opened = await (await post('run', { mode: 'scripted', scenario: 'revision' })).json() as { runId: string; planVersion: number; planHash: string };
  const decision = { runId: opened.runId, planVersion: opened.planVersion, planHash: opened.planHash, decision: 'revise', feedback: 'Short' };
  assert.equal((await post('decide', decision, { ...headers, 'X-Lab-Owner': 'bob' })).status, 404);
  assert.equal((await post('decide', { ...decision, EnterPlanMode: true })).status, 400);
  assert.equal((await post('decide', decision)).status, 200);
  assert.equal((await post('decide', { ...decision, decision: 'approve', feedback: undefined })).status, 409);
});
