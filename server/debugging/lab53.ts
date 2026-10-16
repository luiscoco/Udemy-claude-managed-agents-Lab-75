import { randomUUID } from 'node:crypto';
import type { BetaManagedAgentsStreamSessionEvents } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { createEventConsumer } from '../lib/session-events.js';
import { CapstoneStore } from '../capstone/store.js';
import { capstoneToolDefinitions, handleCapstoneTool } from '../capstone/tools.js';
import { lab50SummarySchema } from '../../shared/lab50-capstone.js';
import { lab53ResultSchema, lab53ScenarioSchema } from '../../shared/lab53-debugging.js';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab53ScenarioSchema>;
type Result = z.infer<typeof lab53ResultSchema>;
const at = '2026-10-16T12:00:00Z';
const eventId = () => `sevt_trace_${randomUUID().replaceAll('-', '')}`;
const message = (text: string, threadId: string): BetaManagedAgentsStreamSessionEvents => ({
  type: 'agent.message', id: eventId(), processed_at: at, session_thread_id: threadId,
  content: [{ type: 'text', text }] } as BetaManagedAgentsStreamSessionEvents);
const idle = (reason: 'end_turn' | 'requires_action', pending: string[] = []): BetaManagedAgentsStreamSessionEvents => ({
  type: 'session.status_idle', id: eventId(), processed_at: at, stop_details: null,
  stop_reason: reason === 'end_turn' ? { type: 'end_turn' } : { type: 'requires_action', event_ids: pending } });
