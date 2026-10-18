# Claude Managed Agents Learning

The platform contains 75 numbered lessons with React exercises, Express routes, authored guides and source inspection. It uses the official `@anthropic-ai/sdk` 0.133.0 for supported Managed API operations. Host implementations and Agent SDK replacements are labeled in each lesson; offline fixtures are distinguished from provider observations.

Use the sidebar by topic or lesson number, search by title or objective, and switch between Learn, Run the exercise and TypeScript source. See the [repository index](docs/github-repositories.md) for the independent private lesson checkpoints and the [final validation report](docs/course-validation.md) for executed checks and remaining live prerequisites.

## Run locally

The [Learning Guide](docs/learning-guide.md) adds section-by-section explanations, red highlighting, Inworld voice narration and a saved self-assessment checklist to all 75 labs. Start a guided tour from any lesson. Written guidance works without a voice key; narration requires explicit server configuration and a Play action.

Home includes a browser-local course progress overview and **Continue learning** shortcut. Checklist completion is self-assessment, separate from verified exercise evidence. Saved tours resume only when explicitly selected.

The Learning Guide also has a personal notebook and lesson bookmarks. Home can download a learning backup and preview a restore before applying it; these controls stay entirely in the browser.

Use **Open notebook** beside a lesson title for direct access to its notes. **Course progress** and **Back up or restore** are always available in the sidebar or mobile Menu. These optional learning tools never require you to visit every lesson or complete a checklist.

Download the [updated prompts Word workbook](docs/prompt-migration/Claude-Managed-Agents-Prompts-Labs-01-75.docx). Its 18 October supplement adds eight independent prompts covering the Learning Guide, Inworld narration, learning state, knowledge checks, paths, milestones, direct navigation, readable answers and release verification. The [supplement source](docs/learning-platform-prompts.md) is also readable in GitHub.

Each lab includes an authored **Knowledge check** with explained answers and retries. Home tracks these practice results separately from self-assessment checklists and verified exercise evidence. Version 2 learning backups include knowledge answers and still accept version 1 backups.

Home also offers four suggested **Learning paths** and a **Review queue** for incorrect knowledge answers and bookmarks. Paths are optional; every lab remains available.

The [offline milestone projects](docs/learning-milestones.md) provide downloadable Node 24 starters and local tests for an event viewer, SSE endpoint and fictional approval ledger. No dependency installation or provider key is required; initial starter failures are intentional. Instructor validation: `npm run milestones:check`.

Each milestone has an optional **Solution walkthrough and reference download**, troubleshooting tips and a separate runnable reference ZIP. The Learn view in all 75 lessons includes a baseline, comparison and evidence principle. Final agent prose in Labs 01–05, 09, 11, 13 and 14 uses readable Markdown with an expandable exact redacted message; previews and raw lifecycle evidence keep their original roles.

Requires Node 24 or newer and Git on PATH. On Windows use PowerShell and npm.cmd. Chrome is used by browser acceptance tests and Lab 64; no model key is needed for offline exercises.

```powershell
Set-Location C:\claude-managed-agents
npm.cmd ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
npm.cmd run dev
```

Open the **Local** URL printed by Vite. It starts at http://127.0.0.1:5174
and uses the next available port if another application occupies it.
The backend listens on 127.0.0.1:3076.
These ports differ from the original app. Vite selects the next free frontend port.
If npm.cmd is unavailable with NVM, this machine has npm here:

```powershell
node 'C:\Users\luisc\AppData\Local\Author Software\nvm\installs\v24.21.0\node_modules\npm\bin\npm-cli.js' run dev
```

The developer supervisor allows 40 seconds for remote cleanup before forcing
child termination.

Use a second PowerShell terminal for checks; leave the dev terminal running. Stop the platform with Ctrl+C and wait for cleanup before restarting.

```powershell
npm.cmd run typecheck
npm.cmd run test:offline
npm.cmd run test:lesson-guides
npm.cmd run test:dev-server
npm.cmd run test:sse
npm.cmd run test:browser
npm.cmd run test:ui:live-actions
npm.cmd run build
npm.cmd run scan:distribution
npm.cmd run package:course
```

Live readiness requires server-side credentials and existing configured resources. A Claude web, desktop or CLI login does not supply an isolated lab key. Installation, startup, readiness and offline checks do not provision resources or start paid sessions. See [setup](docs/managed-setup.md).

Optional prerequisites vary by lesson: Lab 44 can use a separately configured telemetry collector; Lab 45 cloud adapters require their own verified infrastructure; Lab 64 uses pinned Playwright MCP and Chrome; Lab 65 notification transports require explicit provider setup and approval; Lab 69 builds a VS Code extension but interactive IDE installation is manual; Lab 70 needs a selected Python interpreter and explicit isolated requirements installation for live work; Lab 72 can generate offline DOCX and uses Word for visual inspection; Lab 75 requires an isolated API key and three pinned role agents for live execution. Authored adapters and configuration examples are not evidence that those integrations ran.

The sanitized course ZIP uses an explicit source allowlist and hash manifest. It excludes keys, local resource manifests, node_modules, builds, logs, session stores, browser profiles and runtime repositories. It preserves the learner workspace and does not delete files to sanitize the distribution.

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
   live spans supply usage; fixtures report no measured tokens. Reports render
   as project headings, summaries, risks and numbered next steps; copyable JSON
   lives in a details panel. An idle retained session is labeled separately from
   active execution.
10. **Exercised the lifecycle.** Deterministic tests cover schemas, correction,
    queue bounds, ownership, deadlines, interrupt acknowledgment versus idle,
    reuse, close and SDK calls. Browser exercises demonstrate the same controls.

### Lab 11: Managed skills and progressive loading

1. **Authored three complete skill snapshots.** `skills/lab11/` contains v1 and
   revised v2 formatting instructions with references, plus a deliberately missing
   reference snapshot. Frontmatter names the skill and describes its relevance.
2. **Validated the host bundle.** `server/lib/lab11-bundle.ts` reads only authored
   allowlisted files, rejects file symlinks and bounds sizes. File hashes and a
   snapshot hash distinguish revisions independently of an agent's claims.
3. **Separated explicit upload from execution.** `scripts/lab11-skills-setup.ts`
   provides `skills:check` without provider access and deliberate `skills:upload`.
   The Skills API receives a full multipart snapshot. A local manifest records
   the returned skill and immutable version; uploads are never called by routes.
4. **Attached pinned versions in fresh sessions.** `server/lib/lab11-port.ts`
   retrieves the base agent version and pinned skill metadata, then overrides
   skills explicitly. It preserves the model/system, clears MCP and disables
   all built-in tools except read. Resolved mismatches block the prompt while
   retaining the new session ID for cleanup.
   Numeric session version aliases are resolved through a scoped read-only lookup
   and must identify the exact immutable pin; raw and canonical versions remain visible.
5. **Tracked file reads independently.** `server/lib/lab11-run.ts` correlates read
   uses and results, classifies instruction/reference paths, ignores duplicate
   events and worker cross-posts, and distinguishes attempted, succeeded and
   failed reads. Host previews and assistant text cannot manufacture this evidence.
6. **Reused lifecycle boundaries.** The shared tool-session runner opens the stream
   before sending, bounds host answers, handles local cancellation/deadlines and
   uses fresh interrupt/status/archive calls for cleanup. Each request owns a new
   session; owner and global concurrency bounds prevent overlapping exercises.
7. **Built readable comparisons.** `src/concepts/Concept11Skills.tsx` compares five
   offline variants, supports metadata-only and failed-read cases, displays
   configured/resolved metadata separately from reads and exposes copyable JSON.
8. **Registered the lesson and documented limits.** Browser/server registries,
   shared strict schemas and `Tab11-skills.md` expose the actual implementation.
   The guide distinguishes local bundles from trusted GitHub discovery and does
   not assume Agent SDK plugin, Skill tool, hot reload or preload APIs.
9. **Verified without provider charges.** Focused tests use authored streams and
   injected SDK HTTP transport, including multipart upload construction. Browser
   checks compare all variants and verify mobile wrapping. Live relevance and
   remote upload/execution remain unverified until explicitly exercised.

