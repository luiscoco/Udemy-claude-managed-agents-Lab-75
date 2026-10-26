# Lab 12: Multiple messages in one session

Use a bounded host queue to drive several turns in one Managed Agents session. A host command ID identifies admission; the returned `user.message` event ID identifies provider acceptance. A completed turn requires matching stream evidence and confirmed idle before the next command is submitted.

## Prerequisites

Run the application with `npm run dev` and use the actual Vite URL printed in the terminal. Offline authored fixtures require no credentials, provisioning or Anthropic requests. Live mode requires the isolated server API key, single-agent base, environment and explicit live opt-in from `docs/managed-setup.md`. Setup checks do not contact Anthropic. No live run starts on navigation.

## Controls

- Create offline session opens one authored session and one event stream, without submitting a prompt. Run live deliberately creates a billed Managed session.
- Message accepts up to 1000 trimmed characters. Queue message creates one local command ID. While busy, follow-ups are admitted to the waiting queue.
- Queue two-message script atomically admits a short host-authored script. It is not a provider batch or `SDKUserMessage` async generator.
- Offline scenarios are Normal, Slow, Hang, Error, Duplicate events, Stream ended and Interrupt unconfirmed. Live sends use Normal only; authored scenarios do not predict Claude behavior.
- Attach authored 1 × 1 PNG demonstrates the installed image content block. The server accepts only bounded base64 PNG framing, 4096 decoded bytes maximum and dimensions up to 256 × 256. URL/file images and other media are outside this exercise. Framing validation does not guarantee a decoder will accept every image.
- Close queue and clean up cancels waiting work, aborts local processing, attempts remote interruption when needed, confirms idle and archives. Pending cleanup stays explicit and can be retried. Inspect run state reads the local host checkpoint.
- Idle configuration exposes no-tools or read-only tools with MCP servers cleared, explicit `system.message` context, and a new model/effort session with an explicit user-context handoff. The old session is archived before handoff submission; this is not automatic context migration.

## Evidence to inspect

Each command shows admitted, submitting, accepted and completed/failed/cancelled states, timestamps, the returned user event ID, authoritative agent event IDs and output. Session state is separate from command state. Full queue and event evidence retains the last 100 persisted event identities; it does not expose credentials or image data. Output retention is capped at 16000 characters per command and 64000 JSON-encoded UTF-8 bytes across the session, with an explicit truncation label.

The queue admits at most three pending commands: one active and two waiting. It retains at most 20 command checkpoints. Exact command-ID replays return the existing command without another effect; conflicting input under the same ID is rejected. The whole script is validated and reserved before any effect. There is no automatic provider retry after uncertain submission.

One provider event stream remains open for the session. The host observes the exact returned user event before attributing agent messages and lifecycle to that command. A shared event consumer deduplicates authoritative events and classifies end_turn, refusal, budget pauses and incomplete streams. It does not assume every user message in a general Managed session has its own terminal event; this lab serializes sends to establish its accounting boundary. Initial/stale idle events cannot complete a new command before its user event is observed.

Server processing has a per-command deadline. EOF, failures, unexpected idle reasons or uncertain acceptance stop further sends and request cleanup. Disconnecting the browser evidence stream also closes the queue. Ownership headers, local origin validation, strict Zod bodies, session capacity and idle expiry bound the retained resources. Interruption acknowledgment alone is not proof of a stopped session.

The installed SDK supports updates to an idle session's `agent.tools` and `agent.mcp_servers`. This lesson deliberately restricts those updates to cleared MCP and read-only/no tools; arbitrary remote MCP endpoints belong to Lab 13. Model and effort overrides are creation parameters, not session setters. Explicit system context uses the installed `system.message` type; live model support may reject it.

| Route | Host operation |
| --- | --- |
| POST /api/c12/session | Create one session and open one provider stream |
| POST /api/c12/send | Admit one idempotent local command |
| POST /api/c12/script | Atomically admit up to three commands |
| POST /api/c12/events | Subscribe to host snapshots through shared SSE |
| GET /api/c12/state | Inspect an owned queue |
| POST /api/c12/tools | Apply the restricted idle tools/MCP update |
| POST /api/c12/context | Append explicit idle system context |
| POST /api/c12/new-model-session | Create a new session and submit explicit handoff context |
| POST /api/c12/end | Cancel queued work and request verified cleanup |

The provider interfaces were checked against installed `@anthropic-ai/sdk` 1.3.0 and the official [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations) and [event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming) documentation. There is no assumed `setModel`, `setPermissionMode`, priority-now or `getContextUsage` method.

## Troubleshooting

- 400: malformed command ID, oversized text/image, unsupported fields or limits exceeding server policy. No command is admitted.
- 403: wrong exercise owner or application origin. Use the local application through its Vite proxy.
- 409: closed queue, conflicting command replay, competing browser subscriber or non-idle update.
- 429: pending-command/history/session capacity. Close an existing session or wait for its active turn.
- Stream failure: inspect the checkpoint and cleanup state. Do not assume an uncertain submission was never delivered. No automatic retry is made.
- Cleanup pending: retry Close or inspect the session in Claude Console. Local cancellation does not prove remote termination.

## Limitations

Offline responses and lifecycle events are authored demonstrations, not provider measurements. Live execution, supported model availability, image decoding and system-context acceptance are not verified by offline tests. This queue is in-memory and local to one server process; it is not a durable job service or multi-tab client. Provider stream reconnection and historical replay are deliberately not implemented; stream failure triggers cleanup. The evidence list is bounded, and complete billing/context usage is not inferred from message lengths.

## Challenge

Choose Slow and queue a follow-up while busy. Identify the two admission timestamps, then show that the second provider send happened only after the first completed idle turn. Repeat with Hang, queue waiting work, close the queue and verify the waiting command has no provider user event ID.

## TypeScript source

Use the TypeScript source tab to inspect the actual shared schemas, queue, injected provider/fixture port, Express router and React exercise.
