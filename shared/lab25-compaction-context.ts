import { z } from 'zod';

export const lab25Lesson = { id: 25, title: 'Context growth and compaction evidence', topic: 'Sessions and context', serverPrefix: '/api/c25' } as const;
export const lab25Scenarios = ['compacted', 'no-compaction', 'missing-metrics', 'summary-omits'] as const;
export const lab25RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab25Scenarios),
  includeHandoff: z.boolean(), deadlineSeconds: z.number().int().min(1).max(10).default(5) });
export type Lab25Request = z.infer<typeof lab25RequestSchema>;
const nullableCount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable();
export const lab25MetricsSchema = z.strictObject({ inputTokens: nullableCount, outputTokens: nullableCount,
  cacheReadTokens: nullableCount, threadActiveSeconds: z.number().nonnegative().nullable(),
  contextWindowTokens: z.null(), freeContextTokens: z.null(), compactionThresholdTokens: z.null() });
export const lab25ReportSchema = z.strictObject({ id: z.enum(['r1', 'r2', 'r3']), path: z.string().max(100),
  sha256: z.string().regex(/^[a-f0-9]{64}$/), bytes: z.number().int().min(1).max(2048), fact: z.string().max(160) });
export const lab25ResultSchema = z.strictObject({ source: z.literal('authored-fixture'), scenario: z.enum(lab25Scenarios),
  replaySessionId: z.string().max(100), reports: z.array(lab25ReportSchema).length(3), hostReads: z.array(z.enum(['r1', 'r2', 'r3'])).length(3),
  metrics: lab25MetricsSchema, observedCompaction: z.array(z.strictObject({ id: z.string().max(100), processedAt: z.string().max(50) })).max(2),
  consumerOutcome: z.enum(['completed', 'incomplete', 'error', 'paused']), response: z.string().max(1000),
  handoff: z.strictObject({ source: z.literal('host-authored-summary'), originalSessionId: z.string().max(100),
    newSessionId: z.string().max(100), summary: z.string().max(600), retained: z.array(z.strictObject({ id: z.enum(['r1', 'r2', 'r3']),
      retained: z.boolean() })).length(3), newSessionAnswer: z.string().max(600) }).nullable(),
  providerCalls: z.literal(0), cleanup: z.literal('local-replay-complete'),
  note: z.string().max(600) });
export type Lab25Result = z.infer<typeof lab25ResultSchema>;
