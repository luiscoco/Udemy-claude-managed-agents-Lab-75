import { AzureMonitorTraceExporter } from '@azure/monitor-opentelemetry-exporter';
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor, type SpanExporter } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import type { lab44SpanSchema } from '../../shared/lab44-otel-observability.js';
import type { z } from 'zod';

export function azureTelemetryReadiness(env: NodeJS.ProcessEnv = process.env) {
  const enabled = env.LAB44_AZURE_EXPORT_ENABLED === '1', raw = env.APPLICATIONINSIGHTS_CONNECTION_STRING ?? '';
  const missing = raw.trim() ? [] : ['APPLICATIONINSIGHTS_CONNECTION_STRING'], invalid: string[] = [];
  if (raw) { try { const values = Object.fromEntries(raw.split(';').filter(Boolean).map(part => { const index = part.indexOf('='); return [part.slice(0, index).toLowerCase(), part.slice(index + 1)]; }));
    const url = new URL(values.ingestionendpoint!);
    if (!/^[a-f0-9-]{36}$/i.test(values.instrumentationkey ?? '') || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      !/(^|\.)applicationinsights\.azure\.com$/.test(url.hostname)) invalid.push('APPLICATIONINSIGHTS_CONNECTION_STRING');
  } catch { invalid.push('APPLICATIONINSIGHTS_CONNECTION_STRING'); } }
  return { enabled, ready: enabled && !missing.length && !invalid.length, missing, invalid, enableSetting: 'LAB44_AZURE_EXPORT_ENABLED=1', source: 'authored-fixture-host-spans', providerTraceObserved: false };
}
export async function exportAzureHostTrace(env: NodeJS.ProcessEnv, spans: z.infer<typeof lab44SpanSchema>[], factory?: () => SpanExporter) {
  if (!azureTelemetryReadiness(env).ready) throw new Error('Configure and enable Azure telemetry first.');
  const memory = new InMemorySpanExporter(), provider = new BasicTracerProvider({ resource: resourceFromAttributes({ 'service.name': 'managed-agents-labs', 'lab44.data_source': 'authored-fixture' }), spanProcessors: [new SimpleSpanProcessor(memory)] });
  const tracer = provider.getTracer('lab44-authored-host');
  for (const source of spans) { const span = tracer.startSpan(source.name, { attributes: { 'lab44.data_source': 'authored-fixture', 'lab44.source_trace_id': source.traceId, 'lab44.source_span_id': source.spanId, 'lab44.source_parent_id': source.parentSpanId ?? '', 'lab44.status': source.status } }); span.end(); }
  await provider.forceFlush();
  const exporter = factory?.() ?? new AzureMonitorTraceExporter({ connectionString: env.APPLICATIONINSIGHTS_CONNECTION_STRING!, disableOfflineStorage: true, retryOptions: { maxRetries: 0 } });
  try { await new Promise<void>((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Azure export deadline; acceptance unconfirmed.')), 15000);
    try { void Promise.resolve(exporter.export(memory.getFinishedSpans(), result => { clearTimeout(timer); result.code === 0 ? resolve() : reject(new Error('Azure collector refused the trace.')); })).catch(() => { clearTimeout(timer); reject(new Error('Azure exporter failed.')); }); }
    catch { clearTimeout(timer); reject(new Error('Azure exporter failed.')); } });
    return { collectorAccepted: true, source: 'authored-fixture-host-spans', spanCount: spans.length, providerTraceObserved: false };
  } finally { await exporter.shutdown(); await provider.shutdown(); }
}
