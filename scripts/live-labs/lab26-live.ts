// Lab 26 live demo: real session controls on Claude Managed Agents (billed; one short user turn, interrupted).
// Run from the repo root: node --env-file=.env --import tsx _live26.ts
import Anthropic from '@anthropic-ai/sdk';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID in .env.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000 });
const sessions = client.beta.sessions;
const deadline = Date.now() + 120_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const budget = (cents: number) => ({ type: 'limit' as const, max_list_cost: { amount: String(cents), currency: 'USD' as const } });
const cents = (s: { budget: { max_list_cost?: { amount: string } } | null }) => `${s.budget?.max_list_cost?.amount ?? '?'} cents`;
const why = (error: unknown) => error instanceof Anthropic.APIError
  ? `${error.status} ${error.constructor.name} (${error.type ?? 'error'})` : String(error);

async function waitFor(id: string, wanted: string, maxMs: number) {
  const start = Date.now();
  while (Date.now() - start < maxMs && Date.now() < deadline) {
    const s = await sessions.retrieve(id);
    if (s.status === wanted) return { session: s, seconds: ((Date.now() - start) / 1000).toFixed(1) };
    await sleep(250);
  }
  return null;
}

let sessionId: string | undefined, archived = false;
try {
  const agent = await client.beta.agents.retrieve(agentId);
  const session = await sessions.create({
    agent: { type: 'agent_with_overrides', id: agent.id, version: agent.version, tools: [], mcp_servers: [], skills: [],
      system: 'You write short fictional field notes. No tools are needed.' },
    environment_id: environmentId, title: 'Lab 26 session controls', budget: budget(25) });
  sessionId = session.id;
  console.log(`Session ${session.id} created · status ${session.status} · budget ${cents(session)}`);

  await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text',
    text: 'Write about 300 words of fictional field notes by Aurora Finch on a heron colony at dawn.' }] }] });
  console.log('user.message sent (a longer answer)');
  const running = await waitFor(session.id, 'running', 15000);
  console.log(running ? `Status running after ${running.seconds} s` : 'Status did not reach running');

  try {
    await sessions.update(session.id, { agent: { tools: [] } });
    console.log('Replace tools while running → accepted');
  } catch (error) { console.log(`Replace tools while running → refused: ${why(error)}`); }

  await sessions.events.send(session.id, { events: [{ type: 'user.interrupt' }] });
  console.log('user.interrupt sent');
  const idle = await waitFor(session.id, 'idle', 30000);
  console.log(idle ? `Polled sessions.retrieve → status idle after ${idle.seconds} s (confirmed idle)` : 'Idle NOT confirmed');

  const replaced = await sessions.update(session.id, { agent: { tools: [], mcp_servers: [] } });
  console.log(`Replace tools while idle → accepted · tools ${replaced.agent.tools.length}, MCP servers ${replaced.agent.mcp_servers.length}`);

  const raised = await sessions.update(session.id, { budget: budget(30) });
  console.log(`Budget raised after host opt-in → ${cents(raised)}`);

  await sessions.update(session.id, { title: 'Aurora Finch heron notes', metadata: { lab: '26', handoff: 'summary-only' } });
  const after = await sessions.retrieve(session.id);
  console.log(`Retrieved title: ${after.title}`);
  console.log(`Retrieved metadata: ${JSON.stringify(after.metadata)}`);

  const events = await sessions.events.list(session.id, { limit: 20, order: 'asc' });
  const types = events.data.map(event => event.type).filter(type => type.startsWith('user.') || type === 'agent.message');
  console.log(`History: ${[...new Set(types)].join(', ')}`);

  await sessions.archive(session.id);
  archived = true;
  const final = await sessions.retrieve(session.id);
  console.log(`Archived: ${final.archived_at ? 'yes' : 'no'} · archived_at ${final.archived_at}`);
  try {
    await sessions.update(session.id, { title: 'After archive' });
    console.log('Update after archive → accepted');
  } catch (error) { console.log(`Update after archive → refused: ${why(error)}`); }
  console.log(`Usage: ${final.usage.input_tokens ?? 0} input, ${final.usage.output_tokens ?? 0} output tokens`);
} catch (error) {
  console.log(`Live run failed: ${why(error)}`);
  process.exitCode = 1;
} finally {
  if (sessionId && !archived) { try { await sessions.archive(sessionId); console.log('Cleanup: archived'); } catch { console.log('Cleanup: archive failed'); } }
}
