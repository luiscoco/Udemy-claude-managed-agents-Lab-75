import { z } from 'zod';

export const lab30Lesson = { id: 30, title: 'Host task board and completion gates', topic: 'Agent workflows', serverPrefix: '/api/c30' } as const;
export const lab30Scenarios = ['three-step', 'blocked-review', 'refused-completion', 'validated-completion', 'invalid-plan-replacement'] as const;
export const lab30RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab30Scenarios) });
export const lab30ToolShapes = {
  create_task: z.strictObject({ title: z.string().trim().min(1).max(100), dependsOn: z.array(z.string().regex(/^task_\d+$/)).max(4) }),
  update_task: z.strictObject({ id: z.string().regex(/^task_\d+$/), expectedVersion: z.number().int().positive(),
    action: z.enum(['rename', 'complete']), title: z.string().trim().min(1).max(100).optional(), evidence: z.string().trim().min(1).max(80).optional() }),
  list_tasks: z.strictObject({}), get_task: z.strictObject({ id: z.string().regex(/^task_\d+$/) }),
} as const;
export const lab30CallSchema = z.strictObject({ boardId: z.string().uuid(), eventId: z.string().regex(/^sevt_[A-Za-z0-9_-]{1,60}$/),
  name: z.enum(['create_task', 'update_task', 'list_tasks', 'get_task']), input: z.record(z.string(), z.unknown()) });
export const lab30ReplaceSchema = z.strictObject({ boardId: z.string().uuid(), eventId: z.string().regex(/^host_[A-Za-z0-9_-]{1,60}$/),
  operation: z.literal('replace_plan'), expectedBoardVersion: z.number().int().positive(),
  tasks: z.array(z.strictObject({ title: z.string().trim().min(1).max(100), dependsOn: z.array(z.number().int().nonnegative()).max(4) })).min(1).max(6) });
export const lab30ToolsRequestSchema = z.union([lab30CallSchema, lab30ReplaceSchema]);
export type Lab30Run = z.infer<typeof lab30RunSchema>;
export type Lab30Call = z.infer<typeof lab30CallSchema>;
export type Lab30Replace = z.infer<typeof lab30ReplaceSchema>;
export const lab30TaskSchema = z.strictObject({ id: z.string(), title: z.string(), status: z.enum(['open', 'done']),
  dependsOn: z.array(z.string()), version: z.number().int().positive(), evidence: z.string().nullable() });
export const lab30ResultSchema = z.strictObject({ boardId: z.string().uuid(), source: z.literal('authored-fixture'), boardVersion: z.number().int().positive(),
  tasks: z.array(lab30TaskSchema), results: z.array(z.strictObject({ eventId: z.string(), name: z.string(), isError: z.boolean(),
    text: z.string(), effectApplied: z.boolean() })).max(20), providerCalls: z.literal(0), agentClaim: z.string().nullable(),
  note: z.string() });
