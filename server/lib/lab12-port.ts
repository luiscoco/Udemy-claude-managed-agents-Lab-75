import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type Anthropic from '@anthropic-ai/sdk';
import type { BetaManagedAgentsAgentToolset20260401Params } from '@anthropic-ai/sdk/resources/beta/agents';
import type { BetaManagedAgentsUserMessageEventParams } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import type { Lab12Input, Lab12Message } from '../../shared/lab12-streaming-input.js';
import type { StreamEvent } from './session-events.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { agentVersion } from './tool-session-port.js';

export interface Lab12Session { id: string; model: string; effort: string; configurationValid: boolean }
export interface Lab12Port {
  source: 'authored-fixture' | 'managed-api';
  create(input: Lab12Input, model?: string, effort?: 'low' | 'medium' | 'high'): Promise<Lab12Session>;
  open(id: string, signal: AbortSignal): Promise<AsyncIterable<StreamEvent>>;
  send(id: string, message: Lab12Message, signal: AbortSignal): Promise<string>;
  context(id: string, text: string): Promise<string>;
  tools(id: string, preset: 'none' | 'read-only'): Promise<void>;
  status(id: string): Promise<string>;
  interrupt(id: string): Promise<void>;
  archive(id: string): Promise<void>;
}
export const lab12ReadTools: BetaManagedAgentsAgentToolset20260401Params[] = [{ type: 'agent_toolset_20260401',
  default_config: { enabled: false, permission_policy: { type: 'always_allow' } },
  configs: [{ name: 'read', enabled: true, permission_policy: { type: 'always_allow' } }] }];
export function lab12Content(message: Lab12Message): BetaManagedAgentsUserMessageEventParams['content'] {
  return [{ type: 'text', text: message.text }, ...(message.image ? [{ type: 'image' as const, source: { type: 'base64' as const, ...message.image } }] : [])];
}
export function createLiveLab12Port(sdk?: Anthropic, env = process.env): Lab12Port {
  if (!managedSettings(env).liveReady) throw new Error('Configure Managed live mode first.');
  const client = sdk ?? createManagedClient(env); const sessions = client.beta.sessions; const ids = managedResourceIds(env);
  return { source: 'managed-api', async create(input, model, effort) {
    const version = agentVersion(env);
    const base = await client.beta.agents.retrieve(ids.agentId, version ? { version } : {}, { timeout: 3000 });
    if (base.multiagent) throw new Error('Lab 12 requires a single-agent base.');
    const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
      tools: [], mcp_servers: [], skills: [], ...(model ? { model: { id: model, ...(effort ? { effort } : {}) } } : {}) }, environment_id: ids.environmentId,
      title: 'Lab 12 serialized host queue', budget: { type: 'limit', max_list_cost: { amount: String(input.budgetCents), currency: 'USD' } } }, { timeout: 5000 });
    const a = session.agent;
    const resolvedEffort = typeof a.model.effort === 'string' ? a.model.effort : a.model.effort?.type ?? 'model default';
    return { id: session.id, model: a.model.id, effort: resolvedEffort,
      configurationValid: a.id === base.id && a.version === base.version && a.system === base.system && !a.tools.length && !a.mcp_servers.length && !a.skills.length && !a.multiagent && a.model.id === (model ?? base.model.id) && (!effort || effort === resolvedEffort) };
  }, async open(id, signal) {
    const stream = await sessions.events.stream(id, { event_deltas: ['agent.message'] }, { signal });
    return (async function* () { try { for await (const event of stream) yield event; } finally { stream.controller.abort(); } })();
  }, async send(id, message, signal) {
    const result = await sessions.events.send(id, { events: [{ type: 'user.message', content: lab12Content(message) }] }, { signal, timeout: 5000 });
    const event = result.data?.find(e => e.type === 'user.message');
    if (!event) throw new Error('No returned user event ID. Submission is uncertain; do not retry automatically.');
    return event.id;
  }, async context(id, text) {
    const result = await sessions.events.send(id, { events: [{ type: 'system.message', content: [{ type: 'text', text }] }] }, { timeout: 5000 });
    const event = result.data?.find(e => e.type === 'system.message');
    if (!event) throw new Error('No returned system event ID.'); return event.id;
  }, async tools(id, preset) {
    const session = await sessions.update(id, { agent: { tools: preset === 'read-only' ? lab12ReadTools : [], mcp_servers: [] } }, { timeout: 5000 });
    const a = session.agent; const tool = a.tools[0];
    if (a.mcp_servers.length || a.tools.length !== (preset === 'none' ? 0 : 1) || a.skills.length || a.multiagent ||
      (preset === 'read-only' && (tool?.type !== 'agent_toolset_20260401' || tool.default_config.enabled || tool.configs.length !== 1 ||
        tool.configs[0]?.name !== 'read' || !tool.configs[0].enabled || tool.configs[0].permission_policy.type !== 'always_allow'))) throw new Error('Resolved tool update differs.');
  }, async status(id) { return (await sessions.retrieve(id, {}, { timeout: 3000 })).status; },
  async interrupt(id) { await sessions.events.send(id, { events: [{ type: 'user.interrupt' }] }, { timeout: 3000 }); },
  async archive(id) { await sessions.archive(id, {}, { timeout: 3000 }); } };
}

