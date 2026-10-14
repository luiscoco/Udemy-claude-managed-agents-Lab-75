# Claude Managed Agents Learning

A separate learning app migrated from the reusable Claude Agent SDK Learning
foundation on 2026-10-12. React, Vite, strict TypeScript, Express and Zod remain;
agent execution uses the official `@anthropic-ai/sdk` Managed Agents APIs.
The original application is unchanged. Labs 01 (session event streaming), 02
(session options), 03 (built-in tools), 04 (permissions), 05 (custom tools),
06 (sessions and retained context), 07 (tool policy and execution audit) and
08 (delegation and session threads), 09 (system instructions and explicit
context) and 10 (validated reports and interruption) are registered, with offline fixtures and
source inspection. See
[Lab 02 guide](Tab2-options.md), [Lab 03 guide](Tab3-tools.md),
[Lab 04 guide](Tab4-permissions.md), [Lab 05 guide](Tab5-custom-tools.md) and
[Lab 06 guide](Tab6-sessions.md), [Lab 07 guide](Tab7-hooks.md) and
[Lab 08 guide](Tab8-subagents.md), [Lab 09 guide](Tab9-system-prompts.md) and
[Lab 10 guide](Tab10-structured-interrupt.md)
for controls, experiments and PowerShell checks.
The [course repository index](docs/github-repositories.md) links every cumulative
GitHub checkpoint.

## Run locally

Requires Node 24 or newer.

```powershell
Set-Location C:\claude-managed-agents
npm.cmd ci
npm.cmd run dev
```

Open the **Local** URL printed by Vite. It starts at http://127.0.0.1:5174
and uses the next available port if another application occupies it.
The backend listens on 127.0.0.1:3076.
These ports differ from the original app. Vite fails if its port is occupied.
If npm.cmd is unavailable with NVM, this machine has npm here:

```powershell
node 'C:\Users\luisc\AppData\Local\Author Software\nvm\installs\v24.21.0\node_modules\npm\bin\npm-cli.js' run dev
```

The developer supervisor allows 40 seconds for remote cleanup before forcing
child termination.

## Foundation check

Home preserves navigation, themes, backend readiness, and source inspection.
Run the scripted walkthrough to see authored session events without credentials
or API calls. It is a foundation probe, not a completed numbered Lab.
Live mode creates a session, opens the upstream stream before sending the fixed
prompt, normalizes events, verifies the response marker and four core concepts,
retrieves actual usage, and archives the idle session while preserving history.
Only clicking Run starts work. Setup checks do not contact Anthropic or reveal keys.
The foundation checks message execution, not sandbox tools or generated files.

## Configure live execution

Managed Agents is a beta API; this app pins the official TypeScript SDK to 0.133.0.
Use a Claude Console account with API access and credits.
Install the `ant` CLI using the official quickstart. Review the model in
managed/agent.md for your account before applying the configuration:

```powershell
if (-not (Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
. .\scripts\set-managed-key.ps1
npm.cmd run managed:ready
```

Follow [the full setup guide](docs/managed-setup.md) to reuse existing resources
or explicitly run `npm.cmd run managed:provision`. Set CLAUDE_MANAGED_AGENT_ID
and CLAUDE_MANAGED_ENVIRONMENT_ID using the returned IDs, then optionally run
`npm.cmd run managed:verify` to check access without starting a session.
Set MANAGED_LIVE_ENABLED=true only when ready for billed execution.
Restart the backend, check live setup on Home, choose live mode, and run.
Credentials stay on the server. Never place them in VITE_* settings or source.
No account credentials were copied from the original app.

MANAGED_BUDGET_CENTS defaults to 50 US cents (valid range 1–9999). Platform list
cost is distinct from billed cost; the last model request may take usage past
the configured cap. Unknown usage is null, never invented as zero. Scripted
usage is null and the result explicitly records that no API calls occurred.

Cancel, navigation, disconnect, timeout and server shutdown abort local work.
For a known remote session, cleanup sends user.interrupt on failure/cancellation,
polls for idle, then archives it. Requests use independent bounded timeouts so
browser cancellation cannot abort cleanup. If cleanup cannot be confirmed, the
session ID is shown/logged for recovery in Claude Console. A dropped session
creation response can leave an unknown remote session; inspect Console in that
case. Abrupt process termination can also prevent cleanup. No POST retries occur.
Workflow runs and multiagent orchestration are outside this first probe.

