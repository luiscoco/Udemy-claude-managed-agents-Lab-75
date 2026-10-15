import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab34FixedQuestion } from '../shared/lab34-output-styles.js';
import { Lab34Error, Lab34Styles, validateLab34Report } from '../server/lib/lab34-styles.js';
import { createLab34Router } from '../server/concepts/34-output-styles.js';

test('four trusted files compose exactly into fresh immutable session snapshots', () => {
  const styles = new Lab34Styles(); try {
    const catalog = styles.styles(); assert.equal(catalog.length, 4);
    const runs = catalog.map(item => styles.compare('alice', item.name));
    assert.equal(new Set(runs.map(run => run.sessionId)).size, 4);
    for (const [index, run] of runs.entries()) {
      const selected = catalog[index]!;
      assert.equal(run.styleHash, selected.sha256); assert.equal(run.instruction, selected.instruction);
      assert.ok(run.configuredSystem.endsWith(selected.instruction)); assert.equal(run.question, lab34FixedQuestion);
      assert.deepEqual(run.capabilities, []); assert.equal(run.reportValid, true); assert.equal(run.providerCalls, 0);
    }
    assert.notEqual(runs[2]!.styleHash, runs[3]!.styleHash);
    assert.equal(styles.inspect('alice', runs[2]!.runId).styleHash, runs[2]!.styleHash);
  } finally { styles.close(); }
});
test('unknown names fail before session creation; owners and expiry are enforced', () => {
  let now = 0; const styles = new Lab34Styles(() => now); try {
    assert.throws(() => styles.compare('alice', 'missing'), (error: unknown) => error instanceof Lab34Error && error.statusCode === 400);
    const run = styles.compare('alice', 'concise'); assert.throws(() => styles.inspect('bob', run.runId), Lab34Error);
    now = 60_001; assert.equal(styles.inspect('alice', run.runId).status, 'expired');
  } finally { styles.close(); }
});
test('closed JSON report validation is independent of style text', () => {
  assert.equal(validateLab34Report(JSON.stringify({ project: 'Aurora Finch', summary: 'A sufficiently long summary.', nextSteps: ['Check fields'] })).valid, true);
  assert.equal(validateLab34Report('not JSON').valid, false);
  assert.equal(validateLab34Report(JSON.stringify({ project: 'Aurora Finch', summary: 'A sufficiently long summary.', nextSteps: ['Check fields'], style: 'review' })).valid, false);
});
test('HTTP catalog is host-only; unsupported live fields and unknown styles fail closed', async () => {
  const app = express(), instance = createLab34Router(); app.use('/api/c34', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c34`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object) => fetch(`${base}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await fetch(`${base}/styles`, { headers })).status, 200);
  assert.equal((await post('compare', { mode: 'live', style: 'concise' })).status, 422);
  assert.equal((await post('compare', { mode: 'scripted', style: 'missing' })).status, 400);
  assert.equal((await post('compare', { mode: 'scripted', style: 'concise', outputStyle: 'review' })).status, 400);
  const done = await post('compare', { mode: 'scripted', style: 'review-v2' }); assert.equal(done.status, 200);
  const snapshot = await done.json() as { runId: string; style: string }; assert.equal(snapshot.style, 'review-v2');
  assert.equal((await post('who', { operation: 'inspect', runId: snapshot.runId })).status, 200);
});
