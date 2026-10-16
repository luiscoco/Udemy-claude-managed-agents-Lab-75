import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type Anthropic from '@anthropic-ai/sdk';
import type { BetaManagedAgentsStreamSessionEvents } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { capstoneToolDefinitions } from './tools.js';
import { createManagedClient, managedResourceIds, managedSettings } from '../lib/managed-config.js';
import { CapstoneError } from './store.js';

export interface CapstoneSessionPort {
  readonly source: 'authored-fixture' | 'managed-api';
  create(): Promise<{ id: string; status: string; agentVersion: number }>;
  open(id: string, signal: AbortSignal): Promise<AsyncIterable<BetaManagedAgentsStreamSessionEvents>>;
  send(id: string, prompt: string, signal: AbortSignal): Promise<void>;
  respond(id: string, eventId: string, text: string, isError: boolean, signal: AbortSignal): Promise<void>;
  history(id: string): Promise<BetaManagedAgentsStreamSessionEvents[]>;
  status(id: string): Promise<string>;
  interrupt(id: string): Promise<void>;
  archive(id: string): Promise<void>;
}
type FixtureSession = { id: string; archived: boolean; pending: BetaManagedAgentsStreamSessionEvents[];
  history: BetaManagedAgentsStreamSessionEvents[]; lastTool: string | null };
const at = '2026-10-16T12:00:00Z';
const eventId = () => `sevt_fixture_${randomUUID().replaceAll('-', '')}`;
const statusIdle = (reason: 'end_turn' | 'requires_action', ids: string[] = []): BetaManagedAgentsStreamSessionEvents => ({
  type: 'session.status_idle', id: eventId(), processed_at: at, stop_details: null,
  stop_reason: reason === 'end_turn' ? { type: 'end_turn' } : { type: 'requires_action', event_ids: ids } });
export class ScriptedCapstonePort implements CapstoneSessionPort {
  readonly source = 'authored-fixture' as const; readonly calls: string[] = [];
  private sessions = new Map<string, FixtureSession>();
  private get(id: string) { const session = this.sessions.get(id); if (!session || session.archived) throw new CapstoneError(404, 'Unknown fixture session.'); return session; }
  async create() { const id = `sesn_fixture_${randomUUID().replaceAll('-', '')}`;
    this.sessions.set(id, { id, archived: false, pending: [], history: [], lastTool: null }); this.calls.push(`create:${id}`);
    return { id, status: 'idle', agentVersion: 1 }; }
  async open(id: string, signal: AbortSignal) { const session = this.get(id); this.calls.push(`open:${id}`);
    return (async function* () { for (;;) { signal.throwIfAborted(); const event = session.pending.shift();
      if (event) { await delay(1, undefined, { signal }); yield event; if (event.type === 'session.status_idle') return; }
      else { await delay(2, undefined, { signal }); if (!session.pending.length) return; } } })(); }
  async send(id: string, prompt: string, _signal: AbortSignal) {
    const session = this.get(id); this.calls.push(`send:${id}`);
    const orderId = /O-\d{4}/i.exec(prompt)?.[0]?.toUpperCase() ?? 'O-1001';
    const amountCents = /(?:\$|refund\s+)(\d{1,5})(?:\.([0-9]{2}))?/i.exec(prompt);
    const cents = amountCents ? Number(amountCents[1]) * 100 + Number(amountCents[2] ?? 0) : 5000;
    const lower = prompt.toLowerCase();
    const name = lower.includes('ticket') ? 'create_ticket' : lower.includes('policy') ? 'search_policy' :
      lower.includes('refund') ? 'propose_refund' : lower.includes('order') ? 'read_order' : 'list_orders';
    const input = name === 'create_ticket' ? { orderId, reason: 'Customer requests investigation.' } :
      name === 'search_policy' ? { topic: 'damaged-items' } : name === 'propose_refund' ?
        { orderId, amountCents: cents, reason: 'damaged-item' } : name === 'read_order' ? { orderId } : {};
    const idOfUse = eventId(); session.lastTool = name;
    const user = { type: 'user.message' as const, id: eventId(), processed_at: at,
      content: [{ type: 'text' as const, text: prompt }] };
    const use = { type: 'agent.custom_tool_use' as const, id: idOfUse, processed_at: at, name, input };
    const idle = statusIdle('requires_action', [idOfUse]);
    session.history.push(user, use, idle); session.pending.push(use, idle);
  }
  async respond(id: string, useId: string, text: string, isError: boolean, _signal: AbortSignal) {
    const session = this.get(id); this.calls.push(`respond:${useId}`);
    const result = { type: 'user.custom_tool_result' as const, id: eventId(), processed_at: at,
      custom_tool_use_id: useId, content: [{ type: 'text' as const, text }], is_error: isError };
    const summary = { caseStatus: isError ? 'rejected' : session.lastTool === 'propose_refund' ? 'resolved' : 'answered',
      summary: isError ? 'The host denied this request.' : session.lastTool === 'propose_refund' ?
        'The refund request received a trusted host decision.' : 'The host tool returned verified customer-owned data.' };
    const message = { type: 'agent.message' as const, id: eventId(), processed_at: at,
      content: [{ type: 'text' as const, text: JSON.stringify(summary) }] };
    const idle = statusIdle('end_turn'); session.history.push(result, message, idle); session.pending.push(message, idle);
  }
  async history(id: string) { return [...this.get(id).history].slice(-200); }
  async status(id: string) { return this.get(id).archived ? 'archived' : 'idle'; }
  async interrupt(id: string) { this.calls.push(`interrupt:${id}`); this.get(id); }
  async archive(id: string) { this.calls.push(`archive:${id}`); this.get(id).archived = true; }
}

