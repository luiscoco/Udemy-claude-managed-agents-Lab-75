import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab37GateOutputSchema } from '../shared/lab37-permission-prompt-tool.js';
import { Lab37Error, Lab37PolicyGate } from '../server/lib/lab37-policy-gate.js';
import { createLab37Router } from '../server/concepts/37-permission-prompt-tool.js';

test('valid worker allow sends one exact confirmation and applies one checked file effect', async () => {
  const gate = new Lab37PolicyGate(); try {
    const opened = gate.run('alice', { mode: 'scripted', scenario: 'allow', gate: 'worker' });
    const done = await gate.decide('alice', { runId: opened.runId, eventId: opened.eventId! });
    assert.equal(done.status, 'allowed'); assert.equal(done.confirmation?.tool_use_id, opened.eventId);
    assert.equal(done.confirmation?.type, 'user.tool_confirmation'); assert.equal(done.confirmationCount, 1);
    assert.equal(done.fileEffects, 1); assert.match(done.fixtureText, /Approved checked write/);
    await assert.rejects(gate.decide('alice', { runId: opened.runId, eventId: opened.eventId! }), Lab37Error);
  } finally { gate.close(); }
});
test('denial, malformed gate, timeout and stricter host path check prevent effects', async () => {
  const gate = new Lab37PolicyGate(); try {
    for (const scenario of ['deny', 'malformed', 'timeout', 'host-refusal'] as const) {
      const opened = gate.run('alice', { mode: 'scripted', scenario, gate: 'worker' });
      const done = await gate.decide('alice', { runId: opened.runId, eventId: opened.eventId! });
      assert.equal(done.fileEffects, 0); assert.equal(done.fixtureText, 'Fictional notes.\n');
      assert.equal(done.confirmationCount, scenario === 'deny' || scenario === 'host-refusal' ? 1 : 0);
      if (scenario === 'host-refusal') { assert.equal(done.gateDecision, 'allow'); assert.equal(done.hostDecision, 'deny'); }
    }
  } finally { gate.close(); }
});
test('preallowed observation bypasses gate; local reviewer, ownership and schema remain independent', async () => {
  const gate = new Lab37PolicyGate(); try {
    const pre = gate.run('alice', { mode: 'scripted', scenario: 'preallowed', gate: 'worker' });
    assert.equal(pre.status, 'preallowed'); assert.equal(pre.eventId, null); assert.equal(pre.confirmationCount, 0);
    const opened = gate.run('alice', { mode: 'scripted', scenario: 'allow', gate: 'local-reviewer' });
    await assert.rejects(gate.decide('bob', { runId: opened.runId, eventId: opened.eventId! }), Lab37Error);
    await assert.rejects(gate.decide('alice', { runId: opened.runId, eventId: 'sevt_wrong', reviewerDecision: 'allow' }), Lab37Error);
    const done = await gate.decide('alice', { runId: opened.runId, eventId: opened.eventId!, reviewerDecision: 'deny' });
    assert.equal(done.status, 'denied'); assert.equal(done.fileEffects, 0);
    assert.equal(lab37GateOutputSchema.safeParse({ decision: 'allow', reason: 'X', rewritePath: '/outside' }).success, false);
  } finally { gate.close(); }
});
test('HTTP routes reject live, Agent SDK permission fields, foreign decisions and repeats', async () => {
  const app = express(), instance = createLab37Router(); app.use('/api/c37', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c37`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, custom: Record<string, string> = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: custom, body: JSON.stringify(body) });
  assert.equal((await post('run', { mode: 'live', scenario: 'allow', gate: 'worker' })).status, 422);
  assert.equal((await post('run', { mode: 'scripted', scenario: 'allow', gate: 'worker', canUseTool: true })).status, 400);
  const opened = await (await post('run', { mode: 'scripted', scenario: 'deny', gate: 'worker' })).json() as { runId: string; eventId: string };
  const body = { runId: opened.runId, eventId: opened.eventId };
  assert.equal((await post('decide', body, { ...headers, 'X-Lab-Owner': 'bob' })).status, 404);
  assert.equal((await post('decide', body)).status, 200); assert.equal((await post('decide', body)).status, 409);
});
