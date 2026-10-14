# Lab 09 checkpoint

Implementation target: exact host composition of system instructions and authored project context in fresh text-only Managed sessions, with requested/resolved evidence and observed usage.

## Verification record

Verified on 2026-10-14:

- `npm run typecheck` (also included in the production build)
- `node --import tsx --test tests/lab09-system-prompts.test.ts` — 7 tests passed
- `node --import tsx --test --test-concurrency=1 tests/*.test.ts` — 138 tests passed
- `npm run test:lesson-guides` — 4 tests passed
- `npm run audit:lesson-guides` — IDs 1–9 passed
- `npm run build`
- `node scripts/run-browser-tests.mjs browser-tests/lab09.spec.ts --reporter=list` — 1 test passed; the wrapper completed with exit code 0
- `node scripts/scan-distribution.mjs` — 893 files passed; `.env` contents were not read
- `git diff --check`

The initial direct Playwright invocation stalled during Windows web-server teardown. The owned-process wrapper then ran the comparison successfully and exited cleanly.

## Evidence boundaries

- Offline answers are authored teaching examples; usage remains null.
- Live transport tests use the installed SDK with injected local responses. No billable Anthropic session or agent provisioning was started for verification.
- Live model-request spans report only their observed scope; no complete billed cost or quality ranking is inferred.
- The only project context is a reviewed host constant selected by an allowlisted ID. No implicit file loading or user-provided project text is promoted into system context.
- Mid-session `system.message` is disabled in this lesson's public API. Configured system overrides are composed before session creation.
