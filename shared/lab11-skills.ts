import { z } from 'zod';
import { lab03ResultSchema } from './lab03-tools.js';
import { reportedUsageSchema } from './lab02-options.js';

export const lab11Lesson = { id: 11, title: 'Managed skills and progressive loading', topic: 'Tools, MCP and skills', serverPrefix: '/api/c11' } as const;
export const lab11Variants = ['without-skill', 'with-skill', 'missing-id', 'absent-reference', 'revised-version'] as const;
export const lab11Labels = { 'without-skill': 'Without skill', 'with-skill': 'With pinned skill', 'missing-id': 'Missing skill ID', 'absent-reference': 'Absent reference', 'revised-version': 'Revised pinned version' } as const;
export const bundleRevisions = ['v1', 'missing-reference', 'v2'] as const;
export const lab11Scenarios = ['reads', 'metadata-only', 'failed-read', 'duplicate-events', 'hang'] as const;
export const lab11Question = 'Format an Aurora Finch field observation: three birds, calm weather, offline capture. Use the observation formatting skill if relevant, including its reference.';
export const lab11RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), variant: z.enum(lab11Variants),
  prompt: z.string().trim().min(1).max(1000), scenario: z.enum(lab11Scenarios).default('reads'),
  deadlineSeconds: z.number().int().min(1).max(120).default(30), budgetCents: z.number().int().min(1).max(500).default(50),
}).superRefine((v, ctx) => { if (v.mode === 'live' && v.scenario !== 'reads') ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Offline scenarios cannot control a live model.' }); });
export type Lab11Request = z.input<typeof lab11RequestSchema>;
export type Lab11Input = z.infer<typeof lab11RequestSchema>;
export const pinSchema = z.strictObject({ skillId: z.string().regex(/^skill_[A-Za-z0-9_-]+$/).max(200), version: z.string().min(1).max(200).refine(v => v !== 'latest'), bundleHash: z.string().regex(/^[a-f0-9]{64}$/) });
export const pinManifestSchema = z.strictObject({ schemaVersion: z.literal(1), pins: z.partialRecord(z.enum(bundleRevisions), pinSchema) });
export type SkillPin = z.infer<typeof pinSchema>;
export const bundleSchema = z.strictObject({ revision: z.enum(bundleRevisions), name: z.literal('format-observation'), description: z.string(),
  hash: z.string(), files: z.array(z.strictObject({ path: z.string(), sha256: z.string(), text: z.string().max(12000) })).max(2) });
export type SkillBundle = z.infer<typeof bundleSchema>;
export const lab11CatalogSchema = z.strictObject({ source: z.literal('authored-host-bundles'), bundles: z.array(bundleSchema),
  configuredPins: z.array(z.strictObject({ revision: z.enum(bundleRevisions), configured: z.boolean(), matchesBundle: z.boolean() })), liveReady: z.boolean(), manifestValid: z.boolean() });
export const lab11LoadSchema = z.strictObject({ revision: z.enum(bundleRevisions), file: z.enum(['SKILL.md', 'references/format.md']) });
export const lab11LoadResultSchema = z.strictObject({ source: z.literal('host-preview'), revision: z.enum(bundleRevisions), file: z.string(), text: z.string(), agentRead: z.literal(false) });
export const skillReadSchema = z.strictObject({ useId: z.string(), resultId: z.string().nullable(), path: z.string().max(500),
  file: z.enum(['instructions', 'reference']), state: z.enum(['attempted', 'succeeded', 'failed']), contentMatchesBundle: z.boolean().nullable() });
export type SkillRead = z.infer<typeof skillReadSchema>;
export const attachmentSchema = z.strictObject({ skillId: z.string(), version: z.string(), revision: z.enum(bundleRevisions), bundleHash: z.string() });
export const lab11ResultSchema = lab03ResultSchema.omit({ requested: true, toolset: true }).extend({ requested: lab11RequestSchema,
  configured: attachmentSchema.nullable(), resolvedSkills: z.array(z.strictObject({ type: z.string(), skillId: z.string(), version: z.string() })).nullable(),
  reads: z.array(skillReadSchema).max(100), reportedUsage: reportedUsageSchema.nullable(), evidenceNote: z.string().max(1000) });
export type Lab11Result = z.infer<typeof lab11ResultSchema>;