## How it was built, step by step

The app was built in increments. Each lab was added to the platform, verified
offline and recorded in a checkpoint before the next one started, so completed
labs keep working. Building and verifying the labs needed no provisioning or
billed execution. The one exception is the Lab 01 slide deck, which includes
screenshots of a single live session that was run separately.

| Increment | What it added | Guide | Checkpoint | Slides |
| --- | --- | --- | --- | --- |
| Shared foundation | Shell, SSE host, error and lesson contracts, setup probe | — | — | — |
| Lab 01 | Session event streaming | [Guide](Tab1-query.md) | — | [Slides](presentations/lab01/output/Lab01-Claude-Managed-Agents-Application-Workflow.pptx) |
| Lab 02 | Session options | [Guide](Tab2-options.md) | [Checkpoint](docs/lab02-checkpoint.md) | [Slides](presentations/lab02/output/Lab02-Claude-Managed-Agents-Session-Options.pptx) |
| Lab 03 | Built-in tools: enabled vs permitted | [Guide](Tab3-tools.md) | [Checkpoint](docs/lab03-checkpoint.md) | [Slides](presentations/lab03/output/Lab03-Claude-Managed-Agents-Built-in-Tools.pptx) |
| Lab 04 | Permissions: human review of paused calls | [Guide](Tab4-permissions.md) | [Checkpoint](docs/lab04-checkpoint.md) | [Slides](presentations/lab04/output/Lab04-Claude-Managed-Agents-Permissions.pptx) |
| Lab 05 | Custom tools answered by the host | [Guide](Tab5-custom-tools.md) | [Checkpoint](docs/lab05-checkpoint.md) | [Slides](presentations/lab05/output/Lab05-Claude-Managed-Agents-Custom-Tools.pptx) |

Every lab followed the same loop:

1. Map the Agent SDK terms to Managed Agents, and reject what has no equivalent.
2. Define a strict shared contract.
3. Put the provider behind a port, with an offline fixture.
4. Build the UI.
5. Write focused tests that check evidence (events, files on disk), not agent claims.
6. Run the full verification and record a checkpoint.
7. Build the lab's slide deck.

### Shared foundation

1. **Migrated the reusable learning shell.** Navigation, themes, lesson search,
   the three-tab lesson workspace (Learn, Run the exercise, TypeScript source)
   and the source inspector came from the Claude Agent SDK Learning foundation.
   Agent execution was switched to the official `@anthropic-ai/sdk` Managed
   Agents APIs, pinned to 0.133.0.
2. **Fixed the host boundaries every lab reuses.** `server/sse.ts` streams one
   POST per run with heartbeats, idle and whole-run deadlines and a bounded queue.
   `src/lib/sse.ts` reads it in the browser and never retries a POST.
   `server/lib/errors.ts` returns one error shape for 400, 422, 429 and 500, and
   `server/lib/managed-config.ts` reads live settings without ever sending keys to
   the browser.
3. **Made lessons explicit and numeric.** `shared/lessons.ts` validates each
   lesson's metadata and requires its server prefix to be `/api/c<id>`. A lesson
   is registered only when its UI, router, guide (`Tab<id>-*.md`) and offline path
   all exist. `scripts/audit-lesson-guides.ts` enforces this.
4. **Added the setup probe.** Home checks backend readiness and live
   configuration without contacting Anthropic, and the scripted walkthrough shows
   authored session events with no credentials.

### Lab 01: Session event streaming

1. **Defined the contract.** `shared/lab01-events.ts` holds the strict request,
   the frame union streamed to the browser and the result schema.
2. **Put the provider behind a port.** `server/lib/lab01-port.ts` makes one
   provider call per method: create, open the stream, send, interrupt, status and
   archive. An offline port with the same interface replays authored fixtures.
3. **Opened the stream before sending the prompt**, so no event can be missed.
4. **Wrote one event consumer for both modes.** `server/lib/session-events.ts`
   handles previews, authoritative messages, duplicates, lifecycle events and
   turn outcomes the same way for fixtures and live streams.
