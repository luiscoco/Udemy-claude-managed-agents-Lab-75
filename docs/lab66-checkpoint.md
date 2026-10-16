# Lab 66 checkpoint: real-time WebSocket transport

Lab 66 attaches an authenticated same-origin `ws` endpoint to the existing Node HTTP server. The guided path uses real local WebSockets and a closed custom-tool fixture; it makes no Anthropic request. A short-lived local cookie authenticates the upgrade. Start, message, cancel and ack commands are schema checked. Host runs retain ordered frames in a bounded 64-frame ring, reject excessive payloads and connections, and detach slow consumers without turning transport loss into run cancellation.

Reconnecting repeats the same start command ID and replays frames after the caller's last sequence. A repeated message ID is acknowledged without running the agent again. Live mode reuses the Lab 01 Managed event consumer and cleanup port only after explicit user selection and existing setup readiness; no live test or billing was performed for this checkpoint.

Focused tests cover upgrade authorization, order, duplicate command, replay, cancellation, payload bound and shutdown. Browser tests and desktop/mobile demonstration exercise the real local socket. Run buffers are process-local and a run accepts one message; this is not a durable chat service.
