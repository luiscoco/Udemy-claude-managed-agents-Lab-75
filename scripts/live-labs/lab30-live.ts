/**
 * Lab 30 live demo: a host task board gates a real Managed agent's completions.
 * The board, its dependency and evidence gates and its event deduplication are the lab's own Lab30BoardManager.
 * One Managed session (agent_with_overrides: custom tools list_tasks + update_task), ONE user turn,
 * at most 8 custom tool calls answered, 120 s deadline. The session is archived in finally.
 * Run from the repo root: node --env-file=.env --import tsx _live30.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { Lab30BoardManager } from '../../server/lib/lab30-board.js';

const env = process.env;
const apiKey = env.ANTHROPIC_API_KEY?.trim(), agentId = env.CLAUDE_MANAGED_AGENT_ID?.trim();
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID?.trim();
if (!apiKey || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30000 });
const deadline = AbortSignal.timeout(120000);
const MAX_CALLS = 8;

type Task = { id: string; title: string; status: string; version: number; evidence: string | null };
const short = (text: string, n = 92) => { const t = text.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const done = (tasks: Task[]) => `${tasks.filter((t) => t.status === 'done').length}/${tasks.length} done`;

// The host board: the lab's own three-step fixture (draft <- review <- publish), all open.
const owner = 'lab30-live', host = new Lab30BoardManager();
const start = host.run(owner, { mode: 'scripted', scenario: 'three-step' });
const boardId = start.boardId;
console.log(`Host board v${start.boardVersion}: ${start.tasks.map((t) => `${t.id} ${t.title.split(' ')[0].toLowerCase()}`).join(' · ')} · ${done(start.tasks)}`);

const tools = [
  { type: 'custom' as const, name: 'list_tasks', description: "List the host task board for Aurora Finch's field note (IDs, status, versions).",
    input_schema: { type: 'object' as const, properties: {}, additionalProperties: false } },
  { type: 'custom' as const, name: 'update_task', description: 'Ask the host to complete a task. The host checks the version, dependencies and evidence.',
    input_schema: { type: 'object' as const, properties: { id: { type: 'string', pattern: '^task_\\d+$' },
      expectedVersion: { type: 'integer', minimum: 1 }, action: { type: 'string', enum: ['complete'] }, evidence: { type: 'string', maxLength: 80 } },
    required: ['id', 'expectedVersion', 'action', 'evidence'], additionalProperties: false } },
];
const prompt = "Aurora Finch's field note plan has three host tasks. First try update_task to complete task_2 (review) at version 1 "
  + "with evidence 'review-approved'. If the host refuses, use list_tasks and finish the plan in dependency order; the host "
  + 'error tells you the evidence it expects. Then state in one short sentence whether the plan is complete.';

let lastView: ReturnType<Lab30BoardManager['call']> | undefined;
let sessionId: string | undefined, lastCall: { eventId: string; name: 'list_tasks' | 'update_task'; input: Record<string, unknown>; result?: unknown } | undefined;
try {
  const session = await client.beta.sessions.create({
    agent: { type: 'agent_with_overrides', id: agentId, tools, mcp_servers: [], skills: [] },
    environment_id: environmentId, title: 'Lab 30 live task board',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } },
  }, { signal: deadline });
  sessionId = session.id;
  console.log(`Session ${session.id} created · status ${session.status} · custom tools list_tasks, update_task`);
  const stream = await client.beta.sessions.events.stream(session.id, {}, { signal: deadline });
  await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal: deadline });
  console.log('user.message sent: try review (task_2) first, then finish the plan in order');
  let answered = 0, pauses = 0, claim = '', stop = '';
  for await (const event of stream) {
    const raw = event as unknown as { type: string; id?: string; name?: string; input?: Record<string, unknown>;
      content?: { type: string; text?: string }[]; stop_reason?: { type: string } };
    if (raw.type === 'agent.message') claim = (raw.content ?? []).map((b) => b.text ?? '').join(' ');
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type === 'requires_action') pauses++;
    if (raw.type === 'agent.custom_tool_use' && raw.id) {
      if (++answered > MAX_CALLS) {
        await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.interrupt' }] }, { signal: deadline });
        console.log(`Cap of ${MAX_CALLS} custom tool calls reached → user.interrupt sent`); stop = 'interrupted'; break;
      }
      const name = raw.name === 'list_tasks' ? 'list_tasks' : 'update_task', input = raw.input ?? {};
      const eventId = raw.id.startsWith('sevt_') ? raw.id : `sevt_${raw.id}`;
      const view = host.call(owner, { boardId, eventId, name, input }), r = view.latest; lastView = view;
      if (name === 'update_task') lastCall = { eventId, name, input, result: r };
      const asked = name === 'list_tasks' ? 'list_tasks' : `update_task ${input.id} v${input.expectedVersion} '${input.evidence}'`;
      const outcome = r.isError ? `is_error: ${r.text}` : name === 'list_tasks' ? `ok, no effect · ${done(view.tasks)}` : 'ok, done';
      console.log(`#${answered} ${asked} → ${outcome} · board v${view.boardVersion}`);
      await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.custom_tool_result', custom_tool_use_id: raw.id,
        content: [{ type: 'text', text: r.text }], is_error: r.isError }] }, { signal: deadline });
    }
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type !== 'requires_action') { stop = raw.stop_reason?.type ?? 'idle'; break; }
    if (raw.type === 'session.status_terminated') { stop = 'terminated'; break; }
  }
  console.log(`Custom tool calls answered with user.custom_tool_result: ${Math.min(answered, MAX_CALLS)} · requires_action pauses: ${pauses} · stop: ${stop}`);
  console.log(`Agent claim: ${short(claim || '(none)')}`);
  // Replay the last real update_task event ID against the host board: the recorded result comes back, with no second effect.
  if (lastCall && lastView) {
    const replay = host.call(owner, { boardId, eventId: lastCall.eventId, name: lastCall.name, input: lastCall.input });
    const same = JSON.stringify(replay.latest) === JSON.stringify(lastCall.result) && replay.results.length === lastView.results.length;
    console.log(`Host replays update_task event ${lastCall.eventId} (same ID, same input)`);
    console.log(`  → ${same ? 'recorded result returned, no new result row' : 'NEW result'} · board v${lastView.boardVersion} -> v${replay.boardVersion}`);
    console.log(`Final host board (source of truth) v${replay.boardVersion}: ${done(replay.tasks)}`);
    for (const t of replay.tasks) console.log(`  ${t.id} ${t.title.padEnd(18)} ${t.status.padEnd(4)} v${t.version} evidence ${t.evidence ?? '-'}`);
  }
} finally {
  if (sessionId) {
    await client.beta.sessions.archive(sessionId, {}, { timeout: 5000 });
    const after = await client.beta.sessions.retrieve(sessionId, {}, { timeout: 5000 });
    console.log(`Session archived: ${after.archived_at ? 'yes' : 'no'}`);
  }
}
