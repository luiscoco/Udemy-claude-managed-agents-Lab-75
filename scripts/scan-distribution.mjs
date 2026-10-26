import { execFileSync } from 'node:child_process';
import { readFile, readdir, lstat, mkdtemp, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const excluded = new Set(['.git', '.venv', '.build', 'node_modules', 'dist', 'coverage', 'test-results', 'playwright-report']);
export const forbiddenPath = path => /^docs[\\/]prompt-migration[\\/]qa(?:[\\/]|$)/i.test(path) || path.split(/[\\/]/).some(part =>
  /^(?:\.env(?:\..*)?|\.aws|\.claude|\.f\d+-build|\.build|artifacts|sandbox|generated|sessions|workspaces|logs|generated-(?:config|logs|sessions))$/i.test(part) && part !== '.env.example'
  || /-lab$/i.test(part) || /\.(?:jsonl|log)$/i.test(part));
// Match credential forms, never print a matching value or .env contents.
export const secretPatterns = [
  /\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\b(?:ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{20,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][A-Za-z0-9_+\/-]{24,}["']/i,
];
export async function scanFiles(paths, base = root) {
  const failures = [];
  for (const path of paths) {
    if (forbiddenPath(path)) { failures.push(`${path}: private/generated distribution path`); continue; }
    const absolute = resolve(base, path);
    if (relative(base, absolute).startsWith('..')) { failures.push(`${path}: outside distribution root`); continue; }
    if ((await lstat(absolute)).isSymbolicLink()) { failures.push(`${path}: distribution symlink`); continue; }
    const data = await readFile(absolute);
    if (secretPatterns.some(pattern => pattern.test(data.toString('utf8')))) failures.push(`${path}: secret pattern (value withheld)`);
  }
  return failures;
}
async function walk(directory, paths, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && !excluded.has(entry.name) && !forbiddenPath(path)) await walk(join(directory, entry.name), paths, path + '/');
    } else if (!forbiddenPath(path)) paths.add(path);
  }
}
async function main() {
  const paths = new Set();
  // Tracked private artifacts fail even if .gitignore would now hide them.
  try {
    for (const path of execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/').replace(/\/$/, '')}`, 'ls-files', '-z', '--cached'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).split('\0').filter(Boolean)) paths.add(path);
  } catch (error) {
    let exists = true;
    try { await lstat(join(root, '.git')); } catch (statError) { if (statError.code === 'ENOENT') exists = false; else throw statError; }
    if (exists) throw new Error('Cannot inspect Git index; distribution scan fails closed.', { cause: error });
    console.info('No Git repository: checking distributable authored files.');
  }
  await walk(root, paths);
  // Verify actual npm pack contents too; .npmignore must exclude runtime data.
  const npmCli = process.env.npm_execpath ?? join(await realpath(process.execPath), '..', 'node_modules/npm/bin/npm-cli.js');
  const cache = await mkdtemp(join(tmpdir(), 'foundation-pack-cache-'));
  let pack;
  try {
    pack = JSON.parse(execFileSync(process.execPath, [npmCli, 'pack', '--dry-run', '--json', '--ignore-scripts', '--cache', cache], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
  } finally { await rm(cache, { recursive: true, force: true }); }
  for (const file of pack[0].files) paths.add(file.path);
  try { await walk(join(root, 'dist'), paths, 'dist/'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const failures = await scanFiles([...paths]);
  if (failures.length) throw new Error(`Distribution blocked:\n${failures.join('\n')}`);
  console.info(`PASS distribution scan (${paths.size} files; .env contents never read)`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
