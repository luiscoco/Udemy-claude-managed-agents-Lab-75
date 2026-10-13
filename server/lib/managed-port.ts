import Anthropic from '@anthropic-ai/sdk';
import type { ManagedUsage } from '../../shared/managed.js';
import { managedSettings, managedResourceIds, createManagedClient } from './managed-config.js';
export { managedSettings } from './managed-config.js';

export interface RemoteEvent { type: string; text?: string; stopReason?: string }
export interface ManagedPort {
  create(): Promise<string>;
  stream(id: string, signal: AbortSignal): Promise<AsyncIterable<RemoteEvent>>;
  send(id: string, prompt: string, signal: AbortSignal): Promise<void>;
  inspect(id: string): Promise<{ status: string; usage: ManagedUsage }>;
  interrupt(id: string): Promise<void>;
  archive(id: string): Promise<void>;
}
export function createManagedPort(sdk?: Anthropic, env = process.env): ManagedPort {
  const settings = managedSettings(env);
  if (!settings.liveReady) throw new Error('Managed Agents live mode is disabled or configuration is incomplete.');
  const client = sdk ?? createManagedClient(env);
  const ids = managedResourceIds(env);
  const sessions = client.beta.sessions;
  return {
    async create() {
      // Do not abort creation: retain the returned ID so cancellation can clean it up.
      const session = await sessions.create({ agent: ids.agentId,
        environment_id: ids.environmentId, title: 'Learning foundation check',
        budget: { type: 'limit', max_list_cost: { amount: settings.budgetCents, currency: 'USD' } } });
      return session.id;
    },
    async stream(id, signal) {
      const stream = await sessions.events.stream(id, {}, { signal });
      return (async function* () {
        try {
          for await (const event of stream) {
            if (event.type === 'agent.message') {
              const text = event.content.filter(block => block.type === 'text').map(block => block.text).join('\n');
              yield { type: event.type, text };
            } else if (event.type === 'session.status_idle') yield { type: event.type, stopReason: event.stop_reason.type };
            else yield { type: event.type };
          }
        } finally { stream.controller.abort(); }
      })();
    },
    async send(id, prompt, signal) {
      await sessions.events.send(id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal });
    },
    async inspect(id) {
      const session = await sessions.retrieve(id, {}, { timeout: 3000 });
      const usage = session.usage;
      return { status: session.status, usage: {
        inputTokens: usage.input_tokens ?? null, outputTokens: usage.output_tokens ?? null,
        cacheReadInputTokens: usage.cache_read_input_tokens ?? null, activeSeconds: usage.active_seconds ?? null,
        listCost: usage.list_cost ? { amount: usage.list_cost.amount, currency: usage.list_cost.currency } : null,
      } };
    },
    async interrupt(id) { await sessions.events.send(id, { events: [{ type: 'user.interrupt' }] }, { timeout: 3000 }); },
    async archive(id) { await sessions.archive(id, {}, { timeout: 3000 }); },
  };
}
