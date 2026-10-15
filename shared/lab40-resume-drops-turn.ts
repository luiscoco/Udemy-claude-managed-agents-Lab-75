import { z } from 'zod';

export const lab40Lesson = { id: 40, title: 'Safe recovery boundaries', topic: 'Sessions and context', serverPrefix: '/api/c40' } as const;
export const lab40Scenarios = ['kept-turn', 'uncertain-send', 'queued-follow-up', 'pending-effect', 'clean-snapshot'] as const;
export const lab40BuildSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(lab40Scenarios) });
export const lab40IdSchema = z.strictObject({ runId: z.string().uuid() });
export const lab40CaseSchema = z.strictObject({ runId: z.string().uuid(), choice: z.enum(['continue', 'interrupt', 'fresh-derived', 'reconcile']) });
export const lab40UndoSchema = z.strictObject({ runId: z.string().uuid(), expectedVersion: z.number().int().positive() });
export const lab40SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), runId: z.string().uuid(), scenario: z.enum(lab40Scenarios),
  version: z.number().int().positive(), sessionId: z.string(), remoteEventIds: z.array(z.string()), remoteHistoryCount: z.number().int().nonnegative(),
  commandLedger: z.array(z.strictObject({ id: z.string(), state: z.enum(['accepted', 'queued', 'uncertain', 'processed']), text: z.string() })),
  effectLedger: z.array(z.strictObject({ id: z.string(), state: z.enum(['pending', 'applied']), description: z.string() })),
  hostDraft: z.string(), snapshotDraft: z.string(), snapshotVersion: z.number().int().positive(),
  recovery: z.enum(['none', 'continued', 'interrupt-confirmed-idle', 'fresh-derived', 'reconciliation-required']),
  decision: z.string(), undo: z.enum(['not-attempted', 'restored-host-draft', 'refused']),
  providerCalls: z.literal(0), evidence: z.array(z.string()).max(20) });
export type Lab40Build = z.infer<typeof lab40BuildSchema>;
export type Lab40Choice = z.infer<typeof lab40CaseSchema>['choice'];
