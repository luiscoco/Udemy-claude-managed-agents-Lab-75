// Lab 27 live evidence: the remote session keeps working after the local event stream (the "browser") detaches,
// and a reconnect reads the same session and its events back, deduplicated by event ID.
// Run from the repo root: node --env-file=.env --import tsx scripts/live-labs/lab27-live.ts
// Billed: one session, one short user turn, no tools. The session is archived in `finally`.
import Anthropic from '@anthropic-ai/sdk';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
  openTelemetry: { propagation: false, traces: { enabled: false } } });
const sessions = client.beta.sessions;
const deadline = new AbortController(); const timer = setTimeout(() => deadline.abort(), 120_000);
const log = (line: string) => console.log(line);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// Event IDs are not covered by the deck's mask(), so shorten them here.
const short = (id: string) => id.replace(/^([a-z]+_\w{4})\w+(\w{4})$/, '$1••••$2');
const clock = (iso: string | number) => new Date(iso).toISOString().slice(11, 19);

const prompt = 'Fictional Aurora Finch field notes (teaching fixture): colony band A17, Nest 4 repaired after the storm, '
  + 'marsh water level 12 cm. Write a three-sentence field summary of these notes.';

let sessionId: string | undefined; let closeStream = () => {};
try {
  const base = await client.beta.agents.retrieve(agentId, {}, { timeout: 5000 });
  const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
    tools: [], mcp_servers: [], skills: [], system: 'Answer briefly. No tools are needed.' },
    environment_id: environmentId, title: 'Lab 27 live detach and reconnect',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { timeout: 10000 });
  sessionId = session.id;
  log(`Session ${session.id} created · status ${session.status} · tools none`);

  // "Browser" attaches: open the event stream, send one prompt, read exactly one event, then detach.
  const stream = await sessions.events.stream(session.id, {}, { signal: deadline.signal });
  closeStream = () => stream.controller.abort();
  await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] },
    { signal: deadline.signal, timeout: 10000 });
  log('Browser attached: stream open · user.message sent (three-sentence field summary)');
  const seen = new Set<string>();
  const first = await stream[Symbol.asyncIterator]().next();
  if (first.done) throw new Error('Stream ended before the first event.');
  if ('id' in first.value && first.value.id) seen.add(first.value.id);
  log(`  First streamed event: ${first.value.type} (${'id' in first.value ? short(first.value.id) : 'no id'})`);
  closeStream(); const detachedAt = Date.now();
  log(`Browser detached at ${clock(detachedAt)}: local stream closed after 1 event`);
  const right = await sessions.retrieve(session.id, {}, { timeout: 5000 });
  log(`  Remote status right after detach: ${right.status}`);

  // Stay away; the remote session keeps working with nobody listening.
  let remote = right; const waitStart = Date.now();
  while (remote.status !== 'idle' && Date.now() - waitStart < 60_000) {
    await sleep(2000); remote = await sessions.retrieve(session.id, {}, { timeout: 5000 });
  }
  log(`Waited ${Math.round((Date.now() - waitStart) / 1000)} s while detached → remote status ${remote.status}`);

  // "Reconnect": retrieve the same session and list its events, dropping any event ID already seen.
  const again = await sessions.retrieve(session.id, {}, { timeout: 5000 });
  log(`Reconnect: retrieve → ${again.id} · same session: ${again.id === session.id ? 'yes' : 'no'} · status ${again.status}`);
  let listed = 0, skipped = 0, users = 0; const messages: { id: string; at: string; text: string }[] = [];
  for await (const event of sessions.events.list(session.id, { limit: 50, order: 'asc' }, { timeout: 10000 })) {
    listed++;
    if (!('id' in event) || !event.id) continue;
    if (seen.has(event.id)) { skipped++; continue; }
    seen.add(event.id);
    if (event.type === 'user.message') users++;
    if (event.type === 'agent.message') messages.push({ id: event.id, at: event.processed_at,
      text: event.content.flatMap(b => b.type === 'text' ? [b.text] : []).join(' ').replace(/\s+/g, ' ').trim() });
    if (listed >= 200) break;
  }
  log(`  Events listed: ${listed} · already seen, skipped by ID: ${skipped} · new: ${listed - skipped}`);
  log(`  user.message (new after dedupe): ${users} · agent.message: ${messages.length}`
    + ` (${messages.length === 1 ? 'exactly once' : 'unexpected count'})`);
  for (const message of messages) {
    log(`  agent.message ${short(message.id)} processed at ${clock(message.at)}`);
    log(`  Agent: ${message.text.length > 92 ? message.text.slice(0, 89) + '...' : message.text}`);
  }
  const after = messages.some(m => Date.parse(m.at) > detachedAt);
  log(`Closing the local stream did not stop the remote work: reply produced after detach: ${after ? 'yes' : 'no'}`);
} finally {
  clearTimeout(timer); closeStream();
  if (sessionId) {
    try { await sessions.archive(sessionId, {}, { timeout: 10000 });
      const archived = await sessions.retrieve(sessionId, {}, { timeout: 5000 });
      log(`Archived: ${archived.archived_at ? 'yes' : 'no'} · final status ${archived.status}`);
    } catch (error) { log(`Archive failed for ${sessionId}: ${error instanceof Error ? error.message : String(error)}`); }
  }
}
