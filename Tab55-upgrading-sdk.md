# Lab 55: Official SDK and API upgrades

## Prerequisites

The teaching app keeps `@anthropic-ai/sdk` locked at 1.3.0 in `package.json` and the lockfile. This lesson reads the installed baseline manifest and uses authored candidate manifests for an offline rehearsal. It does not run npm install, provision a resource or contact Anthropic.

## Controls

Analyze each candidate fixture to inspect server-computed checks. A client-supplied `eligible: true` is intentionally ignored. The compatible fixture can enter an **authored canary**, then a simulated promotion and rollback. Removed event types, changed stream order, permission drift, missing usage, quality regression and missing evidence each block advancement at a different check.

## Evidence to inspect

The baseline records npm 1.3.0, the Managed beta header, required session and send-event unions, open-before-send ordering, pinned and restricted configuration, host-owned permissions, usage handling, eval results and separately named agent/environment/skill pins. Candidate npm version stays unknown because no candidate package is installed. API compatibility is reported independently of npm identity. A missing event type or changed stream sequence is incompatible; absent evidence remains unknown rather than passing.

The state machine advances only from candidate to authored canary to simulated promotion. It checks every gate on the server and records an explicit rollback. Canary evidence is an authored fixture, not an observed release trial. Rollback affects the hypothetical host version only; already-created remote sessions and their effects would still require reconciliation.

## Troubleshooting

If **Rehearse canary** is disabled, inspect the blocked check in the result. Promotion requires the compatible candidate and the preceding canary state; an arbitrary client eligibility flag cannot skip it. Missing usage and missing evidence are not equivalent to zero usage or success. No fixture result states that a real candidate SDK was installed or that a production release passed.

## Limitations

The candidate comparisons are deterministic offline fixtures. They do not verify a real new npm release, provider API availability or model quality. The pinned versions shown are fictional rehearsal labels, not actual provisioned resources. No automatic dependency upgrade, deployment, provider request or remote rollback occurs.

## Challenge

Remove `user.custom_tool_result` from a candidate event manifest. Identify the failed union check, decide whether the API contract is compatible, and explain why a larger npm version number would not permit promotion.

## Run locally

```powershell
node --import tsx --test tests/lab55-upgrading-sdk.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab55-browser-demonstration.mjs
```

SDK migration note (26 October 2026): the original preparation narration mentions the earlier 0.133.0 baseline. Follow the current installed 1.3.0 facts and migration instructions in `docs/sdk-upgrade.md` for this checkpoint; the recording is preserved as historical wording.
