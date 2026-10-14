import { z } from 'zod';
import { lab01OutcomeSchema } from './lab01-events.js';

export const lab13Lesson = { id: 13, title: 'MCP connections and reachability', topic: 'Tools, MCP and skills', serverPrefix: '/api/c13' } as const;
export const lab13Scenarios = ['working', 'missing', 'unauthorized', 'hang'] as const;
export const lab13ConfigSchema = z.strictObject({ notesEnabled: z.boolean().default(true), inventoryEnabled: z.boolean().default(true), reserveEnabled: z.boolean().default(false) });
export type Lab13Config = z.infer<typeof lab13ConfigSchema>;
export const lab13RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), integration: z.enum(['host-bridge', 'managed-url']).default('host-bridge'),
  scenario: z.enum(lab13Scenarios).default('working'), config: lab13ConfigSchema.default({ notesEnabled: true, inventoryEnabled: true, reserveEnabled: false }),
  prompt: z.string().trim().min(1).max(1000).default('List the fictional field notes and check NOTEBOOK stock using the available tools.'),
  operation: z.enum(['inspect', 'reserve']).default('inspect'), deadlineSeconds: z.number().int().min(1).max(120).default(30), budgetCents: z.number().int().min(1).max(500).default(50),
}).superRefine((input, ctx) => {
  if (input.mode === 'live' && input.scenario !== 'working') ctx.addIssue({ code: 'custom', message: 'Authored failure scenarios are offline only.' });
  if (input.integration === 'managed-url' && (input.mode !== 'live' || input.config.notesEnabled || input.config.reserveEnabled || input.operation !== 'inspect')) ctx.addIssue({ code: 'custom', message: 'Native Managed URL mode is live, inventory-only and read-only.' });
});
export type Lab13Input = z.infer<typeof lab13RequestSchema>;
export const lab13ControlSchema = z.strictObject({ runId: z.uuid() });
export const lab13SendSchema = lab13ControlSchema.extend({ prompt: z.string().trim().min(1).max(1000), operation: z.enum(['inspect', 'reserve']).default('inspect') });
export const lab13ConfigureSchema = lab13ControlSchema.extend({ config: lab13ConfigSchema });
export const lab13SkuSchema = z.enum(['NOTEBOOK', 'BINOCULARS', 'RECORDER']);
export const lab13Shapes = {
  list_notes: z.strictObject({}), read_note: z.strictObject({ id: z.enum(['note_1', 'note_2']) }),
  get_stock: z.strictObject({ sku: lab13SkuSchema.optional() }), reserve_stock: z.strictObject({ sku: lab13SkuSchema, quantity: z.number().int().min(1).max(5) }),
};
export const lab13ToolNames = ['list_notes', 'read_note', 'get_stock', 'reserve_stock'] as const;
export const lab13StockSchema = z.array(z.strictObject({ sku: lab13SkuSchema, available: z.number().int().nonnegative() })).max(3);
export type Lab13Stock = z.infer<typeof lab13StockSchema>;
export const lab13ConnectionSchema = z.strictObject({ server: z.enum(['notes', 'inventory']), transport: z.enum(['stdio', 'streamable-http', 'managed-url']),
  state: z.enum(['disabled', 'not-tested', 'ready-local', 'failed-local', 'configured-cloud']), advertisedTools: z.array(z.string()).max(4), effectiveTools: z.array(z.string()).max(4),
  detail: z.string().max(500), httpStatus: z.number().int().nullable() });
export type Lab13Connection = z.infer<typeof lab13ConnectionSchema>;
export const lab13CallSchema = z.strictObject({ useId: z.string(), resultId: z.string().nullable(), resultSent: z.boolean(), server: z.string(), name: z.string(),
  path: z.enum(['host-mcp', 'native-mcp', 'host-rejected']), isError: z.boolean(), text: z.string().max(4000), handlerRan: z.boolean() });
export type Lab13Call = z.infer<typeof lab13CallSchema>;
export const lab13SnapshotSchema = z.strictObject({ runId: z.uuid(), revision: z.number().int().nonnegative(), sessionId: z.string().nullable(),
  mode: z.enum(['scripted', 'live']), source: z.enum(['authored-agent-real-local-mcp', 'managed-api-host-bridge', 'managed-api-native-mcp']),
  state: z.enum(['idle', 'running', 'updating', 'closed', 'cleanup-pending']), config: lab13ConfigSchema, connections: z.array(lab13ConnectionSchema).max(2),
  turns: z.array(z.strictObject({ id: z.uuid(), outcome: lab01OutcomeSchema, messages: z.array(z.strictObject({ eventId: z.string(), text: z.string().max(16000) })).max(5) })).max(10),
  calls: z.array(lab13CallSchema).max(40), stock: lab13StockSchema, stockScope: z.literal('host-local-inventory'),
  transportEvidence: z.array(z.strictObject({ server: z.string(), method: z.string(), requestId: z.number().int(), outcome: z.string().max(100) })).max(80),
  interruption: z.string().max(100), cleanup: z.enum(['not-needed', 'retained', 'simulated', 'archived', 'pending']), message: z.string().max(800) });
export type Lab13Snapshot = z.infer<typeof lab13SnapshotSchema>;
