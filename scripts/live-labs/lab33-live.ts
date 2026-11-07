/**
 * Lab 33 live demo: a real Managed agent asks for human input through a custom tool; the host answers it from
 * the lab's own local MCP elicitation fixture (Lab33Elicitation + mcp-servers/lab33-form.mjs) and validates the
 * form with the lab's schema before replying. Managed sessions are not assumed to relay MCP elicitation.
 * One session (agent_with_overrides: custom tool collect_field_note, no MCP servers), TWO short user turns,
 * at most 2 custom tool calls answered per turn, 120 s deadline. The session is archived in finally.
 * Run from the repo root: node --env-file=.env --import tsx _live33.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { Lab33Elicitation, Lab33Error } from '../../server/lib/lab33-elicitation.js';

const env = process.env;
const apiKey = env.ANTHROPIC_API_KEY?.trim(), agentId = env.CLAUDE_MANAGED_AGENT_ID?.trim();
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID?.trim();
if (!apiKey || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30000 });
const deadline = AbortSignal.timeout(120000);
const MAX_CALLS = 2;
const short = (text: string, n = 84) => { const t = text.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const hide = (id: string) => id.replace(/^(sevt_[A-Za-z0-9]{6})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})$/, '$1••••••••$2');

const tools = [{ type: 'custom' as const, name: 'collect_field_note',
  description: 'Ask the human for one fictional observation date and quantity (1-10). The host shows a form and returns the result.',
  input_schema: { type: 'object' as const, properties: { purpose: { type: 'string', maxLength: 80 } }, required: ['purpose'], additionalProperties: false } }];
const host = new Lab33Elicitation(), owner = 'lab33-live';

// The host bridge: each custom tool call opens the lab's local MCP form; the "human" answers are scripted per turn.
async function answer(eventId: string, scenario: 'valid-form' | 'decline') {
  const view = await host.run(owner, { mode: 'scripted', scenario });
  console.log(`  host → local MCP tools/call; elicitation/create ${view.mcpRequestId}: ${short(view.question, 60)}`);
  const ids = { runId: view.runId, mcpRequestId: view.mcpRequestId, customCallId: view.customCallId, consentId: view.consentId };
  let done = view;
  if (scenario === 'valid-form') {
    try { await host.respond(owner, { ...ids, action: 'accept', content: { date: '2026-10-15', quantity: 99 } }); }
    catch (error) { if (error instanceof Lab33Error) console.log(`  human types quantity 99 → host schema: ${error.statusCode} ${error.message} (no MCP reply)`); else throw error; }
    done = await host.respond(owner, { ...ids, action: 'accept', content: { date: '2026-10-15', quantity: 3 } });
    console.log(`  human submits 2026-10-15, quantity 3 → ${done.status} · MCP result: ${short(done.result ?? '', 46)}`);
  } else {
    done = await host.respond(owner, { ...ids, action: 'decline' });
    console.log(`  human declines → ${done.status} · MCP result: ${done.result} · isError ${done.bridgeResult?.is_error}`);
  }
  if (!done.bridgeResult) throw new Error('No MCP result to bridge.');
  // Same shape the lab builds, bound to the real agent.custom_tool_use event ID.
  return { ...done.bridgeResult, custom_tool_use_id: eventId };
}

async function turn(sessionId: string, text: string, scenario: 'valid-form' | 'decline') {
  const stream = await client.beta.sessions.events.stream(sessionId, {}, { signal: deadline });
  await client.beta.sessions.events.send(sessionId, { events: [{ type: 'user.message', content: [{ type: 'text', text }] }] }, { signal: deadline });
  let calls = 0, reply = '', stop = '';
  for await (const event of stream) {
    const raw = event as unknown as { type: string; id?: string; name?: string; input?: { purpose?: string };
      content?: { type: string; text?: string }[]; stop_reason?: { type: string } };
    if (raw.type === 'agent.message') reply = (raw.content ?? []).map((b) => b.text ?? '').join(' ');
    if (raw.type === 'agent.custom_tool_use' && raw.id) {
      if (++calls > MAX_CALLS) {
        await client.beta.sessions.events.send(sessionId, { events: [{ type: 'user.interrupt' }] }, { signal: deadline });
        console.log(`  cap of ${MAX_CALLS} custom tool calls reached → user.interrupt sent`); stop = 'interrupted'; break;
      }
      console.log(`agent.custom_tool_use ${raw.name} (${hide(raw.id)}) purpose: ${short(raw.input?.purpose ?? '-', 40)}`);
      const result = await answer(raw.id, scenario);
      await client.beta.sessions.events.send(sessionId, { events: [result] }, { signal: deadline });
      console.log(`  user.custom_tool_result sent · is_error ${result.is_error}`);
    }
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type !== 'requires_action') { stop = raw.stop_reason?.type ?? 'idle'; break; }
    if (raw.type === 'session.status_terminated') { stop = 'terminated'; break; }
  }
  console.log(`Agent: ${short(reply || '(no message)', 96)}`);
  console.log(`  turn stop: ${stop} · custom tool calls: ${Math.min(calls, MAX_CALLS)}`);
}

let sessionId: string | undefined;
try {
  const agent = await client.beta.agents.retrieve(agentId, {}, { signal: deadline });
  const names = agent.mcp_servers.map((s) => `${s.name} (${s.type})`).join(', ') || 'none';
  console.log(`Agent ${agent.id} v${agent.version} · MCP servers: ${names}`);
  const session = await client.beta.sessions.create({
    agent: { type: 'agent_with_overrides', id: agentId, tools, mcp_servers: [], skills: [],
      system: 'You record fictional field notes. Never invent the date or quantity: ask the human with collect_field_note.' },
    environment_id: environmentId, title: 'Lab 33 live human form',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } },
  }, { signal: deadline });
  sessionId = session.id;
  console.log(`Session ${session.id} created · status ${session.status} · session MCP servers: ${session.agent.mcp_servers.length}`);
  console.log('Turn 1 · user.message: record one heron observation for Aurora Finch');
  await turn(session.id, "Record one heron observation for Aurora Finch's field notes. Ask the human with collect_field_note, "
    + 'then confirm the recorded note in one short sentence.', 'valid-form');
  console.log('Turn 2 · user.message: ask for a second observation');
  await turn(session.id, 'Ask the human for a second observation with collect_field_note. If they decline, say so in one short '
    + 'sentence and do not ask again.', 'decline');
} finally {
  host.close();
  if (sessionId) {
    await client.beta.sessions.archive(sessionId, {}, { timeout: 5000 });
    const after = await client.beta.sessions.retrieve(sessionId, {}, { timeout: 5000 });
    console.log(`Session archived: ${after.archived_at ? 'yes' : 'no'} · usage ${after.usage.input_tokens ?? 0} in, ${after.usage.output_tokens ?? 0} out tokens`);
  }
}
