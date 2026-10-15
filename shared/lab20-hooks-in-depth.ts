import { z } from 'zod';
import { sandboxFileSchema } from './lab03-tools.js';

export const lab20Lesson = { id: 20, title: 'Lifecycle events and host interceptors', topic: 'Configuration and hooks', serverPrefix: '/api/c20' } as const;
export const lab20Scenarios = ['passing-policy', 'denied-pre-execution', 'tool-failure', 'interceptor-exception',
  'deadline', 'final-validation-failure'] as const;
const id = z.uuid(), short = z.string().max(400), eventId = z.string().max(200).nullable();
export const lab20RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab20Scenarios),
  prompt: z.string().trim().min(1).max(600), deadlineSeconds: z.number().int().min(1).max(120),
  budgetCents: z.number().int().min(1).max(500) }).superRefine((value, context) => {
    if (value.mode === 'live' && !['passing-policy', 'denied-pre-execution'].includes(value.scenario))
      context.addIssue({ code: 'custom', path: ['scenario'], message: 'This failure scenario is an offline fixture only.' });
  });
export type Lab20Run = z.infer<typeof lab20RunSchema>;
const correlation = { runId: id, sessionId: z.string().max(200).nullable(), threadId: z.string().max(200).nullable(), eventId };
export const lab20ProviderEventSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...correlation, kind: z.literal('lifecycle'), type: z.string().max(100), detail: short }),
  z.strictObject({ ...correlation, kind: z.literal('model-span'), type: z.string().max(100), detail: short }),
  z.strictObject({ ...correlation, kind: z.literal('tool-request'), type: z.string().max(100), detail: short }),
  z.strictObject({ ...correlation, kind: z.literal('tool-result'), type: z.string().max(100), detail: short }),
  z.strictObject({ ...correlation, kind: z.literal('message'), type: z.string().max(100), detail: short }),
  z.strictObject({ ...correlation, kind: z.literal('thread'), type: z.string().max(100), detail: short }),
]);
export type Lab20ProviderEvent = z.infer<typeof lab20ProviderEventSchema>;
export const lab20HostAuditSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...correlation, kind: z.literal('boundary'), phase: z.enum(['create', 'send', 'cleanup']), outcome: z.enum(['started', 'completed', 'failed', 'skipped']), detail: short }),
  z.strictObject({ ...correlation, kind: z.literal('interceptor'), phase: z.enum(['pre-execution', 'post-execution', 'final-validation']),
    outcome: z.enum(['allow', 'deny', 'failed', 'passed', 'rejected']), detail: short }),
  z.strictObject({ ...correlation, kind: z.literal('handler'), phase: z.enum(['before', 'after']), outcome: z.enum(['ran', 'skipped', 'failed']), detail: short }),
  z.strictObject({ ...correlation, kind: z.literal('approval'), phase: z.literal('confirmation'), outcome: z.enum(['allow', 'deny', 'not-required']), detail: short }),
  z.strictObject({ ...correlation, kind: z.literal('coverage'), phase: z.enum(['model-span', 'child-thread']), outcome: z.enum(['observed', 'not-observed']), detail: short }),
]);
export type Lab20HostAudit = z.infer<typeof lab20HostAuditSchema>;
export const lab20ResultSchema = z.strictObject({ runId: id, mode: z.enum(['scripted', 'live']), source: z.enum(['authored-fixture', 'managed-api']),
  scenario: z.enum(lab20Scenarios), sessionId: z.string().max(200).nullable(),
  outcome: z.enum(['verified', 'host-policy-denial', 'tool-error', 'host-instrumentation-error', 'deadline', 'final-validation-error', 'provider-error', 'incomplete']),
  providerEvents: z.array(lab20ProviderEventSchema).max(80), hostAudit: z.array(lab20HostAuditSchema).max(80),
  files: z.array(sandboxFileSchema).max(20), virtualTicks: z.number().int().nonnegative().nullable(),
  cleanup: z.enum(['not-needed', 'simulated', 'archived', 'pending']), note: z.string().max(700) });
export type Lab20Result = z.infer<typeof lab20ResultSchema>;
export const lab20FilesSchema = z.strictObject({ runId: id, files: z.array(sandboxFileSchema).max(20) });
export const lab20FileSchema = z.strictObject({ runId: id, file: sandboxFileSchema });
export const lab20ResetSchema = z.strictObject({ runId: id, confirmReset: z.literal(true) });
