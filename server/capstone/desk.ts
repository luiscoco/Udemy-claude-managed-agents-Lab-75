import { createEventConsumer } from '../lib/session-events.js';
import { setTimeout as delay } from 'node:timers/promises';
import type { BetaManagedAgentsStreamSessionEvents } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { lab50SnapshotSchema, lab50SummarySchema } from '../../shared/lab50-capstone.js';
import type { CapstoneSessionPort } from './agent.js';
import { createLiveCapstonePort, ScriptedCapstonePort } from './agent.js';
import { CapstoneError, CapstoneStore, cleanNote } from './store.js';
import type { Conversation, CustomerId } from './store.js';
import { handleCapstoneTool } from './tools.js';
import { ScriptedPolicyExpert } from './policy-expert.js';

type OwnerSpace = { store: CapstoneStore; fixture: ScriptedCapstonePort; ports: Map<string, CapstoneSessionPort>;
  pendingCalls: Map<string, string>; active: Set<string>; controllers: Map<string, AbortController>; policyExpert: ScriptedPolicyExpert };
const maxOwners = 12, maxConversations = 8, maxEventsPerTurn = 100;
export class CapstoneDesk {
  private spaces = new Map<string, OwnerSpace>(); private closed = false;
  constructor(private liveFactory: () => CapstoneSessionPort = () => createLiveCapstonePort(),
    private fixtureFactory: () => ScriptedCapstonePort = () => new ScriptedCapstonePort()) {}
  private space(owner: string) { if (this.closed) throw new CapstoneError(503, 'Support desk is closed.');
    let space = this.spaces.get(owner); if (!space) { if (this.spaces.size >= maxOwners) throw new CapstoneError(429, 'Desk owner capacity reached.');
      space = { store: new CapstoneStore(), fixture: this.fixtureFactory(), ports: new Map(), pendingCalls: new Map(), active: new Set(),
        controllers: new Map(),
        policyExpert: new ScriptedPolicyExpert() };
      this.spaces.set(owner, space); } return space; }
  facts() { return { source: 'local-support-desk', customers: ['C-1', 'C-2'],
    tools: ['list_orders', 'read_order', 'search_policy', 'create_ticket', 'propose_refund'],
    liveRequires: ['MANAGED_LAB50_LIVE_ENABLED=true', 'CLAUDE_MANAGED_LAB50_AGENT_ID', 'CLAUDE_MANAGED_LAB50_AGENT_VERSION'],
    reviewer: 'trusted-local-reviewer (server-assigned)', maxConversations, maxEventsPerTurn,
    note: 'Host store and approval decide effects; model prose is not authority.' }; }
  state(owner: string, customerId: CustomerId) { return this.space(owner).store.state(customerId); }
  private snapshot(space: OwnerSpace, conversation: Conversation, note = 'Host state is authoritative.') {
    const pending = conversation.pendingApprovalId ? space.store.approvals.get(conversation.pendingApprovalId) : null;
    const latest = [...conversation.messages].reverse().find(message => message.role === 'agent');
    let summary = null; if (latest) { try { summary = lab50SummarySchema.parse(JSON.parse(latest.text)); } catch {} }
    return lab50SnapshotSchema.parse({ source: conversation.source, customerId: conversation.customerId,
      conversationId: conversation.id, sessionId: conversation.sessionId, status: conversation.status,
      messages: conversation.messages.slice(-40), summary,
      pendingApproval: pending ? { id: pending.id, orderId: pending.orderId, amountCents: pending.amountCents, status: pending.status } : null,
      rawEvents: conversation.rawEvents.slice(-100), usage: conversation.usage,
      policyExpert: { sessionId: space.policyExpert.sessionId, allowedTools: space.policyExpert.allowedTools,
        usage: space.policyExpert.usage, lastResult: space.policyExpert.lastResult },
      cleanup: conversation.status === 'closed' ? 'archived' : conversation.status === 'cleanup-pending' ? 'pending' : 'not-needed',
      providerCalls: conversation.source === 'authored-fixture' ? 0 : null, note }); }
  async conversation(owner: string, customerId: CustomerId, conversationId: string) {
    const space = this.space(owner), conversation = space.store.conversation(owner, customerId, conversationId);
    const port = space.ports.get(conversation.id);
    if (port && conversation.status !== 'closed') await this.hydrate(space, conversation, port);
    return this.snapshot(space, conversation); }
  private remember(conversation: Conversation, event: BetaManagedAgentsStreamSessionEvents) {
    if (!('id' in event)) return true;
    if (conversation.seenEvents.includes(event.id)) return false;
    conversation.seenEvents.push(event.id); if (conversation.seenEvents.length > 200) conversation.seenEvents.shift();
    const threadId = 'session_thread_id' in event && typeof event.session_thread_id === 'string' ? event.session_thread_id : null;
    conversation.rawEvents.push({ id: event.id, type: event.type, threadId });
    if (conversation.rawEvents.length > 100) conversation.rawEvents.shift(); return true;
  }
  private async hydrate(_space: OwnerSpace, conversation: Conversation, port: CapstoneSessionPort) {
    for (const event of (await port.history(conversation.sessionId)).slice(-200)) {
      if (!this.remember(conversation, event)) continue;
      if (event.type === 'agent.message') {
        const text = event.content.filter(block => block.type === 'text').map(block => block.text).join('\n').slice(0, 1000);
        conversation.messages.push({ id: event.id, role: 'agent', text }); }
    }
    if (conversation.messages.length > 40) conversation.messages.splice(0, conversation.messages.length - 40);
  }
  private async consume(space: OwnerSpace, conversation: Conversation, port: CapstoneSessionPort, signal: AbortSignal,
    depth = 0, suppliedStream?: AsyncIterable<BetaManagedAgentsStreamSessionEvents>): Promise<void> {
    if (depth >= 8) throw new CapstoneError(429, 'Tool round limit reached.');
    const consumer = createEventConsumer(), pending = new Map<string, { name: string; input: unknown }>();
    const stream = suppliedStream ?? await port.open(conversation.sessionId, signal); let count = 0, idle: 'end_turn' | 'requires_action' | null = null;
    for await (const event of stream) {
      signal.throwIfAborted(); if (++count > maxEventsPerTurn) throw new CapstoneError(429, 'Event limit reached.');
      consumer.push(event); if (!this.remember(conversation, event)) continue;
      if (event.type === 'agent.custom_tool_use') pending.set(event.id, { name: event.name, input: event.input });
      if (event.type === 'agent.message') {
        const text = event.content.filter(block => block.type === 'text').map(block => block.text).join('\n').slice(0, 1000);
        conversation.messages.push({ id: event.id, role: 'agent', text }); }
      if (event.type === 'span.model_request_end') {
        const prior = conversation.usage ?? { inputTokens: 0, outputTokens: 0 };
        conversation.usage = { inputTokens: prior.inputTokens + event.model_usage.input_tokens,
          outputTokens: prior.outputTokens + event.model_usage.output_tokens }; }
      if (event.type === 'session.status_idle') {
        idle = event.stop_reason.type === 'requires_action' ? 'requires_action' : event.stop_reason.type === 'end_turn' ? 'end_turn' : null;
        if (event.stop_reason.type === 'requires_action') {
          for (const useId of event.stop_reason.event_ids) if (!pending.has(useId)) throw new CapstoneError(409, 'Pending tool event was not observed.'); }
        break;
      }
    }
    if (conversation.messages.length > 40) conversation.messages.splice(0, conversation.messages.length - 40);
    if (idle === 'end_turn') { conversation.status = 'idle'; return; }
    if (idle !== 'requires_action') throw new CapstoneError(409, 'Turn ended without confirmed idle.');
    if (pending.size !== 1) throw new CapstoneError(409, 'The host accepts one correlated custom-tool call per pause.');
    for (const [useId, call] of pending) {
      const result = handleCapstoneTool(space.store, { owner: conversation.owner, customerId: conversation.customerId,
        conversationId: conversation.id }, { id: useId, name: call.name, input: call.input });
      const text = result.content[0].text; let approvalId: string | null = null;
      try { const parsed = JSON.parse(text) as { pendingApprovalId?: unknown }; if (typeof parsed.pendingApprovalId === 'string') approvalId = parsed.pendingApprovalId; } catch {}
      if (approvalId && conversation.pendingApprovalId === approvalId) {
        space.pendingCalls.set(approvalId, useId); conversation.status = 'waiting-approval'; return; }
      // Open the next stream before returning the custom-tool result so its continuation cannot be missed.
      const continuation = await port.open(conversation.sessionId, signal);
      await port.respond(conversation.sessionId, useId, text, result.is_error, signal);
      await this.consume(space, conversation, port, signal, depth + 1, continuation);
    }
  }
  async chat(owner: string, customerId: CustomerId, mode: 'scripted' | 'live', conversationId: string | null, message: string, signal: AbortSignal) {
    const space = this.space(owner); if (space.active.size >= 2) throw new CapstoneError(429, 'Desk concurrency limit reached.');
    if (signal.aborted) throw new CapstoneError(499, 'Local request cancelled before session creation.');
    const reservation = `creating_${crypto.randomUUID()}`; if (!conversationId) space.active.add(reservation);
    let conversation: Conversation, port: CapstoneSessionPort;
    try { if (conversationId) { conversation = space.store.conversation(owner, customerId, conversationId);
      if (space.active.has(conversation.id)) throw new CapstoneError(409, 'Conversation already has an active turn.');
      port = space.ports.get(conversation.id)!; if (!port || conversation.source !== (mode === 'live' ? 'managed-api' : 'authored-fixture'))
        throw new CapstoneError(409, 'Conversation mode or port changed.');
      if (conversation.status !== 'idle') throw new CapstoneError(409, 'Resolve approval or cleanup before another message.');
      if (conversation.messages.filter(item => item.role === 'customer').length >= 20) throw new CapstoneError(429, 'Message limit reached.');
      await this.hydrate(space, conversation, port);
    } else { if (space.store.conversations.size >= maxConversations) throw new CapstoneError(429, 'Close or reset a conversation first.');
      port = mode === 'live' ? this.liveFactory() : space.fixture;
      const session = await port.create(); if (signal.aborted) { await port.archive(session.id).catch(() => {});
        throw new CapstoneError(499, 'Local request cancelled after session creation; cleanup requested.'); }
      conversation = space.store.createConversation(owner, customerId, session.id, port.source);
      space.ports.set(conversation.id, port); }
    } finally { space.active.delete(reservation); }
    space.active.add(conversation.id);
    const local = new AbortController(); space.controllers.set(conversation.id, local);
    const deadline = AbortSignal.timeout(8000), combined = AbortSignal.any([signal, deadline, local.signal]);
    try {
      if (/\bpolicy\b/i.test(message)) space.policyExpert.call(space.store,
        { owner, customerId, conversationId: conversation.id }, 'search_policy', { topic: 'damaged-items' });
      const stream = await port.open(conversation.sessionId, combined);
      conversation.messages.push({ id: `local_${conversation.messages.length}`, role: 'customer', text: cleanNote(message) });
      await port.send(conversation.sessionId, message, combined);
      await this.consume(space, conversation, port, combined, 0, stream);
      return this.snapshot(space, conversation);
    } catch (error) {
      if (conversation.status === 'closed') return this.snapshot(space, conversation, 'Conversation closed while the turn was stopping.');
      space.store.cancelPending(conversation); let confirmed = false;
      try { await port.interrupt(conversation.sessionId); confirmed = (await port.status(conversation.sessionId)) === 'idle'; } catch {}
      conversation.status = confirmed ? 'idle' : 'cleanup-pending';
      return this.snapshot(space, conversation, combined.aborted ? 'Local turn stopped; remote stop requires idle confirmation.' :
        error instanceof CapstoneError ? error.message : 'Turn failed; inspect host evidence.');
    } finally { space.active.delete(conversation.id); space.controllers.delete(conversation.id); }
  }
  async decide(owner: string, customerId: CustomerId, conversationId: string, approvalId: string,
    decision: 'approve' | 'deny', signal: AbortSignal) {
    const space = this.space(owner), conversation = space.store.conversation(owner, customerId, conversationId);
    if (conversation.status !== 'waiting-approval' || conversation.pendingApprovalId !== approvalId)
      throw new CapstoneError(409, 'No matching pending approval.');
    const useId = space.pendingCalls.get(approvalId); if (!useId) throw new CapstoneError(409, 'Pending tool event unavailable.');
    const port = space.ports.get(conversation.id)!;
    const action = space.store.approve(owner, customerId, approvalId, decision, 'trusted-local-reviewer');
    space.pendingCalls.delete(approvalId);
    const combined = AbortSignal.any([signal, AbortSignal.timeout(8000)]);
    try { const stream = await port.open(conversation.sessionId, combined);
      await port.respond(conversation.sessionId, useId,
        JSON.stringify(action.refund ? { refundId: action.refund.id, amountCents: action.refund.amountCents } : { denied: true }),
        !action.refund, combined);
      await this.consume(space, conversation, port, combined, 0, stream);
      return this.snapshot(space, conversation, 'Trusted host decision applied once.');
    } catch { conversation.status = 'cleanup-pending'; return this.snapshot(space, conversation,
      'Host decision is recorded; continuation or remote stop is unconfirmed.'); }
  }
  async closeConversation(owner: string, customerId: CustomerId, conversationId: string) {
    const space = this.space(owner), conversation = space.store.conversation(owner, customerId, conversationId);
    if (conversation.status === 'closed') return this.snapshot(space, conversation);
    space.controllers.get(conversation.id)?.abort('close');
    for (let attempt = 0; space.active.has(conversation.id) && attempt < 100; attempt++) await delay(20);
    if (space.active.has(conversation.id)) { conversation.status = 'cleanup-pending';
      return this.snapshot(space, conversation, 'Active turn has not stopped; remote cleanup remains pending.'); }
    space.store.cancelPending(conversation); const port = space.ports.get(conversation.id)!;
    let idle = false; try { idle = (await port.status(conversation.sessionId)) === 'idle';
      if (!idle) { await port.interrupt(conversation.sessionId); idle = (await port.status(conversation.sessionId)) === 'idle'; } } catch {}
    if (idle) { try { await port.archive(conversation.sessionId); conversation.status = 'closed'; }
      catch { conversation.status = 'cleanup-pending'; } } else conversation.status = 'cleanup-pending';
    space.store.audit(customerId, 'conversation-close', `${conversation.id}: ${conversation.status}`);
    return this.snapshot(space, conversation); }
  async reset(owner: string) { const space = this.space(owner);
    if (space.active.size) throw new CapstoneError(409, 'Wait for active work to stop before reset.');
    for (const conversation of space.store.conversations.values()) if (conversation.status !== 'closed')
      await this.closeConversation(owner, conversation.customerId, conversation.id);
    if ([...space.store.conversations.values()].some(conversation => conversation.status === 'cleanup-pending'))
      throw new CapstoneError(409, 'Remote cleanup is pending; reset refused.');
    space.store.reset(); space.ports.clear(); space.pendingCalls.clear(); space.fixture = this.fixtureFactory();
    space.policyExpert = new ScriptedPolicyExpert(); return { reset: true, source: 'local-fixture', providerCalls: 0 }; }
  async close() { for (const [owner, space] of this.spaces)
    for (const conversation of space.store.conversations.values()) if (conversation.status !== 'closed')
      await this.closeConversation(owner, conversation.customerId, conversation.id).catch(() => {});
    this.closed = true; }
}
