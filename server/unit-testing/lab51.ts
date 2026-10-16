import type { BetaManagedAgentsStreamSessionEvents } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { createEventConsumer } from '../lib/session-events.js';
import { CapstoneDesk } from '../capstone/desk.js';
import { ScriptedCapstonePort } from '../capstone/agent.js';
import { CapstoneStore } from '../capstone/store.js';
import { eligibleDamageRefund, handleCapstoneTool } from '../capstone/tools.js';
import { lab50SummarySchema } from '../../shared/lab50-capstone.js';
import { lab51ResultSchema, lab51ScenarioSchema } from '../../shared/lab51-unit-testing.js';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab51ScenarioSchema>;
type Assertion = z.infer<typeof lab51ResultSchema>['assertions'][number];
const signal = () => new AbortController().signal;
const check = (name: string, pass: boolean, expected: string, observed: string, evidence: string,
  expectedFailure = false): Assertion => ({ name, pass, expected, observed, evidence, expectedFailure });
const tool = (store: CapstoneStore, owner: string, customerId: 'C-1' | 'C-2', conversationId: string,
  id: string, name: string, input: unknown) => handleCapstoneTool(store, { owner, customerId, conversationId }, { id, name, input });

export async function runLab51Scenario(scenario: Scenario, requestSignal: AbortSignal = signal()) {
  const assertions: Assertion[] = [];
  const cases: Exclude<Scenario, 'all'>[] = scenario === 'all' ? [
    'malformed-order', 'foreign-order', 'denial', 'cancellation', 'missing-terminal', 'child-thread',
    'duplicate-events', 'invalid-report', 'retained-session', 'policy-mutation'] : [scenario];
  for (const item of cases) {
    requestSignal.throwIfAborted();
    if (item === 'malformed-order' || item === 'foreign-order') {
      const store = new CapstoneStore(), owner = 'unit-owner', customerId = item === 'foreign-order' ? 'C-2' : 'C-1';
      const conversation = store.createConversation(owner, customerId);
      const input = item === 'foreign-order' ? { orderId: 'O-1001', amountCents: 100, reason: 'damaged-item' } :
        { orderId: 'O-1001', amountCents: '100', reason: 'damaged-item', customerId: 'C-2' };
      const result = tool(store, owner, customerId, conversation.id, `sevt_${item.replace('-', '_')}`, 'propose_refund', input);
      assertions.push(check(item, result.is_error && store.approvals.size === 0 && store.refunds.size === 0,
        'host error, zero approvals and refunds', `is_error=${result.is_error}; approvals=${store.approvals.size}; refunds=${store.refunds.size}`,
        result.content[0].text));
    } else if (item === 'denial' || item === 'cancellation') {
      const desk = new CapstoneDesk();
      try { const first = await desk.chat('unit-owner', 'C-1', 'scripted', null, 'Refund 25 for O-1001', requestSignal);
        if (item === 'denial') await desk.decide('unit-owner', 'C-1', first.conversationId, first.pendingApproval!.id, 'deny', requestSignal);
        else await desk.closeConversation('unit-owner', 'C-1', first.conversationId);
        const state = desk.state('unit-owner', 'C-1');
        assertions.push(check(item, first.status === 'waiting-approval' && state.refunds.length === 0 &&
          state.approvals[0]?.status === (item === 'denial' ? 'denied' : 'cancelled'),
          `${item} leaves no refund`, `approvals=${state.approvals[0]?.status}; refunds=${state.refunds.length}`,
          `session=${first.sessionId}; custom tool=${first.rawEvents.find(event => event.type === 'agent.custom_tool_use')?.id ?? 'missing'}`));
      } finally { await desk.close(); }
    } else if (item === 'missing-terminal') {
      class NoIdle extends ScriptedCapstonePort { override async open(_id: string, _signal: AbortSignal) {
        return (async function* () {})(); } }
      const desk = new CapstoneDesk(() => new NoIdle());
      try { const outcome = await desk.chat('unit-owner', 'C-1', 'live', null, 'Refund 25 for O-1001', requestSignal);
        assertions.push(check(item, outcome.summary === null && desk.state('unit-owner', 'C-1').refunds.length === 0 &&
          /confirmed idle/.test(outcome.note), 'incomplete, no refund', `${outcome.status}; summary=${outcome.summary}`,
          `injected port, no network; ${outcome.note}`));
      } finally { await desk.close(); }
    } else if (item === 'child-thread' || item === 'duplicate-events') {
      assertions.push(...replayLab51(item));
    } else if (item === 'invalid-report') {
      const invalid = lab50SummarySchema.safeParse({ caseStatus: 'resolved', summary: 'Refund sent', refundId: 'invented' });
      assertions.push(check(item, !invalid.success, 'closed report rejected', invalid.success ? 'accepted' : 'rejected',
        'Lab 50 final-report schema has no refundId field.'));
    } else if (item === 'retained-session') {
      const desk = new CapstoneDesk();
      try { const first = await desk.chat('unit-owner', 'C-1', 'scripted', null, 'Show order O-1001', requestSignal);
        const second = await desk.chat('unit-owner', 'C-1', 'scripted', first.conversationId, 'Show order O-1001', requestSignal);
        const foreign = await desk.conversation('different-owner', 'C-1', first.conversationId).then(() => false, () => true);
        assertions.push(check(item, first.sessionId === second.sessionId && foreign &&
          second.messages.filter(message => message.role === 'agent').length === 2,
          'same session, two authoritative responses, foreign owner refused',
          `session=${second.sessionId}; agent messages=${second.messages.filter(message => message.role === 'agent').length}; foreign refused=${foreign}`,
          `conversation=${first.conversationId}; persisted IDs=${second.rawEvents.filter(event => event.type === 'agent.message').map(event => event.id).join(',')}`));
      } finally { await desk.close(); }
    } else if (item === 'policy-mutation') {
      const now = Date.parse('2026-11-11T12:00:00Z'), store = new CapstoneStore(() => now);
      const conversation = store.createConversation('unit-owner', 'C-1');
      const real = tool(store, 'unit-owner', 'C-1', conversation.id, 'sevt_real_policy', 'propose_refund',
        { orderId: 'O-1001', amountCents: 100, reason: 'damaged-item' });
      const order = store.order('C-1', 'O-1001');
      const mutatedAllows = eligibleDamageRefund(order, now, 60);
      assertions.push(check('real-policy-window', real.is_error && store.approvals.size === 0,
        '31-day-old order rejected by 30-day rule', `is_error=${real.is_error}; approvals=${store.approvals.size}`,
        real.content[0].text));
      assertions.push(check('mutated-policy-window', !mutatedAllows, '31-day-old order rejected',
        mutatedAllows ? '60-day mutation would allow' : 'mutation rejected',
        'The deliberate max-age mutation changes 30 days to 60 under the same virtual clock.', true));
    }
  }
  requestSignal.throwIfAborted();
  return lab51ResultSchema.parse({ source: 'offline-injected-host', scenario, providerCalls: 0, assertions,
    pass: assertions.every(assertion => assertion.pass || assertion.expectedFailure),
    mutationDetected: cases.includes('policy-mutation') ? assertions.some(assertion => assertion.expectedFailure && !assertion.pass) : null });
}

