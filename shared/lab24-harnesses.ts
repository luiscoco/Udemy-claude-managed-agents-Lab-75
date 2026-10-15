import { z } from 'zod';

export const lab24Lesson = { id: 24, title: 'Who owns the agent loop', topic: 'Agent workflows', serverPrefix: '/api/c24' } as const;
export const lab24HarnessSchema = z.enum(['manual-messages', 'messages-tool-runner', 'managed-session']);
export const lab24ScenarioSchema = z.enum(['reserve', 'large-reservation', 'call-limit']);
export const lab24RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), harness: lab24HarnessSchema,
  scenario: lab24ScenarioSchema, callLimit: z.number().int().min(1).max(3).default(2) });
export type Lab24Request = z.infer<typeof lab24RequestSchema>;
export const lab24TraceSchema = z.strictObject({ stage: z.enum(['request', 'call', 'checked-effect', 'result', 'answer', 'cleanup']),
  adapter: z.enum(['host', 'messages-tool-use', 'messages-runner-callback', 'managed-custom-tool-use']),
  detail: z.string().max(500) });
export const lab24EffectSchema = z.strictObject({ tool: z.enum(['get_stock', 'reserve_stock']), sku: z.literal('NOTEBOOK'),
  quantity: z.number().int().min(0).max(10), before: z.number().int().min(0).max(10), after: z.number().int().min(0).max(10),
  accepted: z.boolean(), reason: z.string().max(160) });
export const lab24ResultSchema = z.strictObject({ source: z.literal('authored-fixture'), harness: lab24HarnessSchema,
  scenario: lab24ScenarioSchema, loopOwner: z.enum(['application', 'sdk-tool-runner', 'managed-harness']),
  outcome: z.enum(['reserved', 'rejected', 'call-limit']), providerCalls: z.literal(0), toolCalls: z.number().int().min(0).max(3),
  stock: z.number().int().min(0).max(10), answer: z.string().max(300), trace: z.array(lab24TraceSchema).max(16),
  effects: z.array(lab24EffectSchema).max(3), cleanup: z.literal('local-run-complete') });
export type Lab24Result = z.infer<typeof lab24ResultSchema>;
