# Lab 26 — Session controls and supported updates

Managed sessions are controlled through documented operations. This exercise offers a closed host catalog: retrieve, history, send, interrupt, title/metadata update, idle tools/MCP replacement, budget change, archive, and fresh-model handoff. The offline session is authored fixture state and never contacts Anthropic.

## Prerequisites

Run `npm install` and `npm run dev`. The offline exercise requires no API key.

## Controls

1. Select **Open offline session**. Send a slow turn and inspect the running state.
2. Try replacing tools while running. The server rejects this update. Interrupt; confirm the session becomes idle before reusing it.
3. Replace the tools and MCP arrays. These are complete replacement values, so an omitted entry is removed.
4. Increase the budget without **Opt in to possible resume**; it is rejected. Check the opt-in and try again.
5. Change model through **New session with summary**. Compare the new session ID, resolved fixture model, parent ID and explicit summary.
6. Archive an idle session. A closed session rejects mutation; unknown and unowned IDs are not exposed.

## Evidence to inspect

Compare the owned fixture session ID, status, history, interruption state, update version, resolved model and parent/summary fields after each control. The server validates every operation against a closed Zod union.

## Supported API boundary

The pinned `SessionUpdateParams` permits `title`, a `metadata` patch, `budget`, and session-local `agent.tools` and `agent.mcp_servers`. Tool and MCP arrays replace their previous arrays. Agent updates require an idle session, and an open workflow run can still prevent the update. Model, system and skills cannot be changed in place. A model override belongs to a new session with an explicit context handoff. Dynamic workflow controls need another documented adapter and are disabled here. Budget increases may resume work, so the host requires an explicit opt-in.

The offline fixture models the control boundary; its replies and idle confirmations are not proof of a remote operation. In a live integration, closing the browser stream would not stop remote work. Send `user.interrupt` separately, then retrieve until confirmed idle. Serialize mutations to avoid racing an update against a turn. Archive only after work is stopped. A local request timeout and remote cleanup need separate deadlines.

The current `/api/c26/open` live branch returns 422 before creating a billed session. It does not expose arbitrary SDK method names over HTTP. The route catalog is `/api/c26/catalog`, `/api/c26/open`, `/api/c26/call`, `/api/c26/code`.

## Troubleshooting

If the backend is unavailable, start `npm run dev`. An idle-only update rejected with 409 needs an interrupt followed by confirmed idle. A 404 means the ID is unknown or belongs to another owner.

## Limitations

This lab's session is an authored fixture. It cannot confirm provider effects, billed usage, or workflow-run status. The live branch is deliberately unavailable.

## Challenge

Change model through a fresh session and inspect its resolved configuration. Explain which context was explicitly handed off.

## Run locally

```powershell
npm run dev
node --import tsx --test tests/lab26-query-control.test.ts
node scripts/lab26-browser-demonstration.mjs
```

Open the Lab 26 lesson. Inspect the source links and the [checkpoint](docs/lab26-checkpoint.md). For the student challenge, change model through a fresh session and inspect its resolved configuration.
