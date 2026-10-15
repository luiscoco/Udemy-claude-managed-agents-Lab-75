import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { lab44SnapshotSchema, lab44SpanSchema } from '../../shared/lab44-otel-observability.js';
import type { Lab44Scenario } from '../../shared/lab44-otel-observability.js';

export class Lab44Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Span = ReturnType<typeof lab44SpanSchema.parse>;
type OtlpSpan = { traceId: string; spanId: string; parentSpanId?: string; name: string; kind: number;
  startTimeUnixNano: string; endTimeUnixNano: string; attributes: Array<{ key: string; value: { stringValue: string } }> };
export class Lab44Collector {
  private spans: OtlpSpan[] = []; private rejected = 0;
  private server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store'); response.setHeader('Content-Type', 'application/json');
    if (request.method !== 'POST' || request.url !== '/v1/traces') { response.statusCode = 404; response.end('{}'); return; }
    let raw = ''; for await (const chunk of request) { raw += String(chunk); if (raw.length > 16_384) { this.rejected++; response.statusCode = 413; response.end('{}'); return; } }
    let parsed: unknown; try { parsed = JSON.parse(raw); } catch { this.rejected++; response.statusCode = 400; response.end('{}'); return; }
    const batches = (parsed as { resourceSpans?: Array<{ scopeSpans?: Array<{ spans?: OtlpSpan[] }> }> })?.resourceSpans;
    const incoming = batches?.flatMap(item => item.scopeSpans?.flatMap(scope => scope.spans ?? []) ?? []) ?? [];
    if (!incoming.length || incoming.length > 20 || this.spans.length + incoming.length > 128 ||
      incoming.some(item => !/^[a-f0-9]{32}$/.test(item.traceId) || !/^[a-f0-9]{16}$/.test(item.spanId))) {
      this.rejected++; response.statusCode = 413; response.end('{}'); return; }
    this.spans.push(...incoming); response.end(JSON.stringify({ partialSuccess: {} }));
  });
  async listen() { await new Promise<void>((resolve, reject) => { this.server.once('error', reject); this.server.listen(0, '127.0.0.1', resolve); });
    const address = this.server.address(); if (!address || typeof address === 'string') throw new Error('Collector not listening.');
    return `http://127.0.0.1:${address.port}/v1/traces`; }
  state() { return { spanCount: this.spans.length, maxSpans: 128, rejectedBatches: this.rejected, transport: 'loopback-otlp-json' as const }; }
  spansFor(traceId: string) { return this.spans.filter(item => item.traceId === traceId); }
  close() { this.server.closeAllConnections(); return new Promise<void>(resolve => this.server.close(() => resolve())); }
}
export class Lab44Exporter {
  constructor(private endpoint: string) {}
  async export(spans: Span[]) {
    const now = BigInt(Date.now()) * 1_000_000n;
    const otlp: OtlpSpan[] = spans.map(span => ({ traceId: span.traceId, spanId: span.spanId,
      ...(span.parentSpanId ? { parentSpanId: span.parentSpanId } : {}), name: span.name, kind: 1,
      startTimeUnixNano: String(now), endTimeUnixNano: String(now + BigInt(Math.ceil(span.durationMs * 1_000_000))),
      attributes: Object.entries(span.attributes).map(([key, value]) => ({ key, value: { stringValue: value } })) }));
    const response = await fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceSpans: [{ resource: { attributes: [{ key: 'service.name', value: { stringValue: 'managed-labs-host' } }] },
        scopeSpans: [{ scope: { name: 'lab44-host' }, spans: otlp }] }] }), signal: AbortSignal.timeout(2000) });
    if (!response.ok) throw new Lab44Error(502, 'Local OTLP collector refused bounded span batch.');
  }
}
const hex = (bytes: number) => randomBytes(bytes).toString('hex');
function span(traceId: string, name: string, parentSpanId: string | null, status: 'ok' | 'error', attributes: Record<string, string>): Span {
  return lab44SpanSchema.parse({ traceId, spanId: hex(8), parentSpanId, name, source: 'host-otel', status, attributes, durationMs: 3 });
}
export class Lab44Telemetry {
  private collector: Lab44Collector | null = null; private exporter: Lab44Exporter | null = null;
  private entries = new Map<string, ReturnType<typeof lab44SnapshotSchema.parse>>(); private recording = new Map<string, boolean>(); private closed = false;
  async ready() { if (this.collector) return; this.collector = new Lab44Collector(); this.exporter = new Lab44Exporter(await this.collector.listen()); }
  facts() { return { source: 'host-only', protocol: 'OTLP HTTP JSON', providerModelSpanEventTypes: ['span.model_request_start', 'span.model_request_end'],
    hostExporter: 'bounded loopback collector', remoteOtlpExportObserved: false, claudeCodeChildTelemetryApplicable: false, providerCalls: 0 }; }
  privacy(owner: string, value: boolean) { this.recording.set(owner, value); return { recordFictionalContent: value, source: 'host-only', providerCalls: 0 }; }
  state() { return this.collector?.state() ?? { spanCount: 0, maxSpans: 128, rejectedBatches: 0, transport: 'loopback-otlp-json' as const }; }
  get(runId: string) { const item = this.entries.get(runId); if (!item) throw new Lab44Error(404, 'Unknown trace run.'); return item; }
  async run(owner: string, scenario: Lab44Scenario) {
    if (this.closed || this.entries.size >= 16) throw new Lab44Error(429, 'Trace exercise capacity reached.');
    await this.ready(); const traceId = hex(16), sessionId = `sesn_fixture_${hex(8)}`, threadId = `thread_fixture_${hex(8)}`;
    const toolEventId = `sevt_fixture_${hex(8)}`, root = span(traceId, 'express.request', null, 'ok', { 'http.route': '/api/c44/tracing', 'session.id': sessionId });
    const base = { 'session.id': sessionId, 'thread.id': threadId, 'event.id': toolEventId };
    const port = span(traceId, 'managed-port.send', root.spanId, 'ok', base);
    const approval = span(traceId, 'host.approval.wait', root.spanId, scenario === 'denied-tool' ? 'error' : 'ok', { ...base, decision: scenario === 'denied-tool' ? 'deny' : 'allow' });
    const effectCount = scenario === 'successful-tool' || scenario === 'missing-provider-span' ? 1 : 0;
    const recordContent = this.recording.get(owner) === true;
    const handler = span(traceId, 'host.custom-tool', approval.spanId, scenario === 'failed-tool' ? 'error' : 'ok', {
      ...base, effect: String(effectCount), ...(recordContent ? { 'fictional.prompt': 'Count fictional Aurora Finches.' } : {}) });
    const cleanup = span(traceId, 'host.cleanup', root.spanId, 'ok', { 'session.id': sessionId });
    const spans = [root, port, approval, ...(scenario === 'denied-tool' ? [] : [handler]), cleanup];
    await this.exporter!.export(spans);
    const providerEvents = scenario === 'missing-provider-span' ? [] : [
      { id: `sevt_fixture_${hex(8)}`, type: 'span.model_request_start' as const, modelRequestStartId: null, source: 'authored-provider-event-fixture' as const },
      { id: `sevt_fixture_${hex(8)}`, type: 'span.model_request_end' as const, modelRequestStartId: '', source: 'authored-provider-event-fixture' as const }];
    if (providerEvents.length === 2) providerEvents[1]!.modelRequestStartId = providerEvents[0]!.id;
    const snapshot = lab44SnapshotSchema.parse({ source: 'authored-fixture', runId: randomUUID(), scenario, sessionId, threadId, toolEventId,
      hostSpans: spans, providerEvents, effectCount, recordFictionalContent: recordContent,
      collector: this.state(), providerCalls: 0, remoteOtlpExportObserved: false,
      evidence: ['Host spans exported over loopback OTLP HTTP JSON.', 'Provider model-span event records are authored stream fixtures, not host spans.',
        scenario === 'missing-provider-span' ? 'No provider model-span signal observed in this fixture.' : 'Provider model-span start/end IDs are correlated only as event evidence.',
        recordContent ? 'Explicit fictional content recording enabled.' : 'Prompt and tool content redacted by default.'] });
    this.entries.set(snapshot.runId, snapshot); return snapshot;
  }
  async close() { this.closed = true; await this.collector?.close(); this.collector = null; this.exporter = null; this.entries.clear(); this.recording.clear(); }
}
