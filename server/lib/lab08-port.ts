import { setTimeout as delay } from 'node:timers/promises';
import Anthropic from '@anthropic-ai/sdk';
import type { AgentCreateParams } from '@anthropic-ai/sdk/resources/beta/agents/agents';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { lab08Agents, lab08RequestSchema } from '../../shared/lab08-subagents.js';
import type { Lab08Effect, Lab08ParsedRequest, Lab08Request, Lab08Thread } from '../../shared/lab08-subagents.js';

export type Lab08PortResult = { sessionId: string | null; threads: Lab08Thread[]; effects: Lab08Effect[]; duplicatesIgnored: number; interruption: 'not-needed'|'simulated'|'confirmed'|'unconfirmed' };
export interface Lab08Port { source: 'authored-fixture'|'managed-api'; execute(input: Lab08ParsedRequest, signal: AbortSignal, emit: (kind: 'thread'|'effect'|'state', value: unknown) => void): Promise<Lab08PortResult>; interrupt(): Promise<boolean> }
export const lab08AgentEnv = 'CLAUDE_MANAGED_LAB08_AGENT_ID';
export const lab08AgentId = (env: NodeJS.ProcessEnv = process.env) => env[lab08AgentEnv]?.trim() || undefined;
export function lab08MultiagentConfig(agentIds: readonly string[]) { return { type: 'multiagent_20261001' as const, advisor: { type: 'disabled' as const },
  subagents: { type: 'enabled' as const, inline_agents: { type: 'disabled' as const }, predefined_agents: agentIds.map((id) => ({ type: 'agent' as const, id })) }, workflows: { type: 'disabled' as const } }; }
export function lab08CoordinatorTemplate(agentIds: readonly string[], model: string): AgentCreateParams { return { name: 'Managed Agents Lab 08 - delegation coordinator', model,
  system: 'Delegate authored research, review, and arithmetic to the matching predefined agents. Treat host tool results as authoritative. Return a brief synthesis only after independent verification.',
  tools: [], mcp_servers: [], skills: [], multiagent: lab08MultiagentConfig(agentIds) }; }
export function lab08SessionParams(input: Lab08Request, agent: { id: string; version: number }, env = process.env): SessionCreateParams { const value = lab08RequestSchema.parse(input); const settings = managedSettings(env);
  return { agent: { type: 'agent', id: agent.id, version: agent.version }, environment_id: managedResourceIds(env).environmentId, title: 'Lab 08 delegation and session threads',
    budget: { type: 'limit', max_list_cost: { amount: String(value.budgetCents ?? settings.budgetCents), currency: 'USD' } } }; }