export function createFixtureLab12Port(stepMs = 80): Lab12Port & { calls: string[] } {
  const calls: string[] = []; let status = 'idle'; let pending: Lab12Message | undefined; let userId = ''; let unconfirmed = false;
  const id = () => `sevt_fixture_${randomUUID()}`;
  return { source: 'authored-fixture', calls, async create(_input, model, effort) { calls.push('create'); return { id: `sesn_fixture_lab12_${randomUUID()}`, model: model ?? 'fixture-model', effort: effort ?? 'fixture-default', configurationValid: true }; },
    async open(_session, signal) { calls.push('open'); return (async function* (): AsyncGenerator<StreamEvent> {
      while (!signal.aborted) {
        while (!pending) await delay(2, undefined, { signal });
        const message = pending; pending = undefined; const at = new Date().toISOString();
        yield { type: 'user.message', id: userId, content: lab12Content(message), processed_at: at };
        yield { type: 'session.status_running', id: id(), processed_at: at };
        if (message.scenario === 'hang' || message.scenario === 'interrupt-unconfirmed') await delay(3_600_000, undefined, { signal });
        await delay(message.scenario === 'slow' ? Math.max(700, stepMs) : stepMs, undefined, { signal });
        if (message.scenario === 'stream-ended') return;
        const event: StreamEvent = { type: 'agent.message', id: id(), content: [{ type: 'text', text: `Authored reply to: ${message.text}${message.image ? ' [small PNG attached]' : ''}` }], processed_at: at };
        yield event; if (message.scenario === 'duplicate-events') yield event;
        status = 'idle'; yield { type: 'session.status_idle', id: id(), stop_details: null, stop_reason: { type: message.scenario === 'error' ? 'refusal' : 'end_turn' }, processed_at: at };
      }
    })(); },
    async send(_session, message, signal) { signal.throwIfAborted(); if (status !== 'idle') throw new Error('Fixture send overlap.'); calls.push(`send:${message.commandId}`); pending = message; userId = id(); unconfirmed = message.scenario === 'interrupt-unconfirmed'; status = 'running'; return userId; },
    async context(_session, _text) { calls.push('context'); return id(); }, async tools(_session, preset) { calls.push(`tools:${preset}`); },
    async status() { return status; }, async interrupt() { calls.push('interrupt'); if (!unconfirmed) status = 'idle'; },
    async archive() { if (status !== 'idle') throw new Error('Not idle'); calls.push('archive'); status = 'archived'; } };
}
