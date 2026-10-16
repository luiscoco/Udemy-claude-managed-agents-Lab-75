import { z } from 'zod';
import { lab58SearchResultSchema, lab58SearchSchema, lab58RunSchema } from '../../shared/lab58-tool-search.js';
import type { z as Z } from 'zod';

type Search = Z.infer<typeof lab58SearchSchema>;
type Run = Z.infer<typeof lab58RunSchema>;
const verbs: Record<string, readonly string[]> = {
  billing: ['refund_invoice', 'read_invoice', 'list_invoices', 'issue_credit', 'get_balance', 'update_address', 'export_receipt', 'preview_tax'],
  scheduling: ['find_slot', 'book_slot', 'cancel_slot', 'list_events', 'read_calendar', 'move_event', 'invite_guest', 'check_capacity'],
  travel: ['find_flight', 'price_trip', 'read_booking', 'cancel_booking', 'find_hotel', 'check_visa', 'get_weather', 'plan_route'],
  analytics: ['count_events', 'query_metric', 'export_chart', 'compare_periods', 'list_segments', 'read_dashboard', 'inspect_funnel', 'sample_rows'],
  catalog: ['find_product', 'read_product', 'list_categories', 'check_price', 'check_stock', 'compare_items', 'get_specs', 'find_related'],
  support: ['open_ticket', 'read_ticket', 'list_tickets', 'assign_ticket', 'close_ticket', 'search_help', 'add_note', 'escalate_ticket'],
  inventory: ['read_sku', 'list_stock', 'reserve_stock', 'release_stock', 'count_bins', 'move_stock', 'audit_stock', 'find_warehouse'],
  messaging: ['draft_email', 'list_templates', 'preview_sms', 'read_thread', 'schedule_send', 'cancel_send', 'find_contact', 'check_delivery'],
};
type Tool = { name: string; hint: string; description: string; schema: z.ZodType<Record<string, unknown>> };
const genericSchema = z.strictObject({ query: z.string().trim().min(1).max(80) });
const refundSchema = z.strictObject({ invoiceId: z.literal('INV-2042'), amountCents: z.number().int().positive().max(2500) });
export const tools: Tool[] = Object.entries(verbs).flatMap(([domain, names]) => names.map(verb => ({
  name: `${domain}_${verb}`, hint: `${domain} ${verb.replaceAll('_', ' ')}`,
  description: verb === 'refund_invoice' ? 'Refund a verified invoice by integer cents after host authorization.' :
    `Look up ${verb.replaceAll('_', ' ')} in the ${domain} domain; host handler controls effects.`,
  schema: verb === 'refund_invoice' ? refundSchema : genericSchema,
})));
if (tools.length !== 64) throw new Error('Catalog must contain exactly 64 definitions.');
const estimate = (value: unknown) => Math.ceil(JSON.stringify(value).length / 4);
const tokens = (text: string) => [...new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? [])].slice(0, 8);
function variantTool(tool: Tool, variant: Search['variant']) {
  return variant === 'good' ? tool : { ...tool, hint: 'Useful tool', description: 'Can help with a task.' };
}
export function planCatalog() { const names = tools.map(tool => tool.name);
  return { source: 'offline-host-scorer', totalTools: 64, initialNames: names,
    estimatedInitialTokens: estimate(names), loadedDefinitions: 0, providerCalls: 0,
    note: 'Initial names and their estimate do not prove any dynamic native tool registration or model loading.' }; }
export function searchCatalog(request: Search) {
  const matches = tools.map(original => {
    const tool = variantTool(original, request.variant); const words = tokens(request.query);
    const score = words.reduce((sum, word) => sum + (tool.name.includes(word) ? 3 : 0) +
      (tool.hint.toLowerCase().includes(word) ? 2 : 0) +
      (tool.description.toLowerCase().includes(word) ? 1 : 0), 0);
    return { tool, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, request.limit).map(({ tool, score }) => ({ name: tool.name, hint: tool.hint,
      description: tool.description, inputSchema: z.toJSONSchema(tool.schema) as Record<string, unknown>, score }));
  return lab58SearchResultSchema.parse({ source: 'offline-host-scorer', query: request.query, variant: request.variant,
    totalTools: 64, resultLimit: request.limit, results: matches, estimatedInitialTokens: planCatalog().estimatedInitialTokens,
    estimatedReturnedTokens: estimate(matches), providerCalls: 0,
    note: 'Host simulator ranks +3 name, +2 hint, +1 description per query term. Returned definitions do not register native tools.' });
}
const refunds = new Map<string, number>();
export function invokeCatalogTool(request: Run, owner: string) {
  const tool = tools.find(item => item.name === request.name);
  if (!tool) return { accepted: false, reason: 'Unknown tool.', effect: 'none', providerCalls: 0 };
  const parsed = tool.schema.safeParse(request.input);
  if (!parsed.success) return { accepted: false, reason: 'Input failed the chosen closed schema.', effect: 'none', providerCalls: 0 };
  if (tool.name !== 'billing_refund_invoice')
    return { accepted: true, reason: 'Generic read-only fixture dispatched.', effect: 'read-only', providerCalls: 0 };
  // The scenario selects an authored trusted host context; catalog prose and user input never grant authority.
  if (request.scenario !== 'authorized')
    return { accepted: false, reason: 'Trusted host context denied invoice refund.', effect: 'none', providerCalls: 0 };
  const key = `${owner}:${parsed.data.invoiceId}:${parsed.data.amountCents}`;
  if (refunds.has(key)) return { accepted: true, reason: 'Idempotent replay; no second refund.', effect: 'already-recorded', providerCalls: 0 };
  if (refunds.size >= 128) return { accepted: false, reason: 'Offline refund ledger capacity reached.', effect: 'none', providerCalls: 0 };
  refunds.set(key, parsed.data.amountCents as number);
  return { accepted: true, reason: 'Trusted host authorized an offline refund ledger entry.', effect: 'recorded-once', providerCalls: 0 };
}
export function measureCatalog(query: string) {
  const base = { query, limit: 5 } as const;
  const good = searchCatalog({ ...base, variant: 'good' }); const vague = searchCatalog({ ...base, variant: 'vague' });
  return { source: 'offline-host-scorer', good, vague, providerCalls: 0,
    note: 'These token estimates and rankings are host approximations, not actual Claude context or internal ranking.' };
}
