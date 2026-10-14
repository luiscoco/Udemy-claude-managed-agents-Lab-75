# Lab 15 checkpoint: Usage and session budgets

Implemented the workbook's next lesson in the cumulative Managed Agents platform. The independent private destination is [Udemy-claude-managed-agents-Lab-15](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-15).

## Implemented

- Registered numeric lesson 15 with its React exercise, Express route, guide, source inspection and README build steps. Labs 01-14 and the shared visual design remain available.
- Read session usage, cumulative usage events, observed model-request spans and a bounded page of thread usage through the installed `@anthropic-ai/sdk` 0.133.0 types. Each reading labels its source and scope. Overlapping session and thread totals are displayed separately.
- Parsed canonical USD whole-cent strings to safe integer cents. Missing or invalid counters stay unknown; comparable cumulative snapshots replace earlier values and produce nonnegative deltas. Event IDs deduplicate repeated observations.
- Created an owned session with a budget at creation and independent host message, turn, context, tool and deadline limits. The retained session accepts another bounded turn after confirmed idle. A budget pause permits read-only inspection, close, or one separately acknowledged capped increase; it never raises itself.
- Reused the shared SSE, event-consumer and tool-session boundaries through injected fixture/live ports. Stale idle events and private thinking do not become new-turn evidence. Failed verification, uncertain creation and unconfirmed cleanup block reuse.
- Added deterministic repeated-usage, child-activity, budget-reached, missing-usage and hang scenarios. Child totals and fixture costs are authored teaching data. Added a reproducible 390/1440-pixel offline browser demonstration.

## Verification

- Full offline regression: **214 passed, 0 failed**. The 12 focused Lab 15 tests cover cent conversion, unknown and decreasing counters, snapshot replacement, duplicate events, overlapping child attribution, host limits, budget creation/update constraints, explicit resume, ownership, cancellation, deadline, cleanup, SDK field use and strict HTTP rejection before effects.
- Browser: **12 passed, 0 failed** (four Lab 15 flows and eight shared shell/navigation checks), including budget pause/resume, mobile layout, cancellation and live readiness without paid work.
- Typecheck and production build passed. Guide/source audit passed for IDs 1-15; guide/rendering tests passed in the full suite.
- Distribution scan passed for 1299 files without reading `.env` contents. Generated screenshots, logs and publication helpers are excluded from Git and npm packaging.
- The offline demonstration passed at 390 and 1440 pixels. Ignored screenshots under `artifacts/lab15/` were reviewed; the experiments were closed.
- An earlier parallel validation run hit a Vite transport timeout and a short Lab 04 review-admission test bound. The audit and browser checks passed when run separately. The Lab 04 test now waits up to five seconds for both reviews; the final sequential regression passed.

## Reproduce

Use the PowerShell commands in [README](../README.md) and the [Lab 15 guide](../Tab15-cost-usage.md). With the local app running, `node scripts/lab15-browser-demonstration.mjs` exercises only offline routes at `http://127.0.0.1:5174/?lesson=15` and saves ignored phone and desktop screenshots under `artifacts/lab15/`.

Live setup requires the server-only isolated API key, single-agent base agent/environment and explicit opt-in. Only clicking Run live starts a billed session. Budget changes require a separate acknowledged action.

## Limits

No paid provider run, provisioning or upload was performed. Live usage availability and budget behavior still require deliberate account verification. Usage events can lag the final retrieved session snapshot. Model-request spans cover only observed requests; thread usage overlaps session usage and is never added to it. List cost is a platform usage measure, not an invoice total, and an in-flight request may finish above the cap. Unknown remote creation without a returned ID needs manual Console reconciliation and is not retried automatically. This host deliberately disallows budget removal and late budget addition.

Official references checked 2026-10-14: [Managed Agents usage](https://platform.claude.com/docs/en/managed-agents/session-observability) and [budgets](https://platform.claude.com/docs/en/managed-agents/budgets).