5. **Separated local cancellation from remote cleanup.** `server/lib/lab01-run.ts`
   stops local waiting first, then sends a bounded `user.interrupt`, polls status
   and archives the idle session. It reports "confirmed" only when it saw the
   session stop.
6. **Authored eight offline scenarios** in `server/lib/lab01-fixtures.ts`, wrote
   the guide `Tab1-query.md`, and verified everything offline.

### Lab 02: Session options

1. **Registered Lab 02 in the existing lesson platform.** The client and server
   registries map lesson `2` to `Concept02Options` and the `/api/c2` router while
   preserving the completed Lab 01 flow. `src/lessons/content.ts` supplies the
   lesson metadata and the source files shown by the in-app inspector.
2. **Defined one shared, strict request contract.**
   `shared/lab02-options.ts` owns the model allowlist, system-prompt choices,
   integer-cent budget limits, preview flag, deadline limits, fixture names and
   result schemas. The server parses this contract before any provider call and
   rejects unknown fields, Agent SDK-only options and invalid bounds.
3. **Built the Lab 02 control surface.**
   `src/concepts/Concept02Options.tsx` renders the prompt, model, system choice,
   budget, preview, deadline and offline-scenario controls. It displays cents and
   dollars together and keeps requested settings separate from the effective
   session snapshot returned by creation.
4. **Created a fresh session for every experiment.**
   `server/lib/lab02-port.ts` calls `sessions.create` with the documented
   `agent_with_overrides` form, preserving the configured base agent ID and
   optional version pin. Model and system changes stay local to the new session;
   tools, MCP servers and skills are cleared so the effective agent is text-only.
5. **Mapped the budget and stream options exactly.** The UI's integer cents become
   `budget.type="limit"` and `max_list_cost: { currency: "USD", amount: "50" }`
   for a 50-cent budget. Preview mode opens the connection with
   `event_deltas=["agent.message"]`; disabling previews omits that opt-in.
6. **Established the event stream before sending the prompt.** The port opens the
   upstream stream first and sends `user.message` only after the connection is
   ready. The shared event consumer accumulates preview fragments by event and
   content-block index, replaces them with the authoritative message and
   deduplicates persisted events by ID.
7. **Kept outcomes and usage evidence distinct.**
   `server/lib/session-events.ts` separates completed, paused, deadline,
   cancelled, provider-error and incomplete results. Reported tokens come only
   from documented model-request span usage; preview characters and offline
   fixtures never become invented token counts.
8. **Added bounded deadline and cleanup behavior.** A local timer stops waiting,
   then the runner uses an independent bounded request to attempt
   `user.interrupt`, checks for a stopped state and closes upstream resources.
   Cleanup reports whether remote interruption was confirmed instead of treating
   a local abort as proof that remote work stopped.
9. **Authored deterministic offline fixtures.**
   `server/lib/lab02-fixtures.ts` covers normal completion, previews on and off,
   `budget_reached`, local deadline, terminal error, `requires_action`, repeated
   events and stream EOF. These fixtures use Managed Agents event shapes and make
   no API calls or claims about Claude performance, spend or latency.
10. **Added the experiment record and lesson guide.** The UI records prompt,
    requested and effective options, outcome, usage scope and cleanup status for
    each run. `Tab2-options.md` explains the controls, migration from Agent SDK
    concepts, browser exercise, limitations, troubleshooting and challenge.
11. **Verified the implementation offline.** Focused tests cover validation,
    cent mapping, stream ordering, preview reconciliation, outcome classification
    and cleanup. TypeScript, lesson-guide audits, production build and browser
    checks run without provisioning or billed execution using the commands below.

### Lab 03: Built-in tools

