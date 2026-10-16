import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { CapstoneDesk } from '../server/capstone/desk.js';
import { ScriptedCapstonePort, capstoneToolMismatch, createLiveCapstonePort } from '../server/capstone/agent.js';
import { ScriptedPolicyExpert } from '../server/capstone/policy-expert.js';
import { runCapstoneEvals } from '../server/capstone/evals.js';
import { CapstoneStore } from '../server/capstone/store.js';
import { capstoneToolDefinitions } from '../server/capstone/tools.js';
import { createLab50Router } from '../server/concepts/50-capstone.js';

const signal = () => new AbortController().signal;
test('retained fixture session pauses on sevt tool review, denial leaves no refund, and resume deduplicates history', async () => {
  const desk = new CapstoneDesk(); after(() => void desk.close());
  const first = await desk.chat('owner-a', 'C-1', 'scripted', null, 'Refund 25 for O-1001', signal());
  assert.equal(first.status, 'waiting-approval'); assert.equal(first.pendingApproval?.amountCents, 2500);
  assert.match(first.rawEvents[0]?.id ?? '', /^sevt_/); assert.equal(desk.state('owner-a', 'C-1').refunds.length, 0);
  const denied = await desk.decide('owner-a', 'C-1', first.conversationId, first.pendingApproval!.id, 'deny', signal());
  assert.equal(denied.status, 'idle'); assert.equal(denied.summary?.caseStatus, 'rejected');
  assert.equal(desk.state('owner-a', 'C-1').refunds.length, 0);
  const second = await desk.chat('owner-a', 'C-1', 'scripted', first.conversationId, 'Show order O-1001', signal());
  assert.equal(second.sessionId, first.sessionId); assert.equal(second.status, 'idle');
  const read = await desk.conversation('owner-a', 'C-1', first.conversationId);
  assert.equal(read.messages.filter(item => item.role === 'agent').length, 2);
  await assert.rejects(desk.conversation('owner-b', 'C-1', first.conversationId), /unavailable/);
});
test('trusted host approval issues one exact refund and close archives the retained session', async () => {
  const desk = new CapstoneDesk(); after(() => void desk.close());
  const first = await desk.chat('owner-a', 'C-1', 'scripted', null, 'Refund 25 for O-1001', signal());
  const approved = await desk.decide('owner-a', 'C-1', first.conversationId, first.pendingApproval!.id, 'approve', signal());
  assert.equal(approved.summary?.caseStatus, 'resolved');
  assert.equal(desk.state('owner-a', 'C-1').refunds[0]?.amountCents, 2500);
  assert.equal(desk.state('owner-a', 'C-1').orders.find(order => order.id === 'O-1001')?.remainingCents, 2500);
  await assert.rejects(desk.decide('owner-a', 'C-1', first.conversationId, first.pendingApproval!.id, 'approve', signal()), /matching pending/);
  const closed = await desk.closeConversation('owner-a', 'C-1', first.conversationId);
  assert.equal(closed.status, 'closed'); assert.equal(closed.cleanup, 'archived');
});
test('foreign customer, policy expert and malicious note cannot cross the host tool boundary', async () => {
  const desk = new CapstoneDesk(); after(() => void desk.close());
  const rejected = await desk.chat('owner-a', 'C-2', 'scripted', null, 'Refund 10 for O-1001', signal());
  assert.equal(rejected.status, 'idle'); assert.equal(rejected.summary?.caseStatus, 'rejected');
  assert.equal(desk.state('owner-a', 'C-2').refunds.length, 0);
  const policy = await desk.chat('owner-a', 'C-2', 'scripted', rejected.conversationId, 'Show policy', signal());
  assert.equal(policy.policyExpert.lastResult, 'read'); assert.deepEqual(policy.policyExpert.allowedTools, ['search_policy']);
  const expert = new ScriptedPolicyExpert(), store = new CapstoneStore(), conversation = store.createConversation('x', 'C-2');
  assert.equal(expert.call(store, { owner: 'x', customerId: 'C-2', conversationId: conversation.id }, 'propose_refund', {}).isError, true);
  assert.equal(runCapstoneEvals().cases.every(item => item.pass), true);
});
test('duplicate history is deduplicated; missing idle and cancelled review do not invent a refund', async () => {
  class DuplicateHistory extends ScriptedCapstonePort { override async history(id: string) {
    const events = await super.history(id); return [...events, ...events]; } }
  const desk = new CapstoneDesk(undefined, () => new DuplicateHistory()); after(() => void desk.close());
  const first = await desk.chat('owner-a', 'C-1', 'scripted', null, 'Show order O-1001', signal());
  const second = await desk.chat('owner-a', 'C-1', 'scripted', first.conversationId, 'Show order O-1001', signal());
  assert.equal(second.messages.filter(item => item.role === 'agent').length, 2);
  const pending = await desk.chat('owner-a', 'C-1', 'scripted', first.conversationId, 'Refund 25 for O-1001', signal());
  assert.equal(pending.status, 'waiting-approval'); await desk.closeConversation('owner-a', 'C-1', first.conversationId);
  assert.equal(desk.state('owner-a', 'C-1').refunds.length, 0);
  assert.equal(desk.state('owner-a', 'C-1').approvals.at(-1)?.status, 'cancelled');
  class MissingIdle extends ScriptedCapstonePort { override async open(_id: string, _signal: AbortSignal) {
    return (async function* () {})(); } }
  const broken = new CapstoneDesk(() => new MissingIdle()); after(() => void broken.close());
  const incomplete = await broken.chat('owner-b', 'C-1', 'live', null, 'Refund 25 for O-1001', signal());
  assert.equal(incomplete.summary, null); assert.match(incomplete.note, /confirmed idle/);
  assert.equal(broken.state('owner-b', 'C-1').refunds.length, 0);
});
test('pinned live agent rejects missing configuration and mismatched tool shapes before provider use', () => {
  assert.equal(capstoneToolMismatch(capstoneToolDefinitions), false);
  assert.equal(capstoneToolMismatch([...capstoneToolDefinitions, { type: 'custom', name: 'unapproved' }]), true);
  assert.throws(() => createLiveCapstonePort(undefined, { MANAGED_LIVE_ENABLED: 'false', MANAGED_LAB50_LIVE_ENABLED: 'false' }),
    /dedicated agent ID/);
});
test('HTTP owner/customer boundary, closed input and approval use server reviewer identity', async () => {
  const app = express(), instance = createLab50Router(); app.use('/api/c50', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c50`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, extra = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: extra, body: JSON.stringify(body) });
  assert.equal((await post('chat', { mode: 'scripted', customerId: 'C-1', conversationId: null,
    message: 'Refund 25 for O-1001', approver: 'forged' })).status, 400);
  const first = await (await post('chat', { mode: 'scripted', customerId: 'C-1', conversationId: null,
    message: 'Refund 25 for O-1001' })).json() as { conversationId: string; pendingApproval: { id: string } };
  assert.equal((await fetch(`${base}/conversation/${first.conversationId}?customerId=C-2`, { headers })).status, 404);
  const decision = await (await post('approve', { customerId: 'C-1', conversationId: first.conversationId,
    approvalId: first.pendingApproval.id, decision: 'approve' })).json() as { status: string };
  assert.equal(decision.status, 'idle');
  const state = await (await fetch(`${base}/state?customerId=C-1`, { headers })).json() as { refunds: { approvedBy: string }[] };
  assert.equal(state.refunds[0]?.approvedBy, 'trusted-local-reviewer');
  assert.equal((await post('approve', { customerId: 'C-1', conversationId: first.conversationId,
    approvalId: first.pendingApproval.id, decision: 'approve' })).status, 409);
  assert.equal((await post('evals', {})).status, 200);
});
