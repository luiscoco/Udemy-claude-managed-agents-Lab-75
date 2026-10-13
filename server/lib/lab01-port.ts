import { setTimeout as delay } from 'node:timers/promises';
import Anthropic from '@anthropic-ai/sdk';
import type { Lab01Request, Lab01Session } from '../../shared/lab01-events.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { fixtureFor } from './lab01-fixtures.js';
import type { StreamEvent } from './session-events.js';

/** Provider boundary for Lab 01. Each method is one provider call (or one authored fixture step). */
export interface Lab01Port {
  readonly source: 'authored-fixture' | 'managed-api';
  /** Creates a dedicated session and returns its metadata from the creation response. */
  create(): Promise<Lab01Session>;
  /** Resolves only once the event stream is established, so a later send cannot be missed. */
  open(id: string, signal: AbortSignal): Promise<AsyncIterable<StreamEvent>>;
  send(id: string, prompt: string, signal: AbortSignal): Promise<void>;
  /** Own bounded request; never tied to the aborted run signal. */
  interrupt(id: string): Promise<void>;
  status(id: string): Promise<string>;
  archive(id: string): Promise<void>;
}

export function createLiveLab01Port(sdk?: Anthropic, env = process.env): Lab01Port {
  const settings = managedSettings(env);
  if (!settings.liveReady) throw new Error('Managed Agents live mode is disabled or configuration is incomplete.');
  const client = sdk ?? createManagedClient(env);
  const ids = managedResourceIds(env);
  const sessions = client.beta.sessions;
  return {
    source: 'managed-api',
    async create() {
      // The SDK adds the managed-agents beta header. The budget is the documented per-session cap.
      const session = await sessions.create({ agent: ids.agentId, environment_id: ids.environmentId,
        title: 'Lab 01 session event streaming',
        budget: { type: 'limit', max_list_cost: { amount: settings.budgetCents, currency: 'USD' } } });
      const cost = session.budget?.max_list_cost;
      return { source: 'managed-api', id: session.id, status: session.status, agentId: session.agent.id,
        agentVersion: session.agent.version, environmentId: session.environment_id,
        budget: cost ? `${cost.amount} ${cost.currency}` : null,
        toolCount: session.agent.tools.length, mcpServerCount: session.agent.mcp_servers.length };
    },
    async open(id, signal) {
      // Awaiting the call waits for response headers: the stream exists before any user.message is sent.
      const stream = await sessions.events.stream(id, { event_deltas: ['agent.message'] }, { signal });
      return (async function* () {
        try { for await (const event of stream) yield event; }
        finally { stream.controller.abort(); }
      })();
    },
    async send(id, prompt, signal) {
      await sessions.events.send(id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal });
    },
    async interrupt(id) { await sessions.events.send(id, { events: [{ type: 'user.interrupt' }] }, { timeout: 3000 }); },
    async status(id) { return (await sessions.retrieve(id, {}, { timeout: 3000 })).status; },
    async archive(id) { await sessions.archive(id, {}, { timeout: 3000 }); },
  };
}

export const fixtureSession: Lab01Session = { source: 'authored-fixture', id: 'sesn_fixture_lab01', status: 'idle',
  agentId: 'agent_fixture', agentVersion: 1, environmentId: 'env_fixture', budget: '0 USD (no billing)', toolCount: 0, mcpServerCount: 0 };

/** Offline port: no network, no credentials, no charges. `calls` records call order for tests. */
export function createFixturePort(scenario: Lab01Request['scenario'], stepMs = 80): Lab01Port & { calls: string[] } {
  const calls: string[] = [];
  const fixture = fixtureFor(scenario);
  return {
    source: 'authored-fixture', calls,
    async create() { calls.push('create'); return fixtureSession; },
    async open(_id, signal) {
      calls.push('open');
      return (async function* () {
        for (const event of fixture.events) {
          if (stepMs > 0) await delay(stepMs, undefined, { signal });
          signal.throwIfAborted();
          yield event;
        }
        // A hanging fixture models an agent that never reaches idle; only an abort ends it.
        if (fixture.hang) await delay(3_600_000, undefined, { signal });
      })();
    },
    async send() { calls.push('send'); },
    async interrupt() { calls.push('interrupt'); },
    async status() { calls.push('status'); return 'idle'; },
    async archive() { calls.push('archive'); },
  };
}
