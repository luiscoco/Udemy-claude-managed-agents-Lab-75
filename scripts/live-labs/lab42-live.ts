/**
 * Lab 42 live demo: a real Managed session whose ONLY tools are the built-in web_search and web_fetch, both under
 * permission policy always_ask, so the host bounds the research. Each paused call is checked with the lab's own
 * guardUrl (HTTPS, exact approved host, no port/credentials/fragment) against a public allowlist
 * (en.wikipedia.org), plus a request cap; the answer's bracketed citations are checked with the lab's verifyCitations.
 * Networking: the shared environment (CLAUDE_MANAGED_ENVIRONMENT_ID) is limited with an empty allowed_hosts, so it
 * blocks web access. When CLAUDE_MANAGED_LAB42_ENVIRONMENT_ID is set, the session runs in that dedicated
 * environment (limited, allowed_hosts only en.wikipedia.org) and web_search uses allowed_domains [en.wikipedia.org].
 * web_fetch keeps no allowed_domains so the host guard is what refuses an off-allowlist URL (shown with example.com).
 * One session, ONE short user turn about a public fact, at most 4 confirmations answered, 150 s deadline.
 * Archived in finally.
 * Run from the repo root: node --env-file=.env --import tsx _live42.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import type { BetaManagedAgentsAgentToolset20260401Params } from '@anthropic-ai/sdk/resources/beta/agents';
import { guardUrl, verifyCitations, Lab42Error } from '../../server/lib/lab42-research.js';

const env = process.env;
const apiKey = env.ANTHROPIC_API_KEY?.trim(), agentId = env.CLAUDE_MANAGED_AGENT_ID?.trim();
const sharedEnvironmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID?.trim(), dedicatedId = env.CLAUDE_MANAGED_LAB42_ENVIRONMENT_ID?.trim();
const environmentId = dedicatedId || sharedEnvironmentId;
if (!apiKey || !agentId || !environmentId || !sharedEnvironmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30000 });
const deadline = AbortSignal.timeout(150000);
const ALLOWED_HOST = 'en.wikipedia.org', MAX_REQUESTS = 3, MAX_CONFIRMATIONS = 4, MAX_TOOL_USES = 5;
const short = (text: string, n = 60) => { const t = text.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const hide = (id: string) => id.replace(/^(sevt_[A-Za-z0-9]{6})[A-Za-z0-9]{6,}([A-Za-z0-9]{4})$/, '$1••••••••$2');

// Only the two web tools are enabled; every call pauses for the host (always_ask).
const ask = { type: 'always_ask' as const };
const toolsetWith = (domains?: string[]): BetaManagedAgentsAgentToolset20260401Params => ({ type: 'agent_toolset_20260401',
  default_config: { enabled: false },
  configs: [{ name: 'web_search', enabled: true, permission_policy: ask, ...(domains ? { allowed_domains: domains } : {}) },
    { name: 'web_fetch', enabled: true, permission_policy: ask, max_content_tokens: 3000 }] });

let confirmations = 0, allowed = 0;
const sources: { evidenceId: string; url: string; inspected: boolean }[] = [];
const pendingFetch = new Map<string, string>();

// The host policy: web_search is allowed (only a query, no URL); web_fetch must pass
// the lab's guardUrl for the approved host. Both share one request cap.
function decide(name: string, input: Record<string, unknown>) {
  if (allowed >= MAX_REQUESTS) return { ok: false, why: `request cap ${MAX_REQUESTS} reached` };
  if (name === 'web_fetch') {
    try { guardUrl(String(input.url ?? ''), ALLOWED_HOST); }
    catch (error) { return { ok: false, why: error instanceof Lab42Error ? error.message : 'URL refused.' }; }
  } else if (name !== 'web_search') return { ok: false, why: 'tool not in the research policy' };
  allowed++; return { ok: true, why: `request ${allowed}/${MAX_REQUESTS}` };
}

const create = (domains?: string[]) => client.beta.sessions.create({
  agent: { type: 'agent_with_overrides', id: agentId, tools: [toolsetWith(domains)], mcp_servers: [], skills: [],
    system: 'You answer short research questions about public facts. Use only web_search and web_fetch. '
      + 'If a call is denied, do not retry it; continue with what is allowed. Always cite the exact URL you used.' },
  environment_id: environmentId, title: 'Lab 42 live bounded research',
  budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } },
}, { signal: deadline });

let sessionId: string | undefined;
const hostsOf = async (id: string) => { const e = await client.beta.environments.retrieve(id, {}, { signal: deadline });
  const n = e.config.type === 'cloud' ? e.config.networking : null;
  return { e, line: `networking ${n?.type ?? '-'}` + (n?.type === 'limited' ? ` · allowed_hosts: ${n.allowed_hosts.length ? n.allowed_hosts.join(', ') : 'none'}` : '') }; };
try {
  if (dedicatedId) console.log(`Shared environment ${sharedEnvironmentId} · ${(await hostsOf(sharedEnvironmentId)).line} (blocks web)`);
  const { e: environment, line } = await hostsOf(environmentId);
  console.log(`${dedicatedId ? 'Lab 42 environment' : 'Environment'} ${environment.id} "${environment.name}" · ${line}`);
  const session = await create(dedicatedId ? [ALLOWED_HOST] : undefined);
  sessionId = session.id;
  const enabled = (session.agent.tools.find((t) => t.type === 'agent_toolset_20260401') as { configs: { name: string; enabled: boolean;
    permission_policy: { type: string }; allowed_domains?: string[] }[] } | undefined)?.configs
    .flatMap((c) => c.enabled ? [`${c.name} ${c.permission_policy.type}${c.allowed_domains?.length ? ` [${c.allowed_domains.join(', ')}]` : ''}`] : []).join(', ');
  console.log(`Session ${session.id} created · status ${session.status}`);
  console.log(`  tools: ${enabled}`);
  console.log(`Host policy: web_fetch only https://${ALLOWED_HOST} (lab guardUrl) · max ${MAX_REQUESTS} requests`);
  const prompt = 'In what year did the Eiffel Tower open? Use web_fetch on https://www.example.com/eiffel-tower first, then on '
    + 'https://en.wikipedia.org/wiki/Eiffel_Tower. Answer in one sentence and cite the exact URL you used in square brackets.';
  console.log('user.message: In what year did the Eiffel Tower open? (fetch example.com, then Wikipedia)');
  const stream = await client.beta.sessions.events.stream(session.id, {}, { signal: deadline });
  await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal: deadline });
  let uses = 0, pauses = 0, reply = '', stop = '';
  for await (const event of stream) {
    const raw = event as unknown as { type: string; id?: string; name?: string; input?: Record<string, unknown>;
      evaluated_permission?: string; tool_use_id?: string; is_error?: boolean | null;
      content?: { type: string; text?: string }[]; stop_reason?: { type: string } };
    if (raw.type === 'agent.message') reply += (raw.content ?? []).map((b) => b.text ?? '').join(' ');
    if (raw.type === 'agent.tool_use' && raw.id) {
      const name = raw.name ?? '?', target = String(raw.input?.url ?? raw.input?.query ?? '-');
      if (++uses > MAX_TOOL_USES) {
        await client.beta.sessions.events.send(session.id, { events: [{ type: 'user.interrupt' }] }, { signal: deadline });
        console.log(`  cap of ${MAX_TOOL_USES} tool uses reached → user.interrupt sent`); stop = 'interrupted'; break;
      }
      console.log(`agent.tool_use ${name} ${short(target, 52)} (${hide(raw.id)}) · ${raw.evaluated_permission ?? '-'}`);
      if (raw.evaluated_permission === 'ask') {
        if (++confirmations > MAX_CONFIRMATIONS) throw new Error('Confirmation cap reached.');
        const verdict = decide(name, raw.input ?? {});
        if (verdict.ok && name === 'web_fetch') pendingFetch.set(raw.id, target);
        await client.beta.sessions.events.send(session.id, { events: [verdict.ok
          ? { type: 'user.tool_confirmation', tool_use_id: raw.id, result: 'allow' }
          : { type: 'user.tool_confirmation', tool_use_id: raw.id, result: 'deny', deny_message: `Host research policy: ${verdict.why}` }] }, { signal: deadline });
        console.log(`  host → ${verdict.ok ? 'allow' : 'deny'} (${verdict.why})`);
      }
    }
    if (raw.type === 'agent.tool_result' && raw.tool_use_id) {
      const body = (raw.content ?? []).map((b) => b.text ?? `[${b.type}]`).join(' ') || '(empty)';
      const url = pendingFetch.get(raw.tool_use_id);
      if (url) sources.push({ evidenceId: url, url, inspected: !raw.is_error });
      console.log(`  agent.tool_result: ${raw.is_error ? 'is_error' : 'ok'} · ${short(body, 70)}`);
    }
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type === 'requires_action') pauses++;
    if (raw.type === 'session.status_idle' && raw.stop_reason?.type !== 'requires_action') { stop = raw.stop_reason?.type ?? 'idle'; break; }
    if (raw.type === 'session.status_terminated') { stop = 'terminated'; break; }
  }
  console.log(`Agent: ${short(reply || '(no message)', 100)}`);
  console.log(`  stop: ${stop} · tool uses: ${Math.min(uses, MAX_TOOL_USES)} · requires_action pauses: ${pauses} · confirmations: ${confirmations}`);
  // URLs without trailing Markdown or punctuation (e.g. "**:" or "."); bracketed ones are the citations.
  const clean = (u: string) => u.replace(/[*_`'".,:;!?)\]]+$/, '');
  const bracketed = [...reply.matchAll(/\[(https?:\/\/[^\]\s]+)\]/g)].map((m) => clean(m[1]!));
  const cited = [...new Set(bracketed.length ? bracketed : (reply.match(/https?:\/\/[^\s\])>,*`]+/g) ?? []).map(clean))];
  const onAllowlist = cited.filter((u) => { try { guardUrl(u, ALLOWED_HOST); return true; } catch { return false; } });
  console.log(`Cited: ${cited.length ? cited.map((u) => short(u, 50)).join(', ') : 'none'} · on allowlist: ${onAllowlist.length}/${cited.length}`);
  console.log(`Citations verified against host-allowed fetches (lab verifyCitations): ${cited.length ? verifyCitations(cited, sources) : false}`);
} finally {
  if (sessionId) {
    await client.beta.sessions.archive(sessionId, {}, { timeout: 5000 });
    const after = await client.beta.sessions.retrieve(sessionId, {}, { timeout: 5000 });
    console.log(`Session archived: ${after.archived_at ? 'yes' : 'no'} · usage ${after.usage.input_tokens ?? 0} in, ${after.usage.output_tokens ?? 0} out tokens`);
  }
}
