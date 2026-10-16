import { z } from 'zod';

export const lab54Lesson = { id: 54, title: 'Designing tools the model uses well',
  topic: 'Tools, MCP and skills', serverPrefix: '/api/c54' } as const;
export const lab54VariantSchema = z.enum(['vague', 'explicit']);
export const lab54ScenarioSchema = z.enum(['invalid-input', 'domain-rejection', 'missing-prerequisite', 'correct-idempotent']);
export const lab54CallSchema = z.strictObject({ variant: lab54VariantSchema, scenario: lab54ScenarioSchema });
export const lab54RunSchema = z.strictObject({ variant: lab54VariantSchema });
export const lab54StepSchema = z.strictObject({ eventId: z.string(), name: z.string(), input: z.unknown(),
  isError: z.boolean(), resultText: z.string(), actionKey: z.string().nullable(),
  effect: z.string(), recovery: z.string() });
export const lab54ResultSchema = z.strictObject({ source: z.literal('offline-authored-workshop'),
  variant: lab54VariantSchema, scenario: lab54ScenarioSchema, toolName: z.string(),
  steps: z.array(lab54StepSchema), approvalCount: z.number().int().nonnegative(),
  refundCount: z.number().int().nonnegative(), stableIdempotency: z.boolean().nullable(),
  providerCalls: z.literal(0), note: z.string() });
