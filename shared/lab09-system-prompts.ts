import { z } from 'zod';
import { lab01ResultSchema, lab01Scenarios } from './lab01-events.js';
import { reportedUsageSchema } from './lab02-options.js';

export const lab09Lesson = { id: 9, title: 'System instructions and explicit context', topic: 'Managed Agents fundamentals', serverPrefix: '/api/c9' } as const;
export const lab09Question = 'What is Aurora Finch, and what should its next release prioritize?';
export const lab09Variants = ['base', 'custom', 'base-plus-append', 'base-plus-project-context'] as const;
export const lab09VariantLabels = { base: 'Base (omit system override)', custom: 'Custom replacement', 'base-plus-append': 'Base plus appended instructions', 'base-plus-project-context': 'Base plus authored project context' } as const;
export const lab09RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), variant: z.enum(lab09Variants),
  prompt: z.string().trim().min(1).max(1000), scenario: z.enum(lab01Scenarios).default('normal'),
  customSystem: z.string().trim().min(1).max(2000).default('Answer in two short bullet points. State when project facts are unknown.'),
  append: z.string().trim().min(1).max(1000).default('Use three numbered sentences. State uncertainty explicitly.'),
  contextId: z.literal('aurora-finch-v1').default('aurora-finch-v1'), deadlineSeconds: z.number().int().min(1).max(120),
  budgetCents: z.number().int().min(1).max(500).default(50),
}).superRefine((value, ctx) => { if (value.mode === 'live' && value.scenario !== 'normal') ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Fixture scenarios are offline only.' }); });
export type Lab09Request = z.input<typeof lab09RequestSchema>;
export type Lab09ParsedRequest = z.infer<typeof lab09RequestSchema>;
export const lab09CompositionSchema = z.strictObject({ variant: z.enum(lab09Variants), overrideIncluded: z.boolean(), configuredSystem: z.string().max(8000).nullable(),
  baseSystem: z.string().max(8000).nullable(), contextId: z.literal('aurora-finch-v1').nullable(), contextSource: z.enum(['none', 'authored-host-selection']) });
export type Lab09Composition = z.infer<typeof lab09CompositionSchema>;
export const lab09EffectiveSchema = z.strictObject({ agentId: z.string(), agentVersion: z.number().int(), model: z.string(),
  system: z.string().max(8000).nullable(), systemSource: z.enum(['inherited', 'overridden']), tools: z.number().int(), mcpServers: z.number().int(), skills: z.number().int() });
export type Lab09Effective = z.infer<typeof lab09EffectiveSchema>;
export const lab09ResultSchema = lab01ResultSchema.extend({ requested: lab09RequestSchema, composition: lab09CompositionSchema.nullable(),
  effective: lab09EffectiveSchema.nullable(), reportedUsage: reportedUsageSchema.nullable() });
export type Lab09Result = z.infer<typeof lab09ResultSchema>;
export const lab09ContextSchema = z.strictObject({ id: z.literal('aurora-finch-v1'), filename: z.literal('fictional/CLAUDE.md'), text: z.string(),
  provenance: z.literal('authored host allowlist'), automaticallyLoaded: z.literal(false), systemMessageEnabled: z.literal(false) });
