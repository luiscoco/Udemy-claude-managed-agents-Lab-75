# Lab 66: Real-time frontends over WebSocket

## Prerequisites

Run the local platform with `ws@8.22.0`. The guided path uses real local WebSocket connections and an authored fixture; it does not contact Anthropic. The **Start live Managed run** button is disabled unless the existing Managed setup is ready. A live message starts a billed session only after you explicitly select that mode and send it.

## Controls

**Start guided run** creates a retained host run without sending a message. **Send message** triggers one turn and streams ordered events. **Disconnect** closes only the socket; the run continues in Node. **Reconnect and replay** repeats the original start command with `afterSeq` and reattaches to the same run. **Duplicate command** repeats the message command ID and must not start a second turn. **Cancel** aborts the host run. A new turn requires a new run.

## Evidence to inspect

The browser first obtains a short-lived HttpOnly, SameSite local cookie from `GET /api/c66/code`; the HTTP server attaches a `/api/c66/ws` upgrade handler and checks same-origin, cookie and connection capacity. Client commands use closed Zod schemas for start, message, cancel and ack. Each emitted frame has a run ID, sequence, source and state. The host retains at most 64 frames, sends a gap marker if older frames have been evicted, and closes a slow consumer while retaining the run. The WebSocket payload is capped at 2 KiB.

The offline reply passes through a closed, Zod-derived `compose_fixture_reply` custom-tool input and a `user.custom_tool_result` correlated to its `sevt_` ID. It has no business effect; the host does not enable built-in tools, MCP or skills in this path. Live mode reuses the existing Managed session-event consumer and cleanup port. Credentials remain in Node; reconnection never calls the runner again.

## Troubleshooting

If the socket is rejected, reload the lesson to obtain a fresh local cookie and check that the browser and backend share an origin through the Vite proxy. A duplicate command is acknowledged but does not create another run. A transport disconnect is not cancellation; use **Cancel** for a run stop. A replay gap means the 64-frame host ring no longer contains earlier chunks.

## Limitations

Each run accepts one message. Guided frames are authored text delivered over a real socket, not a cloud agent stream. A live run, if explicitly enabled, uses a fresh Managed session for its one turn and follows the existing Lab 01 cleanup behavior. WebSocket ack records what the browser has seen; it is not proof of model completion. Runs and replay buffers are process-local and expire with server restart.

## Challenge

Disconnect before the terminal event, reconnect with the original start command and last sequence, then repeat the message command. Explain why the run ID and terminal outcome stay the same.

## Run locally

```powershell
node --import tsx --test tests/lab66-realtime-websocket.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab66-browser-demonstration.mjs
```
