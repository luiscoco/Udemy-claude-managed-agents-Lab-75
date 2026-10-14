import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import type { BetaManagedAgentsAgentToolset20260401Params } from '@anthropic-ai/sdk/resources/beta/agents';
import { lab11RequestSchema, pinSchema } from '../../shared/lab11-skills.js';
import type { Lab11Request, Lab11Result, SkillBundle, SkillPin } from '../../shared/lab11-skills.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { agentVersion, effectiveToolsFrom, liveSessionMethods } from './tool-session-port.js';
import type { ToolSessionPort } from './tool-session-port.js';
import { LabError } from './lab01-run.js';
import { readSkillBundle, readSkillPins } from './lab11-bundle.js';
import type { StreamEvent } from './session-events.js';

export const lab11Toolset: BetaManagedAgentsAgentToolset20260401Params = { type: 'agent_toolset_20260401',
  default_config: { enabled: false, permission_policy: { type: 'always_allow' } },
  configs: [{ name: 'read', enabled: true, permission_policy: { type: 'always_allow' } }] };
export type Lab11Port = ToolSessionPort & { configured: Lab11Result['configured']; resolvedSkills: Lab11Result['resolvedSkills']; bundle: SkillBundle | null };
/** Preserve the raw session version; accept numeric aliases only after a scoped provider lookup proves the exact immutable pin. */
export async function verifyLab11ResolvedSkills(client: Anthropic, resolved: NonNullable<Lab11Result['resolvedSkills']>, pin: SkillPin | null) {
  if (!pin) return resolved.length === 0;
  if (resolved.length !== 1) return false;
  const skill = resolved[0]!;
  if (skill.type !== 'custom' || skill.skillId !== pin.skillId) return false;
  if (skill.version === pin.version) { skill.canonicalVersion = pin.version; return true; }
  skill.canonicalVersion = null;
  // Never accept latest, infer from timestamps, or substitute another version on a failed lookup.
  if (!/^\d{1,32}$/.test(skill.version)) return false;
  try {
    const metadata = await client.beta.skills.versions.retrieve(skill.version, { skill_id: pin.skillId }, { timeout: 3000 });
    if (metadata.skill_id !== pin.skillId || metadata.id !== pin.version) return false;
    skill.canonicalVersion = metadata.id; return true;
  } catch { return false; }
}
export function revisionFor(input: Lab11Request): SkillBundle['revision'] {
  return input.variant === 'revised-version' ? 'v2' : input.variant === 'absent-reference' ? 'missing-reference' : 'v1';
}
export function lab11SessionParams(input: Lab11Request, base: { id: string; version: number }, pin: SkillPin | null, env = process.env): SessionCreateParams {
  const request = lab11RequestSchema.parse(input);
  if (pin) pinSchema.parse(pin);
  if (request.variant === 'missing-id' || (request.variant === 'without-skill' && pin)) throw new LabError('This variant must not attach a skill.');
  if (request.deadlineSeconds * 1000 > managedSettings(env).deadlineMs) throw new LabError('Deadline exceeds server policy.');
  if (request.variant !== 'without-skill' && !pin) throw new LabError('Upload and pin the selected Lab 11 bundle explicitly first.');
  return { agent: { type: 'agent_with_overrides', id: base.id, version: base.version, tools: [lab11Toolset], mcp_servers: [],
    skills: pin ? [{ type: 'custom', skill_id: pin.skillId, version: pin.version }] : [] },
    environment_id: managedResourceIds(env).environmentId, title: `Lab 11 ${request.variant}`,
    budget: { type: 'limit', max_list_cost: { amount: String(request.budgetCents), currency: 'USD' } } };
}
export async function createLiveLab11Port(input: Lab11Request, sdk?: Anthropic, env = process.env, suppliedPin?: SkillPin): Promise<Lab11Port> {
  const request = lab11RequestSchema.parse(input);
  if (!managedSettings(env).liveReady) throw new LabError('Configure Managed live mode first.');
  if (request.variant === 'missing-id') throw new LabError('No skill ID is configured for the missing-ID experiment; no session was created.');
  const bundle = request.variant === 'without-skill' ? null : await readSkillBundle(revisionFor(request));
  const pin = bundle ? suppliedPin ?? (await readSkillPins()).pins[bundle.revision] : null;
  if (bundle && (!pin || pin.bundleHash !== bundle.hash)) throw new LabError('The selected pin is absent or outdated. Run the explicit skills upload command before a live run.');
  const client = sdk ?? createManagedClient(env); let mismatch: string | null = null;
  const port: Lab11Port = { source: 'managed-api', bundle,
    configured: pin && bundle ? { ...pin, revision: bundle.revision } : null, resolvedSkills: null,
    ...liveSessionMethods(client.beta.sessions),
    async create() {
      const version = agentVersion(env);
      const base = await client.beta.agents.retrieve(managedResourceIds(env).agentId, version ? { version } : {}, { timeout: 3000 });
      if (base.multiagent || base.archived_at) throw new LabError('Lab 11 requires an active single-agent base. No session created.');
      // Read-only metadata validation before creating a paid-capable session. No upload here.
      if (pin && bundle) { const metadata = await client.beta.skills.versions.retrieve(pin.version, { skill_id: pin.skillId }, { timeout: 3000 });
        if (metadata.skill_id !== pin.skillId || metadata.id !== pin.version || metadata.name !== bundle.name || metadata.description !== bundle.description)
          throw new LabError('Pinned provider metadata differs from the authored bundle. No session created.'); }
      const session = await client.beta.sessions.create(lab11SessionParams(request, base, pin ?? null, env), { timeout: 5000 });
      const a = session.agent; const tools = effectiveToolsFrom(a.tools);
      port.resolvedSkills = a.skills.map(s => ({ type: s.type, skillId: s.skill_id, version: s.version }));
      const skillVerified = await verifyLab11ResolvedSkills(client, port.resolvedSkills, pin ?? null);
      if (a.id !== base.id || a.version !== base.version || a.model.id !== base.model.id || a.multiagent || a.mcp_servers.length ||
        a.tools.length !== 1 || a.tools[0]?.type !== 'agent_toolset_20260401' || a.tools[0].default_config.enabled ||
        tools.filter(t => t.enabled).length !== 1 || !tools.some(t => t.name === 'read' && t.enabled && t.policy === 'always_allow')) mismatch = 'Resolved session differs from the requested base agent or read-only toolset. No prompt sent.';
      else if (!skillVerified) mismatch = 'Resolved skill identity or version could not be verified against the immutable pin. No prompt sent.';
      // Return the created ID even on a mismatch, so the shared runner can archive it.
      return { effectiveTools: tools, session: { source: 'managed-api', id: session.id, status: session.status, agentId: a.id,
        agentVersion: a.version, environmentId: session.environment_id, budget: session.budget ? `${session.budget.max_list_cost.amount} USD cents` : null,
        toolCount: a.tools.length, mcpServerCount: a.mcp_servers.length } };
    },
    async open(id, signal) { if (mismatch) throw new LabError(mismatch); return liveSessionMethods(client.beta.sessions).open(id, signal); },
    async collectOutputs() { return { status: 'none', detail: 'Lab 11 returns text only; no output files are downloaded.' }; },
    async cleanup() { return 'not-needed'; },
  }; return port;
}
export async function createFixtureLab11Port(input: Lab11Request, stepMs = 30): Promise<Lab11Port & { calls: string[] }> {
  const request = lab11RequestSchema.parse(input); const calls: string[] = [];
  const bundle = request.variant === 'without-skill' || request.variant === 'missing-id' ? null : await readSkillBundle(revisionFor(request));
  const configured = bundle ? { skillId: 'skill_fixture_format', version: `fixture-${bundle.revision}`, revision: bundle.revision, bundleHash: bundle.hash } : null;
  const at = '2026-10-14T00:00:00Z'; let sent = false;
  return { source: 'authored-fixture', calls, bundle, configured,
    resolvedSkills: configured ? [{ type: 'custom', skillId: configured.skillId, version: configured.version }] : [],
    async create() { calls.push('create'); if (request.variant === 'missing-id') throw new LabError('Missing skill ID: no fixture session created.');
      return { effectiveTools: [{ name: 'read', enabled: true, policy: 'always_allow' }], session: { source: 'authored-fixture', id: `sesn_fixture_lab11_${randomUUID()}`,
        status: 'idle', agentId: 'agent_fixture', agentVersion: 1, environmentId: 'env_fixture', budget: '50 USD cents (simulated)', toolCount: 1, mcpServerCount: 0 } }; },
    async open(_id, signal) { calls.push('open'); return (async function* () {
      while (!sent) await delay(1, undefined, { signal });
      yield { type: 'session.status_running', id: 'run', processed_at: at } as StreamEvent;
      if (request.scenario === 'hang') { await new Promise<void>(resolve => signal.addEventListener('abort', () => resolve(), { once: true })); return; }
      if (bundle && request.scenario !== 'metadata-only') for (const file of ['SKILL.md', 'references/format.md']) {
        await delay(stepMs, undefined, { signal }); const content = bundle.files.find(f => f.path === file);
        const use: StreamEvent = { type: 'agent.tool_use', id: `use-${file}`, processed_at: at, name: 'read', input: { file_path: `/skills/${bundle.name}/${file}` }, evaluated_permission: 'allow', evaluation: { type: 'always_allow' } };
        yield use; if (request.scenario === 'duplicate-events') yield use;
        const failed = !content || request.scenario === 'failed-read';
        const result: StreamEvent = { type: 'agent.tool_result', id: `result-${file}`, processed_at: at, tool_use_id: use.id,
          is_error: failed, content: [{ type: 'text', text: failed ? 'Authored fixture: file read failed.' : content.text }] };
        yield result; if (request.scenario === 'duplicate-events') yield result;
      }
      yield { type: 'agent.message', id: 'answer', processed_at: at, content: [{ type: 'text', text: `Authored fixture (${request.variant}): ${bundle?.revision === 'v2' ? 'Sighting / Capture conditions / Data gaps / Next action' : 'Observation / Conditions / Follow-up'}. Three Aurora Finch birds; calm weather; offline capture. Time and location: Unknown. ${request.variant === 'absent-reference' ? 'Reference missing.' : request.scenario === 'metadata-only' ? 'No skill files loaded in this fixture.' : ''}` }] } as StreamEvent;
      yield { type: 'session.status_idle', id: 'idle', processed_at: at, stop_details: null, stop_reason: { type: 'end_turn' } } as StreamEvent;
    })(); },
    async send() { calls.push('send'); sent = true; }, async confirm() { throw new LabError('Fixture does not request confirmation.'); },
    async interrupt() { calls.push('interrupt'); }, async status() { calls.push('status'); return 'idle'; }, async archive() { calls.push('archive'); },
    async collectOutputs() { return { status: 'none', detail: 'No files written by the fixture.' }; }, async cleanup() { return 'not-needed'; },
  };
}
