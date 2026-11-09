/** Verify retained data across a real recreation of this dedicated Compose app. */
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
if (!process.argv.includes('--execute-local-lifecycle')) throw Error('Explicit local lifecycle flag required.');
const dir = path.resolve('presentations/docker-desktop-deployment/evidence');
const deployment = JSON.parse(await readFile(path.join(dir, 'deployment-evidence.json'), 'utf8'));
if (!deployment.complete) throw Error('Deployment must pass first.');
const evidence = { commands: [], complete: false, paidCalls: 0 };
const args = ['compose', '--env-file', 'docker/offline.env'];
const env = { ...process.env };
for (const key of Object.keys(env)) if (/ANTHROPIC|INWORLD|^CLAUDE_|^MANAGED_|^MILESTONE_|^AI_TUTOR_/.test(key)) delete env[key];
async function command(id, extra) {
  const row = { id, command: 'docker ' + [...args, ...extra].join(' '), status: 'running' };
  evidence.commands.push(row);
  const child = spawn('docker', [...args, ...extra], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => output += bytes.toString());
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  Object.assign(row, { status: code === 0 ? 'passed' : 'failed', exitCode: code, output, finishedAt: new Date().toISOString() });
  await writeFile(path.join(dir, id + '.txt'), `$ ${row.command}\n\n${output}\n[exit ${code}]\n`);
  await writeFile(path.join(dir, 'lifecycle-evidence.json'), JSON.stringify(evidence, null, 2));
  console.log(`${id}: exit ${code}\n${output}`);
  if (code !== 0) throw Error('Lifecycle command failed: ' + id);
}
const token = 'docker-volume-proof-' + Date.now();
await command('10-volume-write', ['exec', '-T', 'platform', 'node', '-e', `require('node:fs').writeFileSync('/app/artifacts/docker-deployment-proof.json',JSON.stringify({proof:'${token}'}));console.log('Wrote a teaching proof file to the mounted artifacts volume.');`]);
await command('11-stop', ['stop', 'platform']);
await command('12-recreate', ['up', '-d', '--force-recreate', '--wait', '--wait-timeout', '180']);
await command('13-volume-read', ['exec', '-T', 'platform', 'node', '-e', `const data=JSON.parse(require('node:fs').readFileSync('/app/artifacts/docker-deployment-proof.json','utf8'));require('node:assert/strict').equal(data.proof,'${token}');console.log('PASS: the original proof file survived container recreation in the named artifacts volume.');`]);
await command('14-recreated-health', ['ps']);
const health = await fetch(deployment.origin + '/api/health'); if (!health.ok) throw Error('Recreated app unhealthy.');
evidence.health = await health.json(); evidence.complete = true;
await writeFile(path.join(dir, 'lifecycle-evidence.json'), JSON.stringify(evidence, null, 2));
console.log('Real stop/recreate, named-volume persistence and published health checks passed.');