### Platform readability and adopted prompt changes

The platform uses a 20px base font with larger navigation, controls, notes and
code. Long Lab 10 reports wrap within the page on desktop and phone screens.
The report metadata and token counters stay separate from the readable report.

The updated Word workbook in `docs/prompt-migration/` preserves the original
Setup and Labs 01–75 prompts and adds five dated copyable blocks covering adopted
conversation requirements. These include readable output, platform typography,
development port fallback, network-aware live diagnostics, README walkthroughs,
private cumulative lesson repositories and truthful retained-session evidence.
The canonical workbook and its dated updated copy contain the same content.
The original baseline is retained locally as a backup.

The tracked Word workbook now also includes an **Independent visual style
improvement prompt** on pages 107–110. Its [standalone copy](docs/visual-style-improvement-prompt.md)
describes the supplied dark course shell, guided two-column workspace and colored
exercise panels, while preserving readable typography and the implemented lessons.
All previous 96 copyable blocks remain intact; the workbook contains 97 blocks.
The 110-page document was rendered and visually reviewed. Pages 2–106 are pixel
identical to the previously reviewed version.

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

### Lab 12: Multiple messages in one session

1. **Defined closed command contracts.** `shared/lab12-streaming-input.ts` bounds message text, command IDs, scripts, limits and small PNG attachments. Unsupported SDK generator/setter fields fail before admission.
2. **Opened one stream for a retained session.** `server/lib/lab12-port.ts` implements injected fixture and official SDK adapters. Live sessions pin the base version, clear tools/MCP/skills and verify effective configuration; returned IDs remain available for cleanup if verification fails.
3. **Built the host queue.** `server/lib/lab12-queue.ts` admits at most one active and two waiting commands, deduplicates command IDs and serializes sends using the shared lifecycle consumer. It requires the returned user event to appear before attributing turn evidence.
4. **Separated controls from turns.** The Express router exposes admission, scripts, SSE snapshots, inspection, restricted idle tools/MCP updates, system context, explicit new-model context handoff and end/cleanup. Waiting commands are cancelled before submission on close; interruption and archive are reported separately.
5. **Added the real learning workspace.** `src/concepts/Concept12StreamingInput.tsx`, the registry and [Lab 12 guide](Tab12-streaming-input.md) show admission, provider acceptance, processing and outcomes independently, retaining the shared visual design.
6. **Validated offline.** The full regression run passed 169 tests; the expanded Lab 12 suite passed 16 tests, including disconnect during new-model creation. The Lab 12/navigation browser run passed 12 checks. Typecheck, guide audit/tests and build passed. Live provider behavior was not exercised.

```powershell
npm.cmd run dev
# In another terminal:
node --import tsx --test tests/lab12-streaming-input.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run typecheck
npm.cmd run build
npm.cmd run scan:distribution
node scripts/lab12-browser-demonstration.mjs
```

The demonstration uses the running server at port 5174 by default; set `LESSON_UI_URL` to the actual Vite URL if it chose another port. It runs only authored offline commands and closes its sessions. See [Lab 12 checkpoint](docs/lab12-checkpoint.md) for evidence and limits.

### Lab 13: MCP connections and reachability

1. **Authored real local MCP servers.** `mcp-servers/lab13-notes.mjs` uses protocol-only stdio. `mcp-servers/lab13-inventory.ts` supplies an authenticated, loopback-only, stateless Streamable HTTP implementation pinned to MCP 2025-11-25.
2. **Connected bounded clients.** `server/lib/lab13-local-mcp.ts` performs initialize/tool discovery, validates results, correlates RPC IDs, strips privileged environment settings from the child, and owns child/listener cleanup. Missing and unauthorized scenarios produce real transport failures.
3. **Separated bridge and native integration.** `server/lib/lab13-port.ts` declares typed custom tools for the host bridge, or restricted native URL MCP toolsets with an existing vault. Native endpoints are configured only on the server; metadata never claims successful cloud reachability.
4. **Retained only completed idle sessions.** `server/lib/lab13-sessions.ts` reuses the shared tool-session runner, answers bridge calls once and records result-submission acknowledgments separately from native result events. The runner's new retention option defaults off, preserving earlier labs' archive behavior.
5. **Added the actual exercise and guide.** Lab 13 supports working/missing/unauthorized/hanging experiments, tool/server disabling, owned-stock inspection/reset, idle configuration and cleanup. Its UI retains the shared visual design and labels local stock separately from remote evidence.
6. **Validated without paid runs.** See [Lab 13 checkpoint](docs/lab13-checkpoint.md) for actual checks, browser demonstrations and limits.

```powershell
node --import tsx --test tests/lab13-mcp.test.ts
npm.cmd run typecheck
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
npm.cmd run scan:distribution
# With the local app running:
node scripts/lab13-browser-demonstration.mjs
```

Each completed lesson is committed and pushed to its own private cumulative repository; Lab 13's destination is [Udemy-claude-managed-agents-Lab-13](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-13).

Official references:
- https://platform.claude.com/docs/en/managed-agents/quickstart
- https://platform.claude.com/docs/en/managed-agents/events-and-streaming
- https://platform.claude.com/docs/en/managed-agents/session-observability
- https://platform.claude.com/docs/en/managed-agents/budgets
- https://platform.claude.com/docs/en/managed-agents/tools
- https://platform.claude.com/docs/en/managed-agents/permission-policies
- https://platform.claude.com/docs/en/managed-agents/files


### Lab 14: How it was built, step by step

