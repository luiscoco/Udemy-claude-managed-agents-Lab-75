# Lab 08: Delegation and session threads

## Goal

Delegate a bounded task to predefined Managed Agents, correlate each child by its `sthr_` thread ID and agent identity, and verify tool effects in the host.

## Prerequisites

- Node.js 24 and installed dependencies.
- Offline mode needs no credentials and makes no Anthropic requests.
- Live mode additionally needs the base Managed environment, `MANAGED_LIVE_ENABLED=true`, and a manually provisioned `CLAUDE_MANAGED_LAB08_AGENT_ID`.

## Controls

- **Offline scenario** selects normal, duplicate, cross-posted, wrong-role or hanging authored behavior.
- **Run offline delegation** streams deterministic thread and effect evidence.
- **Run live** is gated by both base readiness and the dedicated coordinator ID.
- **Cancel query** aborts the request and invokes the session interrupt boundary.

## Evidence to inspect

- The coordinator uses `multiagent_20261001` with predefined researcher, reviewer and calculator agents.
- Inline agents, advisor and workflows are disabled for this exercise.
- `session.thread_created`, thread status, and `agent.thread_message_sent` / `agent.thread_message_received` are correlated by thread IDs.
- Child event streams are independent. This lab does not translate an Agent SDK `Agent` tool or assume `parent_tool_use_id`.
- Native child threads share the session sandbox and credentials. The host still enforces role and path capabilities.

The thread table records agent identity and per-thread history. The effect ledger records role authorization, whether a handler ran, and the verified effect.

## Troubleshooting

- A 400 response means the strict request rejected a field or limit. Agent SDK `agents`, `Agent`, and `parent_tool_use_id` fields are deliberately unsupported.
- A 422 live response means live setup or `CLAUDE_MANAGED_LAB08_AGENT_ID` is missing or the coordinator topology failed verification.
- A 429 response means the bounded server concurrency limit is occupied.
- Provision explicitly with `npm run managed:provision -- lab08`; this can create billable remote resources and never runs on application startup.

## Limitations

- Distinct histories do not imply filesystem or credential isolation.
- Child prose does not automatically become the parent's final answer.
- Offline events are authored and do not prove real parallel execution.
- Live custom-tool handling is intentionally limited to observing thread topology in this bounded lesson; effect claims still require host evidence.

## Exercise

1. Run **normal** and find separate researcher, reviewer and calculator histories.
2. Confirm the reviewer write is denied before its handler runs.
3. Confirm the calculator report is independently recomputed as 42.
4. Run **cross-posted-call** and locate the routed blocking call.
5. Run **duplicate-events** and inspect the duplicate counter.
6. Run **wrong-role** and confirm a reviewer cannot call the calculator capability.
7. Run **hang**, cancel it, and confirm child activity crosses the interrupt boundary.

Distinct histories show routing and identity. They do not prove filesystem isolation or real parallel execution. Child prose does not automatically become the parent's final answer.

## PowerShell checks

```powershell
node --import tsx --test tests/lab08-subagents.test.ts
node scripts/audit-lessons.mjs
node node_modules/vite/bin/vite.js build
node node_modules/playwright/cli.js test browser-tests/lab08.spec.ts
```

## Challenge

Restrict one worker capability, run the wrong-role scenario, and explain the worker report beside the host effect ledger. The ledger decides whether an effect occurred.
