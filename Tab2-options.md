# Lab 02: Session options

Control one Managed Agents turn with session-local overrides, an integer-cent list-cost budget, connection previews and a local deadline.

## Prerequisites

Use Node 24 or newer and the installed Anthropic TypeScript SDK 0.133.0. Lab 01 should work first. Offline mode requires no credentials, provisioning or account access. Run from this workspace in PowerShell:

```powershell
npm run dev
```

Open http://127.0.0.1:5174/?lesson=2 and select **Run the exercise**. If your NVM installation blocks npm, execute the installed entrypoints directly:

```powershell
node scripts/dev-server.mjs
# In a second PowerShell window:
node node_modules/vite/bin/vite.js
```

Live runs are optional, billed and require explicit use of the live control. Keep the key on the server. See docs/managed-setup.md for existing resource configuration; do not provision just to run fixtures. MANAGED_AGENT_VERSION pins a positive integer version when set; otherwise the existing latest-version policy is preserved. The server never updates the shared agent.

## Controls

- **Model** comes from the authored server allowlist in shared/lab02-options.ts. Local acceptance does not prove account access. A provider rejection is shown as an error with HTTP status; check account access and model availability manually.
- **System prompt**: Inherit omits `system`, Override sends bounded nonempty text (up to 4000 characters), Clear sends `system: null`. Empty override text is invalid. All changes affect only the fresh session.
- **Session budget (US cents)** is an integer from 1 to 500. 50 cents displays $0.50 and maps to `budget: { type: "limit", max_list_cost: { currency: "USD", amount: "50" } }`. Every live session has a budget. List cost uses public prices and differs from billed cost.
- **Text previews** opt in with `event_deltas: ["agent.message"]` for this stream connection. Disabled mode omits that field. Both modes still receive authoritative `agent.message` events.
- **Local deadline (seconds)** is an integer from 1 to 120 and cannot exceed MANAGED_DEADLINE_MS on the server. It bounds local waiting and triggers an independent interruption attempt; it does not count or cap model requests.
- **Offline scenario** chooses authored behavior. Normal, repeated-events, budget-reached, deadline, cancel, terminal session-error, requires-action and stream-ended are supported. Cancel query aborts the browser POST, following the existing platform mechanism.

The effective agent is text-only. Session creation clears tools, MCP servers and skills. Multiagent configurations cannot be cleared through this override form, so the server rejects a multiagent base agent before creation and guards the returned session before sending the prompt.

## Migration

`maxTurns`, `maxBudgetUsd` and `includePartialMessages` belong to the Agent SDK. They are rejected here, never forwarded to Managed Agents and never translated into invented provider fields. A local deadline is not a turn limit. Connection event deltas are not SDK partial messages. Budget pauses are not `error_max_budget_usd` or `error_max_turns` results.

The adapter calls `sessions.create` with `agent.type="agent_with_overrides"`, the configured base ID and optional pinned version. The response's resolved `agent` is the effective snapshot. Requested options appear separately, including whether the system was inherited, overridden or cleared. Model replacement also replaces the base model configuration (including its effort or inference geo settings); this lab uses the selected model's defaults.

