import { z } from 'zod';

export const lab53Lesson = { id: 53, title: 'Debugging session and host traces',
  topic: 'Production and deployment', serverPrefix: '/api/c53' } as const;
export const lab53ScenarioSchema = z.enum(['valid-control', 'malformed-report', 'denied-tool', 'missing-idle',
  'local-turn-limit', 'stream-eof', 'cleanup-timeout']);
export const lab53RunSchema = z.strictObject({ scenario: lab53ScenarioSchema });
export const lab53TraceSchema = z.strictObject({ sequence: z.number().int().positive(),
  kind: z.enum(['event', 'host-decision', 'effect', 'transport', 'cleanup']), id: z.string(),
  threadId: z.string().nullable(), summary: z.string().max(240) });
export const lab53ResultSchema = z.strictObject({ id: z.string().uuid(), source: z.literal('offline-authored-trace'),
  scenario: lab53ScenarioSchema, localRunId: z.string(), remoteSessionId: z.string(),
  resolvedConfig: z.strictObject({ agentVersion: z.null(), tools: z.array(z.string()),
    builtins: z.literal(false), mcp: z.literal(false), skills: z.literal(false) }),
  trace: z.array(lab53TraceSchema).max(40), firstUsefulSequence: z.number().int().positive(),
  cause: z.string(), historyGap: z.boolean(), eventOutcome: z.enum(['completed', 'paused', 'incomplete', 'error']),
  reportValid: z.boolean().nullable(), remoteStop: z.enum(['confirmed-idle', 'unconfirmed']),
  cleanup: z.enum(['archived', 'not-needed', 'pending']), refundLedgerCount: z.number().int().nonnegative(),
  replay: z.strictObject({ outcome: z.enum(['completed', 'paused', 'incomplete', 'error']),
    authoritativeMessages: z.number().int().nonnegative(), effectsMatch: z.boolean() }),
  providerCalls: z.literal(0) });
