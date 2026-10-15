import { z } from 'zod';

export const lab27Lesson = { id: 27, title: 'Remote work beyond a browser connection', topic: 'Sessions and context', serverPrefix: '/api/c27' } as const;
export const lab27OpenSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), backgroundAllowed: z.boolean(),
  scenario: z.enum(['slow', 'completed']).default('slow'), request: z.string().trim().min(1).max(240) });
export const lab27CallSchema = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('detach'), taskId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('reconnect'), taskId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('inspect'), taskId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('stop'), taskId: z.string().uuid() }),
  z.strictObject({ operation: z.literal('close'), taskId: z.string().uuid() }),
]);
export type Lab27Open = z.infer<typeof lab27OpenSchema>;
export type Lab27Call = z.infer<typeof lab27CallSchema>;
export const lab27SnapshotSchema = z.strictObject({ taskId: z.string().uuid(), sessionId: z.string().uuid(), threadId: z.string().uuid(),
  source: z.literal('authored-fixture'), taskState: z.enum(['running', 'completed', 'stopped', 'closed']),
  remoteStatus: z.enum(['running', 'idle', 'archived']), browserConnection: z.enum(['attached', 'detached']),
  childActivity: z.enum(['none', 'authored-event']), createCount: z.literal(1), duplicateCards: z.literal(0),
  eventIds: z.array(z.string()).max(12), report: z.string().nullable(), reportVerified: z.literal(false),
  stopEvidence: z.enum(['not-requested', 'confirmed-idle']), snapshotApplied: z.boolean(),
  note: z.string().max(500) });
