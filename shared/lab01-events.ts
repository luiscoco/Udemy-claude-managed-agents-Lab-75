import { z } from 'zod';

/** Lab 01 wire contract. The local lesson operation is "query"; the provider call is a session turn. */
export const lab01Scenarios = ['normal', 'session-error', 'stream-ended', 'repeated-events',
  'requires-action', 'budget-reached', 'cancel', 'deadline'] as const;
export const lab01RequestSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']),
  prompt: z.string().trim().min(1, 'Enter a prompt.').max(1000, 'Use at most 1000 characters.'),
  scenario: z.enum(lab01Scenarios).default('normal'),
}).superRefine((request, ctx) => {
  if (request.mode === 'live' && request.scenario !== 'normal')
    ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Fixture scenarios are offline only.' });
});
export type Lab01Request = z.infer<typeof lab01RequestSchema>;

export const lab01Source = z.enum(['authored-fixture', 'managed-api']);
export const lab01SessionSchema = z.strictObject({
  source: lab01Source, id: z.string().max(200), status: z.string().max(40),
  agentId: z.string().max(200), agentVersion: z.number().int().nullable(),
  environmentId: z.string().max(200), budget: z.string().max(60).nullable(),
  toolCount: z.number().int().nonnegative(), mcpServerCount: z.number().int().nonnegative(),
});
export type Lab01Session = z.infer<typeof lab01SessionSchema>;

export const lab01OutcomeKinds = ['completed', 'paused', 'error', 'incomplete', 'cancelled', 'deadline'] as const;
export const lab01OutcomeSchema = z.strictObject({
  kind: z.enum(lab01OutcomeKinds), stopReason: z.string().max(100).nullable(), detail: z.string().max(500),
});
export type Lab01Outcome = z.infer<typeof lab01OutcomeSchema>;

const base = { seq: z.number().int().positive() };
const raw = z.string().max(4100).optional();
export const lab01FrameSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...base, kind: z.literal('session'), session: lab01SessionSchema }),
  z.strictObject({ ...base, kind: z.literal('notice'), text: z.string().max(300) }),
  z.strictObject({ ...base, kind: z.literal('lifecycle'), type: z.string().max(100), id: z.string().max(200), detail: z.string().max(300), raw }),
  z.strictObject({ ...base, kind: z.literal('span'), type: z.string().max(100), id: z.string().max(200), detail: z.string().max(300), raw }),
  z.strictObject({ ...base, kind: z.literal('preview'), eventId: z.string().max(200), text: z.string().max(16000), raw }),
  z.strictObject({ ...base, kind: z.literal('message'), eventId: z.string().max(200), text: z.string().max(16000),
    replacedPreview: z.boolean(), raw }),
  z.strictObject({ ...base, kind: z.literal('duplicate'), eventType: z.string().max(100), id: z.string().max(200) }),
  z.strictObject({ ...base, kind: z.literal('other'), type: z.string().max(100), raw }),
]);
export type Lab01Frame = z.infer<typeof lab01FrameSchema>;

export const lab01ResultSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), source: lab01Source,
  sessionId: z.string().nullable(), session: lab01SessionSchema.nullable(),
  outcome: lab01OutcomeSchema,
  messages: z.array(z.strictObject({ eventId: z.string(), text: z.string().max(16000) })).max(100),
  previews: z.array(z.strictObject({ eventId: z.string(), text: z.string().max(16000), state: z.enum(['replaced', 'incomplete']) })).max(100),
  duplicatesIgnored: z.number().int().nonnegative(), eventCount: z.number().int().nonnegative(),
  interruption: z.enum(['not-needed', 'not-attempted', 'simulated', 'confirmed', 'unconfirmed']),
  cleanup: z.enum(['not-needed', 'simulated', 'archived', 'pending']),
  message: z.string().max(600),
});
export type Lab01Result = z.infer<typeof lab01ResultSchema>;

/** Identity shared by the browser registry and the server router. Teaching text lives in content.ts. */
export const lab01Lesson = { id: 1, title: 'Session event streaming', topic: 'Managed Agents fundamentals', serverPrefix: '/api/c1' } as const;
