import { setTimeout as delay } from 'node:timers/promises';
import Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import type { StreamEvent } from './session-events.js';
import type { CustomToolResult, ToolSessionPort } from './tool-session-port.js';
import { liveSessionMethods } from './tool-session-port.js';
import { fixtureSession } from './lab01-port.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { LabError } from './lab01-run.js';
import { lab07RequestSchema, lab07Tools } from '../../shared/lab07-hooks.js';
import type { Lab07ParsedRequest, Lab07Request } from '../../shared/lab07-hooks.js';

export type Lab07Port = ToolSessionPort & Required<Pick<ToolSessionPort, 'respond'>>;
export const lab07AgentEnv = 'CLAUDE_MANAGED_LAB07_AGENT_ID';
export const lab07AgentId = (env: NodeJS.ProcessEnv = process.env) => env[lab07AgentEnv]?.trim() || undefined;
type ToolLike = { type: string; name?: string; input_schema?: { properties?: Record<string, unknown> | null; required?: string[] | null; additionalProperties?: unknown } };
export function lab07ToolMismatch(tools: readonly ToolLike[]) {
  const shape = (tool: ToolLike) => JSON.stringify({ type: tool.type, name: tool.name, properties: Object.keys(tool.input_schema?.properties ?? {}).sort(),
    required: [...(tool.input_schema?.required ?? [])].sort(), closed: tool.input_schema?.additionalProperties === false });
  return JSON.stringify(tools.map(shape).sort()) === JSON.stringify(lab07Tools.map(shape).sort()) ? null : 'tools do not exactly match read_file, write_file and edit_file';
}
export function lab07SessionParams(input: Lab07Request, agent: { id: string; version: number }, env = process.env): SessionCreateParams {
  const request = lab07RequestSchema.parse(input); const settings = managedSettings(env);
  return { agent: { type: 'agent', id: agent.id, version: agent.version }, environment_id: managedResourceIds(env).environmentId,
    title: 'Lab 07 host policy audit', budget: { type: 'limit', max_list_cost: { amount: String(request.budgetCents ?? settings.budgetCents), currency: 'USD' } } };
}
export function createLiveLab07Port(input: Lab07Request, sdk?: Anthropic, env = process.env): Lab07Port {
  const settings = managedSettings(env); const agentId = lab07AgentId(env); if (!settings.liveReady || !agentId) throw new Error(`Live mode or ${lab07AgentEnv} is not configured.`);
  const client = sdk ?? createManagedClient(env); const sessions = client.beta.sessions;
  return { source: 'managed-api', ...liveSessionMethods(sessions),
    async collectOutputs() { return { status: 'none', detail: 'Lab 07 custom tools execute on the host; the Managed sandbox has no outputs to collect.' }; },
    async cleanup() { return 'not-needed'; },
    async create() {
    const agent = await client.beta.agents.retrieve(agentId, {}, { timeout: 3000 });
    const problem = agent.archived_at ? 'agent is archived' : agent.mcp_servers.length || agent.skills.length || agent.multiagent ? 'agent has unsupported extensions' : lab07ToolMismatch(agent.tools);
    if (problem) throw new LabError(`The Lab 07 agent cannot be used: ${problem}.`);
    const session = await sessions.create(lab07SessionParams(input, { id: agent.id, version: agent.version }, env), { timeout: 5000 });
    return { session: { source: 'managed-api', id: session.id, status: session.status, agentId: session.agent.id, agentVersion: session.agent.version,
      environmentId: session.environment_id, budget: session.budget?.max_list_cost ? `${session.budget.max_list_cost.amount} ${session.budget.max_list_cost.currency}` : null,
      toolCount: session.agent.tools.length, mcpServerCount: session.agent.mcp_servers.length },
      effectiveTools: session.agent.tools.map((tool) => ({ name: 'name' in tool ? tool.name : tool.type, enabled: true, policy: null })) };
  } };
}

const at = '2026-01-01T00:00:00Z';
function callFor(request: Lab07ParsedRequest) {
  if (request.policy === 'deny-write') return { name: 'edit_file', input: { path: '/workspace/protected.md', oldText: 'locked', newText: 'changed' } };
  if (request.policy === 'rewrite-input') return { name: 'write_file', input: { path: '/workspace/proposed.md', content: 'Status: rewritten through policy\n' } };
  return { name: 'edit_file', input: { path: '/workspace/draft.md', oldText: 'Status: draft', newText: 'Status: reviewed' } };
}
export function createFixtureLab07Port(input: Lab07ParsedRequest, stepMs = 20): Lab07Port & { calls: string[] } {
  const calls: string[] = []; const call = callFor(input); const useId = 'sevt_lab07_call_1'; let sent!: () => void, answered!: () => void;
  const sentPromise = new Promise<void>((resolve) => { sent = resolve; }); const answerPromise = new Promise<void>((resolve) => { answered = resolve; });
  let answer: CustomToolResult | undefined;
  return { source: 'authored-fixture', calls,
    async create() { calls.push('create'); return { session: { ...fixtureSession, id: 'sesn_fixture_lab07' }, effectiveTools: lab07Tools.map((tool) => ({ name: tool.name, enabled: true, policy: null })) }; },
    async open(_id, signal) { calls.push('open'); return (async function* (): AsyncGenerator<StreamEvent> {
      const step = async () => { if (stepMs) await delay(stepMs, undefined, { signal }); };
      await sentPromise; await step(); yield { type: 'session.status_running', id: 'sevt_lab07_run', processed_at: at };
      const use: StreamEvent = { type: 'agent.custom_tool_use', id: useId, name: call.name, input: call.input, processed_at: at };
      yield use; if (input.scenario === 'repeated-call') yield use;
      yield { type: 'session.status_idle', id: 'sevt_lab07_pause', processed_at: at, stop_details: null, stop_reason: { type: 'requires_action', event_ids: [useId, ...(input.scenario === 'repeated-call' ? [useId] : [])] } };
      await answerPromise; yield { type: 'session.status_running', id: 'sevt_lab07_resume', processed_at: at };
      if (input.scenario === 'hang') await delay(3_600_000, undefined, { signal });
      yield { type: 'user.custom_tool_result', id: 'sevt_lab07_echo', custom_tool_use_id: useId, content: [{ type: 'text', text: answer!.text }], is_error: answer!.isError, processed_at: at };
      yield { type: 'agent.message', id: 'sevt_lab07_message', processed_at: at, content: [{ type: 'text', text: 'Authored fixture summary; inspect the host audit and file evidence.' }] };
      yield { type: 'session.status_idle', id: 'sevt_lab07_end', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } };
    })(); },
    async send() { calls.push('send'); sent(); }, async confirm() { throw new Error('Lab 07 has custom tools only.'); },
    async respond(_id, results) { calls.push(`respond:${results.map((r) => r.customToolUseId).join(',')}`); if (answer) throw new Error('Already answered.'); answer = results[0]; answered(); },
    async interrupt() { calls.push('interrupt'); }, async status() { calls.push('status'); return 'idle'; }, async archive() { calls.push('archive'); },
    async collectOutputs() { return { status: 'none', detail: 'Custom tools execute in the host fixture.' }; }, async cleanup() { return 'not-needed'; },
  };
}

