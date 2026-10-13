# Lab 01: Session event streaming

This lab sends one prompt to a Managed Agents session and reads everything the session streams back. The local lesson operation is called "query" and it is served by `POST /api/c1/query`. The word is only a local name: on the provider side one query is one session turn.

The point of the lab is a distinction the rest of the course relies on. Agent response text, session lifecycle events and turn completion are different things, carried by different events.

## Prerequisites

- Node 24 and the dependencies installed (`npm.cmd ci`).
- For offline mode: nothing else. No key, no network, no charges.
- For live mode: a server-side `ANTHROPIC_API_KEY`, `CLAUDE_MANAGED_AGENT_ID`, `CLAUDE_MANAGED_ENVIRONMENT_ID` and `MANAGED_LIVE_ENABLED=true`, as described in `docs/managed-setup.md`. The agent must have no tools and no MCP servers; the lab refuses to send the prompt otherwise.

## Controls

| Control | What it does |
| --- | --- |
| Prompt | The text sent in one `user.message`. Empty prompts are rejected before any provider call. |
| Offline scenario | Picks an authored fixture. Fixtures are shaped like provider events but are not measurements of Claude. |
| Run offline fixture | Streams the fixture through the same consumer that live mode uses. |
| Run live | Creates a new billed session using the configured agent and environment, with the configured budget cap. |
| Cancel query | Aborts the browser request. The server then tries `user.interrupt` for this request's session. |

The four result panels are deliberately separate:

1. **Session metadata** comes from the session creation response. There is no SDK-style "init" event in a Managed Agents stream, and the lab does not invent one.
2. **Agent text** shows previews while they stream and the authoritative `agent.message` once it arrives.
3. **Lifecycle and span events** show `session.status_*`, `session.error` and `span.model_request_*` events, plus ignored duplicates.
4. **Turn outcome** is derived from `session.status_idle.stop_reason` or `session.error`.

## How the stream is read

The order of operations matters and is the same in both modes.

```ts
const session = await port.create();
const events = await port.open(session.id, upstream.signal);
await port.send(session.id, prompt, local.signal);
for await (const event of events) consumer.push(event);
```

The stream is established before the `user.message` is sent, because a stream only delivers events emitted after it opens. In live mode the stream is opened with `event_deltas` set to `agent.message`, which adds `event_start` and `event_delta` preview events. Those previews are best effort and never appear in event history.

Previews are accumulated by event ID and content-block index. When the authoritative `agent.message` with the same ID arrives, it replaces the preview. The two are never concatenated, so the text appears once. A preview that never receives its message is shown as incomplete.

Persisted events carry an `id` and are deduplicated by it. Deltas carry no ID of their own, so two identical deltas for one preview are both applied.

## Outcomes

| Outcome | Derived from |
| --- | --- |
| completed | `session.status_idle` with `stop_reason` `end_turn`, and no local cancellation or deadline |
| paused | `session.status_idle` with `requires_action` or `budget_reached` |
| error | a terminal `session.error`, `retries_exhausted`, `refusal` or `session.status_terminated` |
| incomplete | the stream ended without any of the above |
| cancelled | you cancelled locally before completion was confirmed |
| deadline | the local deadline expired before completion was confirmed |

An unexpected end of stream is never reported as success, and the lab never adds a synthetic provider "result" message. Text is not appended again when the turn finishes.

## Evidence to inspect

- `server/lib/session-events.ts`: the single consumer for offline and live events.
- `server/lib/lab01-run.ts`: ordering, deadline, cancellation and cleanup.
- `server/lib/lab01-port.ts`: the live SDK calls and the offline fixture port.
- `server/lib/lab01-fixtures.ts`: the authored event sequences.
- `shared/lab01-events.ts`: request, frame and result contracts.
- The Raw events panel in the exercise, which shows each event as received.

## Troubleshooting

- **Run live is disabled or setup is unavailable:** open the setup instructions, set the server variables and restart the backend.
- **"The configured agent has tools":** Lab 01 needs a text-only agent. Use a separate agent for tool lessons.
- **429 capacity:** the lab allows `MANAGED_MAX_CONCURRENT` active queries. Wait for one to finish.
- **Stream ended without a result:** the backend was stopped or the proxy failed. Start the API server and retry manually; the POST is never resubmitted automatically.
- **Interruption unconfirmed:** the session could not be seen idle within the cleanup window. Check the session ID in Claude Console.

## Limitations

- Aborting the local connection does not stop remote execution by itself. The lab sends a separate, bounded `user.interrupt` and reports whether it could confirm the session stopped.
- When you cancel, the browser connection is closed, so the final server-side interruption result cannot be shown in the page. The server tests assert it.
- Previews are best effort. A stream may end a preview early or skip deltas entirely.
- The session budget is a list-cost cap checked between model requests, so a final request can exceed it. List cost is not necessarily billed cost.
- Offline fixtures show event shapes and ordering only. They say nothing about model behavior.
- Real streams do not all have the same event order. The fixtures assert their own order, not a universal one.

## Challenge

Ask for three bullet points. Identify the authoritative `agent.message` containing them and the lifecycle event confirming that the turn finished.

Hint: the message is the entry marked authoritative in the Agent text panel, and the confirming event is a `session.status_idle` entry in the lifecycle list whose stop reason is `end_turn`.
