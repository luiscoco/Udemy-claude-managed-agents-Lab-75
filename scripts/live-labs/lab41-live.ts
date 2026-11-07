// Lab 41 live evidence: one real Claude Managed Agents session walked through its whole lifecycle,
// each observed state compared with the lab's own Lab41Lifecycle model (offline fixture, no provider calls).
// Run from the repo root: node --env-file=.env --import tsx _live41.ts
// Billed: one session, one short user turn, no tools, 120 s deadline. The session is archived in `finally`.
import Anthropic from '@anthropic-ai/sdk';
import { Lab41Error, Lab41Lifecycle } from '../../server/lib/lab41-lifecycle.js';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
  openTelemetry: { propagation: false, traces: { enabled: false } } });
const sessions = client.beta.sessions;
const deadline = new AbortController(); const timer = setTimeout(() => deadline.abort(), 120_000);
const log = (line: string) => console.log(line);
const yes = (ok: boolean) => ok ? 'yes' : 'NO';
const why = (error: unknown) => error instanceof Anthropic.APIError
  ? `${error.status} ${error.constructor.name} (${error.type ?? 'error'})`
  : error instanceof Lab41Error ? `${error.statusCode} ${error.message}` : String(error);
const prompt = 'The fictional project is called Aurora Notebook.';
let matches = 0, checks = 0;
const compare = (model: string, ok: boolean) => { checks++; if (ok) matches++; log(`    model: ${model} · match ${yes(ok)}`); };

// The lab's own lifecycle model: the offline 'retained' workflow, then reconnect and archive (fixture only, providerCalls 0).
const lab = new Lab41Lifecycle(); const owner = 'live-script';
let sessionId: string | undefined, archived = false, closeStream = () => {};
try {
  const model = await lab.start(owner, 'retained');
  log(`Lab 41 model: Lab41Lifecycle 'retained' · status ${model.status} · providerCalls ${model.providerCalls}`);
  const base = await client.beta.agents.retrieve(agentId, {}, { timeout: 5000 });

  // [1] Create: a new session starts idle.
  const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
    tools: [], mcp_servers: [], skills: [], system: 'Answer in one short sentence. No tools are needed.' },
    environment_id: environmentId, title: 'Lab 41 session lifecycle',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { timeout: 10000 });
  sessionId = session.id;
  log(`[1] sessions.create → ${session.id} · status ${session.status}`);
  compare('sessions.create resolved, status idle', session.status === 'idle');

  // [2]-[3] One turn: stream first, then send; observe running, the reply and idle with its stop reason.
  const stream = await sessions.events.stream(session.id, {}, { signal: deadline.signal });
  closeStream = () => stream.controller.abort(); const events = stream[Symbol.asyncIterator]();
  const started = Date.now();
  await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] },
    { signal: deadline.signal, timeout: 10000 });
  let running = false, replies = 0, reply = '', stop = 'none';
  for (;;) {
    const next = await events.next(); if (next.done) throw new Error('Stream ended before the turn finished.');
    const event = next.value;
    if (event.type === 'session.status_running' && !running) {
      running = true; const now = await sessions.retrieve(session.id, {}, { timeout: 5000 });
      log(`[2] user.message sent → session.status_running streamed · sessions.retrieve: ${now.status}`);
    }
    if (event.type === 'agent.message') { replies++; reply = event.content.map(block => block.type === 'text' ? block.text : '').join(' ').trim(); }
    if (event.type === 'session.status_terminated') throw new Error('Turn failed: session terminated.');
    if (event.type === 'session.status_idle' && (running || replies)) { stop = event.stop_reason.type; break; }
  }
  closeStream();
  const idle = await sessions.retrieve(session.id, {}, { timeout: 5000 });
  log(`[3] session.status_idle · stop_reason ${stop} · sessions.retrieve: ${idle.status} · agent.message ${replies}`
    + ` (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  log(`    Agent: ${reply.length > 80 ? `${reply.slice(0, 80)}...` : reply}`);
  compare('stream agent reply, confirm status_idle + retrieve idle', replies > 0 && stop === 'end_turn' && idle.status === 'idle');

  // [4] Reconnect view: retrieve, list and the event history show the same session; nothing new is created.
  const listed = await sessions.list({ agent_id: base.id, limit: 20, order: 'desc' }, { timeout: 10000 });
  const found = listed.data.some(item => item.id === session.id);
  const history: { type: string }[] = [];
  for await (const event of sessions.events.list(session.id, { limit: 50, order: 'asc' }, { signal: deadline.signal })) history.push(event);
  const users = history.filter(event => event.type === 'user.message').length;
  const agents = history.filter(event => event.type === 'agent.message').length;
  log(`[4] sessions.retrieve: status ${idle.status} · archived_at ${idle.archived_at ?? 'null'} · sessions.list shows it: ${yes(found)}`);
  log(`    events.list: ${history.length} events · user.message ${users} · agent.message ${agents}`);
  const reconnect = await lab.act(owner, model.runId, 'reconnect');
  const modelUsers = reconnect.history.filter(item => item.type === 'user.message').length;
  const modelAgents = reconnect.history.filter(item => item.type === 'agent.message').length;
  compare(`events.list hydrated (user ${modelUsers} · agent ${modelAgents}); no sessions.create`,
    found && users === modelUsers && agents === modelAgents && reconnect.createdSessions === 1 && reconnect.reconnectCreates === 0);

  // [5] Archive after idle.
  await sessions.archive(session.id, {}, { timeout: 10000 }); archived = true;
  const after = await sessions.retrieve(session.id, {}, { timeout: 5000 });
  log(`[5] sessions.archive → archived_at ${after.archived_at ?? 'null'} · status ${after.status}`);
  const plain = await sessions.list({ agent_id: base.id, limit: 20, order: 'desc' }, { timeout: 10000 });
  const every = await sessions.list({ agent_id: base.id, limit: 20, order: 'desc', include_archived: true }, { timeout: 10000 });
  log(`    sessions.list default shows it: ${plain.data.some(item => item.id === session.id) ? 'yes' : 'no'}`
    + ` · with include_archived: ${every.data.some(item => item.id === session.id) ? 'yes' : 'no'}`);
  const archivedModel = await lab.act(owner, model.runId, 'archive');
  compare(`status ${archivedModel.status} · archiveCount ${archivedModel.archiveCount}`, archivedModel.status === 'archived' && after.archived_at != null);

  // [6] A send after archive must be refused, by the API and by the lab model.
  let refused = 'accepted';
  try {
    await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: 'What is the fictional project name?' }] }] },
      { signal: deadline.signal, timeout: 10000 });
  } catch (error) { refused = `refused ${why(error)}`; }
  log(`[6] user.message after archive → ${refused}`);
  let modelRefused = 'accepted';
  try { await lab.act(owner, model.runId, 'second-turn'); } catch (error) { modelRefused = `refused ${why(error)}`; }
  compare(modelRefused, refused.startsWith('refused') && modelRefused.startsWith('refused'));
  log(`Lifecycle states matching the lab model: ${matches} of ${checks} · sessions created 1 · user turns 1`);
} catch (error) {
  log(`Live run failed: ${why(error)}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer); closeStream(); await lab.close();
  if (sessionId && !archived) { try { await sessions.archive(sessionId); log('Cleanup: archived'); } catch { log('Cleanup: archive failed'); } }
}
