import { z } from 'zod';

export const lab06Lesson = { id: 6, title: 'Sessions and retained context', topic: 'Sessions and context', serverPrefix: '/api/c6' } as const;
export const lab06Prompt = 'Remember that my fictional project is called Aurora Finch.';
export const lab06FollowUp = 'What is the fictional project name I asked you to remember?';
export const lab06Actions = ['new', 'continue', 'reconnect'] as const;
export type Lab06Action = (typeof lab06Actions)[number];
export const lab06Scenarios = ['normal', 'stream-eof', 'hang'] as const;
export type Lab06Scenario = (typeof lab06Scenarios)[number];

export const lab06RequestSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), action: z.enum(lab06Actions),
  conversationId: z.uuid().optional(), prompt: z.string().trim().max(1000),
  scenario: z.enum(lab06Scenarios).default('normal'), deadlineSeconds: z.number().int().min(1).max(120),
  budgetCents: z.number().int().min(1).max(500).optional(),
}).superRefine((value, ctx) => {
  if (value.action === 'new' && value.conversationId) ctx.addIssue({ code: 'custom', path: ['conversationId'], message: 'New creates a conversation; omit conversationId.' });
  if (value.action !== 'new' && !value.conversationId) ctx.addIssue({ code: 'custom', path: ['conversationId'], message: 'Continue and reconnect require conversationId.' });
  if (value.action !== 'reconnect' && !value.prompt) ctx.addIssue({ code: 'custom', path: ['prompt'], message: 'New and Continue require a prompt.' });
  if (value.action === 'reconnect' && value.prompt) ctx.addIssue({ code: 'custom', path: ['prompt'], message: 'Reconnect hydrates history and does not send a prompt.' });
  if (value.mode === 'live' && value.scenario !== 'normal') ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Fixture scenarios are offline only.' });
});
export type Lab06Request = z.input<typeof lab06RequestSchema>;
export type Lab06ParsedRequest = z.infer<typeof lab06RequestSchema>;

const short = z.string().max(2000);
export const lab06HistoryEventSchema = z.strictObject({ id: short, type: z.enum(['user.message', 'agent.message']), text: z.string().max(16000) });
export type Lab06HistoryEvent = z.infer<typeof lab06HistoryEventSchema>;
export const lab06FrameSchema = z.discriminatedUnion('kind', [
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('session'), conversationId: z.uuid(), sessionId: short, localTurnId: z.uuid(), action: z.enum(lab06Actions) }),
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('event'), id: short, eventType: short, text: z.string().max(16000).optional() }),
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('duplicate'), id: short }),
]);
export type Lab06Frame = z.infer<typeof lab06FrameSchema>;

export const lab06ResultSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), source: z.enum(['authored-fixture', 'managed-api']), action: z.enum(lab06Actions),
  conversationId: z.uuid(), sessionId: short, localTurnId: z.uuid(), sentEventId: short.nullable(),
  history: z.array(lab06HistoryEventSchema).max(200), duplicatesIgnored: z.number().int().nonnegative(),
  outcome: z.enum(['completed', 'reconnected', 'incomplete', 'cancelled']), archived: z.boolean(),
  message: z.string().max(1000),
});
export type Lab06Result = z.infer<typeof lab06ResultSchema>;

export const lab06ConversationSchema = z.strictObject({
  conversationId: z.uuid(), sessionId: short, archived: z.boolean(), turnCount: z.number().int().nonnegative(),
  history: z.array(lab06HistoryEventSchema).max(200), expiresAt: z.string().datetime(),
});
export type Lab06Conversation = z.infer<typeof lab06ConversationSchema>;

