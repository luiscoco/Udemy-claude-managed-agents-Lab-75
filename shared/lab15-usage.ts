import { z } from 'zod';
import { lab01OutcomeSchema } from './lab01-events.js';

export const lab15Lesson = { id: 15, title: 'Usage and session budgets', topic: 'Models and reasoning', serverPrefix: '/api/c15' } as const;
export const lab15Scenarios = ['normal', 'repeated-usage', 'child-activity', 'budget-reached', 'missing-usage', 'hang'] as const;
export const lab15RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), prompt: z.string().trim().min(1).max(1000),
  scenario: z.enum(lab15Scenarios).default('normal'), budgetCents: z.number().int().min(1).max(500).default(50),
  maxTurns: z.number().int().min(1).max(3).default(3), maxMessages: z.number().int().min(1).max(3).default(3),
  deadlineSeconds: z.number().int().min(1).max(120).default(30),
}).superRefine((value, ctx) => { if (value.mode === 'live' && value.scenario !== 'normal') ctx.addIssue({ code: 'custom', message: 'Authored usage scenarios are offline only.' }); });
export type Lab15Input = z.infer<typeof lab15RequestSchema>;
export const lab15ControlSchema = z.strictObject({ runId: z.uuid() });
export const lab15SendSchema = lab15ControlSchema.extend({ prompt: z.string().trim().min(1).max(1000) });
export const lab15ContextSchema = lab15ControlSchema.extend({ text: z.string().trim().min(1).max(1000) });
export const lab15BudgetSchema = lab15ControlSchema.extend({ budgetCents: z.number().int().min(1).max(500), acknowledgeResume: z.literal(true) });
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable();
export const lab15MetricsSchema = z.strictObject({ inputTokens: count, outputTokens: count, cacheReadTokens: count,
  cache5mTokens: count, cache1hTokens: count, cacheCreationTokens: count, listCostCents: count, activeSeconds: z.number().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(),
  webSearchRequests: count, webFetchRequests: count,
});
export type Lab15Metrics = z.infer<typeof lab15MetricsSchema>;
export const lab15ReadingSchema = z.strictObject({ scope: z.enum(['session', 'thread', 'observed-request-spans']), identity: z.string().max(200),
  via: z.enum(['retrieval', 'session.usage', 'model-request-end']), asOf: z.string().max(100), metrics: lab15MetricsSchema,
  delta: lab15MetricsSchema, deltaNote: z.string().max(200), agentName: z.string().max(100).nullable(),
});
export type Lab15Reading = z.infer<typeof lab15ReadingSchema>;
export const lab15SnapshotSchema = z.strictObject({ runId: z.uuid(), source: z.enum(['authored-fixture', 'managed-api']),
  sessionId: z.string().max(200).nullable(), state: z.enum(['prepared', 'running', 'idle', 'budget-paused', 'closed', 'cleanup-pending']),
  model: z.string().max(128).nullable(), budgetCents: z.number().int().min(1).max(500),
  maxTurns: z.number().int(), turnsUsed: z.number().int(), maxMessages: z.number().int(), messagesUsed: z.number().int(),
  contextsUsed: z.number().int(), toolCallsAllowed: z.literal(0), budgetRaisesUsed: z.number().int(),
  outcome: lab01OutcomeSchema.nullable(), response: z.string().max(8000),
  readings: z.array(lab15ReadingSchema).max(12), history: z.array(lab15ReadingSchema).max(16),
  duplicateEvents: z.number().int().nonnegative(), staleSnapshots: z.number().int().nonnegative(),
  threadsNote: z.string().max(300), interruption: z.enum(['not-needed', 'confirmed', 'unconfirmed', 'simulated']),
  cleanup: z.enum(['not-needed', 'retained', 'archived', 'pending', 'simulated']), message: z.string().max(600),
});
export type Lab15Snapshot = z.infer<typeof lab15SnapshotSchema>;
export function displayCents(value: number | null) { return value === null ? 'not available' : `$${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`; }
