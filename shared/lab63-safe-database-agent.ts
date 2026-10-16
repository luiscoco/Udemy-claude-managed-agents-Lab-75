import { z } from 'zod';

export const lab63Lesson = { id: 63, title: 'A safe database agent', topic: 'Function tools and human control',
  serverPrefix: '/api/c63' } as const;
export const lab63SessionSchema = z.strictObject({ mode: z.literal('offline') });
export const lab63QuerySchema = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('read'), orderId: z.string().regex(/^O-[AB]1$/) }),
  z.strictObject({ operation: z.literal('propose'), orderId: z.string().regex(/^O-[AB]1$/),
    reason: z.string().trim().min(3).max(120) }),
]);
export const lab63DecisionSchema = z.strictObject({ proposalId: z.string().uuid(),
  decision: z.enum(['approve', 'reject']) });
export const lab63FixtureSchema = z.strictObject({ action: z.enum(['change-version', 'advance-time']) });
export const lab63BlockedSqlSchema = z.strictObject({ sql: z.string().min(1).max(300) });
