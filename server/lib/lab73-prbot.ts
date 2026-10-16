import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { reviewSchema, prToolSchema, type Finding, type PrScenario } from '../../shared/lab73-pr-reviewer-fixer.js';
// Exported host helpers are reused by the team capstone. No model-authored process arguments.
export const cleanEnv = () => Object.fromEntries(Object.entries({ SystemRoot: process.env.SystemRoot, PATH: process.env.PATH,
  TEMP: process.env.TEMP, TMP: process.env.TMP, HOME: process.env.TEMP, USERPROFILE: process.env.TEMP,
  GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' }).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
export function runProcess(executable: string, args: readonly string[], cwd: string, timeout = 10000, signal?: AbortSignal): Promise<{ code: number; text: string; timedOut: boolean }> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(executable, [...args], { cwd, env: cleanEnv(), shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], ...(signal ? { signal } : {}) });
    let text = '', timedOut = false, overflow = false; const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeout);
    const collect = (chunk: Buffer) => { if (text.length + chunk.length > 65536) { overflow = true; child.kill(); } else text += chunk.toString('utf8'); };
    child.stdout.on('data', collect); child.stderr.on('data', collect); child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', code => { clearTimeout(timer); resolveResult({ code: code ?? -1, text: text.slice(0, 65536), timedOut: timedOut || overflow }); });
  });
}
const gitCommands = new Set(['init', 'config', 'add', 'commit', 'checkout', 'diff', 'rev-parse', 'ls-files', 'status', 'worktree', 'merge', 'reset', 'clean', 'show', 'log', 'restore']);
export async function hostGit(root: string, ...args: string[]) {
  if (!gitCommands.has(args[0] ?? '')) throw new Error('Host Git operation rejected.');
  const result = await runProcess('git', ['-c', 'core.hooksPath=NUL', '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', ...args], root, 20000);
  if (result.code !== 0 || result.timedOut) throw new Error(`Host Git ${args[0]} failed: ${result.text.slice(0, 300)}`); return result.text.trim();
}
export async function checkedPath(root: string, file: string, allow: readonly string[]) {
  if (!allow.includes(file) || /[\\\0]|(?:^|\/)\.{1,2}(?:\/|$)/.test(file) || isAbsolute(file)) throw new Error('File outside assigned scope.');
  const target = resolve(root, file); if (relative(root, target).startsWith('..')) throw new Error('Path escapes checkout.');
  let path = root; for (const part of file.split('/')) { path = resolve(path, part); try { const part = relative(await realpath(root), await realpath(path)); if ((await lstat(path)).isSymbolicLink() || part.startsWith('..') || isAbsolute(part)) throw new Error('Link path rejected.'); } catch (error) { if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error; } }
  return target;
}
export type DiffLine = { file: string; line: number; text: string };
export function parseDiff(diff: string): DiffLine[] {
  const lines: DiffLine[] = []; let file = '', line = 0;
  for (const text of diff.split('\n')) { if (text.startsWith('+++ b/')) file = text.slice(6); else if (text.startsWith('@@')) { const match = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(text); if (match) line = Number(match[1]); }
    else if (text.startsWith('+') && !text.startsWith('+++')) lines.push({ file, line: line++, text: text.slice(1) }); else if (!text.startsWith('-') && !text.startsWith('\\')) line++; } return lines;
}
export const numberedDiff = (diff: string) => parseDiff(diff).map(item => `${item.file}:${item.line} + ${item.text}`).join('\n');
export function routeFindings(raw: unknown, diff: string) {
  const review = reviewSchema.parse(raw), changed = parseDiff(diff); const automated: Finding[] = [], human: Finding[] = [];
  for (const finding of review.findings) { if (finding.confidence === 'high' && finding.severity !== 'low' && !finding.question && changed.some(line => line.file === finding.file && line.line === finding.line)) automated.push(finding); else human.push(finding); }
  return { automated, human };
}
export const testGaming = (source: string) => /\b(?:test|it|describe)\s*\.\s*(?:skip|only|todo)\b|\bskip\s*:\s*true|\bonly\s*:\s*true/.test(source);
export async function changedPaths(root: string, base = 'HEAD') { const tracked = (await hostGit(root, 'diff', '--name-only', base, '--')).split('\n').filter(Boolean);
  const untracked = (await hostGit(root, 'ls-files', '--others', '--exclude-standard')).split('\n').filter(Boolean); return [...new Set([...tracked, ...untracked])]; }