1. Inspected SDK 0.133.0 model, effort, session-creation/update and usage-span types, then checked current official effort and Managed session documentation.
2. Authored a closed teaching capability catalog with explicit operator-declared account readiness. Strict schemas reject incompatible combinations and Agent SDK fields before sending.
3. Adapted the shared text-session runner through injected ports. Each attempt pins the base version, sets a model/effort object, clears tools/skills/MCP and verifies returned configuration before sending. Only events after the acknowledged user message are attributed to the attempt.
4. Added owned experiment preparation, fresh runs, replacement configurations and cleanup. Uncertain work reserves capacity; fallback is bounded to one separately budgeted session after reconciliation.
5. Added readable evidence, fixed-prompt comparison history, offline failure scenarios, cancellation and the guide. Private thinking is filtered and fixture measurements remain absent.
6. Added deterministic provider-boundary tests, browser checks and phone/desktop demonstrations. See [Lab 14 checkpoint](docs/lab14-checkpoint.md) for actual validation and limitations.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab14-models.test.ts
npm.cmd run test:offline
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
npm.cmd run scan:distribution
node scripts/lab14-browser-demonstration.mjs
```

Lab 14 is published independently at [Udemy-claude-managed-agents-Lab-14](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-14), preserving earlier cumulative checkpoints.


### Lab 15: How it was built, step by step

1. Inspected SDK 0.133.0 session/usage-event/span/thread and budget-update types, then checked current official usage and budget documentation.
2. Added safe integer-cent parsing, nullable usage metrics, deduplicated span accounting and cumulative snapshot replacement. Deltas compare only matching scopes, identities and sources.
3. Built an owned retained-session adapter around the shared event consumer and SSE transport. Budgeted text-only sessions enforce three-turn/message ceilings, one context message and zero tool calls, with independent cancellation and cleanup.
4. Added a separate acknowledged budget-raise action that can resume paused work. It permits one bounded increase on an originally capped session, checks known consumed cost and reserves a host turn before sending. Reads never raise budgets.
5. Added readable usage/source cards, intermediate/final comparisons, offline duplicate/child/missing/budget/hanging scenarios, guide and source inspection. No worker, upload or paid model run starts automatically.
6. Verified deterministic accounting/provider boundaries, browser exercise, phone/desktop evidence and earlier lessons. See [Lab 15 checkpoint](docs/lab15-checkpoint.md).

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab15-usage.test.ts
npm.cmd run test:offline
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
npm.cmd run scan:distribution
node scripts/lab15-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-15](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-15).

### Lab 16: How it was built, step by step

1. Inspected SDK 0.133.0 Managed environment, session resource and session creation types alongside official environment and file documentation.
2. Added synthetic host configuration layers with explicit application precedence, a single approved remote file manifest and redacted credential readiness. No personal settings are read.
3. Added offline scenarios for a winning host layer, missing credential, absent mount and restricted path. Each displays host provenance separately from remote context and records policy decisions without opening files.
4. Added an explicit live port that retrieves the configured cloud environment and pinned base agent, creates one budgeted session with an allowlisted file resource, verifies the returned resource listing, and reuses the shared SSE/event consumer/session cleanup boundary.
5. Added the exercise UI, strict routes, guide, focused tests and an offline browser demonstration. See [Lab 16 checkpoint](docs/lab16-checkpoint.md).

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab16-settings-env.test.ts
npm.cmd run test:offline
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
npm.cmd run scan:distribution
node scripts/lab16-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-16](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-16).

### Lab 17: How it was built, step by step

1. Registered lesson 17 in the cumulative React and Express registries, with its source panel and [learner guide](Tab17-checkpointing.md).
2. Defined closed host snapshot, restore-plan and report contracts. The lesson records session, host event and observed Managed stream event IDs separately.
3. Created a guarded fixture tree under `generated/lab17/` with two tracked files and one untracked file. Only explicit, allowlisted host handlers can read or change those paths.
4. Reused the retained-session turn and SSE boundary. A host file action runs after a confirmed-idle turn; the model's text does not authorize a file change.
5. Added snapshot hashes, exact dry-run restore plans, owner/version/current-hash checks and a confirmed restore that leaves the conversation and untracked path intact. Session-scoped remote outputs are inspected separately.
6. Added deterministic tests and an offline browser demonstration. See [Lab 17 checkpoint](docs/lab17-checkpoint.md) for actual verification and limitations.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab17-checkpointing.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab17-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-17](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-17).

### Lab 18: How it was built, step by step

1. Registered lesson 18 with its React exercise, Express routes, source inspection and [learner guide](Tab18-sandbox.md).
2. Added a local platform manifest that displays the configured environment ID and optional agent version pin without provider calls. The SDK has no environment version field; an explicit metadata read shows `updated_at` separately.
3. Built disposable offline host tests for exact allowlisted file access, outside path denial, authored blocked-network policy and missing-environment failure. Actual file reads are hashed; denied paths cause no read or socket call.
4. Added a deliberate live environment read and a separate budgeted diagnostic. It rechecks a restricted cloud policy, enables only `bash` with host confirmation and approves only exact `pwd` in the remote sandbox.
5. Added strict request/report contracts, effect evidence, focused tests and a phone/desktop offline browser demonstration. See [Lab 18 checkpoint](docs/lab18-checkpoint.md) for actual validation and limits.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab18-sandbox.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab18-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-18](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-18).

### Lab 19: How it was built, step by step

1. Registered lesson 19 with a React exercise, bounded Express routes, source inspection and [learner guide](Tab19-session-management.md).
2. Reused the retained-session turn runner and added an owner-scoped host inventory with strict new/continue, rename, tag, archive and explicit delete operations.
3. Captured observed user and agent messages, exposed paginated history, and required an explicit selected event boundary to start a new derived session with a visible summary handoff and lineage metadata.
4. Kept provider listing/retrieval opt-in, checked host ownership before provider reads or writes, and distinguished an archived record from a deleted idle session.
5. Added focused tests and an offline browser demonstration. See [Lab 19 checkpoint](docs/lab19-checkpoint.md) for verification and limits.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab19-session-management.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab19-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-19](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-19).

### Lab 20: How it was built, step by step

1. Registered lesson 20 with a React exercise, Express routes, source inspection and [learner guide](Tab20-hooks-in-depth.md).
2. Reused the Lab 07 custom-tool port and shared event/tool-session runner. Added a separate typed host-audit union with run, session, thread and event correlation; provider events remain distinct from application interceptors.
3. Added six offline cases with actual guarded fixture files or fixture-only virtual time. Policy denial occurs before execution, a tool failure reaches the handler, and an interceptor exception fails closed before session creation.
4. Validated final text with a closed application report schema and classified provider, tool, instrumentation, deadline and validation failures separately. There is no automatic correction loop.
5. Added strict request/result contracts, owner-scoped file inspection and reset, focused tests and a phone/desktop offline browser demonstration. See [Lab 20 checkpoint](docs/lab20-checkpoint.md) for actual validation and limits.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab20-hooks-in-depth.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab20-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-20](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-20).

### Lab 21: How it was built, step by step

1. Registered lesson 21 with a React exercise, host command router, strict shared contract, source inspection and [learner guide](Tab21-slash-commands.md).
2. Authored a fixed registry with two model prompt templates and two local-only commands. Enum and integer argument schemas reject arbitrary paths, executable text and extra fields before any provider operation.
3. Reused the owned, bounded Lab 15 retained-session runner for model commands. The exact expansion is sent as `user.message`; local inspect/reset never call the provider port.
4. Added a three-entry host history, explicit close, owner checks and focused API/UI tests. See [Lab 21 checkpoint](docs/lab21-checkpoint.md) for measured validation and limitations.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab21-slash-commands.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab21-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-21](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-21).

### Lab 22: How it was built, step by step

1. Registered lesson 22 with a React exercise, Express routes, source inspection and [learner guide](Tab22-claude-md-memory.md).
2. Authored root and nested `CLAUDE.md` fixture documents, an untrusted imported note and a separate handoff summary. The host reads only four fixed paths, verifies their boundary and records actual bytes and hashes.
3. Composed an exact user message from selected documents for each fresh bounded session. The offline exercise compares nested, conflict, disabled and handoff selections while labeling local reads, remote reads and cloud memory separately.
4. Reused the retained-session runner for one text-only turn and explicit cleanup. Added strict requests, owner-scoped result reset, focused tests and a phone/desktop offline browser demonstration. See [Lab 22 checkpoint](docs/lab22-checkpoint.md) for validation and limitations.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab22-claude-md-memory.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab22-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-22](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-22).

### Lab 23: How it was built, step by step

1. Registered lesson 23 with a React exercise, Express routes, source inspection and [learner guide](Tab23-plugins.md).
2. Authored a six-contribution host bundle with fixed paths, namespace rules, version `1.0.0` and SHA-256 pins. The validator rejects malformed manifests, missing directories, changed hashes and worker privilege expansion before replacing the active inventory.
3. Composed bundle on/off, skill and optional MCP inventories. These are host proposals and authored fixture resolutions; no Managed resource is provisioned, uploaded or contacted by Reload.
4. Executed a reviewed read-only host tool against validated fictional sighting records and recorded its exact input/result. A disabled bundle has zero handler invocations. Added strict owner-local comparisons, focused tests and a phone/desktop offline demonstration. See [Lab 23 checkpoint](docs/lab23-checkpoint.md) for validation and limits.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab23-plugins.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab23-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-23](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-23).

### Lab 24: How it was built, step by step

1. Registered the lesson UI, server route, authored guide and source viewer under numeric ID 24.
2. Defined three separate typed offline adapters for a manual Messages tool call, the Messages tool-runner callback and a Managed custom-tool pause. SDK-typed manual and tool-runner boundaries use an injected client for deterministic tests; the lesson keeps Messages and Managed request contracts separate.
3. Routed all adapters through one host-owned NOTEBOOK stock handler. It permits at most two units per reservation and records each checked effect; fixture answer text never changes inventory.
4. Added a host call-count cap, five-second route deadline, origin/owner guard, capacity limit, focused tests and browser checks. See [Lab 24 checkpoint](docs/lab24-checkpoint.md) for results and live limitations.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab24-harnesses.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab24-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-24](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-24).

### Lab 25: How it was built, step by step

1. Registered lesson 25 with a React exercise, strict server routes, source viewer and [learner guide](Tab25-compaction-context.md).
2. Added three bounded, allowlisted host report reads with byte hashes and checked facts. The offline replay sends typed Managed event fixtures through the shared event consumer and records `agent.thread_context_compacted` only when present.
3. Displayed cumulative thread usage separately from unavailable context-window, free-context and compaction-threshold values. A missing metric stays unavailable.
4. Added an explicit host summary handoff with a new fixture session ID and checked fact retention; one scenario deliberately omits a fact to show the limitation. See [Lab 25 checkpoint](docs/lab25-checkpoint.md) for validation and limits.

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab25-compaction-context.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab25-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-25](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-25).

### Lab 26: How it was built, step by step

1. Registered lesson 26 with a React exercise, strict local routes, source viewer and [learner guide](Tab26-query-control.md).
2. Read the installed Managed `SessionUpdateParams` type and exposed only documented control categories, including idle-only full-replacement tools/MCP fields and explicit budget opt-in.
3. Built a bounded owned-session fixture with a slow turn, interrupt and confirmed idle, history, title/metadata, tool/MCP and budget updates, archive and a new-model session with explicit summary handoff.
4. Added focused route and state tests plus a phone/desktop browser demonstration. The [checkpoint](docs/lab26-checkpoint.md) records validation and the unavailable live branch.

```powershell
node --import tsx --test tests/lab26-query-control.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab26-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-26](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-26).