const eventName = (event: BetaManagedAgentsStreamSessionEvents) => event.type;
export class Lab53TraceStore {
  private owners = new Map<string, Map<string, Result>>();
  private space(owner: string) { let space = this.owners.get(owner); if (!space) {
    if (this.owners.size >= 12) throw new Error('Trace owner capacity reached.');
    space = new Map(); this.owners.set(owner, space); } return space; }
  facts() { return { source: 'offline-authored-trace', providerCalls: 0, maxOwners: 12, maxRunsPerOwner: 10,
    maxTraceEntries: 40, tools: capstoneToolDefinitions.map(tool => tool.name),
    note: 'Redacted event summaries and host effects are distinct; EOF never proves remote completion.' }; }
  get(owner: string, id: string) { const result = this.space(owner).get(id);
    if (!result) throw new Error('Trace run unavailable for this owner.'); return result; }
  run(owner: string, scenario: Scenario): Result {
    const space = this.space(owner); if (space.size >= 10) throw new Error('Trace run capacity reached.');
    const id = randomUUID(), localRunId = `run_${id}`, remoteSessionId = `sesn_fixture_${randomUUID().replaceAll('-', '')}`;
    const threadId = 'thread_support', store = new CapstoneStore(), conversation = store.createConversation(owner, 'C-1', remoteSessionId);
    const trace: Result['trace'] = [], events: BetaManagedAgentsStreamSessionEvents[] = [];
    const add = (kind: Result['trace'][number]['kind'], id: string, summary: string, thread: string | null = null) => {
      if (trace.length >= 40) throw new Error('Trace entry bound exceeded.');
      trace.push({ sequence: trace.length + 1, kind, id, threadId: thread, summary }); return trace.length; };
    const push = (event: BetaManagedAgentsStreamSessionEvents) => {
      events.push(event); add('event', 'id' in event ? event.id : 'delta', eventName(event),
        'session_thread_id' in event && typeof event.session_thread_id === 'string' ? event.session_thread_id : null); };
    let firstUsefulSequence = 1, cause = 'Confirmed completion with a host-verified refund.', reportValid: boolean | null = null;
    let historyGap = false, remoteStop: Result['remoteStop'] = 'unconfirmed', cleanup: Result['cleanup'] = 'not-needed';
    if (scenario === 'valid-control' || scenario === 'denied-tool') {
      const customerId = scenario === 'denied-tool' ? 'C-2' as const : 'C-1' as const;
      const owned = scenario === 'denied-tool' ? store.createConversation(owner, customerId, remoteSessionId) : conversation;
      const useId = eventId(); push({ type: 'agent.custom_tool_use', id: useId, processed_at: at,
        session_thread_id: threadId, name: 'propose_refund', input: { orderId: 'O-1001', amountCents: 5000, reason: 'damaged-item' } } as BetaManagedAgentsStreamSessionEvents);
      const response = handleCapstoneTool(store, { owner, customerId, conversationId: owned.id },
        { id: useId, name: 'propose_refund', input: { orderId: 'O-1001', amountCents: 5000, reason: 'damaged-item' } });
      firstUsefulSequence = add('host-decision', useId, response.is_error ? 'Customer ownership rejected the refund proposal.' :
        'Closed tool input and policy accepted a proposal; trusted approval is still required.', threadId);
      if (!response.is_error) { const parsed = JSON.parse(response.content[0].text) as { pendingApprovalId: string };
        const decision = store.approve(owner, customerId, parsed.pendingApprovalId, 'approve', 'trusted-trace-reviewer');
        add('effect', decision.refund!.id, 'Host ledger issued one approved 5000-cent refund.'); }
      if (scenario === 'denied-tool') { cause = 'The first host decision denied a foreign-customer order; no refund effect followed.';
        push(idle('requires_action', [useId])); remoteStop = 'confirmed-idle'; }
      else { push(message(JSON.stringify({ caseStatus: 'resolved', summary: 'Host issued an approved refund.' }), threadId));
        push(idle('end_turn')); remoteStop = 'confirmed-idle'; cleanup = 'archived'; reportValid = true; }
    } else if (scenario === 'malformed-report') {
      const text = '{"caseStatus":"resolved","summary":"Refund sent","refundId":"invented"}';
      push(message(text, threadId)); push(idle('end_turn')); remoteStop = 'confirmed-idle';
      reportValid = lab50SummarySchema.safeParse(JSON.parse(text)).success;
      firstUsefulSequence = add('host-decision', eventId(), 'Closed final-report schema rejected the extra refundId field.');
      cause = 'The turn reached idle, but final JSON failed host schema validation.';
    } else if (scenario === 'missing-idle' || scenario === 'stream-eof') {
      if (scenario === 'missing-idle') push(message('{"caseStatus":"answered","summary":"Draft only."}', threadId));
      firstUsefulSequence = add('transport', eventId(), scenario === 'missing-idle' ?
        'History ended without session.status_idle; a final-looking message is insufficient.' :
        'The stream closed before an idle event or authoritative final report.');
      historyGap = true; cause = scenario === 'missing-idle' ? 'Missing idle event prevents completion confirmation.' :
        'Stream EOF gives no remote completion or failure verdict.';
    } else if (scenario === 'local-turn-limit') {
      push({ type: 'session.status_running', id: eventId(), processed_at: at } as BetaManagedAgentsStreamSessionEvents);
      push(message('Still working.', threadId));
      firstUsefulSequence = add('host-decision', eventId(), 'Local two-turn limit reached before a terminal idle event.');
      cause = 'The host turn limit stopped local consumption; remote state remains unknown.'; historyGap = true;
    } else {
      push({ type: 'session.status_running', id: eventId(), processed_at: at } as BetaManagedAgentsStreamSessionEvents);
      firstUsefulSequence = add('cleanup', eventId(), 'Local interrupt timed out; no idle acknowledgment or archive confirmation.');
      cause = 'Cleanup timeout leaves the remote stop unconfirmed.'; cleanup = 'pending'; historyGap = true;
    }
    const first = createEventConsumer(); for (const event of events) first.push(event);
    const eventOutcome = first.finish().kind, second = createEventConsumer();
    for (const event of events) second.push(event); const replayOutcome = second.finish().kind;
    const recordedEffects = trace.filter(entry => entry.kind === 'effect').length;
    const result = lab53ResultSchema.parse({ id, source: 'offline-authored-trace', scenario, localRunId, remoteSessionId,
      resolvedConfig: { agentVersion: null, tools: capstoneToolDefinitions.map(tool => tool.name),
        builtins: false, mcp: false, skills: false }, trace, firstUsefulSequence, cause, historyGap,
      eventOutcome, reportValid, remoteStop, cleanup, refundLedgerCount: store.refunds.size,
      replay: { outcome: replayOutcome, authoritativeMessages: second.snapshot().messages.length,
        effectsMatch: recordedEffects === store.refunds.size }, providerCalls: 0 });
    space.set(id, result); return result;
  }
}
