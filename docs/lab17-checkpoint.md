# Lab 17 checkpoint: Host snapshots and file restoration

Implemented the workbook's host snapshot lesson in the cumulative Managed Agents platform. Its independent private destination is [Udemy-claude-managed-agents-Lab-17](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-17).

## Implemented

- Registered lesson 17 with its React exercise, strict Express routes, source inspection, guide and README build steps. Labs 01-16 remain available.
- Added a real, isolated fixture tree under ignored `generated/lab17/<run-id>/`, with tracked `notes.md` and `draft.md` plus untracked `scratch.md`. Host paths are allowlisted and guarded against traversal and symlinks. Built-in filesystem tools are disabled in the live text-only session.
- Reused the Lab 15 retained-session and shared SSE/event-consumer boundary. The selected host handler runs only after a completed, confirmed-idle turn; it is an explicit application action, not an agent tool call or a claim made by the model.
- Recorded snapshot IDs, file hashes, session IDs, host event IDs and bounded observed stream event IDs. Restoration requires a dry-run plan, owner, snapshot, unchanged version and matching current hashes. It changes only tracked files. The conversation, untracked file and remote sandbox remain untouched.
- Added separate, bounded session-scoped remote output inspection and a one-shot offline session comparison. Neither places remote files in the host snapshot tree.

## Verification

- Full sequential offline regression: **225 passed, 0 failed**. Five focused Lab 17 tests cover strict contracts, actual disk restoration, ownership and stale refusal, active-turn refusal, event provenance, output separation, one-shot cleanup and HTTP routes.
- Browser: **2 Lab 17 checks passed** after correcting test locators; the **8 shared shell/navigation checks passed** in the combined run. The phone check confirms 390 px fit and that live readiness creates no billed session.
- Typecheck, production build and guide/source audit passed for IDs 1-17; four guide tests passed.
- The offline demonstration passed at 390 and 1440 pixels. Screenshots under ignored `artifacts/lab17/` were visually reviewed and show the dry-run plan without horizontal overflow.
- Distribution scan passed for 1337 files without reading `.env` contents. Generated screenshots, fixture trees and publication helpers are excluded from Git and npm packaging.

## Reproduce

Use the PowerShell commands in [README](../README.md) and the [Lab 17 guide](../Tab17-checkpointing.md). `node scripts/lab17-browser-demonstration.mjs` starts its own local server pair unless `LESSON_UI_URL` is set, permits only an offline fixture session and saves ignored screenshots under `artifacts/lab17/`.

The live path requires a deliberate click, isolated server API key, single-agent base, environment and explicit opt-in. No paid provider run, upload or provisioning was performed during implementation.

## Limits

The host handlers are selected by the UI after a model turn; the agent does not invoke filesystem tools. Offline answers and stream events are authored. The host snapshot does not rewind the Managed conversation, API effects, cloud sandbox, usage or network effects. An unconfirmed remote session or cleanup needs separate reconciliation. Remote output inspection is limited to three small text files and does not prove that there are no other remote files.

Official references checked 2026-10-15: [Managed files](https://platform.claude.com/docs/en/managed-agents/files), [events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), and [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations).
