import { z } from 'zod';

export const lab50Lesson = { id: 50, title: 'Full stack capstone', topic: 'Production and deployment', serverPrefix: '/api/c50' } as const;
export const lab50CustomerSchema = z.enum(['C-1', 'C-2']);
export const lab50ChatSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), customerId: lab50CustomerSchema,
  conversationId: z.string().regex(/^conv_[0-9a-f-]{36}$/).nullable(), message: z.string().trim().min(1).max(500) });
export const lab50DecisionSchema = z.strictObject({ customerId: lab50CustomerSchema,
  conversationId: z.string().regex(/^conv_[0-9a-f-]{36}$/), approvalId: z.string().regex(/^approval_[0-9a-f-]{36}$/),
  decision: z.enum(['approve', 'deny']) });
export const lab50CloseSchema = z.strictObject({ customerId: lab50CustomerSchema,
  conversationId: z.string().regex(/^conv_[0-9a-f-]{36}$/) });
export const lab50SummarySchema = z.strictObject({ caseStatus: z.enum(['resolved', 'rejected', 'answered', 'needs-review']),
  summary: z.string().min(1).max(300) });
const message = z.strictObject({ id: z.string(), role: z.enum(['customer', 'agent', 'system']), text: z.string().max(1000) });
const approval = z.strictObject({ id: z.string(), orderId: z.string(), amountCents: z.number().int().nonnegative(),
  status: z.enum(['pending', 'approved', 'denied', 'cancelled', 'expired']) });
export const lab50SnapshotSchema = z.strictObject({ source: z.enum(['authored-fixture', 'managed-api']), customerId: lab50CustomerSchema,
  conversationId: z.string(), sessionId: z.string(), status: z.enum(['idle', 'waiting-approval', 'closed', 'cleanup-pending']),
  messages: z.array(message).max(40), summary: lab50SummarySchema.nullable(), pendingApproval: approval.nullable(),
  rawEvents: z.array(z.strictObject({ id: z.string(), type: z.string(), threadId: z.string().nullable() })).max(100),
  policyExpert: z.strictObject({ sessionId: z.string(), allowedTools: z.tuple([z.literal('search_policy')]),
    usage: z.null(), lastResult: z.enum(['not-run', 'read', 'denied']) }),
  usage: z.strictObject({ inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative() }).nullable(),
  cleanup: z.enum(['not-needed', 'archived', 'pending']), providerCalls: z.number().int().nonnegative().nullable(),
  note: z.string().max(300) });
