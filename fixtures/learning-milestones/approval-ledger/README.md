# Fictional approval and effect ledger

Requires Node 24 or newer. No dependency installation, API key, real payment, email or cloud resource is involved.

Implement ApprovalGate in starter.ts and run `npm test`. Initial tests intentionally fail because the starter throws Not implemented.

The only case is fictional CASE-2042. propose(owner) creates a fresh pending proposal. notify(owner, id) records a local notification without executing an effect. decide(owner, reviewer, id, decision) requires the matching owner, the fixture reviewer string trusted-reviewer, a pending notified proposal and approve or reject. Repeated decisions fail. Reject executes no effect.

Approved effects use a stable owner/case business key. Approving a second proposal for that same owner/case does not duplicate the effect. snapshot(owner, id) returns a frozen copy with id, caseId, state and notified. Unknown owners must not inspect or mutate another owner's proposal.

The reviewer string is an authored teaching fixture, not real login or production authorization. The in-memory ledger is not durable storage. Explain those limits along with your passing tests in the lesson notebook. The platform never executes the files you edit.
