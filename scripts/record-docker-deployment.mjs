/** Real local Docker build/run evidence; no provider requests or registry pushes. */
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

if (!process.argv.includes('--execute-local-deployment')) throw Error('Pass --execute-local-deployment for the requested local build/run.');
const out = path.resolve('presentations/docker-desktop-deployment/evidence');
await mkdir(out, { recursive: true });
try { await access('docker/offline.env'); } catch { await writeFile('docker/offline.env', await readFile('docker/offline.env.example')); }
const env = { ...process.env };
for (const key of Object.keys(env)) if (/ANTHROPIC|INWORLD|^CLAUDE_|^MANAGED_|^MILESTONE_|^AI_TUTOR_/.test(key)) delete env[key];
const compose = ['compose', '--env-file', 'docker/offline.env'];
const verifyOnly = process.argv.includes('--verify-only');
const evidence = verifyOnly ? JSON.parse(await readFile(path.join(out, 'deployment-evidence.json'), 'utf8'))
  : { capturedAt: new Date().toISOString(), project: 'claude-learning-platform', origin: 'http://127.0.0.1:8080', commands: [], providerCalls: 0, complete: false };
if (verifyOnly) {
  evidence.auditReviews = [...(evidence.auditReviews ?? []), ...evidence.commands.filter(row => row.status === 'failed')];
  evidence.commands = evidence.commands.filter(row => row.status === 'passed');
  evidence.complete = false;
}
const save = () => writeFile(path.join(out, 'deployment-evidence.json'), JSON.stringify(evidence, null, 2));
async function command(id, args) {
  const row = { id, command: 'docker ' + args.join(' '), startedAt: new Date().toISOString(), status: 'running', output: '' };
  evidence.commands.push(row); await save(); console.log(`Running ${id}`);
  const liveLog = createWriteStream(path.join(out, id + '.progress.txt'));
  const child = spawn('docker', args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { output += bytes.toString(); liveLog.write(bytes); });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  await new Promise(resolve => liveLog.end(resolve));
  Object.assign(row, { status: code === 0 ? 'passed' : 'failed', exitCode: code, output: output.replace(/\x1b\[[0-9;]*m/g, ''), finishedAt: new Date().toISOString() });
  await writeFile(path.join(out, id + '.txt'), `$ ${row.command}\n\n${row.output}\n[exit ${code}]\n`); await save();
  console.log(`${id}: exit ${code}\n${row.output.split(/\r?\n/).slice(-6).join('\n')}`);
  if (code !== 0) throw Error(`${id} failed; inspect the recorded output.`);
  return row;
}
if (!verifyOnly) {
await command('01-engine', ['version', '--format', 'Client: {{.Client.Version}} | Engine: {{.Server.Version}} | Context: {{.Client.Context}}']);
await command('02-compose-version', ['compose', 'version']);
await command('03-validate', [...compose, 'config', '--quiet']);
await command('04-build', process.argv.includes('--native-builder')
  ? ['build', '--builder', 'desktop-linux', '--progress=plain', '-t', 'claude-learning-platform:local', '.']
  : [...compose, '--progress', 'plain', 'build']);
await command('05-start', [...compose, 'up', '-d', '--wait', '--wait-timeout', '180']);
await command('06-containers', [...compose, 'ps']);
await command('07-logs', [...compose, 'logs', '--no-color', '--tail', '20', 'platform']);
await command('08-image', ['image', 'ls', 'claude-learning-platform:local']);
}
const audit = "const fs=require('node:fs');const assert=require('node:assert/strict');for(const p of ['/app/.env','/app/.git','/app/videos','/app/presentations'])assert.equal(fs.existsSync(p),false,p);assert.equal(!!process.env.ANTHROPIC_API_KEY?.trim(),false);assert.equal(process.env.MANAGED_LIVE_ENABLED,'false');console.log(JSON.stringify({uid:process.getuid(),privateFilesAbsent:true,generatedMediaAbsent:true,modelKeyConfigured:false,paidExecutionEnabled:false,artifactsWritable:fs.accessSync('/app/artifacts',fs.constants.W_OK)===undefined}));";
await command('09-runtime-audit', [...compose, 'exec', '-T', 'platform', 'node', '-e', audit]);
const health = await fetch(evidence.origin + '/api/health');
if (!health.ok) throw Error('Published health endpoint failed.');
evidence.health = await health.json();
evidence.tutor = await (await fetch(evidence.origin + '/api/ai-tutor/status')).json();
if (evidence.tutor.liveAvailable) throw Error('Recording must remain offline.');
evidence.starterDownloads = [];
for (const id of ['study-coach', 'agent-evaluation-studio', 'agent-publishing-studio']) {
  const response = await fetch(evidence.origin + '/api/projects/' + id + '/starter.zip');
  if (!response.ok || !response.headers.get('content-type')?.includes('application/zip')) throw Error('Starter download failed: ' + id);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw Error('Invalid ZIP response.');
  evidence.starterDownloads.push({ id, status: response.status, bytes: bytes.length });
}
evidence.complete = true; await save(); console.log('Real Docker deployment healthy; no model key or paid execution enabled.');
