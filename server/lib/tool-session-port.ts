import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import Anthropic, { toFile } from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import type { Confirmation, Lab03Toolset } from '../../shared/lab03-tools.js';
import type { Lab01Session } from '../../shared/lab01-events.js';
import { formatCents } from '../../shared/lab02-options.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { LabError } from './lab01-run.js';
import type { PlanFixture } from './lab03-fixtures.js';
import { PathRejected } from './lab03-sandbox.js';
import type { Sandbox } from './lab03-sandbox.js';
import type { StreamEvent } from './session-events.js';

export type EffectiveTool = { name: string; enabled: boolean; policy: string | null };
export type OutputReport = { status: 'applied-offline' | 'downloaded' | 'none' | 'failed'; detail: string };
/** One user.custom_tool_result: custom_tool_use_id is the sevt_ ID of the agent.custom_tool_use event. */
export interface CustomToolResult { customToolUseId: string; tool: string; isError: boolean; text: string }

/** Provider boundary for labs that run built-in tools. Each method is one provider call or one fixture step. */
export interface ToolSessionPort {
  readonly source: 'authored-fixture' | 'managed-api';
  /** Uploads fixtures (live), creates the session and returns metadata from the creation response. */
  create(): Promise<{ session: Lab01Session; effectiveTools: EffectiveTool[] | null }>;
  /** Resolves once the stream is established, so the prompt cannot be missed. */
  open(id: string, signal: AbortSignal): Promise<AsyncIterable<StreamEvent>>;
  send(id: string, prompt: string, signal: AbortSignal): Promise<void>;
  /** Sends user.tool_confirmation events; tool_use_id is the sevt_ ID of the agent.tool_use event. */
  confirm(id: string, confirmations: readonly Confirmation[], signal: AbortSignal): Promise<void>;
  /** Sends user.custom_tool_result events. Only ports for agents with custom tools implement it. */
  respond?(id: string, results: readonly CustomToolResult[], signal: AbortSignal): Promise<void>;
  /** Own bounded requests; never tied to the aborted run signal. */
  interrupt(id: string): Promise<void>;
  status(id: string): Promise<string>;
  archive(id: string): Promise<void>;
  /** Copies session outputs into the host sandbox (live) after the turn. */
  collectOutputs(id: string): Promise<OutputReport>;
  /** Deletes the uploaded originals (live). */
  cleanup(): Promise<'not-needed' | 'deleted' | 'pending'>;
}

/** What one lab asks of a tool session. The toolset is the only tool configuration sent. */
export interface ToolSessionSpec {
  label: string; title: string; toolset: Lab03Toolset; deadlineSeconds: number; budgetCents?: number | undefined;
}

export const mounts = { 'notes.md': '/notes.md', 'draft.md': '/draft.md' } as const;
export type MountedFile = keyof typeof mounts;
export function agentVersion(env: NodeJS.ProcessEnv) {
  const text = env.MANAGED_AGENT_VERSION;
  if (text !== undefined && (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(Number(text))))
    throw new Error('MANAGED_AGENT_VERSION must be a positive safe integer or omitted for latest.');
  return text ? Number(text) : undefined;
}

/** Exactly what session creation sends. Tools come only from the lab toolset; nothing else is translated. */
export function toolSessionParams(spec: ToolSessionSpec, fileIds: Record<MountedFile, string>, env = process.env): SessionCreateParams {
  const settings = managedSettings(env);
  if (spec.deadlineSeconds * 1000 > settings.deadlineMs) throw new Error('Deadline exceeds MANAGED_DEADLINE_MS server policy.');
  const version = agentVersion(env);
  const ids = managedResourceIds(env);
  return {
    agent: { type: 'agent_with_overrides', id: ids.agentId, ...(version ? { version } : {}),
      tools: [spec.toolset], mcp_servers: [], skills: [] },
    environment_id: ids.environmentId, title: spec.title,
    budget: { type: 'limit', max_list_cost: { amount: String(spec.budgetCents ?? settings.budgetCents), currency: 'USD' } },
    resources: (Object.keys(mounts) as MountedFile[]).map((name) => ({ type: 'file' as const, file_id: fileIds[name], mount_path: mounts[name] })),
  };
}

