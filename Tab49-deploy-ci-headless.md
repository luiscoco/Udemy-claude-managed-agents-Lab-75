# Lab 49: Headless host and CI outcomes

## Prerequisites

The offline exercise and `ci-kit/runner.mjs` need no TTY, key or provider account. A live CI run is a separate explicit operation requiring both `CI_MANAGED_LIVE_OPT_IN=true` and `MANAGED_LIVE_ENABLED=true`, plus server-side credentials and agent/environment references.

## Controls

Run pass, validation failure, limit reached, execution error, SIGTERM-shaped cancellation, concurrency rejection or unconfirmed remote stop. The UI calls only authored offline fixtures. The `GET /api/c49/files` route shows the runner, worker, Dockerfile and sample workflow. `POST /api/c49/deploy` is a fixture route, not deployment.

## Evidence to inspect

Each result has a machine outcome, CI exit code, closed report or null, session identity, host limits, interruption and cleanup state. A valid report alone does not pass CI: the live worker also requires turn completion and archive. The runner spawns a worker without a TTY, bounds output and runtime, forwards SIGTERM and emits one JSON verdict. The reused Managed adapter creates a budgeted session with explicit agent/environment IDs, rejects configured tools and MCP servers before sending, limits the work to one text message, and attempts remote cleanup. Pending or unconfirmed remote stop must fail CI.

## Troubleshooting

Use `node ci-kit/runner.mjs scripted pass` for a zero-provider-call check. A nonzero exit is expected for failure scenarios. The sample workflow is stored outside `.github/workflows` so it does not run automatically. A live setup problem should be resolved by a human before opting in; CI must not provision resources or retry an uncertain mutation blindly.

## Limitations

The authored Dockerfile and workflow are not a deployed service. Offline IDs, reports and outcomes are fixtures, not observed Managed usage. Live CI, provisioning, public hosting and resource mutation require explicit opt-in. No Claude Code `dontAsk` mode or local session-persistence flags are used.

## Challenge

Explain which outcomes fail CI and what remote idle/cleanup evidence is needed after SIGTERM.

## Run locally

```powershell
node ci-kit/runner.mjs scripted pass
node --import tsx --test tests/lab49-headless.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab49-browser-demonstration.mjs
```
