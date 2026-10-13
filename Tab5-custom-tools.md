# Lab 05: Custom tools

Your application has typed functions, here a small task list, and the agent should call them. In the Agent SDK you wrap them with `tool()` and `createSdkMcpServer()`, and the SDK runs an in-process MCP server inside its agent loop. Managed Agents has **no in-process server**: the loop runs on Anthropic's side, so your functions have to be reached through session events.

1. The persisted agent declares each function as `{ type: "custom", name, description, input_schema }`.
2. When the agent calls one, the session emits `agent.custom_tool_use` (with `name` and `input`) and goes idle with `session.status_idle` and `stop_reason.type: "requires_action"`, listing the waiting `sevt_…` event IDs.
3. The host validates the input, runs the handler and sends **one** `user.custom_tool_result` per call: `custom_tool_use_id` is that `sevt_…` ID, `content` holds text blocks, and `is_error` says whether the call failed. The session then keeps running.

Custom tools have **no permission policy**. There is nothing to confirm: the host decides by running, rejecting or failing the call. Remote MCP servers (`mcp_servers` + `mcp_toolset`) are a different mechanism and are out of scope here.

## Prerequisites

Use Node 24 or newer and the installed Anthropic TypeScript SDK 0.133.0. Labs 01–04 should already work, because this lab reuses the event consumer and the tool-session runner. Offline mode needs no credentials, provisioning or account access. Run from this workspace in PowerShell:

```powershell
npm run dev
```

Open http://127.0.0.1:5174/?lesson=5 and select **Run the exercise**. If your NVM installation blocks npm, run the entrypoints directly:

```powershell
node scripts/dev-server.mjs
# In a second PowerShell window:
node node_modules/vite/bin/vite.js
```

Live runs are optional and billed. They need a **separate agent** that declares the three tools, created once from `managed/lab05-agent.json`:

```powershell
$env:MANAGED_MODEL = "claude-opus-5-5"
npm.cmd run managed:provision -- lab05
# Then set CLAUDE_MANAGED_LAB05_AGENT_ID on the server (for example in .env) and restart the backend.
```

The command refuses to run twice and records the new agent in `managed/lab05-resources.local.json`, which is never distributed. Live mode also needs `MANAGED_LIVE_ENABLED=true` and the environment from Lab 01; see docs/managed-setup.md. The server never creates or updates agents while handling a request.

## Concept mapping

| Agent SDK term | Managed Agents equivalent |
| --- | --- |
| `createSdkMcpServer({ tools })` | No in-process server. The persisted agent declares `tools: [{ type: "custom", name, description, input_schema }]`. |
| `tool(name, description, zodShape, handler)` | The same Zod shape generates `input_schema`; the handler runs on the host, never in the session container. |
| Handler called by the SDK loop | `agent.custom_tool_use` event, then `session.status_idle` with `stop_reason` `requires_action` listing its `sevt_` ID. |
| Handler return `{ content, isError }` | `user.custom_tool_result` with `custom_tool_use_id` (the `sevt_` ID), `content` text blocks and `is_error`. |
| Input validated by the SDK | The host validates with Zod before any handler runs; a rejection is an `is_error` result. |
| `allowedTools: ["mcp__tasks__…"]` | Custom tools have no permission policy. Which tools exist is fixed on the agent, not per request. |

Requests that contain `mcpServers`, `allowedTools`, `createSdkMcpServer` or `tools` get HTTP 400, and the message names each field. Nothing is forwarded or translated: a request cannot add, remove or replace the agent's tools.

### The three tools

`shared/lab05-custom-tools.ts` defines each input **once** as a Zod v4 `strictObject`. `z.toJSONSchema` turns it into the `input_schema` (closed with `additionalProperties: false`, with the `required` fields), and `managed/lab05-agent.json` contains exactly those definitions. A test fails if the two ever differ.

| Tool | Input | Result |
| --- | --- | --- |
| `list_tasks` | `status?`: `open` or `done` | `{ tasks: [...] }` |
| `add_task` | `title` (1–120 characters, not blank), `priority?`: `low`, `normal` or `high` | `{ task }` with its new ID |
| `complete_task` | `id` such as `task_1` | `{ task }` now `done` |

The agent template has **no `agent_toolset_20260401` entry**, so no built-in tool (bash, read, write…) is enabled, and it has no MCP servers or skills. Before a live session is created, the server retrieves the agent and refuses it unless its tools are exactly these three custom tools with the same property names, required fields and closed objects. It checks the created session again before any prompt is sent.

## Controls

- **Prompt** asks for the same steps the Tour replays. Offline fixtures follow recorded calls and ignore your wording.
- **Handler deadline (ms)** is 100 to 5000 (default 1000). A handler that is still running at the deadline is abandoned: the session gets an `is_error` result and the handler's change is not saved.
- **Local deadline (seconds)** is 1 to 120 and cannot exceed MANAGED_DEADLINE_MS.
- **Live session budget (US cents)** is 1 to 500.
- **Offline scenario** replays recorded `agent.custom_tool_use` events through the fixture port. The handlers, validation and task store are the real host code.
  - **Tour**: `list_tasks`; `add_task` (high priority); `complete_task task_3`; a **malformed** `add_task`; then two calls in one pause, `complete_task task_99` (unknown) and `complete_task task_3` (already done); then `list_tasks` for open tasks.
  - **Valid only**: list, add, complete, list done tasks.
  - **Slow handler**: the `add_task` handler is made to outlast its deadline.
  - **Hang**: the agent keeps working after its second call, so you can cancel or let the deadline expire.
- **Malformed add_task input (Tour, offline)** is the JSON object the Tour's fourth call sends. It defaults to `{"priority":"high"}`, which has no title.
- **Load task state from GET /api/c5/tasks** reads the run's own task store from the server.

