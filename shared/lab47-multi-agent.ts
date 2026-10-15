import { z } from 'zod';

export const lab47Lesson = { id: 47, title: 'Model driven and host driven orchestration', topic: 'Multi agent systems', serverPrefix: '/api/c47' } as const;
export const lab47Scenarios = ['regional-sales', 'incorrect-total', 'delayed-worker', 'dependency-failure'] as const;
export const lab47RequestSchema = z.strictObject({ mode: z.literal('scripted'), scenario: z.enum(lab47Scenarios) });
export const lab47SalesReportSchema = z.strictObject({ region: z.enum(['north', 'south']), sales: z.number().int().nonnegative(),
  orders: z.number().int().nonnegative(), fixtureId: z.string() });
export const lab47WorkerSchema = z.strictObject({ role: z.enum(['extractor', 'north', 'south', 'editor']),
  sessionId: z.string().nullable(), threadId: z.string().nullable(), state: z.enum(['verified', 'corrected', 'rejected', 'delayed', 'blocked']),
  attempts: z.number().int().min(0).max(2), rawReport: z.string().nullable(), verifiedReport: lab47SalesReportSchema.nullable(),
  usageScope: z.enum(['session-shared', 'independent-session']), inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(), evidence: z.string() });
export const lab47SnapshotSchema = z.strictObject({ source: z.literal('authored-offline-fixture'),
  scenario: z.enum(lab47Scenarios), route: z.enum(['orchestrator', 'hierarchy', 'pipeline', 'fanout', 'evaluator']),
  architecture: z.enum(['native', 'host']), nativeCapability: z.boolean(), depthLimit: z.literal(1),
  parentSessionId: z.string().nullable(), workers: z.array(lab47WorkerSchema).min(2).max(4),
  parentFinalText: z.string().nullable(), gate: z.enum(['passed', 'rejected', 'waiting', 'blocked']),
  sessionUsage: z.strictObject({ inputTokens: z.number().int().nonnegative().nullable(), outputTokens: z.number().int().nonnegative().nullable() }).nullable(),
  hostAggregate: z.strictObject({ inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative() }).nullable(),
  providerCalls: z.literal(0), notes: z.array(z.string()).max(8) });
export type Lab47Scenario = (typeof lab47Scenarios)[number];
export type Lab47Route = z.infer<typeof lab47SnapshotSchema>['route'];
