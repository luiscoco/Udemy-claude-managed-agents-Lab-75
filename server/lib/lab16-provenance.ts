import type { BetaCloudConfigParams } from '@anthropic-ai/sdk/resources/beta/environments/environments';
import { lab16ResolutionSchema } from '../../shared/lab16-settings-env.js';
import type { Lab16Input, Lab16Resolution } from '../../shared/lab16-settings-env.js';
import { managedSettings } from './managed-config.js';

// An authored example, not a claim that the account's environment has this policy.
export const authoredEnvironment: BetaCloudConfigParams = { type: 'cloud', networking: {
  type: 'limited', allowed_hosts: [], allow_mcp_servers: false, allow_package_managers: false }, packages: null };
export const fixtureMount = '/mnt/session/uploads/field-guide.txt';
export const approvedFile = { name: 'field-guide.txt', mountPath: fixtureMount, approved: true };

export function lab16Manifest(env: NodeJS.ProcessEnv = process.env) {
  const settings = managedSettings(env);
  const fileId = env.CLAUDE_MANAGED_LAB16_FILE_ID ?? '';
  return { source: 'host-allowlist' as const, liveReady: settings.liveReady && /^file_[A-Za-z0-9]+$/.test(fileId),
    credentialNames: ['ANTHROPIC_API_KEY'], credentialReady: Boolean(env.ANTHROPIC_API_KEY?.trim()),
    environmentConfigured: Boolean((env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID)?.trim()),
    remoteFixtureConfigured: /^file_[A-Za-z0-9]+$/.test(fileId), files: [approvedFile],
    authoredEnvironment: { type: 'cloud' as const, networking: { type: 'limited' as const, allowedHosts: [] as string[],
      allowMcpServers: false, allowPackageManagers: false }, packages: [] as string[] },
    unsupported: ['env inheritance/replacement', 'settings.env', 'settingSources', 'resolveSettings', 'additionalDirectories', 'Agent SDK native sandbox flags'] };
}

export function resolveLab16(input: Lab16Input): Lab16Resolution {
  const hostRegion = input.sessionRegion ?? input.userRegion ?? 'north';
  const regionSource = input.sessionRegion ? 'session override' : input.userRegion ? 'user override' : 'course default';
  const credentialReady = input.scenario !== 'missing-credential';
  const remoteMountReady = input.scenario !== 'absent-remote-mount';
  const restricted = input.scenario === 'restricted-path';
  return lab16ResolutionSchema.parse({ scenario: input.scenario,
    precedence: 'Application-defined: session override > user override > course default',
    credentialReady, remoteMountReady, accessAllowed: remoteMountReady && !restricted,
    accessReason: restricted ? 'Outside the approved mount: host policy denies the path before any file operation.'
      : remoteMountReady ? 'Approved fixture path is available in this authored scenario.' : 'No remote file resource was mounted.',
    rows: [
      { name: 'OBSERVATION_REGION', hostValue: hostRegion, hostSource: regionSource, remoteValue: 'not injected', remoteSource: 'no Managed session env option',
        note: 'Host precedence affects this application only. A host process variable does not enter the sandbox automatically.' },
      { name: 'ANTHROPIC_API_KEY', hostValue: credentialReady ? 'configured (redacted)' : 'missing', hostSource: 'synthetic server readiness',
        remoteValue: 'not injected', remoteSource: 'server credential', note: 'The server key never becomes an agent-visible environment variable.' },
      { name: 'field-guide.txt', hostValue: 'approved fixture manifest', hostSource: 'host allowlist',
        remoteValue: remoteMountReady ? fixtureMount : 'not mounted', remoteSource: remoteMountReady ? 'explicit file resource' : 'absent resource',
        note: 'Mounting one approved file does not grant the sandbox access to host directories.' },
      { name: 'RESTRICTED_PATH', hostValue: restricted ? '/etc/passwd' : fixtureMount, hostSource: 'experiment input',
        remoteValue: restricted ? 'blocked before access' : remoteMountReady ? 'approved path' : 'unavailable', remoteSource: 'host path guard',
        note: 'Host path checks demonstrate local policy, not cloud OS containment.' },
    ], evidence: [`Course default region: north; user override: ${input.userRegion ?? 'absent'}; session override: ${input.sessionRegion ?? 'absent'}.`,
      `Winning host layer: ${regionSource}.`, credentialReady ? 'Fictional credential readiness: configured; no value inspected.' : 'Fictional credential readiness: missing.',
      remoteMountReady ? 'Authored file resource present in fixture scenario.' : 'Authored file resource absent; no remote read is possible.',
      restricted ? 'Restricted-path request denied by host path allowlist.' : 'No restricted path requested.'] });
}

export function checkLab16Access(path: string, mounted: boolean) {
  if (path !== fixtureMount) return { allowed: false, reason: 'Path is outside the single approved fixture mount; no file opened.' };
  if (!mounted) return { allowed: false, reason: 'Approved path has no mounted resource in this scenario.' };
  return { allowed: true, reason: 'Approved fixture path only; this is a host policy result, not a cloud filesystem read.' };
}
