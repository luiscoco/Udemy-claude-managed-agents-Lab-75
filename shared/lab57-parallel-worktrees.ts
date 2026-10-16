import { z } from 'zod';

export const lab57Lesson = { id: 57, title: 'Workers in host Git worktrees', topic: 'Multi-agent work',
  serverPrefix: '/api/c57' } as const;
export const lab57ScenarioSchema = z.enum(['serial-integration', 'competing-edits', 'failed-worker', 'cancel-worker']);
export const lab57RunSchema = z.strictObject({ scenario: lab57ScenarioSchema });
export const lab57WorkerSchema = z.strictObject({ role: z.enum(['greeting', 'tax', 'competitor']), branch: z.string(),
  changedPaths: z.array(z.string()), untrackedPaths: z.array(z.string()), testPassed: z.boolean(),
  committed: z.boolean(), claim: z.string(), hostEvidence: z.string() });
export const lab57ResultSchema = z.strictObject({ source: z.literal('offline-host-git'),
  scenario: lab57ScenarioSchema, baseSha: z.string(), workers: z.array(lab57WorkerSchema),
  integration: z.enum(['passed', 'blocked', 'conflicted', 'cancelled']), combinedTestsPassed: z.boolean(),
  conflictAborted: z.boolean(), branchesPreserved: z.boolean(), providerCalls: z.literal(0),
  timeline: z.array(z.string()), note: z.string() });
