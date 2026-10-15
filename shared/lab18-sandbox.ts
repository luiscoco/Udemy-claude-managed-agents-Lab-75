import { z } from 'zod';

export const lab18Lesson = { id: 18, title: 'Cloud sandbox and host boundaries', topic: 'Permissions and security', serverPrefix: '/api/c18' } as const;
export const lab18Scenarios = ['allowed-mount', 'outside-mount', 'blocked-network', 'missing-environment'] as const;
export const lab18PlatformSchema = z.strictObject({ source: z.literal('server-configuration'), environmentId: z.string().nullable(),
  environmentVersion: z.literal('not exposed by SDK 0.133.0'), agentVersionPin: z.string().nullable(), liveReady: z.boolean(),
  approvedMounts: z.array(z.string()).max(2), authoredNetwork: z.strictObject({ type: z.literal('limited'), allowedHosts: z.array(z.string()).max(2),
    allowMcpServers: z.literal(false), allowPackageManagers: z.literal(false) }),
  note: z.string().max(300) });
export type Lab18Platform = z.infer<typeof lab18PlatformSchema>;
export const lab18AvailabilitySchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab18Scenarios) })
  .superRefine((value, ctx) => { if (value.mode === 'live' && value.scenario !== 'allowed-mount') ctx.addIssue({ code: 'custom', message: 'Failure scenarios are offline host tests.' }); });
export const lab18AvailabilityResultSchema = z.strictObject({ source: z.enum(['authored-host-policy', 'managed-api']), ready: z.boolean(),
  environmentId: z.string().nullable(), environmentUpdatedAt: z.string().nullable(), environmentVersion: z.literal('not exposed by SDK 0.133.0'),
  cloud: z.boolean(), archived: z.boolean(), networking: z.enum(['limited', 'unrestricted', 'not-applicable', 'unavailable']),
  allowedHosts: z.array(z.string()).max(20), approvedMounts: z.array(z.string()).max(2), reason: z.string().max(400), sessionStarted: z.literal(false) });
export type Lab18Availability = z.infer<typeof lab18AvailabilityResultSchema>;
export const lab18RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab18Scenarios),
  deadlineSeconds: z.number().int().min(1).max(120), budgetCents: z.number().int().min(1).max(500),
  nativeSandboxFlags: z.never().optional() }).superRefine((value, ctx) => {
    if (value.mode === 'live' && value.scenario !== 'allowed-mount') ctx.addIssue({ code: 'custom', message: 'The only live diagnostic is an exact pwd command; offline scenarios remain separate.' });
  });
export type Lab18Input = z.infer<typeof lab18RunSchema>;
export const lab18ReportSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), source: z.enum(['authored-host-policy', 'managed-api']),
  scenario: z.enum(lab18Scenarios), availability: lab18AvailabilityResultSchema, host: z.strictObject({
    fixtureId: z.string().nullable(), checkedPath: z.string(), allowed: z.boolean(), readCalls: z.number().int().nonnegative(),
    networkCalls: z.number().int().nonnegative(), fileHash: z.string().length(64).nullable(), effect: z.string().max(300) }),
  remote: z.strictObject({ sessionId: z.string().nullable(), outcome: z.string().max(160), toolUses: z.array(z.strictObject({
    name: z.string().max(60), command: z.string().max(200), state: z.string().max(40), result: z.string().max(500).nullable() })).max(12),
    confirmations: z.number().int().nonnegative(), commandObserved: z.boolean(), commandSucceeded: z.boolean(),
    cleanup: z.string().max(40), interruption: z.string().max(40) }),
  message: z.string().max(600) });
export type Lab18Report = z.infer<typeof lab18ReportSchema>;
