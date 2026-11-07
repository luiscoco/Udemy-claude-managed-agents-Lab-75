// Lab 25 live evidence: cumulative usage vs. context occupancy, and observed compaction events.
// Run from the repo root: node --env-file=.env --import tsx scripts/live-labs/lab25-live.ts
// Billed: one session, two short user turns, no tools. The session is archived in `finally`.
import Anthropic from '@anthropic-ai/sdk';
import type { BetaManagedAgentsSession } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
  openTelemetry: { propagation: false, traces: { enabled: false } } });
const sessions = client.beta.sessions;
const deadline = new AbortController(); const timer = setTimeout(() => deadline.abort(), 120_000);
const log = (line: string) => console.log(line);
const n = (value: number | undefined) => typeof value === 'number' ? String(value) : 'unknown';
const cacheWrite = (u: BetaManagedAgentsSession['usage']) => u.cache_creation
  ? (u.cache_creation.ephemeral_5m_input_tokens ?? 0) + (u.cache_creation.ephemeral_1h_input_tokens ?? 0) : undefined;
const usageLine = (u: BetaManagedAgentsSession['usage']) =>
  `input ${n(u.input_tokens)} · output ${n(u.output_tokens)} · cache read ${n(u.cache_read_input_tokens)} · cache write ${n(cacheWrite(u))}`;

const notes = 'Fictional Aurora Finch field notes (teaching fixture): [r1] Aurora Finch colony has band A17. '
  + '[r2] Nest 4 was repaired after the storm. [r3] marsh water level is 12 cm. Reply in one short sentence that you noted all three.';
const recall = 'Without looking anything up, repeat the three facts in one short line.';

let sessionId: string | undefined; let closeStream = () => {};
try {
  const base = await client.beta.agents.retrieve(agentId, {}, { timeout: 5000 });
  const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
    tools: [], mcp_servers: [], skills: [], system: 'Answer in one short sentence. No tools are needed.' },
    environment_id: environmentId, title: 'Lab 25 live context evidence',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { timeout: 10000 });
  sessionId = session.id;
  log(`Session ${session.id} created · status ${session.status} · tools none`);

  const stream = await sessions.events.stream(session.id, {}, { signal: deadline.signal });
  closeStream = () => stream.controller.abort(); const events = stream[Symbol.asyncIterator]();
  let previous = session.usage;

  async function turn(label: string, prompt: string, detail: string) {
    await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] },
      { signal: deadline.signal, timeout: 10000 });
    let started = false, reply = '', stop = 'unknown';
    for (;;) {
      const next = await events.next(); if (next.done) throw new Error('Stream ended before the turn finished.');
      const event = next.value;
      if (event.type === 'session.status_running') started = true;
      if (event.type === 'agent.message') { started = true; reply += event.content.flatMap(b => b.type === 'text' ? [b.text] : []).join(' '); }
      if (event.type === 'session.status_terminated') throw new Error(`Turn failed: ${event.type}`);
      if (event.type === 'session.status_idle' && started) { stop = event.stop_reason.type; break; }
    }
    log(`${label} sent (${detail}) → status idle · stop ${stop}`);
    const text = reply.replace(/\s+/g, ' ').trim();
    log(`  Agent: ${text.length > 92 ? text.slice(0, 89) + '...' : text}`);
    // Session usage can settle slightly after idle; poll briefly until it moves.
    let current = (await sessions.retrieve(session.id, {}, { timeout: 5000 })).usage;
    for (let i = 0; i < 6 && (current.input_tokens ?? 0) + (current.cache_read_input_tokens ?? 0) + (cacheWrite(current) ?? 0)
      <= (previous.input_tokens ?? 0) + (previous.cache_read_input_tokens ?? 0) + (cacheWrite(previous) ?? 0); i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      current = (await sessions.retrieve(session.id, {}, { timeout: 5000 })).usage;
    }
    log(`  Session usage (cumulative): ${usageLine(current)}`);
    previous = current; return current;
  }

  const first = await turn('Turn 1', notes, 'three fictional report facts');
  const second = await turn('Turn 2', recall, 'recall the facts');
  const total = (u: typeof first) => (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (cacheWrite(u) ?? 0);
  log(`Usage only grows: all input-side tokens ${total(first)} → ${total(second)}; a running total, not window occupancy`);

  const counts = new Map<string, number>(); let compacted = 0;
  for await (const event of sessions.events.list(session.id, { limit: 50, order: 'asc' }, { timeout: 10000 })) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
    if (event.type === 'agent.thread_context_compacted') compacted++;
    if ([...counts.values()].reduce((a, b) => a + b, 0) >= 200) break;
  }
  log(`Events listed: ${[...counts.values()].reduce((a, b) => a + b, 0)} · distinct types: ${counts.size}`);
  let line = '  ';
  for (const [type, count] of [...counts].sort((a, b) => b[1] - a[1])) {
    const item = `${type} ×${count}`;
    if (line.length + item.length > 100) { log(line.trimEnd()); line = '  '; }
    line += item + '  ';
  }
  if (line.trim()) log(line.trimEnd());
  log(`Compaction events observed: ${compacted} (agent.thread_context_compacted ${compacted ? 'present' : 'not in this session'})`);
  log('Context window / free context / compaction threshold: not exposed by the API → unknown, not 0');
} finally {
  clearTimeout(timer); closeStream();
  if (sessionId) {
    try { await sessions.archive(sessionId, {}, { timeout: 10000 });
      const archived = await sessions.retrieve(sessionId, {}, { timeout: 5000 });
      log(`Archived: ${archived.archived_at ? 'yes' : 'no'} · final status ${archived.status}`);
    } catch (error) { log(`Archive failed for ${sessionId}: ${error instanceof Error ? error.message : String(error)}`); }
  }
}