### Lab 27: How it was built, step by step

1. Registered lesson 27 with a React task exercise, owner-scoped routes, source viewer and [learner guide](Tab27-background-tasks.md).
2. Built a bounded host task ledger with distinct task, session, thread and browser identities. Stable event IDs deduplicate replay after reconnect.
3. Added explicit stop/idle confirmation, idle-only archive, retention expiry and shutdown cleanup. A completed fixture report remains unverified; dynamic workflow runs are outside this adapter.
4. Added route and ledger tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab27-checkpoint.md) records actual validation and limits.

```powershell
node --import tsx --test tests/lab27-background-tasks.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab27-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-27](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-27).

### Lab 28: How it was built, step by step

1. Registered lesson 28 with a React fault experiment, strict routes, source viewer and [learner guide](Tab28-errors-retries.md).
2. Added a loopback fault server for transient GET failures and lost mutation acknowledgments, with bounded read backoff and an injected port that passes `maxRetries: 0` for side-effecting operations.
3. Added an idempotency ledger and distinct classifications for unknown create ID, known-session reconciliation, handler/event faults, cancellation, EOF and local disconnect.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab28-checkpoint.md) records validation and the unavailable live branch.

```powershell
node --import tsx --test tests/lab28-errors-retries.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab28-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-28](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-28).

### Lab 29: How it was built, step by step

1. Registered lesson 29 with a React comparison, strict fixture routes, source viewer and [learner guide](Tab29-images-files.md).
2. Generated a fictional PNG, one-page PDF and text observation, then rendered and inspected the PDF and image fixtures.
3. Checked allowlisted filenames, MIME signatures, base64 and decoded sizes before building the pinned Managed `user.message` image/document blocks or file resource metadata. Request previews redact file bytes.
4. Kept the authored downloaded output separate from agent text and left usage unavailable in offline mode. The [checkpoint](docs/lab29-checkpoint.md) records validation and the unavailable live upload branch.

```powershell
python scripts/generate-lab29-fixtures.py
node --import tsx --test tests/lab29-images-files.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab29-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-29](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-29).

### Lab 30: How it was built, step by step

1. Registered lesson 30 with a React host-board exercise, owner-scoped routes, source viewer and [learner guide](Tab30-todo-tracking.md).
2. Extended the typed custom-tool pattern to `create_task`, `update_task`, `list_tasks` and `get_task`, with a separate explicit host plan-replacement operation.
3. Added deterministic owner, dependency, version and completion-evidence gates. Correlated event IDs are idempotent; agent claims remain separate from host state.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab30-checkpoint.md) records actual validation and the unavailable live branch.

```powershell
node --import tsx --test tests/lab30-todo-tracking.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab30-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-30](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-30).

### Lab 31: How it was built, step by step

1. Registered lesson 31 with an accessible question form, owner-scoped routes, source viewer and [learner guide](Tab31-ask-user-question.md).
2. Declared a closed `ask_user` tool shape and stored the authored pause with bounded options, run/session/event IDs and expiry.
3. Validated one selected option or allowed custom answer, then built exactly one typed `user.custom_tool_result` tied to the stored `sevt_` ID. Waiters release on answer, cancellation, timeout and browser disconnect.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab31-checkpoint.md) records validation and the unavailable live branch.

```powershell
node --import tsx --test tests/lab31-ask-user-question.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab31-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-31](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-31).

### Lab 32: How it was built, step by step

1. Registered lesson 32 with a plan-review exercise, owner-scoped routes, source viewer and [learner guide](Tab32-plan-mode.md).
2. Added a host-owned plan contract with a version and SHA-256 hash. The offline planning phase reads a disposable fictional fixture and rejects write attempts.
3. Kept reviewer approval separate and single-use. A current approval creates a distinct restricted execution session ID and permits only one checked append to the fixed fixture file; revised plans invalidate older decisions.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab32-checkpoint.md) records validation and the unavailable live branch.

```powershell
node --import tsx --test tests/lab32-plan-mode.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab32-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-32](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-32).

### Lab 33: How it was built, step by step

1. Registered lesson 33 with a local MCP form exercise, owner-scoped routes, source viewer and [learner guide](Tab33-mcp-elicitation.md).
2. Authored a stdio MCP server that pauses a tool call with a closed `elicitation/create` request, plus a host client that correlates initialization, discovery, form request and final tool response.
3. Validated dates and quantities before one answer to the MCP request, then built a correlated Managed custom-tool result shape. Decline, timeout and abort close the local transport; the fixed fictional consent view is not OAuth.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab33-checkpoint.md) records validation and the unavailable direct cloud callback branch.

```powershell
node --import tsx --test tests/lab33-mcp-elicitation.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab33-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-33](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-33).

### Lab 34: How it was built, step by step

1. Registered lesson 34 with a style-comparison exercise, owner-scoped routes, source viewer and [learner guide](Tab34-output-styles.md).
2. Added four trusted host instruction files and a fixed registry. Each comparison snapshots the selected file text, SHA-256 and exact composed system override with a fresh session ID and unchanged empty tool capabilities.
3. Rejected unknown names before session creation and validated a closed JSON report independently of output preference. The authored answers illustrate formatting, not live quality.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab34-checkpoint.md) records validation and the unavailable live branch.

```powershell
node --import tsx --test tests/lab34-output-styles.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab34-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-34](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-34).

### Lab 35: How it was built, step by step

1. Registered lesson 35 with a file-backed mirror exercise, owner-scoped routes, source viewer and [learner guide](Tab35-session-stores.md).
2. Added an atomic conversation index pointing to owned `sesn_` IDs and thread-partitioned JSONL files containing canonical `sevt_` events. The effect ledger is stored separately.
3. Compared eager and batched flush under simulated restart, append failure, missing thread history and reconnect reconciliation. The host deduplicates events and reports incomplete mirrors without claiming remote ownership.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab35-checkpoint.md) records validation and the unavailable live continuation branch.

```powershell
node --import tsx --test tests/lab35-session-stores.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab35-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-35](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-35).

### Lab 36: How it was built, step by step

1. Registered lesson 36 with a transport-boundary exercise, owner-scoped routes, source viewer and [learner guide](Tab36-process-spawning.md).
2. Added an injected HTTP/event port and a loopback protocol emulator. The host creates a fictional session, consumes bounded event lines, and records interruption and archive evidence separately.
3. Added a fixed authored child worker with JSON stdin/stdout, private stderr and once-only exit accounting. Worker failure and local abort do not claim a remote stop without confirmation.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab36-checkpoint.md) records validation and the unavailable live branch.

```powershell
node --import tsx --test tests/lab36-process-spawning.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab36-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-36](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-36).

