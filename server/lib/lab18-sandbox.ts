import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import type { Confirmation } from '../../shared/lab03-tools.js';
import { toolsetFrom } from '../../shared/lab03-tools.js';
import { lab18AvailabilityResultSchema, lab18PlatformSchema, lab18ReportSchema } from '../../shared/lab18-sandbox.js';
import type { Lab18Availability, Lab18Input, Lab18Report } from '../../shared/lab18-sandbox.js';
import { agentVersion, effectiveToolsFrom, liveSessionMethods } from './tool-session-port.js';
import type { ToolSessionPort } from './tool-session-port.js';
import { createManagedClient, managedResourceIds, managedSettings } from './managed-config.js';

export const hostFixtureMount = '/fixture/mount/guide.txt';
export const hostFixtureText = 'Aurora Finch field guide\n';
const networkPolicy = { type: 'limited' as const, allowedHosts: [] as string[], allowMcpServers: false as const, allowPackageManagers: false as const };
export class Lab18Error extends Error { constructor(public status: number, message: string) { super(message); } }
export function lab18Confirmation(id: string, name: string | null, input: Record<string, unknown> | null): Confirmation {
  const allowed = name === 'bash' && input?.command === 'pwd';
  return { toolUseId: id, tool: name ?? 'unknown', result: allowed ? 'allow' : 'deny',
    reason: allowed ? 'Exact pwd command approved in the remote sandbox.' : 'Only exact pwd is allowed by this host.',
    denyMessage: allowed ? null : 'The host permits only the exact pwd command.' };
}

