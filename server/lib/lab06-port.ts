import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import Anthropic from '@anthropic-ai/sdk';
import type { BetaManagedAgentsSessionEvent, BetaManagedAgentsStreamSessionEvents } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import type { Lab06HistoryEvent, Lab06ParsedRequest, Lab06Scenario } from '../../shared/lab06-sessions.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';

export interface Lab06Session { id: string; status: string }
export interface Lab06Stream { events: AsyncIterable<BetaManagedAgentsStreamSessionEvents>; close(): void }
export interface Lab06Port {
  readonly source: 'authored-fixture' | 'managed-api';
  create(input: Lab06ParsedRequest): Promise<Lab06Session>;
  open(id: string, signal: AbortSignal, scenario: Lab06Scenario): Promise<Lab06Stream>;
  send(id: string, prompt: string, signal: AbortSignal): Promise<string>;
  history(id: string): Promise<Lab06HistoryEvent[]>;
  status(id: string): Promise<string>;
  interrupt(id: string): Promise<void>;
  archive(id: string): Promise<void>;
}

function textOf(event: BetaManagedAgentsSessionEvent): string | undefined {
  if (event.type !== 'user.message' && event.type !== 'agent.message') return undefined;
  return event.content.map((block) => block.type === 'text' ? block.text : '[non-text block]').join('\n');
}

export function createLiveLab06Port(sdk?: Anthropic, env = process.env): Lab06Port {
  const settings = managedSettings(env);
  if (!settings.liveReady) throw new Error('Managed Agents live mode is disabled or configuration is incomplete.');
  const client = sdk ?? createManagedClient(env); const sessions = client.beta.sessions; const ids = managedResourceIds(env);
  return {
    source: 'managed-api',
    async create(input) {
      const session = await sessions.create({ agent: ids.agentId, environment_id: ids.environmentId, title: 'Lab 06 retained context',
        budget: { type: 'limit', max_list_cost: { amount: String(input.budgetCents ?? settings.budgetCents), currency: 'USD' } } });
      return { id: session.id, status: session.status };
    },
    async open(id, signal) {
      const stream = await sessions.events.stream(id, { event_deltas: ['agent.message'] }, { signal });
      return { events: stream, close: () => stream.controller.abort() };
    },
    async send(id, prompt, signal) {
      const result = await sessions.events.send(id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal });
      const sent = result.data?.find((event) => event.type === 'user.message');
      if (!sent) throw new Error('The Managed API did not return the sent user.message event.');
      return sent.id;
    },
    async history(id) {
      const result: Lab06HistoryEvent[] = [];
      for await (const event of sessions.events.list(id, { order: 'asc', limit: 100 })) {
        const text = textOf(event); if (text !== undefined) result.push({ id: event.id, type: event.type as 'user.message' | 'agent.message', text });
        if (result.length >= 200) break;
      }
      return result;
    },
    async status(id) { return (await sessions.retrieve(id, {}, { timeout: 3000 })).status; },
    async interrupt(id) { await sessions.events.send(id, { events: [{ type: 'user.interrupt' }] }, { timeout: 3000 }); },
    async archive(id) { await sessions.archive(id, {}, { timeout: 3000 }); },
  };
}

type FixtureSession = { id: string; archived: boolean; project?: string; history: Lab06HistoryEvent[]; pending: BetaManagedAgentsStreamSessionEvents[] };
const now = () => new Date().toISOString();
const eventId = () => `sevt_fixture_${randomUUID().replaceAll('-', '')}`;
function projectFrom(prompt: string) { return /(?:called|named)\s+["']?([A-Za-z][A-Za-z0-9 -]{1,40})["']?[.!]?$/i.exec(prompt.trim())?.[1]?.replace(/[.!]+$/, '').trim(); }

export class FixtureLab06Port implements Lab06Port {
  readonly source = 'authored-fixture' as const;
  readonly calls: string[] = [];
  private readonly sessions = new Map<string, FixtureSession>();
  async create(_input: Lab06ParsedRequest) {
    const id = `sesn_fixture_${randomUUID().replaceAll('-', '')}`;
    this.sessions.set(id, { id, archived: false, history: [], pending: [] }); this.calls.push(`create:${id}`);
    return { id, status: 'idle' };
  }
  private get(id: string) { const session = this.sessions.get(id); if (!session || session.archived) throw new Error('Unknown or archived fixture session.'); return session; }
  async open(id: string, signal: AbortSignal, scenario: Lab06Scenario) {
    const session = this.get(id); this.calls.push(`open:${id}`); let closed = false;
    const events = (async function* () {
      while (!closed) {
        signal.throwIfAborted();
        const event = session.pending.shift();
        if (event) {
          if (event.type === 'session.status_idle' && scenario !== 'normal') continue;
          await delay(10, undefined, { signal }); yield event; continue;
        }
        if (scenario === 'hang') { await delay(3_600_000, undefined, { signal }); continue; }
        await delay(2, undefined, { signal });
        if (!session.pending.length) return;
      }
    })();
    return { events, close: () => { closed = true; } };
  }
  async send(id: string, prompt: string, _signal: AbortSignal) {
    const session = this.get(id); this.calls.push(`send:${id}`);
    const userId = eventId(); session.history.push({ id: userId, type: 'user.message', text: prompt });
    const discovered = projectFrom(prompt); if (discovered) session.project = discovered;
    const asks = /what|which|remember|project name/i.test(prompt) && !discovered;
    const answer = asks ? (session.project ? `The fictional project name is ${session.project}.` : 'No fictional project name was introduced in this session.')
      : discovered ? `I will remember the fictional project name ${discovered} in this session.` : 'Message received in this session.';
    const agentId = eventId(); session.history.push({ id: agentId, type: 'agent.message', text: answer });
    session.pending.push(
      { id: eventId(), type: 'session.status_running', processed_at: now() },
      { id: agentId, type: 'agent.message', processed_at: now(), content: [{ type: 'text', text: answer }] },
      { id: eventId(), type: 'session.status_idle', processed_at: now(), stop_reason: { type: 'end_turn' }, stop_details: null },
    );
    return userId;
  }
  async history(id: string) { this.calls.push(`history:${id}`); return [...this.get(id).history]; }
  async status(id: string) { return this.get(id).archived ? 'archived' : 'idle'; }
  async interrupt(id: string) { this.calls.push(`interrupt:${id}`); this.get(id); }
  async archive(id: string) { const session = this.get(id); this.calls.push(`archive:${id}`); session.archived = true; }
}

