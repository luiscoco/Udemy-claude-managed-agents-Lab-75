// Lab 47 live evidence: host-driven orchestration (two independent worker sessions, the host passes a verified report
// from the first to the second) contrasted with one model-driven run (the existing Lab 08 coordinator delegates to a
// predefined subagent thread inside ONE session).
// Run from the repo root: node --env-file=.env --import tsx _live47.ts
// Billed: three sessions, one short user turn each (max 3 turns), ~150 s deadline; every session is archived in `finally`.
// The offline fixture comes from the lab's own Lab47MultiAgent class; worker reports are checked with the lab's own schema.
import Anthropic from '@anthropic-ai/sdk';
import { Lab47MultiAgent } from '../../server/lib/lab47-multi-agent.js';
import { lab47SalesReportSchema } from '../../shared/lab47-multi-agent.js';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
const coordinatorId = env.CLAUDE_MANAGED_LAB08_AGENT_ID?.trim();
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
  openTelemetry: { propagation: false, traces: { enabled: false } } });
const sessions = client.beta.sessions;
const deadline = new AbortController(); const timer = setTimeout(() => deadline.abort(), 150_000);
const log = (line: string) => console.log(line);
const clip = (text: string, max = 70) => { const one = text.replace(/\s+/g, ' ').trim(); return one.length > max ? one.slice(0, max - 3) + '...' : one; };
const textOf = (content: Array<{ type: string; text?: string }>) => content.map(b => b.type === 'text' ? b.text ?? '' : '').join('');
const budget = { type: 'limit' as const, max_list_cost: { amount: '25', currency: 'USD' as const } };
const fixture = { north: { region: 'north', sales: 120, orders: 4, fixtureId: 'sales-2026-north' },
  south: { region: 'south', sales: 80, orders: 2, fixtureId: 'sales-2026-south' } } as const;

const opened: string[] = [];
type Usage = { input: number; output: number };
async function usageOf(id: string): Promise<Usage> {
  const s = await sessions.retrieve(id, {}, { timeout: 5000 });
  return { input: s.usage?.input_tokens ?? 0, output: s.usage?.output_tokens ?? 0 };
}

// One host-owned worker: its own session, its own system role, one turn.
async function worker(role: string, system: string, prompt: string) {
  const base = await client.beta.agents.retrieve(agentId!, {}, { timeout: 5000 });
  const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
    tools: [], mcp_servers: [], skills: [], system }, environment_id: environmentId!, title: `Lab 47 host worker ${role}`, budget },
    { timeout: 10000 });
  opened.push(session.id);
  const stream = await sessions.events.stream(session.id, {}, { signal: deadline.signal });
  let reply = '', started = false; const t0 = Date.now();
  try {
    await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] },
      { signal: deadline.signal, timeout: 10000 });
    for await (const event of stream) {
      if (event.type === 'session.status_running') started = true;
      if (event.type === 'agent.message') { started = true; reply += textOf(event.content); }
      if (event.type === 'session.status_terminated') throw new Error('Worker session terminated');
      if (event.type === 'session.status_idle' && started) break;
    }
  } finally { stream.controller.abort(); }
  const usage = await usageOf(session.id);
  log(`  ${role}: session ${session.id} · idle after ${((Date.now() - t0) / 1000).toFixed(1)} s · thread none`);
  log(`  ${role} usage (independent-session): input ${usage.input} · output ${usage.output}`);
  return { id: session.id, reply: reply.trim(), usage };
}

