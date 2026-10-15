import { z } from 'zod';

export const lab43Lesson = { id: 43, title: 'MCP resources through a host bridge', topic: 'Tools and extensions', serverPrefix: '/api/c43' } as const;
export const lab43ScenarioSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(['versioned-resource', 'allowed-template', 'known-prompt', 'bad-token', 'expired-token', 'unknown-uri']) });
export const lab43AuthSchema = z.strictObject({ consent: z.boolean(), refresh: z.boolean().optional() });
export const lab43ReadSchema = z.strictObject({ scenario: lab43ScenarioSchema.shape.scenario, uri: z.string().min(1).max(180).optional() });
export const lab43SnapshotSchema = z.strictObject({ source: z.literal('loopback-mcp-fixture'), scenario: lab43ScenarioSchema.shape.scenario,
  consent: z.boolean(), tokenStatus: z.enum(['absent', 'valid', 'expired', 'invalid']), tokenPreview: z.string().nullable(),
  transport: z.enum(['closed', 'loopback-http']), method: z.string(), uri: z.string().nullable(),
  status: z.enum(['ready', 'allowed', 'refused']), reason: z.string(), resourceVersion: z.number().int().positive().nullable(),
  result: z.string().nullable(), resultBytes: z.number().int().nonnegative(), customToolResult: z.strictObject({ type: z.literal('user.custom_tool_result'),
    tool_use_id: z.string(), is_error: z.boolean(), content: z.string() }).nullable(),
  directMcpConfigured: z.literal(false), providerCalls: z.literal(0), evidence: z.array(z.string()).max(20) });
export type Lab43Scenario = z.infer<typeof lab43ScenarioSchema>['scenario'];
