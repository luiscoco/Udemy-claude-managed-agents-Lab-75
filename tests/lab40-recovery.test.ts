import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab40Error, Lab40Recovery } from '../server/lib/lab40-recovery.js';
import { createLab40Router } from '../server/concepts/40-resume-drops-turn.js';

test('kept turn preserves remote events, processed command and applied effect', () => {
  const manager = new Lab40Recovery(); try {
    const opened = manager.build('alice', { mode: 'scripted', scenario: 'kept-turn' });
    const ids = [...opened.remoteEventIds], command = opened.commandLedger[0]!.id, effect = opened.effectLedger[0]!.id;
    const continued = manager.choose('alice', opened.runId, 'continue');
    assert.deepEqual(continued.remoteEventIds, ids); assert.equal(continued.commandLedger[0]?.id, command);
    assert.equal(continued.effectLedger[0]?.id, effect); assert.equal(continued.recovery, 'continued');
    assert.throws(() => manager.choose('alice', opened.runId, 'continue'), Lab40Error);
    const refused = manager.undo('alice', opened.runId, continued.version);
    assert.equal(refused.undo, 'refused'); assert.deepEqual(refused.remoteEventIds, ids);
  } finally { manager.close(); }
});

test('uncertain send and pending effect require reconciliation, never transient retry', () => {
  const manager = new Lab40Recovery(); try {
    for (const scenario of ['uncertain-send', 'pending-effect'] as const) {
      const opened = manager.build('alice', { mode: 'scripted', scenario });
      for (const choice of ['continue', 'interrupt', 'fresh-derived'] as const)
        assert.throws(() => manager.choose('alice', opened.runId, choice), Lab40Error);
      const checked = manager.choose('alice', opened.runId, 'reconcile');
      assert.equal(checked.recovery, 'reconciliation-required');
      assert.deepEqual(checked.commandLedger, opened.commandLedger); assert.deepEqual(checked.effectLedger, opened.effectLedger);
      assert.match(checked.decision, /do not retry|duplicate/i);
    }
  } finally { manager.close(); }
});

test('queued follow-up remains accepted through continuation and blocks fresh derivation', () => {
  const manager = new Lab40Recovery(); try {
    const opened = manager.build('alice', { mode: 'scripted', scenario: 'queued-follow-up' });
    assert.throws(() => manager.choose('alice', opened.runId, 'fresh-derived'), Lab40Error);
    const continued = manager.choose('alice', opened.runId, 'continue');
    assert.equal(continued.commandLedger[1]?.state, 'queued'); assert.equal(continued.commandLedger[1]?.id, opened.commandLedger[1]?.id);
    assert.match(continued.decision, /once/);
  } finally { manager.close(); }
});

test('host-only undo restores a clean draft with version guard and leaves remote history alone', () => {
  const manager = new Lab40Recovery(); try {
    const opened = manager.build('alice', { mode: 'scripted', scenario: 'clean-snapshot' });
    assert.throws(() => manager.undo('alice', opened.runId, opened.version + 1), Lab40Error);
    const restored = manager.undo('alice', opened.runId, opened.version);
    assert.equal(restored.undo, 'restored-host-draft'); assert.equal(restored.hostDraft, opened.snapshotDraft);
    assert.deepEqual(restored.remoteEventIds, []); assert.equal(restored.version, opened.version + 1);
    assert.throws(() => manager.undo('alice', opened.runId, opened.version), Lab40Error);
  } finally { manager.close(); }
});

test('HTTP validates owner, schema and live refusal before recovery', async () => {
  const app = express(), instance = createLab40Router(); app.use('/api/c40', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c40`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, custom: Record<string, string> = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: custom, body: JSON.stringify(body) });
  assert.equal((await post('build', { mode: 'live', scenario: 'kept-turn' })).status, 422);
  assert.equal((await post('build', { mode: 'scripted', scenario: 'kept-turn', resumeSessionAt: 0 })).status, 400);
  const opened = await (await post('build', { mode: 'scripted', scenario: 'kept-turn' })).json() as { runId: string };
  assert.equal((await fetch(`${base}/state?runId=${opened.runId}`, { headers: { 'X-Lab-Owner': 'bob' } })).status, 404);
  assert.equal((await fetch(`${base}/state?runId=${opened.runId}`, { headers })).status, 200);
  assert.equal((await post('cases', { runId: opened.runId, choice: 'continue', bad: true })).status, 400);
  assert.equal((await post('dry', {})).status, 200);
});
