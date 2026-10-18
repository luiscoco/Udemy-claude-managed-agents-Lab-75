import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApprovalGate } from './starter.ts';

test('proposal and notification create no effect; trusted approval creates one', () => {
  const gate = new ApprovalGate(), proposal = gate.propose('owner-a');
  assert.equal(gate.effectCount, 0); assert.equal(proposal.state, 'pending');
  gate.notify('owner-a', proposal.id); assert.equal(gate.effectCount, 0);
  assert.deepEqual(gate.decide('owner-a', 'trusted-reviewer', proposal.id, 'approve'), { state: 'approved', effectCount: 1 });
});
test('owner, reviewer and notification gates reject premature effects', () => {
  const gate = new ApprovalGate(), proposal = gate.propose('owner-a');
  assert.throws(() => gate.snapshot('owner-b', proposal.id));
  assert.throws(() => gate.decide('owner-a', 'trusted-reviewer', proposal.id, 'approve'));
  gate.notify('owner-a', proposal.id);
  assert.throws(() => gate.decide('owner-a', 'wrong-reviewer', proposal.id, 'approve'));
  assert.equal(gate.effectCount, 0);
});
test('snapshots resist tampering and the business key prevents repeat effects', () => {
  const gate = new ApprovalGate(), proposal = gate.propose('owner-a');
  assert.throws(() => { proposal.caseId = 'CASE-OTHER'; });
  assert.equal(gate.snapshot('owner-a', proposal.id).caseId, 'CASE-2042');
  gate.notify('owner-a', proposal.id); gate.decide('owner-a', 'trusted-reviewer', proposal.id, 'approve');
  assert.throws(() => gate.decide('owner-a', 'trusted-reviewer', proposal.id, 'approve'));
  const second = gate.propose('owner-a'); gate.notify('owner-a', second.id);
  gate.decide('owner-a', 'trusted-reviewer', second.id, 'approve'); assert.equal(gate.effectCount, 1);
});
test('rejection is terminal and executes no effect', () => {
  const gate = new ApprovalGate(), proposal = gate.propose('owner-a'); gate.notify('owner-a', proposal.id);
  assert.deepEqual(gate.decide('owner-a', 'trusted-reviewer', proposal.id, 'reject'), { state: 'rejected', effectCount: 0 });
  assert.throws(() => gate.decide('owner-a', 'trusted-reviewer', proposal.id, 'approve'));
});
test('different owners have distinct business keys', () => {
  const gate = new ApprovalGate();
  for (const owner of ['owner-a', 'owner-b']) { const proposal = gate.propose(owner); gate.notify(owner, proposal.id); gate.decide(owner, 'trusted-reviewer', proposal.id, 'approve'); }
  assert.equal(gate.effectCount, 2);
});
