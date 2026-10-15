import { z } from 'zod';

export const lab42Lesson = { id: 42, title: 'Bounded web research and citations', topic: 'Tools and extensions', serverPrefix: '/api/c42' } as const;
export const lab42RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(['basics', 'fetch', 'injection', 'redirect', 'blocked-host', 'research']) });
export const lab42IdSchema = z.strictObject({ runId: z.string().uuid() });
export const lab42SourceSchema = z.strictObject({ evidenceId: z.string(), url: z.string().url(), kind: z.enum(['snippet', 'complete-page']), title: z.string(), text: z.string(),
  inspected: z.boolean(), hostileInstruction: z.boolean() });
export const lab42SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), runId: z.string().uuid(), scenario: lab42RequestSchema.shape.scenario,
  query: z.string(), maxRequests: z.number().int().positive(), requestCount: z.number().int().nonnegative(), maxRedirects: z.number().int().nonnegative(),
  sources: z.array(lab42SourceSchema), redirects: z.array(z.string()), decision: z.enum(['allowed', 'refused']), reason: z.string(),
  answer: z.string(), citations: z.array(z.string()), citationsVerified: z.boolean(), providerCalls: z.literal(0),
  tools: z.strictObject({ builtInWebFetch: z.literal(false), bash: z.literal(false), customFetch: z.literal(true) }), evidence: z.array(z.string()).max(20) });
export type Lab42Scenario = z.infer<typeof lab42RequestSchema>['scenario'];
