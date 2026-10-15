import { z } from 'zod';

export const lab31Lesson = { id: 31, title: 'Host questions and correlated answers', topic: 'Agent workflows', serverPrefix: '/api/c31' } as const;
export const lab31Scenarios = ['deployment-target', 'option-selection', 'allowed-custom-text', 'invalid-answer', 'expiry', 'cancel-waiting'] as const;
export const lab31RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab31Scenarios) });
export const lab31AskUserShape = z.strictObject({ question: z.string().trim().min(1).max(240),
  options: z.array(z.strictObject({ id: z.string().regex(/^[a-z][a-z0-9_-]{0,24}$/), label: z.string().trim().min(1).max(80) })).min(2).max(5),
  allowCustom: z.boolean() });
export const lab31AnswerSchema = z.strictObject({ runId: z.string().uuid(), sessionId: z.string().uuid(), eventId: z.string().regex(/^sevt_[A-Za-z0-9_-]{1,60}$/),
  selectedOption: z.string().regex(/^[a-z][a-z0-9_-]{0,24}$/).optional(), customText: z.string().trim().min(1).max(200).optional() });
export const lab31ToolsSchema = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('inspect'), runId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('cancel'), runId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('wait'), runId: z.string().uuid(), timeoutMs: z.number().int().min(100).max(5000) }),
]);
export type Lab31Answer = z.infer<typeof lab31AnswerSchema>;
export type Lab31Run = z.infer<typeof lab31RunSchema>;
export type Lab31Tools = z.infer<typeof lab31ToolsSchema>;
export const lab31SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), runId: z.string().uuid(), sessionId: z.string().uuid(),
  eventId: z.string(), scenario: z.enum(lab31Scenarios), status: z.enum(['pending', 'answered', 'expired', 'canceled']),
  question: lab31AskUserShape, expiresAt: z.string(), answer: z.string().nullable(),
  resultEvent: z.strictObject({ type: z.literal('user.custom_tool_result'), custom_tool_use_id: z.string(), is_error: z.boolean(),
    content: z.array(z.strictObject({ type: z.literal('text'), text: z.string() })).length(1) }).nullable(),
  resultSendCount: z.number().int().min(0).max(1), unrelatedToolEffects: z.literal(0), providerCalls: z.literal(0), note: z.string() });
