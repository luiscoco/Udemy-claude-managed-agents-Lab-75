import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import express from 'express';
import { Lab65ApprovalStore, createLab65Router } from '../server/concepts/65-human-approval.js';

const store = new Lab65ApprovalStore(`artifacts/lab65/test-${randomUUID()}.sqlite`, () => 1000000,
  {}, async () => { throw new Error('External notification must not be called.'); });
after(() => store.close());
test('closed Managed tool event creates only an immutable pending proposal and correlated result', () => {
  assert.throws(() => store.handleTool('owner-a', { type: 'agent.custom_tool_use', id: 'bad',
    name: 'propose_case_archive', input: { caseId: 'CASE-2042', reason: 'Fictional archive' } }));
  assert.throws(() => store.handleTool('owner-a', { type: 'agent.custom_tool_use', id: 'sevt_good',
    name: 'propose_case_archive', input: { caseId: 'CASE-2042', reason: 'Fictional archive', approved: true } }));
  const result = store.handleTool('owner-a', { type: 'agent.custom_tool_use', id: 'sevt_abc123',
    name: 'propose_case_archive', input: { caseId: 'CASE-2042', reason: 'Fictional archive' } });
  assert.equal(result.custom_tool_use_id, 'sevt_abc123'); assert.equal(result.type, 'user.custom_tool_result');
  const snapshot = store.snapshot('owner-a'); assert.equal(snapshot.effects.length, 0);
  assert.equal(snapshot.proposals[0]?.state, 'pending'); assert.equal(snapshot.proposals[0]?.businessKey, 'archive:owner-a:CASE-2042');
});
test('reviewer identity, notification, tamper, expiry and replay gate effect', async () => {
  const owner = 'owner-b'; const other = store.reviewerSession('other-owner'); const reviewer = store.reviewerSession(owner);
  const first = store.propose(owner).toolResult.proposalId;
  assert.throws(() => store.decide(owner, reviewer, first, 'approve'), /Notify/);
  assert.equal(store.tamper(owner, first, 'CASE-9999').blocked, true);
  await assert.rejects(store.notify(owner, first, 'slack'), /disabled/);
  assert.equal(store.snapshot(owner).proposals[0]?.notified, null);
  await store.notify(owner, first, 'local');
  assert.throws(() => store.decide(owner, other, first, 'approve'), /reviewer/);
  assert.equal(store.snapshot(owner).effects.length, 0);
  assert.equal(store.decide(owner, reviewer, first, 'approve').effects.length, 1);
  assert.throws(() => store.decide(owner, reviewer, first, 'approve'), /decided/);
  const second = store.propose(owner).toolResult.proposalId; await store.notify(owner, second, 'local');
  assert.equal(store.decide(owner, reviewer, second, 'approve').effects.length, 1, 'stable business key executes once');
  const third = store.propose(owner).toolResult.proposalId; await store.notify(owner, third, 'local');
  store.expire(owner, third); assert.throws(() => store.decide(owner, reviewer, third, 'approve'), /expired/);
  const fourth = store.propose(owner).toolResult.proposalId; await store.notify(owner, fourth, 'local');
  store.decide(owner, reviewer, fourth, 'reject'); assert.equal(store.snapshot(owner).effects.length, 1);
});

test('same-origin routes reject forged schema and keep reviewer cookie local', async () => {
  const app = express(); const instance = createLab65Router(new Lab65ApprovalStore(`artifacts/lab65/http-${randomUUID()}.sqlite`));
  app.use('/api/c65', instance.router); const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try { const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
    const base = `http://127.0.0.1:${address.port}/api/c65`; const headers = { 'X-Lab-Owner': 'route-owner' };
    const review = await fetch(`${base}/review`, { headers });
    assert.equal(review.status, 200); const cookie = review.headers.get('set-cookie') ?? '';
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
    const bad = await fetch(`${base}/run`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'propose', approved: true }) }); assert.equal(bad.status, 400);
    const created = await fetch(`${base}/run`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'propose' }) });
    const data = await created.json(); const id = data.toolResult.proposalId as string;
    const rejected = await fetch(`${base}/run`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decide', proposalId: id, decision: 'approve' }) });
    assert.equal(rejected.status, 409);
    const notify = await fetch(`${base}/run`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notify', proposalId: id, channel: 'local' }) }); assert.equal(notify.status, 200);
    const approved = await fetch(`${base}/run`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json',
      Cookie: cookie.split(';')[0]! }, body: JSON.stringify({ action: 'decide', proposalId: id, decision: 'approve' }) });
    assert.equal(approved.status, 200); assert.equal((await approved.json()).effects.length, 1);
  } finally { await instance.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('optional notification adapters use fixed destinations with stubbed transport only', async () => {
  const sent: { url: string; options: RequestInit }[] = [];
  const transport = (async (url: string | URL | Request, options?: RequestInit) => {
    sent.push({ url: String(url), options: options ?? {} }); return new Response(null, { status: 202 });
  }) as typeof fetch;
  const env = { LAB65_EXTERNAL_NOTIFICATIONS: '1', LAB65_PUBLIC_HTTPS_ORIGIN: 'https://review.example.org',
    LAB65_SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T/B/key',
    LAB65_TEAMS_WORKFLOW_URL: 'https://flow.logic.azure.com/workflows/demo',
    LAB65_GRAPH_SENDER: 'sender@example.org', LAB65_GRAPH_RECIPIENT: 'reviewer@example.org', LAB65_GRAPH_TOKEN: 'stub-token' };
  const adapterStore = new Lab65ApprovalStore(`artifacts/lab65/adapters-${randomUUID()}.sqlite`, () => 1000000, env, transport);
  try { for (const channel of ['slack', 'teams', 'email'] as const) {
      const id = adapterStore.propose('adapter-owner').toolResult.proposalId;
      await adapterStore.notify('adapter-owner', id, channel);
    }
    assert.equal(sent.length, 3); assert.match(sent[0]!.url, /^https:\/\/hooks\.slack\.com/);
    assert.match(sent[1]!.url, /^https:\/\/flow\.logic\.azure\.com/);
    assert.match(sent[2]!.url, /^https:\/\/graph\.microsoft\.com\/v1\.0\/users\//);
    assert.equal(adapterStore.snapshot('adapter-owner').effects.length, 0, 'delivery is never approval');
    assert.equal(JSON.stringify(adapterStore.snapshot('adapter-owner')).includes('stub-token'), false);
  } finally { adapterStore.close(); }
});
