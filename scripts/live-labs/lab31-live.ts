/**
 * Lab 31 live demo: a real Managed agent asks the host a question through a closed ask_user custom tool,
 * and the host answers with ONE user.custom_tool_result correlated by the tool-use event ID.
 * The tool input is validated with the lab's own lab31AskUserShape; the stale-ID refusal uses the lab's own Lab31Questions.
 * One Managed session (agent_with_overrides: custom tool ask_user), ONE user turn,
 * at most 4 custom tool calls answered, 120 s deadline. The session is archived in finally.
 * Run from the repo root: node --env-file=.env --import tsx _live31.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { lab31AskUserShape } from '../../shared/lab31-ask-user-question.js';
import { Lab31Questions } from '../../server/lib/lab31-questions.js';

const env = process.env;
const apiKey = env.ANTHROPIC_API_KEY?.trim(), agentId = env.CLAUDE_MANAGED_AGENT_ID?.trim();
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID?.trim();
if (!apiKey || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30000 });
const deadline = AbortSignal.timeout(120000);
const MAX_CALLS = 4, FIXED_ANSWER = 'staging';
const short = (text: string, n = 92) => { const t = text.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

// The closed ask_user tool: its input schema is the lab's own question shape.
const { $schema: _drop, ...inputSchema } = z.toJSONSchema(lab31AskUserShape, { target: 'draft-2020-12', io: 'input' }) as Record<string, unknown>;
const tools = [{ type: 'custom' as const, name: 'ask_user',
  description: 'Ask the human one closed question with 2-5 options (id + label). The host returns {"answer": "<option id>"}.',
  input_schema: { type: 'object' as const, ...inputSchema } }];
const prompt = "Write a one-sentence release note for Aurora Finch's fictional field-notes report. Before writing it, call ask_user "
  + 'exactly once to ask which deployment target to use, with options dev, staging and production and allowCustom false. '
  + 'Then write the note naming the chosen target.';

// Host side: pending questions keyed by the tool-use event ID; each gets exactly one result.
const pending = new Map<string, { question: string; optionIds: string[]; status: 'pending' | 'answered' }>();
let sessionId: string | undefined, answeredId: string | undefined;
try {
  const session = await client.beta.sessions.create({
    agent: { type: 'agent_with_overrides', id: agentId, tools, mcp_servers: [], skills: [] },
    environment_id: environmentId, title: 'Lab 31 live ask_user',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } },
  }, { signal: deadline });
  sessionId = session.id;
  console.log(`Session ${session.id} created · status ${session.status} · custom tool ask_user`);
  const stream = await client.beta.sessions.events.stream(session.id, {}, { signal: deadline });
  await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal: deadline });
  console.log('user.message sent: ask which deployment target to use, then write the release note');
  let answered = 0, pauses = 0, final = '', stop = '';
  for await (const event of stream) {
    const raw = event as unknown as { type: string; id?: string; name?: string; input?: Record<string, unknown>;
      content?: { type: string; text?: string }[]; stop_reason?: { type: string } };
    if (raw.type === 'agent.message') final = (raw.content ?? []).map((b) => b.text ?? '').join(' ');
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type === 'requires_action') { pauses++; console.log('session.status_idle · stop_reason requires_action (waiting for the host)'); }
    if (raw.type === 'agent.custom_tool_use' && raw.id) {
      if (++answered > MAX_CALLS) {
        await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.interrupt' }] }, { signal: deadline });
        console.log(`Cap of ${MAX_CALLS} custom tool calls reached → user.interrupt sent`); stop = 'interrupted'; break;
      }
      const parsed = lab31AskUserShape.safeParse(raw.input ?? {});
      let text: string, isError = false;
      if (!parsed.success) { text = 'Invalid ask_user input.'; isError = true; console.log(`#${answered} ${raw.name} ${raw.id} → input refused by lab31AskUserShape`); }
      else {
        const q = parsed.data, ids = q.options.map((o) => o.id);
        pending.set(raw.id, { question: q.question, optionIds: ids, status: 'pending' });
        console.log(`#${answered} agent.custom_tool_use ask_user · event ${raw.id}`);
        console.log(`  question: ${short(q.question, 80)}`);
        console.log(`  options: ${ids.join(', ')} · allowCustom ${q.allowCustom}`);
        const choice = ids.find((id) => id.includes(FIXED_ANSWER));
        if (!choice) { text = 'The human answer is not one of the offered options.'; isError = true; }
        else { text = JSON.stringify({ answer: choice }); pending.get(raw.id)!.status = 'answered'; answeredId = raw.id; }
        console.log(`  host answer (fixed, fictional human): ${choice ?? '(none)'}`);
      }
      await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.custom_tool_result', custom_tool_use_id: raw.id,
        content: [{ type: 'text', text }], is_error: isError }] }, { signal: deadline });
      console.log(`user.custom_tool_result sent · custom_tool_use_id ${raw.id} · ${text}`);
    }
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type !== 'requires_action') { stop = raw.stop_reason?.type ?? 'idle'; break; }
    if (raw.type === 'session.status_terminated') { stop = 'terminated'; break; }
  }
  console.log(`Questions answered: ${Math.min(answered, MAX_CALLS)} · requires_action pauses: ${pauses} · stop: ${stop}`);
  console.log(`Agent final answer: ${short(final || '(none)')}`);
  console.log(`Final answer uses the host answer '${FIXED_ANSWER}': ${/staging/i.test(final) ? 'yes' : 'no'}`);
  // The host keeps one result per event ID: a second answer for the answered live question is refused locally.
  if (answeredId) console.log(`Second answer for ${answeredId}: ${pending.get(answeredId)?.status === 'answered' ? 'refused, already answered' : 'accepted'}`);
} finally {
  if (sessionId) {
    await client.beta.sessions.archive(sessionId, {}, { timeout: 5000 });
    const after = await client.beta.sessions.retrieve(sessionId, {}, { timeout: 5000 });
    console.log(`Session archived: ${after.archived_at ? 'yes' : 'no'}`);
  }
}
// Local only, no API call: the lab's own Lab31Questions refuses an answer whose event ID does not match its stored question.
const host = new Lab31Questions(), owner = 'lab31-live';
const stored = host.run(owner, { mode: 'scripted', scenario: 'deployment-target' });
const tryAnswer = (eventId: string) => { try { host.answer(owner, { runId: stored.runId, sessionId: stored.sessionId, eventId, selectedOption: FIXED_ANSWER });
  return 'accepted'; } catch (error) { return `refused ${(error as { statusCode?: number }).statusCode}: ${(error as Error).message}`; } };
console.log(`Lab31Questions stale event ID (the live one) → ${tryAnswer(answeredId ?? 'sevt_stale')}`);
console.log(`Lab31Questions matching event ID → ${tryAnswer(stored.eventId)}`);
console.log(`Lab31Questions same event ID again → ${tryAnswer(stored.eventId)}`);
host.close();
