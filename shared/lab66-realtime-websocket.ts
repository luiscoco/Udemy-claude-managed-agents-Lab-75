import { z } from 'zod';

export const lab66Lesson = { id: 66, title: 'Real-time frontends over WebSocket',
  topic: 'Production and deployment', serverPrefix: '/api/c66' } as const;
const commandId = z.string().uuid();
const runId = z.string().uuid();
export const lab66CommandSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('start'), commandId, mode: z.enum(['offline', 'live']), afterSeq: z.number().int().nonnegative().max(100000).default(0) }),
  z.strictObject({ kind: z.literal('message'), commandId, runId, text: z.string().trim().min(1).max(500) }),
  z.strictObject({ kind: z.literal('cancel'), commandId, runId }),
  z.strictObject({ kind: z.literal('ack'), runId, seq: z.number().int().nonnegative().max(100000) }),
]);
export type Lab66Command = z.infer<typeof lab66CommandSchema>;
export const lab66FrameSchema = z.strictObject({ kind: z.enum(['started', 'chunk', 'terminal', 'gap', 'notice']),
  runId, seq: z.number().int().nonnegative(), text: z.string().max(2000),
  state: z.enum(['idle', 'running', 'completed', 'cancelled', 'error']), source: z.enum(['authored-fixture', 'managed-api']) });
export type Lab66Frame = z.infer<typeof lab66FrameSchema>;
export const lab66ToolInputSchema = z.strictObject({ text: z.string().trim().min(1).max(500) });
