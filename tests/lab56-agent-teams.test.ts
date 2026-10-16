import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { initialTeamState, reduceTeam, replayTeam } from '../server/teams/lab56.js';
import { createLab56Router } from '../server/concepts/56-agent-teams.js';

test('dependency, identity, checked arithmetic and shutdown are host gates', () => {
  const initial = initialTeamState();
  assert.equal(reduceTeam(initial, { type: 'claim', actor: 'reviewer', task: 'review' }).accepted, false);
  assert.equal(reduceTeam(initial, { type: 'claim', actor: 'reviewer', task: 'research' }).accepted, false);
  const claimed = reduceTeam(initial, { type: 'claim', actor: 'researcher', task: 'research' });
  assert.equal(claimed.accepted, true);
  assert.equal(reduceTeam(claimed.state, { type: 'complete', actor: 'researcher', task: 'research', answer: 30 }).accepted, false);
  assert.equal(reduceTeam(claimed.state, { type: 'shutdown' }).accepted, false);
  assert.deepEqual(initial, initialTeamState());
});

test('delivery, acknowledgment and completion remain separate; envelope replay is idempotent', () => {
  const sent = replayTeam('duplicate-envelope');
  assert.equal(sent.messages.length, 1); assert.equal(sent.messages[0]?.status, 'queued');
  assert.equal(sent.timeline.at(-1)?.accepted, true);
  assert.match(sent.timeline.at(-1)?.reason ?? '', /replay ignored/);
  const early = replayTeam('ack-before-delivery');
  assert.equal(early.timeline.at(-1)?.accepted, false);
  assert.equal(early.tasks[1]?.state, 'blocked');
  const verified = replayTeam('verified-37');
  assert.equal(verified.verifiedAnswer, 37); assert.equal(verified.shutdown, false);
  assert.equal(verified.messages[0]?.status, 'acknowledged');
  const closed = replayTeam('clean-shutdown');
  assert.equal(closed.shutdown, true); assert.equal(closed.providerCalls, 0);
});

test('closed HTTP surface rejects invented actions and unsupported live mode', async () => {
  const app = express(), instance = createLab56Router(); app.use('/api/c56', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c56`;
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  assert.equal((await fetch(`${root}/facts`)).status, 403);
  const post = (path: string, body: unknown) => fetch(`${root}/${path}`, {
    method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await post('replay', { scenario: 'clean-shutdown', action: 'force' })).status, 400);
  const result = await (await post('replay', { scenario: 'clean-shutdown' })).json() as { shutdown: boolean; verifiedAnswer: number };
  assert.equal(result.shutdown, true); assert.equal(result.verifiedAnswer, 37);
  assert.equal((await post('live', { mode: 'live', confirmed: true })).status, 422);
});
