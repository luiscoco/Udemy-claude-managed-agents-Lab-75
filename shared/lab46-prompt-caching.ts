import { z } from 'zod';

export const lab46Lesson = { id: 46, title: 'Observed cache usage and cost', topic: 'Production and deployment', serverPrefix: '/api/c46' } as const;
export const lab46Scenarios = ['reused-content', 'changed-prefix', 'changed-model', 'changed-tools', 'short-input', 'missing-usage'] as const;
export const lab46RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab46Scenarios) });
export const lab46CountersSchema = z.strictObject({ inputTokens: z.number().int().nonnegative().nullable(), outputTokens: z.number().int().nonnegative().nullable(),
  cacheReadTokens: z.number().int().nonnegative().nullable(), cacheCreationTokens: z.number().int().nonnegative().nullable() });
export const lab46DeltaSchema = z.strictObject({ inputTokens: z.number().int().nullable(), outputTokens: z.number().int().nullable(),
  cacheReadTokens: z.number().int().nullable(), cacheCreationTokens: z.number().int().nullable() });
export const lab46ReadingSchema = z.strictObject({ sessionId: z.string(), model: z.string(), toolsVersion: z.string(), contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  turn: z.number().int().positive(), via: z.enum(['session.usage', 'span.model_request_end', 'missing']), scope: z.enum(['session', 'model-request']),
  counters: lab46CountersSchema, listCostCents: z.number().int().nonnegative().nullable() });
export const lab46SnapshotSchema = z.strictObject({ source: z.literal('authored-usage-fixture'), scenario: z.enum(lab46Scenarios),
  handbook: z.string(), dynamicSuffixes: z.tuple([z.string(), z.string()]), readings: z.tuple([lab46ReadingSchema, lab46ReadingSchema]),
  comparable: z.boolean(), delta: lab46DeltaSchema.nullable(), uncertainty: z.string(), savingsClaim: z.literal(false),
  controllableCacheBoundary: z.literal(false), providerCalls: z.literal(0), evidence: z.array(z.string()).max(12) });
export type Lab46Scenario = (typeof lab46Scenarios)[number];
