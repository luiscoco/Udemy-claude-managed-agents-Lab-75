import Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams, SessionUpdateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { Lab15Input } from '../../shared/lab15-usage.js';
import type { StreamEvent } from './session-events.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { agentVersion } from './tool-session-port.js';
import { parseUsdCents } from './lab15-accounting.js';

export interface Lab15Session { id: string; model: string; verified: boolean }
export interface Lab15Usage { usage: unknown; budget: unknown; status: string; threads: { id: string; agentName: string; usage: unknown }[]; threadsNote: string }
export interface Lab15Port {
  source: 'authored-fixture' | 'managed-api'; creation: 'not-started' | 'confirmed' | 'rejected' | 'uncertain';
  create(): Promise<Lab15Session>; open(id: string, signal: AbortSignal): Promise<AsyncIterable<StreamEvent>>;
  send(id: string, prompt: string, signal: AbortSignal): Promise<string>;
  context(id: string, text: string, signal: AbortSignal): Promise<void>;
  read(id: string): Promise<Lab15Usage>; raise(id: string, cents: number, signal: AbortSignal): Promise<void>;
  status(id: string): Promise<string>; interrupt(id: string): Promise<void>; archive(id: string): Promise<void>;
}
export function lab15Budget(cents: number) { return { type: 'limit' as const, max_list_cost: { amount: String(cents), currency: 'USD' as const } }; }
export function createLiveLab15Port(input: Lab15Input, sdk?: Anthropic, env = process.env): Lab15Port {
  if (!managedSettings(env).liveReady) throw new Error('Configure Managed live mode first.');
  const client = sdk ?? createManagedClient(env), sessions = client.beta.sessions, ids = managedResourceIds(env);
  const port: Lab15Port = { source: 'managed-api', creation: 'not-started', async create() {
    const version = agentVersion(env);
    const base = await client.beta.agents.retrieve(ids.agentId, version ? { version } : {}, { timeout: 3000 });
    if (base.multiagent) throw new Error('Lab 15 live experiments require a single-agent base; child activity is an offline attribution experiment.');
    const parameters: SessionCreateParams = { agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
      tools: [], mcp_servers: [], skills: [], system: 'Answer briefly using public conclusions. No tools or private reasoning are needed.' },
      environment_id: ids.environmentId, title: 'Lab 15 usage and session budget', budget: lab15Budget(input.budgetCents) };
    port.creation = 'uncertain'; let session;
    try { session = await sessions.create(parameters, { timeout: 5000 }); }
    catch (error) { if (error instanceof Anthropic.APIError && [400, 403, 404, 422].includes(error.status ?? 0)) port.creation = 'rejected'; throw error; }
    port.creation = 'confirmed'; const agent = session.agent;
    return { id: session.id, model: agent.model.id, verified: agent.id === base.id && agent.version === base.version && agent.model.id === base.model.id
      && !agent.tools.length && !agent.mcp_servers.length && !agent.skills.length && !agent.multiagent && session.environment_id === ids.environmentId && parseUsdCents(session.budget?.max_list_cost) === input.budgetCents };
  }, async open(id, signal) {
    const stream = await sessions.events.stream(id, {}, { signal });
    return (async function* () { try { for await (const event of stream) yield event; } finally { stream.controller.abort(); } })();
  }, async send(id, prompt, signal) {
    const result = await sessions.events.send(id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal, timeout: 5000 });
    const event = result.data?.find(event => event.type === 'user.message'); if (!event) throw new Error('Uncertain prompt acceptance.'); return event.id;
  }, async context(id, text, signal) { await sessions.events.send(id, { events: [{ type: 'system.message', content: [{ type: 'text', text }] }] }, { signal, timeout: 5000 }); },
    async read(id) {
      const session = await sessions.retrieve(id, {}, { timeout: 3000 });
      let threads: Lab15Usage['threads'] = [], threadsNote = 'Thread usage unavailable.';
      try { const page = await sessions.threads.list(id, { limit: 8 }, { timeout: 3000 });
        threads = page.data.slice(0, 8).map(thread => ({ id: thread.id, agentName: 'name' in thread.agent ? String(thread.agent.name) : 'resolved-agent', usage: thread.usage }));
        threadsNote = page.hasNextPage() ? 'First 8 threads only; more attribution is available in Console.' : 'Retrieved thread attribution; overlaps session totals and is never added to them.';
      } catch { /* Session usage remains useful when thread access is unavailable. */ }
      return { usage: session.usage, status: session.status, budget: session.budget?.max_list_cost, threads, threadsNote };
    }, async raise(id, cents, signal) {
      // SDK 1.7.0 permits replacement only on an originally budgeted session.
      const parameters: SessionUpdateParams = { budget: lab15Budget(cents) };
      const session = await sessions.update(id, parameters, { signal, timeout: 5000 });
      if (parseUsdCents(session.budget?.max_list_cost) !== cents) throw new Error('Resolved budget mismatch; resumed work is uncertain.');
    }, async status(id) { return (await sessions.retrieve(id, {}, { timeout: 3000 })).status; },
    async interrupt(id) { await sessions.events.send(id, { events: [{ type: 'user.interrupt' }] }, { timeout: 3000 }); },
    async archive(id) { await sessions.archive(id, {}, { timeout: 3000 }); },
  };
  return port;
}
export function createFixtureLab15Port(input: Lab15Input, stepMs = 15): Lab15Port & { calls: string[] } {
  const calls: string[] = []; let status = 'idle', turns = 0, cap = input.budgetCents, marker = '';
  let changed = false, usage: Record<string, unknown> = {}, resumed = false, resumedFromCost = 0;
  const id = () => `sevt_fixture_${randomUUID()}`;
  const values = (final: boolean) => input.scenario === 'missing-usage' ? {} : { input_tokens: turns * (final ? 14 : 10), output_tokens: turns * (final ? 8 : 5),
    cache_read_input_tokens: turns * 4, cache_creation: { ephemeral_5m_input_tokens: turns * 2, ephemeral_1h_input_tokens: 0 },
    active_seconds: turns * (final ? 1.5 : 1), list_cost: { amount: String(input.scenario === 'budget-reached' ? resumed ? resumedFromCost + (final ? 4 : 3) : cap + 3 : turns * (final ? 4 : 3)), currency: 'USD' },
    server_tool_use: { web_search_requests: 0, web_fetch_requests: 0 } };
  const port: Lab15Port & { calls: string[] } = { source: 'authored-fixture', calls, creation: 'not-started',
    async create() { calls.push('create'); port.creation = 'confirmed'; return { id: `sesn_fixture_lab15_${randomUUID()}`, model: 'authored-fixture-model', verified: true }; },
    async open(_id, signal) { calls.push('open'); return (async function* (): AsyncGenerator<StreamEvent> {
      // Deliberately replay an old idle to exercise per-operation correlation.
      yield { type: 'session.status_idle', id: 'stale_idle', processed_at: '2026-01-01T00:00:00Z', stop_details: null, stop_reason: { type: 'end_turn' } };
      if (changed) { changed = false; yield { type: 'session.updated', id: id(), processed_at: new Date().toISOString(), budget: lab15Budget(cap) }; }
      else yield { type: 'user.message', id: marker, content: [{ type: 'text', text: input.prompt }], processed_at: new Date().toISOString() };
      if (input.scenario === 'hang') await delay(3600000, undefined, { signal });
      await delay(stepMs, undefined, { signal });
      const at = new Date().toISOString(); usage = values(false);
      const event: StreamEvent = { type: 'session.usage', id: id(), processed_at: at, usage, budget: lab15Budget(cap) };
      if (input.scenario !== 'missing-usage') { yield event; if (input.scenario === 'repeated-usage') yield event; }
      const span: StreamEvent = { type: 'span.model_request_end', id: id(), processed_at: at, model_request_start_id: id(), is_error: false,
        model_usage: { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 2, cache_read_input_tokens: 4 } };
      if (input.scenario !== 'missing-usage') { yield span; if (input.scenario === 'repeated-usage') yield span; }
      yield { type: 'agent.message', id: id(), processed_at: at, content: [{ type: 'text', text: 'Authored notebook reply. Usage values in this experiment are fictional accounting fixtures.' }] };
      status = 'idle'; usage = values(true);
      yield { type: 'session.status_idle', id: id(), processed_at: new Date().toISOString(), stop_details: null,
        stop_reason: { type: input.scenario === 'budget-reached' && !resumed ? 'budget_reached' : 'end_turn' } };
    })(); },
    async send(_id, _prompt, signal) { signal.throwIfAborted(); calls.push('send'); turns++; marker = id(); status = 'running'; return marker; },
    async context(_id, _text, signal) { signal.throwIfAborted(); calls.push('context'); },
    async raise(_id, cents, signal) { signal.throwIfAborted(); calls.push('raise'); resumedFromCost = parseUsdCents(usage.list_cost) ?? 0; cap = cents; changed = true; resumed = true; turns++; status = 'running'; },
    async read() { calls.push('read'); return { usage, budget: { amount: String(cap), currency: 'USD' }, status,
      threads: input.scenario === 'child-activity' ? [{ id: 'sthr_primary_fixture', agentName: 'primary', usage: { input_tokens: turns * 9, output_tokens: turns * 5, active_seconds: 1, list_cost: { amount: '2', currency: 'USD' } } },
        { id: 'sthr_child_fixture', agentName: 'fictional-child', usage: { input_tokens: turns * 5, output_tokens: turns * 3, active_seconds: 1.2, list_cost: { amount: '1', currency: 'USD' } } }] : [],
      threadsNote: input.scenario === 'child-activity' ? 'Authored child attribution; never sum it with overlapping session totals.' : 'No thread attribution in this fixture.' }; },
    async status() { return status; }, async interrupt() { calls.push('interrupt'); status = 'idle'; }, async archive() { calls.push('archive'); status = 'archived'; },
  }; return port;
}
