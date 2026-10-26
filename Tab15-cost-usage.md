# Lab 15: Usage and session budgets

Read returned usage and enforce spending boundaries. Session retrieval, usage events, observed model-request spans and thread attribution have distinct scopes. The exercise never adds overlapping totals.

## Prerequisites

Use the existing React, Vite, strict TypeScript, Express and Zod platform with official Anthropic SDK 1.3.0. Offline accounting scenarios require no credentials. Live requires the isolated server API key, single-agent base agent/environment and explicit live opt-in. No provisioning or paid test starts during setup.

```powershell
npm.cmd install
npm.cmd run dev
# Open the actual Vite address, normally:
# http://127.0.0.1:5174/?lesson=15
```

## Controls

Choose a creation budget in whole US cents, message/turn limits and deadline before starting. Start offline usage experiment first. Repeated-usage duplicates persisted events; child-activity provides fictional overlapping thread totals; missing-usage leaves fields unknown; budget-reached pauses; hang exercises cancellation. All fixture values are authored, not measured usage or price predictions.

Send another turn reuses the owned idle session while respecting independent message and turn limits. Each experiment permits at most three turns/messages, one context message, zero tool calls and one explicit budget increase. The context control sends a system message, not a new user turn or a budget update.

Retrieve session usage reads current metadata without resuming work. Close usage session archives only after idle confirmation. Local cancellation initiates independent cleanup; an unknown remote state blocks reuse.

The separate Raise budget and resume action requires acknowledging that paused work may restart immediately. This host only permits a capped increase, up to 500 cents, on an originally budgeted session paused at its cap, above known consumed list cost and within the remaining turn limit. It never removes a cap or adds one late. A raise consumes a host turn even when its acceptance is uncertain. No automatic increase occurs.

Routes under `/api/c15`: POST `/run`, `/session`, `/send`, `/context`, `/usage`, `/end`, plus the explicit `/budget` action. `/session` prepares a local owned experiment with no provider calls; `/send` creates its remote budgeted session on first use. `/run` combines preparation and the first turn.

## Evidence to inspect

Session retrieval supplies cumulative input/output/cache tokens, active seconds and list cost when present. Usage events replace earlier usage-event snapshots; retrieval replaces earlier retrieved snapshots. Deltas require the same scope, identity and source. Missing, invalid or decreasing counters yield unknown deltas rather than invented zeros. Persisted event IDs deduplicate both usage events and observed request spans. Older usage events do not replace newer ones.

Model-request spans only describe requests observed on this stream. They have aggregate cache-creation tokens without TTL attribution and do not establish list cost or complete session consumption. Thread rows are attribution, not additional session usage. One bounded thread-list page is read; unavailable or truncated attribution is labeled. Private thinking is filtered.

USD `amount` is a canonical string of whole cents: `"125"` means 125 cents. Decimal strings, non-USD values, unsafe integers and unavailable values remain unknown. Session totals are replaced, never accumulated across snapshots. Snapshot history is bounded and is not a complete audit record.

## Troubleshooting

Check server setup if Run live is unavailable. Do not paste keys into the browser. A live base with orchestration is rejected; child activity is deliberately demonstrated offline. Invalid fields such as `result.usage`, `modelUsage`, `total_cost_usd`, `maxBudgetUsd` and `maxTurns` are not translated from Agent SDK.

A local turn/message limit blocks the next work-starting request before sending. A budget pause needs an explicit decision to close or raise, not another user message. Unknown list cost prevents raising. Failed or mismatched budget verification, uncertain sends and unconfirmed cleanup prevent reuse. Check Claude Console when no session ID was returned; no automatic retry can safely identify that remote creation.

## Limitations

Live tools and orchestration are disabled, so this lab demonstrates child attribution using fixtures rather than starting extra worker agents. Usage can lag; a later idle-session retrieval can differ from the stream snapshot. Budgets govern platform list cost, while invoice totals may differ. In-flight requests can finish beyond the cap. Session and thread active time/cost have different scopes. The SDK permits updating an existing budget, but rejects adding one to a session created without it; removing a cap is one-way, and this host disallows removal entirely.

The installed session usage, usage-event, span, thread and budget-update types were inspected. Official references checked 2026-10-14: [usage](https://platform.claude.com/docs/en/managed-agents/session-observability) and [budgets](https://platform.claude.com/docs/en/managed-agents/budgets). Current capabilities and account behavior still need deliberate live verification.

## Challenge

Explain why intermediate usage differs from the final session snapshot. Identify which values are cumulative session totals, partial observed spans and overlapping child attribution. Demonstrate that repeated events do not increase totals, a missing field stays unknown, and retrieving usage at a budget pause does not resume work.
