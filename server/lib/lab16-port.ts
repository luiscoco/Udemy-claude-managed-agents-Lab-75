import Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import type { Lab16Run } from '../../shared/lab16-settings-env.js';
import { createLiveLab01Port } from './lab01-port.js';
import type { Lab01Port } from './lab01-port.js';
import { LabError } from './lab01-run.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';
import { fixtureMount, lab16Manifest } from './lab16-provenance.js';

export type Lab16Port = Lab01Port & { evidence: {
  requestedMount: string | null; observedMount: Lab16Run['observedMount']; resolvedEnvironment: Lab16Run['resolvedEnvironment'];
  creation: 'not-started' | 'confirmed' | 'rejected' | 'uncertain'; verified: boolean } };

export function createLiveLab16Port(sdk?: Anthropic, env: NodeJS.ProcessEnv = process.env): Lab16Port {
  if (!lab16Manifest(env).liveReady) throw new LabError('Configure the base resources, live opt-in and approved file ID before a live run.');
  const client = sdk ?? createManagedClient(env), base = createLiveLab01Port(client, env), ids = managedResourceIds(env);
  const fileId = env.CLAUDE_MANAGED_LAB16_FILE_ID!;
  const evidence: Lab16Port['evidence'] = { requestedMount: null, observedMount: 'absent', resolvedEnvironment: null,
    creation: 'not-started', verified: false };
  return { ...base, evidence,
    async create() {
      const environment = await client.beta.environments.retrieve(ids.environmentId, {}, { timeout: 3000 });
      evidence.resolvedEnvironment = { kind: environment.config.type, archived: environment.archived_at !== null,
        networking: environment.config.type === 'cloud' ? environment.config.networking.type : 'not-applicable',
        packageCount: environment.config.type === 'cloud' ? Object.values(environment.config.packages).filter(Array.isArray).reduce((sum, list) => sum + list.length, 0) : 0 };
      if (environment.archived_at || environment.config.type !== 'cloud') throw new LabError('Select an active Managed cloud environment. No session was created.');
      const network = environment.config.networking;
      if (network.type !== 'limited' || network.allowed_hosts.length || network.allow_mcp_servers || network.allow_package_managers ||
        evidence.resolvedEnvironment.packageCount) throw new LabError('The configured cloud environment differs from the authored restricted policy. No session was created.');
      const agent = await client.beta.agents.retrieve(ids.agentId, {}, { timeout: 3000 });
      if (agent.multiagent) throw new LabError('Select a single-agent base. No session was created.');
      const params: SessionCreateParams = { agent: { type: 'agent_with_overrides', id: ids.agentId, version: agent.version,
        tools: [], mcp_servers: [], skills: [], system: 'Answer briefly. The mounted file is a configured resource; do not claim you read its contents without an observed read.' },
        environment_id: ids.environmentId, title: 'Lab 16 configuration provenance',
        budget: { type: 'limit', max_list_cost: { amount: managedSettings(env).budgetCents, currency: 'USD' } },
        resources: [{ type: 'file', file_id: fileId, mount_path: fixtureMount }] };
      evidence.requestedMount = fixtureMount; evidence.creation = 'uncertain';
      let session;
      try { session = await client.beta.sessions.create(params, { timeout: 5000 }); }
      catch (error) { if (error instanceof Anthropic.APIError && [400, 403, 404, 422].includes(error.status ?? 0)) evidence.creation = 'rejected'; throw error; }
      evidence.creation = 'confirmed';
      // A returned ID survives resource-list failure so the runner can still archive this session.
      try {
        const page = await client.beta.sessions.resources.list(session.id, { limit: 10 }, { timeout: 3000 });
        evidence.observedMount = page.data.some(resource => resource.type === 'file' && resource.mount_path === fixtureMount) ? 'listed' : 'unconfirmed';
      } catch { evidence.observedMount = 'unconfirmed'; }
      evidence.verified = session.environment_id === ids.environmentId && session.agent.id === ids.agentId && session.agent.version === agent.version &&
        session.agent.tools.length === 0 && session.agent.mcp_servers.length === 0 && session.agent.skills.length === 0 &&
        session.budget?.max_list_cost.amount === managedSettings(env).budgetCents && session.budget?.max_list_cost.currency === 'USD' && evidence.observedMount === 'listed';
      return { source: 'managed-api', id: session.id, status: session.status, agentId: session.agent.id,
        agentVersion: session.agent.version, environmentId: session.environment_id,
        budget: `${session.budget?.max_list_cost.amount ?? '?'} USD`, toolCount: session.agent.tools.length,
        mcpServerCount: session.agent.mcp_servers.length };
    }, async open(id, signal) {
      if (!evidence.verified) throw new LabError('The resolved session or approved resource mount was not confirmed. No prompt was sent.');
      return base.open(id, signal);
    } };
}
