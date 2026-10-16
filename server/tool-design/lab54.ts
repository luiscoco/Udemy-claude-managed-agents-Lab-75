import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { BetaManagedAgentsCustomToolParams } from '@anthropic-ai/sdk/resources/beta/agents/agents';
import { CapstoneStore } from '../capstone/store.js';
import { handleCapstoneTool } from '../capstone/tools.js';
import { lab54ResultSchema, lab54ScenarioSchema, lab54VariantSchema } from '../../shared/lab54-tool-design.js';

type Variant = z.infer<typeof lab54VariantSchema>;
type Scenario = z.infer<typeof lab54ScenarioSchema>;
const vagueShape = z.strictObject({ orderId: z.string(), amount: z.number(), reason: z.string() });
const explicitShape = z.strictObject({ orderId: z.string().regex(/^O-\d{4}$/),
  amountCents: z.number().int().positive().max(100000), reason: z.literal('damaged-item') });
function definition(name: string, description: string, shape: typeof vagueShape | typeof explicitShape): BetaManagedAgentsCustomToolParams {
  const { $schema: _dialect, ...input_schema } = z.toJSONSchema(shape, { target: 'draft-2020-12', io: 'input' });
  return { type: 'custom', name, description, input_schema: input_schema as BetaManagedAgentsCustomToolParams['input_schema'] };
}
export const lab54Definitions = {
  vague: definition('process_order', 'Handle an order request.', vagueShape),
  explicit: definition('request_damaged_item_refund_review',
    'Request host review for a damaged-item refund on the current customer\'s order. Amount is positive integer USD cents; this never issues money without trusted approval.',
    explicitShape),
} as const;
export function lintToolContract(variant: Variant) {
  const tool = lab54Definitions[variant], properties = tool.input_schema.properties ?? {};
  const issues: string[] = [];
  if (tool.description.length < 100) issues.push('Description omits effect, prerequisite or approval boundary.');
  if ('amount' in properties) issues.push('The amount field has no currency or integer-cent unit in its name.');
  if (!('amountCents' in properties)) issues.push('Positive integer USD cents are not explicit.');
  if (!('orderId' in properties) || !JSON.stringify(properties.orderId).includes('pattern')) issues.push('Order ID pattern is not constrained.');
  if (tool.input_schema.additionalProperties !== false) issues.push('Input schema is not closed.');
  return { tool, issues, hostMetadata: { risk: 'financial', effect: 'pending host approval only',
    idempotency: 'stable business action key, separate from sevt_ event ID',
    nativeAnnotationsAvailable: false }, providerCalls: 0 };
}
const read = (text: string): { pendingApprovalId?: string; actionKey?: string; reused?: boolean } => {
  try { return JSON.parse(text) as { pendingApprovalId?: string; actionKey?: string; reused?: boolean }; }
  catch { return {}; }
};
export function callLab54(variant: Variant, scenario: Scenario) {
  const store = new CapstoneStore(), owner = `workshop-${randomUUID()}`, customerId = 'C-1' as const;
  const conversation = store.createConversation(owner, customerId), steps: z.infer<typeof lab54ResultSchema>['steps'] = [];
  const send = (name: string, input: unknown, recovery: string, conversationId = conversation.id) => {
    const eventId = `sevt_workshop_${randomUUID().replaceAll('-', '')}`;
    const result = handleCapstoneTool(store, { owner, customerId, conversationId }, { id: eventId, name: 'propose_refund', input });
    const text = result.content[0].text, parsed = read(text);
    steps.push({ eventId, name, input, isError: result.is_error, resultText: text,
      actionKey: parsed.actionKey ?? null, effect: `approvals=${store.approvals.size}; refunds=${store.refunds.size}`, recovery });
    return parsed;
  };
  const name = lab54Definitions[variant].name;
  if (scenario === 'invalid-input') send(name, variant === 'vague' ? { orderId: 'O-1001', amount: 50, reason: 'damage' } :
    { orderId: 'O-1001', amountCents: '50.00', reason: 'damaged-item' },
    'Supply amountCents as a positive integer in USD cents and use the closed reason value.');
  if (scenario === 'domain-rejection') send(name, { orderId: 'O-1002', amountCents: 1200, reason: 'damaged-item' },
    'The order is not damaged; explain the policy denial or open a ticket rather than retrying a refund.');
  if (scenario === 'missing-prerequisite') send(name, { orderId: 'O-1001', amountCents: 5000, reason: 'damaged-item' },
    'Start an owned conversation before requesting host review.', 'conv_missing');
  let stableIdempotency: boolean | null = null;
  if (scenario === 'correct-idempotent') {
    if (variant === 'vague') send(name, { orderId: 'O-1001', amount: 50, reason: 'damage' },
      'Use the explicit tool and integer cents; do not infer units from the vague amount.');
    const input = { orderId: 'O-1001', amountCents: 5000, reason: 'damaged-item' };
    const first = send(lab54Definitions.explicit.name, input, 'Wait for trusted host review.');
    const repeated = send(lab54Definitions.explicit.name, input, 'Reuse the pending action key; do not create a second refund.');
    stableIdempotency = Boolean(first.actionKey && first.actionKey === repeated.actionKey && repeated.reused);
    if (first.pendingApprovalId) store.approve(owner, customerId, first.pendingApprovalId, 'approve', 'trusted-workshop-reviewer');
    send(lab54Definitions.explicit.name, input, 'The action was already applied; show the ledger instead of resubmitting.');
    stableIdempotency = stableIdempotency && store.approvals.size === 1 && store.refunds.size === 1;
  }
  return lab54ResultSchema.parse({ source: 'offline-authored-workshop', variant, scenario, toolName: name,
    steps, approvalCount: store.approvals.size, refundCount: store.refunds.size, stableIdempotency,
    providerCalls: 0, note: 'Scripted choices are authored; no model choice frequency or live success score is inferred.' });
}
export function runLab54(variant: Variant) {
  return { source: 'offline-authored-workshop', variant, contract: lintToolContract(variant),
    cases: lab54ScenarioSchema.options.map(scenario => callLab54(variant, scenario)), providerCalls: 0,
    note: 'This is a scripted workshop, not a measured live model comparison.' };
}