export function replayLab51(scenario: 'child-thread' | 'duplicate-events' | 'missing-terminal'): Assertion[] {
  const consumer = createEventConsumer(), at = '2026-10-16T12:00:00Z';
  const messageId = 'sevt_replay_message';
  const message = { type: 'agent.message', id: messageId, processed_at: at,
    session_thread_id: scenario === 'child-thread' ? 'thread_policy' : undefined,
    content: [{ type: 'text', text: '{"caseStatus":"answered","summary":"Order read."}' }] } as BetaManagedAgentsStreamSessionEvents;
  const events: BetaManagedAgentsStreamSessionEvents[] = scenario === 'missing-terminal' ? [message] :
    scenario === 'duplicate-events' ? [
      { type: 'event_start', event: { type: 'agent.message', id: messageId } } as BetaManagedAgentsStreamSessionEvents,
      { type: 'event_delta', event_id: messageId, delta: { type: 'content_delta', index: 0,
        content: { type: 'text', text: 'preview' } } } as BetaManagedAgentsStreamSessionEvents,
      message, message,
      { type: 'session.status_idle', id: 'sevt_replay_idle', processed_at: at, stop_details: null,
        stop_reason: { type: 'end_turn' } } as BetaManagedAgentsStreamSessionEvents] : [message,
      { type: 'session.status_idle', id: 'sevt_replay_idle', processed_at: at, stop_details: null,
        stop_reason: { type: 'end_turn' } } as BetaManagedAgentsStreamSessionEvents];
  for (const event of events) consumer.push(event);
  const outcome = consumer.finish(), snapshot = consumer.snapshot();
  const pass = scenario === 'missing-terminal' ? outcome.kind === 'incomplete' :
    outcome.kind === 'completed' && snapshot.messages.length === 1 &&
    (scenario !== 'duplicate-events' || snapshot.duplicatesIgnored === 1 && snapshot.previews[0]?.state === 'replaced');
  return [check(scenario, pass, scenario === 'missing-terminal' ? 'incomplete EOF' : 'one authoritative message and completed idle',
    `${outcome.kind}; messages=${snapshot.messages.length}; duplicates=${snapshot.duplicatesIgnored}`,
    scenario === 'child-thread' ? `thread=${'session_thread_id' in message ? message.session_thread_id : 'none'}` :
      `preview=${snapshot.previews[0]?.state ?? 'none'}; persisted event=${messageId}`)];
}
