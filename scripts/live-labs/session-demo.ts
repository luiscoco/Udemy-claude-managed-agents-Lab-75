// Bounded terminal demonstrations. Existing agents/environments only; no resource provisioning.
import Anthropic from '@anthropic-ai/sdk';
import type { AgentCreateParams } from '@anthropic-ai/sdk/resources/beta/agents';
import { setTimeout as delay } from 'node:timers/promises';

export type Event = Awaited<ReturnType<Anthropic['beta']['sessions']['events']['list']>>['data'][number];
export const textOf = (event: { content?: Array<{ type: string; text?: string }> }) =>
  (event.content ?? []).map(b => b.type === 'text' ? b.text ?? '' : '').join(' ').trim();
export const short = (text: string) => text.replace(/\s+/g, ' ').slice(0, 180);

export async function demo(lab: number, system: string, body: (context: {
  client: Anthropic; id: string; turn: (prompt: string) => Promise<Event[]>;
}) => Promise<void>, tools: AgentCreateParams['tools'] = [],
answer?: (event: Extract<Event, { type: 'agent.custom_tool_use' }>) => Promise<{ text: string; isError: boolean }>) {
  const env = process.env;
  const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
  const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
  if (!env.ANTHROPIC_API_KEY || !agentId || !environmentId) throw Error('Existing agent, environment and API key required');
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000 });
  const sessions = client.beta.sessions;
  const signal = AbortSignal.timeout(180000);
  let id: string | undefined;
  let archived = false;
  try {
    const base = await client.beta.agents.retrieve(agentId, {}, { signal });
    const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
      tools, mcp_servers: [], skills: [], system }, environment_id: environmentId,
      title: `Lab ${lab} bounded terminal demonstration`,
      budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { signal });
    id = session.id;
    console.log(`Session ${id} · agent version ${base.version} · model ${typeof base.model === 'string' ? base.model : JSON.stringify(base.model)}`);
    const turn = async (prompt: string) => {
      const sent = await sessions.events.send(id!, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal });
      const messageId = sent.data?.[0]?.id;
      if (!messageId) throw Error('No user event ID returned');
      const answered = new Set<string>();
      while (!signal.aborted) {
        const all: Event[] = [];
        let cursor: string | undefined;
        for (let page = 0; page < 10; page++) {
          const result = await sessions.events.list(id!, { order: 'asc', limit: 100, ...(cursor ? { page: cursor } : {}) }, { signal });
          all.push(...result.data); cursor = result.next_page ?? undefined;
          if (!cursor) break;
          if (page === 9) throw Error('Event history bound exceeded');
        }
        const at = all.findIndex(event => event.id === messageId);
        const events = at >= 0 ? all.slice(at) : [];
        for (const event of events) {
          if (event.type === 'agent.custom_tool_use' && !answered.has(event.id)) {
            if (!answer || answered.size >= 3) throw Error('Unexpected tool request or tool-call limit reached');
            const result = await answer(event); answered.add(event.id);
            await sessions.events.send(id!, { events: [{ type: 'user.custom_tool_result', custom_tool_use_id: event.id,
              is_error: result.isError, content: [{ type: 'text', text: result.text }] }] }, { signal });
          }
        }
        if (events.some(e => e.type === 'session.status_terminated')) throw Error('Remote session terminated before idle');
        const idle = events.findLast(e => e.type === 'session.status_idle');
        if (idle?.type === 'session.status_idle' && idle.stop_reason.type !== 'requires_action') return events;
        await delay(700, undefined, { signal });
      }
      throw Error('Live demonstration deadline exceeded');
    };
    await body({ client, id, turn });
    await sessions.archive(id, {}, { timeout: 15000 });
    const final = await sessions.retrieve(id, {}, { timeout: 10000 });
    archived = Boolean(final.archived_at);
    console.log(`Archived: ${archived ? 'yes' : 'no'} · final status ${final.status}`);
    if (!archived) throw Error('Archive not confirmed');
  } catch (error) {
    console.error(`Live demonstration failed: ${error instanceof Anthropic.APIError ? `${error.status} ${error.constructor.name}` : String(error)}`);
    if (error instanceof Anthropic.APIError) {
      const detail=(JSON.stringify(error.error)??error.message).replace(/sk-ant-[A-Za-z0-9_-]+/g,'[key hidden]')
        .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9+/=._-]+/g,'[authorization hidden]')
        .replace(/\b(agent|env|sesn)_([A-Za-z0-9]{6})[A-Za-z0-9]+([A-Za-z0-9]{4})\b/g,'$1_$2…$3');
      console.error(`Provider reason: ${detail.slice(0,800)}`);
    }
    process.exitCode = 1;
  } finally {
    if (id && !archived) {
      try { await sessions.events.send(id, { events: [{ type: 'user.interrupt' }] }, { timeout: 10000 }); } catch { /* archive still attempted */ }
      try { await sessions.archive(id, {}, { timeout: 15000 }); console.log('Cleanup: archived'); }
      catch { console.error('Cleanup: archive unconfirmed'); process.exitCode = 1; }
    }
  }
}
