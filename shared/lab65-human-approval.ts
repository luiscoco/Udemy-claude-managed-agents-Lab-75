import { z } from 'zod';

export const lab65Lesson = { id: 65, title: 'Human approval over Slack, Teams or email',
  topic: 'Function tools and human control', serverPrefix: '/api/c65' } as const;
export const lab65ToolInputSchema = z.strictObject({ caseId: z.literal('CASE-2042'),
  reason: z.string().trim().min(5).max(160) });
export const lab65RunSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('propose') }),
  z.strictObject({ action: z.literal('notify'), proposalId: z.string().uuid(), channel: z.enum(['local', 'slack', 'teams', 'email']) }),
  z.strictObject({ action: z.literal('decide'), proposalId: z.string().uuid(), decision: z.enum(['approve', 'reject']) }),
  z.strictObject({ action: z.literal('tamper'), proposalId: z.string().uuid(), caseId: z.string().min(1).max(40) }),
  z.strictObject({ action: z.literal('expire'), proposalId: z.string().uuid() }),
]);
