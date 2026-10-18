type State = 'pending' | 'approved' | 'rejected';
type Stored = { id: string; owner: string; caseId: 'CASE-2042'; state: State; notified: boolean };
export class ApprovalGate {
  private proposals = new Map<string, Stored>();
  private effects = new Set<string>();
  private sequence = 0;
  get effectCount() { return this.effects.size; }
  private get(owner: string, id: string) {
    const proposal = this.proposals.get(id);
    if (!proposal || proposal.owner !== owner) throw new Error('Proposal owner mismatch.');
    return proposal;
  }
  propose(owner: string) {
    if (typeof owner !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(owner)) throw new Error('Invalid owner.');
    const proposal: Stored = { id: `proposal-${++this.sequence}`, owner, caseId: 'CASE-2042', state: 'pending', notified: false };
    this.proposals.set(proposal.id, proposal); return this.snapshot(owner, proposal.id);
  }
  notify(owner: string, id: string) {
    const proposal = this.get(owner, id);
    if (proposal.state !== 'pending' || proposal.notified) throw new Error('Not pending or already notified.');
    proposal.notified = true;
  }
  decide(owner: string, reviewer: string, id: string, decision: 'approve' | 'reject') {
    const proposal = this.get(owner, id);
    if (reviewer !== 'trusted-reviewer') throw new Error('Wrong reviewer.');
    if (proposal.state !== 'pending') throw new Error('Already decided.');
    if (!proposal.notified) throw new Error('Notify first.');
    if (decision !== 'approve' && decision !== 'reject') throw new Error('Invalid decision.');
    if (decision === 'approve') this.effects.add(`archive:${owner}:${proposal.caseId}`);
    proposal.state = decision === 'approve' ? 'approved' : 'rejected';
    return { state: proposal.state, effectCount: this.effectCount };
  }
  snapshot(owner: string, id: string) {
    const proposal = this.get(owner, id);
    return Object.freeze({ id: proposal.id, caseId: proposal.caseId, state: proposal.state, notified: proposal.notified });
  }
}
