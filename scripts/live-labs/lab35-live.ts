// Lab 35 live evidence: a host-side event mirror of a real Managed Agents session.
// Run from the repo root: node --env-file=.env --import tsx _live35.ts
// Billed: one session, one short user turn, no tools. The session is archived and the local mirror deleted in `finally`.
// The lab's own Lab35Mirror only stores authored fixture events, so this script keeps a tiny JSONL mirror in a temp folder.
import Anthropic from '@anthropic-ai/sdk';
import { appendFileSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
  openTelemetry: { propagation: false, traces: { enabled: false } } });
const sessions = client.beta.sessions;
const deadline = new AbortController(); const timer = setTimeout(() => deadline.abort(), 120_000);
const log = (line: string) => console.log(line);
const why = (error: unknown) => error instanceof Anthropic.APIError
  ? `${error.status} ${error.constructor.name} (${error.type ?? 'error'})` : String(error);

// The local mirror: one JSONL file of canonical events plus an index written atomically (temp file + rename).
type Row = { id: string; type: string; processed_at: string | null };
const root = mkdtempSync(join(tmpdir(), 'lab35-mirror-'));
const eventsFile = join(root, 'events.jsonl'), indexFile = join(root, 'index.json');
const stored = (): Row[] => existsSync(eventsFile) ? readFileSync(eventsFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
async function sync(sessionId: string) {
  const known = new Set(stored().map(row => row.id)); let added = 0, pages = 0, cursor: string | undefined;
  do {
    const page = await sessions.events.list(sessionId, { limit: 5, order: 'asc', ...(cursor ? { page: cursor } : {}) },
      { signal: deadline.signal, timeout: 10000 });
    pages++;
    for (const event of page.data) {
      if (known.has(event.id)) continue;
      const row: Row = { id: event.id, type: event.type, processed_at: 'processed_at' in event ? event.processed_at ?? null : null };
      appendFileSync(eventsFile, `${JSON.stringify(row)}\n`); known.add(event.id); added++;
    }
    cursor = page.next_page ?? undefined;
  } while (cursor && pages < 20);
  const temporary = join(root, 'index.tmp');
  writeFileSync(temporary, JSON.stringify({ sessionId, count: known.size, syncedAt: new Date().toISOString() }));
  renameSync(temporary, indexFile);
  return { pages, added, total: known.size };
}

let sessionId: string | undefined, archived = false, closeStream = () => {};
try {
  const base = await client.beta.agents.retrieve(agentId, {}, { timeout: 5000 });
  const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
    tools: [], mcp_servers: [], skills: [], system: 'Answer in one short sentence. No tools are needed.' },
    environment_id: environmentId, title: 'Lab 35 host event mirror',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { timeout: 10000 });
  sessionId = session.id;
  log(`Session ${session.id} created · status ${session.status}`);

  const stream = await sessions.events.stream(session.id, {}, { signal: deadline.signal });
  closeStream = () => stream.controller.abort(); const events = stream[Symbol.asyncIterator]();
  await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text',
    text: 'Fictional Aurora Finch field note: dawn, north marsh, 14 herons, 3 nests. Summarize it in one short sentence.' }] }] },
    { signal: deadline.signal, timeout: 10000 });
  let started = false;
  for (;;) {
    const next = await events.next(); if (next.done) throw new Error('Stream ended before the turn finished.');
    const event = next.value;
    if (event.type === 'session.status_running' || event.type === 'agent.message') started = true;
    if (event.type === 'session.status_terminated') throw new Error('Turn failed: session terminated.');
    if (event.type === 'session.status_idle' && started) break;
  }
  closeStream();
  log('One user turn finished → status idle');

  const first = await sync(session.id);
  log(`Sync 1: ${first.pages} pages of events.list (limit 5) → ${first.added} events mirrored`);
  const mirror = stored();
  const counts = new Map<string, number>(); for (const row of mirror) counts.set(row.type, (counts.get(row.type) ?? 0) + 1);
  log(`  Types: ${[...counts].map(([type, count]) => `${type} ×${count}`).join(', ')}`);
  log(`  Local files: events.jsonl (${mirror.length} lines) + index.json (atomic rename)`);

  const remote: string[] = [];
  for await (const event of sessions.events.list(session.id, { limit: 50, order: 'asc' }, { signal: deadline.signal })) remote.push(event.id);
  const same = remote.length === mirror.length && remote.every((id, i) => id === mirror[i]!.id);
  log(`Remote list: ${remote.length} events · mirror IDs and order match: ${same ? 'yes' : 'NO'}`);
  log(`  First ${mirror[0]!.id} · last ${mirror.at(-1)!.id}`);

  const second = await sync(session.id);
  log(`Sync 2 (same session again): ${second.added} new events · mirror still ${second.total}`);

  await sessions.archive(session.id, {}, { timeout: 10000 });
  archived = true;
  const final = await sessions.retrieve(session.id, {}, { timeout: 5000 });
  log(`Archived remote session → retrieve: archived_at ${final.archived_at ? 'set' : 'missing'} · status ${final.status}`);
  log(`Local mirror after archive: ${stored().length} events, unchanged · it stores no session state`);
  try {
    await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: 'Continue.' }] }] },
      { timeout: 10000 });
    log('Send to archived session → accepted');
  } catch (error) { log(`Send to archived session → refused: ${why(error)}`); }
  log(`Usage: ${final.usage.input_tokens ?? 0} input, ${final.usage.output_tokens ?? 0} output tokens`);
} catch (error) {
  log(`Live run failed: ${why(error)}`);
  process.exitCode = 1;
} finally {
  closeStream(); clearTimeout(timer);
  if (sessionId && !archived) { try { await sessions.archive(sessionId); log('Cleanup: archived'); } catch { log('Cleanup: archive failed'); } }
  rmSync(root, { recursive: true, force: true });
  log(`Cleanup: local mirror folder deleted (${existsSync(root) ? 'NO' : 'yes'})`);
}
