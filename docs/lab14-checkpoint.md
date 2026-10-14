# Lab 14 checkpoint: Models and supported effort

Implemented the workbook's next lesson using the existing Managed Agents stack, preserving Labs 01-13 and the shared visual design. The independent private destination is [Udemy-claude-managed-agents-Lab-14](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-14).

## Implemented

- Server-owned teaching catalog built from pinned SDK 0.133.0 model/effort types and dated official documentation. Account readiness is explicitly operator declared; setup never claims provider verification.
- Strict model/effort combinations, integer-cent budgets and finite local deadlines. Unknown models, incompatible efforts and Agent SDK thinking/fallback controls are rejected before sending.
- Fresh session creation with a pinned base version and model/effort object. Returned model, effort, budget, version, environment and text-only capabilities must match before sending. Actual session metadata is preserved even when verification fails.
- Injected adapters reuse the shared SSE, text-session runner and event consumer. The acknowledged user-message ID gates live evidence; stale idle events cannot finish a new turn. Private thinking is filtered before evidence collection.
- Deduplicated model-request usage, resolved model identity per attempt and live host elapsed time. Fixture latency, usage and cost measurements remain absent. Public response evidence is bounded before parsing and serialization.
- Explicit one-attempt host fallback with its own selected budget and distinct fresh session. Uncertain creation, unconfirmed cleanup, local cancellation and configuration mismatch block fallback. Returned IDs survive setup failure for cleanup; unknown creation reserves capacity.
- Owned local preparation, run/send, replacement configuration and end routes. Preparation has no provider effects. Completed turns are archived after idle confirmation; changing model/effort prepares a new experiment rather than mutating a remote session.
- Lab registration, readable experiment/comparison UI, guide, source inspection, README build steps, repository index and reproducible offline browser demonstration.

## Verification

- Full offline regression run: 202 tests passed. After a final adapter guard refinement, all 11 focused Lab 14 tests passed again.
- The focused suite covers closed schemas, fresh effort comparisons, separately budgeted fallback, archive-before-fallback ordering, unknown creation quarantine, output flooding, mismatches, failed cleanup, ownership/capacity, cancellation/deadline, real SDK injected transport, stale-event filtering, usage deduplication, private-event filtering and route effects.
- Browser checks: 4 Lab 14 tests passed, covering comparisons, stable prompt history, fallback, invalid combinations without requests, cancellation/cleanup, phone overflow and live readiness gating. Eight shared shell/navigation checks also passed.
- Typecheck and production build passed. Guide audit passed for IDs 1-14; all 4 guide/source/rendering tests passed in the regression suite. Build retains the existing nonfatal dynamic-import notices for raw teaching resources.
- Distribution scan passed for 1278 files without reading `.env` contents. Generated screenshots/logs and publication helpers are excluded from Git and npm packaging.
- Offline demonstration passed at 390 and 1440 pixels. Screenshots were reviewed for readable controls/evidence and page overflow; demonstration experiments were closed.
- Earlier regression attempts exposed fixed 50/100 ms cleanup assumptions in Lab 3/4 tests. Those assertions now poll actual admission with finite bounds. The older Lab 12 stale-idle test passed in its focused rerun and the final full suite; no Lab 12 production code changed.

## Reproduce

Use the PowerShell commands in README and the Lab 14 guide. With the local app running, `node scripts/lab14-browser-demonstration.mjs` opens `http://127.0.0.1:5174/?lesson=14`, permits only offline run requests, saves ignored phone/desktop screenshots under `artifacts/lab14/`, and closes each experiment.

For live setup, check account model access and declare selected IDs in server-only `CLAUDE_MANAGED_LAB14_MODELS`, alongside the existing base resources, API key and live opt-in. Restart the backend and check again. Only clicking Run live starts a billed attempt.

## Limits

No paid provider test, upload or provisioning ran. Account readiness and actual model availability require deliberate user verification. The catalog is a dated teaching subset, not an exhaustive provider model list. Unknown creation without a returned ID requires manual Console reconciliation and stays quarantined; it is never automatically retried. Model identity is the resolved session snapshot because the installed request-span types do not contain a model ID. Reported usage covers observed request spans, not complete billed session cost. Elapsed time includes setup/cleanup and is not isolated inference latency. Fixture responses are authored and identical across effort levels; they cannot establish quality or performance differences.

References checked 2026-10-14: [effort](https://platform.claude.com/docs/en/build-with-claude/effort), [Managed sessions](https://platform.claude.com/docs/en/managed-agents/sessions), [TypeScript session creation](https://platform.claude.com/docs/en/api/typescript/beta/sessions/create).
