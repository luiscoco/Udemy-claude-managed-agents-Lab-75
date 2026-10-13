import { randomUUID } from 'node:crypto';
import type Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import { lab05RequestSchema, lab05Tools } from '../../shared/lab05-custom-tools.js';
import type { Lab05Request } from '../../shared/lab05-custom-tools.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { LabError } from './lab01-run.js';
import { createLab05Fixture } from './lab05-fixtures.js';
import type { Lab05Fixture } from './lab05-fixtures.js';
import { liveSessionMethods } from './tool-session-port.js';
import type { ToolSessionPort } from './tool-session-port.js';

/** The shared tool-session boundary, with custom tool results required. Lab 05 sends no tool confirmations. */
export type Lab05Port = ToolSessionPort & Required<Pick<ToolSessionPort, 'respond'>>;
export const lab05AgentEnv = 'CLAUDE_MANAGED_LAB05_AGENT_ID';
export function lab05AgentId(env: NodeJS.ProcessEnv = process.env) { return env[lab05AgentEnv]?.trim() || undefined; }

type ToolLike = { type: string; name?: string; input_schema?: { properties?: Record<string, unknown> | null; required?: string[] | null; additionalProperties?: unknown } };
/**
 * Null when the tools are exactly the three task tools: same names, all custom, same property names,
 * required fields and closed objects. Otherwise the reason, for an authored error. Description wording
 * and server-side schema formatting are not compared.
 */
export function lab05ToolMismatch(tools: readonly ToolLike[]): string | null {
  const shape = (tool: ToolLike) => JSON.stringify({ type: tool.type, name: tool.name,
    properties: Object.keys(tool.input_schema?.properties ?? {}).sort(), required: [...(tool.input_schema?.required ?? [])].sort(),
    closed: tool.input_schema?.additionalProperties === false });
  const expected = lab05Tools.map(shape).sort(), actual = tools.map(shape).sort();
  if (tools.some((tool) => tool.type !== 'custom')) return `it has non-custom tools (${tools.filter((t) => t.type !== 'custom').map((t) => t.type).join(', ')})`;
  if (JSON.stringify(expected) !== JSON.stringify(actual)) return `its custom tools are ${tools.map((t) => t.name).join(', ') || 'none'}, not exactly list_tasks, add_task and complete_task with the shapes in managed/lab05-agent.json`;
  return null;
}

/** Exactly what session creation sends: the provisioned agent pinned to the version just verified. No overrides. */
export function lab05SessionParams(input: Lab05Request, agent: { id: string; version: number }, env = process.env): SessionCreateParams {
  const request = lab05RequestSchema.parse(input);
  const settings = managedSettings(env);
  if (request.deadlineSeconds * 1000 > settings.deadlineMs) throw new Error('Deadline exceeds MANAGED_DEADLINE_MS server policy.');
  return {
    agent: { type: 'agent', id: agent.id, version: agent.version },
    environment_id: managedResourceIds(env).environmentId, title: 'Lab 05 custom tools',
    budget: { type: 'limit', max_list_cost: { amount: String(request.budgetCents ?? settings.budgetCents), currency: 'USD' } },
  };
}

export function createLiveLab05Port(input: Lab05Request, sdk?: Anthropic, env = process.env): Lab05Port {
  const settings = managedSettings(env);
  const agentId = lab05AgentId(env);
  if (!settings.liveReady || !agentId) throw new Error(`Managed Agents live mode is disabled, or ${lab05AgentEnv} is missing.`);
  lab05SessionParams(input, { id: agentId, version: 1 }, env); // validate before any call
  const client = sdk ?? createManagedClient(env);
  const sessions = client.beta.sessions;
  return {
    source: 'managed-api',
    ...liveSessionMethods(sessions),
    async create() {
      const agent = await client.beta.agents.retrieve(agentId, {}, { timeout: 3000 });
      const problem = agent.archived_at ? 'it is archived'
        : agent.mcp_servers.length || agent.skills.length || agent.multiagent ? 'it has MCP servers, skills or multiagent configuration'
        : lab05ToolMismatch(agent.tools);
      if (problem) throw new LabError(`The Lab 05 agent cannot be used: ${problem}. No session was created. Provision it from managed/lab05-agent.json.`);
      const session = await sessions.create(lab05SessionParams(input, { id: agent.id, version: agent.version }, env), { timeout: 5000 });
      const created = session.agent;
      // Guard the response before any prompt: the session must carry only the three custom tools.
      const sessionProblem = created.mcp_servers.length || created.skills.length || created.multiagent ? 'MCP servers, skills or orchestration'
        : lab05ToolMismatch(created.tools);
      if (sessionProblem) {
        await sessions.archive(session.id, {}, { timeout: 3000 }).catch(() => {});
        throw new LabError(`The created session has ${sessionProblem}; it was archived and no prompt was sent.`);
      }
      const cost = session.budget?.max_list_cost;
      return { effectiveTools: created.tools.map((tool) => ({ name: 'name' in tool ? tool.name : tool.type, enabled: true, policy: null })),
        session: { source: 'managed-api', id: session.id, status: session.status, agentId: created.id, agentVersion: created.version,
          environmentId: session.environment_id, budget: cost ? `${cost.amount} ${cost.currency}` : null,
          toolCount: created.tools.length, mcpServerCount: created.mcp_servers.length } };
    },
    async confirm() { throw new LabError('The Lab 05 agent has no built-in tools, so there is nothing to confirm.'); },
    async collectOutputs() { return { status: 'none', detail: 'Lab 05 tools change host state only; the session writes no files.' }; },
    async cleanup() { return 'not-needed'; },
  };
}

/** Offline port: no network, credentials or charges. `calls` records the call order for tests. */
export function createFixtureLab05Port(input: Lab05Request, stepMs = 80): Lab05Port & { calls: string[]; fixture: Lab05Fixture } {
  const request = lab05RequestSchema.parse(input);
  const fixture = createLab05Fixture(request, stepMs);
  const calls: string[] = [];
  return {
    source: 'authored-fixture', calls, fixture,
    async create() {
      calls.push('create');
      return { effectiveTools: lab05Tools.map((tool) => ({ name: tool.name, enabled: true, policy: null })),
        session: { source: 'authored-fixture', id: `sesn_fixture_lab05_${randomUUID()}`, status: 'idle', agentId: 'agent_fixture_lab05', agentVersion: 1,
          environmentId: 'env_fixture', budget: `${request.budgetCents ?? 50} USD cents (simulated)`, toolCount: lab05Tools.length, mcpServerCount: 0 } };
    },
    async open(_id, signal) { calls.push('open'); return fixture.events(signal); },
    async send() { calls.push('send'); fixture.markSent(); },
    async confirm() { throw new LabError('The Lab 05 agent has no built-in tools, so there is nothing to confirm.'); },
    async respond(_id, results) {
      calls.push(`respond:${results.map((r) => `${r.customToolUseId}=${r.isError ? 'error' : 'ok'}`).join(',')}`);
      fixture.respond(results);
    },
    async interrupt() { calls.push('interrupt'); },
    async status() { calls.push('status'); return 'idle'; },
    async archive() { calls.push('archive'); },
    async collectOutputs() { return { status: 'none', detail: 'Lab 05 tools change host state only; the session writes no files.' }; },
    async cleanup() { return 'not-needed'; },
  };
}
