# Lab 18 checkpoint: Cloud sandbox and host boundaries

Implemented the workbook's sandbox boundary lesson in the cumulative Managed Agents platform. Its independent private destination is [Udemy-claude-managed-agents-Lab-18](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-18).

## Implemented

- Registered lesson 18 with its React exercise, Express router, guide, source inspection and README build steps. Labs 01-17 remain available.
- Added a local platform manifest with the configured environment ID, optional agent version pin and authored network policy. SDK 0.133.0 exposes no environment version; an explicit live metadata check displays `updated_at` as a revision marker without creating a session.
- Added disposable offline host tests. The allowed case reads an exact allowlisted fixture file and hashes actual bytes. Outside path, blocked network and missing environment show zero read/socket effects; the network decision is explicitly authored, not a cloud egress observation.
- Added a deliberate live port that rechecks the active cloud environment's restricted network/package policy, pins a single-agent base, creates one budgeted session with only `bash` enabled under `always_ask`, and host-confirms only exact `pwd`. The shared tool-session runner handles events, cancellation, deadline and archive. The live command executes in the remote sandbox, never natively on Windows.
- Added closed request/report contracts, ownership and local-origin checks, concurrency bounds, effect evidence, focused tests and an offline browser demonstration.
- Extended an unchanged Lab 04 approval test's finite review wait from 5 to 10 seconds after one slow Windows run timed out; the test passed alone and in the final cumulative run.

## Verification

- Full sequential offline regression: **233 passed, 0 failed**. Eight focused Lab 18 tests cover strict contracts, exact-command confirmation, actual host file effects, no-effect refusals, metadata-only readiness, injected SDK creation/rechecks, HTTP validation and concurrent admission.
- Browser: **10 passed, 0 failed** (two Lab 18 and eight shared shell/navigation checks), including 390 px fit and live readiness without a billed session.
- Typecheck, production build and guide/source audit passed for IDs 1-18; four guide tests passed.
- The offline browser demonstration passed at 390 and 1440 pixels. Ignored screenshots under `artifacts/lab18/` were visually reviewed; no horizontal overflow was detected.
- Distribution scan passed for 1355 files without reading `.env` contents. Generated screenshots and temporary fixture trees are excluded from Git and npm packaging.

## Reproduce

Use the PowerShell commands in [README](../README.md) and the [Lab 18 guide](../Tab18-sandbox.md). `node scripts/lab18-browser-demonstration.mjs` starts its own local server pair unless `LESSON_UI_URL` is set, permits only offline `/api/c18/run` requests and saves ignored screenshots under `artifacts/lab18/`.

The live path requires a deliberate click, an isolated server API key, single-agent base, restricted cloud environment and explicit opt-in. No paid provider run, upload or provisioning was performed during implementation.

## Limits

The offline network result is a host-policy simulation with no socket opened. Local path checks cannot prove cloud OS containment. The live diagnostic has no file mount and verifies only an observed `pwd` tool use/result, not mount enforcement or every sandbox security property. Agent tool permission policy does not replace host custom-handler validation. An unconfirmed session or cleanup requires separate reconciliation.

Official references checked 2026-10-15: [cloud environment setup](https://platform.claude.com/docs/en/managed-agents/environments), [secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment), [sandbox boundaries](https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks), and [cloud sandbox reference](https://platform.claude.com/docs/en/managed-agents/cloud-sandboxes-reference).
