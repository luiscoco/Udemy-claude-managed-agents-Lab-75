# How the fictional approval ledger works

1. Store proposals in a Map and executed business keys in a Set. Bind each proposal to an owner and fictional CASE-2042.
2. propose creates a pending record; snapshot returns a frozen copy that cannot mutate the stored record. notify records a local notification without adding an effect.
3. decide requires the matching owner, trusted-reviewer fixture identity, pending state, prior notification and a supported approve or reject decision. A decided proposal is terminal.
4. Approval adds archive:owner:caseId to the effect Set. The key represents the business effect, not the particular proposal, so approving a second proposal for the same owner and case leaves the effect count at one.
5. Rejection records rejected without adding an effect. Different owners have distinct business keys.

Run `node --test starter.test.mjs`. Expected: 5 passed, 0 failed. Notification is not approval. A readonly TypeScript type does not freeze a runtime object; the snapshot also needs Object.freeze on a copy.

Explain why two approved proposals for one owner yield one effect while two different owners yield two. The fixture identity is not real authentication, and restarting the process loses the in-memory ledger. Production effects need durable transactions and authorization.
