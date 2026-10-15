# Lab 20 checkpoint: Lifecycle events and host interceptors

Implemented the workbook's lifecycle/interceptor lesson in the cumulative Managed Agents platform. Its independent private destination is [Udemy-claude-managed-agents-Lab-20](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-20).

## Implemented

- Registered lesson 20 with React exercise, Express router, guide, source inspection, README build steps and repository index. Labs 01–19 remain available.
- Reused the existing Lab 07 injected custom-tool port and shared event/tool-session runner. Added a closed provider-event projection and separate typed host-audit union, each carrying run/session/thread/event correlation when observed. Custom-tool request/result events, lifecycle, model spans, messages and thread events are mapped without inventing absent events.
- Added guarded fixture-file experiments for passing policy, pre-execution denial, handler failure, preflight interceptor exception, virtual-time deadline and final application-report validation failure. Interceptor failure and audit-sink preflight failure both stop before a port or handler exists. The final check parses a closed JSON report schema; no automatic corrective loop starts.
- Distinguished provider, tool, instrumentation, deadline and final-validation outcomes. File reads and explicit reset are owner-scoped; requests, outputs, deadlines, budget, concurrent runs and retained fixtures are bounded. Live mode is deliberate and limited to the supported passing/denied custom-tool paths.

## Verification

- Full sequential offline regression: **243 passed, 0 failed**. Six focused Lab 20 tests cover closed contracts, actual file effects, failure provenance, fixture-only virtual time, provider event projection, audit fail-closed behavior and HTTP ownership/reset.
- Browser: **10 passed, 0 failed** (two Lab 20 and eight shared shell/navigation checks). The offline browser demonstration passed at 390 and 1440 pixels, screenshots were visually reviewed, and no horizontal overflow was detected.
- Typecheck, production build, guide/source audit for IDs 1–20 and four guide tests passed.
- Distribution scan passed for 1389 files without reading `.env` contents. No paid provider call, upload or provisioning was made during implementation. Generated screenshots are ignored under `artifacts/lab20/`.

## Reproduce

Use the PowerShell commands in [README](../README.md) and the [Lab 20 guide](../Tab20-hooks-in-depth.md). `node scripts/lab20-browser-demonstration.mjs` starts its own local UI/API pair unless `LESSON_UI_URL` is set, rejects live run requests and captures ignored phone/desktop screenshots.

## Limits

Offline frames and virtual ticks are authored, not provider measurements. The single-thread fixture emits no model spans or child-thread events; their absence is recorded as coverage rather than synthesized events. The live adapter relies on a separately configured Lab 07 custom-tool agent. A completed provider turn may still fail the application's closed report schema. Post-execution observations cannot prevent a prior effect. Local cancellation does not prove remote stop; inspect cleanup before retrying.

Official references checked 2026-10-15: [session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [event type reference](https://platform.claude.com/docs/en/managed-agents/reference), [permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies), [session threads](https://platform.claude.com/docs/en/managed-agents/session-threads).
