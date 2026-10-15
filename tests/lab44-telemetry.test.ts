import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab44Collector, Lab44Telemetry } from '../server/lib/lab44-telemetry.js';
import { createLab44Router } from '../server/concepts/44-otel-observability.js';

test('host spans propagate trace parent and correlate session, thread and tool event IDs', async () => {
  const manager = new Lab44Telemetry(); try {
    const run = await manager.run('alice', 'successful-tool');
    assert.equal(run.effectCount, 1); assert.equal(run.hostSpans.length, 5);
    const root = run.hostSpans[0]!; assert.equal(root.parentSpanId, null);
    assert.ok(run.hostSpans.every(item => item.traceId === root.traceId));
    assert.equal(run.hostSpans[1]?.parentSpanId, root.spanId);
    assert.equal(run.hostSpans[3]?.parentSpanId, run.hostSpans[2]?.spanId);
    assert.equal(run.hostSpans[3]?.attributes['event.id'], run.toolEventId);
    assert.equal(run.hostSpans[3]?.attributes['session.id'], run.sessionId);
    assert.equal(run.hostSpans[3]?.attributes['thread.id'], run.threadId);
    assert.equal(run.collector.spanCount, 5); assert.equal(run.providerEvents[1]?.modelRequestStartId, run.providerEvents[0]?.id);
    assert.equal(run.remoteOtlpExportObserved, false);
  } finally { await manager.close(); }
});

test('denied and failed tools distinguish host decisions, effects and provider gaps', async () => {
  const manager = new Lab44Telemetry(); try {
    const denied = await manager.run('alice', 'denied-tool'); assert.equal(denied.effectCount, 0);
    assert.equal(denied.hostSpans.some(item => item.name === 'host.custom-tool'), false);
    assert.equal(denied.hostSpans.find(item => item.name === 'host.approval.wait')?.attributes.decision, 'deny');
    const failed = await manager.run('alice', 'failed-tool'); assert.equal(failed.effectCount, 0);
    assert.equal(failed.hostSpans.find(item => item.name === 'host.custom-tool')?.status, 'error');
    const gap = await manager.run('alice', 'missing-provider-span'); assert.equal(gap.providerEvents.length, 0);
    assert.equal(gap.hostSpans.length, 5);
  } finally { await manager.close(); }
});

test('fictional content recording is explicit and owner scoped', async () => {
  const manager = new Lab44Telemetry(); try {
    const redacted = await manager.run('alice', 'successful-tool');
    assert.equal(redacted.hostSpans.some(item => 'fictional.prompt' in item.attributes), false);
    manager.privacy('alice', true);
    const recorded = await manager.run('alice', 'successful-tool');
    assert.match(recorded.hostSpans.find(item => item.name === 'host.custom-tool')?.attributes['fictional.prompt'] ?? '', /fictional/);
    const other = await manager.run('bob', 'successful-tool');
    assert.equal(other.hostSpans.some(item => 'fictional.prompt' in item.attributes), false);
  } finally { await manager.close(); }
});

test('loopback collector rejects oversized or malformed span batches', async () => {
  const collector = new Lab44Collector(), endpoint = await collector.listen(); try {
    const malformed = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
    assert.equal(malformed.status, 400);
    const excessive = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceSpans: [{ scopeSpans: [{ spans: Array.from({ length: 21 }, () => ({ traceId: '0'.repeat(32), spanId: '0'.repeat(16) })) }] }] }) });
    assert.equal(excessive.status, 413); assert.equal(collector.state().spanCount, 0); assert.equal(collector.state().rejectedBatches, 2);
  } finally { await collector.close(); }
});

test('HTTP closed schemas and live refusal prevent unreviewed telemetry', async () => {
  const app = express(), instance = createLab44Router(); app.use('/api/c44', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c44`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object) => fetch(`${base}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await post('tracing', { mode: 'live', scenario: 'successful-tool' })).status, 422);
  assert.equal((await post('privacy', { recordFictionalContent: true, rawPrompts: true })).status, 400);
  const run = await (await post('tracing', { mode: 'scripted', scenario: 'successful-tool' })).json() as { collector: { spanCount: number } };
  assert.equal(run.collector.spanCount, 5);
  assert.equal((await post('collector', {})).status, 200);
  assert.equal((await fetch(`${base}/facts`, { headers })).status, 200);
});
