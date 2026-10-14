# Lab 07 checkpoint

Implementation target: a host replacement for Agent SDK pre/post tool hooks using typed custom tools, policy decisions, input rewrite with revalidation, actual execution evidence and one correlated custom-tool result.

## Verification record

Verified on 2026-10-14:

- `npm run typecheck`
- `npm run test:offline` — 125 tests passed
- `npm run test:lesson-guides`
- `npm run audit:lesson-guides`
- `npm run build`
- `npx playwright test browser-tests/lab07.spec.ts` — 2 tests passed
- `node scripts/scan-distribution.mjs`
- `git diff --check`

## Evidence boundaries

- Policy and audit phases are host application code, not Managed Agents hook events.
- Denied calls never execute; failed calls were allowed but did not complete successfully.
- A post-execution audit cannot roll back an effect.
- Offline fixture output is authored and makes no claim about Claude behavior.