function thread(threadId: string, role: Lab08Thread['role'], name: string): Lab08Thread { return { threadId, role, agentName: name, status: 'created', history: [] }; }
function roleFromName(name: unknown): Lab08Effect['role'] | undefined { const value = String(name).toLowerCase(); return lab08Agents.find((item) => value.includes(item.role))?.role; }
export function createFixtureLab08Port(stepMs = 15): Lab08Port {
  let stopped = false;
  return { source: 'authored-fixture', async interrupt() { stopped = true; return true; }, async execute(input, signal, emit) {
    const wait = async () => { if (stepMs) await delay(stepMs, undefined, { signal }); };
    const parent = thread('sthr_parent_fixture', 'parent', 'delegation-coordinator');
    const children = lab08Agents.map((agent, i) => thread(`sthr_${agent.role}_${i + 1}`, agent.role, agent.name));
    const effects: Lab08Effect[] = []; let duplicatesIgnored = 0;
    emit('thread', parent); emit('state', { state: 'delegated', detail: 'Three role-specific session threads were requested.' });
    for (const child of children) { await wait(); child.status = 'running'; child.history.push({ id: `sevt_${child.role}_sent`, direction: 'sent', text: `Delegate ${child.role} task.` }); emit('thread', structuredClone(child)); }
    if (input.scenario === 'hang') await delay(3_600_000, undefined, { signal });
    const research = children[0]!; research.history.push({ id: 'sevt_research_report', direction: 'report', text: 'Authored fixture: Aurora Finch status is ready for review.' }); research.status = 'idle';
    effects.push({ id: 'sevt_read', threadId: research.threadId, role: 'researcher', action: 'read_fixture /workspace/research.md', decision: 'allowed', handlerRan: true, effect: 'Read the authored fixture only.' });
    const review = children[1]!; review.history.push({ id: 'sevt_review_report', direction: 'report', text: 'Requested a write; the host refused it.' }); review.status = 'idle';
    effects.push({ id: 'sevt_review_write', threadId: review.threadId, role: 'reviewer', action: 'propose_write /workspace/research.md', decision: 'denied', handlerRan: false, effect: 'Fixture remained unchanged.' });
    const calculator = children[2]!; calculator.history.push({ id: 'sevt_calc_report', direction: 'report', text: '21 + 21 = 42.' }); calculator.status = 'idle';
    effects.push({ id: 'sevt_add', threadId: calculator.threadId, role: 'calculator', action: 'add_numbers 21 21', decision: 'allowed', handlerRan: true, effect: 'Host independently computed 42.' });
    if (input.scenario === 'wrong-role') effects.push({ id: 'sevt_wrong_role', threadId: review.threadId, role: 'reviewer', action: 'add_numbers 1 1', decision: 'denied', handlerRan: false, effect: 'Reviewer lacks calculator capability.' });
    if (input.scenario === 'cross-posted-call') review.history.push({ id: 'sevt_cross_posted', direction: 'received', text: 'Blocking call surfaced on the primary stream with session_thread_id; it was routed by thread ID.' });
    if (input.scenario === 'duplicate-events') duplicatesIgnored = 2;
    for (const effect of effects) emit('effect', effect); for (const child of children) emit('thread', structuredClone(child));
    emit('state', { state: 'report-received', detail: 'Child reports were correlated by thread and agent identity.' }); emit('state', { state: 'verified', detail: 'The host checked file effects and recomputed the sum.' });
    parent.status = stopped ? 'stopped' : 'idle'; parent.history.push({ id: 'sevt_parent_final', direction: 'report', text: 'Reports received; host evidence confirms read allowed, write denied, and sum 42.' }); emit('thread', parent);
    return { sessionId: 'sesn_fixture_lab08', threads: [parent, ...children], effects, duplicatesIgnored, interruption: stopped ? 'simulated' : 'not-needed' };
  } };
}

