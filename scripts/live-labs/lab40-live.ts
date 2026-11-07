// Lab 40 live evidence: safe recovery after an interrupted turn on a real Claude Managed Agents session.
// Run from the repo root: node --env-file=.env --import tsx _live40.ts
// Billed: one session, at most two short user turns (the first is interrupted), no tools, 120 s deadline.
// The session is archived in `finally`. Recovery decisions come from the lab's own Lab40Recovery rules.
import Anthropic from '@anthropic-ai/sdk';
import { Lab40Error, Lab40Recovery } from '../../server/lib/lab40-recovery.js';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
  openTelemetry: { propagation: false, traces: { enabled: false } } });
const sessions = client.beta.sessions;
const deadline = Date.now() + 120_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const log = (line: string) => console.log(line);
const why = (error: unknown) => error instanceof Anthropic.APIError
  ? `${error.status} ${error.constructor.name} (${error.type ?? 'error'})`
  : error instanceof Lab40Error ? `${error.statusCode} ${error.message}` : String(error);
const short = (id: string) => id.length > 16 ? `${id.slice(0, 9)}••••${id.slice(-4)}` : id;
const textOf = (event: { content?: Array<{ type: string; text?: string }> }) =>
  (event.content ?? []).map(block => block.type === 'text' ? block.text ?? '' : '').join(' ').trim();

// The real Managed history, read page by page in order.
type Event = Awaited<ReturnType<typeof sessions.events.list>>['data'][number];
async function history(id: string) {
  const all: Event[] = []; let cursor: string | undefined, pages = 0;
  do {
    const page = await sessions.events.list(id, { limit: 50, order: 'asc', ...(cursor ? { page: cursor } : {}) }, { timeout: 10000 });
    all.push(...page.data); cursor = page.next_page ?? undefined; pages++;
  } while (cursor && pages < 10);
  return all;
}
// Group the history into turns: each user.message opens one; track interrupt, replies and the idle stop reason.
function turns(events: Event[]) {
  const out: { id: string; text: string; interrupted: boolean; replies: Event[]; stop: string }[] = [];
  for (const event of events) {
    const turn = out.at(-1);
    if (event.type === 'user.message') out.push({ id: event.id, text: textOf(event), interrupted: false, replies: [], stop: 'none' });
    else if (!turn) continue;
    else if (event.type === 'user.interrupt') turn.interrupted = true;
    else if (event.type === 'agent.message') turn.replies.push(event);
    else if (event.type === 'session.status_idle') turn.stop = event.stop_reason.type;
  }
  return out;
}
async function waitStatus(id: string, wanted: string, maxMs: number) {
  const start = Date.now();
  while (Date.now() - start < maxMs && Date.now() < deadline) {
    if ((await sessions.retrieve(id)).status === wanted) return ((Date.now() - start) / 1000).toFixed(1);
    await sleep(250);
  }
  return null;
}
// Wait until a session.status_idle event follows the given user.message in the remote history.
async function waitTurnIdle(id: string, messageId: string, maxMs: number) {
  const start = Date.now();
  while (Date.now() - start < maxMs && Date.now() < deadline) {
    const events = await history(id);
    const at = messageId ? events.findIndex(event => event.id === messageId) : events.map(event => event.type).lastIndexOf('user.message');
    if (at >= 0 && events.slice(at).some(event => event.type === 'session.status_idle')) return ((Date.now() - start) / 1000).toFixed(1);
    await sleep(700);
  }
  return null;
}