export class Lab18Service {
  constructor(private sdk?: Anthropic, private env: NodeJS.ProcessEnv = process.env) {}
  private client() { return this.sdk ?? createManagedClient(this.env); }
  platform() {
    const settings = managedSettings(this.env);
    let pinValid = true; try { agentVersion(this.env); } catch { pinValid = false; }
    return lab18PlatformSchema.parse({ source: 'server-configuration', environmentId: (this.env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? this.env.MANAGED_ENVIRONMENT_ID) || null,
      environmentVersion: 'not exposed by SDK 0.133.0', agentVersionPin: (this.env.MANAGED_AGENT_VERSION ?? '').slice(0, 30) || null,
      liveReady: settings.liveReady && pinValid, approvedMounts: [hostFixtureMount], authoredNetwork: networkPolicy,
      note: 'The mount is an offline host fixture only. Live pwd requests no file resources. Environment updated_at is a revision marker, not a version.' });
  }
  async availability(mode: 'scripted' | 'live', scenario: Lab18Input['scenario']): Promise<Lab18Availability> {
    if (mode === 'scripted') return lab18AvailabilityResultSchema.parse({ source: 'authored-host-policy', ready: scenario !== 'missing-environment',
      environmentId: scenario === 'missing-environment' ? null : 'env_authored_lab18', environmentUpdatedAt: null,
      environmentVersion: 'not exposed by SDK 0.133.0', cloud: false, archived: false,
      networking: scenario === 'missing-environment' ? 'unavailable' : 'limited', allowedHosts: [],
      approvedMounts: scenario === 'missing-environment' ? [] : [hostFixtureMount], sessionStarted: false,
      reason: scenario === 'missing-environment' ? 'No configured environment: fail closed before a host read or remote request.'
        : 'Authored host policy only; no cloud environment was queried.' });
    if (!this.platform().liveReady) return lab18AvailabilityResultSchema.parse({ source: 'managed-api', ready: false,
      environmentId: this.platform().environmentId, environmentUpdatedAt: null, environmentVersion: 'not exposed by SDK 0.133.0',
      cloud: false, archived: false, networking: 'unavailable', allowedHosts: [], approvedMounts: [], sessionStarted: false,
      reason: 'Live opt-in or isolated server configuration is unavailable. No provider request was made.' });
    const ids = managedResourceIds(this.env);
    try {
      const environment = await this.client().beta.environments.retrieve(ids.environmentId, {}, { timeout: 3000 });
      const config = environment.config, cloud = config.type === 'cloud';
      const network = config.type === 'cloud' ? config.networking : null;
      const packageCount = config.type === 'cloud' ? Object.values(config.packages).filter(Array.isArray).reduce((count, list) => count + list.length, 0) : 0;
      const ready = environment.id === ids.environmentId && !environment.archived_at && cloud && network?.type === 'limited' &&
        !network.allowed_hosts.length && !network.allow_mcp_servers && !network.allow_package_managers && packageCount === 0;
      return lab18AvailabilityResultSchema.parse({ source: 'managed-api', ready: Boolean(ready), environmentId: environment.id,
        environmentUpdatedAt: environment.updated_at, environmentVersion: 'not exposed by SDK 0.133.0', cloud,
        archived: Boolean(environment.archived_at), networking: cloud ? network!.type : 'not-applicable',
        allowedHosts: cloud && network?.type === 'limited' ? network.allowed_hosts.slice(0, 20) : [], approvedMounts: [], sessionStarted: false,
        reason: ready ? 'Observed active restricted cloud environment. No session was started; live run will recheck before creation.'
          : 'Configured environment differs from the exact restricted policy. Live run fails closed.' });
    } catch {
      return lab18AvailabilityResultSchema.parse({ source: 'managed-api', ready: false, environmentId: ids.environmentId,
        environmentUpdatedAt: null, environmentVersion: 'not exposed by SDK 0.133.0', cloud: false, archived: false,
        networking: 'unavailable', allowedHosts: [], approvedMounts: [], sessionStarted: false,
        reason: 'Environment could not be retrieved. No session was started.' });
    }
  }
  async offline(input: Lab18Input): Promise<Lab18Report> {
    const availability = await this.availability('scripted', input.scenario);
    if (!availability.ready) return lab18ReportSchema.parse({ mode: 'scripted', source: 'authored-host-policy', scenario: input.scenario, availability,
      host: { fixtureId: null, checkedPath: hostFixtureMount, allowed: false, readCalls: 0, networkCalls: 0, fileHash: null,
        effect: 'Fail closed: no fixture tree or file operation was started.' },
      remote: emptyRemote(), message: 'Missing authored environment. No provider request, network request or file read occurred.' });
    const root = await mkdtemp(join(tmpdir(), 'lab18-'));
    try {
      const mount = join(root, 'mount'); await mkdir(mount);
      const approved = join(mount, 'guide.txt'); await writeFile(approved, hostFixtureText, { encoding: 'utf8', flag: 'wx' });
      const allowed = input.scenario === 'allowed-mount';
      let hash: string | null = null;
      if (allowed) {
        const actualRoot = await realpath(root), actualFile = await realpath(approved), within = relative(actualRoot, actualFile);
        if (within !== join('mount', 'guide.txt')) throw new Lab18Error(422, 'Fixture path escaped its approved mount.');
        hash = createHash('sha256').update(await readFile(actualFile)).digest('hex');
      }
      return lab18ReportSchema.parse({ mode: 'scripted', source: 'authored-host-policy', scenario: input.scenario, availability,
        host: { fixtureId: root.split(/[\\/]/).at(-1), checkedPath: input.scenario === 'outside-mount' ? '/fixture/../secret.txt' : hostFixtureMount,
          allowed, readCalls: allowed ? 1 : 0, networkCalls: 0, fileHash: hash,
          effect: allowed ? 'Read exact allowlisted file from a disposable host tree and verified its SHA-256.'
            : input.scenario === 'blocked-network' ? 'Authored limited-network policy denied the request before opening a socket.'
              : 'Outside path denied by the host allowlist before opening any file.' },
        remote: emptyRemote(), message: 'This is a host-policy experiment. It does not prove cloud OS containment or make a provider request.' });
    } finally {
      const actualRoot = await realpath(root), actualTmp = await realpath(tmpdir()), rel = relative(actualTmp, actualRoot);
      if (!rel.startsWith('lab18-') || rel.includes('/') || rel.includes('\\')) throw new Error('Refusing to clean up outside the owned temporary fixture.');
      await rm(actualRoot, { recursive: true, force: true });
    }
  }
  livePort(input: Lab18Input, availability: Lab18Availability): ToolSessionPort {
    if (!availability.ready || input.mode !== 'live') throw new Lab18Error(422, 'Verified live cloud environment is required.');
    const env = this.env, client = this.client(), ids = managedResourceIds(env), sessions = client.beta.sessions;
    const toolset = toolsetFrom('always_ask', { bash: 'always_ask' });
    let verified = false;
    return { source: 'managed-api', async create() {
      const environment = await client.beta.environments.retrieve(ids.environmentId, {}, { timeout: 3000 });
      const network = environment.config.type === 'cloud' ? environment.config.networking : null;
      if (environment.archived_at || !network || network.type !== 'limited' || network.allowed_hosts.length || network.allow_mcp_servers || network.allow_package_managers ||
        Object.values(environment.config.type === 'cloud' ? environment.config.packages : {}).filter(Array.isArray).some(list => list.length))
        throw new Lab18Error(422, 'Cloud policy changed before the run. No session created.');
      const version = agentVersion(env);
      const agent = await client.beta.agents.retrieve(ids.agentId, version ? { version } : {}, { timeout: 3000 });
      if (agent.multiagent) throw new Lab18Error(422, 'A single-agent base is required. No session created.');
      const params: SessionCreateParams = { agent: { type: 'agent_with_overrides', id: agent.id, version: agent.version,
        tools: [toolset], mcp_servers: [], skills: [], system: 'For this diagnostic, request only the exact bash command pwd once. Do not access files or network.' },
        environment_id: ids.environmentId, title: 'Lab 18 sandbox boundary',
        budget: { type: 'limit', max_list_cost: { amount: String(input.budgetCents), currency: 'USD' } } };
      const session = await sessions.create(params, { timeout: 5000 });
      const effective = effectiveToolsFrom(session.agent.tools);
      verified = session.environment_id === ids.environmentId && session.agent.id === agent.id && session.agent.version === agent.version &&
        !session.agent.multiagent && session.agent.mcp_servers.length === 0 && session.agent.skills.length === 0 && session.agent.tools.length === 1 &&
        effective.filter(item => item.enabled).length === 1 && effective.some(item => item.name === 'bash' && item.enabled && item.policy === 'always_ask') &&
        session.budget?.max_list_cost.amount === String(input.budgetCents);
      return { session: { source: 'managed-api', id: session.id, status: session.status, agentId: session.agent.id,
        agentVersion: session.agent.version, environmentId: session.environment_id, budget: `${input.budgetCents} USD`,
        toolCount: session.agent.tools.length, mcpServerCount: session.agent.mcp_servers.length }, effectiveTools: effective };
    }, ...liveSessionMethods(sessions), async open(id, signal) {
      if (!verified) throw new Lab18Error(422, 'Resolved toolset differed from the exact host policy. No prompt sent.');
      return liveSessionMethods(sessions).open(id, signal);
    }, async collectOutputs() { return { status: 'none', detail: 'No remote output was requested or downloaded.' }; },
      async cleanup() { return 'not-needed'; } };
  }
}
function emptyRemote(): Lab18Report['remote'] { return { sessionId: null, outcome: 'not-started', toolUses: [], confirmations: 0,
  commandObserved: false, commandSucceeded: false, cleanup: 'not-needed', interruption: 'not-needed' }; }
