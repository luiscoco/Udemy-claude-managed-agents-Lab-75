import { z } from 'zod';

export const lab69Lesson = { id: 69, title: 'Desktop and IDE host integration',
  topic: 'Production and deployment', serverPrefix: '/api/c69' } as const;
export const lab69ContextSchema = z.strictObject({ documentId: z.string().uuid(), version: z.number().int().positive(),
  hash: z.string().regex(/^[a-f0-9]{64}$/), text: z.string().max(8000) });
export const lab69PatchSchema = z.strictObject({ correlationId: z.string().uuid(), documentId: z.string().uuid(),
  baseVersion: z.number().int().positive(), baseHash: z.string().regex(/^[a-f0-9]{64}$/), replacement: z.string().max(9000) });
export const lab69RunSchema = z.strictObject({ correlationId: z.string().uuid(), context: lab69ContextSchema,
  mode: z.enum(['offline', 'live']), scenario: z.enum(['normal', 'transport-failure', 'hang']) });
export type Lab69Context = z.infer<typeof lab69ContextSchema>;
export type Lab69Patch = z.infer<typeof lab69PatchSchema>;
export const lab69WebviewMessageSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('start'), correlationId: z.string().uuid(), mode: z.enum(['offline', 'live']) }),
  z.strictObject({ type: z.literal('cancel'), correlationId: z.string().uuid() }),
  z.strictObject({ type: z.literal('apply'), correlationId: z.string().uuid() }),
]);
