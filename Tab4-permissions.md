# Lab 04: Permissions

A person approves or denies tool calls before they run. In the Agent SDK that is the `canUseTool` callback. Managed Agents has no callback: a tool with the `always_ask` policy **pauses** the session, the host shows the paused call to a reviewer, and the host answers **once** with `user.tool_confirmation`.

1. The agent emits `agent.tool_use` with `evaluated_permission: "ask"`.
2. The session goes idle with `session.status_idle` and `stop_reason.type: "requires_action"`, listing the waiting event IDs.
3. The host sends `user.tool_confirmation` with `tool_use_id` set to that `sevt_…` event ID and `result` `allow` or `deny`. A deny carries a `deny_message`, which the agent receives as an error tool result. The session then keeps running.

## Prerequisites

Use Node 24 or newer and the installed Anthropic TypeScript SDK 1.3.0. Lab 03 should already work, because this lab reuses its sandbox, path guards and fixture simulator. Offline mode needs no credentials, provisioning or account access. Run from this workspace in PowerShell:

```powershell
npm run dev
```

Open http://127.0.0.1:5174/?lesson=4 and select **Run the exercise**. If your NVM installation blocks npm, run the entrypoints directly:

```powershell
node scripts/dev-server.mjs
# In a second PowerShell window:
node node_modules/vite/bin/vite.js
```

Live runs are optional and billed. They upload two small Markdown files, create one session and need `MANAGED_LIVE_ENABLED=true`. See docs/managed-setup.md. The server never updates the shared agent.

## Concept mapping

| Agent SDK term | Managed Agents equivalent |
| --- | --- |
| `canUseTool(toolName, input)` | Host handler for a `requires_action` pause; it reads the matching `agent.tool_use` (`name`, `input`, `evaluated_permission: "ask"`) |
| `{ behavior: "allow" }` | `user.tool_confirmation` with `result: "allow"` |
| `{ behavior: "deny", message }` | `user.tool_confirmation` with `result: "deny"` and `deny_message`; the agent receives it as an error tool result |
| `updatedInput` | No equivalent. A confirmation cannot change the input. The host can only allow the call as requested, or deny it with a `deny_message` that suggests a correction. |
| Preallowed tools (`allowedTools`) | Tools with `always_allow` never pause, so they never reach the reviewer. `auto` calls the server allows or denies don't reach it either. |
| Tool use ID | The `sevt_…` ID of the `agent.tool_use` event, not a `toolu_…` ID |

Requests that contain `canUseTool`, `allowedTools`, `permissionMode`, `updatedInput` or `behavior` get HTTP 400, and the message names each field. Nothing is forwarded or translated.

The session toolset is built with the Lab 03 builder and sent through `agent_with_overrides`:
- `read` and `glob` are enabled with `always_allow`.
- `write` and `edit` are enabled with `always_ask`.
- `bash`, `grep`, `web_fetch` and `web_search` are disabled.

**Preallowed tools never call the review handler.** The `read` of the notes file runs without any review. A missing review is therefore not proof that a call was reviewed: it can also mean the call was never asked about.

## Controls

- **Prompt** defaults to instructions that use only container paths. Offline fixtures follow an authored plan and ignore your wording.
- **Approval window (seconds)** is 5 to 120 (default 30). When it runs out, the host denies the call with `Approval expired; the reviewer did not answer.`. Expiry is a host decision, not a provider timeout.
- **Local deadline (seconds)** is 1 to 120 and cannot exceed MANAGED_DEADLINE_MS. Review time counts against it.
- **Live session budget (US cents)** is 1 to 500.
- **Offline scenario**:
  - **Review** reads the notes (preallowed), then asks for four calls in turn: a `write` that copies the draft into `/mnt/session/outputs/draft.md`, two `edit`s of that copy, and a `write` to a second file `summary.md`.
  - **Preallowed only** reads and globs; nothing is ever reviewed.
- **Review dialog** opens for each paused call. It shows the tool, the redacted input, the resolved container path and the host guard's verdict, with a countdown. **Allow** and **Deny** send `POST /api/c4/decide`. The deny message you type is what the agent receives. Focus moves into the dialog and stays there with Tab, and it returns to where it was once no review is open.
- **Decision tester** sends the last applied decision again, or sends it with a wrong token, so you can see the 409 and 404 answers.

## Experiment

