import { z } from 'zod';

const learnerName = z.string().trim().min(1, 'Enter a learner name.').max(40, 'Use at most 40 characters.');
export const defaultPrompt = 'Hello Agent Platform';
const prompt = z.string().trim().min(1, 'Enter a prompt.').max(120, 'Use at most 120 characters.').default(defaultPrompt);
const scenario = z.enum(['success', 'invalid-input', 'stream-failure', 'slow-cancel']).default('success');
export const runRequestSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('scripted'), learnerName, prompt, scenario }),
  z.strictObject({ mode: z.literal('live'), learnerName, prompt, scenario }),
]);
export type RunRequest = z.infer<typeof runRequestSchema>;
export const apiErrorSchema = z.strictObject({ error: z.strictObject({
  code: z.enum(['INVALID_REQUEST', 'UNSUPPORTED_MODE', 'CAPACITY', 'NOT_FOUND', 'CONFLICT', 'INTERNAL']),
  message: z.string(), fieldErrors: z.array(z.strictObject({ path: z.string(), message: z.string() })),
}) });
export type ApiError = z.infer<typeof apiErrorSchema>;
export const runIdSchema = z.uuid();
const usage = z.strictObject({ modelCalls: z.literal(0), billedUsd: z.literal(0) });
export const terminalSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('succeeded'), output: z.string(), result: z.record(z.string(), z.unknown()), usage }),
  z.strictObject({ status: z.literal('cancelled'), reason: z.enum(['user', 'deadline', 'expired', 'shutdown']), usage }),
  z.strictObject({ status: z.literal('failed'), message: z.string(), usage }),
]);
export type TerminalOutcome = z.infer<typeof terminalSchema>;
const envelope = { runId: runIdSchema, seq: z.number().int().positive(), timestamp: z.iso.datetime() };
export const browserEventSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...envelope, type: z.literal('started'), payload: z.strictObject({ mode: z.literal('scripted') }) }),
  z.strictObject({ ...envelope, type: z.literal('progress'), payload: z.strictObject({ step: z.number().int().min(1).max(3), text: z.string().max(200) }) }),
  z.strictObject({ ...envelope, type: z.literal('tool-fixture'), payload: z.strictObject({ source: z.literal('authored-fixture'), tool: z.string().min(1), prompt: z.string().max(120) }) }),
  z.strictObject({ ...envelope, type: z.literal('output'), payload: z.strictObject({ text: z.string().max(200) }) }),
  z.strictObject({ ...envelope, type: z.literal('terminal'), payload: terminalSchema }),
]);
export type BrowserEvent = z.infer<typeof browserEventSchema>;
export type EventInput = BrowserEvent extends infer E ? E extends BrowserEvent ? Pick<E, 'type' | 'payload'> : never : never;
export const evidenceSchema = z.strictObject({ source: z.literal('authored-fixture'), raw: z.string().max(2048) });
export type Evidence = z.infer<typeof evidenceSchema>;
export const runSnapshotSchema = z.strictObject({
  runId: runIdSchema, status: z.enum(['running', 'succeeded', 'cancelled', 'failed']),
  events: z.array(browserEventSchema).max(16), evidence: z.array(evidenceSchema).max(8),
  outcome: terminalSchema.nullable(),
});
export type RunSnapshot = z.infer<typeof runSnapshotSchema>;
export const factsSchema = z.strictObject({
  id: z.number().int().min(0).max(75), path: z.literal('deterministic'), liveAvailable: z.literal(false),
  modelCalls: z.literal(0), description: z.string(),
});