### Lab 37: How it was built, step by step

1. Registered lesson 37 with a host policy exercise, owner-scoped routes, source viewer and [learner guide](Tab37-permission-prompt-tool.md).
2. Added a local reviewer and an isolated fixture policy worker. Both produce closed decisions about one exact `always_ask` action and `sevt_` ID; the gate is not callable by the model.
3. Applied an independent host path limit before constructing one typed `user.tool_confirmation`. Malformed or timed-out gate output produces no confirmation or file effect, and each decision is single-use.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab37-checkpoint.md) records validation and the unavailable live branch.

```powershell
node --import tsx --test tests/lab37-permission-prompt-tool.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab37-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-37](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-37).

### Lab 38: How it was built, step by step

1. Registered lesson 38 with a follow-up suggestion exercise, owner-scoped routes, source viewer and [learner guide](Tab38-prompt-suggestions.md).
2. Added closed suggestion records bound to conversation ID, turn and response version. Normal, delayed, suppressed, stale and disabled fixtures expose absence and timing without claiming a native SDK event.
3. Made Copy update only the browser draft. A separate Send request checks the binding and increments the turn; stale suggestions fail before any send. Answer and optional suggestion usage remain separate.
4. Added focused tests and a phone/desktop browser demonstration. The [checkpoint](docs/lab38-checkpoint.md) records validation and the unavailable live suggestion-session branch.

```powershell
node --import tsx --test tests/lab38-prompt-suggestions.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab38-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-38](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-38).

### Lab 39: How it was built, step by step

1. Registered lesson 39 with a [learner guide](Tab39-project-config-root.md), source viewer and owner-scoped API.
2. Pinned a host manifest and SHA-256 hash. A disposable Git worktree holds fictional source with a conflicting branch rule; Git fixture creation disables hooks. A local fixture is used if Git is absent.
3. Added checked read/edit operations with path, traversal, link and protected-file guards. Branch text stays data, while missing or changed manifest hashes reject tool use.
4. Added focused and browser tests. The [checkpoint](docs/lab39-checkpoint.md) records actual checks and the local-only limit.

```powershell
node --import tsx --test tests/lab39-project-config-root.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab39-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-39](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-39).

### Lab 40: How it was built, step by step

1. Registered lesson 40 with a recovery workspace, owner-scoped routes, source viewer and [learner guide](Tab40-resume-drops-turn.md).
2. Added a host command/effect ledger with stable IDs, versions, immutable remote-event evidence and five authored recovery cases.
3. Refused continuation or fresh derivation when uncertain work needs reconciliation. Host-only undo restores a clean draft by expected version and refuses to erase accepted work.
4. Added focused tests and browser demonstrations. The [checkpoint](docs/lab40-checkpoint.md) records verification and the offline-only limit.

```powershell
node --import tsx --test tests/lab40-recovery.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab40-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-40](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-40).

### Lab 41: How it was built, step by step

1. Registered lesson 41 with a lifecycle comparison, source viewer and [learner guide](Tab41-v2-session-api.md).
2. Reused the current Managed-shaped port boundary: create, stream, send, list, retrieve and archive. A static panel explains the historical local-process model without loading it.
3. Compared one-shot archive with retained second turns, idle interrupt/continue, reconnect by history hydration and archived-session refusal. Resolved fixture IDs and cleanup evidence stay visible.
4. Added pinned-dependency, focused and browser tests. The [checkpoint](docs/lab41-checkpoint.md) records verification and the offline-only limit.

```powershell
node --import tsx --test tests/lab41-lifecycle.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab41-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-41](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-41).

### Lab 42: How it was built, step by step

1. Registered lesson 42 with a research workspace, owner-scoped routes, source viewer and [learner guide](Tab42-web-tools.md).
2. Used the installed Managed SDK's exact `web_search`/`web_fetch` config types for the preview. The offline host fetch fixture keeps unrestricted built-in fetch and bash disabled.
3. Checked each URL and redirect target before the next request, classified hostile page text as data, and verified final citation IDs against inspected source records. Search snippets are labeled separately from complete pages.
4. Added focused tests and browser demonstrations. The [checkpoint](docs/lab42-checkpoint.md) records validation and the network-disabled limit.

```powershell
node --import tsx --test tests/lab42-web-tools.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab42-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-42](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-42).

### Lab 43: How it was built, step by step

1. Registered lesson 43 with a loopback MCP bridge exercise, owner-scoped routes, source viewer and [learner guide](Tab43-remote-mcp-resources.md).
2. Authored a local MCP JSON-RPC server that lists a tool, resources, a versioned template and a prompt. A server-side toy bearer token gates its calls.
3. Added a host client that allowlists resource URIs, bounds results, redacts token evidence and returns an approved read as a typed custom-tool-result fixture. Direct Managed URL MCP remains a separate reviewed integration.
4. Added focused tests and browser demonstrations. The [checkpoint](docs/lab43-checkpoint.md) records verification and the local-only limit.

```powershell
node --import tsx --test tests/lab43-mcp-bridge.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab43-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-43](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-43).

### Lab 44: How it was built, step by step

1. Registered lesson 44 with a telemetry workspace, owner-scoped routes, source viewer and [learner guide](Tab44-otel-observability.md).
2. Added a host OTLP HTTP JSON exporter and bounded loopback collector. Correlated Express, Managed-port, approval, custom-handler and cleanup spans by trace/parent IDs plus session, thread and tool-event attributes.
3. Kept prompt/tool content redacted by default. An owner-scoped toggle records only explicit fictional content. Managed model-span event fixtures remain separate provider evidence, including a missing-signal case.
4. Added focused tests and browser demonstrations. The [checkpoint](docs/lab44-checkpoint.md) records verification and the local-only export limit.

```powershell
node --import tsx --test tests/lab44-telemetry.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab44-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-44](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-44).

### Lab 45: How it was built, step by step

1. Registered lesson 45 with a provider capability catalog, owner-scoped routes, source viewer and [learner guide](Tab45-cloud-providers.md).
2. Checked current official availability and separated documented Managed support from installed TypeScript client verification and enabled local routes. Direct Claude API is the installed baseline; Claude Platform on AWS is documented separately; Bedrock, Vertex and Foundry Messages support does not imply Managed sessions.
3. Added a loopback emulator with synthetic credentials and distinct auth, model, configuration and feature-mismatch preflights. No emulator outcome creates a session or enables an unverified provider route.
4. Added focused tests and browser demonstrations. The [checkpoint](docs/lab45-checkpoint.md) records validation and the offline-only limit.

```powershell
node --import tsx --test tests/lab45-providers.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab45-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-45](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-45).

### Lab 46: How it was built, step by step

1. Registered lesson 46 with an offline cache-usage exercise, owner-scoped routes, source viewer and [learner guide](Tab46-prompt-caching.md).
2. Kept the authored handbook prefix stable while varying the dynamic suffix, model and tool configuration across retained and fresh-session examples.
3. Compared cache creation and read counters only for equal-scope, same-session readings. Missing usage and changed session identity remain explicitly non-comparable; authored counters are examples, not measured savings.
4. Added focused tests and browser demonstrations. The [checkpoint](docs/lab46-checkpoint.md) records verification and the absence of a live provider call.

```powershell
node --import tsx --test tests/lab46-cache-observations.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab46-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-46](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-46).

### Lab 47: How it was built, step by step

1. Registered lesson 47 with five offline orchestration routes, an owner-scoped router, a source viewer and [learner guide](Tab47-multi-agent.md).
2. Checked the installed SDK's native `multiagent_20261001` and `session_thread_id` types, then kept native worker threads separate from the host pipeline's independent session IDs.
3. Added closed regional sales reports, fixture verification, one corrective round for an incorrect total, and delayed/dependency-failure gates. Usage is shown at shared-session or host-aggregate scope without double counting worker examples.
4. Added focused tests and browser demonstrations. The [checkpoint](docs/lab47-checkpoint.md) records verification and the offline/account-capability limits.

