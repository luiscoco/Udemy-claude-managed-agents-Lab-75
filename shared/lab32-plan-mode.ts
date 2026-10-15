import { z } from 'zod';

export const lab32Lesson = { id: 32, title: 'Plan review and execution gate', topic: 'Agent workflows', serverPrefix: '/api/c32' } as const;
export const lab32Scenarios = ['approval', 'rejection', 'revision', 'stale-approval', 'planning-write'] as const;
export const lab32RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab32Scenarios) });
export const lab32DecisionSchema = z.strictObject({ runId: z.string().uuid(), planVersion: z.number().int().positive(),
  planHash: z.string().regex(/^[a-f0-9]{64}$/), decision: z.enum(['approve', 'reject', 'revise']),
  feedback: z.string().trim().min(1).max(300).optional() });
export const lab32WhoSchema = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('inspect'), runId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('attempt-write'), runId: z.string().uuid(), phase: z.enum(['planning', 'execution']),
    tool: z.enum(['append_checklist', 'write_anywhere']) }),
  z.strictObject({ operation: z.literal('cancel'), runId: z.string().uuid() }),
]);
export type Lab32Run = z.infer<typeof lab32RunSchema>;
export type Lab32Decision = z.infer<typeof lab32DecisionSchema>;
export type Lab32Who = z.infer<typeof lab32WhoSchema>;
export const lab32SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), runId: z.string().uuid(),
  scenario: z.enum(lab32Scenarios), status: z.enum(['pending', 'rejected', 'executed', 'canceled', 'expired']),
  planningSessionId: z.string().uuid(), executionSessionId: z.string().uuid().nullable(),
  planVersion: z.number().int().positive(), planHash: z.string().regex(/^[a-f0-9]{64}$/), planText: z.string(),
  selectedCapabilities: z.array(z.literal('append_checklist')).max(1), decisionCount: z.number().int().min(0).max(1),
  planningFileEffects: z.literal(0), executionFileEffects: z.number().int().min(0).max(1),
  initialFileHash: z.string(), currentFileHash: z.string(), fileText: z.string(),
  lastTool: z.strictObject({ phase: z.enum(['planning', 'execution']), tool: z.string(), allowed: z.boolean(), reason: z.string() }).nullable(),
  providerCalls: z.literal(0), note: z.string() });
