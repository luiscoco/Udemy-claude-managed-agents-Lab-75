import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab45Providers } from '../server/lib/lab45-providers.js';
import { createLab45Router } from '../server/concepts/45-cloud-providers.js';

test('catalog separates documented Managed availability from installed client and Messages support', () => {
  const manager = new Lab45Providers(); const rows = manager.catalog().targets;
  const first = rows.find(item => item.id === 'claude-api')!, aws = rows.find(item => item.id === 'claude-platform-aws')!;
  assert.equal(first.managedRouteEnabled, true); assert.equal(first.installedManagedClientVerified, true);
  assert.equal(aws.managedDocumented, true); assert.equal(aws.installedManagedClientVerified, false);
  assert.equal(aws.managedRouteEnabled, false); assert.match(aws.authShape, /SigV4/);
  for (const id of ['bedrock', 'vertex', 'foundry']) {
    const item = rows.find(row => row.id === id)!; assert.equal(item.messagesApi, true);
    assert.equal(item.managedRouteEnabled, false); assert.equal(item.managedDocumented, false);
  }
  assert.match(manager.same('bedrock').distinction, /Messages support/);
  assert.equal(manager.facts().providerCalls, 0);
});

test('loopback emulator redacts synthetic credential and never creates a session', async () => {
  const manager = new Lab45Providers();
  const ready = await manager.emulate('claude-api', 'ready');
  assert.equal(ready.status, 'ready'); assert.equal(ready.httpStatus, 200);
  assert.equal(ready.syntheticCredential, 'redacted'); assert.equal(ready.sessionCreated, false); assert.equal(ready.providerCalls, 0);
  const aws = await manager.emulate('claude-platform-aws', 'ready');
  assert.equal(aws.httpStatus, 200); assert.equal(aws.status, 'refused'); assert.equal(aws.managedRouteEnabled, false);
  const bedrock = await manager.emulate('bedrock', 'ready'); assert.equal(bedrock.status, 'refused');
  manager.close();
});

test('synthetic auth, model, config and feature mismatches are distinct', async () => {
  const manager = new Lab45Providers(); try {
    const auth = await manager.emulate('claude-api', 'bad-auth'); assert.equal(auth.httpStatus, 401);
    const model = await manager.emulate('claude-api', 'model-mismatch'); assert.equal(model.httpStatus, 400);
    const config = await manager.emulate('claude-api', 'missing-config'); assert.equal(config.httpStatus, 422);
    const feature = await manager.emulate('claude-api', 'missing-feature'); assert.equal(feature.status, 'refused');
    assert.equal(feature.httpStatus, 200); assert.match(feature.reason, /feature missing/);
  } finally { manager.close(); }
});

test('closed HTTP routes reject live and unsupported fields without forwarding credentials', async () => {
  const app = express(), instance = createLab45Router(); app.use('/api/c45', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c45`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object) => fetch(`${base}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await post('failures', { mode: 'live', target: 'claude-api', scenario: 'ready' })).status, 422);
  assert.equal((await post('failures', { mode: 'scripted', target: 'claude-api', scenario: 'ready', apiKey: 'synthetic' })).status, 400);
  assert.equal((await post('same', { target: 'unknown' })).status, 400);
  const run = await (await post('auth', { mode: 'scripted', target: 'claude-api', scenario: 'bad-auth' })).json() as { httpStatus: number };
  assert.equal(run.httpStatus, 401);
  const facts = await (await fetch(`${base}/facts`, { headers })).json() as Record<string, unknown>;
  assert.equal(JSON.stringify(facts).includes('synthetic-local-token'), false);
});
