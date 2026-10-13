import { z } from 'zod';
import { lab01RequestSchema, lab01ResultSchema, lab01Scenarios } from './lab01-events.js';

// Authored server policy, bundled as read-only teaching text for the controls.
export const optionPolicy = { models: ['claude-sonnet-5-5', 'claude-opus-5-5'], maxBudgetCents: 500,
  maxDeadlineSeconds: 120, maxSystemLength: 4000 } as const;
export const systemChoiceSchema = z.discriminatedUnion('choice', [
  z.strictObject({ choice: z.literal('inherit') }),
  z.strictObject({ choice: z.literal('clear') }),
  z.strictObject({ choice: z.literal('override'), text: z.string().trim().min(1).max(optionPolicy.maxSystemLength) }),
]);
export const lab02RequestSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), prompt: z.string().trim().min(1).max(1000),
  scenario: z.enum(lab01Scenarios).default('normal'), model: z.enum(optionPolicy.models),
  system: systemChoiceSchema, budgetCents: z.number().int().min(1).max(optionPolicy.maxBudgetCents),
  previews: z.boolean(), deadlineSeconds: z.number().int().min(1).max(optionPolicy.maxDeadlineSeconds),
}).superRefine((value, ctx) => {
  if (!lab01RequestSchema.safeParse({ mode: value.mode, prompt: value.prompt, scenario: value.scenario }).success)
    ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Fixture scenarios are offline only.' });
});
export type Lab02Request = z.infer<typeof lab02RequestSchema>;
export const effectiveOptionsSchema = z.strictObject({
  model: z.string(), system: z.string().nullable(), systemSource: z.enum(['inherited', 'overridden', 'cleared']),
  modelSource: z.literal('overridden'), agentId: z.string(), agentVersion: z.number().int(),
  budget: z.strictObject({ amount: z.string().regex(/^\d+$/), currency: z.literal('USD') }),
  tools: z.number().int(), mcpServers: z.number().int(), skills: z.number().int(), multiagent: z.boolean(),
});
export type EffectiveOptions = z.infer<typeof effectiveOptionsSchema>;
export const reportedUsageSchema = z.strictObject({ scope: z.literal('model-request spans from this stream'),
  requests: z.number().int(), inputTokens: z.number().int(), outputTokens: z.number().int(),
  cacheCreationTokens: z.number().int(), cacheReadTokens: z.number().int() });
export const lab02ResultSchema = lab01ResultSchema.extend({ requested: lab02RequestSchema,
  effective: effectiveOptionsSchema.nullable(), reportedUsage: reportedUsageSchema.nullable() });
export type Lab02Result = z.infer<typeof lab02ResultSchema>;
export function formatCents(amount: string | number) { return `${amount} US cents ($${(Number(amount) / 100).toFixed(2)})`; }
export const lab02Lesson = { id: 2, title: 'Session options', topic: 'Managed Agents fundamentals', serverPrefix: '/api/c2' } as const;
