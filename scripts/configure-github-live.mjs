import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const repository = 'luiscoco/Udemy-claude-managed-agents-Lab-75';
const environment = 'live-tests';
const endpoint = `repos/${repository}/environments/${environment}`;

// Values travel through stdin, never process arguments, console output or files.
export function ghCall(args, input = '') {
  const env = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'GH_CONFIG_DIR', 'GH_TOKEN', 'GITHUB_TOKEN']) {
    if (process.env[key]) env[key] = process.env[key];
  }
  env.GH_PROMPT_DISABLED = '1';
  const result = spawnSync(process.env.LEARNING_GH_EXECUTABLE || 'gh', args, {
    input, encoding: 'utf8', env, windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024,
  });
  if (result.error) throw new Error('GitHub CLI is unavailable. Install it and complete gh auth login first.');
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

export async function localConfiguration(env = process.env) {
  const { managedSettings } = await import('../server/lib/managed-config.ts');
  const { liveTeamReadiness } = await import('../server/team/live.ts');
  const { readSkillPins, readSkillBundle } = await import('../server/lib/lab11-bundle.ts');
  if (!managedSettings(env).liveReady || !liveTeamReadiness(env).ready) throw new Error('Existing local live configuration is incomplete.');
  const pins = await readSkillPins();
  for (const revision of ['v1', 'v2']) if (pins.pins[revision]?.bundleHash !== (await readSkillBundle(revision)).hash) throw new Error('Reviewed local skill pins are missing or outdated.');
  const secrets = { ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY, LAB75_ANTHROPIC_API_KEY: env.LAB75_ANTHROPIC_API_KEY, LAB11_SKILL_PINS_JSON: JSON.stringify(pins) };
  const names = ['CLAUDE_MANAGED_AGENT_ID', 'CLAUDE_MANAGED_ENVIRONMENT_ID',
    ...['PLANNER', 'DEVELOPER', 'REVIEWER'].flatMap(role => [`LAB75_${role}_AGENT_ID`, `LAB75_${role}_AGENT_VERSION`])];
  return { secrets, variables: Object.fromEntries(names.map(name => [name, env[name]])) };
}

export function configure(configuration, call = ghCall) {
  const invoke = (args, input, allowMissing = false) => {
    const result = call(args, input);
    if (allowMissing && result.status !== 0 && /HTTP 404/.test(result.stderr)) return null;
    if (result.status !== 0) throw new Error('GitHub operation failed. Check CLI sign-in and repository administration access; no diagnostic payload was printed.');
    return result.stdout.trim() ? JSON.parse(result.stdout) : {};
  };
  if (call(['auth', 'status', '--hostname', 'github.com']).status !== 0) throw new Error('Sign in first with gh auth login --hostname github.com --web.');
  const repo = invoke(['api', `repos/${repository}`]);
  if (repo.permissions?.admin !== true) throw new Error('Repository administration access is required to configure environment secrets.');
  const current = invoke(['api', endpoint], undefined, true);
  const collection = (suffix, key) => invoke(['api', '--paginate', '--slurp', `${endpoint}/${suffix}`]).flatMap(page => page[key]);
  // Preserve all existing reviewers, timers and branch policies without changing them.
  if (current && !current.deployment_branch_policy) throw new Error('Existing environment has no branch restriction. Review its protection settings before setup.');
  const oldVariables = current ? collection('variables', 'variables') : [];
  for (const item of oldVariables) if (Object.hasOwn(configuration.variables, item.name) && item.value !== configuration.variables[item.name]) throw new Error('An existing environment variable differs; no settings were changed.');
  const oldSecrets = current ? collection('secrets', 'secrets') : [];
  if (current?.deployment_branch_policy?.custom_branch_policies) {
    const policies = collection('deployment-branch-policies', 'branch_policies');
    if (!policies.some(policy => policy.name === 'main' && policy.type === 'branch')) throw new Error('Existing branch policy does not explicitly allow main. No protections were changed.');
  }
  if (!current) {
    invoke(['api', '--method', 'PUT', endpoint, '--input', '-'], JSON.stringify({ deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } }));
    invoke(['api', '--method', 'POST', `${endpoint}/deployment-branch-policies`, '--input', '-'], JSON.stringify({ name: 'main', type: 'branch' }));
  }
  const saved = [], preserved = [];
  for (const [name, value] of Object.entries(configuration.variables)) {
    if (oldVariables.some(item => item.name === name)) continue;
    const result = call(['variable', 'set', name, '--env', environment, '--repo', repository], value);
    if (result.status !== 0) throw new Error(`Could not save variable ${name}; existing protections were preserved.`);
    saved.push(name);
  }
  for (const [name, value] of Object.entries(configuration.secrets)) {
    if (oldSecrets.some(item => item.name === name)) { preserved.push(name); continue; }
    const result = call(['secret', 'set', name, '--env', environment, '--repo', repository], value);
    if (result.status !== 0) throw new Error(`Could not save secret ${name}; no secret value was printed.`);
    saved.push(name);
  }
  const remoteSecrets = collection('secrets', 'secrets');
  const remoteVariables = collection('variables', 'variables');
  if (!Object.keys(configuration.secrets).every(name => remoteSecrets.some(item => item.name === name))
    || !Object.entries(configuration.variables).every(([name, value]) => remoteVariables.some(item => item.name === name && item.value === value))) throw new Error('Remote configuration verification failed.');
  return { repository, environment, configured: true, saved, preservedExistingSecrets: preserved, valuesVerified: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const flag = process.argv[2];
    if (flag && !['--check', '--configure-live-environment'].includes(flag)) throw new Error('Use --check or --configure-live-environment.');
    const configuration = await localConfiguration();
    console.log(JSON.stringify(flag === '--configure-live-environment' ? configure(configuration) : {
      repository, environment, localReady: true, remoteChanged: false,
      secrets: Object.keys(configuration.secrets), variables: Object.keys(configuration.variables),
    }));
  } catch (error) { console.error(error instanceof Error ? error.message : 'Setup failed.'); process.exitCode = 1; }
}
