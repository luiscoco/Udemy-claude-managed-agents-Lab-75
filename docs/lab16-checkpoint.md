# Lab 16 checkpoint: Environment and configuration provenance

Implemented the workbook's environment lesson in the cumulative Managed Agents platform. Its independent private destination is [Udemy-claude-managed-agents-Lab-16](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-16).

## Implemented

- Registered lesson 16 with its React exercise, Express route, guide, source inspection and README build steps. Labs 01-15 remain available.
- Added synthetic course, user and session host layers with explicitly application-defined precedence. The report shows winning host source beside the separate remote value; a host variable is never treated as automatically injected into the sandbox.
- Added a server allowlist for one fictional file resource. Readiness shows credential and environment **names** with redacted presence only. Offline missing-credential, missing-mount and restricted-path scenarios do not inspect personal configuration or open files.
- Added a deliberately selected live port using SDK 0.133.0 environment, agent, session and resource types. It retrieves an active cloud environment, checks the restricted network and empty package policy, pins a single-agent version, creates one budgeted text-only session with the approved file ID, and verifies the listed mount path before sending. Shared SSE, event consumption, cancellation and cleanup handle the turn.
- Added phone-friendly provenance cards, deterministic tests and an offline browser demonstration at 390 and 1440 pixels.

## Verification

- Full sequential offline regression: **220 passed, 0 failed**. Six focused Lab 16 tests cover host precedence, distinct failure scenarios, path guards, redacted manifest, SDK creation/resource verification, restricted-environment rejection, strict routes and no provider effects from offline setup.
- Browser: **11 passed, 0 failed** (three Lab 16 flows and eight shared shell/navigation checks), including phone width and live readiness without starting a billed session.
- Typecheck and production build passed. Guide/source audit passed for IDs 1-16; four guide/source/rendering tests passed.
- Distribution scan passed for 1319 files without reading `.env` contents. Generated screenshots, logs and publication helpers are excluded from Git and npm packaging.
- The offline browser demonstration passed at 390 and 1440 pixels. Screenshots under ignored `artifacts/lab16/` were reviewed; the provenance table was changed to cards after the first phone inspection.

## Reproduce

Use the PowerShell commands in [README](../README.md) and the [Lab 16 guide](../Tab16-settings-env.md). With the local app running, `node scripts/lab16-browser-demonstration.mjs` visits `http://127.0.0.1:5174/?lesson=16`, permits only offline runs, and saves ignored screenshots under `artifacts/lab16/`.

Live setup requires the isolated server API key, single-agent base, approved restricted cloud environment, explicit live opt-in and a separately uploaded fictional file ID in server-only `CLAUDE_MANAGED_LAB16_FILE_ID`. Only clicking Run live creates a billed session.

## Limits

No paid provider run, upload or provisioning was performed. Offline host layers, credentials, mounts and answers are authored. Live resource listing verifies mount metadata, not file-content reading; this text-only lesson has no file-read tool. Environment networking metadata is configuration evidence, not an actual egress test. Unknown remote creation without a returned ID requires manual Console reconciliation; local abort does not prove a remote stop.

Official references checked 2026-10-14: [Managed environments API](https://platform.claude.com/docs/en/api/typescript/beta/environments/create), [adding files](https://platform.claude.com/docs/en/managed-agents/files), and [secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment).
