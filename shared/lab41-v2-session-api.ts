import { z } from 'zod';

export const lab41Lesson = { id: 41, title: 'Managed session lifecycle comparison', topic: 'Sessions and context', serverPrefix: '/api/c41' } as const;
export const lab41ScenarioSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(['one-shot', 'retained', 'interrupt-continue', 'reconnect', 'archived-refusal']) });
export const lab41IdSchema = z.strictObject({ runId: z.string().uuid() });
export const lab41ContinueSchema = z.strictObject({ runId: z.string().uuid(), action: z.enum(['second-turn', 'interrupt', 'reconnect', 'archive', 'send-after-archive']) });
export const lab41SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), runId: z.string().uuid(), scenario: z.enum(['one-shot', 'retained', 'interrupt-continue', 'reconnect', 'archived-refusal']),
  sessionId: z.string(), status: z.enum(['idle', 'archived', 'interrupted-idle']), createdSessions: z.literal(1),
  userEventIds: z.array(z.string()), agentEventIds: z.array(z.string()), history: z.array(z.strictObject({ id: z.string(), type: z.enum(['user.message', 'agent.message']), text: z.string() })),
  lifecycle: z.array(z.string()), reconnectCreates: z.literal(0), archiveCount: z.number().int().min(0).max(1),
  providerCalls: z.literal(0), note: z.string() });
export type Lab41Scenario = z.infer<typeof lab41ScenarioSchema>['scenario'];
export type Lab41Action = z.infer<typeof lab41ContinueSchema>['action'];