type ToolLike = { type: string; name?: string; input_schema?: { properties?: Record<string, unknown> | null; required?: string[] | null; additionalProperties?: unknown } };
export function capstoneToolMismatch(tools: readonly ToolLike[]) {
  const shape = (tool: ToolLike) => JSON.stringify({ type: tool.type, name: tool.name,
    properties: Object.keys(tool.input_schema?.properties ?? {}).sort(), required: [...(tool.input_schema?.required ?? [])].sort(),
    closed: tool.input_schema?.additionalProperties === false });
  return JSON.stringify(tools.map(shape).sort()) !== JSON.stringify(capstoneToolDefinitions.map(shape).sort());
}
export function createLiveCapstonePort(sdk?: Anthropic, env = process.env): CapstoneSessionPort {
  const settings = managedSettings(env), id = env.CLAUDE_MANAGED_LAB50_AGENT_ID?.trim();
  const version = Number(env.CLAUDE_MANAGED_LAB50_AGENT_VERSION);
  if (!settings.liveReady || env.MANAGED_LAB50_LIVE_ENABLED !== 'true' || !id || !Number.isSafeInteger(version) || version < 1)
    throw new CapstoneError(422, 'Lab 50 live mode needs its dedicated agent ID, positive pinned version and explicit opt-in.');
  const client = sdk ?? createManagedClient(env), sessions = client.beta.sessions, ids = managedResourceIds(env);
  return { source: 'managed-api',
    async create() {
      const agent = await client.beta.agents.retrieve(id, { version }, { timeout: 3000 });
      if (agent.archived_at || agent.version !== version || agent.mcp_servers.length || agent.skills.length || agent.multiagent || capstoneToolMismatch(agent.tools))
        throw new CapstoneError(422, 'Pinned desk agent has the wrong version or capabilities; no session created.');
      const session = await sessions.create({ agent: { type: 'agent', id, version }, environment_id: ids.environmentId,
        title: 'Acme Support Desk', budget: { type: 'limit', max_list_cost: { amount: settings.budgetCents, currency: 'USD' } } }, { timeout: 5000 });
      if (session.agent.version !== version || session.agent.mcp_servers.length || session.agent.skills.length ||
        session.agent.multiagent || capstoneToolMismatch(session.agent.tools)) {
        await sessions.archive(session.id, {}, { timeout: 3000 }).catch(() => {});
        throw new CapstoneError(422, 'Resolved desk session differs from the approved pinned toolset.'); }
      return { id: session.id, status: session.status, agentVersion: session.agent.version }; },
    async open(id, signal) { const stream = await sessions.events.stream(id, {}, { signal });
      return (async function* () { try { for await (const event of stream) yield event; } finally { stream.controller.abort(); } })(); },
    async send(id, prompt, signal) { await sessions.events.send(id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal }); },
    async respond(id, useId, text, isError, signal) { await sessions.events.send(id, { events: [{ type: 'user.custom_tool_result',
      custom_tool_use_id: useId, content: [{ type: 'text', text }], is_error: isError }] }, { signal }); },
    async history(id) { const events: BetaManagedAgentsStreamSessionEvents[] = [];
      for await (const event of sessions.events.list(id, { order: 'asc', limit: 100 })) {
        events.push(event as BetaManagedAgentsStreamSessionEvents); if (events.length >= 200) break; }
      return events; },
    async status(id) { return (await sessions.retrieve(id, {}, { timeout: 3000 })).status; },
    async interrupt(id) { await sessions.events.send(id, { events: [{ type: 'user.interrupt' }] }, { timeout: 3000 }); },
    async archive(id) { await sessions.archive(id, {}, { timeout: 3000 }); },
  };
}