export async function fixtureTests(root: string, files: string[], signal?: AbortSignal) { return runProcess(process.execPath, ['--test', ...files], root, 5000, signal); }
const tests = `import {test} from 'node:test'; import assert from 'node:assert/strict'; import {price} from '../src/price.mjs';
test('price retains cents',()=>assert.equal(price(10,0.21),12.1));
test('zero tax preserves amount',()=>assert.equal(price(10.25,0),10.25));\n`;
const good = 'export const price = (amount, tax) => Math.round(amount * (1 + tax) * 100) / 100;\n';
const bug = 'export const price = (amount, tax) => Math.round(amount * (1 + tax));\n';
type Gate = { name: string; pass: boolean; detail: string };
type PrSession = { id: string; owner: string; root: string; scenario: PrScenario; base: string; feature: string; diff: string; state: string; findings: ReturnType<typeof routeFindings> | null; gates: Gate[]; events: unknown[]; commits: string[]; rounds: number; report: string; controller?: AbortController };
export class PrWorkshop {
  private sessions = new Map<string, PrSession>(); private active = 0;
  private own(owner: string, id: string) { const session = this.sessions.get(id); if (!session || session.owner !== owner) throw new Error('PR session not found.'); return session; }
  async create(owner: string, scenario: PrScenario) {
    if (this.sessions.size >= 12) throw new Error('PR capacity reached.'); const id = randomUUID(), root = resolve('prbot-lab/runs', id);
    await mkdir(resolve(root, 'src'), { recursive: true }); await mkdir(resolve(root, 'tests')); await mkdir(resolve(root, '.github/workflows'), { recursive: true });
    await writeFile(resolve(root, 'package.json'), '{"name":"fictional-pr-fixture","type":"module","version":"1.0.0"}\n'); await writeFile(resolve(root, '.github/workflows/ci.yml'), 'name: fixture\non: push\njobs: {}\n');
    await writeFile(resolve(root, 'src/price.mjs'), good); await writeFile(resolve(root, 'tests/price.test.mjs'), tests);
    await hostGit(root, 'init', '-q', '-b', 'main'); await hostGit(root, 'config', 'user.name', 'Lab Host'); await hostGit(root, 'config', 'user.email', 'host@example.invalid');
    await hostGit(root, 'add', '.'); await hostGit(root, 'commit', '-qm', 'Authored fixture'); const base = await hostGit(root, 'rev-parse', 'HEAD');
    await hostGit(root, 'checkout', '-qb', 'feature'); await writeFile(resolve(root, 'src/price.mjs'), bug); await hostGit(root, 'add', 'src/price.mjs'); await hostGit(root, 'commit', '-qm', 'Feature with rounding regression');
    const feature = await hostGit(root, 'rev-parse', 'HEAD'), diff = await hostGit(root, 'diff', '--no-ext-diff', '--unified=0', 'main...feature', '--');
    this.sessions.set(id, { id, owner, root, scenario, base, feature, diff, state: 'created', findings: null, gates: [], events: [], commits: [], rounds: 0, report: '' }); return this.get(owner, id);
  }
  get(owner: string, id: string) { const { root: _root, owner: _owner, controller: _controller, ...session } = this.own(owner, id); return structuredClone({ ...session, numberedDiff: numberedDiff(session.diff), source: 'offline-host-git', providerCalls: 0 }); }
  policy(role: string, tool: string, file: string) { return { allowed: role === 'fixer' && tool === 'write_assigned_file' && file === 'src/price.mjs' || ['reviewer', 'fixer'].includes(role) && tool === 'read_diff', executed: false }; }
  review(owner: string, id: string, raw?: unknown) { const session = this.own(owner, id); const input = raw ?? { findings: [{ file: 'src/price.mjs', line: 1, severity: 'high', confidence: 'high', message: 'Integer rounding discards cents.', question: false },
    { file: 'package.json', line: 1, severity: 'low', confidence: 'low', message: 'Should the release version change?', question: true }] };
    session.findings = routeFindings(input, session.diff); session.state = 'reviewed'; return this.get(owner, id); }
  async tool(owner: string, id: string, raw: unknown, role: 'reviewer' | 'fixer') {
    const session = this.own(owner, id), call = prToolSchema.parse(raw); let output: unknown;
    if (call.name === 'read_diff') output = numberedDiff(session.diff);
    else if (call.name === 'submit_review' && role === 'reviewer') output = this.review(owner, id, call.input);
    else if (call.name === 'write_assigned_file' && role === 'fixer' && session.findings?.automated.some(finding => finding.file === call.input.file)) {
      const path = await checkedPath(session.root, call.input.file, ['src/price.mjs']); await writeFile(path, call.input.text); output = { written: true };
    } else throw new Error('Role tool policy denied.');
    const event = { type: 'user.custom_tool_result', custom_tool_use_id: `sevt_${randomUUID().replaceAll('-', '')}`, name: call.name, output, is_error: false }; session.events.push(event); return event;
  }
  async fix(owner: string, id: string) {
    const session = this.own(owner, id); if (!session.findings?.automated.length || session.rounds >= 2 || session.controller || this.active >= 2) throw new Error('PR fix gate unavailable.');
    session.controller = new AbortController(); this.active++; session.rounds++; session.state = 'fixing'; session.gates = [];
    try {
      await this.tool(owner, id, { name: 'write_assigned_file', input: { file: 'src/price.mjs', text: session.scenario === 'unresolved' ? bug : good } }, 'fixer');
      // Deliberate local adversarial fixture bypasses the tool to test independent post-execution gates.
      if (session.scenario === 'out-of-scope') await writeFile(resolve(session.root, 'package.json'), '{"type":"module","version":"99.0.0"}');
      if (session.scenario === 'skipped-tests') await writeFile(resolve(session.root, 'tests/price.test.mjs'), tests.replaceAll('test(', 'test.skip('));
      const paths = await changedPaths(session.root), scope = paths.length > 0 && paths.every(file => file === 'src/price.mjs');
      session.gates.push({ name: 'scope and protected files', pass: scope, detail: paths.join(', ') || 'No changes' });
      const diff = await hostGit(session.root, 'diff', '--no-ext-diff', 'HEAD', '--'), small = diff.split('\n').filter(line => /^[+-]/.test(line)).length <= 200;
      session.gates.push({ name: 'bounded diff', pass: small, detail: 'At most 200 added/deleted lines.' });
      const gaming = testGaming(await readFile(resolve(session.root, 'tests/price.test.mjs'), 'utf8'));
      session.gates.push({ name: 'no test gaming', pass: !gaming, detail: 'skip, only and todo are rejected.' });
      const result = session.scenario === 'timeout' ? await runProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], session.root, 50, session.controller.signal) : await fixtureTests(session.root, ['tests/price.test.mjs'], session.controller.signal);
      session.gates.push({ name: 'actual behavioral suite', pass: result.code === 0 && !result.timedOut && !gaming, detail: result.timedOut ? 'Process timeout' : result.text.slice(0, 1500) });
      if (session.gates.every(gate => gate.pass)) {
        await hostGit(session.root, 'add', '--', 'src/price.mjs'); await hostGit(session.root, 'commit', '-qm', 'Fix rounding regression'); session.commits.push(await hostGit(session.root, 'rev-parse', 'HEAD'));
        const full = await fixtureTests(session.root, ['tests/price.test.mjs'], session.controller.signal); session.gates.push({ name: 'postcommit full suite', pass: full.code === 0 && !full.timedOut, detail: full.text.slice(0, 1500) });
      }
      session.state = session.commits.length > 0 && session.gates.every(gate => gate.pass) ? 'ready' : 'draft';
    } catch { session.state = 'draft'; session.gates.push({ name: 'host execution', pass: false, detail: 'Cancelled or host operation failed; fixture retained.' }); }
    finally { delete session.controller; this.active--; this.handoff(session); } return this.get(owner, id);
  }
  private handoff(session: PrSession) { session.report = `# Fictional PR review\n\nStatus: ${session.state}\n\n${session.gates.map(gate => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.name}: ${gate.detail}`).join('\n')}\n\nCommits: ${session.commits.join(', ') || 'none'}\nHuman questions: ${session.findings?.human.map(finding => finding.message).join('; ') || 'none'}\n\nReview locally before choosing a remote. Suggested commands only:\n\ngit push --dry-run <reviewed-remote> feature\ngh pr create --draft --base main --head feature --body-file <reviewed-report>\n\nNo remote write was performed.`; }
  async run(owner: string, id: string) { const session = this.own(owner, id); await this.tool(owner, id, { name: 'read_diff', input: {} }, 'reviewer');
    try { await this.tool(owner, id, { name: 'submit_review', input: session.scenario === 'malformed-review' ? { findings: [{ unexpected: true }] } : { findings: [{ file: 'src/price.mjs', line: 1, severity: 'high', confidence: 'high', message: 'Integer rounding discards cents.', question: false }] } }, 'reviewer'); }
    catch { session.state = 'draft'; session.gates.push({ name: 'closed review schema', pass: false, detail: 'Malformed review rejected.' }); this.handoff(session); return this.get(owner, id); }
    return this.fix(owner, id);
  }
  async patch(owner: string, id: string) { const session = this.own(owner, id); return hostGit(session.root, 'diff', '--no-ext-diff', session.feature, '--'); }
  cancel(owner: string, id: string) { const session = this.own(owner, id); session.controller?.abort(); return { localAbortRequested: Boolean(session.controller), remoteSession: false }; }
  close() { for (const session of this.sessions.values()) session.controller?.abort(); this.sessions.clear(); }
}
