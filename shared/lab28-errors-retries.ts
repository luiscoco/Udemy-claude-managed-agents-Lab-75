import { z } from 'zod';

export const lab28Lesson = { id: 28, title: 'Errors, retries and reconciliation', topic: 'Agent workflows', serverPrefix: '/api/c28' } as const;
export const lab28Scenarios = ['read-rate-limit', 'missing-create-response', 'tool-result-failure', 'reconnect-duplicates',
  'invalid', 'auth', 'event-error', 'handler-error', 'cancel', 'eof', 'disconnect'] as const;
export const lab28RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab28Scenarios), deadlineMs: z.number().int().min(100).max(5000).default(2000) });
export type Lab28Request = z.infer<typeof lab28RequestSchema>;
export const lab28ResultSchema = z.strictObject({ source: z.literal('authored-loopback-fixture'), scenario: z.enum(lab28Scenarios),
  classification: z.enum(['transient-read', 'uncertain-create', 'uncertain-result', 'reconciled', 'invalid', 'denied',
    'remote-error', 'handler-error', 'canceled', 'incomplete-stream', 'local-disconnect']),
  readAttempts: z.number().int().nonnegative(), mutationAttempts: z.number().int().nonnegative(), effectCount: z.number().int().nonnegative(),
  sessionId: z.string().nullable(), reconcile: z.enum(['not-needed', 'known-session-history', 'unknown-create-id', 'host-ledger']),
  retryAllowed: z.boolean(), remoteStopped: z.boolean().nullable(), cleanup: z.enum(['not-needed', 'confirmed', 'pending']),
  evidence: z.array(z.string()).max(12), guidance: z.string().max(500) });
export type Lab28Result = z.infer<typeof lab28ResultSchema>;
