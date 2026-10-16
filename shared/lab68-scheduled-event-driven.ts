import { z } from 'zod';

export const lab68Lesson = { id: 68, title: 'Scheduled and event-driven agents',
  topic: 'Production and deployment', serverPrefix: '/api/c68' } as const;
export const lab68ScheduleSchema = z.strictObject({ intervalSeconds: z.number().int().min(5).max(3600) });
export const lab68AdvanceSchema = z.strictObject({ seconds: z.number().int().min(1).max(3600) });
export const lab68WebhookSchema = z.strictObject({ owner: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  eventId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/), incident: z.literal('fictional-finches') });
export const lab68FixtureSchema = z.strictObject({ eventId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  kind: z.enum(['valid', 'bad-signature', 'stale']) });
export const lab68WorkerSchema = z.strictObject({ scenario: z.enum(['success', 'failure']) });
export const lab68ToolInputSchema = z.strictObject({ jobId: z.string().uuid(), summary: z.string().min(5).max(200) });
