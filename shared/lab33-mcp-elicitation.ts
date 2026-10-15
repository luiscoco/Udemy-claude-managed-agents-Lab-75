import { z } from 'zod';

export const lab33Lesson = { id: 33, title: 'Human forms during tool work', topic: 'Tools and extensions', serverPrefix: '/api/c33' } as const;
export const lab33Scenarios = ['valid-form', 'invalid-values', 'decline', 'timeout', 'abort', 'url-consent'] as const;
export const lab33RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab33Scenarios) });
export const lab33FieldSchema = z.strictObject({ date: z.iso.date(), quantity: z.number().int().min(1).max(10) });
export const lab33RespondSchema = z.discriminatedUnion('action', [
  z.strictObject({ runId: z.string().uuid(), mcpRequestId: z.number().int().positive(), customCallId: z.string().regex(/^sevt_[A-Za-z0-9_-]{1,60}$/),
    consentId: z.string().uuid(), action: z.literal('accept'), content: lab33FieldSchema }),
  z.strictObject({ runId: z.string().uuid(), mcpRequestId: z.number().int().positive(), customCallId: z.string().regex(/^sevt_[A-Za-z0-9_-]{1,60}$/),
    consentId: z.string().uuid(), action: z.literal('decline') }),
]);
export const lab33WhoSchema = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('inspect'), runId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('abort'), runId: z.string().uuid() }),
]);
export const lab33LogSchema = z.strictObject({ runId: z.string().uuid() });
export type Lab33Run = z.infer<typeof lab33RunSchema>;
export type Lab33Respond = z.infer<typeof lab33RespondSchema>;
export const lab33SnapshotSchema = z.strictObject({ source: z.literal('local-mcp-fixture'), runId: z.string().uuid(), scenario: z.enum(lab33Scenarios),
  status: z.enum(['starting', 'pending', 'accepted', 'declined', 'timed-out', 'aborted', 'error']),
  question: z.string(), mcpRequestId: z.number().int().positive(), customCallId: z.string(), consentId: z.string().uuid(),
  form: z.strictObject({ date: z.string(), quantity: z.number() }).nullable(),
  result: z.string().nullable(), mcpCallCount: z.number().int().min(0).max(1), answerCount: z.number().int().min(0).max(1),
  bridgeResult: z.strictObject({ type: z.literal('user.custom_tool_result'), custom_tool_use_id: z.string(), is_error: z.boolean(),
    content: z.array(z.strictObject({ type: z.literal('text'), text: z.string() })).length(1) }).nullable(),
  providerCalls: z.literal(0), transport: z.enum(['stdio-local', 'fixed-local-consent']),
  consentPath: z.string().nullable(), evidence: z.array(z.string()).max(16), note: z.string() });