```powershell
node --import tsx --test tests/lab47-multi-agent.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab47-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-47](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-47).

### Lab 48: How it was built, step by step

1. Registered lesson 48 with a local security range, owner-scoped routes, source viewer and [learner guide](Tab48-security-hardening.md).
2. Generated the closed custom-tool input schema from Zod and kept tool event correlation separate from host business idempotency keys. The fixture disables unrelated built-in tools, MCP and skills.
3. Added fake canary and temporary-file probes for private reads and out-of-scope writes, plus a real loopback collector for injected egress. The layered host policy checks canonical paths and rejects untrusted egress; the naive comparison demonstrates executed effects.
4. Added focused tests and browser demonstrations. The [checkpoint](docs/lab48-checkpoint.md) records verification and the local-only limit.

```powershell
node --import tsx --test tests/lab48-security-hardening.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab48-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-48](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-48).

### Lab 49: How it was built, step by step

1. Registered lesson 49 with offline headless verdict routes, an owner-scoped router, source viewer and [learner guide](Tab49-deploy-ci-headless.md).
2. Authored a child-process [runner](ci-kit/runner.mjs), [worker](ci-kit/worker.mjs), [Dockerfile](ci-kit/Dockerfile) and inactive [GitHub workflow sample](ci-kit/sample-workflow.yml). Docker context excludes local secrets and generated data.
3. Reused the Managed session adapter for an explicitly opted-in live CI worker: it creates a budgeted session with configured agent/environment IDs, checks that tools and MCP are absent, sends one bounded prompt, validates final JSON and requires archive before success. The offline worker demonstrates SIGTERM handling and emits a machine-readable verdict without a TTY or key.
4. Added focused tests and browser demonstrations. The [checkpoint](docs/lab49-checkpoint.md) records verification and that no CI deployment or billed run was started.

```powershell
node ci-kit/runner.mjs scripted pass
node --import tsx --test tests/lab49-headless.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab49-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-49](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-49).

### Lab 50: How it was built, step by step

1. Registered the Acme Support Desk capstone with owner-scoped routes, a source viewer and [learner guide](Tab50-capstone.md).
2. Built the local customer, order, ticket, refund, approval, conversation and audit store. Closed custom-tool schemas route every action through host checks for ownership, policy, integer cents, remaining amount, reviewer identity and single-use approval.
3. Added a retained scripted session for the offline exercise and an explicitly opted-in Managed adapter for a dedicated, version-pinned agent. The host correlates custom-tool events with results, deduplicates history, distinguishes model text from effects and archives on close.
4. Added deterministic handler evals, focused and browser tests, and a provision command that requires a separate explicit confirmation. The [checkpoint](docs/lab50-checkpoint.md) records verification and live limits.

```powershell
npm run capstone:check
npm run test:capstone
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab50-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-50](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-50).

### Lab 51: How it was built, step by step

1. Registered an offline host-testing lesson with closed routes, a source viewer and [learner guide](Tab51-unit-testing.md).
2. Reused the actual Lab 50 store, custom-tool handlers and retained scripted session. The test runner asserts ledger effects, approval outcomes, ownership and session identity instead of relying on model claims.
3. Replayed authored Managed events through the shared consumer to check child-thread metadata, duplicate persisted events, preview replacement and missing terminal state. A closed final-report schema rejects an invented field.
4. Added a virtual-time policy mutation: a 31-day-old order fails the real 30-day host rule, while a deliberate 60-day variant causes the expected failed assertion. Focused and browser tests and the [checkpoint](docs/lab51-checkpoint.md) record the outcome.

```powershell
node --import tsx --test tests/lab51-unit-testing.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab51-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-51](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-51).

### Lab 52: How it was built, step by step

1. Registered an evaluator lesson with owner-scoped routes, source viewer and [learner guide](Tab52-evals.md).
2. Built a holdout dataset for a valid refund, false refund claim, over-refund and injected foreign order. Each authored trial calls the actual Lab 50 closed custom-tool handler and checks the host refund ledger.
3. Stored baseline and candidate reports with SDK/API identity, trial count, per-case and aggregate verdicts. Offline model, agent version, latency, tokens and cost stay unknown. An optional structured judge can agree, disagree or return invalid JSON; it never overrides host safety.
4. Gated local promotion on an owned baseline, no regression and passing host and safety checks. Added focused and browser tests; the [checkpoint](docs/lab52-checkpoint.md) records verification and offline limits.

```powershell
node --import tsx --test tests/lab52-evals.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab52-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-52](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-52).

### Lab 53: How it was built, step by step

1. Registered an owner-scoped trace and replay lesson with a source viewer and [learner guide](Tab53-debugging.md).
2. Recorded bounded, redacted event summaries alongside resolved fixture tools, local and remote IDs, thread and `sevt_` IDs, host decisions and refund-ledger effects. The valid control and denied-tool scenarios use the actual Lab 50 typed handler.
3. Replayed authored events through the shared consumer and compared lifecycle outcome and recorded effects. Malformed report, missing idle, stream EOF, local turn limit and cleanup timeout retain distinct causes and remote-stop uncertainty.
4. Added focused and browser tests; the [checkpoint](docs/lab53-checkpoint.md) records verification and authored-trace limits.

```powershell
node --import tsx --test tests/lab53-debugging.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab53-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-53](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-53).

### Lab 54: How it was built, step by step

1. Registered a custom-tool design workshop with closed routes, a source viewer and [learner guide](Tab54-tool-design.md).
2. Generated vague and explicit Managed custom-tool input schemas from Zod and added a contract linter for descriptions, integer-cent units, order IDs and closed inputs. Host risk/effect notes remain separate from the installed SDK tool type.
3. Routed scripted choices through the actual Lab 50 refund handler. Invalid input, domain rejection and missing prerequisites leave the ledger unchanged; a repeated valid proposal reuses its business action key across distinct `sevt_` IDs and issues at most one trusted-approved refund.
4. Added focused and browser tests. The [checkpoint](docs/lab54-checkpoint.md) records verification and that the scripted traces are not live model-choice measurements.

```powershell
node --import tsx --test tests/lab54-tool-design.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab54-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-54](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-54).

### Lab 55: How it was built, step by step

1. Registered an offline SDK/API upgrade rehearsal with owner-scoped routes, source viewer and [learner guide](Tab55-upgrading-sdk.md).
2. Read the installed 0.133.0 package manifest as the locked baseline and compared authored candidate contract fixtures across beta header, event unions, stream ordering, configuration, permissions, usage, evals and evidence. Npm version and agent/environment/skill pins remain separate fields.
3. Added a server-computed candidate, authored-canary, simulated-promotion and rollback state machine. A client eligibility hint never overrides failed checks; rollback does not claim to rewind remote sessions.
4. Added focused and browser tests. The [checkpoint](docs/lab55-checkpoint.md) records validation and the fact that no real candidate SDK or release was tested.

```powershell
node --import tsx --test tests/lab55-upgrading-sdk.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab55-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-55](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-55).

### Lab 56: How it was built, step by step

1. Registered a two-role team exercise with owner-scoped routes, a source viewer and [learner guide](Tab56-agent-teams.md).
2. Added an application-owned reducer for claims, task dependencies, stable message envelopes, delivery, acknowledgment and completion. The host verifies 12 + 18 + 7 = 37; rejected arithmetic changes no state.
3. Made duplicate delivery idempotent and shutdown conditional on completed tasks and acknowledged messages. Native delegation remains unavailable until separately verified Managed thread events and identities are configured.
4. Added focused and browser tests. The [checkpoint](docs/lab56-checkpoint.md) records the offline scope and verification.

```powershell
node --import tsx --test tests/lab56-agent-teams.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab56-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-56](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-56).

### Lab 57: How it was built, step by step

1. Registered a local Git worktree workshop with owner-scoped routes, a source viewer and [learner guide](Tab57-parallel-worktrees.md).
2. Created a disposable base repository, separate worker branches and worktrees. Bounded host file edits, path checks and behavioral tests gate each worker commit. Worker claims remain separate from host evidence.
3. Integrated passing commits through serialized cherry-picks and combined tests. Competing edits abort the conflict and preserve branch refs; failed and cancelled workers block integration.
4. Added focused and browser tests. The [checkpoint](docs/lab57-checkpoint.md) records validation and the offline scope.

