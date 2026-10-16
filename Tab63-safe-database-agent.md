# Lab 63: A safe database agent

## Prerequisites

Run Node.js with `node:sqlite` and the local learning platform. Each session creates a disposable SQLite database under ignored `artifacts/lab63/sessions/`. No external database, payment, provider request or API key is involved.

## Controls

Create a session, read the fixed order `O-A1`, and propose cancellation. A proposal records the order version, a stable business key, a five-minute expiry and an audit entry, but leaves the order open. **Approve as human** or **Reject as human** uses a separate endpoint. For stale and expired experiments, create a new session and proposal, then change the row version or advance the fixture clock before approval. **Try arbitrary SQL** sends text that the host deliberately never executes.

## Evidence to inspect

The host chooses tenant identity; the browser cannot supply a tenant. Fixed parameterized SELECT queries include the tenant predicate. Agent custom-tool schemas for read and propose are Zod-derived, closed and correlated to `user.custom_tool_result` by the `sevt_` event ID. A stable cancellation effect key is separate from the tool event. Both SQLite connections report `PRAGMA query_only=ON` outside host-controlled writes.

The human approval path uses `BEGIN IMMEDIATE` and a single `UPDATE` whose WHERE clause checks order ID, host tenant, open status and captured row version. Exactly one row must change or the transaction rolls back. Proposal status and audit are recorded. A replay of a decided proposal is rejected. Agent prose never counts as a database commit.

## Troubleshooting

If the order read fails, verify it belongs to the host tenant. If approval returns stale, compare the captured and current versions; the order remains open. Expired and rejected proposals change zero order rows. A second decision fails because the proposal is no longer pending. The blocked-SQL demonstration returns a refusal without passing the text to `DatabaseSync`.

## Limitations

The database is a fictional local fixture. It demonstrates narrow host tools and approval control, not a production multi-tenant database deployment. The live Managed custom-tool shape is modeled and tested, but no Managed session calls it. No general SQL execution, shell tool or caller-selected workspace is exposed.

## Challenge

Propose cancellation, change the row version, then approve. Identify the zero-row update, rollback, stale proposal and unchanged open order.

## Run locally

```powershell
node --import tsx --test tests/lab63-safe-database-agent.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab63-browser-demonstration.mjs
```
