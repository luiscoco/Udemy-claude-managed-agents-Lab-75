import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { CapstoneError, CapstoneStore, cleanNote } from './store.js';
import type { CustomerId, Order } from './store.js';

export const capstoneToolShapes = {
  list_orders: z.strictObject({}),
  read_order: z.strictObject({ orderId: z.string().regex(/^O-\d{4}$/) }),
  search_policy: z.strictObject({ topic: z.enum(['damaged-items', 'escalation']) }),
  create_ticket: z.strictObject({ orderId: z.string().regex(/^O-\d{4}$/), reason: z.string().trim().min(3).max(240) }),
  propose_refund: z.strictObject({ orderId: z.string().regex(/^O-\d{4}$/), amountCents: z.number().int().positive().max(100000),
    reason: z.literal('damaged-item') }),
} as const;
export type CapstoneToolName = keyof typeof capstoneToolShapes;
export const capstoneToolNames = Object.keys(capstoneToolShapes) as CapstoneToolName[];
const descriptions: Record<CapstoneToolName, string> = {
  list_orders: 'List orders belonging to the current host-selected customer.',
  read_order: 'Read one order only when it belongs to the current host-selected customer.',
  search_policy: 'Read one authored, read-only support policy.',
  create_ticket: 'Create one customer-owned support ticket for an owned order.',
  propose_refund: 'Request a host review of a policy-valid damaged-item refund; never issues funds directly.',
};
export const capstoneToolDefinitions = capstoneToolNames.map(name => {
  const { $schema: _dialect, ...input_schema } = z.toJSONSchema(capstoneToolShapes[name], { target: 'draft-2020-12', io: 'input' });
  return { type: 'custom' as const, name, description: descriptions[name], input_schema };
});
export interface CapstoneToolContext { owner: string; customerId: CustomerId; conversationId: string }
export interface CapstoneToolCall { id: string; name: string; input: unknown }
export interface CapstoneToolResult { type: 'user.custom_tool_result'; custom_tool_use_id: string; content: [{ type: 'text'; text: string }]; is_error: boolean }
const result = (id: string, value: unknown, isError = false): CapstoneToolResult => ({
  type: 'user.custom_tool_result', custom_tool_use_id: id, content: [{ type: 'text', text: JSON.stringify(value).slice(0, 3000) }], is_error: isError });
export function eligibleDamageRefund(order: Order, now: number, windowDays = 30) {
  return order.damaged && now - Date.parse(`${order.purchasedAt}T00:00:00Z`) <= windowDays * 86400000;
}
export function handleCapstoneTool(store: CapstoneStore, context: CapstoneToolContext, call: CapstoneToolCall): CapstoneToolResult {
  if (!/^sevt_[A-Za-z0-9_-]{1,80}$/.test(call.id)) throw new CapstoneError(400, 'Invalid custom-tool event ID.');
  const name = call.name as CapstoneToolName;
  if (!capstoneToolNames.includes(name)) return result(call.id, { error: 'Unknown tool.' }, true);
  const parsed = capstoneToolShapes[name].safeParse(call.input);
  if (!parsed.success) return result(call.id, { error: 'Closed tool input rejected.' }, true);
  try {
    const conversation = store.conversation(context.owner, context.customerId, context.conversationId);
    if (conversation.status === 'closed' || conversation.status === 'cleanup-pending') throw new CapstoneError(409, 'Conversation is closed.');
    if (name === 'list_orders') return result(call.id, [...store.orders.values()].filter(order => order.customerId === context.customerId)
      .map(order => ({ id: order.id, item: order.item, paidCents: order.paidCents, remainingCents: store.remaining(order.id) })));
    if (name === 'read_order') { const input = capstoneToolShapes.read_order.parse(call.input);
      const order = store.order(context.customerId, input.orderId); return result(call.id, { ...order, note: cleanNote(order.note), remainingCents: store.remaining(order.id) }); }
    if (name === 'search_policy') { const input = capstoneToolShapes.search_policy.parse(call.input);
      const text = readFileSync(new URL(`./policies/${input.topic}.md`, import.meta.url), 'utf8').slice(0, 4000);
      return result(call.id, { topic: input.topic, text }); }
    if (name === 'create_ticket') { const input = capstoneToolShapes.create_ticket.parse(call.input);
      store.order(context.customerId, input.orderId); const ticket = { id: `ticket_${randomUUID()}`, customerId: context.customerId,
        orderId: input.orderId, reason: cleanNote(input.reason) };
      store.tickets.set(ticket.id, ticket); store.audit(context.customerId, 'ticket-created', ticket.id); return result(call.id, ticket); }
    const input = capstoneToolShapes.propose_refund.parse(call.input);
    const order = store.order(context.customerId, input.orderId);
    if (!eligibleDamageRefund(order, store.clock()))
      throw new CapstoneError(422, 'Damaged-item refund policy does not cover this order.');
    if (input.amountCents > store.remaining(order.id)) throw new CapstoneError(422, 'Refund exceeds the remaining paid amount.');
    const actionKey = store.actionKey(conversation.id, order.id, input.amountCents);
    if ([...store.refunds.values()].some(refund => refund.actionKey === actionKey))
      throw new CapstoneError(409, 'Refund action already applied.');
    const existing = [...store.approvals.values()].find(approval => approval.actionKey === actionKey && approval.status === 'pending');
    if (existing) return result(call.id, { pendingApprovalId: existing.id, actionKey, reused: true });
    if (conversation.pendingApprovalId) throw new CapstoneError(409, 'Resolve the existing approval first.');
    const approval = { id: `approval_${randomUUID()}`, conversationId: conversation.id, customerId: context.customerId,
      orderId: order.id, amountCents: input.amountCents, actionKey, status: 'pending' as const,
      expiresAt: store.clock() + 5 * 60_000, reviewer: null };
    store.approvals.set(approval.id, approval); conversation.pendingApprovalId = approval.id; conversation.status = 'waiting-approval';
    store.audit(context.customerId, 'refund-proposed', `${approval.id} ${input.amountCents} cents`);
    return result(call.id, { pendingApprovalId: approval.id, actionKey, amountCents: approval.amountCents, reused: false });
  } catch (error) { return result(call.id, { error: error instanceof CapstoneError ? error.message : 'Host tool failed.' }, true); }
}
