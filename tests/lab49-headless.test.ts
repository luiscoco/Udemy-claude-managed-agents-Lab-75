import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { after, test } from 'node:test';
import express from 'express';
import { Lab49Headless } from '../server/lib/lab49-headless.js';
import { createLab49Router } from '../server/concepts/49-deploy-ci-headless.js';

test('closed report and terminal state determine offline CI exit code', async () => {
  const manager = new Lab49Headless();
  const pass = await manager.run('pass'); assert.equal(pass.exitCode, 0); assert.equal(pass.report?.verdict, 'pass');
  for (const scenario of ['validation', 'limit', 'execution-error', 'unconfirmed-stop'] as const) {
    const run = await manager.run(scenario); assert.equal(run.exitCode, 2); assert.equal(run.report, null);
  }
  const uncertain = await manager.run('unconfirmed-stop'); assert.equal(uncertain.cleanup, 'pending');
  assert.equal(uncertain.interruption, 'unconfirmed'); assert.equal(uncertain.providerCalls, 0);
});
test('reservations reject excess concurrent work before creating a session', async () => {
  const manager = new Lab49Headless(); const one = manager.run('concurrency'), two = manager.run('concurrency');
  await assert.rejects(manager.run('pass'), /capacity/);
  const settled = await Promise.all([one, two]); assert.ok(settled.every(run => run.sessionId === null));
});
test('headless runner emits one JSON verdict without TTY or API key', () => {
  const env = { ...process.env }; delete env.ANTHROPIC_API_KEY; delete env.CLAUDE_MANAGED_AGENT_ID;
  delete env.CLAUDE_MANAGED_ENVIRONMENT_ID; delete env.MANAGED_LIVE_ENABLED;
  const run = (scenario: string, extras: Record<string, string> = {}) => spawnSync(process.execPath,
    ['ci-kit/runner.mjs', 'scripted', scenario], { cwd: process.cwd(), env: { ...env, ...extras }, encoding: 'utf8', timeout: 15000 });
  const pass = run('pass'); assert.equal(pass.status, 0); assert.equal(JSON.parse(pass.stdout).outcome, 'pass');
  const validation = run('validation'); assert.equal(validation.status, 2); assert.equal(JSON.parse(validation.stdout).report, null);
  const stopped = run('sigterm', { CI_HOST_DEADLINE_MS: '3000' }); assert.equal(stopped.status, 3);
  assert.equal(JSON.parse(stopped.stdout).outcome, 'cancelled');
  const liveDenied = spawnSync(process.execPath, ['ci-kit/runner.mjs', 'live', 'pass'],
    { cwd: process.cwd(), env, encoding: 'utf8', timeout: 15000 });
  assert.equal(liveDenied.status, 2); assert.equal(JSON.parse(liveDenied.stdout).outcome, 'execution-error');
});
test('sample artifacts cannot silently deploy or bake credentials', () => {
  const workflow = readFileSync('ci-kit/sample-workflow.yml', 'utf8');
  const docker = readFileSync('ci-kit/Dockerfile', 'utf8');
  const ignored = readFileSync('.dockerignore', 'utf8');
  assert.match(workflow, /workflow_dispatch/); assert.match(workflow, /inputs\.live == true/);
  assert.doesNotMatch(workflow, /push:|schedule:/); assert.match(ignored, /\.env/);
  assert.doesNotMatch(docker, /ANTHROPIC_API_KEY|dontAsk|--dangerously/);
});
test('HTTP routes are owner-scoped and reject live or extra fields', async () => {
  const app = express(), instance = createLab49Router(); app.use('/api/c49', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c49`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (body: object, addHeaders = headers) => fetch(`${base}/ci`, { method: 'POST', headers: addHeaders, body: JSON.stringify(body) });
  assert.equal((await post({ mode: 'live', scenario: 'pass' })).status, 400);
  assert.equal((await post({ mode: 'scripted', scenario: 'pass', budget: 9999 })).status, 400);
  assert.equal((await post({ mode: 'scripted', scenario: 'pass' }, { ...headers, 'X-Lab-Owner': '' })).status, 403);
  assert.equal((await fetch(`${base}/files`, { headers })).status, 200);
  const run = await (await post({ mode: 'scripted', scenario: 'pass' })).json() as { outcome: string };
  assert.equal(run.outcome, 'pass');
});
