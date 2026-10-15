import { createHash, randomUUID } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BetaManagedAgentsSessionThread } from '@anthropic-ai/sdk/resources/beta/sessions/threads/threads';
import type { BetaManagedAgentsAgentThreadContextCompactedEvent } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { createEventConsumer } from './session-events.js';
import type { StreamEvent } from './session-events.js';
import { lab25ResultSchema } from '../../shared/lab25-compaction-context.js';
import type { Lab25Request, Lab25Result } from '../../shared/lab25-compaction-context.js';

const rootUrl = new URL('../../fixtures/lab25/reports/', import.meta.url);
const paths = { r1: 'r1.md', r2: 'r2.md', r3: 'r3.md' } as const;
const facts = { r1: 'Aurora Finch colony has band A17', r2: 'Nest 4 was repaired after the storm',
  r3: 'marsh water level is 12 cm' } as const;
type ReportId = keyof typeof paths;

export async function readLab25Report(id: ReportId) {
  const root = await realpath(rootUrl), path = fileURLToPath(new URL(paths[id], rootUrl));
  const stat = await lstat(path), resolved = await realpath(path), inside = relative(root, resolved);
  if (!stat.isFile() || stat.isSymbolicLink() || !inside || inside === '..' || inside.startsWith('..' + sep) || stat.size > 2048)
    throw new Error('Report failed the fixed-path and size check.');
  const data = await readFile(resolved);
  if (!data.toString('utf8').includes(facts[id])) throw new Error('The authored report fact is missing.');
  return { id, path: `reports/${paths[id]}`, sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length, fact: facts[id] };
}

/** Thread usage is cumulative; the pinned response has no exact free-context field. */
export function knownContextMetrics(thread: Pick<BetaManagedAgentsSessionThread, 'usage' | 'stats'> | null) {
  const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  return { inputTokens: count(thread?.usage?.input_tokens), outputTokens: count(thread?.usage?.output_tokens),
    cacheReadTokens: count(thread?.usage?.cache_read_input_tokens),
    threadActiveSeconds: typeof thread?.stats?.active_seconds === 'number' && Number.isFinite(thread.stats.active_seconds)
      && thread.stats.active_seconds >= 0 ? thread.stats.active_seconds : null,
    contextWindowTokens: null, freeContextTokens: null, compactionThresholdTokens: null } as const;
}

function replayEvents(scenario: Lab25Request['scenario']): StreamEvent[] {
  const at = '2026-10-15T12:00:00Z';
  const events: StreamEvent[] = [{ type: 'agent.message', id: 'sevt_report_answer', processed_at: at,
    content: [{ type: 'text', text: 'I read three bounded reports and noted their facts.' }] } as StreamEvent];
  if (scenario === 'compacted') events.push({ type: 'agent.thread_context_compacted', id: 'sevt_compacted_fixture', processed_at: at } satisfies BetaManagedAgentsAgentThreadContextCompactedEvent as StreamEvent);
  events.push({ type: 'session.status_idle', id: 'sevt_idle_fixture', processed_at: at, stop_reason: { type: 'end_turn' } } as StreamEvent);
  return events;
}

export async function runLab25(input: Lab25Request, signal?: AbortSignal): Promise<Lab25Result> {
  if (input.mode !== 'scripted') throw new Error('Live context observations require separate explicit setup.');
  const ids: ReportId[] = ['r1', 'r2', 'r3']; const reports = [] as Awaited<ReturnType<typeof readLab25Report>>[];
  for (const id of ids) { signal?.throwIfAborted(); reports.push(await readLab25Report(id)); }
  const consumer = createEventConsumer(), observed = [] as { id: string; processedAt: string }[];
  for (const event of replayEvents(input.scenario)) {
    signal?.throwIfAborted(); consumer.push(event);
    if (event.type === 'agent.thread_context_compacted') observed.push({ id: event.id, processedAt: event.processed_at });
  }
  const outcome = consumer.finish(), originalSessionId = `sesn_fixture_${randomUUID()}`;
  const usage = input.scenario === 'missing-metrics' ? null : { usage: { input_tokens: 420, output_tokens: 82,
    cache_read_input_tokens: 110 }, stats: { active_seconds: 4.5 } } as unknown as Pick<BetaManagedAgentsSessionThread, 'usage' | 'stats'>;
  const summaryFacts = input.scenario === 'summary-omits' ? reports.filter(report => report.id !== 'r2') : reports;
  const summary = `Host-authored summary: ${summaryFacts.map(report => `[${report.id}] ${report.fact}`).join('; ')}.`;
  const handoff = input.includeHandoff ? { source: 'host-authored-summary' as const, originalSessionId,
    newSessionId: `sesn_fixture_${randomUUID()}`, summary,
    retained: reports.map(report => ({ id: report.id, retained: summary.includes(`[${report.id}] ${report.fact}`) })),
    newSessionAnswer: `From the supplied host summary: ${summaryFacts.map(report => report.fact).join('; ')}.` } : null;
  return lab25ResultSchema.parse({ source: 'authored-fixture', scenario: input.scenario, replaySessionId: originalSessionId,
    reports, hostReads: ids, metrics: knownContextMetrics(usage), observedCompaction: observed,
    consumerOutcome: outcome.kind, response: consumer.snapshot().messages.map(message => message.text).join('\n'), handoff,
    providerCalls: 0, cleanup: 'local-replay-complete',
    note: 'The fixture compaction event does not reveal a platform trigger threshold. Cumulative token usage is not current window occupancy. A new session receives only the host summary, which may omit facts.' });
}