```powershell
node --import tsx --test tests/lab57-parallel-worktrees.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab57-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-57](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-57).

### Lab 58: How it was built, step by step

1. Registered a bounded application tool-catalog workshop with owner-scoped routes, source viewer and [learner guide](Tab58-tool-search.md).
2. Authored 64 tools across eight domains and exposed a transparent +3 name, +2 hint, +1 description search simulator. Plans list names only; searches return at most five definitions and rough context estimates.
3. Routed a fixed dispatcher through the selected tool's closed input schema and trusted host context. Unauthorized refunds and invented settings have no effect; authorized offline refunds are owner-scoped and idempotent.
4. Added focused and browser tests. The [checkpoint](docs/lab58-checkpoint.md) records verification and the lack of native ToolSearch claims.

```powershell
node --import tsx --test tests/lab58-tool-search.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab58-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-58](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-58).

### Lab 59: How it was built, step by step

1. Registered a 13-task offline routing workshop with owner-scoped routes, source viewer and [learner guide](Tab59-model-routing.md).
2. Kept independent answer keys in a separate server module and validated closed answer/confidence JSON before scoring. A 0.94 confidence wrong answer remains incorrect.
3. Compared fixed tiers, rule, classifier, cascade and draft/review strategies. Every hypothetical model choice has a separate session ID; classifier and reviewer attempts count toward assumed spend, tokens and latency.
4. Added a pre-admission budget gate, focused and browser tests. The [checkpoint](docs/lab59-checkpoint.md) records verification and the assumed/offline measurement boundary.

```powershell
node --import tsx --test tests/lab59-model-routing.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab59-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-59](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-59).

### Lab 60: How it was built, step by step

1. Registered a fictional durable refund batch with owner-scoped routes, source viewer and [learner guide](Tab60-durable-agents.md).
2. Created eight policy fixtures and dedicated Zod-derived closed custom-tool definitions. The host returns `user.custom_tool_result` by the Managed `sevt_` event ID while business effects use a separate stable key.
3. Wrote journals and ledgers atomically on the host. A crash after effect 3 but before its journal write exposes three effects and two journaled keys; naive, journal-only and idempotent recovery produce three, one and zero duplicates.
4. Added lease/no-progress stops, focused and browser tests. The [checkpoint](docs/lab60-checkpoint.md) records verification and that no real payment or Managed session occurred.

```powershell
node --import tsx --test tests/lab60-durable-agents.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab60-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-60](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-60).

### Lab 61: How it was built, step by step

1. Registered a local bearer-protected MCP support/refund review service and [learner guide](Tab61-agent-as-mcp-server.md).
2. Implemented a narrow 2025-11-25 sessionful Streamable HTTP JSON/SSE transport with initialize, tools/list, tools/call and DELETE. Authentication precedes decoding and session lookup; host-issued bearer identities bind tenant/customer context.
3. Added a local MCP client that lists the typed tool, captures progress and host-validated structured output, and exercises cancellation, timeout and concurrent-call rejection. Transport request, MCP session and fictional agent-session IDs stay separate.
4. Added focused and browser tests. The [checkpoint](docs/lab61-checkpoint.md) records verification and the offline/protocol-version limits.

```powershell
node --import tsx --test tests/lab61-agent-mcp-server.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab61-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-61](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-61).

### Lab 62: How it was built, step by step

1. Registered an offline lexical retrieval workshop with owner-scoped routes, source viewer and [learner guide](Tab62-retrieval-rag.md).
2. Chunked fictional documents by heading into stable IDs and filtered current Acme documents before keyword/heading scoring. Archived 60-day and foreign 90-day policies never enter the result set.
3. Added a closed Zod-derived `search_knowledge` tool and `sevt_`-correlated host result. Reports require answer and exact returned evidence IDs/quotes; the host enforces the current 30-day policy.
4. Added focused and browser tests covering grounded, fabricated, wrong-policy, no-match and hostile-note cases. The [checkpoint](docs/lab62-checkpoint.md) records verification and the lexical/offline scope.

```powershell
node --import tsx --test tests/lab62-retrieval-rag.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab62-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-62](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-62).

### Lab 63: How it was built, step by step

1. Registered a disposable SQLite database exercise with owner-scoped routes, source viewer and [learner guide](Tab63-safe-database-agent.md).
2. Added narrow Zod-derived read/propose custom tools. Fixed parameterized SELECT queries include the host tenant; proposing records a versioned, expiring request and audit but does not cancel an order.
3. Added a separate human decision endpoint. Approval uses `BEGIN IMMEDIATE` and a tenant/status/version-checked UPDATE requiring exactly one changed row; reject, stale and expired paths change none, and query-only is restored.
4. Added focused and browser tests for isolation, rollback, replay and arbitrary-SQL refusal. The [checkpoint](docs/lab63-checkpoint.md) records verification and offline limits.

```powershell
node --import tsx --test tests/lab63-safe-database-agent.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab63-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-63](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-63).

### Lab 64: How it was built, step by step

1. Registered the browser lesson with a local fixture, guided controls, source viewer and [learner guide](Tab64-browser-playwright-mcp.md).
2. Pinned `@playwright/mcp@0.0.83` and connected it to a fresh host browser context through an in-memory MCP client. The [checkpoint](docs/lab64-checkpoint.md) records the required attached-context setting.
3. Restricted navigation and requests to the fixture, checked browser snapshot text, and retained owner-scoped PNG proof for the verified page. Fresh contexts close after each run.
4. Added focused integration and browser tests for the product, fictional form, blocked external URL, missing browser and proof access.

```powershell
node --import tsx --test tests/lab64-browser-playwright-mcp.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab64-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-64](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-64).

### Lab 65: How it was built, step by step

1. Registered a human-approval lesson with a local reviewer session, source viewer and [learner guide](Tab65-human-approval.md).
2. Added a closed custom-tool proposal whose immutable action, arguments, reviewer and expiry are separate from its `sevt_` event ID. The tool result only creates a pending proposal.
3. Added local-first notification, gated Slack/Teams/Graph delivery adapters and a reviewer decision endpoint. A unique SQLite business key executes the fictional archive once after a valid approval; reject, tamper, wrong reviewer, expiry and replay have no new effect.
4. Added focused and browser tests. The [checkpoint](docs/lab65-checkpoint.md) records verification and the local-identity limitation.

```powershell
node --import tsx --test tests/lab65-human-approval.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab65-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-65](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-65).

### Lab 66: How it was built, step by step

1. Attached a same-origin, cookie-authenticated WebSocket upgrade route to the existing HTTP server and registered the [learner guide](Tab66-realtime-websocket.md).
2. Added closed start/message/cancel/ack commands, sequenced events, 64-frame replay and bounds on payload, connections and buffered output. A reconnect repeats the start command without creating another run.
3. Streamed an authored offline custom-tool reply over a real socket. Explicit live mode reuses the Lab 01 Managed event consumer and cleanup port; no live run starts during setup or tests.
4. Added focused and browser tests for authorization, order, duplicates, replay, cancellation and shutdown. The [checkpoint](docs/lab66-checkpoint.md) records verification and limits.

```powershell
node --import tsx --test tests/lab66-realtime-websocket.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab66-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-66](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-66).

### Lab 67: How it was built, step by step

1. Registered a two-tenant workshop with synthetic sign-in controls and a [learner guide](Tab67-multi-tenant-saas.md).
2. Mapped opaque local tokens to host-selected tenant/project identities. Every run, session, source, transcript and cancellation checks that mapping; closed schemas reject tenant authority in caller input.
3. Added per-tenant concurrency reservations, illustrative usage quotas, request deduplication and a release/charge ledger. Failure and cancellation release once without charging.
4. Added focused and browser tests for foreign-object access, missing identity, concurrent tenants and admission limits. The [checkpoint](docs/lab67-checkpoint.md) records local simulation limits.

