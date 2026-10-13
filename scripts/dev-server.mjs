import { createHash } from 'node:crypto';
import { readdir, readFile, realpath } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { extname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json']);
const ignored = new Set(['node_modules', 'dist', 'sandbox', 'generated', 'logs', 'sessions', 'workspaces', '.git', '.claude']);

// Content + relative names detect edits, additions and deletions, never access times.
// Ignore symlinks and generated trees; do not traverse private configuration.
export async function sourceFingerprint(root) {
  const hash = createHash('sha256');
  async function visit(directory) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name.startsWith('.') || ignored.has(entry.name) || entry.name.endsWith('-lab') || entry.isSymbolicLink()) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && sourceExtensions.has(extname(entry.name))) {
        hash.update(relative(root, path)).update('\0').update(await readFile(path)).update('\0');
      }
    }
  }
  for (const name of ['server', 'mcp-servers']) {
    // A source root itself must not be a symlink out of the workspace.
    const path = join(root, name);
    try { if (await realpath(path) !== path) continue; }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    await visit(path);
  }
  return hash.digest('hex');
}

export function childEnvironment(environment) {
  const result = { ...environment };
  for (const key of Object.keys(result)) {
    if (key.toUpperCase() === 'WATCH_REPORT_DEPENDENCIES') delete result[key];
  }
  return result;
}

export async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  const timer = setTimeout(() => child.kill('SIGKILL'), 40_000);
  try { child.kill('SIGTERM'); await exited; }
  finally { clearTimeout(timer); }
}

export async function supervise({ root, pollMs = 1_000, startChild, log = console.info }) {
  let child;
  let closing = false;
  let timer;
  let active = Promise.resolve();
  let shutdown;
  let fingerprint = await sourceFingerprint(root);
  const launch = () => {
    child = startChild();
    child.on('error', (error) => console.error(`[dev-server] ${error.message}`));
    log(`[dev-server] started child ${child.pid}`);
  };
  launch();
  async function tick() {
    if (closing) return;
    try {
      const next = await sourceFingerprint(root);
      if (!closing && next !== fingerprint) {
        log('[dev-server] source content changed; restarting');
        await stopChild(child);
        fingerprint = next;
        if (!closing) launch();
      }
    } catch (error) { console.error(`[dev-server] fingerprint failed: ${error.message}`); }
    finally { if (!closing) timer = setTimeout(schedule, pollMs); }
  }
  function schedule() { active = tick(); }
  timer = setTimeout(schedule, pollMs);
  return {
    close() {
      if (shutdown) return shutdown;
      closing = true;
      clearTimeout(timer);
      shutdown = (async () => { await active; await stopChild(child); })();
      return shutdown;
    },
  };
}

async function main() {
  const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
  const supervisor = await supervise({
    root,
    startChild: () => spawn(process.execPath, [
      '--env-file-if-exists=.env', '--import', 'tsx', 'server/index.ts',
    ], { cwd: root, stdio: 'inherit', env: childEnvironment(process.env) }),
  });
  const close = () => { void supervisor.close().catch((error) => { console.error(error.message); process.exitCode = 1; }); };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
