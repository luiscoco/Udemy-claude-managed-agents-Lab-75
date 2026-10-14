import Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import type { BetaManagedAgentsModel } from '@anthropic-ai/sdk/resources/beta/agents/agents';
import { lab14CatalogSchema, lab14Models, lab14Supported, lab14RequestSchema } from '../../shared/lab14-models.js';
import type { Lab14Input, Lab14Snapshot } from '../../shared/lab14-models.js';
import { createFixturePort, createLiveLab01Port } from './lab01-port.js';
import type { Lab01Port } from './lab01-port.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { LabError } from './lab01-run.js';
import { randomUUID } from 'node:crypto';

// Compile-time intersection with the pinned SDK. A string union is not account authorization.
const pinnedModels: readonly BetaManagedAgentsModel[] = lab14Models;
export function lab14Catalog(env = process.env) {
  const settings = managedSettings(env);
  const ready = new Set((env.CLAUDE_MANAGED_LAB14_MODELS ?? '').split(',').map(value => value.trim()));
  return lab14CatalogSchema.parse({ sdkVersion: '0.133.0', checkedOn: '2026-10-14', providerVerified: false,
    liveReady: settings.liveReady, deadlineSeconds: settings.deadlineMs / 1000,
    models: pinnedModels.map(id => ({ id, efforts: lab14Supported[id as (typeof lab14Models)[number]], accountReady: ready.has(id),
      readiness: ready.has(id) ? 'Operator configured; provider access is not verified by setup.' : 'Not declared ready. Add this ID to CLAUDE_MANAGED_LAB14_MODELS after checking account access.' })),
    unsupported: [
      { setting: 'thinking / budget_tokens', reason: 'Not fields of Managed session model configuration in SDK 0.133.0.' },
      { setting: 'fallbackModel / supportedModels', reason: 'Agent SDK controls are not Managed session fields. This host owns a closed catalog and fallback policy.' },
      { setting: 'In-place model or effort change', reason: 'SessionUpdateParams supports tool/MCP changes, not model/effort. Create a new session.' },
    ], sources: ['https://platform.claude.com/docs/en/build-with-claude/effort', 'https://platform.claude.com/docs/en/managed-agents/sessions', 'https://platform.claude.com/docs/en/api/typescript/beta/sessions/create'] });
}
export type Lab14Port = Lab01Port & { snapshot: Lab14Snapshot | null; creation: 'confirmed' | 'rejected' | 'uncertain' | 'not-started' };
export function createLab14Port(input: Lab14Input, sdk?: Anthropic, env = process.env): Lab14Port {
  input = lab14RequestSchema.parse(input);
  if (input.mode === 'scripted') {
    const base = createFixturePort(input.scenario === 'hang' ? 'deadline' : 'normal', 20);
    const port: Lab14Port = { ...base, snapshot: null, creation: 'not-started', async create() {
      if (input.scenario === 'primary-unavailable') { port.creation = 'rejected'; throw new LabError('Authored primary model unavailable; no session created.'); }
      if (input.scenario === 'uncertain') { port.creation = 'uncertain'; throw new LabError('Authored unknown creation outcome; fallback blocked.'); }
      const session = await base.create(); port.creation = 'confirmed';
      port.snapshot = { model: input.configuration.model, effort: input.scenario === 'mismatch' ? 'low' : input.configuration.effort,
        agentVersion: 1, budgetCents: String(input.configuration.budgetCents), matches: input.scenario !== 'mismatch' };
      return { ...session, id: `sesn_fixture_lab14_${randomUUID()}` };
    }, async open(id, signal) {
      if (!port.snapshot?.matches) throw new LabError('Resolved model, effort or capabilities differ from the request. No prompt sent.');
      const stream = await base.open(id, signal);
      return (async function* () { for await (const event of stream) yield event.type === 'agent.message'
        ? { ...event, content: [{ type: 'text' as const, text: 'Authored notebook summary (identical across effort levels):\n1. Save observations durably on the device.\n2. Queue uploads with stable record IDs.\n3. Reconcile conflicts and verify synchronization.' }] } : event; })();
    } };
    return port;
  }
  const catalog = lab14Catalog(env);
  if (!catalog.liveReady || !catalog.models.find(model => model.id === input.configuration.model)?.accountReady) throw new LabError('Base setup or operator-declared model readiness is unavailable.');
  const client = sdk ?? createManagedClient(env), ids = managedResourceIds(env);
  const base = createLiveLab01Port(client, env);
  let acceptedId: string | undefined;
  const port: Lab14Port = { ...base, snapshot: null, creation: 'not-started', async create() {
    const rawVersion = env.MANAGED_AGENT_VERSION;
    if (rawVersion !== undefined && (!/^[1-9]\d*$/.test(rawVersion) || !Number.isSafeInteger(Number(rawVersion)))) throw new LabError('Invalid MANAGED_AGENT_VERSION.');
    const agent = await client.beta.agents.retrieve(ids.agentId, rawVersion ? { version: Number(rawVersion) } : {}, { timeout: 3000 });
    if (agent.multiagent) throw new LabError('Select a single-agent base configuration. No session was created.');
    const parameters: SessionCreateParams = { agent: { type: 'agent_with_overrides', id: ids.agentId, version: agent.version,
      model: { id: input.configuration.model, effort: input.configuration.effort }, tools: [], mcp_servers: [], skills: [],
      system: 'Answer the user briefly using public conclusions only. Do not provide private reasoning.' },
      environment_id: ids.environmentId, title: 'Lab 14 model and effort',
      budget: { type: 'limit', max_list_cost: { amount: String(input.configuration.budgetCents), currency: 'USD' } } };
    // No retries: a network failure may have created remote work without returning its ID.
    port.creation = 'uncertain';
    let session;
    try { session = await client.beta.sessions.create(parameters, { timeout: 5000 }); }
    catch (error) { if (error instanceof Anthropic.APIError && [400, 403, 404, 422].includes(error.status ?? 0)) port.creation = 'rejected'; throw error; }
    port.creation = 'confirmed';
    const resolved = session.agent;
    port.snapshot = { model: resolved.model.id, effort: resolved.model.effort?.type ?? null, agentVersion: resolved.version,
      budgetCents: session.budget?.max_list_cost.amount ?? '', matches: resolved.model.id === input.configuration.model && resolved.model.effort?.type === input.configuration.effort
        && session.budget?.max_list_cost.amount === String(input.configuration.budgetCents) && session.budget?.max_list_cost.currency === 'USD'
        && resolved.tools.length === 0 && resolved.mcp_servers.length === 0 && resolved.skills.length === 0 && !resolved.multiagent
        && resolved.version === agent.version && session.environment_id === ids.environmentId };
    // Return the ID even on a mismatch, so the shared runner can archive it without sending.
    return { source: 'managed-api', id: session.id, status: session.status, agentId: resolved.id, agentVersion: resolved.version,
      environmentId: session.environment_id, budget: `${session.budget?.max_list_cost.amount ?? '?'} USD`,
      toolCount: resolved.tools.length, mcpServerCount: resolved.mcp_servers.length };
  }, async send(id, prompt, signal) {
    const sent = await client.beta.sessions.events.send(id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal });
    acceptedId = sent.data?.find(event => event.type === 'user.message')?.id;
    if (!acceptedId) throw new LabError('Prompt acknowledgment did not return an event ID; remote work is uncertain.');
  }, async open(id, signal) {
    if (!port.snapshot?.matches) throw new LabError('Resolved model, effort, version, budget or capabilities differ from the request. No prompt sent.');
    const stream = await client.beta.sessions.events.stream(id, {}, { signal });
    return (async function* () { let started = false, observed = 0; try {
      for await (const event of stream) {
        if (++observed > 1000) throw new LabError('Session event limit reached; reconciling remote work.');
        if (!started && 'id' in event && event.id === acceptedId && event.type === 'user.message') started = true;
        if (started && event.type !== 'agent.thinking' && event.type !== 'event_start' && event.type !== 'event_delta') yield event;
      }
    } finally { stream.controller.abort(); } })();
  } };
  return port;
}
