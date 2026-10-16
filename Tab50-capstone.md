# Lab 50: Full stack capstone

## Prerequisites

Complete the tools, approvals, retained sessions and validated-report labs. The offline Acme Support Desk uses two fictional customers and requires no API key. `npm run capstone:check` validates the authored tool metadata without a provider call. Live mode requires a separately provisioned, version-pinned dedicated desk agent, exact custom tools, server-side credentials and `MANAGED_LAB50_LIVE_ENABLED=true`. The explicit `npm run capstone:provision` command additionally requires `LAB50_PROVISION_CONFIRM=YES` and `MANAGED_MODEL`; it is never called by the exercise.

## Controls

Select C-1 or C-2, send a support message, resume the same conversation, inspect back-office state, approve or deny a pending refund, close the session, and run deterministic host evals. Learn and TypeScript source views preserve the exercise state. Leaving the lesson requests closure of the retained conversation.

## Evidence to inspect

The host owns customers, orders, tickets, refund ledger, conversations and bounded audit entries. Each model-facing custom tool has a closed Zod-derived `input_schema`; its `agent.custom_tool_use` `sevt_` ID is matched to `user.custom_tool_result`. The customer and reviewer never come from model arguments. For C-1, damaged order O-1001 costs 5,000 cents and is eligible within the fixture window; the host checks ownership, positive integer cents, remaining amount and policy before issuing a pending review. Approval is immutable, single-use and expires. Denial, timeout or cancellation do not alter the refund ledger. C-2's unrelated order and malicious note are not authority to refund C-1.

The desk keeps the session ID across turns and archives only on explicit close. Paginated event history is bounded and deduplicated. Preview/prose evidence is distinct from host effects; final summaries must pass the closed JSON parser. Event IDs and any thread IDs are shown separately, with usage unknown unless observed. The policy-expert role has only read access to authored policy documents.

## Troubleshooting

Use the same customer and conversation when resuming. A pending approval must be decided or closed before the next message. If cleanup is pending, inspect the remote session rather than treating local abort as a confirmed stop. `GET /api/c50/facts` and `GET /api/c50/code` describe supported capabilities. Reset affects only the local owner's fixture after cleanup.

## Limitations

The scripted adapter and evals are authored fixtures. A live agent must be explicitly configured and opted in; this lesson does not provision, bill or write externally on setup checks. The local reviewer identity is suitable for this loopback teaching range, not production authentication. A policy explanation or model summary cannot override the deterministic host gate.

## Challenge

Deny a refund and verify that the ledger, remaining balance and audit reflect the denial with no issued refund. Then try a foreign order and an amount above the remaining paid total.

## Run locally

```powershell
npm run test:capstone
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab50-browser-demonstration.mjs
```
