import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const command = process.argv[2];
if (!['install', 'check', 'build'].includes(command)) throw Error('Choose install, check, or build.');
const npm = process.env.npm_execpath;
if (!npm) throw Error('Run this helper through npm run projects:install, projects:check, or projects:build.');
const env = { ...process.env, ANTHROPIC_API_KEY: '', ANTHROPIC_AUTH_TOKEN: '', CLAUDE_CODE_OAUTH_TOKEN: '' };
const python = fileURLToPath(new URL(process.platform === 'win32' ? '../.venv/Scripts/python.exe' : '../.venv/bin/python', import.meta.url));
if (!env.PYTHON && existsSync(python)) env.PYTHON = python;
for (const id of ['study-coach', 'agent-evaluation-studio', 'agent-publishing-studio']) {
  console.log(`\n${id}: ${command}`);
  const args = command === 'install' ? ['ci', '--no-audit', '--no-fund'] : command === 'check' ? ['test'] : ['run', 'build'];
  const child = spawn(process.execPath, [npm, ...args], { cwd: fileURLToPath(new URL(`../mini-projects/${id}/`, import.meta.url)),
    env, stdio: 'inherit', windowsHide: true });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  if (code !== 0) { process.exitCode = 1; break; }
}
