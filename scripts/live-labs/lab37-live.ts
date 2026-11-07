/**
 * Lab 37 live demo: a real Managed session asks for built-in write actions under permission policy always_ask.
 * Each paused request is sent to the lab's own external policy service (Lab37PolicyGate, which spawns the isolated
 * worker mcp-servers/lab37-policy.mjs and then applies its fixed host path check). Its confirmation is sent back as
 * user.tool_confirmation, bound to the real agent.tool_use event ID. A second turn reads both paths (read is
 * always_allow) to show the denied write had no file effect.
 * One session, TWO short user turns, at most 4 confirmations answered, 120 s deadline. Archived in finally.
 * Run from the repo root: node --env-file=.env --import tsx _live37.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { toolsetFrom } from '../../shared/lab03-tools.js';
import { Lab37PolicyGate } from '../../server/lib/lab37-policy-gate.js';

const env = process.env;
const apiKey = env.ANTHROPIC_API_KEY?.trim(), agentId = env.CLAUDE_MANAGED_AGENT_ID?.trim();
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID?.trim();
if (!apiKey || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30000 });
const deadline = AbortSignal.timeout(120000);
const MAX_CONFIRMATIONS = 4, MAX_TOOL_USES = 4;
const short = (text: string, n = 60) => { const t = text.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const hide = (id: string) => id.replace(/^(sevt_[A-Za-z0-9]{6})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})$/, '$1••••••••$2');

// Built-in tools only: write pauses for a host decision (always_ask); read runs without one (always_allow).
const toolset = toolsetFrom('always_ask', { write: 'always_ask', read: 'always_allow' });
const gate = new Lab37PolicyGate(), owner = 'lab37-live';
let confirmations = 0;
const effects = new Map<string, number>();

// The external decision service: the lab's own gate. An exact /workspace/notes.txt write runs the worker's allow
// scenario; any other path runs host-refusal, where the host path limit overrides a valid worker allow.
async function decide(eventId: string, path: string) {
  const scenario = path === '/workspace/notes.txt' ? 'allow' : 'host-refusal';
  let view;
  // The gate gives its Node worker 3 s; a cold Node start can exceed that. Retry once, then fail closed.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const pending = gate.run(owner, { mode: 'scripted', scenario, gate: 'worker' });
    view = await gate.decide(owner, { runId: pending.runId, eventId: pending.eventId ?? '' });
    if (view.confirmation) break;
    console.log(`  policy service → ${view.status} (attempt ${attempt}); no confirmation from this run`);
  }
  if (!view?.confirmation) {
    console.log('  policy service unavailable → fail closed');
    return { type: 'user.tool_confirmation' as const, tool_use_id: eventId, result: 'deny' as const, deny_message: 'Policy gate unavailable; failing closed.' };
  }
  const reason = view.confirmation.deny_message ? `: ${view.confirmation.deny_message}` : '';
  console.log(`  policy service → worker ${view.gateDecision} · host path check ${view.hostDecision}${reason}`);
  // Same shape the gate builds, bound to the real agent.tool_use event ID.
  return { ...view.confirmation, tool_use_id: eventId };
}

async function turn(sessionId: string, label: string, text: string) {
  const stream = await client.beta.sessions.events.stream(sessionId, {}, { signal: deadline });
  await client.beta.sessions.events.send(sessionId, { events: [{ type: 'user.message', content: [{ type: 'text', text }] }] }, { signal: deadline });
  let uses = 0, pauses = 0, reply = '', stop = '';
  const paths = new Map<string, { name: string; path: string }>();
  for await (const event of stream) {
    const raw = event as unknown as { type: string; id?: string; name?: string; input?: { file_path?: string };
      evaluated_permission?: string; tool_use_id?: string; is_error?: boolean | null;
      content?: { type: string; text?: string }[]; stop_reason?: { type: string } };
    if (raw.type === 'agent.message') reply = (raw.content ?? []).map((b) => b.text ?? '').join(' ');
    if (raw.type === 'agent.tool_use' && raw.id) {
      const path = raw.input?.file_path ?? '-', name = raw.name ?? '?';
      if (++uses > MAX_TOOL_USES) {
        await client.beta.sessions.events.send(sessionId, { events: [{ type: 'user.interrupt' }] }, { signal: deadline });
        console.log(`  cap of ${MAX_TOOL_USES} tool uses reached → user.interrupt sent`); stop = 'interrupted'; break;
      }
      paths.set(raw.id, { name, path });
      console.log(`agent.tool_use ${name} ${path} (${hide(raw.id)}) · evaluated_permission ${raw.evaluated_permission ?? '-'}`);
      if (raw.evaluated_permission === 'ask') {
        if (++confirmations > MAX_CONFIRMATIONS) throw new Error('Confirmation cap reached.');
        const confirmation = await decide(raw.id, path);
        await client.beta.sessions.events.send(sessionId, { events: [confirmation] }, { signal: deadline });
        console.log(`  user.tool_confirmation sent → ${confirmation.result}`);
      }
    }
    if (raw.type === 'agent.tool_result' && raw.tool_use_id) {
      const call = paths.get(raw.tool_use_id), body = short((raw.content ?? []).map((b) => b.text ?? '').join(' ') || '(empty)', 52);
      console.log(`  agent.tool_result ${call?.name ?? '?'}: ${raw.is_error ? 'is_error' : 'ok'} · ${body}`);
      if (call?.name === 'read') effects.set(call.path, raw.is_error ? 0 : 1);
    }
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type === 'requires_action') pauses++;
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type !== 'requires_action') { stop = raw.stop_reason?.type ?? 'idle'; break; }
    if (raw.type === 'session.status_terminated') { stop = 'terminated'; break; }
  }
  console.log(`Agent: ${short(reply || '(no message)', 96)}`);
  console.log(`  ${label} stop: ${stop} · tool uses: ${Math.min(uses, MAX_TOOL_USES)} · requires_action pauses: ${pauses}`);
}

let sessionId: string | undefined;
try {
  const session = await client.beta.sessions.create({
    agent: { type: 'agent_with_overrides', id: agentId, tools: [toolset], mcp_servers: [], skills: [],
      system: 'You keep fictional field notes. Use only the write and read tools exactly as asked. Never retry a denied action.' },
    environment_id: environmentId, title: 'Lab 37 live policy service',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } },
  }, { signal: deadline });
  sessionId = session.id;
  const policies = (session.agent.tools.find((t) => t.type === 'agent_toolset_20260401') as typeof toolset | undefined)?.configs
    .flatMap((c) => c.enabled ? [`${c.name} ${c.permission_policy.type}`] : []).join(', ');
  console.log(`Session ${session.id} created · status ${session.status} · tools: ${policies}`);
  console.log('Turn 1 · user.message: write a heron note to /workspace/notes.txt, then to /outside/notes.txt');
  await turn(session.id, 'turn 1', "Use the write tool twice, one call each, in this order: write /workspace/notes.txt with the text "
    + "'Aurora Finch: one heron at dawn.' and then write /outside/notes.txt with the same text. Use no other tool. "
    + 'Then say in one short sentence which writes succeeded.');
  console.log('Turn 2 · user.message: read both paths (read is always_allow, no confirmation)');
  await turn(session.id, 'turn 2', 'Use the read tool once on /workspace/notes.txt and once on /outside/notes.txt. '
    + 'Use no other tool. Then say in one short sentence what each read returned.');
  console.log(`File effects: /workspace/notes.txt ${effects.get('/workspace/notes.txt') ?? '?'} · /outside/notes.txt ${effects.get('/outside/notes.txt') ?? '?'}`
    + ` · confirmations sent: ${confirmations}`);
} finally {
  gate.close();
  if (sessionId) {
    await client.beta.sessions.archive(sessionId, {}, { timeout: 5000 });
    const after = await client.beta.sessions.retrieve(sessionId, {}, { timeout: 5000 });
    console.log(`Session archived: ${after.archived_at ? 'yes' : 'no'} · usage ${after.usage.input_tokens ?? 0} in, ${after.usage.output_tokens ?? 0} out tokens`);
  }
}
