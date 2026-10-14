# Lab 10 checkpoint

Implementation target: closed host schema validation, bounded corrective reporting and explicit interrupt/abort/end semantics for retained Managed sessions.

## Verification record

Verified on 2026-10-14:

- `npm run typecheck` — also passed in the final production build
- `node --import tsx --test tests/lab10-structured-interrupt.test.ts` — 11 tests passed, including the final shutdown-during-creation safeguard
- `node --import tsx --test --test-concurrency=1 tests/*.test.ts` — 148 tests passed before the additional shutdown test; the final focused suite then passed all 11 tests
- `npm run test:lesson-guides` — 4 tests passed
- `npm run audit:lesson-guides` — IDs 1–10 passed
- `npm run build` — final implementation passed
- `node scripts/run-browser-tests.mjs browser-tests/lab10.spec.ts --reporter=list` — 2 tests passed; wrapper exited with code 0
- `node scripts/scan-distribution.mjs` — 909 files passed; `.env` contents were not read
- `git diff --check`

The browser exercises verified bounded correction/exhaustion and interrupt followed by a valid turn in the same session, then explicit Close with send disabled. The final focused HTTP test also disconnected a real report stream and confirmed host interruption and simulated archive. All 11 focused tests passed after that assertion was added.

## Evidence boundaries

- Reports are independently validated final JSON text. Schema conformance does not prove factual correctness.
- Offline scenarios are authored; usage is null. SDK transport tests inject local responses and do not contact Anthropic.
- No agent provisioning or billed live run is started by setup, tests or application startup.
- Interrupt acknowledgment alone is not idle confirmation. Unconfirmed stops block reuse, and pending cleanup remains separate from successful archive.
- Text-only single-agent overrides clear inherited tools, MCP servers, skills and orchestration. Dynamic workflows are outside this lesson.
- Exercise owner IDs isolate host run records and are not a general authentication system.

## Live startup fix — 2026-10-14

The agent-launched development server originally inherited restricted network access, causing a live metadata request to fail before any session was created. The server was restarted outside that restriction. `managed:verify` then confirmed read-only access to the configured agent and environment; no model run or session was started.

Live connection failures now return a safe HTTP 503 diagnostic; provider access/configuration failures return HTTP 422 with a sanitized message. The schema panel initializes from the shared contract instead of appearing blank while its API request is pending.

Validation: all 12 focused tests passed, including connection/access failure regressions, and both browser scenarios passed against the running development server. Provider verification remained read-only.
