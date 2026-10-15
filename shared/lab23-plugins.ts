import { z } from 'zod';

export const lab23Lesson = { id: 23, title: 'Reusable capability bundles', topic: 'Tools and extensions', serverPrefix: '/api/c23' } as const;
export const lab23Kinds = ['command', 'tool', 'primary-agent', 'worker-agent', 'mcp', 'skill'] as const;
export const lab23Variants = ['valid', 'malformed', 'missing-directory', 'changed-hash', 'elevated-worker'] as const;
export const lab23ContributionSchema = z.strictObject({ kind: z.enum(lab23Kinds), path: z.string().min(1).max(80),
  sha256: z.string().regex(/^[a-f0-9]{64}$/) });
export const lab23ManifestSchema = z.strictObject({ schemaVersion: z.literal(1), namespace: z.literal('bird'),
  version: z.literal('1.0.0'), contributions: z.array(lab23ContributionSchema).length(6) });
export type Lab23Manifest = z.infer<typeof lab23ManifestSchema>;
export const lab23SelectionSchema = z.strictObject({ enabled: z.boolean(), includeSkill: z.boolean(), includeMcp: z.boolean(),
  location: z.enum(['north marsh', 'pine grove']) });
export type Lab23Selection = z.infer<typeof lab23SelectionSchema>;
export const lab23RunSchema = lab23SelectionSchema.extend({ mode: z.enum(['scripted', 'live']) });
export const lab23ReloadSchema = z.strictObject({ variant: z.enum(lab23Variants) });
export const lab23ResetSchema = z.strictObject({ confirmReset: z.literal(true) });
export const lab23CapabilitySchema = z.strictObject({ commands: z.array(z.string()).max(2), tools: z.array(z.string()).max(2),
  skills: z.array(z.string()).max(2), mcpServers: z.array(z.string()).max(2),
  primary: z.literal('bird.reviewer'), worker: z.literal('bird.worker'), workerTools: z.array(z.never()).max(0),
  dynamicDelegation: z.literal(false) });
export type Lab23Capability = z.infer<typeof lab23CapabilitySchema>;
export const lab23InventorySchema = z.strictObject({ source: z.literal('reviewed-host-bundle'), hostVersion: z.literal('1.0.0'),
  manifestHash: z.string().regex(/^[a-f0-9]{64}$/), selection: lab23SelectionSchema, requested: lab23CapabilitySchema,
  resolved: lab23CapabilitySchema, resolvedSource: z.literal('authored-fixture'), remoteSessionId: z.null(),
  note: z.string().max(450) });
export type Lab23Inventory = z.infer<typeof lab23InventorySchema>;
export const lab23RunResultSchema = lab23InventorySchema.extend({ runId: z.uuid(), source: z.literal('authored-fixture'),
  providerSends: z.literal(0), handlerInvocations: z.number().int().min(0).max(1),
  effectLedger: z.array(z.strictObject({ tool: z.literal('bird.list_sightings'), input: z.strictObject({ location: z.enum(['north marsh', 'pine grove']) }),
    result: z.array(z.strictObject({ species: z.string(), location: z.string(), count: z.number().int() })).max(2) })).max(1),
  skillReadObserved: z.literal(false), mcpContacted: z.literal(false) });
export type Lab23RunResult = z.infer<typeof lab23RunResultSchema>;