try {
  const lab = new Lab47MultiAgent();
  const offline = lab.run('pipeline', 'regional-sales'); lab.close();
  log(`Offline Lab47MultiAgent.run('pipeline') → architecture ${offline.architecture} · gate ${offline.gate} · providerCalls ${offline.providerCalls}`);

  // HOST-DRIVEN: the host decides the order, runs two separate sessions and passes only a verified report onward.
  log('HOST-DRIVEN · the host calls worker 1, verifies, then calls worker 2');
  const counter = await worker('counter',
    'You are a counter worker. Reply with JSON only, no prose, no code fences. Do not use tools.',
    'Fictional Aurora Finch sales notes: north sold 120 units in 4 orders (fixture sales-2026-north); south sold 80 units in 2 orders '
    + '(fixture sales-2026-south). Return a JSON array of two objects with exactly the keys region, sales, orders, fixtureId.');
  let reports: unknown[] = [];
  try { const raw = counter.reply.replace(/^```(json)?|```$/g, '').trim(); const parsed = JSON.parse(raw); reports = Array.isArray(parsed) ? parsed : []; } catch { reports = []; }
  const verified = (['north', 'south'] as const).map(region => {
    const item = reports.find(r => (r as { region?: string })?.region === region);
    const check = lab47SalesReportSchema.safeParse(item);
    return check.success && JSON.stringify(check.data) === JSON.stringify(fixture[region]) ? check.data : null;
  });
  const gate = verified.every(Boolean) ? 'passed' : 'rejected';
  log(`  Host gate on counter report: ${verified.filter(Boolean).length}/2 regions match schema and fixture → ${gate}`);
  let hostUsage: Usage = counter.usage;
  if (gate === 'passed') {
    const total = verified.reduce((sum, r) => sum + r!.sales, 0), orders = verified.reduce((sum, r) => sum + r!.orders, 0);
    const reviewer = await worker('reviewer',
      'You are a reviewer worker. Answer in one short sentence. Do not use tools.',
      `A host verified this closed report: ${JSON.stringify(verified)}. Host-computed total: ${total} units in ${orders} orders. `
      + 'Reply starting with APPROVED or REJECTED, then one short reason.');
    log(`  reviewer said: "${clip(reviewer.reply)}"`);
    hostUsage = { input: counter.usage.input + reviewer.usage.input, output: counter.usage.output + reviewer.usage.output };
    log(`  Host aggregate = sum of 2 independent sessions: input ${hostUsage.input} · output ${hostUsage.output}`);
  } else log('  Reviewer NOT called: an unverified report never reaches the next worker');

  // MODEL-DRIVEN: one session; the coordinator model decides to delegate to a predefined subagent thread.
  if (!coordinatorId) log('MODEL-DRIVEN · skipped: CLAUDE_MANAGED_LAB08_AGENT_ID not set');
  else {
    const coordinator = await client.beta.agents.retrieve(coordinatorId, {}, { timeout: 5000 });
    const sub = coordinator.multiagent?.type === 'multiagent_20261001' && coordinator.multiagent.subagents.type === 'enabled'
      ? coordinator.multiagent.subagents.predefined_agents?.length ?? 0 : 0;
    log(`MODEL-DRIVEN · coordinator ${coordinator.id} · multiagent ${coordinator.multiagent?.type ?? 'none'} · predefined agents ${sub}`);
    const session = await sessions.create({ agent: { type: 'agent', id: coordinator.id, version: coordinator.version },
      environment_id: environmentId, title: 'Lab 47 model-driven delegation', budget }, { timeout: 10000 });
    opened.push(session.id);
    const stream = await sessions.events.stream(session.id, {}, { signal: deadline.signal });
    const threads = new Map<string, string>(); let toolCalls = 0, sent = 0, received = 0, final = '', started = false; const t0 = Date.now();
    try {
      await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text:
        'Delegate one task to the calculator agent: add 120 and 80 with add_numbers. Then reply with the total in one short sentence.' }] }] },
        { signal: deadline.signal, timeout: 10000 });
      for await (const event of stream) {
        const raw = event as unknown as Record<string, unknown>;
        if (raw.type === 'session.status_running') started = true;
        if (raw.type === 'session.thread_created') { threads.set(String(raw.session_thread_id), String(raw.agent_name));
          log(`  session.thread_created → ${String(raw.agent_name)} · ${String(raw.session_thread_id)}`); }
        if (raw.type === 'agent.thread_message_sent') sent++;
        if (raw.type === 'agent.thread_message_received') received++;
        if (raw.type === 'agent.custom_tool_use' && typeof raw.id === 'string') {
          toolCalls++; const args = (raw.input ?? {}) as { a?: unknown; b?: unknown };
          const ok = String(raw.name) === 'add_numbers' && typeof args.a === 'number' && typeof args.b === 'number';
          const text = ok ? String((args.a as number) + (args.b as number)) : 'Only add_numbers with two numbers is allowed.';
          log(`  agent.custom_tool_use ${String(raw.name)} ${JSON.stringify(args)} in thread ${String(raw.session_thread_id ?? 'primary')} → host answers ${text}`);
          await sessions.events.send(session.id, { events: [{ type: 'user.custom_tool_result', custom_tool_use_id: raw.id,
            content: [{ type: 'text', text }], is_error: !ok }] }, { signal: deadline.signal, timeout: 10000 });
        }
        if (raw.type === 'agent.message' && !raw.session_thread_id) final = textOf(raw.content as Array<{ type: string; text?: string }>);
        if (raw.type === 'session.status_terminated') throw new Error('Coordinator session terminated');
        if (event.type === 'session.status_idle' && started && event.stop_reason.type !== 'requires_action') break;
      }
    } finally { stream.controller.abort(); }
    log(`  Coordinator idle after ${((Date.now() - t0) / 1000).toFixed(1)} s · threads ${threads.size} · thread messages sent ${sent} / received ${received} · custom tool calls ${toolCalls}`);
    log(`  Parent final text: "${clip(final)}"`);
    const usage = await usageOf(session.id);
    log(`  One session ${session.id} usage (session-shared, all threads): input ${usage.input} · output ${usage.output}`);
  }
} catch (error) {
  log(`Live run failed: ${error instanceof Anthropic.APIError ? `${error.status} ${error.constructor.name}` : String(error)}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  for (const id of opened) {
    try { await sessions.archive(id, {}, { timeout: 10000 }); const s = await sessions.retrieve(id, {}, { timeout: 5000 });
      log(`Archived ${id}: ${s.archived_at ? 'yes' : 'no'}`);
    } catch (error) { log(`Archive failed for ${id}: ${error instanceof Error ? error.message : String(error)}`); }
  }
}
