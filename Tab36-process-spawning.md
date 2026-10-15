# Lab 36: Remote transport and host runners

## Prerequisites

Run the local development server. The exercise uses a loopback HTTP emulator and a fixed authored host worker; no Claude binary or Anthropic key is needed.

## Controls

Choose success, connection failure, early stream close, handler worker failure or cancel pending cleanup, then select **Run transport experiment**. The result shows host request, remote lifecycle, event count, worker exit, local abort and cleanup state.

## Exercise

The host sends a session-create request to a loopback Managed-port emulator, then consumes bounded canonical event lines. An injected port boundary keeps the exercise separate from provider calls. The success fixture receives three events and archives the simulated session. An early stream close is incomplete. A connection failure creates no session.

The handler failure starts a fixed child process that speaks JSON over stdin/stdout; its private stderr is redacted. A local abort closes the browser-side stream, asks for interruption and reports cleanup pending when the emulator cannot confirm idle. Killing a host worker cannot prove the remote session stopped.

## Evidence to inspect

Compare `hostRequest`, lifecycle events, queue peak, worker exit count, `remoteStopConfirmed` and cleanup. Read `server/lib/lab36-transport.ts` for the port interface, loopback protocol and bounded event consumer. The worker file is `mcp-servers/lab36-worker.mjs`.

## Troubleshooting

If the loopback connection fails, start a new run. An incomplete stream is not a completed turn. Pending cleanup must be reconciled with the remote session in a live application.

## Limitations

The loopback emulator is not a production remote sandbox. This exercise makes zero Anthropic calls. Live transport requires a configured Managed agent and explicit opt-in. No `spawnClaudeCodeProcess`, toolAlias or local Claude binary is required.

## Challenge

Identify which work runs on the host and which belongs to the remote session.

## Run locally

```powershell
node --import tsx --test tests/lab36-process-spawning.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab36-browser-demonstration.mjs
```
