import { z } from 'zod';

export const lab67Lesson = { id: 67, title: 'A multi-tenant SaaS architecture',
  topic: 'Production and deployment', serverPrefix: '/api/c67' } as const;
export const lab67AuthSchema = z.strictObject({ principal: z.enum(['alice', 'bob']) });
export const lab67RunSchema = z.strictObject({ requestId: z.string().uuid(), scenario: z.enum(['normal', 'failure', 'hold']) });
export const lab67SourceToolSchema = z.strictObject({ sourceId: z.string().regex(/^policy-(acme|birch)$/) });