Signatures were checked against the installed SDK and the official [session creation guide](https://platform.claude.com/docs/en/managed-agents/sessions), [create API reference](https://platform.claude.com/docs/en/api/beta/sessions/create), and [session budget guide](https://platform.claude.com/docs/en/managed-agents/budgets). Provider access is not verified by offline tests.

## Experiment

1. Leave prompt, model, system, budget and deadline fixed. Run Normal turn with previews enabled, then disable previews and run again. Both authoritative responses must match and appear only once per run. Session IDs must differ.
2. Re-enable previews and hold all other controls fixed. Select Budget reached, then reduce only budget. This deterministic fixture illustrates a pause; it does not measure whether Claude would reach that budget.
3. Hold prompt, model, system, budget and previews fixed. Select Deadline expires, set the deadline to 1 second and run. Observe deadline, simulated interruption and simulated cleanup. Compare a longer deadline using the same scenario; it still waits until that local limit, because the fixture intentionally never completes.
4. Run Session error, Requires action and Stream ends early. Distinguish error, paused and incomplete outcomes.
5. For a model comparison, hold every other option and the prompt fixed and change only the model. Offline text remains authored; live model comparisons require manual billed runs.

The experiment table records the last 20 results: prompt, mode/source, requested settings, effective settings, outcome, reported usage and cleanup/interruption status. It lives in this mounted exercise and is cleared by navigation or refresh. Browser cancellation records a local cancellation row with unknown effective configuration and unconfirmed interruption; the connection is closed, so the server's eventual cleanup result cannot reach the table. This uncertainty also applies to fixture cleanup after disconnection.

## Evidence to inspect

The route inventory under `/api/c2` is **POST /query**. UI/server source tabs show the actual implementation and link to supporting source as text, without exposing secrets or runtime resource files.

Inspect shared/lab02-options.ts for strict schemas and cents formatting; server/concepts/02-options.ts for validation, concurrency and SSE hosting; server/lib/lab02-port.ts for session overrides and stream-before-send; server/lib/lab02-fixtures.ts for authored Managed Agents event shapes; server/lib/lab02-run.ts for reported span usage; server/lib/session-events.ts and server/lib/lab01-run.ts for the shared event consumer and cleanup.

Previews accumulate by event ID and block index. Repeated fragments, even identical ones, must all be applied. Persisted events deduplicate by ID. Authoritative messages replace previews. Lifecycle events and turn outcomes have separate panels.

Reported tokens come only from documented `span.model_request_end.model_usage` fields. The scope is model-request spans received on this connection, not the whole session. Cache read/creation usage is shown separately. Do not add overlapping session totals, estimate tokens from preview characters or treat fixture events as measured usage. Offline usage is explicitly not reported.

## Troubleshooting

Unknown fields, legacy options, unlisted models, invalid system choices, fractional cents and out-of-range limits return 400 before provider calls. Live configuration problems return 422. Capacity returns 429. Check field errors, not just the top-level message. Model/account/provider rejection yields an error outcome rather than silently falling back to another model.

Deadline and cancellation stop local waiting first. The runner attempts bounded `user.interrupt` using an independent request before aborting the upstream stream, then checks idle/terminated status. Remote interruption is confirmed only when the send succeeds and a stopped status is observed. Otherwise it is unconfirmed: check Claude Console manually. Authored fixtures report simulated interruption, never a remote confirmation. Idle sessions are archived; cleanup failure or unknown status is pending. No prompt means no interruption is needed.

## Limitations

The provider checks budget between model requests. The request crossing the threshold may finish beyond it, so this is not an exact spending ceiling. Lowering a budget does not guarantee a budget pause; completion may happen first. `budget_reached` means paused, not completed. This lab never increases a budget or resumes work automatically.

Stream EOF is incomplete unless a completion lifecycle event was observed. A terminal session error, local deadline, browser cancellation and requires_action remain distinct outcomes. Offline scenarios demonstrate event interpretation, not Claude performance, spend or latency. Creation itself is a bounded provider request and can outlast the local waiting deadline so its returned ID remains available for cleanup.

## Verification

Run in PowerShell:

```powershell
npm run typecheck
node --import tsx --test tests/lab02-options.test.ts
npm run test:offline
npm run test:lesson-guides
npm run audit:lesson-guides
npm run build
node scripts/run-browser-tests.mjs lab01.spec.ts lab02.spec.ts
```

For an NVM npm-wrapper restriction, use `node node_modules/typescript/bin/tsc --noEmit`, `node --import tsx --test --test-concurrency=1 tests/*.test.ts`, `node --import tsx scripts/audit-lesson-guides.ts`, and `node node_modules/vite/bin/vite.js build`. The browser test runner owns and stops its temporary servers. Stop manually started servers with Ctrl+C. Do not run managed:provision, live experiments or other external actions as part of verification.

## Challenge

Reduce the session budget or local deadline. Explain the resulting outcome, which limit produced it, and whether remote execution was confirmed stopped. Cite the lifecycle stop reason or local deadline result and the separate interruption/cleanup status. Explain why an offline budget fixture cannot establish a real spending threshold.