/** Reads the toolset back from the session creation response. */
export function effectiveToolsFrom(tools: readonly { type: string; configs?: readonly { name: string; enabled: boolean; permission_policy?: { type: string } }[] }[]): EffectiveTool[] {
  const toolset = tools.find((tool) => tool.type === 'agent_toolset_20260401');
  return (toolset?.configs ?? []).map((config) => ({ name: config.name, enabled: config.enabled,
    policy: config.enabled ? config.permission_policy?.type ?? null : null }));
}

/** The per-session provider calls every live tool port shares: stream, prompt, answers, interrupt, status, archive. */
export function liveSessionMethods(sessions: Anthropic['beta']['sessions']):
  Pick<ToolSessionPort, 'open' | 'send' | 'confirm' | 'interrupt' | 'status' | 'archive'> & Required<Pick<ToolSessionPort, 'respond'>> {
  return {
    async open(id, signal) {
      const stream = await sessions.events.stream(id, {}, { signal });
      const close = () => stream.controller.abort();
      signal.addEventListener('abort', close, { once: true });
      return (async function* () { try { for await (const event of stream) yield event; }
        finally { signal.removeEventListener('abort', close); close(); } })();
    },
    async send(id, prompt, signal) {
      await sessions.events.send(id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal });
    },
    async confirm(id, confirmations, signal) {
      await sessions.events.send(id, { events: confirmations.map((answer) => ({ type: 'user.tool_confirmation' as const,
        tool_use_id: answer.toolUseId, result: answer.result, ...(answer.result === 'deny' ? { deny_message: answer.denyMessage } : {}) })) }, { signal });
    },
    async respond(id, results, signal) {
      await sessions.events.send(id, { events: results.map((result) => ({ type: 'user.custom_tool_result' as const,
        custom_tool_use_id: result.customToolUseId, content: [{ type: 'text' as const, text: result.text }], is_error: result.isError })) }, { signal });
    },
    async interrupt(id) { await sessions.events.send(id, { events: [{ type: 'user.interrupt' }] }, { timeout: 3000 }); },
    async status(id) { return (await sessions.retrieve(id, {}, { timeout: 3000 })).status; },
    async archive(id) { await sessions.archive(id, {}, { timeout: 3000 }); },
  };
}

