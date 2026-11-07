// Lab 44 live evidence: turn the real events of one Claude Managed Agents turn into host trace spans.
// Run from the repo root: node --env-file=.env --import tsx _live44.ts
// Billed: one session, one short user turn, no tools, 120 s deadline. The session is archived in `finally`.
// Spans are validated with the lab's own lab44SpanSchema and sent only to the lab's in-process loopback
// Lab44Collector (127.0.0.1). Nothing is exported to Azure Monitor or a remote OTLP endpoint: every LAB44_*,
// APPLICATIONINSIGHTS_* and OTEL_* setting is removed from this process before anything runs.
for (const key of Object.keys(process.env)) if (/^(LAB44_|APPLICATIONINSIGHTS_|OTEL_)/.test(key)) delete process.env[key];

import Anthropic from '@anthropic-ai/sdk';
import { randomBytes } from 'node:crypto';
import { lab44SpanSchema } from '../../shared/lab44-otel-observability.js';
import { Lab44Collector, Lab44Exporter, remoteTelemetryReadiness } from '../../server/lib/lab44-telemetry.js';
import { azureTelemetryReadiness } from '../../server/lib/lab44-azure.js';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
  openTelemetry: { propagation: false, traces: { enabled: false } } });
const sessions = client.beta.sessions;
const deadline = Date.now() + 120_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const log = (line: string) => console.log(line);
const why = (error: unknown) => error instanceof Anthropic.APIError ? `${error.status} ${error.constructor.name} (${error.type ?? 'error'})` : String(error);
const hex = (bytes: number) => randomBytes(bytes).toString('hex');
const ms = (from: string, to: string) => Math.max(0, Date.parse(to) - Date.parse(from));
const secs = (value: number) => `${(value / 1000).toFixed(2)} s`;
const textOf = (event: { content?: Array<{ type: string; text?: string }> }) =>
  (event.content ?? []).map(block => block.type === 'text' ? block.text ?? '' : '').join(' ').trim();

type Event = Awaited<ReturnType<typeof sessions.events.list>>['data'][number];
async function history(id: string) {
  const all: Event[] = []; let cursor: string | undefined, pages = 0;
  do {
    const page = await sessions.events.list(id, { limit: 50, order: 'asc', ...(cursor ? { page: cursor } : {}) }, { timeout: 10000 });
    all.push(...page.data); cursor = page.next_page ?? undefined; pages++;
  } while (cursor && pages < 10);
  return all;
}
async function waitTurnIdle(id: string, messageId: string, maxMs: number) {
  const start = Date.now();
  while (Date.now() - start < maxMs && Date.now() < deadline) {
    const events = await history(id);
    const at = messageId ? events.findIndex(event => event.id === messageId) : events.map(event => event.type).lastIndexOf('user.message');
    if (at >= 0 && events.slice(at).some(event => event.type === 'session.status_idle')) return events;
    await sleep(700);
  }
  return null;
}

type Span = ReturnType<typeof lab44SpanSchema.parse>;
const traceId = hex(16);
const span = (name: string, parentSpanId: string | null, durationMs: number, attributes: Record<string, string>, status: 'ok' | 'error' = 'ok'): Span =>
  lab44SpanSchema.parse({ traceId, spanId: hex(8), parentSpanId, name, source: 'host-otel', status, attributes, durationMs });

