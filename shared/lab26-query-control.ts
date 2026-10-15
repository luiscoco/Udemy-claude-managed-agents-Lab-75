import { z } from 'zod';

export const lab26Lesson = { id: 26, title: 'Session controls and supported updates', topic: 'Sessions and context', serverPrefix: '/api/c26' } as const;
export const lab26Operations = ['retrieve', 'history', 'send', 'interrupt', 'title-metadata', 'idle-tools-mcp', 'budget-change', 'archive', 'fresh-model-handoff'] as const;
export const lab26OpenSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(['normal', 'slow']).default('slow'),
  budgetCents: z.number().int().min(1).max(100).default(10) });
const common = { sessionId: z.string().uuid() };
export const lab26CallSchema = z.discriminatedUnion('operation', [
  z.strictObject({ ...common, operation: z.literal('retrieve') }),
  z.strictObject({ ...common, operation: z.literal('history') }),
  z.strictObject({ ...common, operation: z.literal('send'), message: z.string().trim().min(1).max(300) }),
  z.strictObject({ ...common, operation: z.literal('interrupt') }),
  z.strictObject({ ...common, operation: z.literal('title-metadata'), title: z.string().trim().min(1).max(80), tag: z.string().trim().min(1).max(40) }),
  z.strictObject({ ...common, operation: z.literal('idle-tools-mcp'), tools: z.array(z.enum(['read_report', 'format_note'])).max(2),
    mcpServers: z.array(z.enum(['fictional_catalog'])).max(1) }),
  z.strictObject({ ...common, operation: z.literal('budget-change'), budgetCents: z.number().int().min(1).max(100), confirmResume: z.boolean() }),
  z.strictObject({ ...common, operation: z.literal('archive') }),
  z.strictObject({ ...common, operation: z.literal('fresh-model-handoff'), model: z.enum(['fixture-model-a', 'fixture-model-b']), summary: z.string().trim().min(1).max(300) }),
]);
export type Lab26Call = z.infer<typeof lab26CallSchema>;
export type Lab26Open = z.infer<typeof lab26OpenSchema>;
export const lab26SessionSchema = z.strictObject({ sessionId: z.string().uuid(), source: z.literal('authored-fixture'), status: z.enum(['idle', 'running', 'archived']),
  model: z.enum(['fixture-model-a', 'fixture-model-b']), title: z.string(), tag: z.string().nullable(), tools: z.array(z.string()),
  mcpServers: z.array(z.string()), budgetCents: z.number().int(), history: z.array(z.string()),
  interruption: z.enum(['not-needed', 'confirmed-idle', 'unconfirmed']), parentSessionId: z.string().uuid().nullable(),
  summaryHandoff: z.string().nullable(), version: z.number().int(), note: z.string() });
