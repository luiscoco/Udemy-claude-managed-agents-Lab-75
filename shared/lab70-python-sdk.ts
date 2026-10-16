import { z } from 'zod';

export const lab70Lesson = { id: 70, title: 'Python client for Managed Agents',
  topic: 'Production and deployment', serverPrefix: '/api/c70' } as const;
export const lab70ScenarioSchema = z.enum(['normal', 'custom-tool', 'malformed-stdout', 'stderr-flood', 'hang', 'missing-python']);
export const lab70RequestSchema = z.strictObject({ mode: z.enum(['offline', 'live']),
  operation: z.enum(['one-shot', 'retained-start', 'retained-turn', 'close']), scenario: lab70ScenarioSchema,
  prompt: z.string().trim().min(1).max(500), sessionHandle: z.string().uuid().optional() });
export const lab70ToolSchema = z.strictObject({ species: z.literal('Aurora Finch'), count: z.number().int().min(1).max(99) });
export const lab70FrameSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('readiness'), version: z.string().max(40), capable: z.boolean(), reason: z.string().max(500) }),
  z.strictObject({ type: z.literal('session'), id: z.string().regex(/^sesn_[A-Za-z0-9_-]{1,100}$/), status: z.string().max(40) }),
  z.strictObject({ type: z.literal('progress'), text: z.string().max(2000) }),
  z.strictObject({ type: z.literal('tool_use'), id: z.string().regex(/^sevt_[A-Za-z0-9_-]{1,100}$/), name: z.string().max(100), input: z.unknown() }),
  z.strictObject({ type: z.literal('result'), outcome: z.enum(['completed', 'cancelled', 'error']), session_id: z.string().nullable(),
    retained: z.boolean(), interruption: z.string().max(100), cleanup: z.string().max(100), text: z.string().max(2000) }),
]);
export type Lab70Frame = z.infer<typeof lab70FrameSchema>;
