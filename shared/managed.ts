import { z } from 'zod';

export const foundationPrompt = 'Begin with the exact line MANAGED_AGENTS_READY. Then explain agent, environment, session, and event in one short sentence each. Do not use tools, delegate, or create workflow runs.';
export const managedRequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']) });
export const managedUsageSchema = z.strictObject({
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  cacheReadInputTokens: z.number().int().nonnegative().nullable(),
  activeSeconds: z.number().nonnegative().nullable(),
  listCost: z.strictObject({ amount: z.string(), currency: z.string() }).nullable(),
});
export const managedProgressSchema = z.strictObject({
  source: z.enum(['authored-fixture', 'managed-api']),
  type: z.string().max(100), text: z.string().max(16000), sessionId: z.string().nullable(),
});
export const managedResultSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), source: z.enum(['authored-fixture', 'managed-api']),
  status: z.enum(['succeeded', 'paused', 'failed', 'cancelled']),
  output: z.string().max(32000), verified: z.boolean(), sessionId: z.string().nullable(),
  stopReason: z.string().nullable(), usage: managedUsageSchema.nullable(),
  cleanup: z.enum(['not-needed', 'archived', 'pending']), message: z.string(),
});
export type ManagedResult = z.infer<typeof managedResultSchema>;
export type ManagedProgress = z.infer<typeof managedProgressSchema>;
export type ManagedUsage = z.infer<typeof managedUsageSchema>;
export function verifyFoundation(output: string) {
  return output.trimStart().split(/\r?\n/)[0] === 'MANAGED_AGENTS_READY' &&
    ['agent', 'environment', 'session', 'event'].every(word => new RegExp(`\\b${word}\\b`, 'i').test(output));
}