export function createLiveLab08Port(input: Lab08Request, sdk?: Anthropic, env = process.env): Lab08Port { const settings = managedSettings(env); const id = lab08AgentId(env); if (!settings.liveReady || !id) throw new Error(`Live mode or ${lab08AgentEnv} is not configured.`);
  const client = sdk ?? createManagedClient(env); let sessionId: string | undefined;
  return { source: 'managed-api', async interrupt() { if (!sessionId) return false; await client.beta.sessions.events.send(sessionId, { events: [{ type: 'user.interrupt' }] }, { timeout: 3000 }); return true; },
    async execute(request, signal, emit) { const agent = await client.beta.agents.retrieve(id, {}, { signal, timeout: 3000 });
      if (agent.archived_at || agent.multiagent?.type !== 'multiagent_20261001' || agent.multiagent.subagents.type !== 'enabled' || agent.multiagent.workflows.type !== 'disabled') throw new Error('Lab 08 coordinator must have enabled predefined subagents and disabled workflows.');
      const session = await client.beta.sessions.create(lab08SessionParams(input, { id: agent.id, version: agent.version }, env), { signal, timeout: 5000 }); sessionId = session.id;
      const stream = await client.beta.sessions.events.stream(session.id, {}, { signal }); const seen = new Set<string>(); const roles = new Map<string, Lab08Effect['role']>();
      const effects: Lab08Effect[] = []; let duplicatesIgnored = 0;
      await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: request.prompt }] }] }, { signal });
      for await (const event of stream) { const raw = event as unknown as Record<string, unknown>; const eventId = typeof raw.id === 'string' ? raw.id : ''; if (eventId && seen.has(eventId)) { duplicatesIgnored++; continue; } if (eventId) seen.add(eventId);
        if (raw.type === 'session.thread_created') { const role = roleFromName(raw.agent_name); if (role) roles.set(String(raw.session_thread_id), role); emit('state', { state: 'delegated', detail: `${String(raw.agent_name)} created ${String(raw.session_thread_id)}.` }); }
        if (raw.type === 'agent.thread_message_received') emit('state', { state: 'report-received', detail: `Message received from ${String(raw.from_session_thread_id)}.` });
        if (raw.type === 'agent.custom_tool_use' && typeof raw.id === 'string') {
          const threadId = typeof raw.session_thread_id === 'string' ? raw.session_thread_id : ''; const role = roles.get(threadId); const name = String(raw.name); const args = raw.input && typeof raw.input === 'object' ? raw.input as Record<string, unknown> : {};
          let decision: Lab08Effect['decision'] = 'denied', handlerRan = false, effect = 'Role capability denied.', text = effect, isError = true;
          if (role === 'researcher' && name === 'read_fixture' && args.path === '/workspace/research.md') { decision = 'allowed'; handlerRan = true; effect = 'Read the authored fixture only.'; text = 'Aurora Finch status is ready for review.'; isError = false; }
          if (role === 'reviewer' && name === 'propose_write') { effect = 'Reviewer writes are denied; the fixture was not changed.'; text = effect; }
          if (role === 'calculator' && name === 'add_numbers' && typeof args.a === 'number' && typeof args.b === 'number' && Number.isFinite(args.a) && Number.isFinite(args.b) && Math.abs(args.a) <= 1_000_000 && Math.abs(args.b) <= 1_000_000) { decision = 'allowed'; handlerRan = true; const sum = args.a + args.b; effect = `Host independently computed ${sum}.`; text = String(sum); isError = false; }
          const audit = { id: raw.id, threadId, role: role ?? 'reviewer', action: `${name} ${JSON.stringify(args)}`.slice(0, 2000), decision, handlerRan, effect }; effects.push(audit); emit('effect', audit);
          await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.custom_tool_result', custom_tool_use_id: raw.id, content: [{ type: 'text', text }], is_error: isError }] }, { signal });
        }
        if (raw.type === 'session.status_idle') break;
      }
      const listed: unknown[] = []; for await (const item of client.beta.sessions.threads.list(session.id, { limit: 20 }, { signal })) listed.push(item);
      const threads: Lab08Thread[] = []; for (const item of listed) { const t = item as { id:string; status:Lab08Thread['status']; agent?:{name?:string}; parent_thread_id?:string|null }; const history: Lab08Thread['history'] = [];
        for await (const event of client.beta.sessions.threads.events.list(t.id, { session_id: session.id, limit: 100 }, { signal })) { const value = event as unknown as Record<string, unknown>; const type = String(value.type); if (!type.includes('message')) continue; const content = Array.isArray(value.content) ? value.content.map((block) => typeof block === 'object' && block && 'text' in block ? String((block as {text:unknown}).text) : '').join('') : type; history.push({ id:String(value.id ?? `${t.id}_${history.length}`), direction:type.includes('sent') ? 'sent' : type.includes('received') ? 'received' : 'report', text:content.slice(0, 8000) }); }
        threads.push({ threadId:t.id, role:(t.parent_thread_id ? (roleFromName(t.agent?.name) ?? 'researcher') : 'parent'), agentName:t.agent?.name ?? 'unknown', status:t.status, history }); }
      emit('state', { state: 'verified', detail: 'Thread inventory was retrieved; live prose is not treated as effect evidence.' });
      return { sessionId: session.id, threads, effects, duplicatesIgnored, interruption: 'not-needed' };
    } };
}
