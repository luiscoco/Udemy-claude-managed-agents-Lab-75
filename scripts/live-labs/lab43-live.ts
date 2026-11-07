/**
 * Lab 43 live demo: a real Managed agent asks for MCP resources through a custom tool; the host answers each call
 * with the lab's own Lab43Bridge, which drives the lab's loopback MCP server (mcp-servers/lab43-resources.ts),
 * enforces the server-owned URI allowlist, the bearer token and the 1200-byte bound, and returns the bounded result
 * through user.custom_tool_result. A disallowed URI is refused before transport. No URL MCP server is attached.
 * One session (agent_with_overrides: custom tool read_approved_resource, no MCP servers), ONE short user turn,
 * at most 4 custom tool calls answered, 120 s deadline. The session is archived in finally.
 * Run from the repo root: node --env-file=.env --import tsx _live43.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { Lab43Bridge } from '../../server/lib/lab43-mcp-bridge.js';

const env = process.env;
const apiKey = env.ANTHROPIC_API_KEY?.trim(), agentId = env.CLAUDE_MANAGED_AGENT_ID?.trim();
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID?.trim();
if (!apiKey || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30000 });
const deadline = AbortSignal.timeout(120000);
const MAX_CALLS = 4;
const short = (text: string, n = 84) => { const t = text.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const hide = (id: string) => id.replace(/^(sevt_[A-Za-z0-9]{6})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})$/, '$1••••••••$2');

const tools = [{ type: 'custom' as const, name: 'read_approved_resource',
  description: 'Read one fictional MCP resource by URI through the host bridge. The host decides which URIs are allowed.',
  input_schema: { type: 'object' as const, properties: { uri: { type: 'string', maxLength: 180 } }, required: ['uri'], additionalProperties: false } }];
const bridge = new Lab43Bridge(), owner = 'lab43-live';

// The host bridge: the lab's own Lab43Bridge reads the URI the agent proposed, or refuses it.
async function answer(eventId: string, uri: string) {
  let view = await bridge.run(owner, 'versioned-resource', uri);
  if (view.tokenStatus === 'expired') {
    const fresh = await bridge.auth(owner, true, true);
    console.log(`  bridge token expired → refreshed ${fresh.tokenPreview}`);
    view = await bridge.run(owner, 'versioned-resource', uri);
  }
  if (view.status === 'allowed') {
    const text = (JSON.parse(view.result ?? '{}') as { contents?: { text?: string }[] }).contents?.[0]?.text ?? '';
    console.log(`  host bridge → ${view.method} allowed · version ${view.resourceVersion} · ${view.resultBytes} bytes · "${text}"`);
  } else console.log(`  host bridge → refused: ${view.reason} · ${view.resultBytes} bytes`);
  const content = view.customToolResult?.content ?? `Refused by host: ${view.reason}`;
  return { type: 'user.custom_tool_result' as const, custom_tool_use_id: eventId, is_error: view.status !== 'allowed',
    content: [{ type: 'text' as const, text: content }] };
}

let sessionId: string | undefined;
try {
  console.log(`Lab 43 bridge: ${bridge.facts().bridge} · direct Managed MCP: ${bridge.facts().directManagedMcp}`);
  const session = await client.beta.sessions.create({
    agent: { type: 'agent_with_overrides', id: agentId, tools, mcp_servers: [], skills: [],
      system: 'You read fictional field data only through read_approved_resource. If the host refuses a URI, do not retry it.' },
    environment_id: environmentId, title: 'Lab 43 live MCP resource bridge',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } },
  }, { signal: deadline });
  sessionId = session.id;
  console.log(`Session ${session.id} created · status ${session.status} · session MCP servers: ${session.agent.mcp_servers.length}`);
  const consent = await bridge.auth(owner, true);
  console.log(`Local consent: ${consent.consent} · token ${consent.tokenPreview} (${consent.tokenStatus}) · ${consent.transport}`);
  const listed = await bridge.inventory(owner, 'resources/list') as { result: { resources: { uri: string }[] } };
  console.log(`resources/list: ${listed.result.resources.map((r) => r.uri).join(', ')} · allowlist: observations/v1, /v2`);
  const stream = await client.beta.sessions.events.stream(session.id, {}, { signal: deadline });
  console.log('Turn 1 · user.message: read private/unknown, observations/v1 and /v2; compare the counts');
  await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text:
    "For Aurora Finch's fictional field notes, use read_approved_resource on lab43://private/unknown, "
    + 'lab43://observations/v1 and lab43://observations/v2. Then say in one short sentence how the count changed '
    + 'between versions and which URI was refused.' }] }] }, { signal: deadline });
  let calls = 0, reply = '', stop = '';
  for await (const event of stream) {
    const raw = event as unknown as { type: string; id?: string; name?: string; input?: { uri?: string };
      content?: { type: string; text?: string }[]; stop_reason?: { type: string } };
    if (raw.type === 'agent.message') reply = (raw.content ?? []).map((b) => b.text ?? '').join(' ');
    if (raw.type === 'agent.custom_tool_use' && raw.id) {
      if (++calls > MAX_CALLS) {
        await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.interrupt' }] }, { signal: deadline });
        console.log(`  cap of ${MAX_CALLS} custom tool calls reached → user.interrupt sent`); stop = 'interrupted'; break;
      }
      console.log(`agent.custom_tool_use ${raw.name} (${hide(raw.id)}) uri: ${short(raw.input?.uri ?? '-', 40)}`);
      const result = await answer(raw.id, raw.input?.uri ?? '');
      await client.beta.sessions.events.send(session.id, { events: [result] }, { signal: deadline });
      console.log(`  user.custom_tool_result sent · is_error ${result.is_error}`);
    }
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type !== 'requires_action') { stop = raw.stop_reason?.type ?? 'idle'; break; }
    if (raw.type === 'session.status_terminated') { stop = 'terminated'; break; }
  }
  console.log(`Agent: ${short(reply || '(no message)', 96)}`);
  console.log(`  turn stop: ${stop} · custom tool calls answered: ${Math.min(calls, MAX_CALLS)}`);
  console.log(`Host cache keys: ${bridge.cacheView(owner).cachedKeys.join(', ') || 'none'}`);
} finally {
  await bridge.close();
  if (sessionId) {
    await client.beta.sessions.archive(sessionId, {}, { timeout: 5000 });
    const after = await client.beta.sessions.retrieve(sessionId, {}, { timeout: 5000 });
    console.log(`Session archived: ${after.archived_at ? 'yes' : 'no'} · usage ${after.usage.input_tokens ?? 0} in, ${after.usage.output_tokens ?? 0} out tokens`);
  }
}
