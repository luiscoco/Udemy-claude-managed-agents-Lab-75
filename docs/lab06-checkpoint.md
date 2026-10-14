# Lab 06 checkpoint

Implementation target: retained Managed sessions with host ownership, context comparison, reconnect hydration, deduplication and explicit close.

## Verification record

Verified on 2026-10-14 with Node.js 24 and the pinned `@anthropic-ai/sdk` 0.133.0:

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab06-sessions.test.ts
npm.cmd run test:offline
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/run-browser-tests.mjs browser-tests/lab06.spec.ts
```

Every command passed. The focused suite contains five tests, including a real
HTTP/SSE router exercise. The focused Chrome run contains two passing tests.

## Evidence boundaries

- Offline recall is authored fixture behavior, not a Claude quality claim.
- A local stream abort is not proof of remote interruption.
- The exercise owner header represents an authenticated principal boundary used by a production host.
- Sessions remain open between turns and archive only after an explicit close or bounded expiry/shutdown cleanup.

