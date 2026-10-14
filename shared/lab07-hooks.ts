import { z } from 'zod';
import { lab01OutcomeSchema, lab01SessionSchema, lab01Source } from './lab01-events.js';
import { lab03FrameSchema, sandboxFileSchema } from './lab03-tools.js';

export const lab07Lesson = { id: 7, title: 'Tool policy and execution audit', topic: 'Configuration and hooks', serverPrefix: '/api/c7' } as const;
export const lab07Policies = ['audit-only', 'deny-write', 'rewrite-input'] as const;
export type Lab07Policy = (typeof lab07Policies)[number];
export const lab07Scenarios = ['normal', 'handler-exception', 'repeated-call', 'hang'] as const;
export type Lab07Scenario = (typeof lab07Scenarios)[number];
export const lab07Prompt = 'Use the file tools once, then report whether the requested effect happened.';
export const lab07SdkOnlyFields = ['hooks', 'PreToolUse', 'PostToolUse', 'updatedInput'] as const;

const path = z.string().min(1).max(200).describe('Absolute exercise path under /workspace.');
export const lab07ToolShapes = {
  read_file: z.strictObject({ path }),
  write_file: z.strictObject({ path, content: z.string().max(4000) }),
  edit_file: z.strictObject({ path, oldText: z.string().min(1).max(2000), newText: z.string().max(2000) }),
} as const;
export type Lab07ToolName = keyof typeof lab07ToolShapes;
export const lab07ToolNames = Object.keys(lab07ToolShapes) as Lab07ToolName[];
const descriptions: Record<Lab07ToolName, string> = {
  read_file: 'Read one file in the Lab 07 host fixture.', write_file: 'Write one file in the Lab 07 host fixture.',
  edit_file: 'Replace one exact text fragment in a Lab 07 host fixture file.',
};
export function lab07InputSchema(name: Lab07ToolName) { const { $schema: _, ...schema } = z.toJSONSchema(lab07ToolShapes[name], { target: 'draft-2020-12', io: 'input' }); return schema; }
export const lab07Tools = Object.freeze(lab07ToolNames.map((name) => ({ type: 'custom' as const, name, description: descriptions[name], input_schema: lab07InputSchema(name) })));

export const lab07RequestSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), policy: z.enum(lab07Policies), scenario: z.enum(lab07Scenarios).default('normal'),
  prompt: z.string().trim().min(1).max(1000), deadlineSeconds: z.number().int().min(1).max(120),
  handlerTimeoutMs: z.number().int().min(100).max(5000).default(1000), budgetCents: z.number().int().min(1).max(500).optional(),
}).superRefine((value, ctx) => { if (value.mode === 'live' && value.scenario !== 'normal') ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Fixture scenarios are offline only.' }); });
export type Lab07Request = z.input<typeof lab07RequestSchema>;
export type Lab07ParsedRequest = z.infer<typeof lab07RequestSchema>;

const text = (max: number) => z.string().max(max);
export const lab07AuditSchema = z.strictObject({ id: text(200), tool: text(80), policy: z.enum(lab07Policies),
  originalInput: text(4000), effectiveInput: text(4000).nullable(), decision: z.enum(['allow', 'deny', 'rewrite']),
  reason: text(500), validation: z.enum(['passed', 'rejected', 'revalidated']), handlerRan: z.boolean(),
  outcome: z.enum(['executed', 'denied', 'failed']), before: text(4000).nullable(), after: text(4000).nullable(),
  result: z.strictObject({ isError: z.boolean(), text: text(4000) }),
});
export type Lab07Audit = z.infer<typeof lab07AuditSchema>;
export const lab07FrameSchema = z.discriminatedUnion('kind', [...lab03FrameSchema.options,
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('audit'), audit: lab07AuditSchema })]);
export type Lab07Frame = z.infer<typeof lab07FrameSchema>;
export const lab07ResultSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), source: lab01Source, requested: lab07RequestSchema,
  runId: z.uuid(), sessionId: z.string().nullable(), session: lab01SessionSchema.nullable(), outcome: lab01OutcomeSchema,
  audits: z.array(lab07AuditSchema).max(30), files: z.array(sandboxFileSchema).max(20), resultsSent: z.number().int().nonnegative(),
  interruption: z.enum(['not-needed', 'not-attempted', 'simulated', 'confirmed', 'unconfirmed']),
  cleanup: z.enum(['not-needed', 'simulated', 'archived', 'pending']), message: text(1000),
});
export type Lab07Result = z.infer<typeof lab07ResultSchema>;
export const lab07FileResponseSchema = z.strictObject({ runId: z.uuid(), file: sandboxFileSchema });

