import { z } from 'zod';

export const lab22Lesson = { id: 22, title: 'Explicit project context and memory', topic: 'Configuration and hooks', serverPrefix: '/api/c22' } as const;
export const lab22Scenarios = ['nested', 'conflict', 'disabled', 'handoff'] as const;
export const lab22RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab22Scenarios),
  question: z.string().trim().min(1).max(100), deadlineSeconds: z.number().int().min(5).max(60).default(30),
  budgetCents: z.number().int().min(1).max(100).default(50),
}).superRefine((value, ctx) => { if (value.mode === 'live' && value.scenario === 'conflict')
  ctx.addIssue({ code: 'custom', message: 'The conflicting untrusted document is an offline-only exercise.' }); });
export type Lab22Input = z.infer<typeof lab22RunSchema>;
export const lab22ResetSchema = z.strictObject({ runId: z.uuid(), confirmReset: z.literal(true) });
export const lab22FileKeys = ['root', 'nested', 'untrusted', 'memory'] as const;
export type Lab22FileKey = typeof lab22FileKeys[number];
export const lab22FileSchema = z.strictObject({ key: z.enum(lab22FileKeys), path: z.string().max(120),
  trust: z.enum(['authored-context', 'untrusted-content', 'host-summary']), sha256: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().nonnegative().max(4096), content: z.string().max(4096) });
export const lab22ResultSchema = z.strictObject({ runId: z.uuid(), source: z.enum(['authored-fixture', 'managed-api']),
  scenario: z.enum(lab22Scenarios), selected: z.array(lab22FileSchema).max(4), readKeys: z.array(z.enum(lab22FileKeys)).max(4),
  disabledKeys: z.array(z.enum(lab22FileKeys)).max(4), userMessage: z.string().max(15000), sessionId: z.string().max(200).nullable(),
  sessionState: z.string().max(40), cleanup: z.string().max(40), response: z.string().max(8000),
  cloudMemory: z.literal('not-attached'), remoteFileReads: z.array(z.never()).max(0),
  note: z.string().max(500) });
export type Lab22Result = z.infer<typeof lab22ResultSchema>;
