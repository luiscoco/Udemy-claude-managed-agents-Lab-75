import { z } from 'zod';

export const lab48Lesson = { id: 48, title: 'Security hardening', topic: 'Permissions and security', serverPrefix: '/api/c48' } as const;
export const lab48Actions = ['secret-read', 'out-of-scope-write', 'injected-egress'] as const;
export const lab48Policies = ['naive', 'layered'] as const;
export const lab48RequestSchema = z.strictObject({ mode: z.literal('scripted'), policy: z.enum(lab48Policies), action: z.enum(lab48Actions) });
export const lab48ToolInputSchema = z.strictObject({ action: z.enum(lab48Actions), target: z.string().min(1).max(160),
  idempotencyKey: z.string().regex(/^[a-z0-9-]{1,60}$/) });
const { $schema: _dialect, ...toolInputJsonSchema } = z.toJSONSchema(lab48ToolInputSchema, { target: 'draft-2020-12', io: 'input' });
export { toolInputJsonSchema as lab48ToolInputJsonSchema };
export const lab48SnapshotSchema = z.strictObject({ source: z.literal('local-security-range'), policy: z.enum(lab48Policies),
  action: z.enum(lab48Actions), eventId: z.string().regex(/^sevt_fixture_/), idempotencyKey: z.string(),
  attempted: z.boolean(), executed: z.boolean(), blockedBy: z.string().nullable(),
  toolResult: z.strictObject({ eventId: z.string(), isError: z.boolean(), text: z.string() }),
  collectorHits: z.number().int().nonnegative(), insideFile: z.string(), outsideFile: z.string(),
  canaryExposed: z.boolean(), providerCalls: z.literal(0), evidence: z.array(z.string()).max(8) });
export type Lab48Action = (typeof lab48Actions)[number];
export type Lab48Policy = (typeof lab48Policies)[number];
