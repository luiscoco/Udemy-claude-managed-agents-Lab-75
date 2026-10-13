import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import { effectiveOptionsSchema, lab02RequestSchema } from '../../shared/lab02-options.js';
import type { EffectiveOptions, Lab02Request } from '../../shared/lab02-options.js';
import { createLiveLab01Port, fixtureSession } from './lab01-port.js';
import type { Lab01Port } from './lab01-port.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { LabError } from './lab01-run.js';
import { streamOptionsFixture } from './lab02-fixtures.js';

export type Lab02Port = Lab01Port & { effective: EffectiveOptions | null; closeStream: () => void };
export function sessionOptions(input: Lab02Request, env = process.env): SessionCreateParams {
  const request = lab02RequestSchema.parse(input);
  const settings = managedSettings(env);
  if (request.deadlineSeconds * 1000 > settings.deadlineMs) throw new Error('Deadline exceeds MANAGED_DEADLINE_MS server policy.');
  const versionText = env.MANAGED_AGENT_VERSION;
  if (versionText !== undefined && (!/^[1-9]\d*$/.test(versionText) || !Number.isSafeInteger(Number(versionText))))
    throw new Error('MANAGED_AGENT_VERSION must be a positive safe integer or omitted for latest.');
  const ids = managedResourceIds(env);
  return { agent: { type: 'agent_with_overrides', id: ids.agentId,
    ...(versionText ? { version: Number(versionText) } : {}), model: { id: request.model },
    ...(request.system.choice === 'clear' ? { system: null } : request.system.choice === 'override' ? { system: request.system.text } : {}),
    tools: [], mcp_servers: [], skills: [] },
    environment_id: ids.environmentId, title: 'Lab 02 session options',
    budget: { type: 'limit', max_list_cost: { amount: String(request.budgetCents), currency: 'USD' } } };
}

export function createLiveLab02Port(input: Lab02Request, sdk?: Anthropic, env = process.env): Lab02Port {
  const parameters = sessionOptions(input, env); // validate before any call
  const client = sdk ?? createManagedClient(env);
  const base = createLiveLab01Port(client, env);
  let close = () => {};
  const port: Lab02Port = { ...base, effective: null, closeStream: () => close(),
    async create() {
      const configured = await client.beta.agents.retrieve(parameters.agent && typeof parameters.agent !== 'string' ? parameters.agent.id : '',
        env.MANAGED_AGENT_VERSION ? { version: Number(env.MANAGED_AGENT_VERSION) } : {}, { timeout: 3000 });
      if (configured.multiagent) throw new LabError('Lab 02 requires a single-agent base configuration; no session was created.');
      const session = await client.beta.sessions.create(parameters, { timeout: 5000 });
      const agent = session.agent;
      port.effective = effectiveOptionsSchema.parse({ model: agent.model.id, system: agent.system,
        systemSource: input.system.choice === 'inherit' ? 'inherited' : input.system.choice === 'clear' ? 'cleared' : 'overridden',
        modelSource: 'overridden', agentId: agent.id, agentVersion: agent.version,
        budget: session.budget?.max_list_cost, tools: agent.tools.length, mcpServers: agent.mcp_servers.length,
        skills: agent.skills.length, multiagent: agent.multiagent !== null });
      // Reuse runner's pre-send safety guard for skills and orchestration too.
      return { source: 'managed-api', id: session.id, status: session.status, agentId: agent.id,
        agentVersion: agent.version, environmentId: session.environment_id,
        budget: `${session.budget!.max_list_cost.amount} USD`,
        toolCount: agent.tools.length + agent.skills.length + (agent.multiagent ? 1 : 0), mcpServerCount: agent.mcp_servers.length };
    },
    async open(id, signal) {
      const stream = await client.beta.sessions.events.stream(id, input.previews ? { event_deltas: ['agent.message'] } : {}, { signal });
      close = () => stream.controller.abort();
      // This listener also closes a stream that was established after local waiting ended.
      signal.addEventListener('abort', close, { once: true });
      if (signal.aborted) close();
      return (async function* () { try { for await (const event of stream) yield event; }
        finally { signal.removeEventListener('abort', close); close(); } })();
    },
  };
  return port;
}

export function createFixtureLab02Port(input: Lab02Request, stepMs = 80): Lab02Port & { calls: string[] } {
  lab02RequestSchema.parse(input);
  const calls: string[] = [];
  const port: Lab02Port & { calls: string[] } = { source: 'authored-fixture', calls, effective: null, closeStream() {},
    async create() {
      calls.push('create');
      const session = fixtureSession;
      port.effective = { model: input.model, modelSource: 'overridden',
        system: input.system.choice === 'inherit' ? 'Authored fixture base system.' : input.system.choice === 'clear' ? null : input.system.text,
        systemSource: input.system.choice === 'inherit' ? 'inherited' : input.system.choice === 'clear' ? 'cleared' : 'overridden',
        agentId: session.agentId, agentVersion: 1, budget: { amount: String(input.budgetCents), currency: 'USD' },
        tools: 0, mcpServers: 0, skills: 0, multiagent: false };
      return { ...session, id: `sesn_fixture_lab02_${randomUUID()}`, budget: `${input.budgetCents} USD (simulated)` };
    },
    async open(_id, signal) {
      calls.push('open');
      return streamOptionsFixture(input, signal, stepMs);
    },
    async send() { calls.push('send'); },
    async interrupt() { calls.push('interrupt'); },
    async status() { calls.push('status'); return 'idle'; },
    async archive() { calls.push('archive'); },
  };
  return port;
}
