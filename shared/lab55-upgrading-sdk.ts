import { z } from 'zod';

export const lab55Lesson = { id: 55, title: 'Official SDK and API upgrades',
  topic: 'Production and deployment', serverPrefix: '/api/c55' } as const;
export const lab55ScenarioSchema = z.enum(['compatible-change', 'removed-type', 'stream-change', 'policy-drift',
  'missing-usage', 'quality-regression', 'missing-evidence']);
export const lab55RunSchema = z.strictObject({ scenario: lab55ScenarioSchema, clientEligible: z.boolean().optional() });
export const lab55TransitionSchema = z.strictObject({ runId: z.string().uuid(),
  action: z.enum(['canary', 'promote', 'rollback']), clientEligible: z.boolean().optional() });
export const lab55CheckSchema = z.strictObject({ name: z.string(), pass: z.boolean(), evidence: z.string() });
export const lab55ResultSchema = z.strictObject({ id: z.string().uuid(), source: z.literal('offline-upgrade-rehearsal'),
  scenario: lab55ScenarioSchema, baselineNpmVersion: z.literal('1.7.0'), candidateNpmVersion: z.null(),
  apiCompatibility: z.enum(['compatible', 'incompatible', 'unknown']),
  pinnedResources: z.strictObject({ agentVersion: z.string(), environmentVersion: z.string(), skillVersion: z.string() }),
  checks: z.array(lab55CheckSchema), eligible: z.boolean(), state: z.enum(['candidate', 'canary', 'promoted', 'rolled-back']),
  canaryEvidence: z.enum(['not-run', 'authored-pass', 'authored-fail']),
  remoteSessionsRewound: z.literal(false), providerCalls: z.literal(0), note: z.string() });
