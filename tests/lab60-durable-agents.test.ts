import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { createLab60Router } from '../server/concepts/60-durable-agents.js';
import { DurableStore, effectKey, eligible, items, toolDefinitions } from '../server/durable/lab60.js';

const store = () => new DurableStore(mkdtempSync(join(tmpdir(), 'lab60-test-')), () => 1_000_000);
test('eight-item host policy and closed tool definitions exclude ineligible effects', () => {
  assert.equal(items.length, 8); assert.equal(items.filter(eligible).length, 5);
  assert.equal(toolDefinitions.length, 3);
  assert.equal(toolDefinitions[1]?.input_schema.additionalProperties, false);
});
test('crash between effect and journal yields three, one or zero duplicates by strategy', () => {
  for (const [strategy, expected] of [['naive-restart', 3], ['journal-only', 1], ['journal-idempotency', 0]] as const) {
    const runner = store(), crash = runner.start('alice', 'crash-after-third');
    assert.equal(crash.ledger.length, 3); assert.equal(crash.journalKeys.length, 2);
    const recovered = runner.recover(crash.jobId, 'alice', strategy);
    assert.equal(recovered.duplicates, expected); assert.equal(recovered.state, 'done');
    assert.equal(new Set(recovered.ledger.map(effect => effect.key)).size, 5);
    assert.equal(recovered.suppressed.length, strategy === 'journal-idempotency' ? 1 : 0);
    assert.throws(() => runner.recover(crash.jobId, 'alice', strategy), /terminal/);
  }
});
test('lease loss, no progress, owner checks and event ID prevent unbounded or foreign effects', () => {
  const runner = store();
  for (const scenario of ['lease-loss', 'no-progress'] as const) {
    const started = runner.start('alice', scenario);
    const recovered = runner.recover(started.jobId, 'alice', 'journal-idempotency');
    assert.equal(recovered.state, 'failed'); assert.equal(recovered.supervisor, 'fail');
    assert.equal(recovered.ledger.length, 0);
  }
  const started = runner.start('alice', 'crash-after-third');
  assert.throws(() => runner.snapshot(started.jobId, 'bob'), /another owner/);
  assert.throws(() => runner.handleTool('alice', started.jobId, 'bad', 'read_refund_item', { itemId: 'ITEM-01' }), /event ID/);
  const result = runner.handleTool('alice', started.jobId, 'sevt_123', 'record_refund_effect',
    { itemId: 'ITEM-01', effectKey: effectKey(started.jobId, 'ITEM-01'), override: true });
  assert.equal(result.is_error, true); assert.equal(result.custom_tool_use_id, 'sevt_123');
});
test('HTTP previews do not create jobs and closed owner-scoped operations reject injection', async () => {
  const app = express(), instance = createLab60Router(store()); app.use('/api/c60', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c60`;
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: unknown) => fetch(`${root}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await fetch(`${root}/simulate`)).status, 403);
  assert.equal((await post('run', { scenario: 'crash-after-third', bash: true })).status, 400);
  const started = await (await post('run', { scenario: 'crash-after-third' })).json() as { jobId: string };
  const result = await (await post('recover', { jobId: started.jobId, strategy: 'journal-idempotency' })).json() as { duplicates: number };
  assert.equal(result.duplicates, 0);
});