## Experiment

1. Open **Custom tool definitions on the agent** and match each `input_schema` to its Zod shape in shared/lab05-custom-tools.ts.
2. Run **Tour**. In **Custom tool calls**, the first three calls pass validation, run their handler and send `is_error: false`; the state change column shows `added task_3`, then `task_3 open → done`.
3. Find the malformed `add_task`: validation says `title: Invalid input: expected string, received undefined`, the handler **did not run**, `is_error: true` was sent, and the state change is `no change`.
4. Find the two calls from the same pause. Each got its own result keyed by its own `sevt_` ID: `task_99` is unknown and `task_3` is already done. Both are handler errors with messages the agent can act on.
5. In **Task state**, compare the handler call counts with the number of calls: one `add_task` call never reached its handler. Then select **Load task state from GET /api/c5/tasks** and compare.
6. Run **Slow handler** with a 300 ms deadline. The `add_task` result is `is_error: true` with a deadline message, and the following `list_tasks` shows that no task was saved.
7. Run **Hang** and press **Cancel query**. The server attempts `user.interrupt`; the run's task state stays readable through the GET route.

## Route inventory

| Route | Purpose |
| --- | --- |
| `GET /api/c5/tools` | The three custom tool definitions, and whether `CLAUDE_MANAGED_LAB05_AGENT_ID` is configured. |
| `GET /api/c5/tasks?runId=` | One run's task list and handler call counts. 400 for a malformed or extra query parameter, 404 for an unknown or evicted run. |
| `POST /api/c5/query` | SSE. Body `{ mode, prompt, deadlineSeconds, handlerTimeoutMs?, budgetCents?, scenario?, challengeInput? }`, strict, 8 KB maximum. The first frame is `run` with the `runId`; each answered call produces a `custom_call` frame. |

## Evidence to inspect

server/lib/lab05-tasks.ts holds the host side. `dispatch` validates the raw `input` with the tool's Zod shape **before** it touches a handler; a rejection returns the Zod issues as an `is_error` result, and the handler call counter does not move. A valid call runs under the handler deadline, and state changes only after any slow work, and only if the call was not aborted. `ToolError` marks a valid call that cannot be done (unknown ID, task already done, duplicate open title, task limit), so its message goes back to the agent. Each run gets its own `TaskStore` from `TaskStoreRegistry`, which keeps at most 16 stores and evicts only finished runs.

server/lib/tool-session-run.ts is the stream runner shared with Labs 03 and 04. It now records `agent.custom_tool_use` events and hands them to the lab's `answer` hook at each `requires_action` pause. Each `sevt_` ID is offered to the hook **once**: a repeated pause is reported as a notice and answered by nothing, and an extra answer is dropped. server/lib/lab05-run.ts is the hook: it dispatches the pending calls in the order the session listed them and returns one result each. An ID with no matching event still gets an `is_error` result, so the session is never left waiting.

server/lib/lab05-port.ts sends results with `client.beta.sessions.events.send` as `user.custom_tool_result` events, and pins the session to the agent version it just verified. server/lib/lab05-fixtures.ts refuses a result for an unknown ID or a second result for one call, as the API would.

| Result | Meaning |
| --- | --- |
| `is_error: false` | The handler ran and its JSON is the content. |
| `is_error: true`, handler did not run | The input failed validation, or the tool name is unknown. Nothing changed. |
| `is_error: true`, handler ran | The handler refused (unknown ID, already done…) or passed its deadline. Nothing changed. |

## Troubleshooting

- **HTTP 422 on Run live** means a setting is missing: the API key, the environment ID, `CLAUDE_MANAGED_LAB05_AGENT_ID` or `MANAGED_LIVE_ENABLED=true`.
- **"The Lab 05 agent cannot be used"** means the agent's tools differ from `managed/lab05-agent.json`, or it has MCP servers, skills or multiagent configuration. Provision a new agent rather than reusing the Lab 01 agent.
- **A result with `is_error` for every call** usually means the input does not match the schema. Read the issues in the Validation column.
- **The run ends with `paused` and `requires_action`** means more than 24 answers were requested and the host stopped answering.
- **The local deadline wins over a pause.** The outcome is `deadline` and `user.interrupt` is attempted. Remote interruption is confirmed only when the session was then seen idle or terminated; otherwise check the session in Claude Console.

## Limitations

The offline agent replays recorded calls. It does not read results, so it never retries a rejected call or picks a different ID; a live agent may. Only the host side, meaning validation, handlers, results and state, is real offline. Task stores live in server memory and disappear when the backend restarts. Results are text blocks only; images and documents are also allowed by the API but not used here. The host enforces its own handler deadline: Managed Agents waits for a custom tool result as long as the session lives.

## Verification

Run in PowerShell:

```powershell
npm run typecheck
node --import tsx --test tests/lab05-custom-tools.test.ts
npm run test:offline
npm run test:lesson-guides
npm run audit:lesson-guides
npm run scan:distribution
npm run build
node scripts/run-browser-tests.mjs lab05.spec.ts
```

With an NVM npm-wrapper restriction, use `node node_modules/typescript/bin/tsc --noEmit`, `node --import tsx --test --test-concurrency=1 tests/*.test.ts`, `node --import tsx scripts/audit-lesson-guides.ts` and `node node_modules/vite/bin/vite.js build`. Do not run managed:provision, live experiments or other external actions as part of verification.

## Challenge

Send `add_task` with a missing or wrong-typed title: in the Tour, set the malformed input to `{"title": 42}` and run it. Confirm three things for that call: the result is `is_error: true` with the validation issue, the `add_task` handler count did not change (it is one less than the number of `add_task` calls), and the task list is identical before and after (`no change`). Then explain why validating on the host matters even though the agent was given the schema.
