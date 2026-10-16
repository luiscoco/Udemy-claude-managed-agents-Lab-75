import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab48SecurityRange } from '../server/lib/lab48-security-range.js';
import { createLab48Router } from '../server/concepts/48-security-hardening.js';

test('layered host policy blocks fake secret and outside write effects', async () => {
  const manager = new Lab48SecurityRange(); after(() => void manager.close());
  const read = await manager.run('layered', 'secret-read'); assert.equal(read.executed, false);
  assert.equal(read.canaryExposed, false); assert.equal(read.collectorHits, 0);
  const write = await manager.run('layered', 'out-of-scope-write'); assert.equal(write.executed, false);
  assert.match(write.outsideFile, /unchanged/); assert.match(write.blockedBy ?? '', /path/);
});
test('loopback witness records naive injected egress but layered blocks it', async () => {
  const manager = new Lab48SecurityRange(); after(() => void manager.close());
  const blocked = await manager.run('layered', 'injected-egress'); assert.equal(blocked.collectorHits, 0);
  assert.equal(blocked.executed, false);
  const naive = await manager.run('naive', 'injected-egress'); assert.equal(naive.collectorHits, 1);
  assert.equal(naive.executed, true); assert.equal(naive.providerCalls, 0);
  const afterProbe = await manager.run('layered', 'injected-egress'); assert.equal(afterProbe.collectorHits, 0);
});
test('naive outside write changes local range evidence but never a host file', async () => {
  const manager = new Lab48SecurityRange(); after(() => void manager.close());
  const write = await manager.run('naive', 'out-of-scope-write'); assert.equal(write.executed, true);
  assert.match(write.outsideFile, /Naive policy wrote/); assert.equal(write.insideFile, 'Original approved report.');
});
test('HTTP routes reject live or open tool inputs and require an owner', async () => {
  const app = express(), instance = createLab48Router(); app.use('/api/c48', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c48`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, addHeaders = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: addHeaders, body: JSON.stringify(body) });
  assert.equal((await post('secrets', { mode: 'live', policy: 'layered', action: 'secret-read' })).status, 400);
  assert.equal((await post('secrets', { mode: 'scripted', policy: 'layered', action: 'secret-read', cache_control: 'any' })).status, 400);
  assert.equal((await post('secrets', { mode: 'scripted', policy: 'layered', action: 'injected-egress' })).status, 400);
  assert.equal((await post('secrets', { mode: 'scripted', policy: 'layered', action: 'secret-read' }, { ...headers, 'X-Lab-Owner': '' })).status, 403);
  const run = await (await post('secrets', { mode: 'scripted', policy: 'layered', action: 'secret-read' })).json() as { executed: boolean };
  assert.equal(run.executed, false); assert.equal((await fetch(`${base}/facts`, { headers })).status, 200);
});
