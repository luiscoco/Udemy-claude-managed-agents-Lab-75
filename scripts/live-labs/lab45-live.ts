// Lab 45 live evidence: provider availability and configuration, resolved by the lab's own code and proven on the
// first-party Claude API only. Run from the repo root: node --env-file=.env --import tsx _live45.ts
// Billed: read-only lookups plus one session with one short user turn (no tools), 120 s deadline; archived in `finally`.
// The AWS path is inspected locally (awsReadiness: presence and format only). No AWS client request is made, no
// AWS-specific value is used for a call, and no secret or AWS value is printed.
import Anthropic from '@anthropic-ai/sdk';
import { Lab45Providers } from '../../server/lib/lab45-providers.js';
import { awsReadiness } from '../../server/lib/lab45-aws.js';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
const model = env.MANAGED_MODEL?.trim();
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
  openTelemetry: { propagation: false, traces: { enabled: false } } });
const sessions = client.beta.sessions;
const deadline = Date.now() + 120_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const log = (line: string) => console.log(line);
const yes = (value: unknown) => value ? 'yes' : 'no';
const why = (error: unknown) => error instanceof Anthropic.APIError ? `${error.status} ${error.constructor.name}` : String(error);
const textOf = (event: { content?: Array<{ type: string; text?: string }> }) =>
  (event.content ?? []).map(block => block.type === 'text' ? block.text ?? '' : '').join(' ').trim();
let apiCalls = 0;
const call = <T>(promise: Promise<T>) => { apiCalls++; return promise; };

type Event = Awaited<ReturnType<typeof sessions.events.list>>['data'][number];
async function history(id: string) {
  const page = await call(sessions.events.list(id, { limit: 50, order: 'asc' }, { timeout: 10000 }));
  return page.data as Event[];
}

const providers = new Lab45Providers(env);
let sessionId: string | undefined, archived = false;
try {
  // 1. The lab's own resolution, host-only: no provider request.
  const facts = providers.facts(); const catalog = providers.catalog();
  const enabled = catalog.targets.filter(item => item.managedRouteEnabled);
  log(`Lab45Providers.facts(): first-party configured ${yes(facts.firstParty.configured)} · SDK Managed types ${yes(facts.firstParty.sdkCompatible)}`
    + ` · providerCalls ${facts.providerCalls}`);
  log(`Catalog: ${catalog.targets.length} provider paths · Managed route enabled: ${enabled.map(item => item.id).join(', ')}`);
  const direct = providers.same('claude-api');
  log(`same('claude-api') → ${direct.distinction}`);
  log(`Resolved provider: ${enabled[0].label} · auth: ${enabled[0].authShape} · model: ${model ?? 'agent default'}`);

  // 2. Real read-only checks on the first-party API.
  if (model) {
    const info = await call(client.models.retrieve(model, {}, { timeout: 10000 }));
    log(`models.retrieve('${model}') → "${info.display_name}" · lifecycle ${info.lifecycle}`);
  }
  const listed = await call(client.models.list({ limit: 100 }, { timeout: 10000 }));
  log(`models.list → ${listed.data.length} models for this key · configured model listed: ${yes(listed.data.some(item => item.id === model))}`);
  const agent = await call(client.beta.agents.retrieve(agentId, {}, { timeout: 10000 }));
  log(`agents.retrieve ${agent.id} → version ${agent.version} · model ${agent.model.id} · archived ${yes(agent.archived_at)}`);
  const environment = await call(client.beta.environments.retrieve(environmentId, {}, { timeout: 10000 }));
  const network = environment.config.type === 'cloud' ? environment.config.networking.type : 'n/a';
  log(`environments.retrieve ${environment.id} → ${environment.config.type} · networking ${network} · archived ${yes(environment.archived_at)}`);

  // 3. One tiny session turn proves the route is available, not just documented.
  const session = await call(sessions.create({ agent: { type: 'agent_with_overrides', id: agent.id, version: agent.version,
    tools: [], mcp_servers: [], skills: [], system: 'You write one-sentence fictional field notes. No tools are needed.' },
    environment_id: environment.id, title: 'Lab 45 provider availability',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { timeout: 10000 }));
  sessionId = session.id;
  log(`Session ${session.id} created · status ${session.status}`);
  const start = Date.now();
  await call(sessions.events.send(session.id, { events: [{ type: 'user.message',
    content: [{ type: 'text', text: 'One sentence of fictional Aurora Finch field notes about a heron at dawn.' }] }] }));
  let events: Event[] = [];
  while (Date.now() < deadline) {
    events = await history(session.id);
    if (events.some(event => event.type === 'session.status_idle')) break;
    await sleep(1000);
  }
  const replies = events.filter(event => event.type === 'agent.message');
  const idle = events.some(event => event.type === 'session.status_idle');
  log(`Turn 1 user.message → ${idle ? `idle after ${((Date.now() - start) / 1000).toFixed(1)} s` : 'idle NOT reached'} · agent.message ${replies.length}`);
  const reply = replies.at(-1);
  if (reply && reply.type === 'agent.message') { const text = textOf(reply); log(`  Agent: ${text.length > 80 ? `${text.slice(0, 80)}...` : text}`); }
  await call(sessions.archive(session.id)); archived = true;
  const final = await call(sessions.retrieve(session.id));
  log(`Archived: ${yes(final.archived_at)} · final status ${final.status}`);

  // 4. The AWS path: local readiness only (presence and format), never called here.
  const aws = awsReadiness(env);
  log(`claude-platform-aws: LAB45_AWS_LIVE_ENABLED ${yes(aws.enabled)} · fields present ${5 - aws.missing.length}/5 · ready ${yes(aws.ready)}`);
  log(`claude-platform-aws: ${aws.ready ? 'configured' : 'setup incomplete'} and NOT exercised · checkAwsResources() not called · AWS requests 0`);
  log(`First-party API calls in this run: ${apiCalls} · Lab45Providers provider calls: ${providers.catalog().providerCalls}`);
} catch (error) {
  log(`Live run failed: ${why(error)}`);
  process.exitCode = 1;
} finally {
  providers.close();
  if (sessionId && !archived) { try { await sessions.archive(sessionId); log('Cleanup: archived'); } catch { log('Cleanup: archive failed'); } }
}
