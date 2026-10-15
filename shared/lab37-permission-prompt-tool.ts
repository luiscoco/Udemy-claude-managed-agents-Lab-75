import { z } from 'zod';

export const lab37Lesson = { id: 37, title: 'External policy decision service', topic: 'Permissions and security', serverPrefix: '/api/c37' } as const;
export const lab37Scenarios = ['preallowed', 'deny', 'timeout', 'malformed', 'host-refusal', 'allow'] as const;
export const lab37RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab37Scenarios), gate: z.enum(['worker', 'local-reviewer']) });
export const lab37DecideSchema = z.strictObject({ runId: z.string().uuid(), eventId: z.string().regex(/^sevt_[A-Za-z0-9_-]{1,60}$/),
  reviewerDecision: z.enum(['allow', 'deny']).optional() });
export const lab37WhoSchema = z.strictObject({ runId: z.string().uuid() });
export const lab37GateOutputSchema = z.strictObject({ decision: z.enum(['allow', 'deny']), reason: z.string().trim().min(1).max(160) });
export const lab37SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), runId: z.string().uuid(),
  scenario: z.enum(lab37Scenarios), gate: z.enum(['worker', 'local-reviewer']), status: z.enum(['pending', 'preallowed', 'allowed', 'denied', 'timed-out', 'malformed', 'canceled']),
  eventId: z.string().nullable(), action: z.strictObject({ tool: z.literal('Write'), path: z.string() }).nullable(),
  gateDecision: z.enum(['allow', 'deny']).nullable(), hostDecision: z.enum(['allow', 'deny']).nullable(),
  confirmation: z.strictObject({ type: z.literal('user.tool_confirmation'), tool_use_id: z.string(), result: z.enum(['allow', 'deny']),
    deny_message: z.string().optional() }).nullable(), confirmationCount: z.number().int().min(0).max(1),
  fileEffects: z.number().int().min(0).max(1), fixtureText: z.string(), providerCalls: z.literal(0), evidence: z.array(z.string()).max(12), note: z.string() });
export type Lab37Run = z.infer<typeof lab37RunSchema>;
export type Lab37Decide = z.infer<typeof lab37DecideSchema>;
