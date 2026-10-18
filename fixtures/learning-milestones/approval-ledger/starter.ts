export type Proposal = Readonly<{ id: string; caseId: 'CASE-2042'; state: 'pending' | 'approved' | 'rejected'; notified: boolean }>;
export class ApprovalGate {
  get effectCount(): number { throw new Error('Not implemented: effectCount'); }
  propose(_owner: string): Proposal { throw new Error('Not implemented: propose'); }
  notify(_owner: string, _id: string): void { throw new Error('Not implemented: notify'); }
  decide(_owner: string, _reviewer: string, _id: string, _decision: 'approve' | 'reject'): { state: string; effectCount: number } { throw new Error('Not implemented: decide'); }
  snapshot(_owner: string, _id: string): Proposal { throw new Error('Not implemented: snapshot'); }
}
