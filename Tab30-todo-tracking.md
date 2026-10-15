# Lab 30 — Host task board and completion gates

The host board owns task IDs, versions, dependencies and completion evidence. The offline fixture replays typed custom-tool calls; no Anthropic session is created.

## Prerequisites

Run `npm install` and `npm run dev`. The offline board needs no API key.

## Controls

Start a three-step board or one of the blocked-review, refused-completion, validated-completion and invalid-plan-replacement fixtures. The buttons call `update_task` with the selected task version and checked evidence. Replay the last event ID to test idempotency.

## Evidence to inspect

Compare the agent claim with host task rows and each correlated result. `create_task`, `update_task`, `list_tasks` and `get_task` have strict input schemas. A duplicate event ID returns the recorded result and applies no second effect. A conflicting payload for the same ID is rejected. Completion checks dependencies, expected version and an exact host evidence marker before changing status.

## Troubleshooting

Review needs draft completed first. Publish needs review completed first. The host rejects missing or wrong evidence and conflicting versions. A whole-plan replacement is an explicit host operation, not an agent tool, and cannot refer to a future task or erase completed work.

## Limitations

The fixture is authored and reports no provider calls. It does not prove a live custom-tool result was accepted by Managed Agents. TodoWrite and Claude Code TaskCreate/TaskUpdated labels are historical only. Live execution needs a dedicated pinned Managed agent and a separate result-sending adapter.

## Challenge

Try a plan change and locate the deterministic accepting or refusing gate.

```powershell
node --import tsx --test tests/lab30-todo-tracking.test.ts
node scripts/lab30-browser-demonstration.mjs
```

Routes: `POST /api/c30/run`, `POST /api/c30/tools` and `GET /api/c30/code`. See the [checkpoint](docs/lab30-checkpoint.md).
