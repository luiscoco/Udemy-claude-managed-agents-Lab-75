import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab46CacheObservations } from '../server/lib/lab46-cache-observations.js';
import { createLab46Router } from '../server/concepts/46-prompt-caching.js';

test('reused content shows equal-scope authored counters with one retained session', () => {
  const manager = new Lab46CacheObservations(), run = manager.run('reused-content');
  assert.equal(run.readings[0].sessionId, run.readings[1].sessionId);
  assert.equal(run.readings[0].contentHash, run.readings[1].contentHash);
  assert.equal(run.comparable, true); assert.equal(run.delta?.cacheReadTokens, 270);
  assert.equal(run.savingsClaim, false); assert.equal(run.providerCalls, 0);
  assert.equal(run.readings[0].via, 'span.model_request_end');
});

test('changed prefix, fresh model/tools and short input retain uncertainty', () => {
  const manager = new Lab46CacheObservations();
  const prefix = manager.run('changed-prefix'); assert.notEqual(prefix.readings[0].contentHash, prefix.readings[1].contentHash);
  assert.equal(prefix.readings[1].counters.cacheReadTokens, 0);
  for (const scenario of ['changed-model', 'changed-tools'] as const) {
    const run = manager.run(scenario); assert.notEqual(run.readings[0].sessionId, run.readings[1].sessionId);
    assert.equal(run.comparable, false); assert.equal(run.delta, null);
  }
  const short = manager.run('short-input'); assert.equal(short.readings[1].counters.cacheReadTokens, 0);
  assert.match(short.uncertainty, /No hit/);
});

test('missing usage is unknown, not zero or an invented savings measurement', () => {
  const manager = new Lab46CacheObservations(), run = manager.run('missing-usage');
  assert.equal(run.comparable, false); assert.equal(run.delta, null);
  assert.equal(run.readings[0].counters.cacheReadTokens, null);
  assert.equal(run.readings[1].counters.cacheCreationTokens, null);
  assert.equal(run.savingsClaim, false);
  assert.deepEqual(manager.facts().unsupportedSessionControls, ['cache_control', 'SYSTEM_PROMPT_DYNAMIC_BOUNDARY', 'cache TTL switches', 'PreModelSwitch veto']);
});

test('HTTP closed contracts reject Messages-only cache controls and live fixtures', async () => {
  const app = express(), instance = createLab46Router(); app.use('/api/c46', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c46`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object) => fetch(`${base}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await post('switches', { mode: 'live', scenario: 'reused-content' })).status, 422);
  assert.equal((await post('switches', { mode: 'scripted', scenario: 'reused-content', cache_control: 'ephemeral' })).status, 400);
  assert.equal((await post('model-switch', { mode: 'scripted', scenario: 'reused-content' })).status, 400);
  const run = await (await post('switches', { mode: 'scripted', scenario: 'reused-content' })).json() as { comparable: boolean };
  assert.equal(run.comparable, true);
  assert.equal((await fetch(`${base}/facts`, { headers })).status, 200);
});
