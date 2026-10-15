import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createLab25Router } from '../server/concepts/25-compaction-context.js';
import { knownContextMetrics, readLab25Report, runLab25 } from '../server/lib/lab25-compaction-context.js';

test('checked report reads produce distinct hashes and source facts', async () => {
  const reports = await Promise.all((['r1', 'r2', 'r3'] as const).map(readLab25Report));
  assert.equal(reports.length, 3); assert.equal(new Set(reports.map(report => report.sha256)).size, 3);
  assert.ok(reports.every(report => report.bytes <= 2048 && report.fact.length > 0));
});

test('compaction is an observed event, not a fabricated threshold or free-context count', async () => {
  const input = { mode: 'scripted', scenario: 'compacted', includeHandoff: false, deadlineSeconds: 5 } as const;
  const compacted = await runLab25(input); assert.equal(compacted.consumerOutcome, 'completed');
  assert.deepEqual(compacted.observedCompaction.map(event => event.id), ['sevt_compacted_fixture']);
  assert.equal(compacted.metrics.inputTokens, 420); assert.equal(compacted.metrics.contextWindowTokens, null);
  assert.equal(compacted.metrics.freeContextTokens, null); assert.equal(compacted.metrics.compactionThresholdTokens, null);
  const absent = await runLab25({ ...input, scenario: 'no-compaction' });
  assert.deepEqual(absent.observedCompaction, []); assert.equal(absent.providerCalls, 0);
  const missing = await runLab25({ ...input, scenario: 'missing-metrics' });
  assert.equal(missing.metrics.inputTokens, null); assert.equal(missing.metrics.threadActiveSeconds, null);
  assert.equal(knownContextMetrics(null).outputTokens, null);
});

test('new-session host summary can omit a verified source fact', async () => {
  const result = await runLab25({ mode: 'scripted', scenario: 'summary-omits', includeHandoff: true, deadlineSeconds: 5 });
  assert.ok(result.handoff); assert.notEqual(result.handoff.originalSessionId, result.handoff.newSessionId);
  assert.deepEqual(result.handoff.retained, [{ id: 'r1', retained: true }, { id: 'r2', retained: false }, { id: 'r3', retained: true }]);
  assert.equal(result.handoff.summary.includes(result.reports[1]!.fact), false);
  assert.equal(result.handoff.newSessionAnswer.includes(result.reports[1]!.fact), false);
});

test('HTTP inventory is host-only and strict route rejects live and invented compaction controls', async () => {
  const app = express(), feature = createLab25Router(); app.use('/api/c25', feature.router);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/c25`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'student25' };
  try {
    const inventory = await fetch(base + '/window', { headers }); assert.equal(inventory.status, 200);
    assert.equal((await inventory.json()).metrics.freeContextTokens, null);
    const code = await fetch(base + '/code', { headers }); assert.equal((await code.json()).unsupported.includes('/compact'), true);
    const run = (body: unknown, extra = {}) => fetch(base + '/run', { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) });
    const good = { mode: 'scripted', scenario: 'compacted', includeHandoff: true, deadlineSeconds: 5 };
    assert.equal((await run(good)).status, 200); assert.equal((await run({ ...good, mode: 'live' })).status, 422);
    assert.equal((await run({ ...good, compact: true })).status, 400);
    assert.equal((await run(good, { Origin: 'https://elsewhere.example' })).status, 403);
  } finally { await feature.close(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