```powershell
node --import tsx --test tests/lab67-multi-tenant-saas.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab67-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-67](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-67).

### Lab 68: How it was built, step by step

1. Registered a scheduled/event-driven queue exercise and [learner guide](Tab68-scheduled-event-driven.md).
2. Mounted raw webhook bytes before JSON parsing and verified HMAC timestamp/body signatures against real time. Scheduling clock advances stay separate and owner-scoped.
3. Added coalesced ticks, event deduplication, synchronous worker claims, bounded retry/dead-letter behavior and cancellation. A closed triage tool records one SQLite effect per stable business key.
4. Added focused and browser tests. The [checkpoint](docs/lab68-checkpoint.md) records the local queue and explicit-worker limits.

```powershell
node --import tsx --test tests/lab68-scheduled-event-driven.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab68-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-68](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-68).

### Lab 69: How it was built, step by step

1. Registered an explicit-context document review exercise and [learner guide](Tab69-embedding-sdk.md).
2. Added correlated backend runs, preview/final outcomes, cleanup lookup and closed patch JSON. Applying a patch checks the original document identity, version and hash.
3. Authored a runnable [VS Code extension](extensions/lab69/README.md) with a trusted host, restricted webview, real-path file scope and reviewed editor-buffer edits. Provider credentials stay in Node backend configuration.
4. Tested file guards, stale messages, conflicts, disposal and the bundled extension under a mocked VS Code API. The [checkpoint](docs/lab69-checkpoint.md) distinguishes that evidence from an interactive extension launch.

```powershell
node --import tsx --test tests/lab69-embedding-sdk.test.ts tests/lab69-extension.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab69-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-69](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-69).

### Lab 70: How it was built, step by step

1. Registered a Python-client comparison exercise and [learner guide](Tab70-python-sdk.md), with an independent `anthropic==1.7.0` requirement verified from the installed official package surface.
2. Added a fixed-argument isolated Python worker and a narrow Node bridge with bounded JSON-lines output and diagnostics. Readiness never installs packages or calls a provider.
3. Implemented one-shot and retained session flows, Node-hosted custom-tool results, graceful cancellation and explicit cleanup evidence. Owner-scoped handles prevent caller-selected remote session IDs.
4. Tested real offline worker processes, malformed output, stderr bounds and retained ownership. After explicit venv setup, actual retained-session reuse, close and custom-tool tests passed; the [checkpoint](docs/lab70-checkpoint.md) records the live-discovered wire-type and shutdown fixes.

```powershell
node --import tsx --test tests/lab70-python-sdk.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab70-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-70](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-70).

### Lab 71: How it was built, step by step

1. Registered the data-analysis lesson and [71/71A guide](Tab71-data-analysis-agent.md) with a six-month CSV containing the specified quality defects and hostile note.
2. Added a bounded RFC 4180 reader, explicit duplicate/IQR cleaning, missing-cell handling, reductions, ratios of sums and period comparisons, tested with independent small fixtures.
3. Recorded validated computations as C IDs and SVG charts as G IDs. Closed host custom tools and the scripted analyst share the same ledger and report verifier; unsupported values, units, quality and chart IDs fail.
4. Added chart/report browser checks and tamper controls. The [checkpoint](docs/lab71-checkpoint.md) records the optional-live and causal-interpretation limits.

```powershell
npm run test:analysis
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab71-browser-demonstration.mjs
```

Independent private checkpoint: [Udemy-claude-managed-agents-Lab-71](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-71).

## Lab 72: How it was built, step by step

1. Authored the atmira-docx skill with progressive references, brand assets and a strict JSON document format.
2. Built a dependency-free deterministic OOXML writer with native Word styles, tables, list restarts, classification and page footer.
3. Added three closed host tools, per-run skill copies and hash checks, fixed no-shell execution and independent ZIP/document inspection.
4. Added incident, ordinary, injection, invalid-spec, placeholder and tamper exercises, owner-scoped opaque downloads and command policy probes.
5. Tested deterministic bytes and failure gates, opened both sample documents read-only in Word and inspected exported page images. Cloud upload and model execution remain explicit separate setup.

## Lab 73: How it was built, step by step

1. Created an actual disposable Git fixture with main, feature, a rounding bug and behavioral Node tests.
2. Parsed changed-line mappings and routed only high-confidence actionable findings to the constrained fixer.
3. Added closed role tools, path/junction checks, scrubbed fixed process arguments, scope/diff/test-gaming gates and bounded attempts.
4. Committed only after host checks, reran the full fixture suite, and retained patch, hashes and ready/draft handoff evidence.
5. Tested all six scenarios and demonstrated browser gates at desktop and mobile widths. No fixture GitHub push or billed model call occurs.

## Lab 74: How it was built, step by step

1. Authored thirteen fictional prompt-injection attacks across tickets, email, KB, web and third-party metadata.
2. Built a worst-case scripted model, closed support tools and a ledger separating attempted from executed fictional effects.
3. Added five cumulative layers, bounded normalization, metadata pins and independent output/effect/utility checks.
4. Added a defense matrix, per-goal statistics, clean-inbox utility gate, bounded adaptive mutations and sanitized report download.
5. Tested known compromises, denied effects, encoded canaries, detector bypass and safety/utility regression gates without external traffic.

## Lab 75: How it was built, step by step

1. Authored issue 7 and a disposable notes API fixture with unchanged main and a separate integration worktree.
2. Validated closed plans, ownership, new tests and acyclic dependencies before creating worker branches.
3. Bound role tools and board messages to trusted task identities, fixed file scope and bounded process/test handlers.
4. Verified real worker changes and tests, committed with task trailers, and integrated serially before review/rework.
5. Added host-only acceptance probes, a durable hash-chained journal, cost reservations, safe replay and a ready/draft release gate.
6. Connected scripted and dedicated Managed role adapters through the same orchestrator, then tested all seven offline scenarios and provider-shaped injected fixtures. The final course audit checks every registered lesson and distribution boundaries.
7. Provisioned three pinned role agents after explicit authorization and ran the actual live team. Fixed the issue contract, review feedback and empty rework gate exposed by the first draft. The Unicode follow-up also reached Ready without reviewer questions; all seventeen sessions across three attempts were archived. [Live evidence and limits](docs/course-validation.md) record reported costs and remaining infrastructure prerequisites. The configured key stays unchanged at the user's request.

### Integration verification follow-up

Run npm run integrations:ready to inspect missing setup without provider calls or secret values. Lab 65 exposes validated per-channel readiness and explicit send controls. Lab 69 now has a repeatable actual-editor check: npm run test:editor:real. Installed VS Code 1.142.0 passed guided patch application and concurrent-edit rejection in an isolated fictional workspace. See docs/course-validation.md for verified results and external prerequisites.

Azure Monitor is the selected external telemetry target. Lab 44 has an official Azure exporter and a dedicated monitoring template; the explicitly approved North Europe deployment is configured locally and accepted a five-span ingestion test, with all five records verified by query. The existing Anthropic key is preserved. Personal Microsoft email notifications have an interactive delegated sign-in helper; see [Lab 65 setup](docs/lab65-checkpoint.md). External delivery requires explicit consent and local credentials.

## Repeatable interface and live audit

Run `npm run test:ui:audit` for all 75 lesson interfaces at desktop and phone widths without exercise submissions. Run `node scripts/run-browser-tests.mjs "lab[0-9]+\.spec\.ts"` for the offline lesson interaction suite.

After explicitly authorizing billed tests, run `node --env-file-if-exists=.env --import tsx scripts/live-learning-smoke.ts --execute-authorized-live-tests` for options, system instructions and configured skill variants. This runner creates at most six sessions with ten-cent session budgets and stops after an error or unresolved cleanup. Existing course, host integration and team smoke scripts cover their separate configured live paths. These checks do not establish every optional integration works. See [audit results and remaining setup](docs/course-validation.md#full-interface-and-bounded-live-audit-18-october-2026).
