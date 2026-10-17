import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab44Collector, Lab44Telemetry, remoteTelemetryReadiness } from '../server/lib/lab44-telemetry.js';

test('remote export requires configured HTTPS destination and owner, strips content, labels fixtures and deduplicates', async () => {
  assert.equal(remoteTelemetryReadiness({ LAB44_REMOTE_EXPORT_ENABLED: '1', LAB44_OTLP_ENDPOINT: 'http://collector.example/v1/traces' }).ready, false);
  let count = 0, payload = '';
  const manager = new Lab44Telemetry({ LAB44_REMOTE_EXPORT_ENABLED: '1', LAB44_OTLP_ENDPOINT: 'https://collector.example/v1/traces', LAB44_OTLP_BEARER_TOKEN: 'private-fixture-token' },
    async (_input, init) => { count++; payload = String(init?.body); assert.equal(init?.redirect, 'error'); return new Response('{}'); });
  try {
    manager.privacy('alice', true); const run = await manager.run('alice', 'successful-tool');
    await assert.rejects(manager.exportRemote('bob', run.runId), /owned/); assert.equal(count, 0);
    assert.equal((await manager.exportRemote('alice', run.runId)).collectorAccepted, true);
    assert.match(payload, /authored-fixture/); assert.doesNotMatch(payload, /fictional.prompt|Count fictional|private-fixture-token|span.model_request/);
    assert.equal((await manager.exportRemote('alice', run.runId)).repeated, true); assert.equal(count, 1);
    assert.equal(JSON.stringify(manager.facts()).includes('private-fixture-token'), false);
  } finally { await manager.close(); }
});
test('OTLP partial rejection and oversized responses cannot claim accepted export', async () => {
  for (const response of [JSON.stringify({ partialSuccess: { rejectedSpans: 1 } }), 'x'.repeat(4097)]) {
    const manager = new Lab44Telemetry({ LAB44_REMOTE_EXPORT_ENABLED: '1', LAB44_OTLP_ENDPOINT: 'https://collector.example/v1/traces' }, async () => new Response(response));
    try { const run = await manager.run('alice', 'successful-tool'); await assert.rejects(manager.exportRemote('alice', run.runId), /rejected|bound/); }
    finally { await manager.close(); }
  }
});
import { createLab44Router } from '../server/concepts/44-otel-observability.js';
import { azureTelemetryReadiness, exportAzureHostTrace } from '../server/lib/lab44-azure.js';

test('Azure exporter uses a real OTel pipeline with redacted fixture metadata and reports rejection', async () => {
  const env = { LAB44_AZURE_EXPORT_ENABLED: '1', APPLICATIONINSIGHTS_CONNECTION_STRING: 'InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/' };
  assert.equal(azureTelemetryReadiness(env).ready, true);
  assert.equal(azureTelemetryReadiness({ ...env, APPLICATIONINSIGHTS_CONNECTION_STRING: env.APPLICATIONINSIGHTS_CONNECTION_STRING.replace('.azure.com/', '.azure.com.evil.test/') }).ready, false);
  const manager = new Lab44Telemetry();
  try { manager.privacy('alice', true); const run = await manager.run('alice', 'successful-tool'); let received = '';
    const result = await exportAzureHostTrace(env, run.hostSpans, () => ({ export(spans, callback) {
      received = JSON.stringify(spans.map(span => ({ name: span.name, attributes: span.attributes, resource: span.resource.attributes })));
      callback({ code: 0 }); }, shutdown: async () => {} }));
    assert.equal(result.spanCount, 5); assert.match(received, /authored-fixture/); assert.doesNotMatch(received, /fictional.prompt|Count fictional/);
    await assert.rejects(exportAzureHostTrace(env, run.hostSpans, () => ({ export(_spans, callback) { callback({ code: 1 }); }, shutdown: async () => {} })), /refused/);
    assert.equal(JSON.stringify(azureTelemetryReadiness(env)).includes('InstrumentationKey='), false);
  } finally { await manager.close(); }
});

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
