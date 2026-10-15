import { z } from 'zod';

export const lab45Lesson = { id: 45, title: 'Provider availability and configuration', topic: 'Production and deployment', serverPrefix: '/api/c45' } as const;
export const lab45Targets = ['claude-api', 'claude-platform-aws', 'bedrock', 'vertex', 'foundry'] as const;
export const lab45TargetSchema = z.strictObject({ target: z.enum(lab45Targets) });
export const lab45ScenarioSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), target: z.enum(lab45Targets), scenario: z.enum(['ready', 'bad-auth', 'model-mismatch', 'missing-config', 'missing-feature']) });
export const lab45CapabilitySchema = z.strictObject({ id: z.enum(lab45Targets), label: z.string(), messagesApi: z.boolean(),
  managedDocumented: z.boolean(), installedManagedClientVerified: z.boolean(), managedRouteEnabled: z.boolean(),
  authShape: z.string(), prerequisites: z.array(z.string()), limitations: z.array(z.string()), documentation: z.string().url() });
export const lab45SnapshotSchema = z.strictObject({ source: z.literal('loopback-provider-emulator'), target: z.enum(lab45Targets),
  scenario: lab45ScenarioSchema.shape.scenario, endpoint: z.literal('loopback'), syntheticCredential: z.literal('redacted'),
  managedRouteEnabled: z.boolean(), status: z.enum(['ready', 'refused']), reason: z.string(),
  httpStatus: z.number().int().min(0).max(599), model: z.string(), sessionCreated: z.literal(false), providerCalls: z.literal(0),
  evidence: z.array(z.string()).max(12) });
export type Lab45Target = (typeof lab45Targets)[number];
export type Lab45Scenario = z.infer<typeof lab45ScenarioSchema>['scenario'];
