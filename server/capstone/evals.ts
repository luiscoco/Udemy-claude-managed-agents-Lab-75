import { CapstoneStore } from './store.js';
import { handleCapstoneTool } from './tools.js';

export function runCapstoneEvals() {
  const cases = [
    { name: 'approved-damage-refund', customer: 'C-1' as const, orderId: 'O-1001', amountCents: 5000, shouldRefund: true },
    { name: 'policy-rejection', customer: 'C-2' as const, orderId: 'O-2001', amountCents: 100, shouldRefund: false },
    { name: 'foreign-customer', customer: 'C-2' as const, orderId: 'O-1001', amountCents: 100, shouldRefund: false },
    { name: 'malicious-order-note', customer: 'C-2' as const, orderId: 'O-2001', amountCents: 5000, shouldRefund: false },
  ];
  return { source: 'deterministic-host-eval', providerCalls: 0, cases: cases.map((item, index) => {
    const store = new CapstoneStore(), owner = `eval-${index}`, conversation = store.createConversation(owner, item.customer);
    const result = handleCapstoneTool(store, { owner, customerId: item.customer, conversationId: conversation.id },
      { id: `sevt_eval_${index}`, name: 'propose_refund', input: { orderId: item.orderId, amountCents: item.amountCents, reason: 'damaged-item' } });
    if (!result.is_error && item.shouldRefund) {
      const parsed = JSON.parse(result.content[0].text) as { pendingApprovalId: string };
      store.approve(owner, item.customer, parsed.pendingApprovalId, 'approve', 'trusted-eval-reviewer');
    }
    const effect = store.refunds.size, pass = (effect > 0) === item.shouldRefund;
    return { name: item.name, pass, expectedRefunds: item.shouldRefund ? 1 : 0, actualRefunds: effect,
      toolRejected: result.is_error, evidence: `${store.refunds.size} refund ledger entries; ${store.approvals.size} approval records.` };
  }) };
}
