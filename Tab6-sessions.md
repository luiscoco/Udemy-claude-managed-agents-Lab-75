# Lab 06: Sessions and retained context

Continue a conversation in one Managed Agents session, compare it with a fresh session, and reconnect without duplicating persisted events.

## Prerequisites

- Complete Labs 01–05.
- Run Node.js 24 or newer and `npm.cmd install`.
- Offline mode needs no API key and never contacts Anthropic.
- Live mode requires the Managed setup described in `docs/managed-setup.md`.

## Controls

- **New offline** creates a fixture session and a server-owned conversation UUID.
- **Continue** reuses that conversation's `sesn_` ID. The server opens the stream before sending `user.message`.
- **Reconnect** opens the stream first, hydrates paginated history, and ignores already-seen persisted event IDs.
- **Inspect server index** reads the owner-bound conversation record.
- **Close and archive** archives only after the provider reports the session idle.
- The EOF and Hang fixtures demonstrate incomplete streams and local cancellation.

## Evidence to inspect

The page shows three distinct identifiers: the local conversation UUID, the Managed `sesn_` session ID, and a new local turn UUID for each request. The sent `user.message` also has its returned `sevt_` event ID.

Run the introduction, select the follow-up, and Continue. The session ID stays fixed and the fixture recalls “Aurora Finch.” Start a new session with only the follow-up and it has no retained name. This proves the stateful fixture behaves correctly; it does not measure Claude.

Reconnect reports that the event stream was established before history was read. Persisted IDs already in the host index increment the duplicate count and never create duplicate history rows.

## Troubleshooting

- **Unknown conversation**: use the UUID returned by New, not the `sesn_` ID.
- **Foreign owner**: the server binds each conversation to the authenticated principal or exercise owner header.
- **Archived or expired**: start a new conversation. Closed sessions are never reused.
- **Stream EOF**: the turn is incomplete even if an agent message was observed.
- **Cancel**: a local abort triggers a bounded interrupt attempt. It does not by itself prove remote interruption.

## Limitations

The offline fixture uses authored responses and an in-memory index. It makes no claims about model recall quality, token use, latency, or cost. The demo owner header stands in for application authentication; production systems must bind the index to their verified principal. Idle sessions expire after the host TTL and shutdown cleanup is bounded.

## Challenge

Ask a follow-up that depends on the first answer and inspect the session ID. Explain why the stable `sesn_` ID establishes reuse, while the answer text alone does not.