1. Run **Review**. Allow the copy (`write`) and the first `edit`. Deny the second `edit` with your own message. Try **Allow** on `summary.md`: the host refuses with 422 because only `draft.md` may change, so deny it. On disk, `outputs/draft.md` reads `Status: reviewed` but still says `Reviewer notes are in notes.md.`, and `summary.md` does not exist.
2. Set the approval window to 5 seconds and leave a review open. It expires, the decision log shows `expiry`, the agent gets the expiry message, and the file is unchanged.
3. Run again and press **Cancel query** while a review is open. Every waiter is released, no confirmation is sent for it (the log shows `abandoned`, confirmation sent `no`), and the server attempts `user.interrupt`.
4. After any decision, use **Replay last decision** (409: a decision applies once) and **Send with a wrong token** (404: decisions are bound to their run).
5. Run **Preallowed only** and confirm that no review appears even though two tools ran.

## Route inventory

| Route | Purpose |
| --- | --- |
| `POST /api/c4/query` | SSE. Body `{ mode, prompt, deadlineSeconds, approvalSeconds, budgetCents?, scenario? }`. The first frame is `run` with `runId` and a one-time `decisionToken`; `review`, `decision` and `expired` frames follow the tool events. |
| `POST /api/c4/decide` | Body `{ runId, toolUseId, decisionToken, decision, denyMessage? }`, strict, 1 KB maximum. Answers 200, 400, 404, 409 or 422. |

## Evidence to inspect

server/lib/lab04-approvals.ts holds the pending-approval map, keyed by run and tool-use ID. Each run gets a random `runId` and `decisionToken`, sent only in that run's first SSE frame, and tokens are compared in constant time. An entry is **removed before its waiter resolves**, so of two concurrent decisions exactly one wins and exactly one confirmation is sent. Expiry, replays and abandoned entries leave a record so late decisions answer 409 instead of 404. Expiry timers are injected, so the tests control time exactly.

server/lib/lab04-run.ts turns each pause into a review and logs every outcome (reviewer, expiry, host limit or cancellation), with its latency and whether a confirmation was sent. server/lib/tool-session-run.ts is the stream runner shared with Lab 03; only its `answer` hook differs. server/concepts/04-permissions.ts validates both routes and runs every **allow** through `hostAllowCheck` from server/lib/lab03-sandbox.ts. If the input fails, no allow is sent and the entry stays pending for a deny.

| Status | Meaning |
| --- | --- |
| 200 | The decision was applied; one confirmation will be sent. |
| 400 | Invalid body, or an Agent SDK field such as `updatedInput`. |
| 404 | Unknown run, unknown tool use, or another run's token. |
| 409 | Already decided, expired or abandoned. A decision applies only once. |
| 422 | Host validation blocked an allow; the reviewer can still deny. |
| 429 | Two queries are already running. |

## Troubleshooting

If the dialog says "allow will be refused", the host guard already knows the path is outside the writable fixture; deny the call instead. If **Allow** returns 409, the window expired while you were deciding. If a run stays in review until the deadline, the deadline wins: the outcome is `deadline`, pending approvals are abandoned and `user.interrupt` is attempted. Remote interruption is confirmed only when the session was then seen idle or terminated; otherwise check the session in Claude Console. A full review queue (8 per run) denies further calls without review and logs `host-limit`.

## Limitations

The offline agent follows a fixed plan. After a deny it emits an **authored** acknowledgement and moves on; it never tries another approach. A live agent may rephrase, choose another tool or stop, so its reaction to a `deny_message` cannot be predicted from these fixtures. Only `always_ask` calls (and `auto` calls the server cannot decide) pause; this lab does not use `auto`. Only files under `/mnt/session/outputs/` come back from a live session.

## Verification

Run in PowerShell:

```powershell
npm run typecheck
node --import tsx --test tests/lab04-permissions.test.ts
npm run test:offline
npm run test:lesson-guides
npm run audit:lesson-guides
npm run build
node scripts/run-browser-tests.mjs lab04.spec.ts
```

With an NVM npm-wrapper restriction, use `node node_modules/typescript/bin/tsc --noEmit`, `node --import tsx --test --test-concurrency=1 tests/*.test.ts`, `node --import tsx scripts/audit-lesson-guides.ts` and `node node_modules/vite/bin/vite.js build`. Do not run managed:provision, live experiments or other external actions as part of verification.

## Challenge

Deny one write with your own `deny_message` and explain how the agent responds. Find the message again in the error `agent.tool_result` for that `sevt_` ID, and confirm in the outcome that the session kept running to `end_turn` instead of stopping. Then explain why the offline acknowledgement is authored, while a live agent may try another approach, and what that means for relying on a deny to stop an action.
