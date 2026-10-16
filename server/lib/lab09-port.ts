import Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import { lab09RequestSchema } from '../../shared/lab09-system-prompts.js';
import type { Lab09Request, Lab09Composition, Lab09Effective } from '../../shared/lab09-system-prompts.js';
import { composeLab09 } from './lab09-composer.js';
import { createLiveLab01Port } from './lab01-port.js';
import type { Lab01Port } from './lab01-port.js';
import { createFixtureLab02Port } from './lab02-port.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { agentVersion } from './tool-session-port.js';
import { LabError } from './lab01-run.js';

export type Lab09Port = Lab01Port & { composition: Lab09Composition | null; effective: Lab09Effective | null };
export function lab09SessionParams(input: Lab09Request, base: { id: string; version: number; system: string | null }, env = process.env): SessionCreateParams {
  const request = lab09RequestSchema.parse(input); const composition = composeLab09(request, base.system);
  if (request.deadlineSeconds * 1000 > managedSettings(env).deadlineMs) throw new Error('Deadline exceeds server policy.');
  return { agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
    ...(composition.overrideIncluded ? { system: composition.configuredSystem } : {}), tools: [], mcp_servers: [], skills: [] },
    environment_id: managedResourceIds(env).environmentId, title: `Lab 09 ${request.variant}`,
    budget: { type: 'limit', max_list_cost: { amount: String(request.budgetCents), currency: 'USD' } } };
}
export function createLiveLab09Port(input: Lab09Request, sdk?: Anthropic, env = process.env): Lab09Port {
  const request = lab09RequestSchema.parse(input); const client = sdk ?? createManagedClient(env); const base = createLiveLab01Port(client, env);
  const port: Lab09Port = { ...base, composition: null, effective: null, async create() {
    const version = agentVersion(env); const agent = await client.beta.agents.retrieve(managedResourceIds(env).agentId, version ? { version } : {}, { timeout: 3000 });
    if (agent.multiagent) throw new LabError('Lab 09 requires a single-agent base; no session was created.');
    port.composition = composeLab09(request, agent.system);
    const session = await client.beta.sessions.create(lab09SessionParams(request, agent, env), { timeout: 5000 });
    const resolved = session.agent;
    port.effective = { agentId: resolved.id, agentVersion: resolved.version, model: resolved.model.id, system: resolved.system,
      systemSource: port.composition.overrideIncluded ? 'overridden' : 'inherited', tools: resolved.tools.length, mcpServers: resolved.mcp_servers.length, skills: resolved.skills.length };
    if (resolved.id !== agent.id || resolved.version !== agent.version || resolved.system !== port.composition.configuredSystem || resolved.model.id !== agent.model.id) {
      // create() has not returned its ID to the shared runner yet, so it cannot
      // clean up this freshly created session on our behalf.
      const archived = await client.beta.sessions.archive(session.id, {}, { timeout: 3000 }).then(() => true, () => false);
      throw new LabError(`Resolved session differs from the requested base reference, model or system; no prompt was sent. Session ${session.id}: cleanup ${archived ? 'archived' : 'pending; inspect the owned session before retrying'}.`);
    }
    return { source: 'managed-api', id: session.id, status: session.status, agentId: resolved.id, agentVersion: resolved.version,
      environmentId: session.environment_id, budget: session.budget ? `${session.budget.max_list_cost.amount} USD` : null,
      toolCount: resolved.tools.length + resolved.skills.length + (resolved.multiagent ? 1 : 0), mcpServerCount: resolved.mcp_servers.length };
  } };
  return port;
}
export function createFixtureLab09Port(input: Lab09Request, stepMs = 20): Lab09Port {
  const request = lab09RequestSchema.parse(input); const composition = composeLab09(request, 'Be a concise, accurate project assistant. Do not invent project facts.');
  const fixture = createFixtureLab02Port({ mode: 'scripted', prompt: request.prompt, scenario: request.scenario, model: 'claude-sonnet-5-5', system: { choice: 'inherit' },
    budgetCents: request.budgetCents, previews: false, deadlineSeconds: request.deadlineSeconds }, stepMs);
  const answers = { base: 'Authored fixture: project facts are unknown without explicit context.', custom: 'Authored fixture: the custom instruction replaces the base system.',
    'base-plus-append': 'Authored fixture: the base and appended instruction are composed explicitly.', 'base-plus-project-context': 'Authored fixture: Aurora Finch is a community bird observation notebook. Prioritize offline capture and accessible forms.' };
  return { ...fixture, composition, effective: { agentId: 'agent_fixture', agentVersion: 1, model: 'fixture-base-model', system: composition.configuredSystem,
    systemSource: composition.overrideIncluded ? 'overridden' : 'inherited', tools: 0, mcpServers: 0, skills: 0 },
    async open(id, signal) { const events = await fixture.open(id, signal); return (async function* () { for await (const event of events)
      yield event.type === 'agent.message' && request.scenario === 'normal' ? { ...event, content: [{ type: 'text' as const, text: answers[request.variant] }] } : event; })(); } };
}
