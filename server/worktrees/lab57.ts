import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lab57ResultSchema, lab57ScenarioSchema } from '../../shared/lab57-parallel-worktrees.js';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab57ScenarioSchema>;
const root = resolve('artifacts/lab57/runs');
const greetingBase = "export const greet = name => `Hello, ${name}!`;\n";
const taxBase = 'export const tax = amount => Math.round(amount * 0.10);\n';
const greetingWorker = "export const greet = name => `Welcome, ${name}!`;\n";
const greetingCompeting = "export const greet = name => `Hi, ${name}!`;\n";
const taxWorker = 'export const tax = amount => Math.round(amount * 0.11);\n';
const taxFailed = 'export const tax = amount => Math.round(amount * 0.99);\n';
function git(cwd: string, ...args: string[]) { return execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 20000,
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
function runTest(cwd: string, expression: string) {
  const source = `import {greet} from './greeting.js'; import {tax} from './tax.js';
    if (greet('Ada') !== ${JSON.stringify(expression.split('|')[0])} || tax(100) !== ${Number(expression.split('|')[1])}) process.exit(1);`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd, timeout: 10000,
    stdio: 'pipe', env: { SystemRoot: process.env.SystemRoot ?? '', TEMP: process.env.TEMP ?? '',
      TMP: process.env.TMP ?? '' } });
  return result.status === 0 && !result.error;
}
function paths(cwd: string) {
  const changedPaths = git(cwd, 'diff', '--name-only').split('\n').filter(Boolean);
  const untrackedPaths = git(cwd, 'ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean);
  return { changedPaths, untrackedPaths };
}
export function runWorktreeScenario(scenario: Scenario) {
  mkdirSync(root, { recursive: true }); const dir = mkdtempSync(resolve(root, 'run-'));
  const repo = resolve(dir, 'repo'); mkdirSync(repo); git(repo, 'init', '-q');
  git(repo, 'config', 'user.name', 'Lab 57 Host'); git(repo, 'config', 'user.email', 'host@example.invalid');
  writeFileSync(resolve(repo, 'package.json'), '{"type":"module"}\n');
  writeFileSync(resolve(repo, 'greeting.js'), greetingBase); writeFileSync(resolve(repo, 'tax.js'), taxBase);
  git(repo, 'add', 'package.json', 'greeting.js', 'tax.js'); git(repo, 'commit', '-qm', 'Base fixture');
  const baseSha = git(repo, 'rev-parse', 'HEAD'), timeline = [`Base fixture ${baseSha.slice(0, 12)}.`];
  const workers: z.infer<typeof lab57ResultSchema>['workers'] = [];
  const definitions = scenario === 'competing-edits' ? [
    { role: 'greeting' as const, filename: 'greeting.js', contents: greetingWorker, expected: 'Welcome, Ada!|10' },
    { role: 'competitor' as const, filename: 'greeting.js', contents: greetingCompeting, expected: 'Hi, Ada!|10' },
  ] : [
    { role: 'greeting' as const, filename: 'greeting.js', contents: greetingWorker, expected: 'Welcome, Ada!|10' },
    { role: 'tax' as const, filename: 'tax.js', contents: scenario === 'failed-worker' ? taxFailed : taxWorker,
      expected: 'Hello, Ada!|11' },
  ];
  for (const worker of definitions) {
    const branch = `worker/${worker.role}`, worktree = resolve(dir, worker.role);
    git(repo, 'worktree', 'add', '-qb', branch, worktree, baseSha);
    // A bounded host write tool: the role controls only its fixed allowlisted file.
    writeFileSync(resolve(worktree, worker.filename), worker.contents);
    const observed = paths(worktree), allowed = observed.changedPaths.length === 1 &&
      observed.changedPaths[0] === worker.filename && observed.untrackedPaths.length === 0;
    const testPassed = allowed && runTest(worktree, worker.expected);
    const cancelled = scenario === 'cancel-worker' && worker.role === 'tax';
    const committed = testPassed && !cancelled;
    if (committed) { git(worktree, 'add', '--', worker.filename); git(worktree, 'commit', '-qm', `Verified ${worker.role} edit`); }
    workers.push({ role: worker.role, branch, ...observed, testPassed, committed,
      claim: `${worker.role} says the edit is ready.`, hostEvidence: cancelled ? 'Cancelled before commit; edited worktree retained.' :
        testPassed ? 'Allowlisted path and behavioral test passed before host commit.' : 'Host path or behavioral test failed; no commit.' });
    timeline.push(`${worker.role}: ${cancelled ? 'cancelled' : testPassed ? 'verified' : 'failed'}; ${committed ? 'committed' : 'not committed'}.`);
  }
  let integration: z.infer<typeof lab57ResultSchema>['integration'] = 'blocked';
  let combinedTestsPassed = false, conflictAborted = false;
  if (scenario === 'cancel-worker') integration = 'cancelled';
  else if (workers.every(worker => worker.testPassed && worker.committed)) {
    git(repo, 'checkout', '-qb', 'integration', baseSha);
    for (const worker of workers) {
      const result = spawnSync('git', ['cherry-pick', worker.branch], { cwd: repo, timeout: 20000, stdio: 'pipe',
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' } });
      if (result.status !== 0) {
        git(repo, 'cherry-pick', '--abort'); conflictAborted = true; integration = 'conflicted';
        timeline.push(`Conflict while integrating ${worker.branch}; cherry-pick aborted and branches preserved.`); break;
      }
      timeline.push(`Cherry-picked ${worker.branch} serially.`);
    }
    if (!conflictAborted) {
      combinedTestsPassed = runTest(repo, 'Welcome, Ada!|11');
      integration = combinedTestsPassed ? 'passed' : 'blocked';
      timeline.push(`Combined behavioral tests ${combinedTestsPassed ? 'passed' : 'failed'}.`);
    }
  } else timeline.push('Integration blocked by unverified or cancelled worker.');
  // Confirm the actual fixture still exists and branch refs survived a conflict/cancel.
  const branchesPreserved = workers.every(worker => git(repo, 'branch', '--list', worker.branch).includes(worker.branch));
  if (integration === 'passed' && readFileSync(resolve(repo, 'greeting.js'), 'utf8').replace(/\r\n/g, '\n') !== greetingWorker)
    throw new Error('Integrated greeting differs from verified worker edit.');
  return lab57ResultSchema.parse({ source: 'offline-host-git', scenario, baseSha, workers, integration,
    combinedTestsPassed, conflictAborted, branchesPreserved, providerCalls: 0, timeline,
    note: 'Disposable local Git worktrees and authored worker actions; no Managed worker session. Cloud /workspace is not this Windows fixture.' });
}
