import { z } from 'zod';

export const lab39Lesson = { id: 39, title: 'Trusted configuration and untrusted checkouts', topic: 'Configuration and hooks', serverPrefix: '/api/c39' } as const;
export const lab39Scenarios = ['conflict', 'missing-manifest', 'modified-hash', 'takeover'] as const;
export const lab39StartSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab39Scenarios) });
export const lab39IdSchema = z.strictObject({ runId: z.string().uuid() });
export const lab39TrySchema = z.strictObject({ runId: z.string().uuid(), operation: z.enum(['read', 'edit']), path: z.string().min(1).max(180), text: z.string().max(300).optional() });
export const lab39SnapshotSchema = z.strictObject({
  source: z.literal('authored-fixture'), runId: z.string().uuid(), scenario: z.enum(lab39Scenarios),
  status: z.enum(['ready', 'rejected']), trustedManifest: z.strictObject({ version: z.literal(1), agent: z.string(), tools: z.array(z.string()), mcp: z.array(z.string()), skills: z.array(z.string()), systemMarker: z.string() }),
  expectedHash: z.string().regex(/^[a-f0-9]{64}$/), suppliedHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  branchMarker: z.string(), effectiveSystemMarker: z.string().nullable(), branchHookRuns: z.literal(0), providerCalls: z.literal(0),
  worktreeKind: z.enum(['disposable-git-worktree', 'local-fixture']), worktreeAvailable: z.boolean(),
  evidence: z.array(z.string()).max(20), lastOperation: z.strictObject({ operation: z.enum(['read', 'edit', 'takeover']), path: z.string(), decision: z.enum(['allowed', 'refused']), reason: z.string(), content: z.string().nullable() }).nullable(),
});
export type Lab39Start = z.infer<typeof lab39StartSchema>;
export type Lab39Try = z.infer<typeof lab39TrySchema>;
