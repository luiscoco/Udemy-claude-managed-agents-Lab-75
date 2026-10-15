import { z } from 'zod';

export const lab35Lesson = { id: 35, title: 'Event mirrors and conversation indexes', topic: 'Sessions and context', serverPrefix: '/api/c35' } as const;
export const lab35Scenarios = ['normal', 'append-failure', 'missing-thread', 'restart', 'reconnect'] as const;
export const lab35RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab35Scenarios), flush: z.enum(['eager', 'batched']) });
export const lab35ManageSchema = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('flush'), conversationId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('crash-restart'), conversationId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('reconcile'), conversationId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('archive'), conversationId: z.string().uuid() }),
]);
export const lab35FailureSchema = z.strictObject({ conversationId: z.string().uuid(), appendFails: z.boolean() });
export const lab35ResetSchema = z.strictObject({ conversationId: z.string().uuid() });
export const lab35EventSchema = z.strictObject({ eventId: z.string().regex(/^sevt_[A-Za-z0-9_-]{1,60}$/),
  sessionId: z.string().regex(/^sesn_[A-Za-z0-9_-]{1,60}$/), threadId: z.string().regex(/^thrd_[A-Za-z0-9_-]{1,60}$/),
  sequence: z.number().int().nonnegative(), kind: z.enum(['user', 'agent']), text: z.string().max(500) });
export const lab35SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), conversationId: z.string().uuid(),
  owner: z.string(), sessionId: z.string(), remoteState: z.enum(['idle', 'archived']), flush: z.enum(['eager', 'batched']),
  persistedCount: z.number().int().nonnegative(), pendingCount: z.number().int().nonnegative(), threads: z.array(z.string()),
  mirrorStatus: z.enum(['complete', 'incomplete']), appendFails: z.boolean(), effectLedgerCount: z.literal(0),
  providerCalls: z.literal(0), events: z.array(lab35EventSchema).max(20), note: z.string() });
export type Lab35Run = z.infer<typeof lab35RunSchema>;
export type Lab35Manage = z.infer<typeof lab35ManageSchema>;
