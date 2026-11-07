/**
 * Lab 24 live demo: who owns the agent loop?
 * A · Messages API: the application calls the model, runs the tool, and calls the model again.
 * B · Managed session: the platform runs the loop; the host only answers one custom tool pause.
 * Run from the repo root: node --env-file=.env --import tsx _live24.ts
 * Billed: 2 Messages calls + 1 short session turn. The session is archived in finally.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { createInventoryHandler } from '../../server/lib/lab24-harnesses.js';

const env = process.env;
const apiKey = env.ANTHROPIC_API_KEY?.trim(), agentId = env.CLAUDE_MANAGED_AGENT_ID?.trim();
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID?.trim(), model = env.MANAGED_MODEL?.trim() || 'claude-opus-5-5';
if (!apiKey || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30000 });
const deadline = AbortSignal.timeout(120000);

const prompt = "Reserve two NOTEBOOK units for Aurora Finch's field kit with the host tool, then confirm in one short sentence.";
const schema = { type: 'object' as const, properties: { sku: { type: 'string', const: 'NOTEBOOK' },
  quantity: { type: 'integer', minimum: 1, maximum: 10 } }, required: ['sku', 'quantity'], additionalProperties: false };
const description = 'Ask the host to reserve fictional NOTEBOOK stock.';
const short = (text: string, n = 88) => { const t = text.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const run = (inventory: ReturnType<typeof createInventoryHandler>, input: unknown) => {
  const value = input as { sku?: unknown; quantity?: unknown };
  return inventory.execute({ name: 'reserve_stock', input: { sku: 'NOTEBOOK', quantity: Number(value.quantity) } });
};

// A · Messages API: every model call and every tool execution is the application's code.
console.log('== A · Messages API: the application owns the loop ==');
const inventoryA = createInventoryHandler();
const messages: MessageParam[] = [{ role: 'user', content: prompt }];
const tools = [{ name: 'reserve_stock', description, input_schema: schema }];
const first = await client.messages.create({ model, max_tokens: 300, messages, tools }, { signal: deadline });
console.log(`messages.create #1 (${first.model}) · stop_reason ${first.stop_reason}`);
const use = first.content.find((block) => block.type === 'tool_use');
if (!use) throw new Error('No tool_use block returned; stopping.');
console.log(`tool_use block: ${use.name} ${JSON.stringify(use.input)} → the application must run it`);
const effectA = run(inventoryA, use.input);
console.log(`App runs host handler: ${effectA.reason} Stock ${effectA.before} -> ${effectA.after}`);
messages.push({ role: 'assistant', content: first.content },
  { role: 'user', content: [{ type: 'tool_result', tool_use_id: use.id, content: JSON.stringify(effectA), is_error: !effectA.accepted }] });
const second = await client.messages.create({ model, max_tokens: 300, messages, tools }, { signal: deadline });
console.log(`messages.create #2 with 1 tool_result · stop_reason ${second.stop_reason}`);
console.log(`Answer: ${short(second.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join(' '))}`);
console.log(`Model calls made by the app: 2 · tool calls run by the app: 1 · stock ${inventoryA.stock}`);

// B · Managed session: the harness calls the model and iterates; the host answers one custom tool pause.
console.log('== B · Managed session: the platform owns the loop ==');
const inventoryB = createInventoryHandler();
let sessionId: string | undefined;
try {
  const session = await client.beta.sessions.create({
    agent: { type: 'agent_with_overrides', id: agentId, tools: [{ type: 'custom', name: 'reserve_stock', description, input_schema: schema }],
      mcp_servers: [], skills: [] },
    environment_id: environmentId, title: 'Lab 24 live loop owner',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } },
  }, { signal: deadline });
  sessionId = session.id;
  console.log(`Session ${session.id} created · status ${session.status} · tool reserve_stock (custom)`);
  const stream = await client.beta.sessions.events.stream(session.id, {}, { signal: deadline });
  await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal: deadline });
  console.log('user.message sent · the host makes no model call');
  let seen: string[] = [], answer = '', answered = 0, modelRequests = 0;
  const flush = (label: string) => { // wrap long event chains so every line stays short
    let line = `${label}:`;
    for (const [i, type] of seen.entries()) {
      const part = `${i ? ' →' : ''} ${type}`;
      if (line.length + part.length > 104) { console.log(line); line = `  ${part.trim()}`; } else line += part;
    }
    if (seen.length) console.log(line);
    seen = [];
  };
  for await (const event of stream) {
    const raw = event as unknown as { type: string; id?: string; name?: string; input?: unknown; content?: { type: string; text?: string }[];
      stop_reason?: { type: string } };
    if (raw.type.startsWith('user.')) continue;
    if (raw.type === 'span.model_request_start') modelRequests++;
    if (raw.type === 'agent.message') answer += (raw.content ?? []).map((b) => b.text ?? '').join(' ');
    seen.push(raw.type === 'session.status_idle' ? `${raw.type} (${raw.stop_reason?.type})` : raw.type === 'agent.custom_tool_use' ? `${raw.type} ${raw.name}` : raw.type);
    if (raw.type === 'agent.custom_tool_use' && raw.id) {
      if (++answered > 1) throw new Error('More than one custom tool call; stopping.');
      flush('Platform events');
      const effect = run(inventoryB, raw.input);
      console.log(`Host handler: ${JSON.stringify(raw.input)} → ${effect.reason} Stock ${effect.before} -> ${effect.after}`);
      await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.custom_tool_result', custom_tool_use_id: raw.id,
        content: [{ type: 'text', text: JSON.stringify(effect) }], is_error: !effect.accepted }] }, { signal: deadline });
      console.log('user.custom_tool_result sent → the platform resumes its own loop');
    }
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type !== 'requires_action') break;
    if (raw.type === 'session.status_terminated') break;
  }
  flush('Platform events');
  console.log(`Answer: ${short(answer)}`);
  console.log(`Model requests run by the platform (span.model_request_start): ${modelRequests}`);
  console.log(`Model calls made by the host: 0 · custom tool calls answered by the host: ${answered} · stock ${inventoryB.stock}`);
} finally {
  if (sessionId) {
    await client.beta.sessions.archive(sessionId, {}, { timeout: 5000 });
    const after = await client.beta.sessions.retrieve(sessionId, {}, { timeout: 5000 });
    console.log(`Session archived: ${after.archived_at ? 'yes' : 'no'}`);
  }
}
