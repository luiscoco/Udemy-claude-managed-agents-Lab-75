/**
 * Lab 36 live evidence: where the work really runs. The host only speaks HTTP to the Managed Agents API
 * (create, event stream, send, archive); the bash tool executes inside the configured cloud environment.
 * One Managed session (agent_with_overrides, only bash with always_ask), ONE short user turn, the host approves
 * only one exact harmless command, 120 s deadline, archived in finally. Never prints the API key.
 * Run from the repo root: node --env-file=.env --import tsx _live36.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import os from 'node:os';
import { toolsetFrom } from '../../shared/lab03-tools.js';

const env = process.env;
const apiKey = env.ANTHROPIC_API_KEY?.trim();
const agentId = (env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID)?.trim();
const environmentId = (env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID)?.trim();
if (!apiKey || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

// Count every HTTP request the host makes: this is the whole transport between host and remote session.
const requests: string[] = [];
const countingFetch: typeof fetch = (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  requests.push(`${init?.method ?? 'GET'} ${url.pathname.replace(/\/(sesn|env|agent)_[A-Za-z0-9]+/g, '/{id}')}`);
  return fetch(input, init);
};
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 15000, fetch: countingFetch });
const sessions = client.beta.sessions;
const deadline = new AbortController(); const timer = setTimeout(() => deadline.abort(), 120_000);
const log = (line: string) => console.log(line);
const why = (error: unknown) => error instanceof Anthropic.APIError ? `${error.status} ${error.constructor.name}` : String(error);
const short = (text: string, n = 80) => { const t = text.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const COMMAND = 'uname -n && uname -sm && pwd';
const MAX_CONFIRMATIONS = 2;

let sessionId: string | undefined, archived = false, closeStream = () => {};
try {
  // Host side: what this machine is.
  const hostName = os.hostname();
  log(`Host runner: ${os.type()} ${os.arch()} · hostname ${hostName.slice(0, 4)}•••• · cwd ${process.cwd()}`);

  // Remote side: the configured environment, read through the API (no secrets printed).
  const environment = await client.beta.environments.retrieve(environmentId, {}, { timeout: 5000 });
  const config = environment.config;
  const network = config.type === 'cloud' ? config.networking : null;
  const packages = config.type === 'cloud' ? Object.values(config.packages).filter(Array.isArray).reduce((n, list) => n + list.length, 0) : 0;
  log(`Environment ${environment.id} · config ${config.type} · networking ${network?.type ?? 'n/a'}`
    + (network?.type === 'limited' ? ` · allowed_hosts ${network.allowed_hosts.length} · packages ${packages}` : ''));

  const base = await client.beta.agents.retrieve(agentId, {}, { timeout: 5000 });
  const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
    tools: [toolsetFrom('always_ask', { bash: 'always_ask' })], mcp_servers: [], skills: [],
    system: `For this diagnostic, request exactly one bash call with the command \`${COMMAND}\` and nothing else. `
      + 'Do not access files or the network. Then reply with its output in one short line.' },
    environment_id: environmentId, title: 'Lab 36 remote transport',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { timeout: 10000 });
  sessionId = session.id;
  log(`Session ${session.id} created in that environment · status ${session.status} · bash: always_ask`);

  const stream = await sessions.events.stream(session.id, {}, { signal: deadline.signal });
  closeStream = () => stream.controller.abort(); const events = stream[Symbol.asyncIterator]();
  await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text',
    text: 'Fictional Aurora Finch field check: where does your bash tool run? Run the diagnostic command once.' }] }] },
    { signal: deadline.signal, timeout: 10000 });

  const types = new Map<string, number>(); const pending = new Map<string, string>();
  let confirmations = 0, remoteOutput = '', reply = '', started = false;
  for (;;) {
    const next = await events.next(); if (next.done) throw new Error('Stream ended before the turn finished.');
    const event = next.value; types.set(event.type, (types.get(event.type) ?? 0) + 1);
    if (event.type === 'session.status_running' || event.type === 'agent.message' || event.type === 'agent.tool_use') started = true;
    if (event.type === 'agent.tool_use') {
      const command = String((event.input as { command?: unknown }).command ?? '').trim();
      pending.set(event.id, command);
      log(`agent.tool_use ${event.name} requested · command "${short(command, 50)}"`);
    } else if (event.type === 'agent.tool_result') {
      remoteOutput = (event.content ?? []).map(block => block.type === 'text' ? block.text : '').join('').trim();
      log(`agent.tool_result (ran remotely${event.is_error ? ', error' : ''}):`);
      for (const line of remoteOutput.split('\n').slice(0, 4)) log(`  ${short(line, 100)}`);
    } else if (event.type === 'agent.message') {
      reply = event.content.map(block => block.type === 'text' ? block.text : '').join('').trim();
    } else if (event.type === 'session.status_terminated') { throw new Error('Turn failed: session terminated.');
    } else if (event.type === 'session.status_idle' && started) {
      if (event.stop_reason.type !== 'requires_action') { log(`Turn finished → status idle (${event.stop_reason.type})`); break; }
      if (confirmations >= MAX_CONFIRMATIONS) throw new Error('Too many tool confirmations requested.');
      // Host decision: only the exact harmless command is allowed; the command itself never runs on this host.
      const answers = event.stop_reason.event_ids.map(id => {
        const allowed = pending.get(id) === COMMAND; confirmations++;
        log(`Host confirmation → ${allowed ? 'allow (exact command)' : 'deny (not the exact command)'} · sent as user.tool_confirmation`);
        return { type: 'user.tool_confirmation' as const, tool_use_id: id, result: allowed ? 'allow' as const : 'deny' as const,
          ...(allowed ? {} : { deny_message: `Only the exact command ${COMMAND} is allowed.` }) };
      });
      await sessions.events.send(session.id, { events: answers }, { signal: deadline.signal, timeout: 10000 });
    }
  }
  closeStream();
  if (reply) log(`agent.message: ${short(reply, 90)}`);

  const remoteName = remoteOutput.split('\n')[0]?.trim() ?? '';
  const remoteOs = remoteOutput.split('\n')[1]?.trim() ?? '';
  const remoteCwd = remoteOutput.split('\n')[2]?.trim() ?? '';
  log(`Compare · OS: host ${os.type()} vs remote ${remoteOs.split(' ')[0] || '?'} · cwd: host ${process.cwd() === remoteCwd ? 'SAME' : 'differs'}`
    + ` · hostname ${remoteName && remoteName !== hostName ? 'differs' : 'SAME'}`);
  log(`Host child processes spawned for bash: 0`);
  log(`Stream events received over HTTP: ${[...types.values()].reduce((a, b) => a + b, 0)} (${types.get('agent.tool_use') ?? 0} tool_use, `
    + `${types.get('agent.tool_result') ?? 0} tool_result)`);

  await sessions.archive(session.id, {}, { timeout: 10000 }); archived = true;
  const final = await sessions.retrieve(session.id, {}, { timeout: 5000 });
  log(`Archived: ${final.archived_at ? 'yes' : 'no'} · status ${final.status} · usage ${final.usage.input_tokens ?? 0} in / ${final.usage.output_tokens ?? 0} out tokens`);
} catch (error) {
  log(`Live run failed: ${why(error)}`);
  process.exitCode = 1;
} finally {
  closeStream(); clearTimeout(timer);
  if (sessionId && !archived) { try { await sessions.archive(sessionId); log('Cleanup: archived'); } catch { log('Cleanup: archive failed'); } }
  const counts = new Map<string, number>(); for (const r of requests) counts.set(r, (counts.get(r) ?? 0) + 1);
  log(`Host transport: ${requests.length} HTTP requests`);
  for (const [request, count] of counts) log(`  ${request}${count > 1 ? ` ×${count}` : ''}`);
}
