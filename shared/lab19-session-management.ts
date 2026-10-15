import { z } from 'zod';

export const lab19Lesson = { id: 19, title: 'Session inventory and explicit branches', topic: 'Sessions and context', serverPrefix: '/api/c19' } as const;
const id = z.uuid();
export const lab19TurnSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), action: z.enum(['new', 'continue']),
  conversationId: id.optional(), prompt: z.string().trim().min(1).max(500), deadlineSeconds: z.number().int().min(1).max(120),
  budgetCents: z.number().int().min(1).max(500) }).superRefine((value, ctx) => {
    if (value.action === 'new' && value.conversationId || value.action === 'continue' && !value.conversationId)
      ctx.addIssue({ code: 'custom', message: 'Continue requires an owned conversation ID; new omits it.' });
  });
export type Lab19Turn = z.infer<typeof lab19TurnSchema>;
export const lab19BranchSchema = z.strictObject({ boundaryEventId: id, prompt: z.string().trim().min(1).max(500),
  deadlineSeconds: z.number().int().min(1).max(120), budgetCents: z.number().int().min(1).max(500) });
export type Lab19Branch = z.infer<typeof lab19BranchSchema>;
export const lab19RenameSchema = z.strictObject({ title: z.string().trim().min(1).max(80) });
export const lab19TagSchema = z.strictObject({ tag: z.string().regex(/^[A-Za-z0-9_-]{1,32}$/) });
export const lab19DeleteSchema = z.strictObject({ confirmDelete: z.literal(true) });
export const lab19ResetSchema = z.strictObject({ mode: z.literal('scripted'), confirmReset: z.literal(true) });
export const lab19EventSchema = z.strictObject({ id: z.string().min(1).max(200), type: z.enum(['user.message', 'agent.message']), text: z.string().max(1000),
  source: z.enum(['host-captured', 'managed-api']) });
export type Lab19Event = z.infer<typeof lab19EventSchema>;
export const lab19SummarySchema = z.strictObject({ conversationId: id, sessionId: z.string().nullable(), mode: z.enum(['scripted', 'live']),
  state: z.enum(['prepared', 'busy', 'idle', 'archived', 'closed', 'deleted', 'cleanup-pending', 'budget-paused']), title: z.string().max(80),
  tag: z.string().max(32).nullable(), lineageParentId: id.nullable(), lineageBoundaryEventId: id.nullable(),
  turnCount: z.number().int().nonnegative(), hostEventCount: z.number().int().nonnegative(), version: z.number().int().positive(),
  cleanup: z.string().max(40), providerStatus: z.string().max(40).nullable() });
export type Lab19Summary = z.infer<typeof lab19SummarySchema>;
export const lab19PageSchema = z.strictObject({ events: z.array(lab19EventSchema).max(5), nextCursor: z.string().max(200).nullable(),
  omittedPages: z.boolean(), source: z.enum(['host-captured', 'managed-api', 'not-requested']) });
export const lab19DetailSchema = z.strictObject({ session: lab19SummarySchema, hostEvents: z.array(lab19EventSchema).max(12),
  page: lab19PageSchema, summaryHandoff: z.string().max(600).nullable(), note: z.string().max(400) });
export type Lab19Detail = z.infer<typeof lab19DetailSchema>;
export const lab19ListSchema = z.strictObject({ sessions: z.array(lab19SummarySchema).max(6), providerListing: z.enum(['not-requested', 'observed', 'unavailable']),
  providerPageOmitted: z.boolean(), note: z.string().max(300) });
export const lab19QuerySchema = z.strictObject({ cursor: z.string().regex(/^[A-Za-z0-9_=-]{1,200}$/).optional(),
  provider: z.enum(['yes', 'no']).optional() });
