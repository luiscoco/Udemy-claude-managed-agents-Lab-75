import { z } from 'zod';

export const lab38Lesson = { id: 38, title: 'Application follow up suggestions', topic: 'Agent workflows', serverPrefix: '/api/c38' } as const;
export const lab38Scenarios = ['normal', 'delayed', 'suppressed', 'stale', 'disabled'] as const;
export const lab38ChatSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab38Scenarios) });
export const lab38IdSchema = z.strictObject({ conversationId: z.string().uuid() });
export const lab38WhenSchema = z.strictObject({ conversationId: z.string().uuid(), waitMs: z.number().int().min(0).max(3000) });
export const lab38SwitchSchema = z.strictObject({ conversationId: z.string().uuid(), enabled: z.boolean() });
export const lab38SendSchema = z.strictObject({ conversationId: z.string().uuid(), text: z.string().trim().min(1).max(500),
  suggestionId: z.string().uuid().optional(), expectedTurn: z.number().int().positive(), expectedResponseVersion: z.number().int().positive() });
export const lab38SuggestionSchema = z.strictObject({ id: z.string().uuid(), text: z.string().trim().min(5).max(120),
  conversationId: z.string().uuid(), turn: z.number().int().positive(), responseVersion: z.number().int().positive() });
export const lab38SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), conversationId: z.string().uuid(),
  scenario: z.enum(lab38Scenarios), status: z.enum(['open', 'closed']), turn: z.number().int().positive(), responseVersion: z.number().int().positive(),
  response: z.string(), enabled: z.boolean(), suggestions: z.array(lab38SuggestionSchema).max(3),
  draft: z.string(), sentCount: z.number().int().nonnegative(), autoSendCount: z.literal(0), staleRejected: z.boolean(),
  answerUsage: z.strictObject({ inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative(), source: z.literal('authored-fixture') }),
  suggestionUsage: z.strictObject({ inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative(), source: z.literal('authored-fixture') }).nullable(),
  providerCalls: z.literal(0), note: z.string() });
export type Lab38Chat = z.infer<typeof lab38ChatSchema>;
export type Lab38Send = z.infer<typeof lab38SendSchema>;
