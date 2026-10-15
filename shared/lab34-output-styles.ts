import { z } from 'zod';

export const lab34Lesson = { id: 34, title: 'Output instruction variants', topic: 'SDK fundamentals', serverPrefix: '/api/c34' } as const;
export const lab34StyleNames = ['concise', 'explanatory', 'review-v1', 'review-v2'] as const;
export const lab34FixedQuestion = 'What should a fictional Aurora Finch observation note include?';
export const lab34CompareSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), style: z.string().trim().min(1).max(40) });
export const lab34WhoSchema = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('inspect'), runId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('close'), runId: z.string().uuid() }),
]);
export const lab34ReportSchema = z.strictObject({ project: z.literal('Aurora Finch'), summary: z.string().min(10).max(400),
  nextSteps: z.array(z.string().min(1).max(100)).min(1).max(4) });
export const lab34SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), runId: z.string().uuid(), sessionId: z.string().uuid(),
  status: z.enum(['completed', 'closed', 'expired']), style: z.enum(lab34StyleNames), styleHash: z.string().regex(/^[a-f0-9]{64}$/),
  stylePath: z.string(), instruction: z.string(), configuredSystem: z.string(), question: z.literal(lab34FixedQuestion),
  capabilities: z.array(z.string()).length(0), answer: z.string(), reportValid: z.boolean(), reportErrors: z.array(z.string()),
  providerCalls: z.literal(0), note: z.string() });
export type Lab34Snapshot = z.infer<typeof lab34SnapshotSchema>;
