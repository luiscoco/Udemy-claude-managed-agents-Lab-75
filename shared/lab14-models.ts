import { z } from 'zod';
import { lab01ResultSchema } from './lab01-events.js';
import { reportedUsageSchema } from './lab02-options.js';

export const lab14Lesson = { id: 14, title: 'Models and supported effort', topic: 'Models and reasoning', serverPrefix: '/api/c14' } as const;
export const lab14Models = ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-sonnet-4-6'] as const;
export const lab14Efforts = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export const lab14Supported = {
  'claude-sonnet-5-5': lab14Efforts, 'claude-opus-5-5': lab14Efforts,
  'claude-sonnet-4-6': ['low', 'medium', 'high', 'max'],
} satisfies Record<(typeof lab14Models)[number], readonly string[]>;
const configuration = z.strictObject({ model: z.enum(lab14Models), effort: z.enum(lab14Efforts), budgetCents: z.number().int().min(1).max(500) });
export const lab14ConfigurationSchema = configuration.superRefine((value, ctx) => {
  if (!(lab14Supported[value.model] as readonly string[]).includes(value.effort)) ctx.addIssue({ code: 'custom', message: 'This model does not support the selected effort.' });
});
export const lab14RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']),
  prompt: z.string().trim().min(1).max(1000), configuration: lab14ConfigurationSchema,
  scenario: z.enum(['normal', 'primary-unavailable', 'uncertain', 'mismatch', 'hang']).default('normal'),
  deadlineSeconds: z.number().int().min(1).max(120).default(30),
  fallback: lab14ConfigurationSchema.nullable().default(null),
}).superRefine((value, ctx) => {
  if (value.mode === 'live' && value.scenario !== 'normal') ctx.addIssue({ code: 'custom', message: 'Failure scenarios are offline only.' });
  if (value.fallback?.model === value.configuration.model) ctx.addIssue({ code: 'custom', message: 'Select a different fallback model.' });
});
export type Lab14Input = z.infer<typeof lab14RequestSchema>;
export type Lab14Configuration = z.infer<typeof lab14ConfigurationSchema>;
export const lab14ControlSchema = z.strictObject({ runId: z.uuid() });
export const lab14SendSchema = lab14ControlSchema.extend({ prompt: z.string().trim().min(1).max(1000) });
export const lab14NewSchema = lab14ControlSchema.extend({ request: lab14RequestSchema });
export const lab14SnapshotSchema = z.strictObject({ model: z.string().max(128), effort: z.string().max(30).nullable(), agentVersion: z.number().int(), budgetCents: z.string().max(20), matches: z.boolean() });
export const lab14AttemptSchema = z.strictObject({ attempt: z.number().int().min(1).max(2), requested: lab14ConfigurationSchema,
  resolved: lab14SnapshotSchema.nullable(), result: lab01ResultSchema,
  reportedUsage: reportedUsageSchema.nullable(), elapsedMs: z.number().nonnegative().nullable(),
  creation: z.enum(['confirmed', 'rejected', 'uncertain', 'not-started']),
});
export const lab14ResultSchema = z.strictObject({ runId: z.uuid(), prompt: z.string().max(1000), source: z.enum(['authored-fixture', 'managed-api']),
  attempts: z.array(lab14AttemptSchema).max(2), fallbackDecision: z.string().max(300),
  state: z.enum(['prepared', 'running', 'closed', 'pending']), message: z.string().max(600),
});
export type Lab14Result = z.infer<typeof lab14ResultSchema>;
export type Lab14Snapshot = z.infer<typeof lab14SnapshotSchema>;
export const lab14CatalogSchema = z.strictObject({ sdkVersion: z.literal('1.7.0'), checkedOn: z.string(), liveReady: z.boolean(),
  providerVerified: z.literal(false), deadlineSeconds: z.number(),
  models: z.array(z.strictObject({ id: z.enum(lab14Models), efforts: z.array(z.enum(lab14Efforts)), accountReady: z.boolean(), readiness: z.string() })),
  unsupported: z.array(z.strictObject({ setting: z.string(), reason: z.string() })), sources: z.array(z.string()),
});
export type Lab14Catalog = z.infer<typeof lab14CatalogSchema>;
