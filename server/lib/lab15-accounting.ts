import type { Lab15Metrics, Lab15Reading } from '../../shared/lab15-usage.js';
import type { StreamEvent } from './session-events.js';

export const emptyLab15Metrics = (): Lab15Metrics => ({ inputTokens: null, outputTokens: null, cacheReadTokens: null, cache5mTokens: null,
  cache1hTokens: null, cacheCreationTokens: null, listCostCents: null, activeSeconds: null, webSearchRequests: null, webFetchRequests: null });
/** Provider monetary amounts are strings of whole cents, not decimal dollars. */
export function parseUsdCents(value: unknown): number | null {
  if (!value || typeof value !== 'object' || !('currency' in value) || value.currency !== 'USD' || !('amount' in value)
    || typeof value.amount !== 'string' || value.amount.length > 16 || !/^(0|[1-9]\d*)$/.test(value.amount)) return null;
  const cents = BigInt(value.amount); return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
}
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const count = (value: unknown): number | null => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
export function normalizeLab15Usage(value: unknown): Lab15Metrics {
  const usage = object(value), cache = object(usage.cache_creation), tools = object(usage.server_tool_use);
  const five = count(cache.ephemeral_5m_input_tokens), hour = count(cache.ephemeral_1h_input_tokens);
  return { inputTokens: count(usage.input_tokens), outputTokens: count(usage.output_tokens), cacheReadTokens: count(usage.cache_read_input_tokens),
    cache5mTokens: five, cache1hTokens: hour, cacheCreationTokens: five === null || hour === null ? null : count(five + hour),
    listCostCents: parseUsdCents(usage.list_cost), activeSeconds: typeof usage.active_seconds === 'number' && Number.isFinite(usage.active_seconds) && usage.active_seconds >= 0 && usage.active_seconds <= Number.MAX_SAFE_INTEGER ? usage.active_seconds : null,
    webSearchRequests: count(tools.web_search_requests), webFetchRequests: count(tools.web_fetch_requests) };
}
export function lab15Delta(previous: Lab15Metrics | undefined, current: Lab15Metrics) {
  const delta = emptyLab15Metrics(); let decreased = false;
  for (const key of Object.keys(delta) as (keyof Lab15Metrics)[]) {
    const before = previous?.[key], after = current[key];
    if (before !== null && before !== undefined && after !== null) {
      if (after >= before) delta[key] = after - before; else decreased = true;
    }
  }
  return { delta, deltaNote: !previous ? 'Initial observation; no comparable earlier snapshot.' : decreased ? 'Some counters decreased; those deltas are unknown, not negative or clamped to zero.' : 'Nonnegative deltas compare the same identity, scope and source only; missing fields remain unknown.' };
}
export function createLab15Ledger() {
  const latest = new Map<string, Lab15Reading>(), seen = new Set<string>();
  const spanMetrics = emptyLab15Metrics(); let duplicates = 0, stale = 0, spans = 0;
  const history: Lab15Reading[] = [];
  function replace(input: Omit<Lab15Reading, 'delta' | 'deltaNote'>) {
    const key = `${input.scope}:${input.identity}:${input.via}`, previous = latest.get(key);
    if (previous && Number.isFinite(Date.parse(input.asOf)) && Date.parse(input.asOf) < Date.parse(previous.asOf)) { stale++; return; }
    const reading = { ...input, ...lab15Delta(previous?.metrics, input.metrics) };
    if (!latest.has(key) && latest.size >= 12) return;
    latest.set(key, reading); history.push(reading); if (history.length > 16) history.shift();
  }
  function event(event: StreamEvent, sessionId: string) {
    if (!('id' in event) || !['session.usage', 'span.model_request_end'].includes(event.type)) return;
    if (seen.has(event.id)) { duplicates++; return; }
    if (seen.size >= 1000) throw new Error('Usage event limit reached.'); seen.add(event.id);
    if (event.type === 'session.usage') replace({ scope: 'session', identity: sessionId, via: 'session.usage', asOf: event.processed_at, metrics: normalizeLab15Usage(event.usage), agentName: null });
    if (event.type === 'span.model_request_end') {
      const usage = event.model_usage;
      for (const [key, value] of [['inputTokens', usage.input_tokens], ['outputTokens', usage.output_tokens], ['cacheReadTokens', usage.cache_read_input_tokens], ['cacheCreationTokens', usage.cache_creation_input_tokens]] as const) {
        const next = count(value), before = spanMetrics[key];
        spanMetrics[key] = next === null || spans && before === null ? null : count((before ?? 0) + next);
      }
      // Span usage has one aggregate cache-creation field, not a TTL breakdown.
      // Keep it separate in the explanatory scope rather than inventing a TTL.
      spans++;
      replace({ scope: 'observed-request-spans', identity: `${sessionId}:primary-stream`, via: 'model-request-end', asOf: event.processed_at,
        metrics: { ...spanMetrics }, agentName: null });
    }
  }
  return { replace, event, snapshot: () => ({ readings: [...latest.values()].map(item => structuredClone(item)), history: structuredClone(history), duplicateEvents: duplicates, staleSnapshots: stale }) };
}
