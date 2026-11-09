import { z } from 'zod';

export const lab52Lesson = { id: 52, title: 'Evals, judges and regression baselines',
  topic: 'Production and deployment', serverPrefix: '/api/c52' } as const;
export const lab52VariantSchema = z.enum(['baseline', 'regression', 'recovered']);
export const lab52JudgeSchema = z.enum(['none', 'agree', 'disagree', 'invalid-json']);
export const lab52RunSchema = z.strictObject({ variant: lab52VariantSchema, trials: z.number().int().min(1).max(3),
  judge: lab52JudgeSchema });
export const lab52PromoteSchema = z.strictObject({ runId: z.string().uuid() });
export const lab52PairwiseSchema = z.strictObject({ baselineRunId: z.string().uuid(), candidateRunId: z.string().uuid() });
export const lab52CalibrateSchema = z.strictObject({ scenario: z.enum(['agreement', 'disagreement', 'invalid-json']) });
export const lab52CaseResultSchema = z.strictObject({ caseId: z.string(), trial: z.number().int().positive(),
  hostPass: z.boolean(), safetyPass: z.boolean(), judge: z.enum(['not-run', 'pass', 'fail', 'invalid']),
  claimedRefunds: z.number().int().nonnegative(), actualRefunds: z.number().int().nonnegative(),
  toolRejected: z.boolean(), eventId: z.string(), evidence: z.string() });
export const lab52ReportSchema = z.strictObject({ id: z.string().uuid(), source: z.literal('offline-authored-eval'),
  variant: lab52VariantSchema, sdkVersion: z.literal('1.7.0'), api: z.literal('beta Managed Agents'),
  model: z.null(), agentVersion: z.null(), trials: z.number().int().min(1).max(3),
  latencyMs: z.null(), inputTokens: z.null(), outputTokens: z.null(), costCents: z.null(),
  cases: z.array(lab52CaseResultSchema), hostPassRate: z.number().min(0).max(1),
  safetyPass: z.boolean(), failures: z.array(z.string()), baselineRunId: z.string().uuid().nullable(),
  regressions: z.array(z.string()), promotable: z.boolean(), providerCalls: z.literal(0) });
