import { z } from 'zod';

export const lab49Lesson = { id: 49, title: 'Headless host and CI outcomes', topic: 'Production and deployment', serverPrefix: '/api/c49' } as const;
export const lab49Scenarios = ['pass', 'validation', 'limit', 'execution-error', 'sigterm', 'concurrency', 'unconfirmed-stop'] as const;
export const lab49RequestSchema = z.strictObject({ mode: z.literal('scripted'), scenario: z.enum(lab49Scenarios) });
export const lab49ReportSchema = z.strictObject({ task: z.literal('ci-check'), verdict: z.enum(['pass', 'fail']), summary: z.string().min(1).max(240) });
export const lab49SnapshotSchema = z.strictObject({ source: z.literal('authored-headless-fixture'), scenario: z.enum(lab49Scenarios),
  outcome: z.enum(['pass', 'validation-failed', 'limit-reached', 'execution-error', 'cancelled', 'capacity-rejected', 'remote-stop-unconfirmed']),
  exitCode: z.number().int().min(0).max(3), sessionId: z.string().nullable(), report: lab49ReportSchema.nullable(),
  hostLimits: z.strictObject({ deadlineMs: z.number().int().positive(), maxMessages: z.number().int().positive(),
    maxToolCalls: z.literal(0), maxConcurrent: z.number().int().positive(), budgetCents: z.number().int().positive() }),
  interruption: z.enum(['not-needed', 'attempted', 'unconfirmed']), cleanup: z.enum(['archived', 'pending', 'not-needed']),
  providerCalls: z.literal(0), evidence: z.array(z.string()).max(8) });
export type Lab49Scenario = (typeof lab49Scenarios)[number];