const prompt = 'In one sentence, write a fictional field note by Aurora Finch about three herons at dawn.';
let sessionId: string | undefined, archived = false; const collector = new Lab44Collector();
try {
  const base = await client.beta.agents.retrieve(agentId, {}, { timeout: 5000 });
  const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
    tools: [], mcp_servers: [], skills: [], system: 'You write short fictional field notes. No tools are needed.' },
    environment_id: environmentId, title: 'Lab 44 host telemetry',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { timeout: 10000 });
  sessionId = session.id;
  log(`Session ${session.id} created · status ${session.status}`);

  const sendStart = Date.now();
  const sent = await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] });
  const sendMs = Date.now() - sendStart; const messageId = sent.data?.[0]?.id ?? '';
  const events = await waitTurnIdle(session.id, messageId, 90000);
  if (!events) throw new Error('Turn did not reach idle before the deadline.');
  const count = (type: string) => events.filter(event => event.type === type).length;
  log(`One user turn → idle · events.list: ${events.length} events · span.model_request_start ${count('span.model_request_start')}`
    + ` · span.model_request_end ${count('span.model_request_end')} · session.usage ${count('session.usage')}`);

  // Convert the real provider events into host spans: one trace, a root span for the turn, children per step.
  const user = events.find(event => event.type === 'user.message');
  const idle = events.find(event => event.type === 'session.status_idle');
  const usage = [...events].reverse().find(event => event.type === 'session.usage');
  const thread = events.find(event => event.type === 'session.thread_status_running');
  if (!user || user.type !== 'user.message' || !idle || idle.type !== 'session.status_idle') throw new Error('Turn events missing.');
  const root = span('managed.session.turn', null, ms(user.processed_at!, idle.processed_at), { 'session.id': session.id,
    ...(thread && thread.type === 'session.thread_status_running' ? { 'thread.id': thread.session_thread_id } : {}), 'stop.reason': idle.stop_reason.type,
    ...(usage && usage.type === 'session.usage' ? { 'session.usage.input_tokens': String(usage.usage.input_tokens ?? 0), 'session.usage.output_tokens': String(usage.usage.output_tokens ?? 0) } : {}) });
  const spans: Span[] = [root];
  spans.push(span('managed-port.send', root.spanId, sendMs, { 'session.id': session.id, 'event.id': user.id, 'content.redacted': 'true' }));
  const starts = new Map(events.filter(event => event.type === 'span.model_request_start').map(event => [event.id, event]));
  let inputSum = 0, outputSum = 0;
  for (const end of events) {
    if (end.type !== 'span.model_request_end') continue;
    const start = starts.get(end.model_request_start_id); const u = end.model_usage;
    inputSum += u.input_tokens; outputSum += u.output_tokens;
    spans.push(span('provider.model_request', root.spanId, start ? ms(start.processed_at, end.processed_at) : 0, { 'session.id': session.id,
      'event.id': end.model_request_start_id, 'lab44.source': 'provider-event', 'gen_ai.usage.input_tokens': String(u.input_tokens),
      'gen_ai.usage.output_tokens': String(u.output_tokens), 'gen_ai.usage.cache_read_input_tokens': String(u.cache_read_input_tokens) }, end.is_error ? 'error' : 'ok'));
  }
  const replies = events.filter(event => event.type === 'agent.message');
  for (const reply of replies) spans.push(span('agent.message', root.spanId, 0, { 'session.id': session.id, 'event.id': reply.id, 'content.redacted': 'true' }));

  log(`Trace ${traceId} · ${spans.length} host spans checked by lab44SpanSchema`);
  for (const item of spans) {
    const a = item.attributes;
    const extra = item.name === 'managed.session.turn' ? `stop ${a['stop.reason']}`
      : item.name === 'provider.model_request' ? `input ${a['gen_ai.usage.input_tokens']} · output ${a['gen_ai.usage.output_tokens']} tokens`
      : `content redacted`;
    log(`  ${item.name.padEnd(22)} span ${item.spanId.slice(0, 8)} · parent ${item.parentSpanId?.slice(0, 8) ?? 'none    '} · ${secs(item.durationMs)} · ${extra}`);
  }
  const replyChars = replies.reduce((sum, reply) => sum + (reply.type === 'agent.message' ? textOf(reply).length : 0), 0);
  log(`Redaction: prompt (${prompt.length} chars) and reply (${replyChars} chars) are not in any span attribute`);
  if (usage && usage.type === 'session.usage') log(`session.usage: input ${usage.usage.input_tokens ?? 0} · output ${usage.usage.output_tokens ?? 0}`
    + ` · equals the model_request_end sum: ${usage.usage.input_tokens === inputSum && usage.usage.output_tokens === outputSum ? 'yes' : 'no'}`);
  const leaked = spans.some(item => Object.values(item.attributes).some(value => value.includes('Aurora') || value.includes('heron')));
  log(`Content check: no span attribute contains the prompt or reply text: ${leaked ? 'no' : 'yes'}`);

  // Bounded local export with the lab's own exporter and collector: loopback only, inside this process.
  const endpoint = await collector.listen(); await new Lab44Exporter(endpoint).export(spans);
  log(`Lab44Exporter → loopback Lab44Collector (127.0.0.1, OTLP HTTP JSON): ${collector.spansFor(traceId).length} spans`
    + ` · rejected batches ${collector.state().rejectedBatches}`);
  log(`Remote OTLP ready: ${remoteTelemetryReadiness(env).ready ? 'yes' : 'no'} · Azure Monitor ready: ${azureTelemetryReadiness(env).ready ? 'yes' : 'no'}`
    + ' · LAB44_* settings removed: nothing exported');

  await sessions.archive(session.id); archived = true;
  const final = await sessions.retrieve(session.id);
  log(`Archived: ${final.archived_at ? 'yes' : 'no'} · final status ${final.status}`);
} catch (error) {
  log(`Live run failed: ${why(error)}`);
  process.exitCode = 1;
} finally {
  await collector.close();
  if (sessionId && !archived) { try { await sessions.archive(sessionId); log('Cleanup: archived'); } catch { log('Cleanup: archive failed'); } }
}
