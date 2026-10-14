import { z } from 'zod';
import { lab01FrameSchema, lab01SessionSchema } from './lab01-events.js';
import { reportedUsageSchema } from './lab02-options.js';

export const lab10Lesson = { id: 10, title: 'Validated reports and interruption', topic: 'Managed Agents fundamentals', serverPrefix: '/api/c10' } as const;
export const lab10ReportSchema = z.strictObject({ project: z.string().trim().min(1).max(120), summary: z.string().trim().min(1).max(1000),
  risks: z.array(z.string().trim().min(1).max(200)).max(5), nextSteps: z.array(z.string().trim().min(1).max(200)).min(1).max(5) });
export type Lab10Report = z.infer<typeof lab10ReportSchema>;
const { $schema: _dialect, ...reportJsonSchema } = z.toJSONSchema(lab10ReportSchema, { target: 'draft-2020-12', io: 'input' });
export const lab10JsonSchema = reportJsonSchema;
export const lab10Prompt = 'Return a report for the fictional Aurora Finch observation notebook. Prioritize offline capture. Return only the JSON object required by the report schema.';
export const lab10Scenarios = ['valid', 'invalid', 'corrected', 'exhausted', 'hang', 'interrupt-unconfirmed'] as const;
export const lab10RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), prompt: z.string().trim().min(1).max(1000),
  scenario: z.enum(lab10Scenarios).default('valid'), correctiveRound: z.boolean().default(true), deadlineSeconds: z.number().int().min(1).max(120), budgetCents: z.number().int().min(1).max(500).default(50) })
  .superRefine((value, ctx) => { if (value.mode === 'live' && value.scenario !== 'valid') ctx.addIssue({code:'custom',path:['scenario'],message:'Fixture scenarios are offline only.'}); });
export type Lab10Request = z.input<typeof lab10RequestSchema>;
export type Lab10ParsedRequest = z.infer<typeof lab10RequestSchema>;
export const lab10ControlSchema = z.strictObject({ runId: z.uuid() });
export const lab10SendSchema = z.strictObject({...lab10RequestSchema.shape,runId:z.uuid()}).superRefine((value,ctx)=>{if(value.mode === 'live' && value.scenario !== 'valid') ctx.addIssue({code:'custom',path:['scenario'],message:'Fixture scenarios are offline only.'});});
export const lab10RunState = z.enum(['idle','running','stopping','cleanup-pending','closed']);
export const lab10TurnSchema = z.strictObject({ turnId:z.uuid(), state:z.enum(['queued','running','completed','interrupted','aborted','deadline','failed']),
  outcome:z.enum(['pending','verified','invalid','exhausted','interrupted','aborted','deadline','incomplete','error']), attempts:z.number().int().min(0).max(2),
  report:lab10ReportSchema.nullable(), errors:z.array(z.string().max(300)).max(20), text:z.string().max(16000), reportedUsage:reportedUsageSchema.nullable() });
export type Lab10Turn = z.infer<typeof lab10TurnSchema>;
export const lab10SnapshotSchema = z.strictObject({ runId:z.uuid(), mode:z.enum(['scripted','live']), source:z.enum(['authored-fixture','managed-api']),
  session:lab01SessionSchema, state:lab10RunState, turns:z.array(lab10TurnSchema).max(20), queueDepth:z.number().int().min(0).max(2),
  interruption:z.enum(['not-needed','acknowledged','idle-confirmed','unconfirmed']), cleanup:z.enum(['not-needed','archived','simulated','pending']),
  effectiveCapabilities:z.strictObject({tools:z.literal(0),mcpServers:z.literal(0),skills:z.literal(0),multiagent:z.literal(false)}),
  message:z.string().max(1000) });
export type Lab10Snapshot = z.infer<typeof lab10SnapshotSchema>;
export const lab10FrameSchema = z.discriminatedUnion('kind', [...lab01FrameSchema.options,
  z.strictObject({seq:z.number().int().positive(),kind:z.literal('run'),runId:z.uuid(),turnId:z.uuid(),sessionId:z.string()}),
  z.strictObject({seq:z.number().int().positive(),kind:z.literal('validation'),attempt:z.number().int().min(1).max(2),valid:z.boolean(),errors:z.array(z.string()).max(20)})]);
export const lab10SchemasSchema = z.strictObject({ report:z.record(z.string(),z.unknown()), validation:z.literal('application schema validation'),
  correctiveRounds:z.literal(1), maxQueueDepth:z.literal(2), nativeStructuredOutput:z.literal(false) });