The goal is to show that a tool being **enabled** (present in the session
toolset) is a different thing from a call being **permitted** (its
`permission_policy` plus the host's confirmation), and to judge the result by
the files on disk rather than by what the agent says.

1. **Mapped Agent SDK terms before writing code.** `tools` became the
   `agent_toolset_20260401` enabled flags, `allowedTools` became per-tool
   `permission_policy`, `permissionMode` became `default_config.permission_policy`,
   host approval became `user.tool_confirmation`, and `cwd` became the container's
   `/workspace`. `shared/lab03-tools.ts` holds this mapping, and the UI and
   `Tab3-tools.md` show it. Agent SDK-only fields are rejected with a 400 that
   names them; nothing is translated.
2. **Defined presets as data.** Read-only, Unavailable Write, Denied Write,
   Permitted edit and Auto each list their enabled tools, policies and host
   answers. `buildToolset()` turns a preset (minus any removed tools) into exactly
   what is sent as `tools[0]`. The web tools are always disabled, and bash is only
   ever enabled with `always_ask`.
3. **Built a disposable host sandbox.** `server/lib/lab03-sandbox.ts` creates a
   fresh `lab03-*` directory under the OS temp directory for each query.
   `uploads/` mirrors the read-only mounts and `outputs/` mirrors
   `/mnt/session/outputs`. `POST /reset` restores the authored fixtures, and
   `GET /files` lists what is on disk.
4. **Wrote the path guards before any code could touch a file.** The container
   guard accepts only `/workspace`, `/mnt/session/uploads` and
   `/mnt/session/outputs`, and rejects `..`, Windows drive and UNC paths and NUL
   bytes. The host guard also checks every existing path segment with `lstat`, so
   a symlink or junction that leads outside the sandbox, or points nowhere, is
   refused. Bash is approved only for exact allowlisted commands.
5. **Made the host's confirmation decision one function.** `decideConfirmation()`
   runs every tool input through the same guards before it answers `allow`. A
   `deny` carries a `deny_message` that the agent receives as its tool result.
6. **Created the live session with per-session tools.** `server/lib/lab03-port.ts`
   uploads `notes.md` and `draft.md` through the Files API, mounts them as session
   `resources`, and calls `sessions.create` with `agent_with_overrides` carrying
   only the lab toolset. The shared agent is never updated. After the turn it
   lists outputs with `scope_id`, validates each filename, downloads the files into
   the sandbox, archives the session and deletes the uploaded originals.
7. **Handled tool events in the runner.** `server/lib/lab03-run.ts` records each
   `agent.tool_use` and `agent.tool_result`. When the session goes idle with
   `requires_action`, it answers each waiting call with `user.tool_confirmation`
   by its `sevt_` event ID and keeps reading. More than 12 confirmations stops the
   loop. Every other event goes through the shared Lab 01 consumer, and cancel and
   deadline reuse the same interrupt-then-cleanup path.
8. **Kept "unavailable" and "denied" as separate states.** A `deny` with no
   `evaluation` object means no policy ran, so the tool is unavailable. An
   `always_ask` call refused by the host, or an `auto` call refused by the server,
   is denied. `deriveDenials()` builds the permission denials list from these rules.
9. **Wrote an offline simulator rather than canned transcripts.**
   `server/lib/lab03-fixtures.ts` gives each preset a fixed plan of tool calls and
   evaluates every call against the actual toolset, pausing for real
   confirmations. Permitted effects are applied to the sandbox through the same
   guards, so removing a tool really changes the outcome and the file. Its `auto`
   decisions are an authored stand-in, not the server classifier.
10. **Built the exercise UI.** `src/concepts/Concept03Tools.tsx` shows the mapping
    table, preset selector, "Remove" checkboxes for the student challenge and the
    exact toolset JSON. Its panels cover tool calls, permission denials, files read
    from disk, the outcome, and an experiment table that records the
    `outputs/draft.md` status line after every run.
11. **Verified files, not agent claims.** `tests/lab03-tools.test.ts` asserts the
    disk contents for every preset and for the challenge. It also covers the path
    guards (including a real junction escape), the bash allowlist, the `sevt_`
    confirmation round trip through the real SDK with a mocked `fetch`, router
    status codes (400, 422, 429), reset, and cancel followed by interrupt.
    `browser-tests/lab03.spec.ts` drives the same flows in Chrome. The results are
    recorded in `docs/lab03-checkpoint.md`.

### Lab 04: Permissions

The goal is a human reviewer for paused tool calls. The Agent SDK's `canUseTool`
becomes a `requires_action` pause that the host answers once with
`user.tool_confirmation`.

1. **Extracted what Lab 03 already had instead of copying it.** The stream runner
   moved to `server/lib/tool-session-run.ts`, with an `answer` hook for each pause.
   The live and fixture ports moved to `server/lib/tool-session-port.ts`, and the
   plan simulator became `createPlanFixture()`. `hostAllowCheck()` now holds the
   host's path and allowlist verdict, and `toolsetFrom()` builds any toolset.
   Lab 03 now uses these pieces too, and its tests passed unchanged.
2. **Mapped the permission terms honestly.** `shared/lab04-permissions.ts` maps
   `canUseTool`, allow and deny to the pause and `user.tool_confirmation`. It also
   records that `updatedInput` has no equivalent, because a confirmation cannot
   change the input. Agent SDK fields are rejected with a 400 that names them.
3. **Built the pending-approval map.** `server/lib/lab04-approvals.ts` keys
   approvals by run and tool-use ID. Each run gets a random `runId` and
   `decisionToken`. An entry is removed before its waiter resolves, so a decision
   applies exactly once. Expiry runs on an injected scheduler, and replays,
   expired and abandoned entries answer 409. A new `CONFLICT` error code was added
   for this.
4. **Turned each pause into a review.** `server/lib/lab04-run.ts` registers only
   `evaluated_permission: "ask"` calls and streams a `review` frame with the input,
   the resolved container path and the host guard's verdict. It then logs who
   decided (reviewer, expiry, host limit or cancellation) and whether a
   confirmation was sent.
5. **Added the decision endpoint.** `POST /api/c4/decide` is strict, limited to
   1 KB and checks the origin. Every allow passes through `hostAllowCheck` first,
   so an unsafe allow answers 422 and stays pending.
6. **Made abandonment explicit.** Cancel, the deadline, a disconnect or shutdown
   releases every waiter, sends no confirmation for them and attempts
   `user.interrupt`.
7. **Built the review UI.** `src/concepts/Concept04Permissions.tsx` shows a
   focus-managed review dialog with a countdown and an editable deny message. It
   also has a decision tester for replays and wrong tokens, and panels for
   preallowed vs asked calls, the decision log, denials and files on disk.
8. **Verified with a controlled clock.** `tests/lab04-permissions.test.ts` covers
   approve, deny and expire, one winner per race, other-run and replay
   rejection, an unsafe allow, cancel and deadline release, and the `sevt_`
   round trip through the real SDK. It also covers the 400, 404, 409, 422 and
   429 codes over HTTP, and the disk state after each case.
   `browser-tests/lab04.spec.ts` drives the dialog in Chrome, and the results are
   recorded in `docs/lab04-checkpoint.md`.

### Lab 05: Custom tools

The goal is to expose typed application functions to the agent. The Agent SDK's
in-process `createSdkMcpServer` + `tool()` become `custom` tools declared on a
persisted agent; the session pauses on `agent.custom_tool_use` and the host
answers once with `user.custom_tool_result`.

1. **Defined each tool once.** `shared/lab05-custom-tools.ts` holds the Zod v4
   shapes for `list_tasks`, `add_task` and `complete_task`; `z.toJSONSchema`
   generates each closed `input_schema`. `managed/lab05-agent.json` was generated
   from the same definitions, has no agent toolset, MCP servers or skills, and a
   test fails if it drifts.
2. **Extended the shared runner, not copied it.** `server/lib/tool-session-run.ts`
   now records `agent.custom_tool_use` events, offers each `sevt_` ID to the
   lab's `answer` hook once, drops repeated pauses and extra answers, and sends
   results through a new optional `respond` port method. The live provider calls
   moved into `liveSessionMethods()`. Labs 03 and 04 tests passed unchanged.
3. **Validated before any handler.** `server/lib/lab05-tasks.ts` parses the raw
   input with the Zod shape first; a rejection is an `is_error` result and the
   handler counter does not move. Handlers run under a deadline and commit only
   if not aborted. Each run gets its own bounded `TaskStore`.
4. **Verified the live agent before use.** `server/lib/lab05-port.ts` retrieves
   the agent from `CLAUDE_MANAGED_LAB05_AGENT_ID`, refuses it unless its tools are
   exactly the three custom tools, pins the session to that version, and checks
   the session's tools again before the prompt. `managed:provision -- lab05`
   creates the agent; nothing is provisioned in the request path.
5. **Built the routes and UI.** `GET /api/c5/tools`, `GET /api/c5/tasks?runId=`
   and `POST /api/c5/query` (SSE). `src/concepts/Concept05CustomTools.tsx` shows
   the definitions, raw input, validation, whether the handler ran, the result
   sent, the state change and the task state before and after.
6. **Verified offline.** `tests/lab05-custom-tools.test.ts` covers the inventory,
   schema rejection before execution, state transitions, `is_error` paths, one
   result per `sevt_` ID, the handler deadline, cancel and deadline, isolation
   between concurrent runs, the real SDK with a mocked `fetch`, and the router.
   `browser-tests/lab05.spec.ts` drives the Tour, the student challenge and the
   slow-handler and cancel flows in Chrome. Results are in
   `docs/lab05-checkpoint.md`.

### Lab 06: Sessions and retained context

The goal is to continue a conversation in one retained Managed session, compare
it with a fresh session and reconnect without duplicating persisted events.

1. **Separated application and provider identity.** The browser holds a random
   conversation UUID. The server binds it to the exercise owner and stores the
   Managed `sesn_` ID, turn count, expiry and seen persisted event IDs. Clients
   never select arbitrary remote sessions.
2. **Created only when New is requested.** `POST /api/c6/query` with `action=new`
   calls `sessions.create` once and saves the returned `sesn_` ID. Continue and
   Reconnect retrieve the existing owned entry and reject unknown, foreign,
   archived and expired conversations.
3. **Opened the stream before every send.** Continue establishes
   `sessions.events.stream` before sending `user.message`, then records the
   actual `sevt_` ID returned by `events.send`. A local turn UUID remains separate
   from both provider IDs.
4. **Kept idle sessions open across turns.** A completed turn updates the host
   index but does not archive the session. This differs from the one-shot runner
   used by earlier labs.
5. **Hydrated reconnects safely.** Reconnect opens the live stream first, walks
   paginated session history in chronological order and merges only unseen
   persisted IDs. The UI shows the number of ignored duplicates.
6. **Made ownership and lifecycle failures visible.** The server returns distinct
   403, 404 and 409 responses for foreign, unknown and archived or expired
   conversations. Stream EOF stays incomplete even when text was observed.
7. **Closed only after confirmed idle.** `POST /api/c6/close` checks session
   status, archives an idle session and blocks all future sends. Cancellation and
   shutdown use bounded interrupt and cleanup attempts.
8. **Authored a stateful offline adapter.** The fixture remembers a fictional
   project only inside one fixture session, returns real-shaped `sesn_` and
   `sevt_` IDs and never contacts Anthropic. Fresh-session isolation is therefore
   deterministic without claiming Claude behavior.
9. **Built the exercise UI and guide.** `Concept06Sessions` exposes New,
   Continue, Reconnect, Inspect and Close; it shows conversation, session, turn
   and sent-event IDs alongside retained history and stream ordering.
10. **Verified the complete checkpoint.** Focused unit and HTTP tests cover one
    create across two turns, returned send IDs, ownership, reconnect
    deduplication, EOF, cancellation and explicit archive. The full offline suite,
    TypeScript, lesson audit, production build and Chrome exercise all pass. See
    `docs/lab06-checkpoint.md`.

### Lab 07: Tool policy and execution audit

The goal is to replace Agent SDK `PreToolUse` and `PostToolUse` callbacks with a
host-owned policy pipeline around Managed Agents custom tools.

1. **Declared a dedicated tool-only agent.** `managed/lab07-agent.json` contains
   exactly `read_file`, `write_file` and `edit_file` as closed-schema custom
   tools. Built-in filesystem and Bash tools, MCP servers and skills are absent.
2. **Provisioned outside the request path.** `managed:provision -- lab07` creates
   the versioned agent explicitly and records its ID locally. Live requests
   retrieve and verify the agent before creating a session.
3. **Validated original input first.** The host parses every call with the same
   Zod schema that generated the agent's JSON Schema. Invalid and unknown calls
   return an error result without invoking a handler.
4. **Applied three visible policies.** Audit-only permits safe fixture calls;
   deny-write blocks protected-file mutations; rewrite-input changes a proposed
   output path to the allowed draft fixture.
5. **Revalidated rewrites.** A rewritten call passes through the complete schema
   and path guard again. The audit keeps both original and effective input.
6. **Executed inside a guarded host sandbox.** Only named `/workspace` fixtures
   map into a disposable host directory. Traversal, other roots, Windows paths,
   oversized values and unknown files are rejected before any file operation.
7. **Recorded actual post-execution evidence.** Every row stores the decision,
   validation phase, whether the handler ran, execution outcome, returned result
   and file contents before and after. Executed, denied and failed remain distinct.
8. **Correlated one result to each call.** The shared tool-session runner answers
   `agent.custom_tool_use` with one `user.custom_tool_result` keyed by its
   `sevt_` ID and ignores repeated calls or pause IDs.
9. **Exposed the evidence in the UI and API.** `POST /api/c7/query` streams the
   pipeline; `GET /api/c7/file` reads the retained run fixture. The lesson offers
   normal, handler-exception, repeated-call and cancellation experiments.
10. **Verified effects rather than claims.** Focused tests inspect disk state for
    allow, deny, rewrite, exception and path escape, plus HTTP/SSE, duplicate
    handling and cancellation. Chrome drives the same policy experiments.

### Lab 08: Delegation and session threads

The goal is to use the pinned Managed Agents multiagent configuration while
keeping role capabilities and effect verification in the host application.

1. **Authored three saved worker definitions.** The researcher, reviewer and
   calculator have separate prompts and minimal custom tools.
2. **Provisioned one coordinator roster.** The coordinator enables exactly the
   three predefined agents and disables inline agents, advisor and workflows.
3. **Used native session-thread identity.** Thread creation, status and messages
   are correlated by `sthr_` IDs and agent names.
4. **Kept histories separate.** The UI shows the parent and each child history;
   child prose is not treated as an automatic parent answer.
5. **Enforced capabilities in the host.** The researcher can read one fixture,
   the reviewer write is refused, and the calculator can request bounded addition.
6. **Verified effects independently.** The ledger records whether the handler ran,
   proves the fixture write did not occur and recomputes `21 + 21` as `42`.
7. **Handled cross-posted calls by thread ID.** The adapter uses
   `session_thread_id`; it does not invent an Agent SDK `parent_tool_use_id`.
8. **Stopped child activity through the session boundary.** Cancellation invokes
   the Managed session interrupt or its deterministic fixture equivalent.
9. **Exposed the roster and experiment API.** `GET /api/c8/agents` describes the
   bounded topology and `POST /api/c8/query` streams thread and effect evidence.
10. **Recorded limits honestly.** Separate histories do not imply filesystem
    isolation, and offline fixtures do not prove real parallel execution.

### Lab 09: System instructions and explicit context

1. **Defined four explicit variants.** Base inherits the agent system; Custom
   replaces it; the two combined variants join the retrieved base to appended
   instructions or authored project context in one host composer.
2. **Selected trusted context by ID.** A fictional `CLAUDE.md` lives as reviewed
   host teaching text. Only `aurora-finch-v1` selects it; arbitrary project paths
   or browser-supplied project text are rejected.
3. **Pinned the base snapshot.** The host retrieves the configured agent version
   and creates a fresh session referencing that same ID and version. The model
   is inherited so instruction comparisons keep it fixed.
4. **Cleared inherited capabilities.** Every session explicitly replaces tools,
   MCP servers and skills with empty arrays. A multiagent base is rejected.
5. **Compared requested and resolved instructions.** The host checks the returned
   system, model and agent identity before sending the question. Base omits the
   system override; other variants send the complete composed replacement.
6. **Reused event and cleanup boundaries.** The existing runner opens the stream
   before sending the user question, consumes authoritative messages, enforces
   deadlines and attempts bounded interruption and archive.
7. **Kept comparisons bounded.** Offline Compare runs variants sequentially. The
   server accepts at most two concurrent Lab 09 requests, subject to server limits.
8. **Reported observed usage.** Live model spans are deduplicated and counted;
   authored fixtures report no measured usage or quality/cost ranking.
9. **Added the context and query routes.** `GET /api/c9/context` exposes the
   authored context provenance; `POST /api/c9/query` streams one fresh session.
10. **Verified the boundaries.** Deterministic tests cover exact composition,
    capability clearing, SDK transport, fresh IDs, injection rejection,
    cancellation and deadlines. The browser compares all four variants.

### Lab 10: Validated reports and interruption

1. **Defined a closed report schema.** One Zod contract generates the JSON Schema
   and independently validates project, summary, risks and nextSteps.
2. **Selected host final-text validation.** The lesson prompts a text-only agent
   for JSON, then parses the last authoritative message after end_turn. It sends
   no invented native structured-output fields.
3. **Bounded corrective work.** Invalid reports get at most one corrective user
   message. A second invalid result is exhausted and remains unverified.
4. **Retained owned sessions.** Local run IDs map to a provider session and an
   exercise owner. Unknown IDs and controls from other owners are rejected.
5. **Serialized sends.** Each session has one active turn plus at most two queued
   sends, explicit turn IDs and bounded history.
6. **Implemented interrupt with evidence.** Interrupt stops the current local
   turn and sends user.interrupt alone when needed. The host polls provider status
   and permits reuse only after idle is observed.
7. **Separated local abort from remote cleanup.** Disconnect aborts local waiting
   and initiates remote interrupt and archive. Unconfirmed stop or failed archive
   remains visible as pending cleanup.
8. **Closed idle sessions explicitly.** End requires no pending sends and confirmed
   idle, archives the session and rejects all future sends. Repeated Close is safe.
9. **Reported effective outcomes and usage.** The ledger distinguishes verified,
   invalid, exhausted, interrupted, aborted and deadline outcomes. Only observed
   live spans supply usage; fixtures report no measured tokens.
10. **Exercised the lifecycle.** Deterministic tests cover schemas, correction,
    queue bounds, ownership, deadlines, interrupt acknowledgment versus idle,
    reuse, close and SDK calls. Browser exercises demonstrate the same controls.

### Presentations

Each lab has a slide deck in `presentations/labNN/output/`, built from scripts in
`presentations/labNN/.build/`. Each new deck starts from a copy of the previous
lab's scripts, and only the content changes:

1. `capture.mjs` starts the app on spare ports (API 3087, Vite 5185) with live
   mode disabled and Anthropic hosts blocked (from Lab 02 onwards). It drives the offline exercise and
   saves six screenshots. The screenshots are checked by eye, and any that miss
   the key evidence are re-captured.
2. `build_deck.py` uses the Lab 01 deck as a template and rewrites its 22 slides
   in place: cover, six screenshot slides, sequence diagram, overview, twelve
   step slides with code excerpts or cards, and the student challenge. Speaker
   notes cite the source files and official documentation. Code excerpts are
   kept to about 50 characters per line, and the script checks this.
3. `render_check.py` exports every slide through PowerPoint and reports any text
   that overflows its box; sequence-diagram labels are the usual offenders. The
   rendered slides are then reviewed by eye, and the deck is rebuilt until
   nothing overflows or wraps mid-statement.
4. The deck's SHA-256 is added to that lab's checkpoint.

| Deck | Screenshots |
| --- | --- |
| Lab 01: application workflow | Controls, results and raw events of the event-streaming exercise, offline and from one live session |
| Lab 02: session options | Controls, effective settings, previews, budget pause and deadline |
| Lab 03: built-in tools | Concept mapping, unavailable vs denied write, permitted edit on disk, auto denial, challenge table |
| Lab 04: permissions | Concept mapping, review dialog, host-refused allow (422), decision log with 409/404, files on disk, expiry vs abandonment |
| Lab 05: custom tools | Concept mapping, generated tool definitions, Tour calls table, task state over GET, wrong-typed title challenge, handler deadline |

Run them from the workspace root, for example:

```powershell
node presentations/lab04/.build/capture.mjs
py presentations/lab04/.build/build_deck.py
py presentations/lab04/.build/render_check.py
```

## Validation

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd run test:browser
npm.cmd run scan:distribution
```

Browser checks use dedicated ports 5184 and 3086 and installed Google Chrome.
Offline checks use injected managed ports and do not spend API credits.
See docs/migration.md for architecture, curriculum decisions and verification.

Official references:
- https://platform.claude.com/docs/en/managed-agents/quickstart
- https://platform.claude.com/docs/en/managed-agents/events-and-streaming
- https://platform.claude.com/docs/en/managed-agents/session-observability
- https://platform.claude.com/docs/en/managed-agents/budgets
- https://platform.claude.com/docs/en/managed-agents/tools
- https://platform.claude.com/docs/en/managed-agents/permission-policies
- https://platform.claude.com/docs/en/managed-agents/files
