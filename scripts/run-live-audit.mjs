import { spawn } from 'node:child_process';
import { mkdir, open, readFile, writeFile, access, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { validateLiveEvidence, failedLiveEvidence } from './live-audit-evidence.mjs';

if (process.argv[2] !== '--execute-authorized-live-tests') throw new Error('Explicit billed execution flag required.');
const selected = process.argv[3]?.replace(/^--suite=/, '') ?? 'course';
const commands = {
  course: ['scripts/live-course-smoke.ts', '--execute-authorized-live-tests'],
  learning: ['scripts/live-learning-smoke.ts', '--execute-authorized-live-tests'],
  host: ['scripts/live-host-integrations-smoke.ts', '--execute-authorized-live-tests'],
  team: ['scripts/live-lab75-smoke.ts', '--execute-authorized-live-test', '--budget-cents=300'],
};
if (selected !== 'all' && !Object.hasOwn(commands, selected)) throw new Error('Choose course, learning, host, team or all.');
const suites = selected === 'all' ? Object.keys(commands) : [selected];
// Validate all selected prerequisites before starting the first paid session.
const sharedRequired = suites.some(suite => suite !== 'team');
const required = ['CLAUDE_MANAGED_ENVIRONMENT_ID', ...(sharedRequired ? ['ANTHROPIC_API_KEY', 'CLAUDE_MANAGED_AGENT_ID'] : [])];
if (suites.includes('team')) required.push('LAB75_ANTHROPIC_API_KEY', ...['PLANNER', 'DEVELOPER', 'REVIEWER'].flatMap(role => [`LAB75_${role}_AGENT_ID`, `LAB75_${role}_AGENT_VERSION`]));
if (process.env.MANAGED_LIVE_ENABLED !== 'true' || required.some(key => !process.env[key]?.trim())) throw new Error('Required live configuration is missing; no session started.');
const directory = `artifacts/ci/live-${randomUUID()}`;
await mkdir(directory, { recursive: true });
let createdPins = false;
const pinsPath = 'managed/lab11-skills.local.json';
const summary = { source: 'actual-provider', selected, passed: false, results: [] };
let stage = 'preflight';
try {
  const { managedSettings } = await import('../server/lib/managed-config.ts');
  const { agentVersion } = await import('../server/lib/tool-session-port.ts');
  if (sharedRequired) {
    if (!managedSettings().liveReady) throw new Error('Shared live settings are invalid.');
    agentVersion(process.env);
  }
  if (suites.includes('team')) {
    const { liveTeamReadiness } = await import('../server/team/live.ts');
    if (!liveTeamReadiness().ready) throw new Error('Dedicated team role pins are invalid.');
  }
  if (suites.includes('learning')) {
    stage = 'skill-pin-preflight';
    const { pinManifestSchema } = await import('../shared/lab11-skills.ts');
    if (process.env.LAB11_SKILL_PINS_JSON) {
      try { await access(pinsPath); throw new Error('Existing local skill pins will not be overwritten.'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      const pins = pinManifestSchema.parse(JSON.parse(process.env.LAB11_SKILL_PINS_JSON));
      await writeFile(pinsPath, JSON.stringify(pins), { flag: 'wx', mode: 0o600 }); createdPins = true;
    }
    const { readSkillPins, readSkillBundle } = await import('../server/lib/lab11-bundle.ts');
    const manifest = await readSkillPins();
    for (const revision of ['v1', 'v2']) if (manifest.pins[revision]?.bundleHash !== (await readSkillBundle(revision)).hash) throw new Error('Reviewed skill version pins are missing or outdated.');
  }
  if (suites.includes('host')) {
    stage = 'python-preflight';
    const { runLab70Python } = await import('../server/lib/lab70-python.ts');
    const probe = await runLab70Python({ mode: 'readiness' }, { signal: new AbortController().signal });
    if (probe.protocolError || !probe.frames.some(frame => frame.type === 'readiness' && frame.capable)) throw new Error('Python live readiness failed; no session started.');
  }
  for (const suite of suites) {
    stage = suite;
    const output = await open(`${directory}/${suite}.stdout.log`, 'wx', 0o600);
    const errors = await open(`${directory}/${suite}.stderr.log`, 'wx', 0o600);
    let code;
    console.log(`Starting bounded live suite: ${suite}`);
    try {
      code = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--import', 'tsx', ...commands[suite]], {
          env: process.env, windowsHide: true, stdio: ['ignore', output.fd, errors.fd],
        });
        child.once('error', reject); child.once('close', resolve);
      });
    } finally { await output.close(); await errors.close(); }
    const records = (await readFile(`${directory}/${suite}.stdout.log`, 'utf8')).split(/\r?\n/).flatMap(line => {
      try { const value = JSON.parse(line); return value && typeof value === 'object' ? [value] : []; } catch { return []; }
    });
    try {
      if (code !== 0) throw new Error(`Live ${suite} process failed; no later suite started. Inspect private local evidence and cleanup.`);
      summary.results.push(validateLiveEvidence(suite, records));
    } catch (error) {
      summary.results.push(failedLiveEvidence(suite, records, code));
      throw error;
    }
    await writeFile(`${directory}/summary.json`, JSON.stringify(summary, null, 2));
    console.log(`Verified live suite and remote archival: ${suite}`);
  }
  summary.passed = true;
} catch (error) {
  const { redact } = await import('../src/lib/presentation.ts');
  await writeFile(`${directory}/runner.error.log`, redact(error instanceof Error ? error.message : 'Unknown failure').slice(0, 1000));
  // Child logs and provider payloads stay private; only bounded authored statuses enter CI output.
  summary.failure = 'Live acceptance or readiness failed. Later suites were not started; inspect private logs and provider cleanup.';
  summary.failureAt = stage;
  process.exitCode = 1;
} finally {
  if (createdPins) await unlink(pinsPath);
  await writeFile(`${directory}/summary.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ...summary, evidenceDirectory: directory }));
}
