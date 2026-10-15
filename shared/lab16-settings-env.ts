import { z } from 'zod';
import { lab01ResultSchema } from './lab01-events.js';

export const lab16Lesson = { id: 16, title: 'Environment and configuration provenance', topic: 'Configuration and hooks', serverPrefix: '/api/c16' } as const;
export const lab16Scenarios = ['winning-host-layer', 'missing-credential', 'absent-remote-mount', 'restricted-path'] as const;
export const lab16RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab16Scenarios),
  userRegion: z.enum(['north', 'south']).nullable(), sessionRegion: z.enum(['north', 'south']).nullable(),
  prompt: z.string().trim().min(1).max(600), deadlineSeconds: z.number().int().min(1).max(120), budgetCents: z.number().int().min(1).max(500),
}).superRefine((value, ctx) => { if (value.mode === 'live' && value.scenario !== 'winning-host-layer') ctx.addIssue({ code: 'custom', message: 'Authored failure scenarios are offline only.' }); });
export type Lab16Input = z.infer<typeof lab16RequestSchema>;
export const lab16AccessSchema = z.strictObject({ path: z.enum(['/mnt/session/uploads/field-guide.txt', '/mnt/session/outputs/note.txt', '/etc/passwd', '../field-guide.txt']),
  scenario: z.enum(lab16Scenarios) });
export const lab16AccessResultSchema = z.strictObject({ path: z.string(), allowed: z.boolean(), reason: z.string(), effect: z.literal('no file opened; host-policy demonstration') });
export const lab16RowSchema = z.strictObject({ name: z.string().max(80), hostValue: z.string().max(120), hostSource: z.string().max(80),
  remoteValue: z.string().max(120), remoteSource: z.string().max(80), note: z.string().max(300) });
export const lab16ResolutionSchema = z.strictObject({ scenario: z.enum(lab16Scenarios), rows: z.array(lab16RowSchema).max(8),
  credentialReady: z.boolean(), remoteMountReady: z.boolean(), accessAllowed: z.boolean(), accessReason: z.string().max(300),
  precedence: z.literal('Application-defined: session override > user override > course default'),
  evidence: z.array(z.string().max(350)).max(12) });
export type Lab16Resolution = z.infer<typeof lab16ResolutionSchema>;
export const lab16LayersSchema = z.strictObject({ comparisons: z.array(lab16ResolutionSchema).length(3),
  note: z.literal('Synthetic application precedence; no process or personal settings were inspected.') });
export const lab16ManifestSchema = z.strictObject({ source: z.literal('host-allowlist'), liveReady: z.boolean(), credentialNames: z.array(z.string()).max(4),
  credentialReady: z.boolean(), environmentConfigured: z.boolean(), remoteFixtureConfigured: z.boolean(),
  files: z.array(z.strictObject({ name: z.string(), mountPath: z.string(), approved: z.boolean() })).max(4),
  authoredEnvironment: z.strictObject({ type: z.literal('cloud'), networking: z.strictObject({ type: z.literal('limited'), allowedHosts: z.array(z.string()),
    allowMcpServers: z.boolean(), allowPackageManagers: z.boolean() }), packages: z.array(z.string()) }),
  unsupported: z.array(z.string()).max(10) });
export type Lab16Manifest = z.infer<typeof lab16ManifestSchema>;
export const lab16RunSchema = z.strictObject({ source: z.enum(['authored-fixture', 'managed-api']), resolution: lab16ResolutionSchema,
  requestedMount: z.string().nullable(), observedMount: z.enum(['fixture', 'listed', 'unconfirmed', 'absent']),
  resolvedEnvironment: z.strictObject({ kind: z.enum(['authored-fixture', 'cloud', 'self_hosted']), archived: z.boolean(),
    networking: z.enum(['limited', 'unrestricted', 'not-applicable']), packageCount: z.number().int().nonnegative() }).nullable(),
  session: lab01ResultSchema.nullable(), message: z.string().max(600) });
export type Lab16Run = z.infer<typeof lab16RunSchema>;