const safeOutputName = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const outputListRetries = 2, outputListDelayMs = 1500;
export function createLiveToolSessionPort(spec: ToolSessionSpec, sandbox: Sandbox, sdk?: Anthropic, env = process.env): ToolSessionPort {
  const settings = managedSettings(env);
  if (!settings.liveReady) throw new Error('Managed Agents live mode is disabled or configuration is incomplete.');
  toolSessionParams(spec, { 'notes.md': 'file_check', 'draft.md': 'file_check' }, env); // validate before any call
  const client = sdk ?? createManagedClient(env);
  const sessions = client.beta.sessions;
  const uploaded: string[] = [];
  return {
    source: 'managed-api',
    async create() {
      const version = agentVersion(env);
      const configured = await client.beta.agents.retrieve(managedResourceIds(env).agentId, version ? { version } : {}, { timeout: 3000 });
      if (configured.multiagent) throw new LabError(`${spec.label} requires a single-agent base configuration; no files were uploaded and no session was created.`);
      const fileIds = {} as Record<MountedFile, string>;
      for (const name of Object.keys(mounts) as MountedFile[]) {
        const content = await sandbox.readText(`uploads/${name}`);
        const file = await client.files.upload({ file: await toFile(Buffer.from(content, 'utf8'), name, { type: 'text/markdown' }) }, { timeout: 10000 });
        uploaded.push(file.id); fileIds[name] = file.id;
      }
      const session = await sessions.create(toolSessionParams(spec, fileIds, env), { timeout: 5000 });
      const agent = session.agent;
      // Guard the response before any prompt: only the lab toolset may be present.
      if (agent.mcp_servers.length || agent.skills.length || agent.multiagent || agent.tools.length !== 1)
        throw new LabError('The created session has tools beyond the lab toolset, MCP servers, skills or orchestration; no prompt was sent.');
      const cost = session.budget?.max_list_cost;
      return { effectiveTools: effectiveToolsFrom(agent.tools),
        session: { source: 'managed-api', id: session.id, status: session.status, agentId: agent.id, agentVersion: agent.version,
          environmentId: session.environment_id, budget: cost ? formatCents(cost.amount) : null,
          toolCount: agent.tools.length, mcpServerCount: agent.mcp_servers.length } };
    },
    ...liveSessionMethods(sessions),
    async collectOutputs(id) {
      // scope_id lists this session's files. Filtering by scope_id requires the managed-agents beta header, which
      // files.list (unlike sessions.*) does not add automatically. The listing also contains the session copies of the
      // mounted uploads (downloadable: false, possibly with the same name as an output); only downloadable files are
      // outputs written to /mnt/session/outputs/. They can appear a few seconds after the session goes idle.
      const listOutputs = async () => (await client.beta.files.list({ scope_id: id, limit: 20, betas: ['managed-agents-2026-04-01'] },
        { timeout: 5000 })).data.filter((file) => file.downloadable !== false);
      let outputs = await listOutputs();
      for (let retry = 0; !outputs.length && retry < outputListRetries; retry++) { await delay(outputListDelayMs); outputs = await listOutputs(); }
      const written: string[] = [], skipped: string[] = [];
      for (const file of outputs.slice(0, 10)) {
        if (!safeOutputName.test(file.filename) || file.size_bytes > 65536) { skipped.push(file.filename.slice(0, 40)); continue; }
        try {
          await sandbox.hostPath(`outputs/${file.filename}`); // validate before any download or write
          const response = await client.files.download(file.id, {}, { timeout: 5000 });
          await sandbox.writeText(`outputs/${file.filename}`, await response.text());
          written.push(file.filename);
        } catch (error) { if (error instanceof PathRejected) skipped.push(file.filename); else throw error; }
      }
      if (!written.length) return { status: 'none', detail: `No session outputs were downloaded${skipped.length ? `; skipped unsafe names: ${skipped.join(', ')}` : ''}.` };
      return { status: 'downloaded', detail: `Downloaded ${written.join(', ')} into the host sandbox outputs/.${skipped.length ? ` Skipped: ${skipped.join(', ')}.` : ''}` };
    },
    async cleanup() {
      // The session-scoped copies are removed with the session; the originals are ours to delete.
      const ids = uploaded.splice(0);
      let ok = true;
      for (const id of ids) { try { await client.files.delete(id, {}, { timeout: 3000 }); } catch { ok = false; } }
      return !ids.length ? 'not-needed' : ok ? 'deleted' : 'pending';
    },
  };
}

/** Offline port: no network, credentials or charges. `calls` records the call order for tests. */
export function createFixtureToolSessionPort(spec: Pick<ToolSessionSpec, 'toolset' | 'budgetCents'> & { idPrefix: string },
  fixture: PlanFixture): ToolSessionPort & { calls: string[]; toolset: Lab03Toolset } {
  const calls: string[] = [];
  const { toolset } = spec;
  return {
    source: 'authored-fixture', calls, toolset,
    async create() {
      calls.push('create');
      return { effectiveTools: toolset.configs.map((c) => ({ name: c.name, enabled: c.enabled, policy: c.enabled ? c.permission_policy.type : null })),
        session: { source: 'authored-fixture', id: `${spec.idPrefix}_${randomUUID()}`, status: 'idle', agentId: 'agent_fixture', agentVersion: 1,
          environmentId: 'env_fixture', budget: `${spec.budgetCents ?? 50} USD cents (simulated)`, toolCount: 1, mcpServerCount: 0 } };
    },
    async open(_id, signal) { calls.push('open'); return fixture.events(signal); },
    async send() { calls.push('send'); fixture.markSent(); },
    async confirm(_id, confirmations) { calls.push(`confirm:${confirmations.map((c) => `${c.toolUseId}=${c.result}`).join(',')}`); fixture.confirm(confirmations); },
    async interrupt() { calls.push('interrupt'); },
    async status() { calls.push('status'); return 'idle'; },
    async archive() { calls.push('archive'); },
    async collectOutputs() { return { status: 'applied-offline', detail: 'The authored fixture applied permitted effects directly to the host sandbox.' }; },
    async cleanup() { return 'not-needed'; },
  };
}
