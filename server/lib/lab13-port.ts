import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { isIP } from 'node:net';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams, SessionUpdateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import type { BetaManagedAgentsCustomToolParams, BetaManagedAgentsMCPToolsetParams } from '@anthropic-ai/sdk/resources/beta/agents';
import type { Lab13Config, Lab13Input, Lab13Call } from '../../shared/lab13-mcp.js';
import { lab13Shapes } from '../../shared/lab13-mcp.js';
import type { ToolSessionPort, CustomToolResult } from './tool-session-port.js';
import { liveSessionMethods, agentVersion } from './tool-session-port.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import type { StreamEvent } from './session-events.js';
import { LabError } from './lab01-run.js';

export function lab13RemoteSettings(env = process.env) {
  const raw = env.CLAUDE_MANAGED_LAB13_INVENTORY_URL; const vault = env.CLAUDE_MANAGED_LAB13_VAULT_ID;
  let validUrl = false;
  try { const url = new URL(raw ?? ''); validUrl = url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash &&
    (!url.port || url.port === '443') && !isIP(url.hostname.replace(/^\[|\]$/g, '')) && url.hostname.includes('.') &&
    !/(^|\.)(localhost|local|internal|test|example|invalid)$/.test(url.hostname) && raw!.length <= 2048; } catch { /* No configured endpoint. */ }
  const validVault = typeof vault === 'string' && /^vlt_[A-Za-z0-9_-]{1,150}$/.test(vault);
  return { ready: validUrl && validVault, validUrl, validVault, url: validUrl ? raw! : '', vault: validVault ? vault! : '' };
}
export function lab13BridgeTools(config: Lab13Config): BetaManagedAgentsCustomToolParams[] {
  const names = [...(config.notesEnabled ? ['list_notes', 'read_note'] as const : []), ...(config.inventoryEnabled ? ['get_stock'] as const : []), ...(config.inventoryEnabled && config.reserveEnabled ? ['reserve_stock'] as const : [])];
  return names.map(name => ({ type: 'custom', name, description: `Host bridge to the local MCP ${name} tool.`, input_schema: z.toJSONSchema(lab13Shapes[name]) as BetaManagedAgentsCustomToolParams['input_schema'] }));
}
export function lab13NativeConfig(config: Lab13Config, env = process.env): NonNullable<SessionUpdateParams['agent']> {
  const settings = lab13RemoteSettings(env); if (!settings.ready) throw new LabError('Configure the reviewed HTTPS inventory endpoint and existing matching MCP vault on the server. No session created.');
  if (config.notesEnabled || config.reserveEnabled) throw new LabError('Native MCP mode is inventory-only and read-only.');
  const tool: BetaManagedAgentsMCPToolsetParams = { type: 'mcp_toolset', mcp_server_name: 'inventory', default_config: { enabled: false, permission_policy: { type: 'always_ask' } },
    configs: [{ name: 'get_stock', enabled: true, permission_policy: { type: 'always_allow' } }, { name: 'reserve_stock', enabled: false, permission_policy: { type: 'always_ask' } }] };
  return { mcp_servers: config.inventoryEnabled ? [{ type: 'url', name: 'inventory', url: settings.url }] : [], tools: config.inventoryEnabled ? [tool] : [] };
}
export interface Lab13Port extends ToolSessionPort {
  verificationError: string | null;
  prepare(operation: Lab13Input['operation']): void;
  configure(config: Lab13Config): Promise<void>;
  observe(call: Lab13Call): void;
}
export function createLiveLab13Port(input: Lab13Input, onNativeCall: (call: Lab13Call) => void, sdk?: Anthropic, env = process.env): Lab13Port {
  if (!managedSettings(env).liveReady) throw new LabError('Configure Managed live mode first.');
  const client = sdk ?? createManagedClient(env); const sessions = client.beta.sessions; let cached: Awaited<ReturnType<ToolSessionPort['create']>> | undefined;
  let config = input.config; let userEventId: string | null = null; const uses = new Map<string, Lab13Call>();
  function desired(next: Lab13Config) { return input.integration === 'managed-url' ? lab13NativeConfig(next, env) : { tools: lab13BridgeTools(next), mcp_servers: [] }; }
  function stable(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`;
    return JSON.stringify(value) ?? 'null';
  }
  function mismatch(agent: { tools: unknown[]; mcp_servers: unknown[]; skills: unknown[]; multiagent: unknown }, next: Lab13Config) {
    const expected = desired(next);
    return agent.skills.length || agent.multiagent || stable(agent.mcp_servers) !== stable(expected.mcp_servers) ||
      stable(agent.tools) !== stable(expected.tools) ? 'Resolved tools/MCP differ from the requested restricted configuration.' : null;
  }
  const port: Lab13Port = { ...liveSessionMethods(sessions), source: 'managed-api', verificationError: null, prepare() {}, observe: onNativeCall,
    async create() {
      if (cached) return cached;
      const ids = managedResourceIds(env); const version = agentVersion(env);
      const base = await client.beta.agents.retrieve(ids.agentId, version ? { version } : {}, { timeout: 3000 });
      if (base.multiagent) throw new LabError('Lab 13 needs a single-agent base.');
      const remote = lab13RemoteSettings(env);
      const params: SessionCreateParams = { agent: { type: 'agent_with_overrides', id: base.id, version: base.version, ...desired(config), skills: [] }, environment_id: ids.environmentId,
        title: 'Lab 13 MCP reachability', budget: { type: 'limit', max_list_cost: { amount: String(input.budgetCents), currency: 'USD' } },
        ...(input.integration === 'managed-url' ? { vault_ids: [remote.vault] } : {}) };
      const session = await sessions.create(params, { timeout: 5000 }); const a = session.agent;
      cached = { effectiveTools: a.tools.map(tool => ({ name: 'name' in tool ? tool.name : tool.type, enabled: true, policy: null })),
        session: { id: session.id, source: 'managed-api', status: session.status, agentId: a.id, agentVersion: a.version, environmentId: session.environment_id,
          budget: `${input.budgetCents} USD cents`, toolCount: a.tools.length, mcpServerCount: a.mcp_servers.length } };
      port.verificationError = mismatch(a, config) || (a.id !== base.id || a.version !== base.version || a.model.id !== base.model.id || a.system !== base.system ? 'Resolved base agent differs.' : null) ||
        (input.integration === 'managed-url' && !session.vault_ids.includes(remote.vault) ? 'Requested MCP vault attachment was not resolved.' : null);
      return cached;
    }, async configure(next) {
      if (!cached || typeof sessions.update !== 'function') throw new LabError('Idle session updates are unavailable.');
      const updated = await sessions.update(cached.session.id, { agent: desired(next) }, { timeout: 5000 });
      const problem = mismatch(updated.agent, next); if (problem) throw new LabError(problem); config = next;
      cached.session.toolCount = updated.agent.tools.length; cached.session.mcpServerCount = updated.agent.mcp_servers.length;
    }, async open(id, signal) {
      userEventId = null; uses.clear(); const events = await sessions.events.stream(id, {}, { signal });
      return (async function* () {
        let correlated = false; let skipped = 0;
        try { for await (const event of events) {
          if (!correlated) { if (event.type !== 'user.message' || event.id !== userEventId) { if (++skipped > 300) throw new LabError('User-event correlation bound exceeded.'); continue; } correlated = true; }
          if (event.type === 'agent.mcp_tool_use' && !uses.has(event.id)) {
            if (uses.size >= 20) throw new LabError('MCP tool event bound exceeded.');
            const record: Lab13Call = { useId: event.id, resultId: null, resultSent: false, server: event.mcp_server_name.slice(0, 100), name: event.name.slice(0, 100), path: 'native-mcp',
              isError: event.evaluated_permission === 'deny', text: event.evaluated_permission === 'deny' ? 'Provider denied this tool call.' : 'Provider MCP tool-use event observed; waiting for result.', handlerRan: false };
            uses.set(event.id, record); onNativeCall({ ...record });
          } else if (event.type === 'agent.mcp_tool_result') {
            const use = uses.get(event.mcp_tool_use_id); if (use && !use.resultId) { use.resultId = event.id; use.isError = Boolean(event.is_error);
              use.text = (event.content ?? []).map(block => block.type === 'text' ? block.text : '[non-text block]').join('\n').slice(0, 4000); onNativeCall({ ...use }); }
          }
          yield event;
        } } finally { events.controller.abort(); }
      })();
    }, async send(id, prompt, signal) {
      const result = await sessions.events.send(id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal });
      const event = result.data?.find(event => event.type === 'user.message'); if (!event) throw new LabError('Provider acceptance ID is missing; no automatic retry.'); userEventId = event.id;
    }, async collectOutputs() { return { status: 'none', detail: 'MCP evidence comes from protocol results and local stock, not sandbox files.' }; }, async cleanup() { return 'not-needed'; },
  };
  return port;
}
export function createFixtureLab13Port(input: Lab13Input): Lab13Port & { calls: string[] } {
  const calls: string[] = []; let sent = false; let operation = input.operation; let sequence = 0; let replied: readonly CustomToolResult[] | undefined; let status = 'idle';
  const session = { id: `sesn_fixture_lab13_${randomUUID()}`, source: 'authored-fixture' as const, status: 'idle', agentId: 'agent_fixture', agentVersion: 1,
    environmentId: 'env_fixture', budget: 'No billing', toolCount: lab13BridgeTools(input.config).length, mcpServerCount: 0 };
  const id = () => `sevt_fixture_${randomUUID()}`;
  return { source: 'authored-fixture', calls, verificationError: null, observe() {}, prepare(next) { operation = next; },
    async create() { calls.push('create-or-reuse'); return { session, effectiveTools: null }; }, async configure(next) { calls.push('configure'); session.toolCount = lab13BridgeTools(next).length; },
    async open(_id, signal) { calls.push('open'); sent = false; replied = undefined;
      return (async function* (): AsyncGenerator<StreamEvent> {
        while (!sent) await delay(2, undefined, { signal }); const at = new Date().toISOString();
        yield { type: 'session.status_running', id: id(), processed_at: at };
        if (input.scenario === 'hang') await delay(3_600_000, undefined, { signal });
        const plan = operation === 'reserve' ? [{ name: 'reserve_stock', input: { sku: 'NOTEBOOK', quantity: 1 } }] : [{ name: 'list_notes', input: {} }, { name: 'get_stock', input: { sku: 'NOTEBOOK' } }];
        const pending: string[] = [];
        for (const tool of plan) { const useId = id(); pending.push(useId); yield { type: 'agent.custom_tool_use', id: useId, name: tool.name, input: tool.input, processed_at: at }; }
        status = 'idle'; yield { type: 'session.status_idle', id: id(), processed_at: at, stop_details: null, stop_reason: { type: 'requires_action', event_ids: pending } };
        while (!replied) await delay(2, undefined, { signal });
        const results: readonly CustomToolResult[] = replied;
        status = 'running'; yield { type: 'agent.message', id: id(), processed_at: at, content: [{ type: 'text', text: `Authored agent turn ${sequence}: ${results.map(result => `${result.tool}: ${result.isError ? 'error' : 'MCP result received'}`).join('; ')}. Inspect host protocol evidence and stock.` }] };
        status = 'idle'; yield { type: 'session.status_idle', id: id(), processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } };
      })(); },
    async send() { calls.push('send'); sequence++; sent = true; status = 'running'; }, async respond(_id, results) { calls.push('respond'); replied = results; }, async confirm() { calls.push('deny-unexpected'); },
    async status() { return status; }, async interrupt() { calls.push('interrupt'); status = 'idle'; }, async archive() { calls.push('archive'); status = 'archived'; },
    async collectOutputs() { return { status: 'none', detail: 'Host-local MCP evidence only.' }; }, async cleanup() { return 'not-needed'; } };
}
