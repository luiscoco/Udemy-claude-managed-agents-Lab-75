import { spawn } from 'node:child_process';
import { once } from 'node:events';

const mode = process.argv[2] ?? 'scripted', scenario = process.argv[3] ?? 'pass';
const allowed = new Set(['pass', 'validation', 'limit', 'execution-error', 'sigterm', 'concurrency', 'unconfirmed-stop']);
if (!['scripted', 'live'].includes(mode) || !allowed.has(scenario)) {
  process.stderr.write('Usage: node ci-kit/runner.mjs scripted|live pass|validation|limit|execution-error|sigterm|concurrency|unconfirmed-stop\n');
  process.exitCode = 2;
} else {
  const child = spawn(process.execPath, ['--import', 'tsx', 'ci-kit/worker.mjs', mode, scenario],
    { stdio: ['ignore', 'pipe', 'pipe', 'ipc'], env: process.env, windowsHide: true });
  let stdout = '', stderr = ''; let stopping = false;
  child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => { stdout = (stdout + chunk).slice(0, 16000); });
  child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(0, 1000); });
  const stop = () => { if (stopping) return; stopping = true;
    if (process.platform === 'win32' && child.connected) child.send({ type: 'stop' });
    else child.kill('SIGTERM'); };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
  const deadline = setTimeout(stop, Math.min(Number(process.env.CI_HOST_DEADLINE_MS ?? 10000), 120000));
  const force = setTimeout(() => { if (stopping) child.kill('SIGKILL'); }, 15000);
  const [code] = await once(child, 'exit'); clearTimeout(deadline); clearTimeout(force);
  process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop);
  let verdict;
  try { verdict = JSON.parse(stdout.trim().split(/\r?\n/).at(-1)); }
  catch { verdict = { source: 'host-runner', outcome: stopping ? 'remote-stop-unconfirmed' : 'worker-output-invalid',
    exitCode: 2, sessionId: null, report: null, interruption: stopping ? 'unconfirmed' : 'not-needed',
    cleanup: stopping ? 'pending' : 'not-needed', evidence: ['Worker did not return a complete JSON verdict.', `stderr-bytes:${stderr.length}`] }; }
  process.stdout.write(`${JSON.stringify(verdict)}\n`);
  process.exitCode = Number.isInteger(verdict.exitCode) ? verdict.exitCode : (code ?? 2);
}