const recovery = new Lab40Recovery();
const firstPrompt = 'Write about 600 words of fictional field notes by Aurora Finch on a heron colony at dawn, hour by hour.';
const retryPrompt = 'Retry of the earlier request, shortened: one sentence of fictional Aurora Finch field notes on herons at dawn.';
const operatorConfirmedRetry = true; // The explicit confirmation a real host asks its user for before any resend.
let sessionId: string | undefined, archived = false;
try {
  log(`Lab 40 rule: ${recovery.dry().rule}`);
  const base = await client.beta.agents.retrieve(agentId, {}, { timeout: 5000 });
  const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
    tools: [], mcp_servers: [], skills: [], system: 'You write short fictional field notes. No tools are needed.' },
    environment_id: environmentId, title: 'Lab 40 safe recovery',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { timeout: 10000 });
  sessionId = session.id;
  log(`Session ${session.id} created · status ${session.status}`);

  // Turn 1: a long request, interrupted while the model is still writing.
  await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: firstPrompt }] }] });
  const running = await waitStatus(session.id, 'running', 15000);
  log(`Turn 1 user.message sent (600-word request) → status ${running ? `running after ${running} s` : 'not running'}`);
  await sleep(1000);
  await sessions.events.send(session.id, { events: [{ type: 'user.interrupt' }] });
  const idle = await waitStatus(session.id, 'idle', 30000);
  log(idle ? `user.interrupt sent → sessions.retrieve status idle after ${idle} s (confirmed idle)` : 'user.interrupt sent → idle NOT confirmed');
  if (!idle) throw new Error('Idle not confirmed; recovery stops here.');

  // Recover from the remote history, not from host memory.
  const before = await history(session.id); const [first] = turns(before);
  log(`events.list after the interrupt: ${before.length} events · turns found: ${turns(before).length}`);
  const dropped = first.replies.length === 0;
  log(`  Turn 1 ${short(first.id)}: accepted (in history) · interrupted: ${first.interrupted ? 'yes' : 'no'} · agent.message ${first.replies.length}`
    + ` → ${dropped ? 'reply dropped (incomplete)' : 'reply present'}`);

  // The lab's own rules: the receipt is known (the user.message is in history), so this is an accepted turn, not an uncertain send.
  const kept = recovery.build('live-script', { mode: 'scripted', scenario: 'kept-turn' });
  const undone = recovery.undo('live-script', kept.runId, kept.version);
  log(`Lab40Recovery · host-only undo → ${undone.undo}: ${undone.decision}`);
  const chosen = recovery.choose('live-script', kept.runId, 'interrupt');
  log(`Lab40Recovery · interrupt → ${chosen.recovery}: ${chosen.decision}`);
  const uncertain = recovery.build('live-script', { mode: 'scripted', scenario: 'uncertain-send' });
  try { recovery.choose('live-script', uncertain.runId, 'continue'); log('If the receipt were unknown · continue → accepted'); }
  catch (error) { log(`If the receipt were unknown · continue → refused ${why(error)}`); }

  log(`Blind resend of the turn 1 prompt: no · explicit confirmation required (operator: ${operatorConfirmedRetry ? 'yes' : 'no'})`);
  if (!operatorConfirmedRetry || !dropped) { log('No retry: nothing to resend or no confirmation.'); }
  else {
    // Turn 2: a NEW, shorter, explicitly confirmed turn. The original prompt is never replayed.
    const sent = await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: retryPrompt }] }] });
    const messageId = sent.data?.[0]?.id ?? '';
    const done = await waitTurnIdle(session.id, messageId, 60000);
    log(`Turn 2 user.message sent (new, confirmed retry) → ${done ? `idle after ${done} s` : 'idle NOT reached'}`);
  }

  const after = await history(session.id); const all = turns(after);
  const unchanged = before.every((event, index) => after[index]?.id === event.id);
  log(`events.list after recovery: ${after.length} events · first ${before.length} IDs unchanged: ${unchanged ? 'yes' : 'no'} (history only appended)`);
  all.forEach((turn, index) => log(`  Turn ${index + 1}: ${turn.replies.length ? 'completed' : turn.interrupted ? 'interrupted' : 'incomplete'}`
    + ` · agent.message ${turn.replies.length} · stop ${turn.stop}`));
  const reply = all.at(-1)?.replies.at(-1);
  if (reply && reply.type === 'agent.message') { const text = textOf(reply); log(`  Agent: ${text.length > 80 ? `${text.slice(0, 80)}...` : text}`); }
  log(`Turn 1 prompt sent exactly once: ${all.filter(turn => turn.text === firstPrompt).length === 1 ? 'yes' : 'no'}`);

  await sessions.archive(session.id); archived = true;
  const final = await sessions.retrieve(session.id);
  log(`Archived: ${final.archived_at ? 'yes' : 'no'} · final status ${final.status}`);
} catch (error) {
  log(`Live run failed: ${why(error)}`);
  process.exitCode = 1;
} finally {
  recovery.close();
  if (sessionId && !archived) { try { await sessions.archive(sessionId); log('Cleanup: archived'); } catch { log('Cleanup: archive failed'); } }
}
