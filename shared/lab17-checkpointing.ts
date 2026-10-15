import { z } from 'zod';
import { lab01OutcomeSchema } from './lab01-events.js';

export const lab17Lesson = { id: 17, title: 'Host snapshots and file restoration', topic: 'Sessions and context', serverPrefix: '/api/c17' } as const;
export const lab17SessionSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), deadlineSeconds: z.number().int().min(1).max(120),
  budgetCents: z.number().int().min(1).max(500) });
export type Lab17SessionInput = z.infer<typeof lab17SessionSchema>;
export const lab17ControlSchema = z.strictObject({ runId: z.uuid() });
export const lab17Actions = ['read-notes', 'edit-notes', 'create-draft', 'create-untracked', 'inspect-remote-outputs'] as const;
export const lab17SendSchema = lab17ControlSchema.extend({ action: z.enum(lab17Actions), prompt: z.string().trim().min(1).max(600),
  text: z.string().max(200), expectedVersion: z.number().int().positive() });
export type Lab17Send = z.infer<typeof lab17SendSchema>;
export const lab17RestoreSchema = lab17ControlSchema.extend({ snapshotId: z.uuid(), expectedVersion: z.number().int().positive(),
  dryRun: z.boolean(), planId: z.uuid().optional() }).superRefine((value, ctx) => {
    if (value.dryRun && value.planId || !value.dryRun && !value.planId) ctx.addIssue({ code: 'custom', message: 'Confirmation requires the exact dry-run plan ID.' });
  });
export type Lab17Restore = z.infer<typeof lab17RestoreSchema>;
export const lab17OneShotSchema = z.strictObject({ session: lab17SessionSchema, action: z.enum(['read-notes', 'edit-notes', 'create-draft']),
  prompt: z.string().trim().min(1).max(600), text: z.string().max(200) });
export const lab17FileSchema = z.strictObject({ path: z.enum(['notes.md', 'draft.md', 'scratch.md']), tracked: z.boolean(),
  exists: z.boolean(), hash: z.string().length(64).nullable(), content: z.string().max(500).nullable() });
export type Lab17File = z.infer<typeof lab17FileSchema>;
export const lab17SnapshotMetaSchema = z.strictObject({ snapshotId: z.uuid(), version: z.number().int().positive(),
  createdAt: z.string(), sessionId: z.string().nullable(), relatedHostEventIds: z.array(z.uuid()).max(12),
  relatedManagedEventIds: z.array(z.string()).max(12), files: z.array(lab17FileSchema.pick({ path: true, tracked: true, exists: true, hash: true })).length(2) });
export const lab17ChangeSchema = z.strictObject({ path: z.enum(['notes.md', 'draft.md']), operation: z.enum(['restore', 'delete']),
  fromHash: z.string().length(64).nullable(), toHash: z.string().length(64).nullable() });
export const lab17PlanSchema = z.strictObject({ planId: z.uuid(), snapshotId: z.uuid(), expectedVersion: z.number().int().positive(),
  changes: z.array(lab17ChangeSchema).max(2), untrackedUntouched: z.literal(true), remoteSessionUntouched: z.literal(true) });
export type Lab17Plan = z.infer<typeof lab17PlanSchema>;
export const lab17TurnSchema = z.strictObject({ hostEventId: z.uuid(), prompt: z.string().max(600), response: z.string().max(1000),
  action: z.enum(lab17Actions), sessionId: z.string().nullable(), outcome: lab01OutcomeSchema.nullable() });
export const lab17RemoteSchema = z.strictObject({ status: z.enum(['not-inspected', 'authored-none', 'downloaded', 'none', 'failed']),
  files: z.array(z.strictObject({ name: z.string().max(80), sizeBytes: z.number().int().nonnegative(), hash: z.string().length(64) })).max(3),
  note: z.string().max(300) });
export const lab17ReportSchema = z.strictObject({ runId: z.uuid(), mode: z.enum(['scripted', 'live']), source: z.enum(['authored-fixture', 'managed-api']),
  state: z.enum(['prepared', 'busy', 'idle', 'budget-paused', 'closed', 'cleanup-pending']), version: z.number().int().positive(),
  sessionId: z.string().nullable(), files: z.array(lab17FileSchema).length(3), snapshots: z.array(lab17SnapshotMetaSchema).max(5),
  plan: lab17PlanSchema.nullable(), turns: z.array(lab17TurnSchema).max(3), remoteOutputs: lab17RemoteSchema,
  builtInFilesystemToolsEnabled: z.literal(false), hostHandlerCalls: z.number().int().nonnegative(),
  cleanup: z.enum(['not-needed', 'retained', 'simulated', 'archived', 'pending']), message: z.string().max(600) });
export type Lab17Report = z.infer<typeof lab17ReportSchema>;
