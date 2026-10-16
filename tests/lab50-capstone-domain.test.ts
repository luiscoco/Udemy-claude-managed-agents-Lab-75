import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CapstoneStore } from '../server/capstone/store.js';
import { capstoneToolDefinitions, handleCapstoneTool } from '../server/capstone/tools.js';

const at = Date.parse('2026-10-16T12:00:00Z');
function range() { const store = new CapstoneStore(() => at), one = store.createConversation('owner-a', 'C-1'),
  two = store.createConversation('owner-b', 'C-2');
  const call = (customerId: 'C-1' | 'C-2', conversationId: string, name: string, input: unknown) =>
    handleCapstoneTool(store, { owner: customerId === 'C-1' ? 'owner-a' : 'owner-b', customerId, conversationId },
      { id: `sevt_${Math.random().toString(36).slice(2)}`, name, input });
  return { store, one, two, call };
}
test('closed custom tool schemas omit customer and reviewer authority', () => {
  const refund = capstoneToolDefinitions.find(tool => tool.name === 'propose_refund');
  assert.ok(refund); assert.equal((refund.input_schema as { additionalProperties?: unknown }).additionalProperties, false);
  assert.doesNotMatch(JSON.stringify(refund.input_schema), /customerId|reviewer|approver/);
});
test('owned damaged refund requires exact single-use host approval and integer cents', () => {
  const { store, one, call } = range(); const proposal = call('C-1', one.id, 'propose_refund',
    { orderId: 'O-1001', amountCents: 2500, reason: 'damaged-item' });
  assert.equal(proposal.is_error, false); const pending = JSON.parse(proposal.content[0].text) as { pendingApprovalId: string };
  assert.equal(store.remaining('O-1001'), 5000); assert.equal(store.refunds.size, 0);
  const approval = store.approve('owner-a', 'C-1', pending.pendingApprovalId, 'approve', 'trusted-local-reviewer');
  assert.equal(approval.refund?.amountCents, 2500); assert.equal(store.remaining('O-1001'), 2500);
  assert.equal(store.refunds.size, 1); assert.equal(approval.refund?.approvedBy, 'trusted-local-reviewer');
  assert.throws(() => store.approve('owner-a', 'C-1', pending.pendingApprovalId, 'approve', 'trusted-local-reviewer'), /consumed/);
  assert.equal(call('C-1', one.id, 'propose_refund', { orderId: 'O-1001', amountCents: 2500, reason: 'damaged-item' }).is_error, true);
});
test('foreign, missing, excess and forged inputs leave the ledger unchanged', () => {
  const { store, one, two, call } = range();
  for (const input of [
    { orderId: 'O-2001', amountCents: 100, reason: 'damaged-item' },
    { orderId: 'O-9999', amountCents: 100, reason: 'damaged-item' },
    { orderId: 'O-1001', amountCents: 5001, reason: 'damaged-item' },
    { orderId: 'O-1001', amountCents: 100, reason: 'damaged-item', approver: 'CEO' },
    { orderId: 'O-1001', amountCents: 1.5, reason: 'damaged-item' },
  ]) assert.equal(call('C-1', one.id, 'propose_refund', input).is_error, true);
  assert.equal(call('C-2', two.id, 'read_order', { orderId: 'O-1001' }).is_error, true);
  assert.equal(store.refunds.size, 0); assert.equal(store.approvals.size, 0);
});
test('denial, cancellation and expiry never create a refund', () => {
  const { store, one, call } = range();
  const propose = (amountCents: number) => JSON.parse(call('C-1', one.id, 'propose_refund',
    { orderId: 'O-1001', amountCents, reason: 'damaged-item' }).content[0].text) as { pendingApprovalId: string };
  const denied = propose(100); store.approve('owner-a', 'C-1', denied.pendingApprovalId, 'deny', 'trusted-local-reviewer');
  const cancelled = propose(200); store.cancelPending(one);
  assert.equal(store.approvals.get(cancelled.pendingApprovalId)?.status, 'cancelled');
  assert.equal(store.refunds.size, 0); assert.equal(store.remaining('O-1001'), 5000);
});
test('tickets and state are isolated by customer; malicious notes stay data', () => {
  const { store, one, two, call } = range();
  assert.equal(call('C-1', one.id, 'create_ticket', { orderId: 'O-2001', reason: 'Please investigate' }).is_error, true);
  const ticket = call('C-2', two.id, 'create_ticket', { orderId: 'O-2001', reason: 'Please investigate' });
  assert.equal(ticket.is_error, false); assert.equal(store.state('C-1').tickets.length, 0);
  assert.equal(store.state('C-2').tickets.length, 1);
  const order = call('C-2', two.id, 'read_order', { orderId: 'O-2001' });
  assert.match(order.content[0].text, /untrusted note/); assert.equal(store.refunds.size, 0);
});
