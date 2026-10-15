import { z } from 'zod';

export const lab36Lesson = { id: 36, title: 'Remote transport and host runners', topic: 'Configuration and hooks', serverPrefix: '/api/c36' } as const;
export const lab36Scenarios = ['success', 'connection-failure', 'early-stream-close', 'handler-worker-failure', 'cancel-pending-cleanup'] as const;
export const lab36RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab36Scenarios) });
export const lab36ActionSchema = z.strictObject({ runId: z.string().uuid() });
export const lab36FailureSchema = z.strictObject({ scenario: z.enum(lab36Scenarios) });
export const lab36SnapshotSchema = z.strictObject({ source: z.literal('loopback-emulator'), runId: z.string().uuid(),
  scenario: z.enum(lab36Scenarios), outcome: z.enum(['completed', 'connection-error', 'incomplete', 'worker-error', 'canceled']),
  sessionId: z.string().nullable(), hostRequest: z.string(), remoteLifecycle: z.array(z.string()).max(12),
  eventCount: z.number().int().nonnegative().max(8), queuePeak: z.number().int().nonnegative().max(4),
  worker: z.strictObject({ started: z.boolean(), exitCount: z.number().int().min(0).max(1), killed: z.boolean(), stderrRedacted: z.boolean() }),
  localAbort: z.boolean(), remoteStopConfirmed: z.boolean(), cleanup: z.enum(['not-needed', 'confirmed', 'pending']),
  providerCalls: z.literal(0), note: z.string() });
export type Lab36Run = z.infer<typeof lab36RunSchema>;
