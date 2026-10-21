# Build the Claude Managed Agents learning platform from zero

A copyable prompt curriculum for Udemy students. Authored 20 October 2026 against source 963cbbf; navigation revised 21 October 2026 to remove the duplicate numbered lesson button grid. Start with an empty folder and build the application incrementally; the finished instructor repository is an optional read-only reference, not a prerequisite application to clone. This replaces the earlier assumption that the first five labs or the app shell already exist.

## What you will build

All 75 Managed Agents lessons and 11 detailed extensions; the responsive shell, safe source views, guides and exact spoken-fragment highlights; optional progress, notes/backups, quizzes/paths/review, milestones and solutions; 150 astronaut infographics with zoom/pan and 900 timed regions; 525 lesson and 150 visual recordings; offline/browser checks, explicit live acceptance, sanitized packaging and release delivery.

## Choose how to read

Use [WORKBOOK.md](WORKBOOK.md) for one complete document, or open the smaller step files from the sequence below. Each COPY PROMPT block is a complete request to your coding assistant. Copy only one at a time, let it implement and verify the step, inspect the result and save a working checkpoint before continuing. Recovery prompts are at the end.

## Prerequisites

Use an AI coding assistant with local file/terminal access, Node 24 or newer, Git and VS Code or another editor. Chrome is used by browser checks. Windows examples use PowerShell and npm.cmd; use npm on other systems. The reference folder is claude-managed-agents, but it can live anywhere. Dependency installation and obtaining instructor materials need internet access. Local fixtures and included audio playback need no model or Inworld key.

## Build order

1. [Build the foundations](01-foundations.md)
2. [Build lessons 1 through 15](02-lessons-01-15.md)
3. [Build lessons 16 through 30](03-lessons-16-30.md)
4. [Build lessons 31 through 45](04-lessons-31-45.md)
5. [Build lessons 46 through 60](05-lessons-46-60.md)
6. [Build lessons 61 through 75](06-lessons-61-75.md)
7. [Build the complete learning experience](07-learning-experience.md)
8. [Verify and deliver the platform](08-quality-and-delivery.md)
9. [Final parity checklist](11-final-parity-checklist.md) and [recovery prompts](09-recovery.md).

Complete the numbered lessons in order. Insert 50A/50B after L50, 71A after L71, 72A after L72, 73A after L73, 74A after L74 and 75A through 75E after L75. The small chapter indexes already insert them correctly. Learning features follow the 75 lessons so every catalog can reference actual implemented content.

## Media reuse and new media authoring

**Recommended no-key student path:** build the application code from zero, then reuse the instructor-provided media and matching authored data when you reach P02/P05/P14. Obtain the licensed media from the v0.2.0 source ZIP or a teacher-provided equivalent. Copy public/audio/guides, public/audio/infographics and public/infographics, including manifests/timing JSON. Use [course.json](reference-data/course.json) and [media-catalog.json](reference-data/media-catalog.json) to reproduce the exact spoken text, segment/region IDs, guide actions, image dimensions/boxes and file identities. Their structure is authored teaching data, not a complete app implementation. Do not change text and pretend the old recording still matches. Access to the private repository must be granted or supplied through Udemy downloads.

**Author path:** write your own teaching text and create new images/recordings deliberately. The [150 image prompts](image-prompts/README.md) include topic-specific astronaut poses and observed corrections. New images need fresh visual review and measured boxes. New Inworld MP3s need the author's separate paid account, real WORD timestamps and decode/hash checks; FFmpeg/ffprobe is an author prerequisite. Image tools may also have account/cost requirements. This workbook does not authorize billed generation or live calls. Students playing supplied media need neither service key.

## Verification and honest limits

A prompt is an implementation specification, not evidence that its output works. Compare actual files/UI and run the stated checks. During the early build count only registered implemented lessons; require all 75 and complete media inventory only at the final gate. Report unsupported live adapters and missing external configuration rather than simulating a live success. Never use a web/desktop login as a substitute for the app's server-side API key. Keep keys out of chat, Git, notes, browser storage and source views. Local owner headers and worktrees are teaching boundaries, not production authentication or OS containment.

The pinned source documents what was implemented; later official APIs, available models and dependency versions may change. [reference-versions.json](reference-data/reference-versions.json) records the frozen dependency/script inventory. Inspect installed official types and current primary documentation for a provider-specific operation instead of guessing. A from-zero replay has not been executed for this entire curriculum, and an AI rebuild is not guaranteed pixel- or byte-identical. [coverage.json](coverage.json) maps the authored build steps, all lessons and image prompts.

The student prompt ZIP contains Markdown and authored reference JSON, not the large media files, credentials or runtime evidence. The instructor supplies the media archive separately.

## Your first coding session

1. Extract this prompt ZIP into a reference folder outside the empty app folder. Give your coding assistant read access to that reference folder, especially its reference-data files.
2. Create a separate empty application folder and open it in your editor/assistant. Do not run these build prompts over the instructor application or an unrelated project. Replace C:/claude-managed-agents in an older lesson brief with your own application path.
3. Open steps/F01.md, copy the text between COPY PROMPT START and COPY PROMPT END, and send it to the assistant. Do not paste the entire 120-prompt workbook into one request.
4. Run the checkpoint commands and inspect the result. Continue to F02 only after F01 works. Keep a checkpoint after each successful step so a later failure can be repaired locally.

There are 117 ordered implementation/delivery prompts and three recovery/parity prompts, for 120 total. The 150 image-tool prompts are additional separate assets. If the assistant cannot read the reference folder, attach the specific JSON or prompt file needed by that step. Local build steps do not authorize optional paid recording, live sessions or publication.


---

# Complete implementation prompts

## F01 Start with an empty workspace

Create the project and local development commands before implementing lessons.

COPY PROMPT START

````text
Begin in the empty student workspace; no application exists yet. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Build a Claude Managed Agents learning platform from an EMPTY folder named claude-managed-agents. Do not clone the completed instructor application or assume any existing application files. Inspect the empty folder and preserve any unrelated user files. Use Node 24 or newer, Git, React, Vite, strict TypeScript, Express and Zod. This course teaches the Managed Agents cloud API, not the Claude Agent SDK query API.
Create package.json, a lockfile, tsconfig.json, index.html, src/main.tsx, src/App.tsx, server/index.ts, shared/contracts.ts, .gitignore and .env.example. Establish src/components, src/concepts, src/lib, src/lessons, server/concepts, server/lib, shared, tests, browser-tests, fixtures, public and docs. The reference-data files live in the separately downloaded workbook folder, which the student supplies as read-only input. Read reference-data/reference-versions.json there and pin its resolved dependency versions when reproducing the frozen course; generate a lockfile. Do not assume those files are already in the empty app. If a pinned dependency cannot be installed, report that fact; do not silently invent or substitute an API version.
Create dev, dev:server, dev:web, typecheck, build, test:offline and test:browser scripts. Use a Node child-process supervisor that owns the backend directly, sets windowsHide, restarts on authored source changes and closes children on shutdown. Frontend defaults to 127.0.0.1:5174 with next-free-port fallback; backend defaults to 127.0.0.1:3076. Vite proxies /api, including WebSocket upgrades, to the configured backend. Add GET /api/health and a visible app heading. Keep credentials server-only, ignore .env and runtime folders, and default live execution to disabled. Installation, startup and build make no model requests.
Give exact PowerShell startup commands and verify the health endpoint, visible page, typecheck, production build and clean shutdown. Do not create all 75 placeholder lessons or report unbuilt lessons as implemented. At this checkpoint an empty lesson registry is correct.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## F02 Build the application shell and lesson registry

Provide a real navigation and lesson contract that grows with each implementation.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Build the shared shell on the project from F01. Add a header, Home, searchable lesson navigation grouped by topic or lesson order, desktop sidebar, phone menu, light/dark theme and accessible main content. Create shared/lessons.ts, shared/learning-content.ts, src/lessons/content.ts, src/lessons/registry.ts, src/lessons/resources.ts and src/lessons/catalog.ts. Reserve numeric IDs 1 through 75 separately, but register and count only implemented lessons. Use the searchable desktop sidebar or mobile menu and previous/next links below the lesson to change lessons. Do not render a duplicate Lab 01-75 button grid or numbered lesson strip above the main workspace. Keep the lesson heading, guide shortcuts and all lesson workspace tabs, including infographic views.
Use strict lesson metadata: id, title, topic, serverPrefix, objective, steps, inspect paths and challenge. Require /api/c followed by the unpadded numeric ID, unique IDs and a real React component. Each lesson initially has Learn, Run the exercise and TypeScript source tabs. Numeric ?lesson= navigation supports refresh and browser history. Add shared lesson workspace, labeled forms, readable output, status/error presentation and scoped code scrolling. Tab changes preserve mounted exercise inputs and results; do not rebuild the experiment merely to view source. Add semantic tabs, visible focus, reduced-motion support and mobile layout without page overflow.
Home must describe implemented lessons truthfully; no fabricated success or progress badges. Navigation and source viewing must not POST an exercise or contact a provider. Add shell/registry tests and a browser harness usable before all labs exist. Verify desktop and 390px views. Preserve the empty registry until L01 is implemented.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## F03 Create transport event and execution boundaries

Separate browser transport, host verification and optional provider adapters.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Before adding individual labs, create shared SSE framing, request validation, a browser event consumer and server execution utilities. The browser calls the local Express host; only server adapters can call Managed Agents. Define injectable ports so deterministic authored fixtures and optional live adapters feed the same host consumer. Implement bounded request bodies, strict schemas, owner binding, prompt limits, deadlines, concurrency slots, cancellation and cleanup in finally blocks. No automatic billed retry is permitted.
Keep transport frames, provider session identity, local run/turn IDs, agent text and verified outcomes separate. Write reusable server/lib/sse.ts, src/lib/sse.ts, server/lib/session-events.ts, server/lib/managed-config.ts and suitable contract/runner modules. Open a remote event stream before sending user.message. Use installed official SDK declarations to implement provider shapes; do not guess Agent SDK init/result messages or unsupported parameters. A local EOF is incomplete, and a local AbortController does not prove remote interruption.
Make app resources owner-scoped. Reject unknown and foreign handles. Define explicit offline/scripted versus managed-api evidence sources and unknown/pending cleanup states. Add deterministic parsing tests for split SSE chunks, duplicate persisted IDs, transport errors and cleanup. Add a safe Markdown presenter for final prose that leaves raw HTML inert, blocks unsafe URL schemes and never loads embedded resources. Do not authorize external writes merely because model text requests them.
Provide only contracts required by the next lesson; grow adapters as later lifecycle semantics require. Verify typecheck, unit tests and build without provider credentials.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## F04 Create safe teaching resources and development checks

Expose authored sources without exposing runtime files or holdouts.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement the source and detailed-guide catalogs for the growing registry. Bundle only explicit authored UI, server and shared source extensions and registered TabN guide Markdown. Reading a source tab never executes that file. Resolve relative imports inside the allowlisted catalog and show useful missing-resource errors. Never expose .env, Git internals, local resource settings, runtime stores, credentials or server/acceptance holdouts through source views or the Vite dev server. Keep Vite filesystem denial for private acceptance sources and runtime folders.
Create audit:lesson-guides and test:lesson-guides scripts. For implemented lessons require a guide with Prerequisites, Controls, Evidence to inspect, Troubleshooting, Limitations and Challenge sections, nonempty real UI/server sources, registered inspect paths and matching /api/cN route metadata. Until all lessons are built, audit the implemented set rather than falsely claiming 75 completed lessons. Add test:dev-server for startup, meaningful authored edits, inert runtime writes, Windows workspace aliases and child cleanup. Keep API keys absent from source catalogs and browser responses. Run the checks sequentially with build before distribution scanning. Show actual results and limitations.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## F05 Configure the optional Managed Agents runtime

Create local readiness and explicit provider setup before L01.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Configure the existing application to run Claude Managed Agents labs in offline and live modes.
Goal: Establish reusable configuration, authentication, resource setup, diagnostics and execution boundaries before implementing individual labs. Preserve existing lessons and follow the repository’s conventions.
Inspect the repository first, including its instructions, package scripts, server configuration, adapters, SSE transport and environment loading. Implement the setup incrementally. Use the Anthropic TypeScript SDK for Managed Agents; verify supported APIs and the required beta header against the installed SDK and current official documentation.
Configuration:
•	Create or update .env.example with placeholders and explanatory comments.
•	Support server-side ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.
•	Add application settings for live-mode enablement, request deadline, maximum concurrent sessions and maximum session list cost.
•	Clearly document which names are application configuration variables and how they map to provider API fields.
•	Default to offline mode with live execution disabled.
•	Validate configuration before live execution. Offline mode must work without credentials or remote resource IDs.
•	Preserve existing .env values. Ensure local secret files are ignored by Git.
API key handling:
•	Document how I obtain an API key from Claude Console and configure it locally.
•	Provide PowerShell instructions for entering the key without displaying it or placing the literal secret in shell history.
•	Keep the key exclusively on the server. Never expose it through Vite variables, browser storage, client bundles, API responses, logs or source-view tabs.
•	Do not ask me to paste my key into chat. Do not print or inspect its value.
•	Explain that the application authenticates through the API key; a Claude desktop or web login does not configure the application’s API access.
Managed Agents resources:
•	Support using existing agent and environment IDs.
•	Prepare an explicit provisioning script and configuration files for a dedicated Lab 01 agent and cloud environment.
•	Configure the Lab 01 agent with no tools or MCP servers. Use a configurable model supported by Managed Agents and available to my account.
•	Keep later tool-enabled labs separate so their configuration cannot silently alter Lab 01.
•	Verify resource schemas against current official documentation; do not invent fields.
•	Make provisioning an explicit manual command, separate from installation, application startup, tests and build.
•	Record returned resource IDs without recording credentials. Document reuse and any version-pinning support.
•	Do not create an agent, environment or session automatically.
Shared runtime:
•	Provide a reusable server-side Managed Agents client factory and configuration module.
•	Integrate with the existing host/adapter/SSE boundaries.
•	Keep offline fixtures and live execution behind the same adapter contract.
•	Enforce prompt validation, deadlines, concurrency limits and a documented provider session budget.
•	Use dedicated sessions owned by each lab request.
•	Establish the event stream before sending the user message.
•	On cancellation or deadline expiry, attempt a bounded remote interruption before closing local resources. Report interruption failures clearly.
•	Release timers, streams and concurrency slots on all exit paths.
•	Do not implement automatic live retries that could duplicate user messages or billed sessions.
Diagnostics:
•	Add a local readiness command or endpoint reporting offline availability, live enablement, missing configuration and installed SDK compatibility.
•	Distinguish “configured locally” from “verified against the provider.”
•	Local readiness must not make provider requests.
•	Prepare a separate, explicitly invoked remote verification command that checks authentication and access to the configured resources without starting agent work.
•	Return useful errors for invalid credentials, inaccessible resources, unsupported SDK features, rate limits and provider failures. Redact secrets.
•	Show clear Offline and Live labels in the UI, and disable live execution when configuration is incomplete.
Documentation:
•	Add a setup guide covering prerequisites, dependency installation, API key entry, resource provisioning or reuse, configuration, local readiness, offline startup and optional live verification.
•	Explain which operations contact Anthropic and which can incur charges.
•	Provide exact PowerShell commands using this repository’s actual scripts.
•	Include troubleshooting and a minimal .env.example.
•	Explain that cloud Managed Agents run remotely; local Claude Code authentication, Docker and a locally running Agent SDK process are not prerequisites for this cloud setup.
•	Expose actual configuration and adapter source in the platform’s source views, excluding secret files.
Verification:
•	Add focused offline tests for configuration validation, missing credentials, offline operation without credentials, live-mode gating, secret redaction and concurrency-slot cleanup.
•	Include them in test:offline.
•	Run typecheck, focused tests, applicable guide checks and build; fix failures.
•	Review the diff and checkpoint only after checks pass.
•	Report implemented files, validation results and the exact manual steps I still need to perform.
Do not run provisioning, remote verification, live sessions or other billed/external actions automatically. Do not leave development servers running after verification.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L01 Session event streaming

Consume a Managed Agents event stream and tell agent response text apart from session lifecycle events and turn completion.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 01 Session event streaming after the preceding lesson. Goal: Consume a Managed Agents event stream and tell agent response text apart from session lifecycle events and turn completion.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c1. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept01Query.tsx
- server/concepts/01-query.ts
- server/lib/session-events.ts
- server/lib/lab01-run.ts
- server/lib/lab01-port.ts
- server/lib/lab01-fixtures.ts
- shared/lab01-events.ts
- Tab1-query.md

Implementation brief
Implement Lab 01 session event streaming. Goal: Consume a Claude Managed Agents event stream and distinguish agent response text from session lifecycle events and turn completion.
Build this incrementally in the existing platform; create the lesson files and supporting fixtures from scratch. Register the numeric lesson, topic and /api/c1 router, add content.ts metadata and a complete Tab1 guide, and expose the actual UI/server/support source as text. Use the shared host/adapter/SSE boundaries, strict validation, mode labels, cancel/deadline/concurrency limits and useful errors. Keep completed labs working.
Create or update src/concepts/Concept01Query.tsx; server/concepts/01-query.ts; Tab1-query.md. Preserve these filenames and POST /api/c1/query for platform compatibility; explain that “query” is the local lesson operation.
Build: Build a prompt form and a Managed Agents adapter using the Anthropic TypeScript SDK. Verify API signatures against the installed SDK and current official documentation. Use the required Managed Agents beta header and keep credentials server-side.
For live mode, create a dedicated session using explicitly configured agent and environment IDs. Use an agent configured with no tools or MCP servers for this lesson. Open and establish the session event stream before sending a user.message containing the prompt, then consume events with for await. Use the session creation response for metadata; do not invent an SDK-style system/init event. Follow the documented session creation and event-sending APIs.
Render session metadata, agent text blocks, raw events and the turn outcome separately. Derive the outcome from session.status_idle.stop_reason or session.error. Treat end_turn as completed only when no local cancellation or deadline has occurred; display requires_action and budget_reached as distinct paused outcomes. An unexpected stream ending is incomplete, never successful. Do not synthesize a provider “result” message or append response text again when the turn finishes.
Enable agent.message previews through event_deltas. Accumulate event_start/event_delta previews by event ID and content-block index. Replace each preview with its authoritative agent.message content when it arrives; never concatenate both. Deduplicate persisted events by event ID without discarding multiple deltas for the same preview. If a preview never receives its authoritative message, mark it incomplete. Do not use includePartialMessages or assume Agent SDK message shapes.
Experiment: Provide deterministic fixtures for:
•	A normal turn: running → preview start/deltas → authoritative agent.message → idle with end_turn.
•	A session.error.
•	A stream that ends before turn completion.
•	Repeated persisted events and partial previews.
•	Idle with requires_action or budget_reached.
•	Cancellation and deadline expiry.
Include documented span events where relevant. Assert the exact order of each fixture without assuming every live stream has an identical event sequence. Offline and live modes must use the same event consumer.
Live execution must have a deadline, concurrency cap and documented session budget. Cancellation or deadline expiry must attempt user.interrupt for the session owned by this request, using a separate bounded cleanup request before closing the stream. Aborting the local connection alone must not be presented as stopping remote execution. Report unconfirmed interruption clearly; release timers, stream resources and concurrency slots on every exit path.
Verify: Assert fixture event order, preview replacement without duplicate text, persisted-event deduplication, correct completion/paused/error/incomplete/cancelled/deadline outcomes, empty-prompt rejection before provider calls, stream establishment before prompt submission, and cancellation cleanup.
Reference route inventory under /api/c1: POST /query. Use the platform’s existing cancellation mechanism, or explicitly document any additional route required.
Add focused deterministic tests for the specified cases and include them in test:offline. Run typecheck, focused tests, lesson-guide checks and build; fix failures. Give PowerShell commands and demonstrate the browser flow in offline mode. Review the diff and checkpoint only after checks pass. Do not create remote resources, invoke live sessions, or run billed or external actions automatically.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

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

Baseline and comparison
1. Run the Normal turn fixture offline and watch the four panels fill separately: session, agent text, raw events, outcome.
2. Find where the preview text is replaced by the authoritative agent.message instead of being appended to it.
3. Run Repeated events, Stream ended and Session error and compare the outcomes.
4. Run Requires action and Budget reached to see paused turns that are not successes.
5. Start Cancel, press Cancel query, and read the guide section on what a local abort does and does not stop.

Student challenge
Ask for three bullet points. Identify the authoritative agent.message containing them and the lifecycle event confirming that the turn finished.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab01-query.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L02 Session options

Control a dedicated Managed Agents session with model and system overrides, a list-cost budget, connection previews and a local deadline.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 02 Session options after the preceding lesson. Goal: Control a dedicated Managed Agents session with model and system overrides, a list-cost budget, connection previews and a local deadline.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c2. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept02Options.tsx
- server/concepts/02-options.ts
- shared/lab02-options.ts
- server/lib/lab02-port.ts
- server/lib/lab02-run.ts
- server/lib/lab02-fixtures.ts
- server/lib/lab01-run.ts
- server/lib/session-events.ts
- Tab2-options.md

Implementation brief
Implement Lab 02 Session Options. Goal: Control a Managed Agents turn with model and system-prompt overrides, a session budget, text previews and a local execution deadline.
Build this incrementally in the existing platform; create the lesson files and supporting fixtures from scratch. Register the numeric lesson, topic and /api/c2 router, add content.ts metadata and a complete Tab2 guide, and expose the actual UI/server/support source as text. Use the shared host/adapter/SSE boundaries, strict validation, mode labels, cancel/deadline/concurrency limits and useful errors. Keep completed labs working, including Lab 01.
Create or update src/concepts/Concept02Options.tsx; server/concepts/02-options.ts; Tab2-options.md.
Build: Add controls for:
•	Model, selected from a server-owned allowlist.
•	System prompt, with explicit Inherit, Override and Clear choices. Bound override text length.
•	Session list-cost budget, entered as integer US cents and displayed as both cents and dollars.
•	Text previews, enabled or disabled for this stream connection.
•	Local deadline in seconds, bounded by the platform’s server policy.
Explain the migration: maxTurns, maxBudgetUsd and includePartialMessages are Agent SDK options. Do not send them to Managed Agents or invent equivalent provider fields. This lab’s deadline limits local waiting and triggers an interruption attempt; it does not limit the number of model requests.
Create a fresh dedicated session for each experiment. Apply model and system changes through the documented agent_with_overrides form of sessions.create. Preserve the configured base agent ID and version policy. Overrides must affect only this session; never update the shared agent resource. Keep the effective agent text-only, without tools, MCP servers, skills requiring tools, or multiagent workflows.
Verify API signatures against the installed Anthropic TypeScript SDK and current official documentation. Validate all selections and bounds server-side before any provider call. A locally allowed model is not proof of account access; surface provider rejection clearly.
Show requested options separately from the effective configuration returned by session creation. Identify inherited, overridden and cleared values. Keep credentials server-side.
Map the budget to budget.type="limit" and budget.max_list_cost with currency="USD" and amount as an integer-cent string. Enforce a server-owned maximum and always attach a budget for live runs. Format provider amounts correctly: amount "50" means 50 US cents ($0.50), not $50.
Open and establish the upstream event stream before sending user.message. When previews are enabled, request event_deltas=["agent.message"]; otherwise omit the preview opt-in. Both modes must still receive authoritative agent.message events.
Reuse Lab 01’s event consumer and preview reconciliation. Accumulate previews by event ID and content-block index, then replace them with authoritative message content. Deduplicate persisted events by ID; do not deduplicate preview fragments merely because they share an event ID or identical text.
Render text previews, authoritative messages, lifecycle events and turn outcomes separately. Preview fragments are text, not measured tokens. Display reported token usage from documented span or session usage fields separately, with its scope labeled. Do not add overlapping span and session totals together, count preview text as tokens, or invent usage for offline fixtures.
Experiment: Provide deterministic fixtures for:
•	Normal completion with end_turn.
•	The same authoritative response with previews enabled and disabled.
•	A budget pause with budget_reached.
•	A local deadline followed by an interruption attempt.
•	A terminal session error.
•	Requires_action and a stream ending without completion.
Fixtures must use Managed Agents event shapes. Do not replay SDK-specific error_max_turns or error_max_budget_usd results.
Provide an experiment table recording the prompt, requested options, effective options, outcome, reported usage and cleanup status. Hold prompt and model fixed when comparing budget, deadline or preview settings. Change one variable per comparison; change the model only in a dedicated model comparison. Offline fixtures illustrate behavior and must not be presented as measurements of Claude.
Verify:
•	Reject unknown fields, legacy SDK options, invalid models, invalid prompt settings and out-of-range limits before provider calls.
•	Confirm session overrides leave the shared agent unchanged.
•	Assert stream establishment before prompt submission.
•	Assert previews enabled/disabled produce the same authoritative text without duplication.
•	Report budget_reached as paused, not completed or an SDK budget error.
•	Distinguish local deadline expiry, cancellation, terminal provider errors and incomplete streams.
•	Attempt bounded user.interrupt for this request’s session using an independent cleanup request before closing upstream resources.
•	Release timers, streams and concurrency slots on every exit path; report unconfirmed remote interruption clearly.
•	Verify integer-cent mapping and currency display.
Explain that the provider checks the budget between model requests. The request crossing the threshold may finish beyond it, so do not promise an exact spending ceiling. List cost is distinct from billed cost. Reducing a budget does not guarantee a particular live outcome; completion may happen before the threshold is reached. Do not automatically increase budgets or resume paused work.
Reference route inventory under /api/c2: POST /query. Use the existing platform cancellation mechanism.
Add focused deterministic tests for the specified cases and include them in test:offline. Run typecheck, focused tests, lesson-guide checks and build; fix failures. Give PowerShell commands and demonstrate the browser flow offline. Review the diff and checkpoint only after checks pass. Do not run provisioning, live experiments, billed or external actions automatically. Stop temporary development servers after verification.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Control one Managed Agents turn with session-local overrides, an integer-cent list-cost budget, connection previews and a local deadline.

## Prerequisites

Use Node 24 or newer and the installed Anthropic TypeScript SDK 0.133.0. Lab 01 should work first. Offline mode requires no credentials, provisioning or account access. Run from this workspace in PowerShell:

```powershell
npm run dev
```

Open http://127.0.0.1:5174/?lesson=2 and select **Run the exercise**. If your NVM installation blocks npm, execute the installed entrypoints directly:

```powershell
node scripts/dev-server.mjs
# In a second PowerShell window:
node node_modules/vite/bin/vite.js
```

Live runs are optional, billed and require explicit use of the live control. Keep the key on the server. See docs/managed-setup.md for existing resource configuration; do not provision just to run fixtures. MANAGED_AGENT_VERSION pins a positive integer version when set; otherwise the existing latest-version policy is preserved. The server never updates the shared agent.

## Controls

- **Model** comes from the authored server allowlist in shared/lab02-options.ts. Local acceptance does not prove account access. A provider rejection is shown as an error with HTTP status; check account access and model availability manually.
- **System prompt**: Inherit omits `system`, Override sends bounded nonempty text (up to 4000 characters), Clear sends `system: null`. Empty override text is invalid. All changes affect only the fresh session.
- **Session budget (US cents)** is an integer from 1 to 500. 50 cents displays $0.50 and maps to `budget: { type: "limit", max_list_cost: { currency: "USD", amount: "50" } }`. Every live session has a budget. List cost uses public prices and differs from billed cost.
- **Text previews** opt in with `event_deltas: ["agent.message"]` for this stream connection. Disabled mode omits that field. Both modes still receive authoritative `agent.message` events.
- **Local deadline (seconds)** is an integer from 1 to 120 and cannot exceed MANAGED_DEADLINE_MS on the server. It bounds local waiting and triggers an independent interruption attempt; it does not count or cap model requests.
- **Offline scenario** chooses authored behavior. Normal, repeated-events, budget-reached, deadline, cancel, terminal session-error, requires-action and stream-ended are supported. Cancel query aborts the browser POST, following the existing platform mechanism.

The effective agent is text-only. Session creation clears tools, MCP servers and skills. Multiagent configurations cannot be cleared through this override form, so the server rejects a multiagent base agent before creation and guards the returned session before sending the prompt.

## Migration

`maxTurns`, `maxBudgetUsd` and `includePartialMessages` belong to the Agent SDK. They are rejected here, never forwarded to Managed Agents and never translated into invented provider fields. A local deadline is not a turn limit. Connection event deltas are not SDK partial messages. Budget pauses are not `error_max_budget_usd` or `error_max_turns` results.

The adapter calls `sessions.create` with `agent.type="agent_with_overrides"`, the configured base ID and optional pinned version. The response's resolved `agent` is the effective snapshot. Requested options appear separately, including whether the system was inherited, overridden or cleared. Model replacement also replaces the base model configuration (including its effort or inference geo settings); this lab uses the selected model's defaults.

Signatures were checked against the installed SDK and the official [session creation guide](https://platform.claude.com/docs/en/managed-agents/sessions), [create API reference](https://platform.claude.com/docs/en/api/beta/sessions/create), and [session budget guide](https://platform.claude.com/docs/en/managed-agents/budgets). Provider access is not verified by offline tests.

## Experiment

1. Leave prompt, model, system, budget and deadline fixed. Run Normal turn with previews enabled, then disable previews and run again. Both authoritative responses must match and appear only once per run. Session IDs must differ.
2. Re-enable previews and hold all other controls fixed. Select Budget reached, then reduce only budget. This deterministic fixture illustrates a pause; it does not measure whether Claude would reach that budget.
3. Hold prompt, model, system, budget and previews fixed. Select Deadline expires, set the deadline to 1 second and run. Observe deadline, simulated interruption and simulated cleanup. Compare a longer deadline using the same scenario; it still waits until that local limit, because the fixture intentionally never completes.
4. Run Session error, Requires action and Stream ends early. Distinguish error, paused and incomplete outcomes.
5. For a model comparison, hold every other option and the prompt fixed and change only the model. Offline text remains authored; live model comparisons require manual billed runs.

The experiment table records the last 20 results: prompt, mode/source, requested settings, effective settings, outcome, reported usage and cleanup/interruption status. It lives in this mounted exercise and is cleared by navigation or refresh. Browser cancellation records a local cancellation row with unknown effective configuration and unconfirmed interruption; the connection is closed, so the server's eventual cleanup result cannot reach the table. This uncertainty also applies to fixture cleanup after disconnection.

## Evidence to inspect

The route inventory under `/api/c2` is **POST /query**. UI/server source tabs show the actual implementation and link to supporting source as text, without exposing secrets or runtime resource files.

Inspect shared/lab02-options.ts for strict schemas and cents formatting; server/concepts/02-options.ts for validation, concurrency and SSE hosting; server/lib/lab02-port.ts for session overrides and stream-before-send; server/lib/lab02-fixtures.ts for authored Managed Agents event shapes; server/lib/lab02-run.ts for reported span usage; server/lib/session-events.ts and server/lib/lab01-run.ts for the shared event consumer and cleanup.

Previews accumulate by event ID and block index. Repeated fragments, even identical ones, must all be applied. Persisted events deduplicate by ID. Authoritative messages replace previews. Lifecycle events and turn outcomes have separate panels.

Reported tokens come only from documented `span.model_request_end.model_usage` fields. The scope is model-request spans received on this connection, not the whole session. Cache read/creation usage is shown separately. Do not add overlapping session totals, estimate tokens from preview characters or treat fixture events as measured usage. Offline usage is explicitly not reported.

## Troubleshooting

Unknown fields, legacy options, unlisted models, invalid system choices, fractional cents and out-of-range limits return 400 before provider calls. Live configuration problems return 422. Capacity returns 429. Check field errors, not just the top-level message. Model/account/provider rejection yields an error outcome rather than silently falling back to another model.

Deadline and cancellation stop local waiting first. The runner attempts bounded `user.interrupt` using an independent request before aborting the upstream stream, then checks idle/terminated status. Remote interruption is confirmed only when the send succeeds and a stopped status is observed. Otherwise it is unconfirmed: check Claude Console manually. Authored fixtures report simulated interruption, never a remote confirmation. Idle sessions are archived; cleanup failure or unknown status is pending. No prompt means no interruption is needed.

## Limitations

The provider checks budget between model requests. The request crossing the threshold may finish beyond it, so this is not an exact spending ceiling. Lowering a budget does not guarantee a budget pause; completion may happen first. `budget_reached` means paused, not completed. This lab never increases a budget or resumes work automatically.

Stream EOF is incomplete unless a completion lifecycle event was observed. A terminal session error, local deadline, browser cancellation and requires_action remain distinct outcomes. Offline scenarios demonstrate event interpretation, not Claude performance, spend or latency. Creation itself is a bounded provider request and can outlast the local waiting deadline so its returned ID remains available for cleanup.

## Verification

Run in PowerShell:

```powershell
npm run typecheck
node --import tsx --test tests/lab02-options.test.ts
npm run test:offline
npm run test:lesson-guides
npm run audit:lesson-guides
npm run build
node scripts/run-browser-tests.mjs lab01.spec.ts lab02.spec.ts
```

For an NVM npm-wrapper restriction, use `node node_modules/typescript/bin/tsc --noEmit`, `node --import tsx --test --test-concurrency=1 tests/*.test.ts`, `node --import tsx scripts/audit-lesson-guides.ts`, and `node node_modules/vite/bin/vite.js build`. The browser test runner owns and stops its temporary servers. Stop manually started servers with Ctrl+C. Do not run managed:provision, live experiments or other external actions as part of verification.

## Challenge

Reduce the session budget or local deadline. Explain the resulting outcome, which limit produced it, and whether remote execution was confirmed stopped. Cite the lifecycle stop reason or local deadline result and the separate interruption/cleanup status. Explain why an offline budget fixture cannot establish a real spending threshold.

Baseline and comparison
1. Run normal completion offline, then disable previews while keeping prompt and model fixed.
2. Compare requested options with the effective session creation snapshot.
3. Run Budget reached and Deadline expires; distinguish paused work from local timeout.
4. Inspect interruption, cleanup and reported usage; offline fixtures are not measurements of Claude.

Student challenge
Reduce the session budget or local deadline. Explain the outcome, which limit produced it, and whether remote execution was confirmed stopped.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab02-options.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L03 Built-in tools

Distinguish a tool being enabled in the session toolset from a call being permitted by its permission_policy and the host, and verify the effects in files rather than in agent claims.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 03 Built-in tools after the preceding lesson. Goal: Distinguish a tool being enabled in the session toolset from a call being permitted by its permission_policy and the host, and verify the effects in files rather than in agent claims.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c3. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept03Tools.tsx
- server/concepts/03-tools.ts
- shared/lab03-tools.ts
- server/lib/lab03-sandbox.ts
- server/lib/lab03-run.ts
- server/lib/lab03-port.ts
- server/lib/lab03-fixtures.ts
- Tab3-tools.md

Implementation brief
Implement Lab 03 Built-in tools on Claude Managed Agents. Goal: show that a tool being enabled (it's in the session's toolset) is a different thing from a call being permitted (the result of the tool's permission_policy plus the host's confirmation decision). Also show that the agent's working directory is the session container (/workspace, with read-only mounts under /mnt/session/uploads), not the host disk.
Build this step by step in the existing platform, following the Lab 01/02 patterns: the lab02 port/run/fixtures split, session-events.ts, openSse, managedSettings(), apiError, the local-origin guard and the shared/labNN-*.ts contracts. Create the files and supporting fixtures from scratch. Register the numeric lesson, the topic and the /api/c3 router in server/concepts/registry.ts. Add content.ts metadata and a complete Tab3 guide, and expose the real UI, server and support source as text. Use the shared host/adapter/SSE boundaries, strict zod validation, Offline/Live mode labels, and cancel/deadline/concurrency limits (with user.interrupt on abort). Errors must be useful. Keep Labs 01–02 working; Lab 02 still clears tools.
Create or update: src/concepts/Concept03Tools.tsx, server/concepts/03-tools.ts, shared/lab03-tools.ts, server/lib/lab03-{fixtures,port,run,sandbox}.ts, Tab3-tools.md, tests/lab03-tools.test.ts.
Concept mapping. Show this table in the UI and in Tab3, and send nothing else to the API:
Agent SDK term	Managed Agents equivalent
tools (available)	agent_toolset_20260401 with default_config.enabled: false and per-tool configs[].enabled: true (bash, read, write, edit, glob, grep). web_fetch and web_search are always disabled.
allowedTools / permission rules	Per-tool permission_policy: always_allow, always_ask or auto
permissionMode	default_config.permission_policy
Host approval	user.tool_confirmation with tool_use_id = the sevt_… event ID and result: allow | deny, plus a deny_message
cwd	Container working directory /workspace. Fixtures are mounted read-only at /mnt/session/uploads/…. Output files go to /mnt/session/outputs/.
Agent SDK-only fields (allowedTools, disallowedTools, permissionMode, cwd, canUseTool) are rejected by validation. They are never forwarded or translated into fields the provider doesn't have.
Build:
•	Host sandbox. Create a disposable per-run directory under the OS temp dir. It holds a readable notes.md and a writable draft.md. POST /reset restores both from authored fixtures.
•	Live mode.
o	Upload notes.md and draft.md with the Files API and attach them as session resources with mount_path.
o	Create the session with agent: { type: "agent_with_overrides", id, version?, tools: [<lab toolset>], mcp_servers: [], skills: [] }. Never update the shared agent.
o	Because mounts are read-only, the prompt tells the agent to copy the draft to /mnt/session/outputs/draft.md and edit it there.
o	After the run, fetch the outputs with files.list({ scope_id: session.id }) and download them into the host sandbox. Validate the paths before writing.
o	Delete the uploaded originals during cleanup.
•	Offline mode. A scripted adapter emits realistic agent.tool_use / agent.tool_result / session.status_idle events, with evaluated_permission and evaluation. It applies permitted write/edit effects to the host sandbox through the same path guard.
•	Display: each agent.tool_use (name, input, evaluated_permission, evaluation.type), each agent.tool_result (is_error), a derived permission denials list, any pending requires_action confirmations, and the resulting file contents read from disk.
Experiment. Add a preset selector with these presets:
1.	read-only: only read, glob and grep enabled.
2.	unavailable Write: write and edit disabled. The agent's write attempt comes back as evaluated_permission: "deny" with no evaluation object.
3.	denied Write: write is enabled with always_ask, and the host sends user.tool_confirmation with result: "deny" and a deny_message.
4.	permitted edit: edit is enabled with always_allow, or always_ask and the host allows it, but only for paths inside the fixture.
auto can be shown as an extra preset. Label it "server-evaluated, not a human checkpoint".
Bash is enabled only with always_ask. The host auto-allows only exact commands from a host-authored allowlist (for example ls /workspace, cat /mnt/session/uploads/notes.md) and denies everything else, including anything that references a path outside the workspace or upload/output roots.
Verify:
•	Unavailable and denied are distinct states in data, UI and tests:
o	unavailable: deny with no evaluation (tool not enabled)
o	denied: an always_ask call that the host denied, or an auto deny with reason_code
•	The path guard canonicalizes paths and rejects:
o	.. traversal
o	absolute paths outside the allowed roots, both container (/workspace, /mnt/session/uploads, /mnt/session/outputs) and host sandbox
o	symlink escapes (realpath check), Windows drive and UNC paths, and NUL bytes
•	Host-side confirmations run tool inputs through the same guard before sending allow.
•	Test the files, not what the agent says it did: assertions read the sandbox from disk.
Route inventory under /api/c3:
•	POST /query (SSE): body { mode, preset, prompt, deadlineSeconds, budgetCents? }
•	GET /files: sandbox contents
•	POST /reset: restore the fixtures
Add focused, deterministic offline tests and include them in test:offline. They must cover:
•	the four presets
•	the unavailable-vs-denied distinction
•	the tool_confirmation round-trip using sevt_ IDs
•	path guard cases: traversal, absolute, symlink, Windows paths
•	rejection of the bash allowlist
•	reset
•	capacity 429, invalid request 400, live without config 422
•	the cancel → interrupt path
Run typecheck, the focused tests, test:lesson-guides/audit:lesson-guides and build, and fix any failures. Give PowerShell commands and a browser demo at http://127.0.0.1:5174/?lesson=3. Review the diff and only checkpoint after the checks pass. Don't run billed or external actions (live sessions, Files API uploads, provisioning) automatically. Live mode must be enabled explicitly and requires MANAGED_LIVE_ENABLED=true.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

A tool being **enabled** means it is in the session's toolset. A call being **permitted** depends on that tool's `permission_policy` and, when the session pauses, on the host's `user.tool_confirmation`. This lab keeps the two apart, and it checks results by reading files on disk, never by trusting what the agent says.

The agent works inside the session container. Its working directory is `/workspace`, file resources are mounted read-only under `/mnt/session/uploads/`, and files it writes to `/mnt/session/outputs/` are captured by the Files API. Nothing runs on your computer except the host, which answers confirmations and keeps a sandbox copy of the files.

## Prerequisites

Use Node 24 or newer and the installed Anthropic TypeScript SDK 0.133.0. Labs 01 and 02 should already work. Offline mode needs no credentials, provisioning or account access. Run from this workspace in PowerShell:

```powershell
npm run dev
```

Open http://127.0.0.1:5174/?lesson=3 and select **Run the exercise**. If your NVM installation blocks npm, run the entrypoints directly:

```powershell
node scripts/dev-server.mjs
# In a second PowerShell window:
node node_modules/vite/bin/vite.js
```

Live runs are optional and billed. They upload two small Markdown files, create one session and need `MANAGED_LIVE_ENABLED=true`. See docs/managed-setup.md for configuring existing resources; do not provision just to run fixtures. The server never updates the shared agent.

## Concept mapping

| Agent SDK term | Managed Agents equivalent |
| --- | --- |
| `tools` (available) | `agent_toolset_20260401` with `default_config.enabled: false` and `configs[].enabled: true` per tool (bash, read, write, edit, glob, grep). `web_fetch` and `web_search` are always disabled. |
| `allowedTools` / permission rules | Per-tool `permission_policy`: `always_allow`, `always_ask` or `auto` |
| `permissionMode` | `default_config.permission_policy` |
| Host approval (`canUseTool`) | `user.tool_confirmation` with `tool_use_id` = the `sevt_…` event ID, `result` allow or deny, plus a `deny_message` |
| `cwd` | Container working directory `/workspace`. Fixtures mount read-only at `/mnt/session/uploads/…`; outputs go to `/mnt/session/outputs/`. |

Requests that contain `allowedTools`, `disallowedTools`, `permissionMode`, `cwd` or `canUseTool` get HTTP 400 and the message names the field. They are never forwarded or translated into fields the provider doesn't have. The session is created with `agent: { type: "agent_with_overrides", id, version?, tools: [<lab toolset>], mcp_servers: [], skills: [] }`, so the toolset applies to this session only.

## Controls

- **Preset** chooses the toolset and the host's answers:
  1. **Read-only**: only `read`, `glob` and `grep` are enabled (`always_allow`).
  2. **Unavailable Write**: `write` and `edit` are not enabled. A write attempt arrives with `evaluated_permission: "deny"` and **no** `evaluation` object, because no policy was evaluated.
  3. **Denied Write**: `write` is enabled with `always_ask`. The session goes idle with `requires_action`, and the host sends `user.tool_confirmation` with `result: "deny"` and a `deny_message`.
  4. **Permitted edit**: `edit` and `bash` are enabled with `always_ask`. The host allows the allowlisted `cp` and an edit to `/mnt/session/outputs/draft.md`, and denies anything else.
  5. **Auto (server-evaluated, not a human checkpoint)**: `read`, `write` and `edit` use `auto`; the server runs, denies or pauses each call. `bash` remains `always_ask`.
- **Remove enabled tools** removes tools from the preset before the session is created. Use it for the challenge.
- **Prompt** defaults to the preset's instructions and uses only container paths. Offline fixtures follow an authored plan and ignore your wording.
- **Local deadline (seconds)** is 1 to 120 and cannot exceed MANAGED_DEADLINE_MS. It limits local waiting and triggers an interruption attempt.
- **Live session budget (US cents)** is 1 to 500, sent as `budget.max_list_cost` on the session.
- **Offline scenario**: Normal turn, or "Agent keeps working", which hangs after the first tool result so you can practise Cancel query and the deadline.
- **Refresh files** calls `GET /api/c3/files`. **Reset sandbox** calls `POST /api/c3/reset` and restores the authored fixtures; it returns 429 while a query is using that sandbox.

Bash is only ever enabled with `always_ask`. The host approves only these exact commands and denies everything else, including extra spaces, chained commands and any path outside the three roots:

```text
ls /workspace
ls /mnt/session/uploads
ls /mnt/session/outputs
cat /mnt/session/uploads/notes.md
cat /mnt/session/uploads/draft.md
cp /mnt/session/uploads/draft.md /mnt/session/outputs/draft.md
```

## Experiment

1. Run **Read-only**. Every call is `allow / always_allow`. Files on disk are unchanged and `outputs/` is empty.
2. Run **Unavailable Write**, then **Denied Write**. Compare the Tool calls table: `deny / no evaluation` (unavailable) versus `ask / always_ask` followed by a host deny. The Permission denials list labels the first as unavailable by session-toolset and the second as denied by host. `outputs/draft.md` is absent after both runs.
3. Run **Permitted edit**. Four confirmations go out by `sevt_` ID: the `cp` is allowed, a `cat` containing `..` is denied, the edit to the outputs copy is allowed, and an edit that traverses out of `/mnt/session/outputs` is denied. Then read `outputs/draft.md` on disk: it says `Status: reviewed`. `uploads/draft.md` still says `Status: draft`.
4. Run **Auto**. The write to `/etc/profile` comes back as `deny / auto (high_risk)`. That is a denial by the server, not an unavailable tool.
5. Select **Agent keeps working**, run, and press **Cancel query**. The server attempts `user.interrupt`. Repeat with a 1-second deadline.

Each query gets a fresh disposable sandbox under the OS temp directory, so every preset starts from the same files. The experiment table records the preset, removed tools, outcome, denials and the `Status:` line of `outputs/draft.md` as read from disk.

## Route inventory

| Route | Purpose |
| --- | --- |
| `POST /api/c3/query` | SSE. Body `{ mode, preset, prompt, deadlineSeconds, budgetCents?, removeTools?, scenario? }`. Streams `progress` frames, then one `result`. |
| `GET /api/c3/files` | Lists the latest sandbox: `uploads/` (read-only mounts) and `outputs/` (writable). |
| `POST /api/c3/reset` | Restores the authored `notes.md` and `draft.md` and empties `outputs/` and `workspace/`. |

## Evidence to inspect

Inspect shared/lab03-tools.ts for the presets, `buildToolset`, the mapping table and `deriveDenials`. server/lib/lab03-sandbox.ts holds both path guards, the bash allowlist and `decideConfirmation`. server/lib/lab03-run.ts handles `agent.tool_use`, `agent.tool_result` and `requires_action` pauses, and sends confirmations. server/lib/lab03-port.ts uploads the fixtures, creates the session with overrides, lists outputs with `scope_id` and deletes the uploaded originals. server/lib/lab03-fixtures.ts is the offline simulator, and server/concepts/03-tools.ts hosts the routes.

Classification rules, applied to each `agent.tool_use`:

| Event | State | Listed as |
| --- | --- | --- |
| `evaluated_permission: "allow"` | allowed | – |
| `evaluated_permission: "ask"`, then host allow | allowed by host | – |
| `evaluated_permission: "ask"`, then host deny | denied by host | denied (host) |
| `evaluated_permission: "deny"` with an `evaluation` | denied by server | denied (server-auto) |
| `evaluated_permission: "deny"`, no `evaluation` | unavailable | unavailable (session-toolset) |

The container path guard rejects `..` segments before normalising, absolute paths outside `/workspace`, `/mnt/session/uploads` and `/mnt/session/outputs`, Windows drive, UNC and backslash paths, and NUL bytes. The host path guard additionally rejects absolute host paths and walks every existing segment with `lstat`, so a symlink or junction that resolves outside the sandbox (or dangles) is refused before any read or write. Host confirmations run tool inputs through the same guard before sending allow, and live output filenames are validated before anything is downloaded or written.

## Troubleshooting

A 400 means validation failed before any disk or provider work: check `fieldErrors`. An Agent SDK field produces a message that names it. A 422 means live mode is not configured. A 429 means two queries are already running, or you tried to reset a sandbox that is in use.

If the outcome is paused with "More than 12 confirmations requested", the agent kept retrying denied calls and the host stopped answering. If live outputs report "none", the agent did not write to `/mnt/session/outputs/`; uploads are read-only, so the agent must copy the draft before editing it. If uploads report "pending", delete the listed files in Claude Console. Remote interruption is confirmed only when `user.interrupt` was accepted and the session was then seen idle or terminated. Otherwise check the session in Claude Console.

## Limitations

The offline agent follows a fixed plan and never adapts to a denial, while a live model may try another tool. Its `auto` decisions are an authored stand-in ("deny paths outside the roots"), not the real server classifier. Offline runs apply effects directly to the host sandbox, and live runs copy session outputs into it after the turn. Neither proves anything about Claude's behaviour, cost or latency.

`auto` is not a human checkpoint: a call the server judges safe runs before anyone sees it. Use `always_ask` where a person must review. Only files under `/mnt/session/outputs/` come back from a live session; changes elsewhere in the container stay there.

## Verification

Run in PowerShell:

```powershell
npm run typecheck
node --import tsx --test tests/lab03-tools.test.ts
npm run test:offline
npm run test:lesson-guides
npm run audit:lesson-guides
npm run build
node scripts/run-browser-tests.mjs lab03.spec.ts
```

With an NVM npm-wrapper restriction, use `node node_modules/typescript/bin/tsc --noEmit`, `node --import tsx --test --test-concurrency=1 tests/*.test.ts`, `node --import tsx scripts/audit-lesson-guides.ts` and `node node_modules/vite/bin/vite.js build`. Do not run managed:provision, live experiments or other external actions as part of verification.

## Challenge

Choose **Permitted edit**, tick **Remove edit**, and predict before you run: does the edit attempt show up as unavailable (`deny` with no `evaluation`) or as denied? What does `outputs/draft.md` contain on disk afterwards? Run it and check your answer against the Tool calls table, the Permission denials list and the file itself. Then explain why the host never received a confirmation request for that edit.

Baseline and comparison
1. Run Read-only offline and confirm that every file on disk is unchanged.
2. Run Unavailable Write and Denied Write; compare the evaluated_permission, the evaluation object and the permission denials list.
3. Run Permitted edit: the host allows the allowlisted cp and the in-fixture edit, and denies the traversal attempts.
4. Inspect outputs/draft.md on disk, then reset the sandbox and run Auto to see server-evaluated outcomes.

Student challenge
Take the Permitted edit preset and remove edit from the enabled tools. Before you run it, predict whether the edit attempt is unavailable (deny with no evaluation) or denied, and what outputs/draft.md contains on disk afterwards.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab03-tools.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L04 Permissions

Approve or deny paused tool calls through a host review dialog: the Managed Agents equivalent of canUseTool is a requires_action pause answered once with user.tool_confirmation.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 04 Permissions after the preceding lesson. Goal: Approve or deny paused tool calls through a host review dialog: the Managed Agents equivalent of canUseTool is a requires_action pause answered once with user.tool_confirmation.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c4. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept04Permissions.tsx
- server/concepts/04-permissions.ts
- shared/lab04-permissions.ts
- server/lib/lab04-approvals.ts
- server/lib/lab04-run.ts
- server/lib/tool-session-run.ts
- server/lib/lab03-sandbox.ts
- Tab4-permissions.md

Implementation brief
Implement Lab 04 Permissions on Claude Managed Agents. Goal: a person approves or denies paused tool calls through a host review dialog. The Managed Agents equivalent of the Agent SDK's canUseTool callback is three steps:
1.	An always_ask tool pauses the session with session.status_idle and stop_reason.type: "requires_action".
2.	The host shows the paused agent.tool_use to a reviewer.
3.	The host resolves it with user.tool_confirmation: tool_use_id is the sevt_… event ID, result is allow | deny, and a deny carries a deny_message.
Build this step by step in the existing platform, following the Lab 01–03 patterns. Reuse the port/run/fixtures split, session-events.ts, openSse, managedSettings(), apiError, the local-origin guard and the shared/labNN-*.ts contracts.
From Lab 03, reuse lab03-sandbox.ts (disposable sandbox, container and host path guards, bash allowlist) and the tool-event handling in lab03-run.ts. Extract shared helpers rather than copying them, and keep Lab 03's behaviour and tests unchanged. Register the numeric lesson, the "Permissions and security" topic and the /api/c4 router in server/concepts/registry.ts. Add content.ts metadata and a complete Tab4 guide, and expose the real UI, server and support source as text. Use strict zod validation, Offline/Live mode labels, cancel/deadline/concurrency limits (with user.interrupt on abort) and useful errors. Keep Labs 01–03 working.
Create or update: src/concepts/Concept04Permissions.tsx, server/concepts/04-permissions.ts, shared/lab04-permissions.ts, server/lib/lab04-{approvals,fixtures,port,run}.ts, Tab4-permissions.md, tests/lab04-permissions.test.ts, browser-tests/lab04.spec.ts.
Concept mapping. Show this table in the UI and in Tab4, and send nothing else to the API:
Agent SDK term	Managed Agents equivalent
canUseTool(toolName, input)	Host handler for a requires_action pause; it reads the matching agent.tool_use (name, input, evaluated_permission: "ask")
{ behavior: "allow" }	user.tool_confirmation with result: "allow"
{ behavior: "deny", message }	user.tool_confirmation with result: "deny" and deny_message; the agent receives it as an error tool result
updatedInput	No equivalent. A confirmation cannot change the input. The host can only allow the call as it was requested, or deny it with a deny_message that suggests a correction.
Preallowed tools (allowedTools)	Tools with always_allow never pause, so they never reach the reviewer. auto calls that the server allows or denies don't reach it either.
Tool use ID	The sevt_… ID of the agent.tool_use event, not a toolu_… ID
Requests containing Agent SDK-only fields (canUseTool, allowedTools, permissionMode, updatedInput, behavior) get HTTP 400, and the message names each field. They are never forwarded or translated.
Toolset. Build it with Lab 03's buildToolset approach and agent_with_overrides:
•	default_config.enabled: false
•	read and glob enabled with always_allow
•	write and edit enabled with always_ask
•	bash disabled
•	web_fetch and web_search disabled
Live mode uses the Lab 03 file flow: upload the fixtures, mount them read-only, have the agent copy them to /mnt/session/outputs/ and edit there, collect outputs with scope_id into the host sandbox, and delete the uploads. Never update the shared agent.
Build:
•	Pending-approval map in server/lib/lab04-approvals.ts:
o	Key: runId + toolUseId.
o	Value: tool name, input, createdAt, expiresAt, a one-time decisionToken and a waiter.
o	A run gets a server-generated runId (UUID) and a random decisionToken, both sent only in that run's first SSE frame.
o	An entry is consumed atomically: remove it before resolving the waiter, so a decision can apply only once.
o	Bounds: at most 8 pending entries per run and a global cap. Every lookup checks the run, the token and expiry.
•	Review stream. When a requires_action idle arrives, look up each listed event ID among the agent.tool_use events seen on this run. Register a pending entry only for evaluated_permission: "ask"; the API returns 400 if you confirm anything else. Stream a review frame with toolUseId, tool name, redacted and bounded input, the resolved container path, the host guard verdict and expiresAt. The UI opens an accessible review dialog with focus management, Allow, Deny (with an editable deny message) and a countdown.
•	Decision endpoint POST /api/c4/decide, body { runId, toolUseId, decisionToken, decision: "allow" | "deny", denyMessage? }. It is strictObject and 1 KB maximum, and it checks the origin.
o	Before forwarding an allow, the host runs the input through Lab 03's path guards and the "only draft.md in the writable roots" rule. If the input fails, the host does not send allow: it returns 422 to the reviewer and keeps the entry pending.
o	Error codes:
	404 NOT_FOUND: unknown run, unknown tool use, or another run's token
	409 CONFLICT: already consumed or expired. Add the code to apiErrorSchema without breaking existing contracts.
	400: validation errors
o	On success, the runner sends exactly one user.tool_confirmation per decision. Several decisions from the same pause can go in one events request.
•	Expiry. The default is 30 seconds and it is configurable from 5 to 120 seconds. On expiry the host consumes the entry and sends deny with deny_message: "Approval expired; the reviewer did not answer.". It then streams an expired frame. Expiry is a host decision, not a provider timeout.
•	Abandonment and cancellation. Cancel, the deadline, a browser disconnect or server shutdown rejects every waiter for the run, removes its map entries and sends a bounded user.interrupt. No confirmation is sent for abandoned entries. Afterwards, /decide for those IDs returns 409 or 404.
•	Offline mode. A scripted simulator, following the Lab 03 fixture approach, pauses for real host decisions. Its plan:
1.	read the notes (always_allow, so it never pauses)
2.	edit the draft in outputs, copying it first with write
3.	a second edit of the same file
4.	a write to a second file
Permitted effects go to the host sandbox through the same guards. After a deny, the fixture agent emits an authored message that acknowledges the deny_message and does not retry. Label it clearly as authored, not Claude's behaviour.
•	Display:
o	tool calls, split into never-asked (preallowed) and asked
o	the review queue
o	the decision log: decision, who or what decided (reviewer or expiry), latency, and whether it was consumed
o	permission denials
o	files read back from disk
o	outcome, interruption and cleanup status
Experiment (offline presets plus manual reviewer actions):
1.	Approve the first fixture edit and deny the second. Only the first change appears on disk.
2.	Abandon an approval: leave the dialog open until it expires. The expired call is denied by the host and the file is unchanged.
3.	Cancel while a review is pending. Every waiter is released and the session is interrupted.
4.	Replay the same decision, send a decision with another run's ID or token, and send one after expiry. All of them are rejected.
5.	Student challenge: deny one write with a custom deny_message and explain how the agent responds.
Verify:
•	A decision applies once: of two concurrent /decide calls, exactly one wins and exactly one confirmation is sent.
•	A denial changes no file. Assertions read the sandbox from disk.
•	Cancellation, deadline and disconnect release every waiter. Afterwards the approvals map is empty, timers are cleared and capacity is released.
•	Decisions from another run, after consumption or after expiry are rejected. updatedInput is rejected with an explanation.
•	always_allow tools never reach the reviewer. Explain in the UI and in Tab4 that preallowed tools, and auto calls the server resolves, never call the review handler. A missing review is therefore not proof that a call was reviewed.
Route inventory under /api/c4:
•	POST /query (SSE): body { mode, prompt, deadlineSeconds, approvalSeconds, budgetCents?, scenario? }
•	POST /decide: body as above
Add focused, deterministic offline tests that use fake timers or injected clocks, and include them in test:offline. They must cover:
•	approve, deny and expire
•	single application under a race
•	cross-run, cross-token and post-consumption rejection
•	host validation blocking an unsafe allow
•	cancel → user.interrupt with all waiters released and the map empty
•	the sevt_ confirmation round-trip through the real installed SDK with a mocked fetch
•	no confirmation for always_allow calls
•	400, 404, 409, 422 and 429 codes
•	disk state after every case
Run typecheck, the focused tests, test:lesson-guides/audit:lesson-guides, build and the browser tests, and fix any failures. Update the lesson-count expectations in existing tests. Give PowerShell commands and a browser demo at http://127.0.0.1:5174/?lesson=4. Review the diff and write docs/lab04-checkpoint.md (SHA-256 manifest) only after the checks pass. Don't run billed or external actions (live sessions, Files API uploads, provisioning) automatically. Live mode must be enabled explicitly and requires MANAGED_LIVE_ENABLED=true.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

A person approves or denies tool calls before they run. In the Agent SDK that is the `canUseTool` callback. Managed Agents has no callback: a tool with the `always_ask` policy **pauses** the session, the host shows the paused call to a reviewer, and the host answers **once** with `user.tool_confirmation`.

1. The agent emits `agent.tool_use` with `evaluated_permission: "ask"`.
2. The session goes idle with `session.status_idle` and `stop_reason.type: "requires_action"`, listing the waiting event IDs.
3. The host sends `user.tool_confirmation` with `tool_use_id` set to that `sevt_…` event ID and `result` `allow` or `deny`. A deny carries a `deny_message`, which the agent receives as an error tool result. The session then keeps running.

## Prerequisites

Use Node 24 or newer and the installed Anthropic TypeScript SDK 0.133.0. Lab 03 should already work, because this lab reuses its sandbox, path guards and fixture simulator. Offline mode needs no credentials, provisioning or account access. Run from this workspace in PowerShell:

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

Baseline and comparison
1. Run the Review scenario offline. Approve the write and the first edit, deny the second edit, and deny the summary write.
2. Confirm on disk that only the first edit landed, and read how the authored agent acknowledges each deny_message.
3. Run again with a 5-second approval window and let one review expire; then cancel a run while a review is pending.
4. Use the decision tester to replay a decision and send one with a wrong token; compare the 409 and 404 answers.
5. Run Preallowed only and notice that no review appears: always_allow calls never reach the reviewer.

Student challenge
Deny one write with your own deny_message and explain how the agent responds: the message comes back as an error agent.tool_result and the session keeps running. Why is the offline reaction authored, while a live agent may try another approach?

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab04-permissions.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L05 Custom tools

Expose typed application functions as Managed Agents custom tools: the agent declares them, the session pauses on agent.custom_tool_use, and the host validates the input, runs the handler and answers once with user.custom_tool_result.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 05 Custom tools after the preceding lesson. Goal: Expose typed application functions as Managed Agents custom tools: the agent declares them, the session pauses on agent.custom_tool_use, and the host validates the input, runs the handler and answers once with user.custom_tool_result.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c5. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept05CustomTools.tsx
- server/concepts/05-custom-tools.ts
- shared/lab05-custom-tools.ts
- server/lib/lab05-tasks.ts
- server/lib/lab05-run.ts
- server/lib/lab05-port.ts
- server/lib/lab05-fixtures.ts
- server/lib/tool-session-run.ts
- Tab5-custom-tools.md

Implementation brief
Implement Lab 05 Custom tools. Goal: Expose typed application functions as Managed Agents custom tools that the host executes and answers through session events.
Build this step by step in the existing platform, and create the files and fixtures from scratch. Register lesson 5, its topic and the /api/c5 router. Add content.ts metadata and a complete Tab5 guide, and expose the real UI, server and support source as text. Use the shared host/adapter/SSE boundaries, the managed-port and tool-session-run runner (with its answer hook per requires_action pause), strict validation, scripted/live mode labels, cancel/deadline/concurrency limits, the loopback/same-origin guard and useful errors. Keep Labs 01–04 working.
Create or update src/concepts/Concept05CustomTools.tsx; server/concepts/05-custom-tools.ts; shared/lab05-custom-tools.ts; server/lib/lab05-{tasks,fixtures,port,run}.ts; managed/lab05-agent.json; Tab5-custom-tools.md
Concept mapping (state it in the guide): the Agent SDK's createSdkMcpServer + tool() run an in-process MCP server inside the agent loop. Managed Agents has no in-process server. Instead, the persisted agent declares { type: "custom", name, description, input_schema } tools. The session emits agent.custom_tool_use and goes idle with stop_reason requires_action. The host runs the handler and sends user.custom_tool_result { custom_tool_use_id: <sevt_ event id>, content: [text blocks], is_error }. Custom tools have no permission policy. Remote MCP (mcp_servers + mcp_toolset) is a different mechanism and out of scope here.
Build: Define list_tasks, add_task and complete_task once as Zod v4 shapes. Generate each input_schema with z.toJSONSchema (additionalProperties false, required fields). Put the same definitions in managed/lab05-agent.json: only these three custom tools, agent toolset disabled, no MCP servers, no web tools. Provision only through the existing managed:provision flow; never call agents.create in the request path. The host dispatcher validates every input with Zod before it calls a handler. On rejection it returns is_error with the Zod issues, and the handler does not run. Keep task stores per run (keyed by runId, not global), and answer each custom_tool_use exactly once. Unknown task IDs and duplicate completions return a meaningful is_error result. Show the definitions, raw event input, validation outcome, result blocks and before/after task state. Reject Agent SDK-only request fields (mcpServers, allowedTools, createSdkMcpServer-style options) with an explanation, as Lab 04 does.
Experiment: List tasks, add a task and complete it, submit malformed input, and complete an unknown ID. Scripted mode replays recorded agent.custom_tool_use events through a fixture port. Live mode uses the provisioned Lab 05 agent and shows that it received only the three custom tools.
Limits: Use a per-call handler deadline: on timeout, send an is_error result instead of leaving the session blocked. Cancel sends user.interrupt and drains to a terminal idle. Break only on an idle whose stop_reason is not requires_action, or on terminated. Keep the router concurrency cap at two.
Verify: Test the tool inventory against the agent JSON and the Zod shapes, schema rejection before handler execution (handler call count stays 0), valid state transitions, the is_error paths, one result per event id with the correct custom_tool_use_id, and isolation between two concurrent runs. Use the injected fixture port and no network.
Reference route inventory under /api/c5: GET /tools; GET /tasks?runId=; POST /query (SSE)
Add focused deterministic tests in tests/lab05-custom-tools.test.ts and include them in test:offline. Add browser-tests/lab05.spec.ts and update the lesson-guide and shell expectations. Run typecheck, the focused tests, test:lesson-guides, audit:lesson-guides, scan:distribution and build, and fix any failures. Give PowerShell commands and a browser demonstration. Review the diff and record docs/lab05-checkpoint.md (SHA-256 manifest; there is no git repo) only after the checks pass. Do not run provisioning, live sessions or other billed or external actions automatically.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

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

Baseline and comparison
1. Read the three tool definitions and confirm each input_schema is generated from its Zod shape.
2. Run the Tour offline: list, add and complete a task, then watch the malformed add_task and the unknown ID come back as is_error results.
3. Compare the before and after task state for each call, and the handler call counts against the number of calls.
4. Run Slow handler and see a handler pass its deadline: the session gets an is_error result and no task is saved.
5. Run Hang, cancel it, and read how user.interrupt and cleanup are reported. Then load the run's task state through GET /api/c5/tasks.

Student challenge
Send add_task with a missing or wrong-typed title. Confirm that the result is is_error, that the handler call count is unchanged and that the task list is identical before and after.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab05-custom-tools.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L06 Sessions and retained context

Continue a conversation in the same server-owned Managed session, compare it with fresh context, and reconnect without duplicating persisted events.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 06 Sessions and retained context after the preceding lesson. Goal: Continue a conversation in the same server-owned Managed session, compare it with fresh context, and reconnect without duplicating persisted events.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c6. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept06Sessions.tsx
- server/concepts/06-sessions.ts
- shared/lab06-sessions.ts
- server/lib/lab06-store.ts
- server/lib/lab06-port.ts
- Tab6-sessions.md

Implementation brief
Goal: Continue a conversation in the same remote session and compare fresh context.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept06Sessions.tsx; server/concepts/06-sessions.ts; Tab6-sessions.md

Build: Capture the sesn_ ID from sessions.create, not an init message or UUID. Keep a server-owned conversation index bound to the browser exercise and authenticated principal. New creates a session; Continue retrieves the owned, non-archived session, opens its stream and sends user.message. Reconnect opens the stream before paginated history hydration and deduplicates persisted sevt_ IDs. Show session and local turn IDs. Keep idle sessions open across turns under an expiry policy; do not reuse the one-shot runner's automatic archive after each answer. Close archives only after confirmed idle; expiry/shutdown uses bounded interrupt and cleanup.

Experiment: Introduce a fictional project name, ask for it in the same session, then ask in a fresh one. Include unknown, foreign-owned, archived-session, stream EOF and cancellation cases.

Verify: Offline stateful fixtures retain context only for the same session. Test one create across two turns, actual send IDs, ownership, reconnect deduplication and no premature archive. Fixture recall proves fixture behavior only. Local stream abort does not prove remote interruption.

Reference route inventory under /api/c6: POST /query; POST /close; GET /conversation

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

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

Baseline and comparison
1. Start a new offline session with the fictional project introduction.
2. Select the follow-up and Continue; confirm the session ID stays the same and the name is recalled.
3. Start a fresh session with only the follow-up and compare the answer.
4. Reconnect and inspect stream-before-history ordering plus duplicate counts.
5. Inspect the server conversation index, then close the idle session and confirm later access is rejected.

Student challenge
Ask a follow-up that depends on the first answer. Explain which ID proves session reuse and why fixture recall is evidence only of fixture behavior.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab06-sessions.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L07 Tool policy and execution audit

Replace Agent SDK tool hooks with a host policy pipeline that validates before execution and records the actual effect afterward.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 07 Tool policy and execution audit after the preceding lesson. Goal: Replace Agent SDK tool hooks with a host policy pipeline that validates before execution and records the actual effect afterward.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c7. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept07Hooks.tsx
- server/concepts/07-hooks.ts
- shared/lab07-hooks.ts
- server/lib/lab07-policy.ts
- server/lib/lab07-run.ts
- server/lib/lab07-port.ts
- Tab7-hooks.md

Implementation brief
Goal: Enforce pre-execution policy and record post-execution evidence.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept07Hooks.tsx; server/concepts/07-hooks.ts; Tab7-hooks.md

Build: Replace PreToolUse/PostToolUse callbacks with a host policy pipeline. Declare read_file, write_file and edit_file as typed custom tools on a dedicated versioned agent, with built-in filesystem/bash tools disabled. Validate inputs, apply audit-only, deny-write or rewrite-input policy, revalidate the effective input, execute and then return user.custom_tool_result correlated to the call's sevt_ ID. Log original/effective input, decision and actual effect. For optional built-in always_ask calls use user.tool_confirmation; it cannot rewrite the call input. These pipeline phases are application code, not Managed Agents hook events.

Experiment: Pass a safe edit, deny a protected-file edit and rewrite a proposed output name to an allowed fixture file through the custom handler.

Verify: Denial has no effect; rewrite is revalidated; post-execution audit distinguishes executed, failed and denied calls. Audit cannot undo a completed effect. Test repeated calls, handler exception, cancellation and path escape.

Reference route inventory under /api/c7: POST /query; GET /file

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Replace Agent SDK tool hooks with an explicit host pipeline around Managed Agents custom tools.

## Prerequisites

- Complete Labs 01–06 and install dependencies with Node.js 24 or newer.
- Offline mode needs no credentials and never contacts Anthropic.
- Live mode requires the base Managed environment plus a dedicated Lab 07 agent provisioned with `npm.cmd run managed:provision -- lab07`.

## Controls

- **Audit only** validates and executes a safe edit of `/workspace/draft.md`.
- **Deny write** refuses a protected-file edit before its handler runs.
- **Rewrite input** changes `/workspace/proposed.md` to `/workspace/draft.md`, then validates the effective input again before execution.
- **Handler exception** demonstrates a permitted call whose handler fails without changing the file.
- **Repeated call** proves one `sevt_` custom-tool call receives at most one result.
- **Hang** can be cancelled to inspect bounded interrupt and cleanup.

## Evidence to inspect

Every audit row separates original input, effective input, policy decision, validation phase, whether the handler ran, execution outcome, result sent and file contents before and after. A denial has identical before and after values. A rewrite displays both paths and `revalidated`. A handler failure is distinct from a policy denial.

The three tools are custom tools on a dedicated versioned agent. Built-in filesystem and Bash tools are absent. The host answers `agent.custom_tool_use` with exactly one `user.custom_tool_result` correlated by the call's `sevt_` ID.

## Troubleshooting

- **Live unavailable**: provision the Lab 07 agent, set `CLAUDE_MANAGED_LAB07_AGENT_ID`, verify it, and restart the server.
- **Rejected path**: only the named `/workspace` fixtures are accepted; traversal, Windows paths and other roots are refused.
- **Missing oldText**: the policy allowed the call, but the handler failed and recorded no effect.
- **Protected file changed unexpectedly**: inspect the before/after evidence and the selected policy; deny-write must report that the handler did not run.

## Limitations

Pre-execution and post-execution phases are application code, not native Managed Agents hook events. A post-execution audit can record a completed effect but cannot undo it. Built-in `always_ask` calls can be approved or denied with `user.tool_confirmation`; that confirmation cannot rewrite their input. This lab uses custom tools because rewriting occurs inside the host handler boundary.

## Challenge

Block a protected-file call and identify the host decision that prevented the effect before any handler ran.

Baseline and comparison
1. Run Audit only and confirm the safe draft edit executes.
2. Run Deny write and verify the protected file is unchanged and the handler did not run.
3. Run Rewrite input and compare original proposed.md with effective draft.md after revalidation.
4. Run the handler-exception and repeated-call fixtures.
5. Load file evidence from GET /api/c7/file and distinguish executed, denied and failed audit outcomes.

Student challenge
Block a protected-file call and identify the host decision that prevented the effect before any handler ran.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab07-hooks.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L08 Delegation and session threads

Delegate bounded work to predefined Managed Agents, inspect separate session-thread histories, and verify role capabilities and effects in the host.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 08 Delegation and session threads after the preceding lesson. Goal: Delegate bounded work to predefined Managed Agents, inspect separate session-thread histories, and verify role capabilities and effects in the host.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c8. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept08Subagents.tsx
- server/concepts/08-subagents.ts
- shared/lab08-subagents.ts
- server/lib/lab08-port.ts
- server/lib/lab08-run.ts
- Tab8-subagents.md

Implementation brief
Goal: Delegate to agents with separate configurations and inspect their thread activity.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept08Subagents.tsx; server/concepts/08-subagents.ts; Tab8-subagents.md

Build: Author researcher, reviewer and calculator agent definitions with role-specific system prompts, models and tools. Use the multiagent configuration accepted by pinned SDK 0.133.0 and the account; do not add Agent SDK agents or an Agent tool. Keep dynamic workflows off for this bounded exercise where the selected configuration supports that choice. Correlate session.thread_created, thread status and agent.thread_message_sent/received with thread IDs and agent identity. Inspect child event streams separately; no parent_tool_use_id contract is assumed. All native children share the session sandbox and credentials, so enforce role/path restrictions in host custom handlers and omit unused vaults. If native delegation is unavailable, label separate host-orchestrated sessions as the replacement.

Experiment: Researcher reads an authored fixture, reviewer is refused a write, calculator returns a host-verified sum. Show delegation, report receipt and independent verification as separate states.

Verify: Distinct thread histories do not imply filesystem isolation. Child prose does not become the parent's final answer automatically. Test cross-posted blocking calls, duplicate events, wrong-role effects and stopping child activity. No fixture proves real parallel execution.

Reference route inventory under /api/c8: POST /query; GET /agents

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Goal

Delegate a bounded task to predefined Managed Agents, correlate each child by its `sthr_` thread ID and agent identity, and verify tool effects in the host.

## Prerequisites

- Node.js 24 and installed dependencies.
- Offline mode needs no credentials and makes no Anthropic requests.
- Live mode additionally needs the base Managed environment, `MANAGED_LIVE_ENABLED=true`, and a manually provisioned `CLAUDE_MANAGED_LAB08_AGENT_ID`.

## Controls

- **Offline scenario** selects normal, duplicate, cross-posted, wrong-role or hanging authored behavior.
- **Run offline delegation** streams deterministic thread and effect evidence.
- **Run live** is gated by both base readiness and the dedicated coordinator ID.
- **Cancel query** aborts the request and invokes the session interrupt boundary.

## Evidence to inspect

- The coordinator uses `multiagent_20261001` with predefined researcher, reviewer and calculator agents.
- Inline agents, advisor and workflows are disabled for this exercise.
- `session.thread_created`, thread status, and `agent.thread_message_sent` / `agent.thread_message_received` are correlated by thread IDs.
- Child event streams are independent. This lab does not translate an Agent SDK `Agent` tool or assume `parent_tool_use_id`.
- Native child threads share the session sandbox and credentials. The host still enforces role and path capabilities.

The thread table records agent identity and per-thread history. The effect ledger records role authorization, whether a handler ran, and the verified effect.

## Troubleshooting

- A 400 response means the strict request rejected a field or limit. Agent SDK `agents`, `Agent`, and `parent_tool_use_id` fields are deliberately unsupported.
- A 422 live response means live setup or `CLAUDE_MANAGED_LAB08_AGENT_ID` is missing or the coordinator topology failed verification.
- A 429 response means the bounded server concurrency limit is occupied.
- Provision explicitly with `npm run managed:provision -- lab08`; this can create billable remote resources and never runs on application startup.

## Limitations

- Distinct histories do not imply filesystem or credential isolation.
- Child prose does not automatically become the parent's final answer.
- Offline events are authored and do not prove real parallel execution.
- Live custom-tool handling is intentionally limited to observing thread topology in this bounded lesson; effect claims still require host evidence.

## Exercise

1. Run **normal** and find separate researcher, reviewer and calculator histories.
2. Confirm the reviewer write is denied before its handler runs.
3. Confirm the calculator report is independently recomputed as 42.
4. Run **cross-posted-call** and locate the routed blocking call.
5. Run **duplicate-events** and inspect the duplicate counter.
6. Run **wrong-role** and confirm a reviewer cannot call the calculator capability.
7. Run **hang**, cancel it, and confirm child activity crosses the interrupt boundary.

Distinct histories show routing and identity. They do not prove filesystem isolation or real parallel execution. Child prose does not automatically become the parent's final answer.

## PowerShell checks

```powershell
node --import tsx --test tests/lab08-subagents.test.ts
node scripts/audit-lessons.mjs
node node_modules/vite/bin/vite.js build
node node_modules/playwright/cli.js test browser-tests/lab08.spec.ts
```

## Challenge

Restrict one worker capability, run the wrong-role scenario, and explain the worker report beside the host effect ledger. The ledger decides whether an effect occurred.

Baseline and comparison
1. Run the normal fixture and identify the researcher, reviewer and calculator thread IDs.
2. Separate delegation, report receipt and independent verification states.
3. Confirm the reviewer write is denied and the calculator sum is recomputed by the host.
4. Run cross-posted, duplicate and wrong-role scenarios.
5. Cancel the hanging child activity and inspect the interrupt outcome.

Student challenge
Restrict one worker capability and compare its report with the host effect ledger.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab08-subagents.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L09 System instructions and explicit context

Compare inherited and explicitly composed system instructions in fresh sessions while keeping the question and base model fixed.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 09 System instructions and explicit context after the preceding lesson. Goal: Compare inherited and explicitly composed system instructions in fresh sessions while keeping the question and base model fixed.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c9. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept09SystemPrompts.tsx
- server/concepts/09-system-prompts.ts
- shared/lab09-system-prompts.ts
- server/lib/lab09-composer.ts
- server/lib/lab09-port.ts
- server/lib/lab09-run.ts
- Tab9-system-prompts.md

Implementation brief
Goal: Compare explicit system instructions without Claude Code presets.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept09SystemPrompts.tsx; server/concepts/09-system-prompts.ts; Tab9-system-prompts.md

Build: Define base, custom, base-plus-append and base-plus-authored-project-context variants in one host composer. Create fresh sessions using agent_with_overrides.system, preserving the base agent reference/version and explicitly replacing unwanted tools, MCP servers and skills. Show requested and resolved system settings. There is no claude_code preset, SYSTEM_PROMPT_DYNAMIC_BOUNDARY or Agent SDK settings loader in this exercise. Treat a fictional CLAUDE.md as explicit host-selected context, not automatic loading. Allow system.message only through a privileged host path when supported; it appends context and does not replace the configured system prompt.

Experiment: Fix the user question and compare selected variants with a small concurrency cap. Show omitted override preserving the base agent system versus an explicit replacement.

Verify: Assert exact override composition and inherited-capability clearing. Record actual usage without invented quality/cost rankings. Untrusted project text cannot become privileged system context without a trusted selection rule.

Reference route inventory under /api/c9: POST /query; GET /context

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Use Node.js 24 and installed dependencies. Offline fixtures need no credentials.
Live execution uses the existing single-agent base and environment from Lab 01, an API key on the server, and an explicitly enabled live gate. No new agent provisioning is required.

## Controls

- **Fixed user question** stays unchanged during Compare all offline variants.
- **System variant** selects Base, Custom replacement, Base plus appended instructions or Base plus authored project context.
- **Custom replacement instructions** replace the base system in the Custom variant.
- **Appended instructions** are joined to the retrieved base system by the host.
- **Compare all offline variants** runs one fresh fixture session at a time. The server caps simultaneous Lab 09 requests at two or the lower configured limit.
- **Run live** asks for an explicit billed run of only the selected variant.
- **Cancel query** stops the local request and invokes shared bounded interruption and cleanup.

## Evidence to inspect

Each comparison shows the same user question, a fresh session ID, source label, requested composition, resolved model/system/capabilities, answer and cleanup.
The Base variant omits `agent_with_overrides.system`, preserving the base system. Custom is an explicit replacement. Both combined variants compose a complete replacement before creating the session.
The composer pins the retrieved base agent ID and version, preserves its model, and explicitly sets `tools`, `mcp_servers` and `skills` to empty arrays. A multiagent base is rejected before creation.

The fictional `CLAUDE.md` is a server-authored constant selected by `aurora-finch-v1`. No arbitrary path, uploaded text or repository file enters privileged context. Browser-provided project text and `system.message` are rejected. This exercise leaves mid-session system messages disabled; such messages append context rather than replacing configured instructions.

## Troubleshooting

- 400: check the variant, limits or authored context ID. `claude_code`, `settings`, `systemPrompt`, `SYSTEM_PROMPT_DYNAMIC_BOUNDARY`, arbitrary project text and unknown fields are unsupported.
- 422: live mode or the base Managed configuration is unavailable.
- 429: the bounded concurrency cap is occupied.
- An error outcome can indicate a multiagent base or a resolved configuration mismatch. No user prompt is sent when capabilities remain enabled.
- Cleanup pending or unconfirmed interruption requires inspecting the reported remote session ID.

## Limitations

Offline answers are authored examples, not observations of Claude. Usage is null offline and when no live model spans report it. Reported spans do not imply complete billed session cost. The lesson makes no quality or cost ranking. Long base instructions exceeding the exercise composition bounds are rejected. Stored agent configuration remains unchanged.

## Challenge

Keep the question fixed and change only the system instructions. Identify whether the base was inherited or replaced, then explain how explicit project context changed the available facts.

## PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab09-system-prompts.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node node_modules/playwright/cli.js test browser-tests/lab09.spec.ts
```

Provider references: [Session overrides](https://platform.claude.com/docs/en/managed-agents/sessions) and [Agent configuration](https://platform.claude.com/docs/en/managed-agents/agent-setup). The installed SDK 0.133.0 types are the implementation contract.

Baseline and comparison
1. Compare all four offline variants with the same question.
2. Find the omitted system override in Base and the replacement in Custom.
3. Inspect base plus append and the authored project context selection.
4. Compare requested composition with the resolved session snapshot.
5. Use one live variant explicitly and inspect actual usage and cleanup evidence.

Student challenge
Keep the question fixed and change only the system instructions. Explain what is inherited and what is replaced.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab09-system-prompts.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L10 Validated reports and interruption

Validate final JSON reports with a closed application schema and distinguish interrupt, local abort and idle-session close.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 10 Validated reports and interruption after the preceding lesson. Goal: Validate final JSON reports with a closed application schema and distinguish interrupt, local abort and idle-session close.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c10. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept10StructuredInterrupt.tsx
- server/concepts/10-structured-interrupt.ts
- shared/lab10-structured-interrupt.ts
- server/lib/lab10-port.ts
- server/lib/lab10-run.ts
- Tab10-structured-interrupt.md

Implementation brief
Goal: Validate structured answers and distinguish turn interruption from local cancellation.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept10StructuredInterrupt.tsx; server/concepts/10-structured-interrupt.ts; Tab10-structured-interrupt.md

Build: Define a closed Zod report schema and generate JSON Schema centrally. Use a submit_report custom tool whose input is independently validated, or validate the final JSON text in the host. Do not invent outputFormat or result.structured_output on sessions.create. Label this application schema validation; if a later documented native schema capability is adopted, gate it separately. Use a bounded per-session send queue, explicit run/turn states, user.interrupt and local AbortController. Interrupt attempts to stop remote work while retaining an idle session; Abort stops local waiting and initiates remote cleanup. End archives the idle session and ends future sends, not a local Claude process.

Experiment: Valid/invalid reports, one bounded corrective round then exhaustion, interrupt followed by another turn, local disconnect and explicit Close. Show pending remote cleanup separately.

Verify: Invalid output never passes verification. Correlate control calls and handle unknown IDs, repeated stops and send-after-close. A returned HTTP interrupt acknowledgment is not sufficient evidence of idle. Add effective outcome/usage evidence.

Reference route inventory under /api/c10: GET /schemas; POST /structured; POST /run; POST /interrupt; POST /abort; POST /send; POST /end

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Use Node.js 24 and installed dependencies. Offline scenarios are authored and need no credentials. Live mode reuses the text-only base agent and environment from Lab 01; the host pins the retrieved agent version and clears tools, MCP servers, skills and orchestration before sending any prompt. A server API key and explicit live gate are required.

## Controls

- **Start offline report** opens a fresh retained session and validates final JSON text.
- **Offline scenario** selects Valid, Invalid, Corrected, Exhausted, Hang or Interrupt unconfirmed. Invalid with correction disabled uses one attempt; Exhausted uses exactly two unsuccessful attempts.
- **Allow one corrective round** permits at most one extra user message after invalid JSON or a schema violation. It never starts an unlimited repair loop.
- **Interrupt and retain session** aborts the current local turn, sends `user.interrupt` alone if remote work is not already idle, and polls actual status. It permits reuse only after idle is observed.
- **Send another turn** keeps the same owned session and serializes sends. One active turn and at most two queued turns are permitted.
- **Disconnect locally** calls `AbortController.abort()` for browser waiting. The disconnected stream initiates interrupt and remote cleanup.
- **Abort and clean up** requests the same remote cleanup explicitly through the host, preserving evidence even if cleanup is pending.
- **Close idle session** archives an idle session with no pending turns. It blocks future sends and does not stop a local Claude process.
- **Inspect run state** retrieves the owner-bound run ledger and pending cleanup state.
- **Run live** explicitly starts a billed fresh text-only session. No provisioning or live execution occurs automatically.

## Evidence to inspect

The report contract requires project, summary, risks and nonempty nextSteps. It is a closed Zod schema with centrally generated JSON Schema. Only the last authoritative message from a confirmed completed turn is JSON-parsed and independently validated. Invalid output never appears as a verified report.

Each turn has a local UUID, state, outcome, attempts, validation errors and observed usage. The run records the provider session ID, queue depth, interruption evidence and cleanup outcome. Offline usage is null. Live usage comes only from deduplicated model-request spans, not a fabricated cost estimate.

Validated reports render as a project heading, summary, Risks list and numbered Next steps. Turn evidence and observed input, output and cache-token counts are separate. **View and copy validated JSON** exposes the exact validated object without placing long JSON in a wide table. The platform uses larger readable typography, and a completed idle session is labeled as retained rather than in progress.

The report is **application schema validation**. No `outputFormat` or `result.structured_output` field is sent to `sessions.create`. This lesson selects the host final-text validation route rather than a submit_report custom tool.

API inventory: `GET /api/c10/schemas`, `POST /structured`, `POST /run`, `POST /interrupt`, `POST /abort`, `POST /send` and `POST /end`. `GET /run?runId=...` adds read-only state inspection. Stateful calls require the same `X-Lab-Owner` exercise ID. IDs are local run UUIDs, not caller-selected provider session IDs.

## Troubleshooting

- 400: invalid owner, request schema, unsupported native-output field or bounds.
- 403: another exercise owner attempted to control the run.
- 404: unknown run ID.
- 409: closed, expired or stopping run; pending cleanup; or Close before idle.
- 422: missing live configuration or inherited capabilities were not cleared.
- 429: the per-session send queue or retained-session capacity is full. Close another session.
- 503: the server could not reach Anthropic. Run the development server in a terminal with network access, check connectivity, and retry explicitly. Local setup readiness does not verify provider access.
- **cleanup-pending / unconfirmed**: the interrupt acknowledgment did not prove idle. Inspect the session in Claude Console. Do not reuse it based on an HTTP acknowledgment alone.

## Limitations

Offline events are authored examples. Validation proves schema conformance, not factual truth. Only observed spans populate usage; they do not imply complete session cost. Interrupt does not undo prior effects. This text-only single-agent lesson excludes dynamic workflows. A retained run expires after 15 minutes of inactivity; expiry and shutdown request bounded cleanup. Pending remote cleanup remains visible and does not count as a successful archive. Exercise ownership isolates local runs but is not a general multi-user authentication system.

## Challenge

Run Hang, interrupt, confirm idle and send a valid report. Identify the preserved session ID. Compare this with Abort and Close, which end future sends after cleanup.

## PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab10-structured-interrupt.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/run-browser-tests.mjs browser-tests/lab10.spec.ts --reporter=list
```

Provider references: [Interrupt event semantics](https://platform.claude.com/docs/en/managed-agents/events-and-streaming) and [Session operations](https://platform.claude.com/docs/en/managed-agents/session-operations). Implementation is checked against installed SDK 0.133.0 types.

Baseline and comparison
1. Run valid and invalid report fixtures and inspect host verification.
2. Run Corrected and Exhausted to see the single corrective-round limit.
3. Run Hang, interrupt it and confirm idle before sending another turn.
4. Disconnect locally or abort and inspect remote cleanup separately.
5. Close an idle session and verify future sends are rejected.

Student challenge
Identify the stop action that keeps the same session available for another turn and the evidence required before reuse.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab10-structured-interrupt.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L11 Managed skills and progressive loading

Inspect pinned skill metadata separately from observed instruction and reference file reads in fresh sessions.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 11 Managed skills and progressive loading after the preceding lesson. Goal: Inspect pinned skill metadata separately from observed instruction and reference file reads in fresh sessions.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c11. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept11Skills.tsx
- server/concepts/11-skills.ts
- shared/lab11-skills.ts
- server/lib/lab11-bundle.ts
- server/lib/lab11-port.ts
- server/lib/lab11-run.ts
- Tab11-skills.md

Implementation brief
Goal: Inspect attached skill metadata and subsequent file loading.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept11Skills.tsx; server/concepts/11-skills.ts; Tab11-skills.md

Build: Author a formatting skill with SKILL.md frontmatter and a reference file. Build an explicit setup command that uploads the bundle through the Skills API and records a pinned skill ID/version; never provision in a run request. Attach via the agent skills array or session override supported by installed types. Distinguish configured metadata, observed SKILL.md reads and reference reads. A local .claude/skills folder is not automatically mounted into a cloud session; trusted GitHub repository discovery is a separate documented path. Plugin discovery, Skill tool invocation, manual-only enforcement, hot reload and subagent preload APIs from Agent SDK are not assumed. Host restrictions, not descriptions, enforce manual-only actions.

Experiment: Compare a new session with/without the skill, missing ID, absent reference and a revised pinned version in another fresh session.

Verify: Verify the authored bundle and declared/observed files separately. Model relevance decisions need not load a skill every run. Skill filtering is not authorization. Inspect worker configuration separately when adding skills to children.

Reference route inventory under /api/c11: GET /skills; POST /invoke; POST /load; POST /new-session

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Use Node.js 24 and the installed official TypeScript SDK 0.133.0. Offline mode requires no credentials. The authored bundles live in `skills/lab11/`, with a `format-observation/SKILL.md` and a reference file in v1 and v2. The missing-reference bundle deliberately omits that file.

For live mode, reuse the configured base agent and environment, with server-only API credentials and explicit live opt-in. No upload, agent provisioning or model execution occurs at startup, during an offline exercise, or during a local setup check.

```powershell
cd C:\claude-managed-agents
npm.cmd install
npm.cmd run skills:check -- v1
npm.cmd run skills:check -- missing-reference
npm.cmd run skills:check -- v2
npm.cmd run dev
```

Open the actual localhost URL printed by Vite, then select Lab 11. Vite prefers 5174 and can select a free port. Keep the backend running with outbound connectivity for deliberate live runs.

Skill uploads are separate explicit external writes. Run these only when you choose to create the cloud resources:

```powershell
npm.cmd run skills:upload -- v1
npm.cmd run skills:upload -- missing-reference
npm.cmd run skills:upload -- v2
```

The first command creates a skill; subsequent commands upload complete snapshots as new versions of that skill. Returned IDs and immutable version IDs are recorded in `managed/lab11-skills.local.json`, excluded from Git and npm distribution. The command refuses to overwrite an existing revision pin. Never retry an uncertain upload automatically; reconcile the returned resource in Claude Console if local recording failed. Uploads do not create a session or run a model.

## Controls

- **Skill variant** selects no attachment, pinned v1, missing ID, missing reference, or pinned v2.
- **Offline loading scenario** selects successful reads, metadata only, failed reads, duplicate events or a hanging stream.
- **Preview authored instructions / reference** loads an allowlisted host file. This preview is not an agent read and never changes a run's evidence.
- **Refresh pin metadata** checks the local manifest and bundle hashes without contacting Anthropic. Configured readiness is not verified provider access.
- **Run offline skill experiment** creates an authored fresh session. Missing ID creates no session.
- **Compare all offline variants** runs the five comparisons serially; every created session has a different ID. This button never runs a live comparison.
- **Cancel experiment** stops local waiting and initiates fresh bounded remote interrupt/status/archive requests through the shared runner.
- **Run live** explicitly runs one selected variant in a billed fresh session. It requires matching pins for attached skills. The host reads provider version metadata before session creation, but never uploads in a run request.

Routes under `/api/c11`: `GET /skills` returns authored metadata and pin readiness; `POST /load` previews a selected local file; `POST /invoke` and `POST /new-session` both run one fresh comparison turn and archive it after idle confirmation. These route names are host operations, not a provider Skill tool. Run requests require `X-Lab-Owner`. Each request owns its newly created session; callers cannot supply a remote session ID or control another request. At most two runs are active, and one per exercise owner. Retained-session controls remain in Labs 06 and 10.

## Evidence to inspect

Keep three layers separate: the authored bundle and its SHA-256; the configured immutable attachment and resolved session skills; and observed `read` tool uses correlated by event ID with `agent.tool_result`. Read attempts, successes and errors are distinct. Duplicate events count once. Instruction and reference reads are displayed separately, with their event IDs and paths.

Only clean absolute paths under a skills directory ending in the authored skill name and exact allowlisted filename are classified. A main-thread read result can show successful loading; an exact authored-text match provides additional evidence. This does not attest semantic compliance or independently prove the entire remote bundle. Truncated or line-numbered output may not establish an exact text match. Agent claims and host previews never count as read evidence. Unrecognized paths stay visible in full tool evidence JSON. A model may not load a relevant-looking skill; missing events are not proof of no read.

The session override pins the retrieved base agent version, preserves its model/system, replaces inherited tools with read only, clears MCP and attaches only the selected custom skill version. Unexpected resolved capabilities block the prompt and trigger cleanup of the returned session ID. Write, edit, bash and web tools are disabled by the toolset; a skill description does not authorize them. Unexpected pauses are denied. The lesson does not implement a manual-only Skill invocation API.

The session can return a numeric version alias while the configured immutable pin uses a `skver_` ID. The host preserves the raw returned version and resolves a numeric alias with a read-only, skill-scoped version lookup. It accepts only the exact configured skill and canonical version ID. Unknown aliases, unavailable lookups, extra skills and `latest` remain rejected before prompt submission; the created session ID is still available for cleanup. Raw and verified canonical versions appear separately in the evidence.

Live usage is aggregated only from deduplicated model-request spans. It includes observed input/output/cache counts, not complete billed session cost. Offline results have no measured usage. Cleanup is separate from completion and can remain pending; an interrupt acknowledgment is followed by status confirmation.

## Troubleshooting

- 400: unsupported Agent SDK fields, invalid file selection, missing owner or limits exceeding server policy.
- 403: wrong local application origin.
- 404 from Preview: the selected revision has no reference file, as intended.
- 422: missing, outdated or invalid pins, disabled live mode or incomplete configuration. Check locally, upload deliberately and refresh metadata. Provider failures after streaming appear in the outcome; inspect safe diagnostics and Claude Console.
- 429: active capacity or same-owner concurrency bound reached.
- No observed reads: use Metadata only offline to understand that attachment is not loading. Live relevance is decided by the model; it need not load every skill.
- Cleanup pending: inspect the printed session ID in Claude Console. Local cancellation does not prove a remote stop or archive.

## Limitations

Fixtures teach the event protocol; they are not measured model relevance or quality. Missing reference in a live run requires its own explicitly uploaded snapshot. Revised versions apply in another fresh session, with no hot reload of existing sessions.

A local `.claude/skills` directory is not automatically mounted into a cloud session. A separately mounted trusted GitHub repository can expose its root `.claude/skills/<name>/SKILL.md` at session start. This lab mounts no repository. Review repository instructions before trusting that distinct discovery path. Plugin discovery, Agent SDK Skill tool calls, manual-only flags, hot reload and subagent preload APIs are not assumed. Skill filtering is not authorization. Child agents require independent worker skill/capability configuration; this lesson rejects multiagent bases.

## Challenge

Run With pinned skill using Metadata only, then successful reads. Compare configured/resolved metadata with the two read event pairs. Preview the reference and explain why that does not add agent evidence. Compare v1 and v2, then remove the reference. Predict which evidence can change while the attachment count remains one.

## Official references

- [Managed Agents skills](https://platform.claude.com/docs/en/managed-agents/skills)
- [Create a skill](https://platform.claude.com/docs/en/api/beta/skills/create)
- [Skill versions](https://platform.claude.com/docs/en/api/beta/skills/versions/create)
- [Get Skill Version](https://platform.claude.com/docs/en/api/typescript/beta/skills/versions/retrieve)
- [Managed Agents permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies)

The checked-in implementation uses the installed SDK types as the parameter contract.

Baseline and comparison
1. Compare all five offline variants and identify distinct session IDs.
2. Preview the authored instructions and reference; confirm a host preview is not an agent read.
3. Run Metadata only and Failed read to distinguish attachment, attempted loading and successful loading.
4. Compare revision v1 with v2 and inspect their different pinned versions.
5. Check the bundle locally, upload only through the explicit CLI, and opt into a live fresh session separately.

Student challenge
Compare attached metadata with event evidence that SKILL.md was read. Explain why no observed read does not prove the skill was unavailable.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab11-skills.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L12 Multiple messages in one session

Queue multiple messages in one retained session, separating local admission, provider acceptance and correlated turn outcomes.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 12 Multiple messages in one session after the preceding lesson. Goal: Queue multiple messages in one retained session, separating local admission, provider acceptance and correlated turn outcomes.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c12. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept12StreamingInput.tsx
- server/concepts/12-streaming-input.ts
- shared/lab12-streaming-input.ts
- server/lib/lab12-queue.ts
- server/lib/lab12-port.ts
- Tab12-streaming-input.md

Implementation brief
Goal: Drive multiple turns without an Agent SDK async generator.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept12StreamingInput.tsx; server/concepts/12-streaming-input.ts; Tab12-streaming-input.md

Build: Create one remote session and open its event stream. A bounded host queue submits user.message events with explicit local command IDs and records returned event IDs; distinguish admission, server processing and turn outcome. Keep session state separate from message state, serialize this lab's sends and drain on end/cancel. No SDKUserMessage generator, setModel, setPermissionMode, priority-now or getContextUsage method exists by analogy. Show supported tool/MCP idle updates separately; model/effort changes use a new session with explicit context handoff. Support a small validated image block only through the installed Managed event types.

Experiment: Queue a follow-up while busy, compare a host-authored message script with one message, reject oversized input and show close with queued work.

Verify: Test ordering, event correlation, one admitted command per effect, closed-queue rejection and cleanup. Never guess one terminal event per user message when messages can coalesce; the lab's serialized sends make its turn accounting explicit.

Reference route inventory under /api/c12: POST /session; POST /send; POST /new-model-session; POST /tools; POST /context; POST /end; POST /script

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

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

The provider interfaces were checked against installed `@anthropic-ai/sdk` 0.133.0 and the official [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations) and [event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming) documentation. There is no assumed `setModel`, `setPermissionMode`, priority-now or `getContextUsage` method.

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

Baseline and comparison
1. Create an offline session and queue one Normal message. Inspect its local command and returned user event IDs.
2. Choose Slow, queue a message, then queue a follow-up while the first is running. Confirm that the second waits for completed idle evidence.
3. Compare one message with the two-message script; the script is a bounded host queue, not an Agent SDK async generator.
4. Try an oversized message, then close a Hang run with waiting work. Confirm rejection before submission and cancellation of waiting commands.
5. Open idle configuration. Apply read-only tools, append explicit system context, then create a new model session with a context handoff.

Student challenge
Queue a follow-up while busy. Identify admission, processing, provider acceptance and completion evidence, then prove that closing the queue prevented waiting commands from being sent.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab12-streaming-input.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L13 MCP connections and reachability

Connect real local MCP transports, separate configuration from observed reachability, and compare host bridges with native Managed HTTPS MCP.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 13 MCP connections and reachability after the preceding lesson. Goal: Connect real local MCP transports, separate configuration from observed reachability, and compare host bridges with native Managed HTTPS MCP.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c13. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept13McpServers.tsx
- server/concepts/13-mcp-servers.ts
- shared/lab13-mcp.ts
- server/lib/lab13-local-mcp.ts
- server/lib/lab13-port.ts
- server/lib/lab13-sessions.ts
- mcp-servers/lab13-notes.mjs
- mcp-servers/lab13-inventory.ts
- Tab13-mcp-servers.md

Implementation brief
Goal: Connect reachable MCP tools and distinguish host transport from cloud access.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept13McpServers.tsx; server/concepts/13-mcp-servers.ts; Tab13-mcp-servers.md

Build: Author a notes stdio MCP server for local host tests and an authenticated Streamable HTTP inventory server. A Managed sandbox cannot reach the learner's 127.0.0.1 or spawn the host stdio server directly. Live integration requires an explicitly configured reachable HTTPS server or reviewed tunnel; alternatively bridge local MCP calls through typed custom tools. Configure mcp_servers URL definitions plus matching mcp_toolset policies using installed types. Keep credentials in supported vault setup or the server bridge. Inspect resolved tools, actual events and failures; no status/reconnect query method is assumed. Idle-session tools/MCP updates are capability checked and validated.

Experiment: Working, missing and unauthorized connections; disable a tool/server through supported configuration, then test calls. Offline uses real local MCP transports and no cloud exposure.

Verify: Local stdout remains protocol-only, test auth and transport cleanup, and label local reachability honestly. No automatic public tunnel or OAuth. Do not forward unbounded arbitrary URLs.

Reference route inventory under /api/c13: GET /servers; POST /query; POST /session; POST /send; POST /configure; POST /end; GET /stock; POST /stock/reset

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

This lesson connects a real notes stdio MCP process and an owned authenticated Streamable HTTP inventory server. Offline agent events are authored, but the local MCP handshakes, tool discovery, authentication failures and stock effects are real host observations.

## Prerequisites

Start the app with `npm run dev` and use the actual Vite URL. Node 24 and the authored MCP servers are included; there is no additional MCP SDK dependency. The servers implement a bounded MCP **2025-11-25** subset: initialize, initialized notification, tools/list, tools/call and ping. Inventory uses stateless JSON responses over Streamable HTTP; optional GET streams and session IDs are not implemented. Both transports remain host-local.

Live host bridge needs the existing isolated Managed API key, single-agent base, environment and live opt-in. Native Managed URL mode additionally needs server-only `CLAUDE_MANAGED_LAB13_INVENTORY_URL` and `CLAUDE_MANAGED_LAB13_VAULT_ID`, with a reviewed reachable HTTPS inventory endpoint and a matching credential already registered in that vault. The local demo is not deployed or tunneled automatically. Keys and bearer tokens never go in browser requests or agent definitions.

## Controls

- Run offline MCP experiment creates owned local transports and an authored agent session, then executes the chosen tool plan through real MCP. Create offline MCP session prepares connections without sending a prompt.
- Working proves local protocol handshakes and tool discovery. Missing uses a fixed nonexistent notes script and missing local HTTP path; Unauthorized supplies an intentionally wrong local credential. Hang exercises cancellation without paid execution.
- Enable/disable the notes server, inventory server or fictional reservation tool, then Apply idle MCP configuration to the retained session. Proposed controls do not change effective configuration until applied.
- Inspect lists notes and calls get_stock. Reserve attempts to reserve one fictional NOTEBOOK. Offline plans deliberately attempt even disabled calls to demonstrate rejection before host dispatch; a live model selects its own calls.
- Reset owned local stock restores only that exercise's fictional inventory while idle. Inspect local stock and session reads the actual host checkpoint, including after cancellation. The host snapshot is never labeled a remote inventory measurement.
- Close MCP session stops the owned child process and HTTP listener, then confirms remote idle and archives. Cancellation of an in-flight stream requests cleanup; inspect afterward before attempting reuse.
- Run live deliberately starts billed work. The host bridge declares typed custom tools and returns their results via `user.custom_tool_result`; it does not pretend those calls were native agent.mcp_tool_use events. Native mode is inventory-only and read-only, declares a matching URL/server toolset and attaches the existing vault at creation. It never forwards browser-supplied URLs, credentials, stdio commands or provider session IDs.

## Evidence to inspect

Connection observations separate advertised tool names from the effective allowlist. A `ready-local` result means a real local MCP handshake/discovery succeeded; `configured-cloud` means configuration metadata only. Neither proves cloud connectivity. The inventory client records actual HTTP 401/404 failures and correlated JSON-RPC request IDs; the notes client consumes protocol-only newline-delimited stdout.

Each bridged call records the agent custom-use event, validated host dispatch, MCP result text or pre-dispatch rejection. Disabled/unknown/invalid calls never reach the tool handler. A transport error after a dispatch is not proof that a mutation did not happen; inspect local stock before retrying. Host answer IDs are deduplicated by the shared tool-session runner.

Native calls require matching agent.mcp_tool_use/result events; unmatched results do not manufacture success. The provider may report connection/authentication session errors even after successful session creation. Result content is reported provider evidence, not an independent host-side remote stock check. Unexpected permission pauses are denied rather than permitting unreviewed tools.

A completed agent turn can contain tool errors. Check the call outcomes and actual stock, not the agent's claims. Only a completed, confirmed-idle session is retained for another turn. Other outcomes follow existing interruption/archive semantics and can leave cleanup pending. Session ownership, two-session capacity, deadlines, idle expiry, bounded turns/calls and local-origin checks protect the host state. Every subsequent live turn gates the provider stream on its newly returned user event ID, so old idle events cannot finish a new turn.

The host bridge uses only two authored server destinations. Its child process receives a minimal environment without the Managed API key. The inventory bearer token is generated on the server and retained only in memory. Native mode takes one configured HTTPS destination from server settings; credential attachment uses `vault_ids`, with no invented token field on mcp_servers. Idle updates change tools and MCP server lists together; model changes remain a separate session operation.

| Route | Purpose |
| --- | --- |
| GET /api/c13/servers | Authored catalog and local setup metadata; no provider calls |
| POST /api/c13/session | Prepare owned transports and a retained session |
| POST /api/c13/query | Create and run one explicit turn through shared SSE |
| POST /api/c13/send | Run another turn in an owned idle session |
| POST /api/c13/configure | Apply supported idle tool/server configuration |
| POST /api/c13/end | Stop local transports and request verified remote cleanup |
| GET /api/c13/stock | Inspect owned host inventory and session checkpoint |
| POST /api/c13/stock/reset | Reset idle fictional host inventory only |

## Troubleshooting

- 400: invalid fields, arbitrary URLs/commands, unsupported SDK fields, or limits above server policy. Native URL mode must be live and read-only with notes disabled.
- 403: wrong local origin or exercise owner.
- 409: non-idle configure/send, another retained session owned by this exercise, or unsupported reset.
- 422: incomplete live/native setup, unexpected resolved capabilities or failed creation. A returned session ID is retained for cleanup when available.
- 429: retained-session or evidence capacity. Close an existing session before starting another.
- Local HTTP 401 is the intentional unauthorized experiment. HTTP 404 is the missing local endpoint. Close, select Working and start a fresh session to compare.
- Cleanup pending does not prove remote stop; inspect the session in Claude Console and retry Close. A local child/listener cleanup is separate from remote archive.

## Limitations

The servers are small teaching implementations pinned to MCP 2025-11-25, not general MCP gateways or production OAuth services. No public exposure, tunnel, vault provisioning or paid validation is automatic. Native endpoint DNS/environment reachability, vault URL matching, live tool behavior and model availability require deliberate user testing. Local discovery does not mount a .claude folder or stdio process in a Managed sandbox. Metadata does not attest connectivity. State is in-memory and tied to the local server process; output and event histories are bounded.

See the official [Managed MCP connector](https://platform.claude.com/docs/en/managed-agents/mcp-connector) for URL declarations, toolset policies, vault matching and provider errors, and the pinned [MCP transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) for stdio and Streamable HTTP behavior.

## Challenge

Enable reservation, apply configuration and reserve one NOTEBOOK. Disable inventory, apply again and attempt the same reservation. Confirm the second call is rejected before MCP dispatch and stock stays unchanged. Then explain what additional evidence a native cloud connection would require.

## TypeScript source

Inspect the actual React exercise, router, session store, injected provider adapter, transport clients and both authored MCP servers in the source tab.

Baseline and comparison
1. Run Working offline and inspect the real notes stdio and authenticated inventory HTTP handshakes.
2. Compare advertised tools with effective tools. Enable fictional reservation, apply the idle configuration and attempt one reservation.
3. Disable the inventory server or reservation tool, apply while idle, then attempt the same call. Confirm local stock stayed unchanged.
4. Close the session and compare Missing and Unauthorized scenarios. Local HTTP 404/401 errors are not cloud reachability tests.
5. Inspect the typed host bridge and native URL source. Live native MCP requires a reviewed reachable HTTPS endpoint and a matching pre-registered vault.

Student challenge
Disable a server and inspect which calls remain possible. Prove the disabled tool had no host MCP effect, and explain why local success does not prove cloud access.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab13-mcp.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L14 Models and supported effort

Compare supported model and effort settings in fresh sessions with resolved metadata, public responses and explicit fallback budgets.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 14 Models and supported effort after the preceding lesson. Goal: Compare supported model and effort settings in fresh sessions with resolved metadata, public responses and explicit fallback budgets.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c14. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept14ThinkingEffortModels.tsx
- server/concepts/14-thinking-effort-models.ts
- shared/lab14-models.ts
- server/lib/lab14-port.ts
- server/lib/lab14-run.ts
- Tab14-thinking-effort-models.md

Implementation brief
Goal: Compare supported model and effort settings for fresh sessions.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept14ThinkingEffortModels.tsx; server/concepts/14-thinking-effort-models.ts; Tab14-thinking-effort-models.md

Build: Build a server-owned capability catalog from pinned model types, current documentation and explicit account readiness. Configure model objects and supported effort at agent setup or session creation; show the resolved model snapshot. Agent SDK thinking budgets, fallbackModel, supportedModels and in-place model/effort controls are not assumed. Mark unsupported thinking settings with reasons. A host fallback starts a separately identified session only under explicit policy and user-selected budget; it must reconcile any uncertain earlier work first.

Experiment: Compare allowed effort settings with fixed prompt/model, reject incompatible values and simulate an unavailable primary model. Observe only returned public summaries.

Verify: Reject invalid combinations before sending. Record actual model identity and usage per attempt. Fixture latency and assumed costs remain separate from measurements; never fabricate private reasoning or fallback events.

Reference route inventory under /api/c14: POST /run; GET /models; POST /session; POST /send; POST /new-configuration; POST /end

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Compare supported model and effort configurations in fresh Managed Agents sessions. Keep the prompt and model fixed when studying effort. Only public response text is shown.

## Prerequisites

Use Node, React, Vite, strict TypeScript, Express, Zod and the pinned official Anthropic SDK 0.133.0. Offline experiments need no credentials. Live runs require the isolated server API key, a single-agent base agent, environment, live opt-in and operator-declared model readiness. Nothing is provisioned by this lesson.

```powershell
npm.cmd install
npm.cmd run dev
# Optional live readiness declaration, after checking your account access:
# Add to your server .env, then restart the backend:
# CLAUDE_MANAGED_LAB14_MODELS=claude-sonnet-5-5,claude-opus-5-5
```

Open http://127.0.0.1:5174/?lesson=14 and choose Run the exercise. Use the actual port printed by Vite if another process occupies 5174.

## Controls

Select the model, effort, integer-cent budget and local deadline. Run offline model experiment first. Normal completes; primary-unavailable simulates a rejected creation; uncertain blocks fallback; mismatch sends no prompt; hang exercises local cancellation and cleanup. These scenarios never contact Anthropic.

Allow one host fallback only when you want a second model and have selected its separate budget. The fixed prompt and effort carry over. There are at most two attempts, each with a distinct fresh session. Cancellation, unknown creation, unresolved cleanup and resolved configuration mismatch block fallback. Combined selected limits are displayed; they are not measured costs.

Run live is an explicit billed action. Setup and catalog reads are local checks. Supported effort is configured in a model object at session creation; there is no in-place model/effort setter. Close and reconcile experiment attempts cleanup with fresh requests; a local abort does not prove a remote stop.

The application routes under `/api/c14` are GET `/models`, POST `/run`, `/session`, `/send`, `/new-configuration`, `/end`. `/session` prepares an owned local configuration without provider calls; `/send` starts its one fresh remote session. `/run` combines those two operations. `/new-configuration` reconciles the previous experiment before preparing its replacement. Completed turns are archived after idle confirmation. This lesson intentionally avoids conversational carryover between effort comparisons.

## Evidence to inspect

Compare requested and resolved model ID, effort, pinned base agent version and budget. A mismatched snapshot prevents sending and retains the remote ID for cleanup. Model identity is the session snapshot: installed model-request spans do not carry a model ID. Usage is deduplicated by event ID and counts only model-request end events received after the acknowledged user message. Missing spans mean usage is not reported.

Public messages and outcomes are evidence, not proof of correctness. Private thinking events are filtered. Offline usage, latency and cost measurements stay absent. Live host elapsed time includes setup and cleanup, so it is not pure model latency. Evidence text is bounded and may be clipped.

The closed catalog is a teaching allowlist, not the provider's exhaustive model list. It combines installed model types, [official effort documentation](https://platform.claude.com/docs/en/build-with-claude/effort), [Managed sessions](https://platform.claude.com/docs/en/managed-agents/sessions) and [session creation reference](https://platform.claude.com/docs/en/api/typescript/beta/sessions/create), checked 2026-10-14. Sonnet 4.6 rejects xhigh in this catalog. Account readiness is an explicit operator declaration, not an API-discovered entitlement.

## Troubleshooting

For unavailable live setup, configure base resources and add selected model IDs to `CLAUDE_MANAGED_LAB14_MODELS`, then restart and check again. Never paste API keys into a user prompt or the browser. Incompatible model/effort values and extra fields are rejected before sending. Thinking budgets, fallbackModel and supportedModels are Agent SDK fields and are unsupported here.

Unknown creation or cleanup reserves the experiment's capacity. Close and reconcile retries known idle-session archival. A creation failure with no returned session ID requires manual Console investigation; do not automatically resend. Reusing a completed configuration is rejected; prepare a new configuration. Prepared local experiments expire after 15 minutes; uncertain work does not expire automatically.

## Limitations

No paid model tests, resource provisioning, automatic entitlement checks, pricing assumptions or private reasoning inspection run during setup or fixtures. Provider capability and account access can differ from the dated catalog. Budgets stop new model requests between requests and should not be interpreted as exact billed-cost measurements. Each request has a finite local deadline; cleanup is separately bounded. Two experiment slots by default, one per owner, prevent unbounded concurrency.

## Challenge

Change supported effort while holding prompt and model fixed. Explain which observations came from authored fixtures, resolved provider metadata, public responses and usage spans. Simulate an unavailable primary with fallback enabled; then switch to uncertain and explain why the second model must not start.

Baseline and comparison
1. Hold the prompt and model fixed; compare low, medium and high effort offline.
2. Reject incompatible values and inspect the resolved model snapshot.
3. Simulate unavailable and uncertain primary models with one explicitly budgeted host fallback.

Student challenge
Change supported effort while keeping prompt and model fixed in fresh sessions. Explain why uncertain work blocks fallback.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab14-models.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L15 Usage and session budgets

Read cumulative session usage and separate overlapping scopes while enforcing platform budgets and bounded host turns.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 15 Usage and session budgets after the preceding lesson. Goal: Read cumulative session usage and separate overlapping scopes while enforcing platform budgets and bounded host turns.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c15. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept15CostUsage.tsx
- server/concepts/15-cost-usage.ts
- shared/lab15-usage.ts
- server/lib/lab15-accounting.ts
- server/lib/lab15-port.ts
- server/lib/lab15-sessions.ts
- Tab15-cost-usage.md

Implementation brief
Goal: Read real usage and enforce bounded session spending.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept15CostUsage.tsx; server/concepts/15-cost-usage.ts; Tab15-cost-usage.md

Build: Use retrieved session usage, session.usage where present, and documented model-request span usage. Show cumulative input/output/cache tokens, active time, list cost and available thread attribution. Parse USD amount as integer cents from its string representation; unknown values stay null. Never use result.usage, modelUsage or total_cost_usd from Agent SDK. Deduplicate events and compute nonnegative deltas between comparable cumulative snapshots; show attribution/scope rather than summing overlapping session and thread totals. Configure a budget at creation and bounded host message/tool/turn limits.

Experiment: Repeated usage events, child activity, local turn limit, budget_reached and missing usage. Budget changes require a separate explicit action because raising/removing a cap can resume work; no automatic increase.

Verify: A cap tracks platform list cost, not guaranteed final invoice cost, and in-flight work can overshoot. Test cent conversion, snapshot replacement, unavailable usage and budget-create-only constraints in installed types.

Reference route inventory under /api/c15: POST /run; POST /session; POST /send; POST /context; POST /usage; POST /end

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Read returned usage and enforce spending boundaries. Session retrieval, usage events, observed model-request spans and thread attribution have distinct scopes. The exercise never adds overlapping totals.

## Prerequisites

Use the existing React, Vite, strict TypeScript, Express and Zod platform with official Anthropic SDK 0.133.0. Offline accounting scenarios require no credentials. Live requires the isolated server API key, single-agent base agent/environment and explicit live opt-in. No provisioning or paid test starts during setup.

```powershell
npm.cmd install
npm.cmd run dev
# Open the actual Vite address, normally:
# http://127.0.0.1:5174/?lesson=15
```

## Controls

Choose a creation budget in whole US cents, message/turn limits and deadline before starting. Start offline usage experiment first. Repeated-usage duplicates persisted events; child-activity provides fictional overlapping thread totals; missing-usage leaves fields unknown; budget-reached pauses; hang exercises cancellation. All fixture values are authored, not measured usage or price predictions.

Send another turn reuses the owned idle session while respecting independent message and turn limits. Each experiment permits at most three turns/messages, one context message, zero tool calls and one explicit budget increase. The context control sends a system message, not a new user turn or a budget update.

Retrieve session usage reads current metadata without resuming work. Close usage session archives only after idle confirmation. Local cancellation initiates independent cleanup; an unknown remote state blocks reuse.

The separate Raise budget and resume action requires acknowledging that paused work may restart immediately. This host only permits a capped increase, up to 500 cents, on an originally budgeted session paused at its cap, above known consumed list cost and within the remaining turn limit. It never removes a cap or adds one late. A raise consumes a host turn even when its acceptance is uncertain. No automatic increase occurs.

Routes under `/api/c15`: POST `/run`, `/session`, `/send`, `/context`, `/usage`, `/end`, plus the explicit `/budget` action. `/session` prepares a local owned experiment with no provider calls; `/send` creates its remote budgeted session on first use. `/run` combines preparation and the first turn.

## Evidence to inspect

Session retrieval supplies cumulative input/output/cache tokens, active seconds and list cost when present. Usage events replace earlier usage-event snapshots; retrieval replaces earlier retrieved snapshots. Deltas require the same scope, identity and source. Missing, invalid or decreasing counters yield unknown deltas rather than invented zeros. Persisted event IDs deduplicate both usage events and observed request spans. Older usage events do not replace newer ones.

Model-request spans only describe requests observed on this stream. They have aggregate cache-creation tokens without TTL attribution and do not establish list cost or complete session consumption. Thread rows are attribution, not additional session usage. One bounded thread-list page is read; unavailable or truncated attribution is labeled. Private thinking is filtered.

USD `amount` is a canonical string of whole cents: `"125"` means 125 cents. Decimal strings, non-USD values, unsafe integers and unavailable values remain unknown. Session totals are replaced, never accumulated across snapshots. Snapshot history is bounded and is not a complete audit record.

## Troubleshooting

Check server setup if Run live is unavailable. Do not paste keys into the browser. A live base with orchestration is rejected; child activity is deliberately demonstrated offline. Invalid fields such as `result.usage`, `modelUsage`, `total_cost_usd`, `maxBudgetUsd` and `maxTurns` are not translated from Agent SDK.

A local turn/message limit blocks the next work-starting request before sending. A budget pause needs an explicit decision to close or raise, not another user message. Unknown list cost prevents raising. Failed or mismatched budget verification, uncertain sends and unconfirmed cleanup prevent reuse. Check Claude Console when no session ID was returned; no automatic retry can safely identify that remote creation.

## Limitations

Live tools and orchestration are disabled, so this lab demonstrates child attribution using fixtures rather than starting extra worker agents. Usage can lag; a later idle-session retrieval can differ from the stream snapshot. Budgets govern platform list cost, while invoice totals may differ. In-flight requests can finish beyond the cap. Session and thread active time/cost have different scopes. The SDK permits updating an existing budget, but rejects adding one to a session created without it; removing a cap is one-way, and this host disallows removal entirely.

The installed session usage, usage-event, span, thread and budget-update types were inspected. Official references checked 2026-10-14: [usage](https://platform.claude.com/docs/en/managed-agents/session-observability) and [budgets](https://platform.claude.com/docs/en/managed-agents/budgets). Current capabilities and account behavior still need deliberate live verification.

## Challenge

Explain why intermediate usage differs from the final session snapshot. Identify which values are cumulative session totals, partial observed spans and overlapping child attribution. Demonstrate that repeated events do not increase totals, a missing field stays unknown, and retrieving usage at a budget pause does not resume work.

Baseline and comparison
1. Compare an intermediate usage event with the retrieved idle-session snapshot.
2. Repeat usage events and inspect child attribution without double counting.
3. Reach a local turn limit or platform budget, then explicitly decide whether to raise the cap.

Student challenge
Explain why intermediate usage differs from the final session snapshot, and why list cost is not a guaranteed invoice total.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab15-usage.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L16 Environment and configuration provenance

Trace synthetic host configuration precedence, server credential readiness and explicit Managed environment resources without conflating their scopes.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 16 Environment and configuration provenance after the preceding lesson. Goal: Trace synthetic host configuration precedence, server credential readiness and explicit Managed environment resources without conflating their scopes.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c16. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept16SettingsEnv.tsx
- server/concepts/16-settings-env.ts
- shared/lab16-settings-env.ts
- server/lib/lab16-provenance.ts
- server/lib/lab16-port.ts
- Tab16-settings-env.md

Implementation brief
Goal: Separate host settings, remote environment settings and credentials.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept16SettingsEnv.tsx; server/concepts/16-settings-env.ts; Tab16-settings-env.md

Build: Create synthetic layered host configuration and a provenance resolver, explicitly labeled application-defined precedence. Author a Managed environment definition with supported container settings and an allowlisted configuration manifest. Display variable names and redacted readiness only. Agent SDK env inheritance/replacement, settings.env, settingSources, resolveSettings and additionalDirectories are not Managed session options. Host process variables do not automatically enter the sandbox. Mount approved fixture files/resources explicitly; optional secrets use documented vault mechanisms, not VITE variables or agent-visible API keys.

Experiment: Winning host layer, missing credential, absent remote fixture mount and a restricted path. Show host-versus-remote context for each setting.

Verify: Never inspect personal configuration. Validate installed environment types and reject unsupported fields; test fixture-only precedence and redaction. Resource mounting is not blanket filesystem access.

Reference route inventory under /api/c16: GET /files; POST /env-run; POST /resolve; POST /layers-run; POST /access-run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Trace which application setting wins locally, then inspect the separate Managed environment and resource boundary. The host precedence in this lesson is **application-defined**, not an Agent SDK feature.

## Prerequisites

```powershell
Set-Location C:\claude-managed-agents
npm.cmd ci
npm.cmd run dev
# Open the Local URL printed by Vite, then ?lesson=16.
```

All four offline scenarios use synthetic settings and authored fixture events. They never read personal configuration or call Anthropic. The course default observation region is `north`; an optional user override wins over it, and an optional session override wins over both. Resolve host settings and Compare three layers display the selected source alongside the value. Missing credential means fictional readiness is false, not that the server inspected your key.

## Controls

The authored cloud example uses supported `BetaCloudConfigParams`: limited networking with no allowed hosts, MCP egress or package managers, and no packages. It is an example definition, not a provisioned environment or a claim about the configured account. The local manifest names one approved fixture mount, `/mnt/session/uploads/field-guide.txt`.

`GET /api/c16/files` reads server readiness and the allowlist without provider calls. It shows the **names** of `ANTHROPIC_API_KEY`, the base environment setting and `CLAUDE_MANAGED_LAB16_FILE_ID`, plus redacted present/missing status. Keys remain server-side. A host process variable is not automatically injected into the remote container. Agent SDK `env` inheritance/replacement, `settings.env`, `settingSources`, `resolveSettings` and `additionalDirectories` are not translated to Managed session options.

For a deliberate live run, configure the isolated server API key, an active single-agent base and cloud environment matching the restricted authored policy, `MANAGED_LIVE_ENABLED=true`, and a previously uploaded, reviewed fictional file ID in server-only `CLAUDE_MANAGED_LAB16_FILE_ID`. Upload the file separately using the documented Files API; this lesson does not provision, upload or copy any local personal file. Click **Run live** only when ready. The server retrieves the actual environment and agent, checks the limited network and empty package settings, pins the agent version, creates a capped text-only session with one file resource, and lists returned session resources to verify its mount path before sending the prompt. It archives after confirmed idle. A resource listing confirms the mount metadata; an agent answer does not prove that the file was read. No vault is attached by this lesson. Future credential examples should use a reviewed Managed vault, never `VITE_` variables or agent-visible API keys.

## Evidence to inspect

Run Winning host layer with user `south` and session `north`, then remove the session override: the winner changes from session to user. The remote `OBSERVATION_REGION` row remains “not injected” in both cases. Missing credential changes only the synthetic readiness row. Absent remote mount removes the fictional file resource. Restricted path asks the host guard about `/etc/passwd`; it is denied without opening any file. The path check is a host policy demonstration, not proof of cloud OS containment or blanket filesystem access.

Routes under `/api/c16` are `GET /files` and `POST /env-run`, `/resolve`, `/layers-run`, `/access-run`. Requests are closed Zod shapes, locally owned, bounded and origin checked. Only `/env-run` supports a separately selected live mode; the other experiments are offline. The live run uses the shared SSE, event-consumer and session cleanup boundary through an injected port.

## Troubleshooting

If Run live is unavailable, check the server-only base agent, cloud environment, isolated API key, live opt-in and approved file ID. Check again after restarting the backend. An unconfirmed mount or remote session blocks the prompt or leaves cleanup pending; inspect Claude Console before repeating any paid action. An offline path denial is a local policy result, not a remote sandbox test.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab16-settings-env.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab16-browser-demonstration.mjs
```

## Limitations

Offline environment, credential and mount evidence is authored. Live environment and resource metadata comes from API responses; the text-only agent has no file-read tool, so the lesson does not claim content-read evidence. An unknown create response may require Claude Console reconciliation. Local abort is not proof of remote stop, and cleanup may remain pending. Environment networking metadata shows configuration, not a network test.

## Challenge

Change a host layer and identify the winning source. Explain why the remote container still lacks that variable unless an explicitly supported resource or service path supplies the needed context.

Official references checked 2026-10-14: [Managed environments API](https://platform.claude.com/docs/en/api/typescript/beta/environments/create), [adding files](https://platform.claude.com/docs/en/managed-agents/files), and [secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment).

Baseline and comparison
1. Change user and session region overrides; compare which host layer wins.
2. Run the missing-credential and absent-mount fixtures; keep unknown remote values separate.
3. Inspect an allowed fixture path and an outside path with the host guard.
4. Review the authored cloud environment definition and server-only manifest.
5. Optionally start one bounded live session after independently configuring an approved uploaded file ID.

Student challenge
Change a host configuration layer. Identify its winning provenance and explain why the remote sandbox value does not change automatically.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab16-settings-env.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L17 Host snapshots and file restoration

Restore tracked host fixture files from an owned snapshot while the retained Managed conversation remains intact.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 17 Host snapshots and file restoration after the preceding lesson. Goal: Restore tracked host fixture files from an owned snapshot while the retained Managed conversation remains intact.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c17. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept17Checkpointing.tsx
- server/concepts/17-checkpointing.ts
- shared/lab17-checkpointing.ts
- server/lib/lab17-files.ts
- server/lib/lab17-run.ts
- Tab17-checkpointing.md

Implementation brief
Goal: Restore fixture files while preserving conversation history.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept17Checkpointing.tsx; server/concepts/17-checkpointing.ts; Tab17-checkpointing.md

Build: Replace enableFileCheckpointing/rewindFiles with host-owned snapshots of an isolated fixture tree. Record snapshot ID, file hashes and related Managed session/event IDs without claiming platform checkpoints. Custom read/write/edit handlers access the host tree; built-in filesystem tools are disabled. Dry-run lists exact restores/deletes; confirmed restore checks ownership, current version and path guards. Remote outputs are downloaded and inspected separately; local restoration does not rewind the cloud sandbox.

Experiment: Edit an existing file, create another, inspect and restore a snapshot; include unknown snapshot and an untracked host file.

Verify: Assert disk contents and explicit tracked-path scope. Restoration erases neither remote events nor network/database effects. Refuse stale or active-run restoration.

Reference route inventory under /api/c17: POST /session; POST /send; POST /snapshot; POST /restore; POST /end; POST /oneshot

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Restore an isolated host fixture tree while retaining Managed session conversation history. These snapshots belong to this application. They are separate from the Managed platform's cloud sandbox checkpoints and do not rewind a remote container.

## Prerequisites

```powershell
Set-Location C:\claude-managed-agents
npm.cmd ci
npm.cmd run dev
# Open the Local URL printed by Vite, then ?lesson=17.
```

The offline exercise uses authored session events and real files under the ignored `generated/lab17/<run-id>/` tree. It does not contact Anthropic. For an optional billed live run, configure the isolated server API key, a single-agent base, cloud environment and `MANAGED_LIVE_ENABLED=true`, then select **Run live**. The live session is text-only with built-in filesystem, MCP and skill tools disabled. No provider resource is created by a readiness check.

## Controls

Start an offline fixture session and take a host snapshot. The tracked paths are exactly `notes.md` and `draft.md`; `scratch.md` is deliberately untracked. The UI action sends a bounded conversation turn through the shared retained-session event consumer. Once confirmed idle, the selected host handler reads, edits or creates a file in the isolated tree. Its effect is application-controlled and independent of the model's answer. Three turns are allowed per session.

After editing `notes.md` and creating `draft.md`, select the original snapshot and **Dry-run restore**. The plan lists exact tracked-path operations and hashes. **Confirm restore** requires that plan ID, the same owner, snapshot and unchanged fixture version. It restores the original `notes.md` and deletes the newly created `draft.md`; it leaves `scratch.md` and conversation turns alone. A new edit invalidates the plan. Unknown snapshots, foreign owners, stale versions and active or uncertain sessions are refused.

**Inspect remote outputs separately** is available after an idle turn. Offline it reports that no remote files exist. Live it lists session-scoped Files API outputs and downloads up to three bounded `.txt` or `.md` files for size/hash inspection, never into the snapshot tree. **Close session** archives the retained session; **Run one-shot offline** demonstrates a separate session that closes after one turn.

Routes under `/api/c17` are `POST /session`, `/send`, `/snapshot`, `/restore`, `/end` and `/oneshot`. Closed Zod request/report shapes, local origin and owner checks, a five-snapshot and two-session cap, version guards, cancellation, deadlines, SSE events and cleanup bound the exercise.

## Evidence to inspect

Compare file content and SHA-256 before and after restoration. A snapshot records its ID, tracked hashes, related session ID, host event IDs and up to twelve **observed** Managed stream event IDs. An ID records correlation, not proof that every remote event was seen. Confirm that the conversation list and session ID remain the same after restore, while `scratch.md` remains present. The `generated/lab17/<run-id>/snapshots/<snapshot-id>.json` file contains only the two tracked contents.

## Troubleshooting

If live setup is unavailable, check the server-only API key, base agent, environment and opt-in. A session that has not reached confirmed idle cannot be snapshotted or restored. If cleanup is pending, reconcile the remote session before another paid run. If restore says the version changed, inspect the latest files and generate a fresh dry run. Avoid editing the generated fixture tree outside this lesson while a plan is pending; the restore also checks current hashes before applying it.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab17-checkpointing.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab17-browser-demonstration.mjs
```

## Limitations

The host file handlers follow explicit UI actions after a model turn; the agent does not invoke a filesystem tool. Offline event and answer evidence is authored. Restoring host files does not reverse conversation events, API calls, remote outputs, usage, network effects or the cloud sandbox. The live output list is bounded and only reports files available through the session-scoped API. A local cancellation does not prove a remote stop.

## Challenge

Edit the original note, create the tracked draft and untracked scratch file, then restore the first snapshot. Explain why the conversation still records those turns and why a remote output would need separate inspection or cleanup.

Official references checked 2026-10-15: [Managed files](https://platform.claude.com/docs/en/managed-agents/files), [events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), and [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations).

Baseline and comparison
1. Prepare an offline fixture session and take a snapshot of notes.md and absent draft.md.
2. Send turns that edit notes.md, create draft.md and create untracked scratch.md.
3. Dry-run restoration to inspect exact tracked restores and deletes.
4. Confirm only with the current host version and matching plan ID; inspect files and unchanged conversation history.
5. Try an unknown snapshot, then inspect remote outputs separately and close the session.

Student challenge
Explain why restoring notes.md and deleting draft.md leaves the conversation and untracked scratch.md intact.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab17-checkpointing.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L18 Cloud sandbox and host boundaries

Inspect configured cloud sandbox policy and independently test a disposable host file boundary without conflating either with agent permission flags.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 18 Cloud sandbox and host boundaries after the preceding lesson. Goal: Inspect configured cloud sandbox policy and independently test a disposable host file boundary without conflating either with agent permission flags.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c18. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept18Sandbox.tsx
- server/concepts/18-sandbox.ts
- shared/lab18-sandbox.ts
- server/lib/lab18-sandbox.ts
- Tab18-sandbox.md

Implementation brief
Goal: Inspect remote sandbox configuration and independent host enforcement.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept18Sandbox.tsx; server/concepts/18-sandbox.ts; Tab18-sandbox.md

Build: Show the configured environment ID/version, approved mounts, supported network settings and readiness without starting a session. Live built-in commands run in the configured remote sandbox, not natively on Windows. Offline policy tests use a disposable host tree and fixed commands; label them as host tests. Keep narrow custom handlers and least privilege even when remote sandbox setup is unavailable. Never copy Agent SDK native sandbox flags onto session creation.

Experiment: Allowed versus outside mount access, blocked network under documented environment policy, missing environment and fail-closed readiness. Offer offline simulation explicitly, without silently switching execution mode.

Verify: Host path checks cannot prove cloud OS containment, and permission flags are not an OS sandbox. No billed diagnostic starts from page load. Test rejection before remote requests and actual effect evidence where executed.

Reference route inventory under /api/c18: GET /platform; POST /availability; POST /run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Inspect the configured Managed environment separately from an application's host path policy. A local allowlist can protect a host handler, but it cannot attest the cloud container's OS isolation.

## Prerequisites

```powershell
Set-Location C:\claude-managed-agents
npm.cmd ci
npm.cmd run dev
# Open the Local URL printed by Vite, then ?lesson=18.
```

The offline path needs no credentials and makes no Anthropic or network request. A deliberate live diagnostic requires an isolated server API key, active single-agent base, cloud environment and `MANAGED_LIVE_ENABLED=true`. The server requires the observed cloud environment to have limited networking with no allowed hosts, MCP egress or package managers, and no installed packages. No environment is provisioned by this lab.

## Controls

On page load, `GET /api/c18/platform` reads **local configuration only**: environment ID, optional agent version pin, the authored policy and the single approved offline host fixture path. SDK 0.133.0 exposes no environment version field. A separately requested live availability check retrieves the environment's `updated_at` as a revision marker; it starts no session.

Use **Run offline host test** for Allowed mount, Outside mount, Blocked network and Missing environment. Each available case creates a disposable host tree. Allowed mount reads an exact allowlisted text file and hashes actual bytes. Outside mount is denied before a read. Blocked network is an authored host policy decision with zero socket calls; it is not a cloud egress test. Missing environment fails closed before creating a fixture tree. The tree is deleted after evidence is captured.

**Inspect live environment** is a deliberate metadata-only provider read. **Run live** separately rechecks the cloud policy, creates one budgeted session with only `bash` enabled under `always_ask`, and asks for `pwd`. The host confirms only the exact `pwd` command; all other calls are denied. The built-in command executes in the Managed cloud sandbox, never in native Windows PowerShell. No file resource is mounted in this live diagnostic. The result shows observed tool use, tool result and cleanup; an agent answer alone is not command evidence.

Routes under `/api/c18` are `GET /platform`, `POST /availability` and `POST /run`. Closed Zod requests reject Agent SDK native sandbox flags. Origin, owner, deadline, budget, concurrency, cancellation and session cleanup are bounded. Setup checks do not create a billed session.

## Evidence to inspect

Compare the four offline cases: one allowed read with a SHA-256 hash; outside path and blocked network with zero read/socket calls; missing environment with no fixture ID and no effects. Inspect the live environment ID, `updated_at`, network policy and archive status before a session. For a live run, require a matching `agent.tool_use`, host confirmation and non-error `agent.tool_result` for `pwd` before calling the command successful.

## Troubleshooting

If live setup is unavailable, check the isolated server API key, base agent, cloud environment, opt-in and bounds. An archived, self-hosted, unrestricted or otherwise unexpected environment fails closed before session creation. A local cancellation does not prove a remote stop; inspect cleanup and Claude Console before repeating a paid diagnostic. An outside host path denial is evidence of this application's guard, not a remote filesystem test.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab18-sandbox.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab18-browser-demonstration.mjs
```

## Limitations

The offline network denial is simulated; no socket or cloud sandbox is exercised. The live diagnostic has no file mount, so it observes a remote `pwd` call only and cannot prove mount enforcement or every OS containment property. A permission flag governs agent tool use, while cloud environment configuration governs sandbox networking; custom host handlers still require their own validation. The environment's `updated_at` is not a version pin.

## Challenge

Run Missing environment and explain why no file read, socket call or session starts. Then contrast that result with Outside mount and explain why neither local observation proves cloud OS containment.

Official references checked 2026-10-15: [cloud environment setup](https://platform.claude.com/docs/en/managed-agents/environments), [secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment), [sandbox boundaries](https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks), and [cloud sandbox reference](https://platform.claude.com/docs/en/managed-agents/cloud-sandboxes-reference).

Baseline and comparison
1. Read the local platform manifest without starting a session.
2. Run Allowed mount and Outside mount offline; compare actual host read counts and hashes.
3. Run Blocked network and Missing environment; inspect the fail-closed results and zero socket calls.
4. Explicitly inspect live cloud metadata, then optionally start a bounded billed pwd diagnostic with host confirmation.
5. Check tool use and result evidence; explain why local path checks do not attest cloud containment.

Student challenge
Explain why an unavailable configured environment fails closed before a session and why an offline host path denial does not prove cloud OS containment.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab18-sandbox.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L19 Session inventory and explicit branches

Inventory owned Managed sessions, inspect bounded history pages and derive a fresh conversation from an explicit host summary.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 19 Session inventory and explicit branches after the preceding lesson. Goal: Inventory owned Managed sessions, inspect bounded history pages and derive a fresh conversation from an explicit host summary.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c19. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept19SessionManagement.tsx
- server/concepts/19-session-management.ts
- shared/lab19-session-management.ts
- server/lib/lab19-sessions.ts
- Tab19-session-management.md

Implementation brief
Goal: Inspect and continue sessions and create reviewable derived conversations.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept19SessionManagement.tsx; server/concepts/19-session-management.ts; Tab19-session-management.md

Build: Implement server-authorized listing/retrieve, paginated event history, title/metadata update, continuation, archive and explicit deletion. Bound output and check ownership before any provider access. No local transcript directory, continue flag, forkSession or resumeSessionAt is assumed. A host branch creates a fresh session with an explicit selected-history summary and lineage metadata; label it a derived conversation, not a native fork or cloned sandbox. Deletion is distinct from archive and requires a user-selected action on owned idle fixtures.

Experiment: Two turns, derived conversation from a chosen evidence boundary, distinct branch IDs, unknown/archived sessions and omitted history pages.

Verify: Original history remains intact. Summary handoff may lose context and carries no hidden state or pending tool calls. Archived sessions accept no new messages. Test pagination and cross-owner operations.

Reference route inventory under /api/c19: POST /turn; GET /sessions; GET /sessions/:id; POST /sessions/:id/rename; POST /sessions/:id/tag; POST /sessions/:id/branch; POST /sessions/:id/archive; POST /sessions/:id/delete; POST /reset

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Managed sessions can retain turns and expose metadata and event history. This lab separates a provider session from the host's bounded, owned conversation record. A derived conversation is a **new session** started with an explicit selected-history summary; it does not inherit hidden state, pending tool calls, or a cloned sandbox.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=19`. The offline fixture requires no credential or Anthropic call. Live requires an isolated server API key, a configured base agent and `MANAGED_LIVE_ENABLED=true`. Each live turn or derived session may incur charges. Loading the page and viewing the host inventory start no billed session. Provider retrieval is a separately selected read.

## Controls

1. Start an offline session with the Aurora Finch reminder. Note the local conversation ID and remote fixture session ID.
2. Change the prompt and send another turn. Confirm that the same session ID is retained, the turn count increments and host-captured events contain both user and agent messages.
3. Select a host event as the branch boundary, then derive a conversation. Compare the distinct IDs, parent and boundary fields, and the exact handoff summary. Inspect the original again to confirm its history remains intact.
4. Rename and tag an idle session. Archive it and inspect the retained host history. Start a separate offline session and select **Delete selected idle session** to remove that owned fixture. Delete requires the explicit selected action; archive is history-preserving.
5. Use a third turn to create more than one history page. Follow **Load next history page** and check the omission indicator. Try an unknown conversation ID or foreign owner in the API tests; neither can access or mutate it.

The exercise uses `POST /api/c19/turn`, `GET /sessions`, `GET /sessions/:id`, `POST /sessions/:id/rename`, `/tag`, `/branch`, `/archive`, `/delete`, and `POST /reset`. Turn and branch responses are SSE streams. A live provider `sessions.list`, `sessions.retrieve`, or paginated `sessions.events.list` occurs only after explicit inspection, after host ownership checks. Provider listing is a bounded page, so absence from that page is not proof that a host-owned session ceased to exist.

## Evidence to inspect

Compare the retained ID across two turns, then the distinct derived ID and recorded parent/boundary. Verify the original event list is unchanged. Read the summary handoff and both history pages. Archive keeps the host record and captured history; deletion removes the selected owned idle record.

## Troubleshooting

If live setup is unavailable, configure the isolated server credential, base agent and opt-in. If a turn is canceled, inspect the retained session's cleanup before retrying. If a branch boundary is unknown, select a host event from the currently owned conversation. If a history page is omitted, follow its next cursor.

## Limitations

Only confirmed-idle, owned active sessions can be continued, branched, renamed, tagged, archived or deleted. The host retains at most six records and three active records per owner. Prompt, event text, history page, cursor, title and tag lengths are bounded; request objects are closed. The offline reset affects only owned fixture records. Local cancellation does not establish a remote stop; inspect cleanup before retrying. Archive preserves session history, while deletion removes the selected idle remote session and cannot be undone.

The host handoff summarizes selected **observed** text. It can omit older details and loses unobserved context. A branch from a user-message boundary excludes the following agent reply. The provider event page is also limited and may omit more pages. Fixture agent replies are authored examples, not model recall evidence.

## Check the implementation

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab19-session-management.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab19-browser-demonstration.mjs
```

Inspect `shared/lab19-session-management.ts`, `server/lib/lab19-sessions.ts`, `server/concepts/19-session-management.ts` and the React exercise.

## Challenge

Explain why the derived conversation's new session ID and explicit summary are evidence of a host-created branch, rather than native `forkSession` or `resumeSessionAt` semantics.

Official reference: [Managed session operations](https://platform.claude.com/docs/en/managed-agents/session-operations), [Sessions API](https://platform.claude.com/docs/en/api/typescript/beta/sessions), [session event pagination](https://platform.claude.com/docs/en/api/typescript/beta/sessions/events/list) (checked 2026-10-15).

Baseline and comparison
1. Start an offline session and send a second turn to the same session ID.
2. Inspect the inventory and history pages, then branch from a selected host event boundary.
3. Compare parent and derived session IDs and the exact summary handoff; the parent history remains intact.
4. Rename and tag an idle session, then compare archive with explicit deletion on a separate fixture.
5. Inspect provider metadata only when deliberately selected in a live run.

Student challenge
Show why a derived conversation is a new session with explicit selected history, not a native fork carrying hidden state.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab19-session-management.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L20 Lifecycle events and host interceptors

Correlate Managed lifecycle events with host interceptor decisions and actual custom-tool effects without treating observations as SDK hook callbacks.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 20 Lifecycle events and host interceptors after the preceding lesson. Goal: Correlate Managed lifecycle events with host interceptor decisions and actual custom-tool effects without treating observations as SDK hook callbacks.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c20. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept20HooksInDepth.tsx
- server/concepts/20-hooks-in-depth.ts
- shared/lab20-hooks-in-depth.ts
- server/lib/lab20-run.ts
- Tab20-hooks-in-depth.md

Implementation brief
Goal: Correlate lifecycle observations with host policy and handler failures.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept20HooksInDepth.tsx; server/concepts/20-hooks-in-depth.ts; Tab20-hooks-in-depth.md

Build: Instrument create/send, session lifecycle, model spans, tool requests/results, custom handler phases, approval decisions, child threads and cleanup. Use a typed union for provider events and a separate typed host-audit union with run/session/thread/event correlation. These are events and application interceptors, not SDK hook callbacks. Only host custom handlers and always_ask confirmations can provide the respective enforcement; observation of a completed tool event cannot prevent its effect.

Experiment: Passing policy, denied pre-execution action, tool failure, interceptor exception, deadline and final validation failure. Stop-time feedback may start a separately bounded corrective message, never an automatic infinite loop.

Verify: Distinguish provider error, tool error and host instrumentation error. Audit failure must not authorize execution. Use fixture-only virtual time and typed event validation.

Reference route inventory under /api/c20: POST /run; GET /files; GET /file; POST /reset

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Managed Agents streams persisted session, span, agent and thread events. They are observations, not Claude Agent SDK hook callbacks. A host can deny an action before execution through its custom-tool handler or an `always_ask` confirmation. Seeing a completed tool event afterward cannot undo its effect.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=20`. Offline scenarios need no credentials and contact no provider. Live requires an isolated server API key, a configured Managed base and the Lab 07 custom-tool agent (`CLAUDE_MANAGED_LAB07_AGENT_ID`), plus `MANAGED_LIVE_ENABLED=true`. A deliberate live click starts a billed session. Readiness is a server-configuration check only and creates none.

## Controls

Use **Run offline lifecycle** for six cases. Passing policy edits `draft.md`; denied pre-execution protects `protected.md`; tool failure reaches the handler with an absent old fragment; interceptor exception fails before creating a session or invoking the handler; deadline advances fixture-only virtual ticks without a provider call; final validation failure completes a fixture turn and edit but rejects the agent text against a closed application report schema. A failing final report starts no automatic corrective loop.

The results show an observed provider-event projection, separate host-audit entries, correlation IDs, outcome, cleanup and actual fixture file content. **Inspect run files** and **Inspect draft.md** read the server-owned fixture after the turn; **Reset this fixture** requires the selected run ID and explicit confirmation.

The local routes are `POST /api/c20/run`, `GET /files`, `GET /file`, `POST /reset`, plus a configuration-only `GET /availability`. Run responses stream over SSE. Requests are strict and bounded. Owner/origin checks, concurrency, deadline, budget, event counts and retained fixtures are capped. No Agent SDK `hooks`, `PreToolUse` or `PostToolUse` field is passed to Managed Agents.

## Evidence to inspect

Compare the host audit's **pre-execution** decision, handler before/after phase and post-execution record with the file's final bytes. Tool failure has a handler failure record; interceptor failure records a skipped handler and no session. A provider error is classified separately from either. The final verifier can reject a completed provider turn. Model spans, approvals and child-thread events are shown only if observed; absence is recorded as coverage, not an invented event. Custom-tool results need no `always_ask` confirmation. A multiagent thread can have its own ID; matching event IDs and thread IDs are carried when observed.

## Troubleshooting

If live setup is unavailable, check the isolated API key, Managed resource IDs, Lab 07 custom-tool agent and explicit opt-in. If the live agent's toolset differs from the expected custom tools, creation fails closed. If a local stream is canceled or a deadline expires, inspect interruption and cleanup before another paid run. Run fixtures remain bounded until reset or server shutdown.

## Limitations

Offline provider frames are authored and labeled `authored-fixture`. Virtual ticks are not wall-clock or provider timing. The fixture uses a single thread and may emit no model spans or approval decisions; those absences do not prove they cannot occur live. Live mode supports only passing-policy and denied-pre-execution; failure variants are offline exercises. The host audit is separate from provider events and cannot attest hidden execution. The final report example uses one closed check and deliberately makes no corrective call. Post-execution observation cannot prevent a prior effect.

## Challenge

Compare a host interceptor exception with a failed tool execution. Which one reached the handler, which created a session, and what does `draft.md` prove in each case?

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab20-hooks-in-depth.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab20-browser-demonstration.mjs
```

Official references checked 2026-10-15: [session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [event type reference](https://platform.claude.com/docs/en/managed-agents/reference), [permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies), [session threads](https://platform.claude.com/docs/en/managed-agents/session-threads).

Baseline and comparison
1. Run the passing offline policy and compare provider events, host audit, and the draft file.
2. Run denied pre-execution, tool failure, and interceptor exception; identify which boundary prevented or attempted execution.
3. Use the virtual-time deadline fixture and inspect cleanup without waiting for a real provider timeout.
4. Run final validation failure and distinguish the completed provider turn from a rejected application report.
5. Inspect source and, only with isolated setup, deliberately run a bounded live custom-tool session.

Student challenge
Compare a host interceptor exception with a failed tool execution. Which one reached the handler, and what did the fixture file prove?

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab20-hooks-in-depth.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L21 Host commands and prompt expansion

Validate host commands, inspect exact fixed-template expansion, and distinguish local-only actions from messages sent on an owned session.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 21 Host commands and prompt expansion after the preceding lesson. Goal: Validate host commands, inspect exact fixed-template expansion, and distinguish local-only actions from messages sent on an owned session.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c21. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept21SlashCommands.tsx
- server/concepts/21-slash-commands.ts
- shared/lab21-slash-commands.ts
- server/lib/lab21-commands.ts
- Tab21-slash-commands.md

Implementation brief
Goal: Expand trusted commands and separate local actions from model turns.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept21SlashCommands.tsx; server/concepts/21-slash-commands.ts; Tab21-slash-commands.md

Build: Author an application command registry with name, arguments, description and fixed prompt template. Validate arguments without shell interpolation; expand model commands into user.message on an owned session. Local-only commands inspect/reset bounded fixture state without a model call. No supportedCommands or local_command SDK message is assumed; file syntax is an authored host format, not automatic Claude Code command discovery.

Experiment: Known command, invalid arguments, unknown command and local-only command in an open session.

Verify: Assert exact expanded content and zero provider sends for local commands. Deny arbitrary paths or executable text. Commands differ from progressively read skill instructions.

Reference route inventory under /api/c21: GET /commands; POST /run; POST /session

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

This lab uses an application-owned command registry. The command names are not SDK slash commands. Fixed templates expand trusted, validated arguments into a `user.message` on an owned retained session. Local commands touch only bounded host state.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=21`. Offline mode needs no key. Live requires the isolated server API key, configured Managed base agent and environment, and `MANAGED_LIVE_ENABLED=true`. Only a deliberate live model command starts a billed Managed session.

## Controls

Prepare an offline session, select **observation** or **checklist**, and run it. Use **Try invalid args** and **Try unknown command** to see pre-send rejection. **Inspect local history** reads at most three command records; **Reset local history** clears them. Close the command session when finished. The registry is read via `GET /api/c21/commands`; `POST /api/c21/session` prepares or closes; `POST /api/c21/run` handles both local and model commands.

## Evidence to inspect

Compare the displayed expanded `user.message` with the fixed template and selected enum values. A model command increments the session message count. Inspect and reset return zero provider sends, and do not change the retained session's model-message count. Invalid input and foreign owners are rejected before any model call.

## Troubleshooting

If a model command fails, inspect session state and cleanup before another command. A local cancellation cannot prove that remote work stopped. A prepared offline session uses a scripted port; live availability is configuration only.

## Limitations

The offline response is an authored fixture. The local history is bounded, process-local and discarded on restart. There is no shell, arbitrary path, command-file discovery or SDK `supportedCommands` assumption. The registry is distinct from managed skills, whose instruction files are progressively read only when selected by the model. A local inspect action does not attest that a remote session exists yet: session creation is deferred until the first model command.

## Challenge

Why does a local inspect command not create a model turn, while a fixed prompt template does? Show the exact message and the two send counts.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab21-slash-commands.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab21-browser-demonstration.mjs
```

Official references: [session events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations).

Baseline and comparison
1. Prepare one bounded offline command session and inspect the fixed command registry.
2. Run a known model command and compare its exact expanded user message with the retained session result.
3. Try an invalid argument and an unknown command; confirm both are rejected before a provider send.
4. Inspect and reset the bounded local history; compare provider send counts before and after.
5. Close the session and inspect the host command implementation and Managed session port.

Student challenge
Why does a local inspect command not create a model turn, while a fixed prompt template does?

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab21-slash-commands.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L22 Explicit project context and memory

Trace exactly which authored project and summary files the host selects for a fresh Managed session without assuming automatic CLAUDE.md discovery.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 22 Explicit project context and memory after the preceding lesson. Goal: Trace exactly which authored project and summary files the host selects for a fresh Managed session without assuming automatic CLAUDE.md discovery.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c22. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept22ClaudeMdMemory.tsx
- server/concepts/22-claude-md-memory.ts
- shared/lab22-claude-md-memory.ts
- server/lib/lab22-context.ts
- Tab22-claude-md-memory.md

Implementation brief
Goal: Trace which authored context and memory resources enter a session.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept22ClaudeMdMemory.tsx; server/concepts/22-claude-md-memory.ts; Tab22-claude-md-memory.md

Build: Author root/nested project documents and a separate memory fixture. The default exercise selects and labels context in host code and exposes provenance; no CLAUDE.md hierarchy or scoped rules loader is assumed from Agent SDK. Test disabled context and explicit summary handoff. Optionally attach a documented Managed memory store only after separately authorized setup, with its own beta/capability checks and tenant ownership. Keep host-selected context, cloud memory resource and remote file reads distinct.

Experiment: Nested document read, conflicting untrusted instructions, disabled source and a fresh session with explicit memory selection.

Verify: Never load home memory. Assert actual inputs/resources and observed file reads; memory prose cannot enforce permissions. A memory-store fixture is not proof of persisted cloud recall.

Reference route inventory under /api/c22: GET /files; POST /reset; POST /run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

The host reads selected authored project files, records their hashes, and sends their text as a `user.message` on a fresh session. File names are teaching fixtures: this application does not assume Claude Code or Agent SDK `CLAUDE.md` discovery. A separate summary fixture demonstrates an explicit handoff. No cloud memory store is attached.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=22`. Offline cases need no credentials and contact no provider. A deliberate live run needs the isolated server API key, configured single-agent Managed base and environment, and `MANAGED_LIVE_ENABLED=true`; it can be billed. Live conflict is disabled.

## Controls

`GET /api/c22/files` previews four fixed, allowlisted files. **Nested** reads root and observation-module documents. **Conflict** adds an untrusted imported note. **Disabled** reads no context. **Handoff** reads root plus a separate summary fixture on a fresh session. `POST /api/c22/run` executes one bounded turn and returns a typed SSE result; `POST /api/c22/reset` removes an owned result after explicit confirmation. Changing a scenario starts a new session, not an implicit continuation.

## Evidence to inspect

Compare selected keys, SHA-256 hashes and the exact composed `user.message` with the file inventory. The host read list is evidence of local file access. The cloud memory field is `not-attached`; remote file reads remain empty because no file-reading tools are enabled in the text-only session. A model response or scripted fixture response is separate from those observations. The untrusted note's instruction is content, not an authorization rule.

## Troubleshooting

If file inventory fails, confirm the authored `fixtures/lab22` files exist. If live setup is unavailable, inspect the isolated server key, base agent, environment and opt-in. If an active run is canceled or times out, local cancellation alone does not prove remote termination; the retained-session cleanup path reconciles the session before a retry.

## Limitations

Offline responses are authored fixtures, not proof of Claude behavior. This exercise reads only fixed workspace fixtures; it never reads a home memory file. It does not attach, create or modify a Managed memory store. [Managed memory stores](https://platform.claude.com/docs/en/managed-agents/memory) are separate workspace resources attached at session creation; the agent then reads them with enabled file tools. Such a setup needs its own tenant ownership and capability checks. No automatic scoped rules loader is inferred from the fixture paths. A selected summary is explicit host input, not persisted cloud recall.

## Challenge

Change from Nested to Handoff. Predict which authored markers disappear and which appear, then compare the exact sent message to your prediction.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab22-claude-md-memory.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab22-browser-demonstration.mjs
```

Official references: [Managed memory](https://platform.claude.com/docs/en/managed-agents/memory), [session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming).

Baseline and comparison
1. Inspect the four allowlisted fixture files and their content hashes.
2. Run nested selection and compare actual host reads with the complete user message.
3. Run the conflicting untrusted note and explain why its prose cannot change permissions.
4. Run with context disabled, then start a fresh session with the explicit handoff summary.
5. Compare local file reads, cloud memory attachment and remote file-read evidence separately.

Student challenge
Disable nested context and select the summary instead. Which authored markers disappear, and which appear in the new session input?

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab22-claude-md-memory.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L23 Reusable capability bundles

Compose a reviewed, hash-pinned host bundle of commands, tools, skills, agent definitions and optional MCP declarations while enforcing worker least privilege.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 23 Reusable capability bundles after the preceding lesson. Goal: Compose a reviewed, hash-pinned host bundle of commands, tools, skills, agent definitions and optional MCP declarations while enforcing worker least privilege.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c23. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept23Plugins.tsx
- server/concepts/23-plugins.ts
- shared/lab23-plugins.ts
- server/lib/lab23-bundles.ts
- Tab23-plugins.md

Implementation brief
Goal: Compose reviewed tools, skills, commands and agent definitions.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept23Plugins.tsx; server/concepts/23-plugins.ts; Tab23-plugins.md

Build: Author a host bundle manifest referencing immutable command templates, custom tools, skill bundles, agent definitions and optional URL MCP declarations. Validate hashes, namespacing and capabilities before composition into versioned Managed configurations. No Agent SDK plugin loader, marketplace install or hook contribution API is assumed. Provision only through explicit setup scripts; Reload updates the local inventory, while resolved session changes follow documented update rules or use a fresh session.

Experiment: Bundle off/on, malformed manifest, missing directory, changed hash, skill inclusion and restricted worker configuration.

Verify: Keep fixtures isolated, reject unknown contributions and test least privilege. A bundle is an application packaging convention, not native plugin execution.

Reference route inventory under /api/c23: GET /plugins; POST /reset; POST /inventory; POST /run; POST /reload

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

This lab treats a plugin as a reviewed application bundle, not an Agent SDK plugin loader. A local manifest pins six fixed contributions by SHA-256: a command template, a read-only custom tool, a skill snapshot, a primary agent definition, a restricted worker definition, and an optional URL MCP declaration. Its `1.0.0` version is a host bundle version, not a provisioned Managed agent version.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=23`. All exercises are offline and require no credentials. The bundle files live under `fixtures/lab23/bird-notebook`; the server reads only those fixed paths. No live resource IDs or pins are provisioned by this lesson.

## Controls

`GET /api/c23/plugins` shows the active manifest and recent owner-local comparisons. `POST /api/c23/reload` rereads the reviewed files. Try Valid, Malformed, Missing directory, Changed hash, and Elevated worker; a rejected reload leaves the active inventory unchanged. Select bundle on/off, skill and optional MCP inclusion, and one of two fictional locations. `POST /api/c23/inventory` compares requested capabilities with an authored fixture resolution. `POST /api/c23/run` invokes the actual read-only host handler only when the bundle is enabled. `POST /api/c23/reset` clears this owner's local comparisons after confirmation.

## Evidence to inspect

Compare each contribution path and pinned hash with the active manifest digest. When disabled, the handler count is zero. When enabled, the `bird.list_sightings` handler reads its validated fixture records and records the checked result. The worker has no tools, skills, MCP servers or dynamic delegation. Skill inclusion is metadata in this exercise, not evidence of an agent file read. MCP inclusion is a declaration; the reserved `example.invalid` endpoint is never contacted. Requested and resolved inventories match only in the authored fixture; no Managed session is created.

## Troubleshooting

If the bundle fails to load, check the six authored fixture files and the pinned hashes in `manifest.json`. A changed file requires a deliberate review and manifest repin; Reload does not silently accept it. Malformed and elevated-worker variants deliberately fail validation. An invalid request field or arbitrary path is rejected before a host tool effect.

## Limitations

This lab does not install a marketplace plugin, register hooks, provision a Managed agent, upload a skill, or connect to MCP. Live mode returns unavailable until those resources are reviewed and provisioned in a separate explicit setup workflow. A future live session would need exact resource IDs and versions, a capability check, and resolved session verification. [Managed agent configuration](https://platform.claude.com/docs/en/managed-agents/agent-setup) is versioned; [session updates](https://platform.claude.com/docs/en/managed-agents/session-operations) can replace tools and MCP servers only while eligible and idle. A changed skill or system value requires a fresh session. Local Reload never updates a remote session.

## Challenge

Reload the reviewed bundle and compare requested with fixture-resolved capabilities. Which observations prove a host effect, and which Managed capabilities remain unverified?

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab23-plugins.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab23-browser-demonstration.mjs
```

Official references: [agent setup](https://platform.claude.com/docs/en/managed-agents/agent-setup), [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations), [skills](https://platform.claude.com/docs/en/managed-agents/skills), [MCP connector](https://platform.claude.com/docs/en/managed-agents/mcp-connector).

Baseline and comparison
1. Inspect the six contribution hashes and the active host bundle version.
2. Compare bundle disabled and enabled inventories, then run the read-only host tool.
3. Include the skill snapshot and optional MCP declaration without claiming an observed skill read or server contact.
4. Try malformed, missing-directory, changed-hash and elevated-worker reloads; verify the accepted inventory stays pinned.
5. Reload the reviewed bundle and distinguish host inventory refresh from a resolved Managed session change.

Student challenge
Reload a reviewed bundle and compare the requested capabilities with the fixture-resolved inventory. What remains unverified in Managed Agents?

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab23-plugins.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L24 Who owns the agent loop

Compare who iterates, executes host tools, holds state and cleans up in a manual Messages loop, the Messages SDK tool runner and Managed session custom tools.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 24 Who owns the agent loop after the preceding lesson. Goal: Compare who iterates, executes host tools, holds state and cleans up in a manual Messages loop, the Messages SDK tool runner and Managed session custom tools.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c24. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept24Harnesses.tsx
- server/concepts/24-harnesses.ts
- shared/lab24-harnesses.ts
- server/lib/lab24-harnesses.ts
- server/lib/lab24-sdk-contracts.ts
- Tab24-harnesses.md

Implementation brief
Goal: Compare host-owned tool loops with the Managed session harness.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept24Harnesses.tsx; server/concepts/24-harnesses.ts; Tab24-harnesses.md

Build: Run one inventory reservation task through a manual @anthropic-ai/sdk Messages loop, its tool runner only if exported, and Managed Agents custom tools. Reuse the same host inventory contracts and effect ledger. Keep direct Messages API paths explicitly separate from Managed session calls and separately opt-in for live execution; no @anthropic-ai/claude-agent-sdk dependency. Show which layer owns iteration, tool execution, approvals, state and cleanup.

Experiment: Trace request, call, checked effect, result and answer; reject large reservation and stop at a host call-count limit.

Verify: All offline modes exercise actual handlers. Model text never becomes inventory state. Different harness events have distinct typed adapters; do not pass Messages options into sessions.create.

Reference route inventory under /api/c24: GET /tools; GET /code; POST /run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

This lab compares a manual Messages loop, the installed Messages SDK tool runner, and Managed session custom tools. The offline adapters use distinct authored event shapes but dispatch every call through the same host inventory handler. Direct Messages requests and Managed sessions are separate API surfaces; no Agent SDK dependency is used.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=24`. Offline experiments need no API key. The installed `@anthropic-ai/sdk` version is pinned at `0.133.0`; its `beta.messages.toolRunner` method is present in the local type declarations. Live paths need independent reviewed setup and opt-in, and are unavailable in this checkpoint.

## Controls

Choose Manual Messages loop, Messages SDK tool runner, or Managed session custom tools. Choose Reserve 2, Reject 5, or Read then limit. Set the host call cap to 1, 2, or 3 and run the offline harness. `GET /api/c24/tools` shows the shared host contract, `GET /api/c24/code` lists the three provider boundaries and source files, and `POST /api/c24/run` produces a bounded result. Live mode is rejected before any API call.

## Evidence to inspect

The trace orders request, typed call, checked host effect, tool result, answer, and cleanup. The manual loop owns iteration and result history. The tool runner would own iteration but still invokes an application callback for a checked tool effect. Managed Agents owns the session loop and pauses for `agent.custom_tool_use`; the client supplies `user.custom_tool_result`. The offline event adapters demonstrate these shapes, not provider execution. All three paths execute the same host handler in their offline modes. The host effect ledger and final stock, rather than fixture answer text, prove whether inventory changed. A five-unit reservation is rejected; the one-call limit blocks the second call before reservation.

## Troubleshooting

If the backend reports 403, use the local application origin and a valid experiment owner. Invalid harnesses, unknown SDK fields and extra request properties are rejected with 400. A 429 means this owner or the four-run global limit already has an active run. The five-second local deadline stops a run without claiming remote interruption.

## Limitations

The offline experiment does not execute Anthropic Messages or Managed API methods, so its fixture answers and typed call events are not model observations. Live Messages requests need a separate opt-in, model and budget; a Managed run needs a pinned, reviewed agent and environment plus session cleanup. Those paths are deliberately unavailable here. A Messages `toolRunner` is a Messages API helper and its options must not be sent to `sessions.create`. See [TypeScript SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript), [tool runner](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner), and [Managed session events](https://platform.claude.com/docs/en/managed-agents/events-and-streaming).

## Challenge

Identify a responsibility the manual loop owns that the Managed harness supplies. Then explain which host responsibility neither layer can take over for this exercise.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab24-harnesses.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab24-browser-demonstration.mjs
```

Baseline and comparison
1. Run Reserve 2 in all three offline harnesses and compare typed call adapters and identical host effects.
2. Run Reject 5 and confirm the host policy leaves stock unchanged despite the fixture call.
3. Run Read then limit with a one-call cap; inspect the read effect and the blocked reservation.
4. Read the ownership notes and distinguish fixture answer text from the checked host stock.
5. Inspect separate SDK contracts before configuring any billed Messages or Managed run.

Student challenge
Identify one responsibility the manual loop owns that the Managed session harness supplies.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab24-harnesses.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L25 Context growth and compaction evidence

Distinguish observed Managed compaction events, available cumulative thread usage and a separate host-authored summary handoff without inventing context capacity.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 25 Context growth and compaction evidence after the preceding lesson. Goal: Distinguish observed Managed compaction events, available cumulative thread usage and a separate host-authored summary handoff without inventing context capacity.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c25. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept25CompactionContext.tsx
- server/concepts/25-compaction-context.ts
- shared/lab25-compaction-context.ts
- server/lib/lab25-compaction-context.ts
- Tab25-compaction-context.md

Implementation brief
Goal: Observe available context metrics and platform compaction without fake precision.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept25CompactionContext.tsx; server/concepts/25-compaction-context.ts; Tab25-compaction-context.md

Build: Use documented thread/context statistics present in pinned types and agent.thread_context_compacted when emitted. Read bounded authored reports through checked tools, and show known/unknown categories without inventing buffer/free token counts. Automatic platform compaction is distinct from a host-authored summary-and-new-session workflow. No /compact, PreCompact/PostCompact callback or automatic-compaction query setting is assumed.

Experiment: Offline event replay demonstrates the consumer and a separate host summary handoff; optional small live report runs show only actual metrics/events. Verify retained facts against fixture evidence after the handoff.

Verify: No huge billed context is required for routine checks. Fixture compaction is not evidence of the platform trigger threshold. Missing metrics remain unavailable; summaries may omit facts.

Reference route inventory under /api/c25: GET /window; POST /run; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

This lab separates three observations: a persisted `agent.thread_context_compacted` event, cumulative thread usage, and an explicit host-authored summary used to start a different session. None of them supplies an exact free-token count. The offline replay is authored evidence, not a measured platform threshold.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=25`. Offline scenarios use three small reviewed report files and require no credentials. The installed `@anthropic-ai/sdk` version is `0.133.0`. Its compaction event has an ID and timestamp; thread usage and stats can be unavailable.

## Controls

`GET /api/c25/window` inspects checked report hashes and the known/unknown metric categories. `POST /api/c25/run` replays Compacted, No compaction, Missing metrics, or Summary omits. Toggle the separate host summary handoff. `GET /api/c25/code` describes the pinned event and thread shapes. Live mode is rejected until a small, separately opted-in Managed report run is configured.

## Evidence to inspect

The server reads `r1.md`, `r2.md`, and `r3.md` only through an allowlisted path, file-size and symlink check. It hashes the actual bytes and verifies one expected fact per file. The replay feeds typed events through the shared event consumer, while separately recording the documented compaction event ID. A missing event means no compaction was observed in that stream, not that the platform never compacted. Input/output/cache counters are cumulative thread usage, not present-window occupancy. Missing usage remains unavailable rather than zero.

The host summary handoff uses a new fixture session ID and an explicit summary string. In Summary omits, the `r2` fact is absent from the summary and new-session fixture answer. The retention list is checked against the original report facts. This workflow is separate from platform compaction; the authored replay never proves a trigger threshold.

## Troubleshooting

A missing or changed report causes the reviewed read to fail. Invalid extra fields, Agent SDK settings and unbounded deadlines are rejected before a replay. A 429 means this owner or the four-run global limit already has an active replay. A local deadline or disconnect aborts local work without claiming a remote stop.

## Limitations

This checkpoint does not assume `/compact`, PreCompact/PostCompact callbacks, or an automatic-compaction query setting. It does not fill a large context window or use a billed run to force compaction. A live option requires separately provisioned and reviewed Managed resources. [Managed event reference](https://platform.claude.com/docs/en/managed-agents/reference) documents `agent.thread_context_compacted`; [session observability](https://platform.claude.com/docs/en/managed-agents/session-observability) describes cumulative usage and thread views.

## Challenge

Compare an observed compaction event with a host summary handoff. Which could prove a platform action, and which retained facts can be checked against the source reports?

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab25-compaction-context.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab25-browser-demonstration.mjs
```

Baseline and comparison
1. Inspect the bounded report files and checked host reads.
2. Replay the authored compaction event and compare it with a stream where no such event appears.
3. Run Missing metrics and keep unavailable values distinct from zero.
4. Run Summary omits and inspect which original report fact the new-session summary lost.
5. Explain why an offline event cannot establish a real platform compaction threshold.

Student challenge
Compare the authored compaction event with the host summary handoff. Which one could prove a platform action, and which retained facts can you verify from source reports?

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab25-compaction-context.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L26 Session controls and supported updates

Operate an owned session through a strict catalog and compare updates that require idle with an explicit fresh-session model handoff.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 26 Session controls and supported updates after the preceding lesson. Goal: Operate an owned session through a strict catalog and compare updates that require idle with an explicit fresh-session model handoff.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c26. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept26QueryControl.tsx
- server/concepts/26-query-control.ts
- shared/lab26-query-control.ts
- server/lib/lab26-controls.ts
- Tab26-query-control.md

Implementation brief
Goal: Control owned remote work through documented session operations.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept26QueryControl.tsx; server/concepts/26-query-control.ts; Tab26-query-control.md

Build: Replace Query-method dispatch with a strict operation catalog: retrieve, history, send, interrupt, title/metadata, allowed idle tools/MCP updates, budget change and archive. Use session.update only for supported fields; pinned types allow tools/MCP updates while idle, not in-place model/system/skills changes. New model configuration creates a fresh session with explicit context handoff. Do not expose arbitrary SDK method names from HTTP. Dynamic workflow controls require a separate documented adapter and are disabled in this lab.

Experiment: Fixed slow fixture, interrupt and continue, idle tool removal, unknown session, closed session and rejected mid-run update.

Verify: Serialize mutating controls, test ownership and independent cleanup. Closing the browser stream does not stop remote work. Budget increases are explicitly opted in because they can resume work.

Reference route inventory under /api/c26: GET /catalog; POST /open; POST /call; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

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

Baseline and comparison
1. Open a slow offline session and send a turn.
2. Attempt the idle tool update while running, then interrupt and confirm idle.
3. Remove a tool and MCP server by full replacement and inspect the result.
4. Try a budget increase without opt-in, then opt in explicitly.
5. Create a fresh model session with a short summary; inspect its parent ID and resolved fixture model.
6. Archive an idle session and confirm further mutations fail.

Student challenge
Change model through a fresh session and inspect its resolved configuration.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab26-query-control.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L27 Remote work beyond a browser connection

Track authored remote work in a host ledger across browser detach and reconnect without creating duplicate sessions or task cards.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 27 Remote work beyond a browser connection after the preceding lesson. Goal: Track authored remote work in a host ledger across browser detach and reconnect without creating duplicate sessions or task cards.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c27. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept27BackgroundTasks.tsx
- server/concepts/27-background-tasks.ts
- shared/lab27-background-tasks.ts
- server/lib/lab27-ledger.ts
- Tab27-background-tasks.md

Implementation brief
Goal: Track remote work and reconnect without starting duplicate tasks.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept27BackgroundTasks.tsx; server/concepts/27-background-tasks.ts; Tab27-background-tasks.md

Build: Create a host task ledger tied to owned Managed session/thread IDs. Follow documented lifecycle/thread events and reconcile retrieve/history after reconnect; do not import task_started/task_notification/background_tasks_changed from Agent SDK. Host snapshots replace host task state only when explicitly identified as snapshots. Distinguish primary turn, child activity, remote session and browser connection. Stop uses supported interrupt and bounded idle confirmation; Close archives only after work is stopped.

Experiment: Browser detaches while remote work is represented as running, reconnect, completed task, explicit stop and background-disabled host policy. Offline events are authored.

Verify: No duplicate cards or provider creates on reconnect. Final task report still needs independent verification. Test retained-session expiry and shutdown cleanup; native workflow runs require separate run-aware stopping.

Reference route inventory under /api/c27: POST /oneshot; POST /open; POST /call; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

An owned host task ledger tracks a remote session and primary thread separately from the browser connection. The offline exercise uses authored events and does not contact Anthropic.

## Prerequisites

Run `npm install` and `npm run dev`. No API key is needed for the authored scenario.

## Controls

Open a slow offline task, detach the browser, reconnect the same task, inspect, stop, and close after idle. The completed one-shot returns an archived fixture record. Disable **Allow host background work** to see the policy reject creation.

## Evidence to inspect

Compare task, session and thread IDs, browser connection, remote status, stable event IDs, create count and duplicate-card count. Reconnect replays an old event with the same ID; the host ledger ignores it. A task report remains unverified until independently checked.

## Troubleshooting

Unknown or unowned IDs return 404. An expired retained task starts cleanup and returns 410. Closing a running task returns 409: stop it, confirm idle and then close. Start the backend if the exercise cannot load.

## Limitations

The fixture models host reconciliation only. No live task was started and no remote completion is asserted. Managed workflow runs have their own run-aware lifecycle. An interrupt stops a turn but does not itself end an open workflow run; this lab disables dynamic workflows rather than inventing a stop-by-ID method. The host-snapshot concept requires explicit snapshot identification, not a generic event.

## Challenge

Reconnect and identify evidence that the original task stopped. Explain why a detached browser does not prove that remote work stopped.

```powershell
node --import tsx --test tests/lab27-background-tasks.test.ts
node scripts/lab27-browser-demonstration.mjs
```

The route catalog is `POST /api/c27/oneshot`, `POST /api/c27/open`, `POST /api/c27/call`, and `GET /api/c27/code`. See the [checkpoint](docs/lab27-checkpoint.md).

Baseline and comparison
1. Open a slow offline task and inspect separate task, session, thread and browser identities.
2. Detach the browser and confirm the task still runs.
3. Reconnect the same task and inspect deduplicated event IDs and unchanged create count.
4. Wait for authored completion, then inspect the unverified report.
5. Open another task and explicitly stop it; close only after confirmed idle.
6. Disable host background policy and confirm creation is rejected.

Student challenge
Reconnect and identify evidence that the original task stopped.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab27-background-tasks.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L28 Errors retries and reconciliation

Classify authored transport, event, handler and cleanup faults while bounding read retries and reconciling uncertain mutations without duplicate effects.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 28 Errors retries and reconciliation after the preceding lesson. Goal: Classify authored transport, event, handler and cleanup faults while bounding read retries and reconciling uncertain mutations without duplicate effects.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c28. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept28ErrorsRetries.tsx
- server/concepts/28-errors-retries.ts
- shared/lab28-errors-retries.ts
- server/lib/lab28-faults.ts
- Tab28-errors-retries.md

Implementation brief
Goal: Classify HTTP, event, tool and cleanup failures without duplicate effects.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept28ErrorsRetries.tsx; server/concepts/28-errors-retries.ts; Tab28-errors-retries.md

Build: Add a loopback fault server and injected Managed port for validation/auth failures, rate limits/overload, event session.error, custom handler error, cancellation and EOF. Use maxRetries:0 on side-effecting provider requests; no automatic retry of create/send/confirm/result/interrupt. GET/list reads may have bounded backoff with injected clock/random. An uncertain mutation is reconciled from known session/history and host idempotency ledger before any deliberate retry; an unknown create ID needs explicit recovery guidance.

Experiment: Bounded read retry, missing create response, tool effect before result-send failure and reconnect with duplicates.

Verify: Invalid input, denial and cancellation never retry. A known effect cannot be applied twice. Deadlines cover waiting and cleanup separately; classify local disconnect without falsely declaring remote failure.

Reference route inventory under /api/c28: POST /api; POST /run; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Classify authored HTTP, event, custom handler, cancellation, EOF and local disconnect faults. The loopback server never contacts Anthropic.

## Prerequisites

Run `npm install` and `npm run dev`. No API key is needed for the offline exercise.

## Controls

Choose a fault and select **Run offline fault**. The `/api/c28/api` and `/api/c28/run` routes accept the same closed experiment contract; `/api/c28/code` shows the source boundary. A local deadline caps each run, and one owner may run only one experiment at a time.

## Evidence to inspect

For read rate limit, inspect the bounded GET attempts and deduplicated event IDs. For missing create response, the loopback server records the POST but the client receives no ID. For tool result failure, the host idempotency ledger records one effect before the result acknowledgment is lost. Reconnect duplicates reuses a known fixture session and deduplicates by event ID.

## Troubleshooting

Validation and authorization errors are terminal. Do not retry canceled or denied work. A local disconnect does not prove a remote failure. If a mutation response is lost, inspect a known session's bounded history and host ledger before any deliberate retry. If create returned no ID, quarantine it and use owned inventory or operator logs for recovery guidance.

## Limitations

The offline fault server is loopback only. It does not model provider billing, live retries, or complete remote cleanup. Side-effecting SDK requests must set `maxRetries: 0`; bounded backoff is appropriate only for safe GET/list reads. Waiting and cleanup need separate deadlines. Cleanup marked pending means remote stop was not confirmed.

## Challenge

Explain when reconnecting a known session is safer than creating another one.

```powershell
node --import tsx --test tests/lab28-errors-retries.test.ts
node scripts/lab28-browser-demonstration.mjs
```

See the [checkpoint](docs/lab28-checkpoint.md) for actual verification.

Baseline and comparison
1. Run Read rate limit and inspect three bounded GET attempts.
2. Run Missing create response and explain why another create is unsafe without an ID.
3. Run Tool result failure and compare one host effect with the uncertain result acknowledgment.
4. Run Reconnect duplicates and inspect stable event ID deduplication.
5. Compare validation, authorization, cancellation, EOF and browser disconnect classifications.

Student challenge
Explain when reconnecting a known session is safer than creating another one.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab28-errors-retries.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L29 Images documents and mounted files

Compare checked inline image/document blocks, explicit file mounts and separate downloaded output evidence using small fictional fixtures.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 29 Images documents and mounted files after the preceding lesson. Goal: Compare checked inline image/document blocks, explicit file mounts and separate downloaded output evidence using small fictional fixtures.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c29. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept29ImagesFiles.tsx
- server/concepts/29-images-files.ts
- shared/lab29-images-files.ts
- server/lib/lab29-files.ts
- Tab29-images-files.md

Implementation brief
Goal: Compare inline content with explicitly mounted files and provenance.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept29ImagesFiles.tsx; server/concepts/29-images-files.ts; Tab29-images-files.md

Build: Author small PNG, text and PDF fixtures. Validate the actual Managed user.message image/document block union from pinned types, MIME, decoded length, extension and count. Upload only selected authored fixtures through Files API during explicit runs, mount resources at declared container paths and inspect downloaded session outputs. Host local disk paths are not remote sandbox paths. Keep inline versus file-resource routes and their cleanup distinct.

Experiment: Image description, document question, mounted text read, malformed base64 and oversized payload. Show redacted exact sent blocks/resource metadata.

Verify: Apply larger JSON limits only on needed routes, guard paths and validate filenames. Inspecting source never uploads private files. Downloaded output and agent text are separate evidence.

Reference route inventory under /api/c29: GET /files; GET /file/:name; POST /inline; POST /upload; POST /disk; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

Three small fictional fixtures demonstrate inline Managed `user.message` content blocks and explicit Files API mount metadata. Inventory and source inspection never upload files.

## Prerequisites

Run `npm install` and `npm run dev`. Offline fixture comparisons need no API key. The authored PDF was rendered and inspected during development.

## Controls

Select a PNG, PDF or text fixture. Compare **Inline block**, **File upload and mount preview**, and **Downloaded output preview**. The latter two are authored previews of an explicit upload route, not actual cloud uploads. On the inline route, choose malformed base64 or oversized text to inspect rejection; file-resource routes accept only selected fixture bytes.

## Evidence to inspect

The fixed inventory exposes MIME, byte count and SHA-256. The inline block preview redacts its bytes but preserves type, source and media type. The file-resource preview shows a fixture file ID and `/mnt/session/uploads/lab29/...` path. Agent text and the authored downloaded output file are separate evidence. Usage stays unavailable in these offline scenarios.

## Troubleshooting

Unknown filenames and traversal paths are rejected. Malformed base64 is rejected before decoding, and decoded size and file signature are checked. The `/inline` route alone has a larger JSON limit. If the source preview is unavailable, start the backend and inspect the fixed fixture inventory.

## Limitations

No live Files API upload or billed Managed session is started by this lesson. The mounted path is a redacted fixture preview, not observed remote state. An actual upload requires an explicit selected authored file, a Files API response ID, a session resource mount, and separate cleanup. A local host path is not a remote sandbox path.

## Challenge

Send the same fixture through two supported routes and compare observed usage. In the offline path, explain why usage is unavailable instead of inventing a number.

```powershell
python scripts/generate-lab29-fixtures.py
node --import tsx --test tests/lab29-images-files.test.ts
node scripts/lab29-browser-demonstration.mjs
```

Routes: `GET /api/c29/files`, `GET /api/c29/file/:name`, `POST /api/c29/inline`, `POST /api/c29/upload`, `POST /api/c29/disk`, and `GET /api/c29/code`. See the [checkpoint](docs/lab29-checkpoint.md).

Baseline and comparison
1. Inspect the checked PNG, PDF and text inventory without uploading anything.
2. Run the same fixture through the inline and file-resource previews; compare redacted block and mount metadata.
3. Inspect the downloaded output preview separately from agent answer text.
4. Submit malformed base64 and an oversized text payload; confirm rejection.
5. Explain why a host filesystem path is not a Managed sandbox path.

Student challenge
Send the same fixture through two supported routes and compare observed usage.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab29-images-files.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L30 Host task board and completion gates

Use a host-owned task board and typed custom-tool inputs to enforce dependencies, versions and checked completion evidence independently of agent claims.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 30 Host task board and completion gates after the preceding lesson. Goal: Use a host-owned task board and typed custom-tool inputs to enforce dependencies, versions and checked completion evidence independently of agent claims.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c30. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept30TodoTracking.tsx
- server/concepts/30-todo-tracking.ts
- shared/lab30-todo-tracking.ts
- server/lib/lab30-board.ts
- Tab30-todo-tracking.md

Implementation brief
Goal: Track tasks and enforce dependencies independently of agent claims.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept30TodoTracking.tsx; server/concepts/30-todo-tracking.ts; Tab30-todo-tracking.md

Build: Extend the Lab 05 typed custom-tool pattern with create_task, update_task, list_tasks and get_task on a dedicated agent. Host state owns IDs, versions, dependencies and completion evidence. Legacy TodoWrite and Claude Code TaskCreate/TaskUpdated hooks are historical labels only, not assumed Managed tools. If teaching whole-list replacement, expose it as an explicitly named host operation with strict validation.

Experiment: Three-step fixture, blocked review, refused completion, validated completion and an invalid plan replacement.

Verify: Every handler checks owner and dependency gates before mutation and returns one correlated result. No arbitrary task files or instruction-based approval. Test repeated event IDs and conflicting updates.

Reference route inventory under /api/c30: POST /run; POST /tools; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

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

Baseline and comparison
1. Start the three-step offline board and compare agent claim with host task states.
2. Attempt review or publish completion before dependencies are done; inspect the correlated is_error result.
3. Complete draft, review and publish with exact checked evidence in order.
4. Replay a tool event ID and confirm no second effect.
5. Try invalid whole-plan replacement and a conflicting version; inspect the deterministic gate.

Student challenge
Try a plan change and locate the deterministic accepting or refusing gate.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab30-todo-tracking.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L31 Host questions and correlated answers

Collect one human answer to a bounded host question and correlate a single Managed custom-tool result with the paused event ID.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 31 Host questions and correlated answers after the preceding lesson. Goal: Collect one human answer to a bounded host question and correlate a single Managed custom-tool result with the paused event ID.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c31. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept31AskUserQuestion.tsx
- server/concepts/31-ask-user-question.ts
- shared/lab31-ask-user-question.ts
- server/lib/lab31-questions.ts
- Tab31-ask-user-question.md

Implementation brief
Goal: Collect a human answer while the agent waits for a custom-tool result.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept31AskUserQuestion.tsx; server/concepts/31-ask-user-question.ts; Tab31-ask-user-question.md

Build: Declare ask_user as a closed custom tool; on agent.custom_tool_use store a bounded question with run/session/event ID, options, selection rules and expiry. Emit a host question frame and render an accessible form. Validate POST /answer against the stored question and return one user.custom_tool_result with custom_tool_use_id equal to the sevt_ ID. No canUseTool mutation or built-in AskUserQuestion is required.

Experiment: Deployment target, option selection, allowed custom text, invalid answer, expiry and cancellation while waiting.

Verify: Consume once and release waiters on disconnect/deadline. Answers authorize no unrelated tool effect. Repeated/foreign-run decisions fail with useful errors.

Reference route inventory under /api/c31: POST /answer; POST /run; POST /tools; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

A closed `ask_user` custom tool pauses an authored Managed session fixture. The host stores the question, option rules, run/session/event identity and expiry. A validated human answer becomes one `user.custom_tool_result` for the exact `sevt_` call.

## Prerequisites

Run `npm install` and `npm run dev`. Offline question fixtures need no API key.

## Controls

Start deployment target, option selection, allowed custom text, invalid answer, expiry or cancel-waiting. Choose one radio option or enter allowed custom text. Submit, inspect, cancel or wait for the question to resolve. The wait request has its own timeout and releases its waiter if the browser disconnects.

## Evidence to inspect

Compare run ID, session ID and custom tool event ID. A successful answer produces one result whose `custom_tool_use_id` is exactly the stored event ID. The result count stays one. An answer authorizes no unrelated tool effect. Agent question text does not override the host's stored options or selection rules.

## Troubleshooting

An unknown option, custom text when disabled, or a partial answer is rejected before result creation. A repeated answer after completion, expiry or cancellation returns 409. Foreign run or mismatched session/event IDs cannot resolve the stored question. If a wait times out, inspect the run again; timeout alone does not answer it.

## Limitations

These are authored events and fixture IDs; no live Managed custom-tool result is sent. No built-in `AskUserQuestion` or `canUseTool` mutation is assumed. Live execution requires a dedicated agent, event consumer and explicit result-sending adapter.

## Challenge

Compare a partial answer with a complete validated response.

```powershell
node --import tsx --test tests/lab31-ask-user-question.test.ts
node scripts/lab31-browser-demonstration.mjs
```

Routes: `POST /api/c31/run`, `POST /api/c31/answer`, `POST /api/c31/tools`, `GET /api/c31/code`. See the [checkpoint](docs/lab31-checkpoint.md).

Baseline and comparison
1. Start the deployment-target or option-selection fixture and inspect the stored run, session and event IDs.
2. Submit a valid choice and inspect the one correlated result.
3. Try an invalid choice or incomplete answer and confirm no result was sent.
4. Run allowed custom text, expiry and cancellation while waiting.
5. Repeat a decision or use a foreign run ID and compare the errors.

Student challenge
Compare a partial answer with a complete validated response.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab31-ask-user-question.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L32 Plan review and execution gate

Review an immutable host-validated plan before a separate restricted execution phase, with file effects checked independently of plan text.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 32 Plan review and execution gate after the preceding lesson. Goal: Review an immutable host-validated plan before a separate restricted execution phase, with file effects checked independently of plan text.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c32. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept32PlanMode.tsx
- server/concepts/32-plan-mode.ts
- shared/lab32-plan-mode.ts
- server/lib/lab32-plan-gate.ts
- Tab32-plan-mode.md

Implementation brief
Goal: Review a plan before enabling a bounded execution phase.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept32PlanMode.tsx; server/concepts/32-plan-mode.ts; Tab32-plan-mode.md

Build: Use a read-only planning agent/session and a host-validated plan contract. Approval is a separate single-use decision over immutable plan hash/version. Approved execution uses a dedicated restricted agent in a fresh session with only selected capabilities and explicit plan context; a supported idle tools update is an optional alternative with checked semantics. No EnterPlanMode/ExitPlanMode or setPermissionMode exists by analogy. Tool handlers enforce the phase independently of the prompt.

Experiment: Rejected plan, revision feedback, approval, stale approval and attempted planning write in a disposable fixture repository.

Verify: Planning has zero file effects. Plan text cannot grant permissions; every execution action remains checked. Cancellation invalidates pending decisions.

Reference route inventory under /api/c32: POST /decide; POST /run; POST /who; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local server and open Lab 32. No API key is needed for the offline fixture.

## Goal

Review a versioned plan before a separate, bounded execution phase. This is a host workflow, not an Agent SDK permission mode.

## Controls

**Start plan** creates a versioned plan. **Approve current plan**, **Reject plan**, **Request revision**, and **Try stale approval** exercise the host decision gate. **Try planning write**, **Try unselected execution tool**, **Cancel pending plan**, and **Inspect file evidence** show enforcement.

## Exercise

Start an offline plan. The host creates a disposable fictional `notes.txt` and records its SHA-256 hash. The planning session has no file-write capability. Try **Try planning write** and confirm its denial and unchanged file hash.

Approve the current plan using its exact version and hash. The host creates a new execution session ID and permits one checked `append_checklist` action against the fixed fixture path. Compare the initial and current file hashes and the single execution effect. Try the unselected `write_anywhere` tool; it remains denied even after approval. Plan text never grants capabilities.

Request a revision with feedback. The host creates a new version and hash. Try a stale approval for the old version, then approve the current plan. Repeat with rejection and cancellation; neither executes. The fixture is removed when the server closes.

## Evidence to inspect

Compare plan version and SHA-256 hash, planning and execution session IDs, the fixture file hashes and text, file-effect counters, and the last host tool decision. Read `shared/lab32-plan-mode.ts`, `server/lib/lab32-plan-gate.ts`, and `server/concepts/32-plan-mode.ts`.

## Troubleshooting

An expired, rejected, canceled, or already approved plan returns a conflict. Start a new run. After revision, use the displayed current version and hash.

## Limitations

The offline fixture makes zero Anthropic calls. A live implementation would require a separately configured read-only Managed planning agent and a dedicated restricted execution agent in a fresh session, with checked session configuration and host-enforced tool handlers. No `EnterPlanMode`, `ExitPlanMode`, or `setPermissionMode` field is inferred from the Agent SDK. This lab deliberately does not provision agents or start billed sessions.

## Run locally

```powershell
node --import tsx --test tests/lab32-plan-mode.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab32-browser-demonstration.mjs
```

## Challenge

Request a revision and verify that an older approval cannot authorize the new plan. Explain which host fields changed and why no file effect occurred until the current plan was approved.

Baseline and comparison
1. Start the planning fixture and compare its initial and current file hashes; planning has zero write effects.
2. Try a planning write and an unselected execution tool; inspect the host denials.
3. Request a revision and try the older approval; the version and hash must fail.
4. Approve the current plan and inspect the fresh execution session and one checked file change.
5. Reject or cancel another pending plan; confirm it cannot execute.

Student challenge
Request a revision and verify an older approval cannot authorize the new plan.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab32-plan-mode.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L33 Human forms during tool work

Collect schema-validated human input during a real local MCP tool call, keeping MCP, custom-tool and consent correlation IDs separate.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 33 Human forms during tool work after the preceding lesson. Goal: Collect schema-validated human input during a real local MCP tool call, keeping MCP, custom-tool and consent correlation IDs separate.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c33. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept33McpElicitation.tsx
- server/concepts/33-mcp-elicitation.ts
- shared/lab33-mcp-elicitation.ts
- server/lib/lab33-elicitation.ts
- mcp-servers/lab33-form.mjs
- Tab33-mcp-elicitation.md

Implementation brief
Goal: Collect schema-validated input during an external tool request.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept33McpElicitation.tsx; server/concepts/33-mcp-elicitation.ts; Tab33-mcp-elicitation.md

Build: Author a local MCP server that elicits a date/quantity form and a host MCP client that handles it. Surface pending forms through a typed custom tool bridge to Managed Agents and return the validated final tool result. Direct cloud MCP onElicitation callbacks are not assumed; expose direct support only with documentation and installed types. URL-mode uses a fixed fictional local consent page and is labeled a demonstration.

Experiment: Valid form, invalid values, decline, timeout and abort. Keep question, MCP request, custom call and consent IDs separate.

Verify: Pending state is bounded, answers single-use and cleanup closes transports. No arbitrary consent URL or invented real OAuth. Test schema validation independently of model behavior.

Reference route inventory under /api/c33: POST /respond; POST /hooklog; POST /log; GET /consent/:id/status; GET /consent/:id; POST /consent/:id; POST /run; POST /who; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. This exercise starts an authored local MCP stdio process; it needs no Anthropic key.

## Controls

**Start MCP form** creates a local MCP client/server exchange. **Submit form**, **Try invalid quantity**, **Decline**, **Abort waiting**, and **Inspect state** control the pending elicitation. Choose **timeout** to watch the host deadline. **url-consent** shows a fixed fictional local consent path.

## Exercise

The host initializes a local MCP server, discovers `collect_field_note`, and calls it. That tool requests `elicitation/create` with a closed date and quantity form. The host retains separate run, MCP request, custom-tool call and consent IDs. A valid answer passes the host Zod schema, returns one response to the MCP request, and lets the server complete its tool call. The host then constructs one correlated `user.custom_tool_result` shape for the bridge. No Managed session is contacted in the offline exercise.

Try an invalid quantity or date. The host rejects it before sending a result to MCP, leaving the form pending. Decline returns an MCP error result. Timeout and abort close the local transport without claiming a completed answer.

## Evidence to inspect

Compare the distinct identifiers, protocol evidence, answer count, MCP tool result, and final custom-tool result. Inspect `mcp-servers/lab33-form.mjs`, `server/lib/lab33-elicitation.ts`, and the closed schemas.

## Troubleshooting

If a pending form expires, start a new run. Responses with mismatched IDs or a foreign owner are rejected. An invalid value does not consume the form.

## Limitations

This is local MCP over stdio with a host bridge. Direct cloud MCP `onElicitation` callback support is not assumed. The consent path is same-origin and fictional; it is not a real OAuth authorization or arbitrary URL navigation. The offline fixture has zero provider calls.

## Challenge

Submit invalid values and identify the host schema layer that rejects them before the MCP server receives a reply.

## Run locally

```powershell
node --import tsx --test tests/lab33-mcp-elicitation.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab33-browser-demonstration.mjs
```

Baseline and comparison
1. Start the local MCP form and inspect the initialize, tools/list, tools/call and elicitation evidence.
2. Submit a valid date and quantity; inspect the correlated MCP tool response and custom-tool result shape.
3. Submit invalid values and identify the host schema rejection before an MCP reply.
4. Try decline, timeout and abort; confirm there is no accepted form.
5. Inspect the fixed local consent demonstration and distinguish it from OAuth.

Student challenge
Submit invalid values and identify the layer that rejects them.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab33-mcp-elicitation.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L34 Output instruction variants

Compare trusted host output-instruction files in fresh session snapshots while validating JSON reports independently of style text.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 34 Output instruction variants after the preceding lesson. Goal: Compare trusted host output-instruction files in fresh session snapshots while validating JSON reports independently of style text.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c34. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept34OutputStyles.tsx
- server/concepts/34-output-styles.ts
- shared/lab34-output-styles.ts
- server/lib/lab34-styles.ts
- Tab34-output-styles.md

Implementation brief
Goal: Compare formatting preferences with independent output validation.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept34OutputStyles.tsx; server/concepts/34-output-styles.ts; Tab34-output-styles.md

Build: Author concise, explanatory and review instruction files in a trusted host registry. Compose the selected style into the system override for a fresh Managed session and show its hash/provenance. No settings.outputStyle, plugin precedence, reloadStyles or keep-coding-instructions option is assumed. A trusted host registry defines any precedence and unknown names fail before send. Keep JSON report validation separate from style text.

Experiment: Same question across styles, missing style and revised style in a fresh session.

Verify: Check exact composition, fixed prompt and unchanged capabilities; no fixture scores imply live style quality. Existing session configuration does not silently change after a file edit.

Reference route inventory under /api/c34: GET /styles; POST /compare; POST /who; POST /live; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The offline comparison needs no Anthropic key.

## Controls

**Compare in fresh session** applies one trusted style. **Compare all four** repeats the fixed question with distinct session IDs. **Try unknown style** tests preflight rejection. Expand **Exact composed system override** to inspect the selected file content and hash.

## Exercise

The host registry names four files: concise, explanatory, review-v1 and review-v2. Each file supplies an output preference appended to a stable base system instruction. The comparison snapshot includes the file path, SHA-256, exact composed override, fixed question, empty tool capabilities and a fresh session ID. Existing snapshots do not silently update when a new style version is selected.

The authored answers show formatting differences only. A separate closed Zod schema validates the JSON report regardless of style text. An unknown name fails before any session is created.

## Evidence to inspect

Compare instruction hashes, session IDs, the fixed question and unchanged capabilities. Read `server/lib/lab34-styles.ts` for the trusted file registry and separate report validator. Compare review-v1 and review-v2 to see explicit host versioning.

## Troubleshooting

An unknown style returns an invalid-request error. Select a trusted file name and start a new comparison. A closed or expired run requires another fresh comparison.

## Limitations

This fixture makes zero provider calls and contains no measured style-quality scores. Live style comparison requires a dedicated configured Managed agent. No Agent SDK `settings.outputStyle`, plugin precedence, `reloadStyles`, or `keep-coding-instructions` field is assumed.

## Challenge

Use an unknown style and inspect the preflight rejection. Explain why no new session was created.

## Run locally

```powershell
node --import tsx --test tests/lab34-output-styles.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab34-browser-demonstration.mjs
```

Baseline and comparison
1. Inspect the trusted concise, explanatory and review style catalog and its hashes.
2. Compare the same fixed question across styles; each run has a fresh session ID and identical empty capabilities.
3. Inspect the exact composed system override and host-file provenance.
4. Compare review-v1 with review-v2; older session snapshots stay unchanged.
5. Try an unknown style and observe preflight rejection before any session is created.

Student challenge
Use an unknown style and inspect the preflight rejection.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab34-output-styles.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L35 Event mirrors and conversation indexes

Persist a bounded local mirror of canonical session events by thread without claiming ownership of remote Managed session state.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 35 Event mirrors and conversation indexes after the preceding lesson. Goal: Persist a bounded local mirror of canonical session events by thread without claiming ownership of remote Managed session state.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c35. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept35SessionStores.tsx
- server/concepts/35-session-stores.ts
- shared/lab35-session-stores.ts
- server/lib/lab35-mirror.ts
- Tab35-session-stores.md

Implementation brief
Goal: Persist a local event mirror without pretending it owns remote session state.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept35SessionStores.tsx; server/concepts/35-session-stores.ts; Tab35-session-stores.md

Build: Create a file-backed event mirror with ordered append, bounded load, keyed ownership, flush strategies and a conversation index pointing to sesn_ IDs. Persist canonical sevt_ events, not preview fragments, and partition thread records. No Agent SDK SessionStore adapter is installed. A second host instance continues an owned remote session through the Managed API; the local mirror cannot recreate a sandbox or make an archived session resumable.

Experiment: Eager/batched flush, append failure, missing thread history, restart and reconnect/history reconciliation.

Verify: Test atomic index writes, deduplication, safe keys and honest incomplete-mirror status. The effect idempotency ledger remains separate from transcripts. No guessed transcript restore to live session.

Reference route inventory under /api/c35: GET /db; GET /entries; POST /reset; POST /run; POST /manage; POST /failures; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The offline file-backed mirror needs no Anthropic key.

## Controls

Select a scenario and eager or batched flush, then **Start mirror**. **Flush batch**, **Simulate crash and restart**, **Reconcile history**, **Archive remote fixture**, **Simulate append failure**, and **Reset local mirror** exercise persistence and recovery.

## Exercise

The host indexes a fictional owned `sesn_` ID, writes canonical `sevt_` events to thread-partitioned JSONL files, and atomically replaces its conversation index. Preview fragments are not stored. The effect idempotency ledger is a separate empty file.

Eager flush writes events immediately. Batched flush holds them in memory until explicit flush; a simulated crash loses unflushed events and marks the mirror incomplete. Reconciliation deduplicates known canonical event IDs and adds a checked worker-thread event. Missing thread history and append failures remain visible as incomplete evidence. An archived remote session cannot be made resumable by a local mirror.

## Evidence to inspect

Compare persisted and pending counts, thread IDs, event IDs and mirror status. Inspect `server/lib/lab35-mirror.ts` for atomic index writes, owner checks, bounded loads, safe file keys and the separate effect ledger.

## Troubleshooting

If an append fails, restore appends and reconcile or start a new run. A crash can lose pending events. Do not interpret a local file as proof that the remote session still exists.

## Limitations

This is an authored offline mirror. No Agent SDK `SessionStore` adapter is installed. A second live host would continue an owned remote session through the Managed API, not by replaying a guessed transcript. The mirror cannot recreate a sandbox or resume an archived session. No provider call is made here.

## Challenge

Compare flush strategies and identify which records survive a simulated crash.

## Run locally

```powershell
node --import tsx --test tests/lab35-session-stores.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab35-browser-demonstration.mjs
```

Baseline and comparison
1. Start eager and batched mirrors and compare persisted versus pending canonical events.
2. Simulate a crash and restart before flushing a batch; identify the lost local pending records.
3. Try an append failure, restore appends and reconcile canonical history without duplicates.
4. Inspect missing-thread and archived-session cases; the mirror cannot invent history or restore a sandbox.
5. Compare the conversation index, thread partitions and separate empty effect ledger.

Student challenge
Compare flush strategies and identify which records survive a simulated crash.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab35-session-stores.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L36 Remote transport and host runners

Inspect the host HTTP/event boundary, bounded event consumption, fixed host worker lifecycle and remote cleanup without spawning Claude Code.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 36 Remote transport and host runners after the preceding lesson. Goal: Inspect the host HTTP/event boundary, bounded event consumption, fixed host worker lifecycle and remote cleanup without spawning Claude Code.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c36. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept36ProcessSpawning.tsx
- server/concepts/36-process-spawning.ts
- shared/lab36-process-spawning.ts
- server/lib/lab36-transport.ts
- mcp-servers/lab36-worker.mjs
- Tab36-process-spawning.md

Implementation brief
Goal: Inspect execution boundaries and cleanup without spawning Claude Code.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept36ProcessSpawning.tsx; server/concepts/36-process-spawning.ts; Tab36-process-spawning.md

Build: Replace spawnClaudeCodeProcess with an injected Managed HTTP/event port plus a loopback protocol emulator. Show host request, remote session lifecycle, event stream backpressure and local abort. Fixed host child processes are used only for authored tool/test workers, with separate stdin/stdout/stderr protocols and bounded kill/exit lifecycle. No toolAlias or local Claude binary is required.

Experiment: Managed-port fixture success, connection failure, early stream close, handler worker failure and cancellation with pending remote cleanup.

Verify: Host worker kill does not prove remote session stop. Test bounded queues, once-only exits and secret redaction. A loopback emulator is not a production remote sandbox.

Reference route inventory under /api/c36: GET /state; POST /reset; POST /dry; POST /run; POST /alias; POST /debug; POST /failures; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The exercise uses a loopback HTTP emulator and a fixed authored host worker; no Claude binary or Anthropic key is needed.

## Controls

Choose success, connection failure, early stream close, handler worker failure or cancel pending cleanup, then select **Run transport experiment**. The result shows host request, remote lifecycle, event count, worker exit, local abort and cleanup state.

## Exercise

The host sends a session-create request to a loopback Managed-port emulator, then consumes bounded canonical event lines. An injected port boundary keeps the exercise separate from provider calls. The success fixture receives three events and archives the simulated session. An early stream close is incomplete. A connection failure creates no session.

The handler failure starts a fixed child process that speaks JSON over stdin/stdout; its private stderr is redacted. A local abort closes the browser-side stream, asks for interruption and reports cleanup pending when the emulator cannot confirm idle. Killing a host worker cannot prove the remote session stopped.

## Evidence to inspect

Compare `hostRequest`, lifecycle events, queue peak, worker exit count, `remoteStopConfirmed` and cleanup. Read `server/lib/lab36-transport.ts` for the port interface, loopback protocol and bounded event consumer. The worker file is `mcp-servers/lab36-worker.mjs`.

## Troubleshooting

If the loopback connection fails, start a new run. An incomplete stream is not a completed turn. Pending cleanup must be reconciled with the remote session in a live application.

## Limitations

The loopback emulator is not a production remote sandbox. This exercise makes zero Anthropic calls. Live transport requires a configured Managed agent and explicit opt-in. No `spawnClaudeCodeProcess`, toolAlias or local Claude binary is required.

## Challenge

Identify which work runs on the host and which belongs to the remote session.

## Run locally

```powershell
node --import tsx --test tests/lab36-process-spawning.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab36-browser-demonstration.mjs
```

Baseline and comparison
1. Run the successful loopback Managed-port fixture and inspect host request and remote lifecycle events.
2. Compare connection failure with an early stream close; neither produces a verified completed turn.
3. Run handler-worker failure and confirm one child exit with private stderr withheld.
4. Cancel during a pending stream; inspect local abort and unconfirmed remote cleanup.
5. Identify which code runs on the host and which lifecycle belongs to a remote session.

Student challenge
Identify which work runs on the host and which belongs to the remote session.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab36-process-spawning.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L37 External policy decision service

Ask a host-only policy service about an exact paused action and send one correlated confirmation only after a valid gate decision and independent path check.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 37 External policy decision service after the preceding lesson. Goal: Ask a host-only policy service about an exact paused action and send one correlated confirmation only after a valid gate decision and independent path check.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c37. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept37PermissionPromptTool.tsx
- server/concepts/37-permission-prompt-tool.ts
- shared/lab37-permission-prompt-tool.ts
- server/lib/lab37-policy-gate.ts
- mcp-servers/lab37-policy.mjs
- Tab37-permission-prompt-tool.md

Implementation brief
Goal: Ask a deterministic external gate about an exact pending action.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept37PermissionPromptTool.tsx; server/concepts/37-permission-prompt-tool.ts; Tab37-permission-prompt-tool.md

Build: Replace permissionPromptToolName with a host policy service port. Correlate built-in always_ask requests to their sevt_ IDs and send user.tool_confirmation only after schema-validated gate output and independent host path limits. Alternatively gate host custom handlers before execution. The gate is not model-callable and cannot rewrite confirmation inputs. Compare local reviewer and isolated fixture policy worker with a documented application precedence.

Experiment: Preallowed observation, deny, timeout, malformed gate output and gate allow refused by a stricter host check.

Verify: Fail closed on unavailable gate and consume decisions once. Do not assert canUseTool/rules/hooks precedence as Managed behavior. Agent text never bypasses the gate.

Reference route inventory under /api/c37: POST /decide; POST /gate-log; POST /run; POST /dry; POST /who; POST /answers; POST /failures; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The policy worker is an authored local fixture; the exercise needs no Anthropic key.

## Controls

Choose a scenario and either isolated policy worker or local reviewer, then **Start policy review**. **Ask policy worker**, **Reviewer allows**, **Reviewer denies**, and **Cancel pending** resolve or invalidate an exact paused action.

## Exercise

A fictional built-in `Write` call with `always_ask` pauses on a `sevt_` event ID. The host asks a non-model-callable policy service about that exact action. A valid closed gate output is followed by an independent fixed path check. Only then does the host construct one typed `user.tool_confirmation` with the original event ID. A checked allow changes only a disposable fixture file.

Preallowed observation never reaches the gate. Deny returns one `deny_message`. Malformed output and timeout fail closed without a confirmation or effect. In host-refusal, the worker allows but a stricter host path limit denies. The application precedence is host path limit over validated gate decision; this is not a claim about Managed `canUseTool`, rules or hooks precedence.

## Evidence to inspect

Compare the exact event ID, gate and host decisions, confirmation count and fixture file text. Read `server/lib/lab37-policy-gate.ts` for the worker boundary, closed output validation, independent path check and single-use decision guard.

## Troubleshooting

If the gate times out or returns malformed JSON, start another run. A repeated, foreign or wrong-ID decision is rejected. A local reviewer must provide an explicit allow or deny.

## Limitations

The fixture makes zero Anthropic calls. A live version needs a configured Managed agent with a built-in `always_ask` pause. The host policy service is not an agent tool and cannot rewrite the confirmation input.

## Challenge

Return an invalid gate response and inspect the prevented file effect.

## Run locally

```powershell
node --import tsx --test tests/lab37-permission-prompt-tool.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab37-browser-demonstration.mjs
```

Baseline and comparison
1. Start a preallowed observation and see that no gate request or confirmation is needed.
2. Run the worker deny and inspect the exact sevt_ ID, deny_message and unchanged fixture file.
3. Try malformed output and timeout; neither can produce a confirmation or file effect.
4. Run host-refusal: the worker allows but the fixed host path limit denies.
5. Compare a local reviewer decision with the isolated policy worker and replay a decision.

Student challenge
Return an invalid gate response and inspect the prevented effect.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab37-permission-prompt-tool.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L38 Application follow up suggestions

Offer optional application follow-up suggestions bound to a conversation, turn and response version without auto-sending or conflating usage with the answer.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 38 Application follow up suggestions after the preceding lesson. Goal: Offer optional application follow-up suggestions bound to a conversation, turn and response version without auto-sending or conflating usage with the answer.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c38. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept38PromptSuggestions.tsx
- server/concepts/38-prompt-suggestions.ts
- shared/lab38-prompt-suggestions.ts
- server/lib/lab38-suggestions.ts
- Tab38-prompt-suggestions.md

Implementation brief
Goal: Offer suggestions without submitting or confusing their usage with the answer.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept38PromptSuggestions.tsx; server/concepts/38-prompt-suggestions.ts; Tab38-prompt-suggestions.md

Build: Generate deterministic fixture suggestions or an explicitly budgeted separate Managed suggestion session. Schema-validate each suggestion and bind it to conversation, turn and response version. A button copies it into the input only. No prompt_suggestion SDK event or guaranteed native suggestion stream is assumed.

Experiment: Delayed, suppressed and stale suggestion after a newer turn, plus feature disabled.

Verify: Reject stale suggestions and assert zero auto-send. Attribute optional suggestion-session usage separately; absent suggestions are valid. Cancel its remote work if the parent exercise closes.

Reference route inventory under /api/c38: POST /dry; POST /chat; POST /send; POST /end; POST /when; POST /switches; POST /cache; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The offline suggestions need no Anthropic key.

## Controls

Start a conversation, check suggestions, copy one to the input, then press **Send message** separately. Toggle suggestions, close the conversation, and compare normal, delayed, suppressed, stale and disabled scenarios.

## Exercise

The host validates each suggestion and binds it to conversation ID, turn and response version. The Copy button changes only the browser draft. A separate user Send request increments the turn. A stale or mismatched suggestion ID is rejected before send. Suggestions can be delayed, suppressed, disabled or absent without changing the answer.

The offline answer and suggestion usage are attributed separately as authored zero-token fixtures. An optional live suggestion session would have its own budget and usage and would need cancellation when the parent closes; this lab does not start it.

## Evidence to inspect

Compare the suggestion's binding fields, explicit send count, zero auto-send count, separate usage records and stale rejection. Inspect `server/lib/lab38-suggestions.ts` for the send guard.

## Troubleshooting

If a suggestion is absent, check the scenario and feature switch. A delayed suggestion appears after its availability time. After a newer turn, request a new suggestion rather than sending an old one.

## Limitations

No native `prompt_suggestion` SDK event or guaranteed suggestion stream is assumed. The offline fixture makes zero provider calls. A live suggestion session is unavailable until separately configured and budgeted.

## Challenge

Explain why a suggestion may be absent and why accepting one needs a separate send.

## Run locally

```powershell
node --import tsx --test tests/lab38-prompt-suggestions.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab38-browser-demonstration.mjs
```

Baseline and comparison
1. Start a normal offline conversation and inspect the answer before checking suggestions.
2. Copy a suggestion into the input and confirm the explicit send count does not change.
3. Press Send message to submit it as a separate user turn.
4. Try delayed, suppressed and disabled suggestions; absence is valid.
5. Create a newer turn and confirm an older suggestion is stale and rejected.

Student challenge
Explain why a suggestion may be absent and why accepting one needs a separate send.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab38-prompt-suggestions.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L39 Trusted configuration and untrusted checkouts

Verify a host-selected configuration manifest and hash before handling branch data through checked file tools.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 39 Trusted configuration and untrusted checkouts after the preceding lesson. Goal: Verify a host-selected configuration manifest and hash before handling branch data through checked file tools.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c39. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept39ProjectConfigRoot.tsx
- server/concepts/39-project-config-root.ts
- shared/lab39-project-config-root.ts
- server/lib/lab39-project-config-root.ts
- Tab39-project-config-root.md

Implementation brief
Goal: Keep trusted agent configuration separate from branch-provided data.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept39ProjectConfigRoot.tsx; server/concepts/39-project-config-root.ts; Tab39-project-config-root.md

Build: Replace projectConfigRoot with a host-selected immutable configuration manifest and hash. A disposable Git worktree supplies untrusted source only through checked custom read/edit tools; do not mount an unreviewed repository with automatic .claude/skills discovery. Select agent/version, tools, MCP and skills from the trusted manifest. Optional remote mounts require a reviewed resource policy. No cwd implies configuration authority.

Experiment: Conflicting harmless markers, missing trusted manifest, modified hash and branch-provided instruction takeover attempt.

Verify: Reject branch authority and never run branch hooks. Test provenance, protected config and path/junction guards. Distinguish read-only data from privileged system instructions.

Reference route inventory under /api/c39: POST /dry; POST /where; POST /takeover; POST /try; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. Git enables the disposable worktree; if Git is absent, the exercise uses a host-created local fixture. No Anthropic key is needed.

## Controls

Choose conflict, missing-manifest, modified-hash or takeover. Press **Create disposable worktree**, then inspect provenance, attempt takeover, or use the checked read/edit controls. The dry check only reports the host manifest hash.

## Exercise

The host owns an immutable agent configuration manifest and SHA-256 hash. It selects the agent, custom tool names, MCP and skills. The branch checkout contains fictional notes and a conflicting `CLAUDE.md` marker. Checked reads may show branch text as data, but cannot promote it to system instructions. Edits are limited to `notes.txt`; traversal, absolute paths, repository metadata and links are refused. Git fixture creation disables hooks. Missing or changed hashes reject the session before checked tools run.

## Evidence to inspect

Compare expected and supplied hashes, host and branch markers, tool decisions, branch hook count and provider call count. Inspect `server/lib/lab39-project-config-root.ts` for provenance, path checks and worktree cleanup. The evidence is host-generated; branch text is not an instruction.

## Troubleshooting

If Git cannot create the worktree, the local fixture keeps the boundary exercise available. A rejected manifest disables checked reads and edits. Use `notes.txt` for a permitted edit; `CLAUDE.md` is read-only branch data.

## Limitations

This is a local authored fixture. It does not mount an unreviewed remote repository, start a Managed session, discover `.claude/skills`, execute branch hooks or prove model behavior. A remote mount would require a reviewed resource policy. The checked tools demonstrate the host boundary, not a general repository sandbox.

## Challenge

Identify a branch rule the trusted configuration refuses to execute.

## Run locally

```powershell
node --import tsx --test tests/lab39-project-config-root.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab39-browser-demonstration.mjs
```

Baseline and comparison
1. Create a disposable worktree and compare the trusted host marker with a conflicting CLAUDE.md branch marker.
2. Inspect provenance and attempt the branch instruction takeover; confirm no hook ran.
3. Read notes.txt as data, then edit only that allowlisted file.
4. Try CLAUDE.md as an edit target, traversal and an absolute path; inspect each refusal.
5. Repeat with a missing manifest and a changed hash; neither can start a trusted session.

Student challenge
Identify a branch rule the trusted configuration refuses to execute.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab39-project-config-root.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L40 Safe recovery boundaries

Choose recovery from a host command/effect ledger without erasing remote history or dropping accepted work.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 40 Safe recovery boundaries after the preceding lesson. Goal: Choose recovery from a host command/effect ledger without erasing remote history or dropping accepted work.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c40. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept40ResumeDropsTurn.tsx
- server/concepts/40-resume-drops-turn.ts
- shared/lab40-resume-drops-turn.ts
- server/lib/lab40-recovery.ts
- Tab40-resume-drops-turn.md

Implementation brief
Goal: Recover without deleting unacknowledged work or remote history.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept40ResumeDropsTurn.tsx; server/concepts/40-resume-drops-turn.ts; Tab40-resume-drops-turn.md

Build: Replace resumeDropsTurn/resumeSessionAt with a host command/effect ledger and explicit recovery boundary. Managed event history is immutable from this exercise; do not truncate it. Inspect queued/processed messages and pending calls, then choose continued owned session, bounded interrupt or fresh derived session with selected verified context. Undo restores only a versioned host fixture snapshot and never promises to erase a remote turn.

Experiment: Kept turn, uncertain later send, queued follow-up and pending effect. Refuse unsafe undo and offer plain continuation or reconciliation.

Verify: No accepted command or applied effect is silently lost. Uncertain send is not a transient retry. Test event IDs, versions and duplicate-effect prevention.

Reference route inventory under /api/c40: POST /dry; POST /build; GET /state; POST /cases; POST /undo; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The authored recovery fixture needs no Anthropic key.

## Controls

Build a kept turn, uncertain send, queued follow-up, pending effect or clean snapshot. Inspect the state, try host-only undo, then choose continuation, bounded interrupt, fresh derived context or reconciliation.

## Exercise

The host command/effect ledger records accepted and processed messages, pending or applied effects and immutable remote event IDs. A queued follow-up must be carried forward once. An uncertain send needs receipt reconciliation before any retry. A pending effect needs effect reconciliation before continuing. A fresh derived session is allowed only after outstanding work is accounted for. Undo uses a versioned host fixture snapshot; it cannot erase a remote turn, accepted command or applied effect.

## Evidence to inspect

Compare command IDs, effect IDs, event IDs, version, recovery choice and unchanged history count. The source in `server/lib/lab40-recovery.ts` contains the refusal rules. Agent claims do not substitute for host ledger evidence.

## Troubleshooting

If a choice returns 409, inspect uncertain, queued or pending entries. Reconciliation is a separate recorded outcome; the fixture does not guess whether a remote send was accepted. Rebuild the case to compare another choice.

## Limitations

The offline fixture does not contact Anthropic or interrupt a real session. Its confirmed-idle interrupt is authored evidence only. A production host must observe remote idle before reuse and must query external effect receipts before marking uncertainty resolved. Remote history is never truncated by this lesson.

## Challenge

Explain how queued work changes the safe recovery boundary.

## Run locally

```powershell
node --import tsx --test tests/lab40-recovery.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab40-browser-demonstration.mjs
```

Baseline and comparison
1. Build the kept-turn case and compare remote event, command and effect IDs before and after continuation.
2. Try host-only undo and confirm it refuses to erase accepted work.
3. Compare uncertain send and pending effect; both require reconciliation before continuation or retry.
4. Inspect a queued follow-up and explain why fresh derivation would lose accepted work.
5. Use the clean snapshot case to restore only a versioned host draft.

Student challenge
Explain how queued work changes the safe recovery boundary.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab40-recovery.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L41 Managed session lifecycle comparison

Compare one-shot, retained and reconnect workflows using current Managed session events, IDs and archive evidence.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 41 Managed session lifecycle comparison after the preceding lesson. Goal: Compare one-shot, retained and reconnect workflows using current Managed session events, IDs and archive evidence.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c41. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept41V2SessionApi.tsx
- server/concepts/41-v2-session-api.ts
- shared/lab41-v2-session-api.ts
- server/lib/lab41-lifecycle.ts
- server/lib/lab06-port.ts
- Tab41-v2-session-api.md

Implementation brief
Goal: Compare one-shot, retained-session and reconnect workflows on the current API.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept41V2SessionApi.tsx; server/concepts/41-v2-session-api.ts; Tab41-v2-session-api.md

Build: Remove historical claude-agent-sdk-v2 aliases and unstable_v2 imports. Build a current Managed adapter using sessions.create, events.stream/send/list, retrieve and archive. A static historical panel explains the prior local-process model without loading a legacy runtime. Compare one-shot auto-close with retained session and reconnect, using actual resolved IDs and cleanup evidence.

Experiment: One-shot, two-turn retained session, interrupt/continue, reconnect/history hydration and archived-session refusal.

Verify: Test pinned official SDK dependency and absence of Agent SDK imports. No process-count or JSONL compatibility claim applies to the remote harness. Reconnect cannot create a second billed session.

Reference route inventory under /api/c41: GET /facts; GET /state; POST /oneshot; POST /continue; POST /compare; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The offline fixture needs no Anthropic key. The project pins official `@anthropic-ai/sdk` 0.133.0.

## Controls

Choose one-shot, retained, interrupt/continue, reconnect or archived refusal. Start the workflow, inspect state, send a second turn, reconnect through history hydration, interrupt or archive as appropriate.

## Exercise

The current adapter in `server/lib/lab06-port.ts` uses `sessions.create`, `events.stream`, `events.send`, `events.list`, `sessions.retrieve` and `sessions.archive`. The Lab 41 fixture uses its matching port boundary to compare lifecycles without billing. One-shot archives after idle. Retained mode keeps the same resolved session ID for a second turn. Reconnect lists history from that ID and creates no second session. Archive refuses future sends. An interrupt is usable for continuation only after idle confirmation.

## Evidence to inspect

Compare resolved session ID, user and agent event IDs, listed history, created-session count, reconnect creation count and archive count. Inspect `server/lib/lab41-lifecycle.ts` for workflow sequencing and `server/lib/lab06-port.ts` for current SDK calls. The historical local-process panel is static and loads no legacy runtime.

## Troubleshooting

If a second turn fails, check whether the workflow already archived. Reconnect requires an owned retained session. Start a fresh workflow to compare an alternate sequence.

## Limitations

The offline fixture reports zero provider calls and cannot prove real remote history or billing. It makes no local process-count or JSONL compatibility claim for Managed Agents. Live workflow execution is not configured in this lesson; current SDK methods are shown through the existing live adapter source.

## Challenge

Describe the Managed event sequence for continuing an idle session.

## Run locally

```powershell
node --import tsx --test tests/lab41-lifecycle.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab41-browser-demonstration.mjs
```

Baseline and comparison
1. Start one-shot and inspect the sent user event, streamed agent event, idle confirmation and archive.
2. Start retained mode and send a second turn using the same session ID.
3. Reconnect by listing history and confirm no additional session is created.
4. Interrupt an idle retained session and continue it after the fixture idle confirmation.
5. Inspect archived-session refusal and the static historical model panel.

Student challenge
Describe the Managed event sequence for continuing an idle session.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab41-lifecycle.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L42 Bounded web research and citations

Research with bounded, inspected source records and verify citations against returned evidence while refusing unsafe redirects.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 42 Bounded web research and citations after the preceding lesson. Goal: Research with bounded, inspected source records and verify citations against returned evidence while refusing unsafe redirects.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c42. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept42WebTools.tsx
- server/concepts/42-web-tools.ts
- shared/lab42-web-tools.ts
- server/lib/lab42-research.ts
- Tab42-web-tools.md

Implementation brief
Goal: Research with inspected sources and bounded execution.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept42WebTools.tsx; server/concepts/42-web-tools.ts; Tab42-web-tools.md

Build: Configure documented web_search/web_fetch toolset fields and restrictions only when present in installed types. Use exact tool names and observed results, not Agent SDK WebSearch/WebFetch. For deterministic URL/redirect/private-address enforcement use a narrow host custom fetch handler with built-in unrestricted fetch/bash disabled; a confirmation of an initial URL alone cannot prove redirect safety. Normalize sources into evidence IDs and verify final citations against returned records.

Experiment: Authored offline pages with injection, redirect and blocked host; optional live uses approved public documentation and explicit request/spend limits.

Verify: Escape untrusted output, no arbitrary proxy/private fetch, and distinguish snippets from complete pages. Actual citations/effects are inspected; fixture citations are authored evidence.

Reference route inventory under /api/c42: GET /facts; POST /basics; POST /fetch-lab; POST /injection; POST /guard; POST /research; GET /state; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The offline pages are authored fixtures and need no Anthropic key or internet access.

## Controls

Choose basics, fetch, injection, redirect, blocked host or research, then run the fixture. Compare inspected source IDs, snippet/page kind, redirect decisions and citation verification.

## Exercise

The installed Managed SDK exposes `web_search` and `web_fetch` configs with `allowed_domains`, `max_content_tokens` and `url_sources`. The teaching adapter shows those exact fields. For deterministic host policy, its offline custom fetch transport disables built-in unrestricted `web_fetch` and bash. Each URL and redirect is checked against the HTTPS host rule before another fixture request. The host also checks a resolved-address set; the offline mapping is authored. Search snippets remain marked snippets. Returned page text is data, so a hostile instruction cannot change host policy. Final citations must name inspected evidence IDs.

## Evidence to inspect

Compare request count, redirect targets, host refusal, source kind, hostile-text classification and citation IDs. Inspect `server/lib/lab42-research.ts` for the URL/address guards and citation check. A refused redirect target is not fetched.

## Troubleshooting

The redirect and blocked-host scenarios intentionally return no source. In basics, the source is only a search snippet; use fetch or research for a complete authored page. A hostile page remains visible as escaped text.

## Limitations

This offline fixture performs zero network and provider calls. It does not claim production SSRF safety or DNS pinning; a live custom fetch implementation must bind the checked address to the actual connection and enforce every redirect. Built-in Managed domain restrictions alone do not prove redirect safety. Optional live research is unavailable until a reviewed public-documentation policy and spend limit are configured.

## Challenge

Test a hostile page and inspect the enforcing host decision.

## Run locally

```powershell
node --import tsx --test tests/lab42-web-tools.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab42-browser-demonstration.mjs
```

Baseline and comparison
1. Inspect exact installed Managed web_search and web_fetch config fields in the code view.
2. Compare a search snippet with a complete authored page.
3. Run the hostile page and confirm its instruction remains escaped source data.
4. Run redirect and blocked-host cases; compare checked targets and request counts.
5. Verify answer citation IDs against inspected source records.

Student challenge
Test a hostile page and inspect the enforcing host decision.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab42-web-tools.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L43 MCP resources through a host bridge

Read authenticated, bounded MCP resources through a host bridge without assuming Managed query-control methods.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 43 MCP resources through a host bridge after the preceding lesson. Goal: Read authenticated, bounded MCP resources through a host bridge without assuming Managed query-control methods.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c43. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept43RemoteMcp.tsx
- server/concepts/43-remote-mcp-resources.ts
- shared/lab43-remote-mcp-resources.ts
- mcp-servers/lab43-resources.ts
- server/lib/lab43-mcp-bridge.ts
- Tab43-remote-mcp-resources.md

Implementation brief
Goal: Read authenticated, bounded MCP resources without assuming query control methods.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept43RemoteMcp.tsx; server/concepts/43-remote-mcp-resources.ts; Tab43-remote-mcp-resources.md

Build: Author a loopback MCP server with tools, resources/templates and prompts. The host MCP client can read approved resource URIs and return data through a typed Managed custom tool. Direct Managed URL MCP is configured separately for reachable live tools; it does not automatically expose every MCP resource/prompt or local callback. Use supported vault credentials for direct integration or server-side bridge credentials. Toy consent/token flow remains local.

Experiment: Versioned resource, allowed template, known prompt, bad token, expired host token and unknown URI.

Verify: Keep server-owned URIs, bounded results and auth redaction; close local transports. New direct credentials/config follow documented idle update or fresh-session rules, not an invented reconnect method.

Reference route inventory under /api/c43: GET /facts; POST /auth; POST /cache; POST /transports; POST /toolsets; POST /resources; POST /host-read; POST /live; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The lab opens a loopback-only MCP JSON-RPC fixture after local consent. No Anthropic key or internet access is needed.

## Controls

Grant local consent, list resources and templates, read a versioned resource, then try a known prompt, bad token, expired token and unknown URI. Refresh the bridge token and retry. Inspect toolsets to compare the host bridge with unavailable direct URL MCP.

## Exercise

The loopback server offers `tools/list`, `resources/list`, `resources/templates/list`, `prompts/list`, `resources/read` and `prompts/get`. Its bearer token stays server-side and is redacted in browser evidence. The host client accepts only server-owned URI versions, bounds result size and turns an approved resource read into a typed `user.custom_tool_result` fixture. Direct Managed URL MCP needs a reachable service and separate vault credentials; it does not automatically expose all resources, prompts or local callbacks. Credential changes follow documented idle update or a fresh session, not a fabricated reconnect control.

## Evidence to inspect

Compare consent, token state, transport method, URI, bounded result, resource version and custom tool result. Inspect `mcp-servers/lab43-resources.ts` and `server/lib/lab43-mcp-bridge.ts` for server authorization, URI allowlisting and transport close.

## Troubleshooting

If a host read is refused, grant consent or refresh the token. Unknown URIs remain refused. The expired-token scenario intentionally needs a new token before a subsequent authorized call.

## Limitations

This is a toy local consent flow and loopback HTTP fixture, not a production OAuth or remote MCP service. It makes zero Anthropic calls and does not configure direct Managed URL MCP. The returned custom-tool event is authored evidence, not an observed provider tool pause.

## Challenge

Refresh the bridge token and inspect the next authorized call.

## Run locally

```powershell
node --import tsx --test tests/lab43-mcp-bridge.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab43-browser-demonstration.mjs
```

Baseline and comparison
1. Grant local consent and inspect loopback tool, resource/template and prompt listings.
2. Read v1 and v2 server-owned resource URIs and compare versioned results.
3. Get the known prompt and inspect the bounded host custom-tool result shape.
4. Try bad token, expired token and unknown URI; confirm no result escapes.
5. Refresh the bridge token and verify the next authorized read.

Student challenge
Refresh the bridge token and inspect the next authorized call.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab43-mcp-bridge.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L44 Host telemetry and provider event traces

Correlate redacted host OTLP spans with separately labeled Managed model-span event evidence and effect counts.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 44 Host telemetry and provider event traces after the preceding lesson. Goal: Correlate redacted host OTLP spans with separately labeled Managed model-span event evidence and effect counts.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c44. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept44OtelObservability.tsx
- server/concepts/44-otel-observability.ts
- shared/lab44-otel-observability.ts
- server/lib/lab44-telemetry.ts
- Tab44-otel-observability.md

Implementation brief
Goal: Correlate local spans with remote session and tool events.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept44OtelObservability.tsx; server/concepts/44-otel-observability.ts; Tab44-otel-observability.md

Build: Instrument Express, Managed-port operations, custom handlers, approval waits and cleanup with a host OpenTelemetry exporter and bounded local OTLP collector. Add session/thread/sevt_ IDs as attributes and keep prompt/tool content redacted by default. Managed model-span events are provider evidence, not proof of a remote OTLP export. No Claude Code child telemetry environment applies to the cloud harness.

Experiment: Successful, denied and failed tool; explicit fictional content recording; trace parent propagation through host operations and gaps in remote data.

Verify: Distinguish observed provider spans from host-generated spans and missing signals. Test redaction, correlation and bounded collector storage without model calls.

Reference route inventory under /api/c44: GET /facts; POST /signals; POST /privacy; POST /tracing; POST /rich; POST /exporters; POST /collector; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The host exporter opens a bounded loopback OTLP JSON collector only when an offline trace runs. No Anthropic key is needed.

## Controls

Run successful, denied, failed-tool or missing-provider-span cases. Compare host spans, effect count and provider event records. Toggle fictional content recording explicitly, then inspect the collector count.

## Exercise

Host spans cover the Express request, Managed-port operation, approval wait, custom handler and cleanup. Trace ID and parent span ID connect them; session, thread and `sevt_` tool event IDs are attributes. Prompt and tool content are redacted by default. The optional recording toggle adds only fictional content for the current owner. The local exporter sends OTLP HTTP JSON to a collector with batch, payload and storage bounds. Managed `span.model_request_start` and `span.model_request_end` records are provider event evidence, not host-exported spans. A missing event is a signal gap, not proof of no model activity.

## Evidence to inspect

Compare the denied case's approval decision and zero effects with the successful case's handler and one effect. Inspect trace/parent IDs, collector span count and redaction attributes in `server/lib/lab44-telemetry.ts`. The provider event IDs are separately labeled authored fixture records.

## Troubleshooting

If no fictional prompt attribute appears, enable recording before starting a new run. The denied case intentionally has no custom-handler span. The missing-provider-span case intentionally has no provider event records.

## Limitations

The default collector is local. An explicit remote export adapter is also available: configure LAB44_OTLP_ENDPOINT with a reviewed HTTPS /v1/traces destination, optional LAB44_OTLP_BEARER_TOKEN and LAB44_REMOTE_EXPORT_ENABLED=1, then restart the backend. Remote collector setup reports missing or invalid setting names. Export redacted host trace sends only an owned run, strips recorded content and provider event fixtures, labels the payload authored-fixture, rejects redirects and bounded/partial-failure responses, and deduplicates confirmed exports. Collector acceptance proves transport acceptance of fixture spans, not a genuine provider model trace. Model-span event fixtures do not prove remote OTLP export or full provider traces. This lab makes zero Anthropic calls. Claude Code child-process telemetry environment variables do not apply to the Managed cloud harness.

## Challenge

Compare denied and executed actions in the host trace and effect ledger.

## Run locally

```powershell
node --import tsx --test tests/lab44-telemetry.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab44-browser-demonstration.mjs
```

## Azure Monitor

Azure is the selected monitoring target. The official Azure Monitor OpenTelemetry exporter is pinned at 1.0.0-beta.46 with OpenTelemetry 2.12.0. Configure APPLICATIONINSIGHTS_CONNECTION_STRING and LAB44_AZURE_EXPORT_ENABLED=1 to enable the explicit Azure export button. It sends authored span names, status and source correlation IDs only, with an authored-fixture resource label. Recorded content and provider event fixtures are excluded. Acceptance is transport evidence, not a provider model trace. A fake transport with the actual OTel pipeline verifies success and rejection locally.

The prepared scripts/azure-monitor-resources.json template creates only a dedicated North Europe Log Analytics workspace and Application Insights resource, with 30-day retention and a 1 GB daily ingestion quota. That quota is not a spending cap. scripts/azure-monitor-setup.ps1 defaults to read-only inspection; -Provision creates the resources and stores connection information only in ignored .env, preserving the Anthropic key. Actual provisioning requires explicit cost authorization. No hosting deployment or notification is included.

References: [Microsoft Azure exporter](https://learn.microsoft.com/en-us/javascript/api/overview/azure/monitor-opentelemetry-exporter-readme), [workspace-based Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/create-workspace-resource). Native Azure OTLP ingestion uses a separate Entra-authenticated collector path; this adapter uses the official Azure exporter.

The configured workspace successfully accepted a five-span Azure smoke test after explicit provisioning approval. Repeat deliberately with node --env-file-if-exists=.env --import tsx scripts/live-azure-monitor-smoke.ts --execute-approved-azure-test. It emits only redacted authored host metadata and incurs Azure ingestion, not an Anthropic model call.

Baseline and comparison
1. Run a successful tool fixture and follow trace/parent IDs across Express, port, approval, handler and cleanup spans.
2. Compare denied and failed-tool cases against effect count and host decisions.
3. Inspect a missing provider model-span signal without inferring that no model activity occurred.
4. Opt in to fictional content recording and compare attributes with the default redacted run.
5. Inspect bounded collector storage and distinguish host export from provider event evidence.

Student challenge
Compare denied and executed actions in the host trace and effect ledger.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab44-telemetry.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L45 Provider availability and configuration

Separate documented Managed Agents availability, installed client verification and Messages API support before choosing a provider path.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 45 Provider availability and configuration after the preceding lesson. Goal: Separate documented Managed Agents availability, installed client verification and Messages API support before choosing a provider path.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c45. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept45CloudProviders.tsx
- server/concepts/45-cloud-providers.ts
- shared/lab45-cloud-providers.ts
- server/lib/lab45-providers.ts
- Tab45-cloud-providers.md

Implementation brief
Goal: Distinguish Managed Agents availability from Messages API provider support.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept45CloudProviders.tsx; server/concepts/45-cloud-providers.ts; Tab45-cloud-providers.md

Build: Build a current documented provider capability catalog with host authentication shapes and environment/session prerequisites. Use a loopback emulator and synthetic credentials offline. First-party Managed Agents is the baseline; Claude Platform on AWS is a separately documented path with its own available capabilities. Do not equate Bedrock, Vertex or Foundry Messages clients with Managed session support. Mark provider routes unavailable unless exact official Managed endpoints/types are verified.

Experiment: Synthetic model/auth/config mismatch, missing feature and explicit first-party readiness. Emulated requests remain labeled offline even when wire shapes resemble a provider.

Verify: No cloud account/deployment is required offline. No credential forwarding or billed test begins automatically. Record actual target support and redacted errors.

Reference route inventory under /api/c45: GET /facts; POST /catalog; POST /same; POST /auth; POST /models; POST /failures; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. The catalog is based on current official documentation and installed `@anthropic-ai/sdk` 0.133.0. The emulator needs no cloud account or credential.

## Controls

Load the capability catalog, choose a target and compare Messages versus Managed support. Run synthetic ready, bad-auth, model-mismatch, missing-config and missing-feature preflights against a loopback emulator.

## Exercise

The direct Claude API is the installed Managed-session baseline. [Anthropic's API overview](https://platform.claude.com/docs/en/api/overview) lists Managed Agents on the direct Claude API and Claude Platform on AWS. [AWS feature support](https://docs.aws.amazon.com/claude-platform/latest/userguide/feature-support.html) documents Managed Agents on Claude Platform on AWS, with outcomes and multi-agent sessions unavailable; its [authentication guide](https://docs.aws.amazon.com/claude-platform/latest/userguide/authentication.html) describes SigV4 or a separate API key, regional endpoint and workspace. The project now pins the official @anthropic-ai/aws-sdk 0.8.0 against SDK 0.133.0. Local checks verified its Managed methods and two injected read-only SDK GET requests, including regional endpoint and workspace header. AWS resource setup lists missing or invalid settings from .env.example. Configure a separate AWS-issued key, workspace, region and existing resource IDs, enable LAB45_AWS_LIVE_ENABLED=1 and restart the backend. Check AWS resources (read-only) retrieves the configured agent and environment, with no retries or session creation. This check does not establish model execution. Bedrock, Vertex and Foundry Messages access does not prove Managed-session support. The loopback emulator uses synthetic credentials and never creates a session.

## Evidence to inspect

Compare `managedDocumented`, `installedManagedClientVerified` and `managedRouteEnabled` separately. Inspect target authentication shape and prerequisites, emulator HTTP status, redacted credential field and `sessionCreated: false`. `server/lib/lab45-providers.ts` holds the catalog and preflight decisions. Documentation was checked on 2026-10-17; recheck before a real integration.

## Troubleshooting

If the emulator says ready but the target route is disabled, its wire-shape check is only synthetic. Check the exact installed client, endpoint, workspace, model and feature availability before any live request. A first-party setup check reports missing names, not secret values.

## Limitations

No cloud provider was called, and no account, deployment, provisioning or billable run was started. The emulator does not attest actual provider authentication or model availability. Provider capabilities can change; the linked official pages are authoritative for a later deployment.

## Challenge

Identify a preflight check that catches an unsupported provider path.

## Run locally

```powershell
node --import tsx --test tests/lab45-providers.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab45-browser-demonstration.mjs
```

Baseline and comparison
1. Load the dated official capability catalog and compare direct Claude API with Claude Platform on AWS.
2. Inspect Bedrock, Vertex and Foundry Messages paths without inferring Managed sessions.
3. Run synthetic ready and auth/model/config mismatch cases against the loopback emulator.
4. Compare a passed emulator wire check with a disabled AWS Managed route.
5. Inspect first-party setup readiness without forwarding credentials or starting a billed run.

Student challenge
Identify a preflight check that catches an unsupported provider path.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab45-providers.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L46 Observed cache usage and cost

Compare supported Managed cache-read and creation counters across equal-scope observations without inventing prompt control or savings.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 46 Observed cache usage and cost after the preceding lesson. Goal: Compare supported Managed cache-read and creation counters across equal-scope observations without inventing prompt control or savings.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c46. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept46PromptCaching.tsx
- server/concepts/46-prompt-caching.ts
- shared/lab46-prompt-caching.ts
- server/lib/lab46-cache-observations.ts
- server/lib/lab15-accounting.ts
- Tab46-prompt-caching.md

Implementation brief
Goal: Compare observed cache counters without claiming control of the cloud prompt.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept46PromptCaching.tsx; server/concepts/46-prompt-caching.ts; Tab46-prompt-caching.md

Build: Use a stable authored handbook and dynamic suffix across bounded retained-session or fresh-session comparisons. Read actual cache-read/create counters from supported usage records and display configuration/session identity. Managed Agents owns its internal model request composition; do not expose Messages cache_control, SYSTEM_PROMPT_DYNAMIC_BOUNDARY, cache TTL switches or PreModelSwitch veto as session options. A separate direct Messages demonstration may inspect such controls but must be explicitly labeled another API and opt-in.

Experiment: Reused versus changed content, changed model/tools in fresh sessions, short inputs and missing usage. Offline counter examples are authored, not savings measurements.

Verify: Compare equal-scope snapshots and show uncertainty. No guaranteed hit, minimum size, price or savings. A wire tap of host Managed HTTP cannot reveal internal Messages requests.

Reference route inventory under /api/c46: GET /facts; POST /anatomy; POST /switches; POST /breakers; POST /model-switch; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local development server. Offline readings are authored fixtures; no Anthropic key is needed.

## Controls

Compare reused content, changed prefix, changed model, changed tools, short input or missing usage. Inspect the stable handbook, changing suffixes, session/model/tool identities and cache-read/creation counters.

## Exercise

The installed Managed SDK exposes cache-read and cache-creation counters in model-request usage records, plus cache readings in session usage. This lesson normalizes the observed fields through the Lab 15 usage boundary while keeping the model-request creation counter separate from any TTL breakdown. A retained session can compare two model-request readings of equal scope; fresh sessions with changed model or tools are shown side by side without subtraction. Missing usage remains unknown. Managed Agents owns internal model request composition, so `cache_control`, `SYSTEM_PROMPT_DYNAMIC_BOUNDARY`, TTL switches and `PreModelSwitch` veto are not session options. A direct Messages demonstration would be a separate opt-in API.

## Evidence to inspect

Compare source, scope, session ID, model, tool version, content hash and input/output/cache counters. List cost stays unknown at model-request scope. Read `server/lib/lab46-cache-observations.ts` and the shared Lab 15 normalizer. An authored cache-read value illustrates a counter, not a measured hit rate or billing reduction.

## Troubleshooting

In the missing-usage case, counters are unknown. Short input may show zeros. Fresh model or tool variants deliberately use separate session IDs and have no numerical delta.

## Limitations

All counters are authored examples. The lab makes zero provider calls and offers no guaranteed hit, minimum cacheable size, cache lifetime, token price or savings estimate. A host Managed HTTP wire tap cannot inspect the harness's internal Messages requests.

## Challenge

Change a content prefix and compare measured cache counters when available.

## Run locally

```powershell
node --import tsx --test tests/lab46-cache-observations.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab46-browser-demonstration.mjs
```

Baseline and comparison
1. Read the stable authored handbook and dynamic suffixes in the anatomy view.
2. Compare two retained-session model-request usage records for reused content.
3. Change the prefix and inspect the content hash and observed counter examples.
4. Change model or tools in fresh sessions and see why no delta is calculated.
5. Try short input and missing usage; zero and unknown are different outcomes.

Student challenge
Change a content prefix and compare measured cache counters when available.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab46-cache-observations.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L47 Model driven and host driven orchestration

Compare native Managed worker threads with a host pipeline of independent sessions using closed reports and verified sales fixtures.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 47 Model driven and host driven orchestration after the preceding lesson. Goal: Compare native Managed worker threads with a host pipeline of independent sessions using closed reports and verified sales fixtures.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c47. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept47MultiAgent.tsx
- server/concepts/47-multi-agent.ts
- shared/lab47-multi-agent.ts
- server/lib/lab47-multi-agent.ts
- Tab47-multi-agent.md

Implementation brief
Goal: Coordinate workers through verified data contracts.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept47MultiAgent.tsx; server/concepts/47-multi-agent.ts; Tab47-multi-agent.md

Build: Provide a capability-checked native multiagent coordinator and a code-driven extract, route, specialists, editor pipeline using separate Managed sessions. Use closed custom report contracts, role-specific tools and bounded concurrency. Correlate native thread IDs separately from independent session IDs; each report is verified against sales fixtures before handoff. Dynamic workflow/nested coordinator support is not assumed; the pinned agent configuration depth limit and account capabilities govern native delegation. Host dependency graphs can model deeper workflows without calling them native hierarchy.

Experiment: Regional sales, incorrect total with one corrective round, delayed worker and dependency failure. Keep raw worker reports distinct from parent final text.

Verify: Attribute usage at the right scope without double counting; a native session budget is shared, independent sessions require a host aggregate ledger. Agent prose never satisfies the gate.

Reference route inventory under /api/c47: GET /facts; POST /orchestrator; POST /hierarchy; POST /pipeline; POST /fanout; POST /evaluator; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Complete the earlier session, delegation and validated-report labs. This exercise runs authored offline fixtures; it needs no Anthropic key and sends no provider request.

## Controls

Choose a native `orchestrator` or `hierarchy` view, or a host `pipeline`, `fanout` or `evaluator` view. Run regional sales, an incorrect total, a delayed worker or a dependency failure. The route is a teaching comparison; it does not provision agents.

## Evidence to inspect

The pinned SDK exposes `multiagent_20261001` and `session_thread_id`; account capability is unknown offline. Native workers share a parent session and budget while their thread IDs remain distinct. Host workers have independent session IDs and a separate aggregate ledger. Inspect raw worker text alongside schema-and-fixture-verified reports. The incorrect south total of 800 receives one corrective round to reach the fixture value 80. A delayed or blocked report cannot satisfy the handoff gate, even when parent prose says it did. Host dependency graphs can represent deeper workflows without implying native delegation depth beyond one.

## Troubleshooting

If the backend rejects a request, use the local application origin and refresh the page to obtain a new experiment owner. The route accepts only `scripted` mode and one named scenario. Check `GET /api/c47/facts` for the installed type capability and `GET /api/c47/code` for source locations.

## Limitations

All IDs, reports, usage and outcomes are authored fixtures, not provider observations. Role-specific tools and native account entitlement require a separately configured, explicitly opted-in live exercise. Per-worker illustrative counters in the native example must not be added to the parent session usage. The host aggregate applies only to independent-session examples.

## Challenge

Stop one worker and inspect how its dependent editor task is blocked. Explain why parent final text cannot override that gate.

## Run locally

```powershell
node --import tsx --test tests/lab47-multi-agent.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab47-browser-demonstration.mjs
```

Baseline and comparison
1. Choose a native or host orchestration route and inspect session versus thread identity.
2. Run regional sales and compare raw worker text with verified reports.
3. Run incorrect total and inspect the single corrective round before handoff.
4. Run delayed worker and dependency failure to see why parent prose cannot pass the gate.
5. Compare shared native session usage with the host aggregate of independent sessions.

Student challenge
Stop one worker and inspect the effect on dependent tasks.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab47-multi-agent.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L48 Security hardening

Use host-enforced tool input, path and egress checks to distinguish hostile attempts from observed local effects.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 48 Security hardening after the preceding lesson. Goal: Use host-enforced tool input, path and egress checks to distinguish hostile attempts from observed local effects.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c48. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept48SecurityHardening.tsx
- server/concepts/48-security-hardening.ts
- shared/lab48-security-hardening.ts
- server/lib/lab48-security-range.ts
- Tab48-security-hardening.md

Implementation brief
Goal: Test enforcement boundaries against hostile requests.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept48SecurityHardening.tsx; server/concepts/48-security-hardening.ts; Tab48-security-hardening.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Build a local hardening range with fake canaries, a loopback egress witness and naive versus layered policies. Combine least privilege, canonical path boundaries, supported restrictive settings, host tool-worker environment scrubbing and tool-output redaction.

Experiment: Try secret read, out-of-scope write and an injected request to send a canary to a simulated sink. Display attempted versus executed effects.

Verify: No genuine credentials enter the range. Check collector hits and files, not reassuring model text. Explain that prompts and cwd alone are not security boundaries.

Reference route inventory under /api/c48: GET /facts; POST /permissions; POST /lockdown; POST /secrets; POST /injection; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Use this local exercise without Anthropic credentials. The range contains a fake canary only. The installed Managed SDK's custom-tool event/result pattern informs the fixture, but no Managed session is started.

## Controls

Choose a naive prompt-only policy or a layered host policy. Try secret read, out-of-scope write and injected egress. Each run creates a fresh `sevt_fixture_` event ID and a separate host business idempotency key.

## Evidence to inspect

Compare attempted and executed effects, the outside-file state and loopback collector hits. The layered policy denies private reads, canonical out-of-scope writes and injected network egress. The naive policy illustrates a vulnerable effect using only fictional data. The response pairs a custom-tool result with its event ID; the stable business key is separately tracked to prevent replay. Closed Zod inputs generate the custom tool JSON Schema. Unused built-in tools, MCP servers and skills are absent from this range's configuration.

## Troubleshooting

Use the local app origin and a valid experiment owner. The routes accept only scripted inputs. `GET /api/c48/facts` shows the tool schema and disabled surfaces; `GET /api/c48/code` identifies the implementation.

## Limitations

This is a local security range, not a cloud sandbox test or a provider security guarantee. No genuine credentials enter the range. The loopback witness only sees requests made by this fixture. Prompts and working directory do not replace host authorization, path checks, environment scrubbing or egress policy. A remote cloud sandbox cannot be assumed to see host files.

## Challenge

Identify the host check that protects data when the model is misled. Verify it using collector hits and outside-file state, not model prose.

## Run locally

```powershell
node --import tsx --test tests/lab48-security-hardening.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab48-browser-demonstration.mjs
```

Baseline and comparison
1. Compare a naive prompt-only policy with layered host enforcement.
2. Try a fake secret read and inspect whether the canary is exposed.
3. Try an out-of-scope write and inspect the outside-file state.
4. Try injected egress and inspect the loopback collector hit count.
5. Compare the custom-tool event ID with the separate business idempotency key.

Student challenge
Identify the host check that protects data when the model is misled.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab48-security-hardening.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L49 Headless host and CI outcomes

Classify bounded headless Managed session work into machine-readable CI outcomes with explicit cleanup evidence.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 49 Headless host and CI outcomes after the preceding lesson. Goal: Classify bounded headless Managed session work into machine-readable CI outcomes with explicit cleanup evidence.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c49. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept49DeployCiHeadless.tsx
- server/concepts/49-deploy-ci-headless.ts
- shared/lab49-deploy-ci-headless.ts
- server/lib/lab49-headless.ts
- server/lib/lab01-run.ts
- Tab49-deploy-ci-headless.md

Implementation brief
Goal: Run bounded headless session work and report machine-readable outcomes.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept49DeployCiHeadless.tsx; server/concepts/49-deploy-ci-headless.ts; Tab49-deploy-ci-headless.md

Build: Author ci-kit runner/worker, Dockerfile and sample GitHub workflow for the TypeScript host, which calls Managed APIs over HTTPS. Use explicit agent/environment references, no Claude Code dontAsk, no local session-persistence flags, and no baked credentials. Select least-privilege tools, deny unresolved approvals by host policy, configure a session budget at creation and enforce host message/tool/deadline limits. Add health/readiness, concurrency reservations and graceful drain with remote cleanup.

Experiment: Local offline verdicts for pass, validation, limit and execution error; SIGTERM while waiting, concurrency rejection and unconfirmed remote stop.

Verify: Test without TTY/keys. Authored container/workflow files are not a deployed service. Live CI, provisioning, public hosting and resource mutation require explicit opt-in.

Reference route inventory under /api/c49: GET /facts; POST /headless; POST /ci; POST /limits; POST /deploy; GET /files; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

The offline exercise and `ci-kit/runner.mjs` need no TTY, key or provider account. A live CI run is a separate explicit operation requiring both `CI_MANAGED_LIVE_OPT_IN=true` and `MANAGED_LIVE_ENABLED=true`, plus server-side credentials and agent/environment references.

## Controls

Run pass, validation failure, limit reached, execution error, SIGTERM-shaped cancellation, concurrency rejection or unconfirmed remote stop. The UI calls only authored offline fixtures. The `GET /api/c49/files` route shows the runner, worker, Dockerfile and sample workflow. `POST /api/c49/deploy` is a fixture route, not deployment.

## Evidence to inspect

Each result has a machine outcome, CI exit code, closed report or null, session identity, host limits, interruption and cleanup state. A valid report alone does not pass CI: the live worker also requires turn completion and archive. The runner spawns a worker without a TTY, bounds output and runtime, forwards SIGTERM and emits one JSON verdict. The reused Managed adapter creates a budgeted session with explicit agent/environment IDs, rejects configured tools and MCP servers before sending, limits the work to one text message, and attempts remote cleanup. Pending or unconfirmed remote stop must fail CI.

## Troubleshooting

Use `node ci-kit/runner.mjs scripted pass` for a zero-provider-call check. A nonzero exit is expected for failure scenarios. The sample workflow is stored outside `.github/workflows` so it does not run automatically. A live setup problem should be resolved by a human before opting in; CI must not provision resources or retry an uncertain mutation blindly.

## Limitations

The authored Dockerfile and workflow are not a deployed service. Offline IDs, reports and outcomes are fixtures, not observed Managed usage. Live CI, provisioning, public hosting and resource mutation require explicit opt-in. No Claude Code `dontAsk` mode or local session-persistence flags are used.

## Challenge

Explain which outcomes fail CI and what remote idle/cleanup evidence is needed after SIGTERM.

## Run locally

```powershell
node ci-kit/runner.mjs scripted pass
node --import tsx --test tests/lab49-headless.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab49-browser-demonstration.mjs
```

Baseline and comparison
1. Run the pass fixture and inspect its validated report and zero exit code.
2. Run validation, limit and execution-error scenarios and compare failure exit codes.
3. Try SIGTERM, capacity rejection and unconfirmed remote stop; inspect cleanup state.
4. Read the authored runner, worker, Dockerfile and sample workflow before any live opt-in.

Student challenge
Explain which outcome should fail CI and what remote cleanup evidence is required.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab49-headless.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L50 Full stack capstone

Resolve fictional support cases through customer-owned tools, retained sessions, trusted host review and a verified refund ledger.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Begin the multi-step Lab 50 Full stack capstone. Read the remainder as the final target contract for the whole lab. In THIS parent checkpoint, establish the specification and minimal compiling scaffolding needed by 50A; implement the feature through the following lettered prompts 50A, 50B. Do not try to pass the full end-to-end lesson before those implementation substeps. Keep unfinished behavior unpublished and do not register a placeholder as an implemented lesson. Goal: Resolve fictional support cases through customer-owned tools, retained sessions, trusted host review and a verified refund ledger.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c50. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept50Capstone.tsx
- server/concepts/50-capstone.ts
- shared/lab50-capstone.ts
- server/capstone/store.ts
- server/capstone/tools.ts
- server/capstone/agent.ts
- server/capstone/desk.ts
- server/capstone/evals.ts
- Tab50-capstone.md

Implementation brief
Goal: Combine tools, approvals, sessions and validation in a support desk.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept50Capstone.tsx; server/concepts/50-capstone.ts; Tab50-capstone.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Build Acme Support Desk in server/capstone with store, tools, agent and eval modules. Create customers C-1/C-2, their distinct orders, policy files and conversations. Tools list orders, read policies, create tickets and propose/issue a policy-valid refund through a host approver.

Experiment: Provide chat/resume, customer selector, back-office state, correlated approve/deny and an audit timeline. A refund approval comes from trusted host identity and is single-use; agent-supplied approver names are ignored.

Verify: Verify tenant/customer isolation, refund totals in integer cents, session ownership, cancellation of pending approvals and actual persisted effects. Use the extra 50A and 50B prompts before moving to 51.

Reference route inventory under /api/c50: GET /facts; GET /state; POST /reset; GET /conversation/:id; POST /approve; POST /chat; POST /close; POST /evals; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Complete the tools, approvals, retained sessions and validated-report labs. The offline Acme Support Desk uses two fictional customers and requires no API key. `npm run capstone:check` validates the authored tool metadata without a provider call. Live mode requires a separately provisioned, version-pinned dedicated desk agent, exact custom tools, server-side credentials and `MANAGED_LAB50_LIVE_ENABLED=true`. The explicit `npm run capstone:provision` command additionally requires `LAB50_PROVISION_CONFIRM=YES` and `MANAGED_MODEL`; it is never called by the exercise.

## Controls

Select C-1 or C-2, send a support message, resume the same conversation, inspect back-office state, approve or deny a pending refund, close the session, and run deterministic host evals. Learn and TypeScript source views preserve the exercise state. Leaving the lesson requests closure of the retained conversation.

## Evidence to inspect

The host owns customers, orders, tickets, refund ledger, conversations and bounded audit entries. Each model-facing custom tool has a closed Zod-derived `input_schema`; its `agent.custom_tool_use` `sevt_` ID is matched to `user.custom_tool_result`. The customer and reviewer never come from model arguments. For C-1, damaged order O-1001 costs 5,000 cents and is eligible within the fixture window; the host checks ownership, positive integer cents, remaining amount and policy before issuing a pending review. Approval is immutable, single-use and expires. Denial, timeout or cancellation do not alter the refund ledger. C-2's unrelated order and malicious note are not authority to refund C-1.

The desk keeps the session ID across turns and archives only on explicit close. Paginated event history is bounded and deduplicated. Preview/prose evidence is distinct from host effects; final summaries must pass the closed JSON parser. Event IDs and any thread IDs are shown separately, with usage unknown unless observed. The policy-expert role has only read access to authored policy documents.

## Troubleshooting

Use the same customer and conversation when resuming. A pending approval must be decided or closed before the next message. If cleanup is pending, inspect the remote session rather than treating local abort as a confirmed stop. `GET /api/c50/facts` and `GET /api/c50/code` describe supported capabilities. Reset affects only the local owner's fixture after cleanup.

## Limitations

The scripted adapter and evals are authored fixtures. A live agent must be explicitly configured and opted in; this lesson does not provision, bill or write externally on setup checks. The local reviewer identity is suitable for this loopback teaching range, not production authentication. A policy explanation or model summary cannot override the deterministic host gate.

## Challenge

Deny a refund and verify that the ledger, remaining balance and audit reflect the denial with no issued refund. Then try a foreign order and an amount above the remaining paid total.

## Run locally

```powershell
npm run test:capstone
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab50-browser-demonstration.mjs
```

Baseline and comparison
1. Select C-1 and inspect its orders, then ask for a partial damaged-item refund.
2. Inspect the pending immutable approval and deny it; verify no ledger entry appears.
3. Request another refund and approve it once; compare remaining cents and audit entries.
4. Switch to C-2 and try a foreign order or malicious note; the host gate must reject the effect.
5. Resume a conversation, inspect correlated event IDs, close it and run the four offline evals.

Student challenge
Deny a refund and verify that no refund is recorded.

Verification
At this parent checkpoint verify the new scaffolding compiles and prior lessons still work, then continue immediately to L50A. Full lesson registration, browser evidence and acceptance belong after L50B, not before the lettered implementation prompts. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** This is the whole-lab brief and compiling scaffold. Continue to L50A; complete the full lesson checks after L50B.


---

## L50A Implement the support desk domain and tools

Implement this detailed substep of Lab 50 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Apply the Managed platform constraints and dedicated host custom-tool boundary from this workbook. Preserve the exact domain rules below. Do not implement Agent SDK callbacks or local query options; verify every provider-specific operation against pinned official Managed types.

Complete the lesson 50 business model before connecting live chat. In server/capstone/store.ts define customers, orders, line items, refund ledger, tickets, conversations and audit entries. Use integer cents. Author two fictional customers, one with a broken item and one with unrelated private orders. Keep an in-memory constructor for tests and optional JSON persistence for the local exercise.

In tools.ts define closed schemas for reading an owned order, searching authored policy documents, creating a ticket and issuing a refund. The customer and trusted approver come from host context; they are never accepted as authority from model arguments. Validate order ownership, positive amount, remaining refundable amount and the support policy before any effect. Generate a stable idempotency key for a reviewed action.

Author policy files explaining damaged-item refunds, eligibility and escalation. The policy-expert subagent receives only read tools in that folder. A model may explain policy, but the deterministic host rejects an illegal refund even if the explanation sounds correct.

Create an approver interface invoked for the exact validated refund input. The host stores immutable action/amount/customer/order and expiry, emits a pending review, then executes only if the matching decision arrives. Denial, timeout and cancellation change no balance. Consuming an approval or repeating an idempotency key cannot create a second refund.

Expose state/reset/conversation APIs with customer ownership checks and a bounded audit view. Reset applies only to this local fixture and cannot touch students' repository files. Escape/redact notes and errors before sending them to the browser.

Test the actual tools through the actual typed custom handlers: positive refund, foreign order, excess amount, missing order, forged approver, duplicate approval, denied decision, repeated action and two-customer isolation. Assert ledger/balance/ticket effects, not tool response wording. Finish with a focused test:capstone script and include it in test:offline.

Apply the current detailed Lab 50 specification in L50 and its challenge when the older brief omits a boundary. Verify the modules implemented so far and preserve prior lessons; then continue to L50B. Full lesson UI acceptance and registration happen after L50B.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L50B Connect chat approvals and capstone evals

Implement this detailed substep of Lab 50 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create server/capstone/agent.ts around an injectable ManagedSessionPort and shared event consumer. Provide a stateful scripted adapter and a server-only official SDK adapter. Use a dedicated version-pinned desk agent with typed custom domain tools, no unnecessary built-in tools/MCP/skills, a budget at creation and bounded messages/tools/deadline. Provision only through an explicit setup command. Role-specific policy expertise can be native Managed subagents where supported or separate host-orchestrated sessions, with their identity and usage shown separately.

Normalize create response, event previews, authoritative messages, custom calls/results, approval state, usage and idle/error into the desk view model. Validate final summaries through a closed report custom tool or host JSON parser. Correlate remote session, thread and sevt_ IDs and keep raw redacted events inspectable. Do not treat local abort as proof remote work stopped.

Store customer-owned conversation records pointing to remote sesn_ IDs. Continue by opening the stream, hydrating paginated history with deduplication and sending user.message to the same idle non-archived session. Do not archive at every turn; implement bounded retention and an explicit close that interrupts if necessary, confirms idle and archives. Refuse cross-customer access before provider calls.

Show customer selection, chat, retained conversation, orders/refunds/tickets, audit and approval cards. Learn/Source preserves exercise state. Leaving the lesson releases pending reviews and stops active work according to the documented retention policy. Trusted reviewer identity, immutable amount/action and single-use decision authorize the handler; the assistant sentence never determines the ledger.

Create deterministic evals for approved damage refund, policy rejection, foreign customer and malicious order note. Run them through actual handlers/consumer, with holdouts outside agent context. Optional live evals are separate commands with disclosed limits. Test missing idle/result, handler/schema failures, resume, duplicate events, child text, denial and disconnect. Demonstrate scripted success and rejection, then implement Lab 51 against these modules.

Apply the current detailed Lab 50 specification in L50 and its challenge when the older brief omits a boundary. This is the final substep: finish the real UI/router registration and guide, run the complete lesson baseline/comparison/error cases and focused tests, verify source links and typecheck/build, then continue to the next numbered lesson. Never register an unfinished placeholder.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L51 Testing the Managed host offline

Verify the real Acme Support Desk host logic and event consumption without a provider request.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 51 Testing the Managed host offline after the preceding lesson. Goal: Verify the real Acme Support Desk host logic and event consumption without a provider request.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c51. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept51UnitTesting.tsx
- server/concepts/51-unit-testing.ts
- shared/lab51-unit-testing.ts
- server/unit-testing/lab51.ts
- server/capstone/store.ts
- server/capstone/tools.ts
- server/capstone/desk.ts
- server/lib/session-events.ts
- Tab51-unit-testing.md

Implementation brief
Goal: Verify application behavior without provider requests.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept51UnitTesting.tsx; server/concepts/51-unit-testing.ts; Tab51-unit-testing.md

Build: Test actual Lab 50 stores, typed custom handlers, approval gates, event consumer and ownership through injected Managed ports. Local MCP bridge tests may use linked InMemoryTransport, but native custom tools need no MCP wrapper. Use the same modules as the browser exercise and show assertions/effect evidence. No SDK hooks or local Claude process is involved.

Experiment: Malformed/foreign orders, denial, cancellation, missing terminal state, child-thread events, duplicate previews/persisted events, invalid report, retained session and a deliberate refund-policy mutation with virtual time.

Verify: No .env loading, provisioning or model calls. Effects and correlation are asserted, and the policy mutation must fail a relevant test.

Reference route inventory under /api/c51: GET /facts; POST /run; POST /replay; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Complete Lab 50. This lesson imports its actual store, typed custom-tool handlers, retained session desk and the shared event consumer. It needs no API key and does not load `.env`, provision a resource or call Anthropic. The authored SDK-shaped port supplies deterministic events.

## Controls

Choose **Run complete offline suite** to inspect assertions for malformed and foreign orders, review denial, cancellation, missing terminal state, child-thread metadata, duplicate events, invalid JSON report, retained session and a virtual-time policy mutation. Select one scenario to narrow the evidence. **Replay recorded events** is available for the three event-consumer cases.

## Evidence to inspect

The host rejects malformed custom-tool input before changing the approval or refund ledger. Customer identity comes from the host context, so a foreign order cannot cross the boundary. Denial and cancellation leave no refund. A missing idle event is incomplete even if a stream ends. A repeated persisted event cannot create a second authoritative message, while a preview is replaced by its final message. A child-thread identifier stays evidence, not a new owner or independent refund authority. The closed report schema rejects extra fields. Two chat turns retain one session and reject a foreign owner.

The mutation case advances the store's virtual clock to 31 days after purchase. The real 30-day rule rejects a refund. A deliberate 60-day policy variant would allow it, so its boundary assertion fails **as expected**. The overall suite passes only when that failure is detected and the unmodified handler still denies the request. This is a local mutation demonstration, not a change to the deployed policy.

## Inspect the code

`server/unit-testing/lab51.ts` runs assertions against production modules. `server/capstone/tools.ts` holds the pure eligibility predicate and closed handlers; `server/capstone/store.ts` owns ledger effects. `server/lib/session-events.ts` consumes the same event shapes used by the other lessons. `/api/c51/facts` is host-only metadata; `/api/c51/run` and `/api/c51/replay` are offline; `/api/c51/code` lists public teaching source.

## Challenge

Change the virtual policy window from 30 to 60 days. Predict the failed assertion for the 31-day-old order, then restore the 30-day rule. Compare the mutated predicate's answer with the actual handler's ledger evidence.

## Troubleshooting

If a scenario fails unexpectedly, inspect the observed value and effect evidence before rerunning it. The duplicate-event replay should produce one authoritative message and one ignored duplicate. The missing-terminal replay should remain incomplete. If the local backend is unavailable, start `npm run dev` and retry the offline exercise.

## Run locally

```powershell
npm run test:offline
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab51-browser-demonstration.mjs
```

## Limitations

These assertions verify the host and injected event handling, not model quality. The exercise does not use Agent SDK hooks or a local Claude process. Its synthetic thread and event IDs are authored examples; no billed Managed session is opened.

Baseline and comparison
1. Run the full offline suite and inspect the handler and ledger assertions.
2. Run malformed input, foreign-order, denial and cancellation cases individually.
3. Replay child-thread, duplicate and missing-terminal events through the shared consumer.
4. Run the virtual-time policy mutation and identify the expected failed assertion.

Student challenge
Enable the 60-day mutation and explain why the 30-day policy assertion fails for the same order and clock.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab51-unit-testing.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L52 Evals judges and regression baselines

Compare deterministic host safety checks with optional judge output and gate candidate promotion against a recorded baseline.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 52 Evals judges and regression baselines after the preceding lesson. Goal: Compare deterministic host safety checks with optional judge output and gate candidate promotion against a recorded baseline.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c52. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept52Evals.tsx
- server/concepts/52-evals.ts
- shared/lab52-evals.ts
- server/evals/lab52.ts
- server/capstone/tools.ts
- server/capstone/store.ts
- Tab52-evals.md

Implementation brief
Goal: Compare evaluators and regression baselines across trials.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept52Evals.tsx; server/concepts/52-evals.ts; Tab52-evals.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Build an eval dataset, deterministic business checks and an optional structured judge. Store baseline and candidate reports with official SDK/API beta/model/agent-version identity, trial count, latency, token usage, cost and failures.

Experiment: Include correct refund handling, hallucinated refund, over-refund and injection. Compare regressions by case and aggregate; exercise judge disagreement and invalid judge JSON.

Verify: Offline fixtures verify the evaluator, not model quality. Holdout cases stay outside agent context. A missing baseline or failed safety check blocks promotion.

Reference route inventory under /api/c52: GET /facts; GET /baseline; POST /demo; POST /calibrate; POST /run; POST /promote; POST /pairwise; GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Complete Labs 50 and 51. This exercise calls the same closed `propose_refund` host handler and ledger used by the support desk. The authored trials need no API key. No cloud session, provisioning, model call or external write starts from setup or offline controls.

## Controls

Run **Baseline** first, choosing one to three trials. Then run **Regression** and **Compare with baseline** to see case-level and aggregate differences. Try the optional judge calibration buttons: agreement, disagreement and invalid JSON. Run **Recovered** with the same trial count; if all host, safety and baseline checks pass, **Promote local result** records only an owner-scoped local pointer. It does not change any remote agent or deployment.

## Evidence to inspect

The holdout dataset includes a correct damaged-item refund, a false refund claim, an over-refund and an injected foreign-order request. Expected effects stay in the evaluator, outside the authored agent-facing message strings. Each trial uses a fresh store and the real typed custom-tool handler. An accepted proposal requires the host's trusted approval before the refund ledger changes. The regression variant falsely claims refunds on rejected cases; the ledger stays empty and both report correctness and safety fail. The optional structured judge can disagree with the deterministic host or return invalid JSON; neither case authorizes promotion.

Reports name SDK 0.133.0 and the beta Managed Agents API as the target interface, but model, agent version, latency, tokens and cost remain **unknown** for authored offline fixtures. Trial count and failure count are local facts. A live run would need a separately configured pinned agent with exactly the Lab 50 Zod-derived custom tools and no built-in tools, MCP or skills; this lesson's offline routes do not create one. Stable refund action keys remain separate from `sevt_` correlation IDs.

## Troubleshooting

If pairwise comparison is disabled, first run a baseline and then a candidate under the same owner. A regression or judge failure should block the promote button. If the baseline is replaced, earlier candidate reports are stale for promotion. Inspect the host ledger count and `toolRejected` before interpreting a candidate's prose claim.

## Limitations

Offline fixtures verify evaluator logic and host gates, not Claude model quality. The authored trial count is real for this local run; latency, token usage and cost are not measured. The in-memory baseline and promotion pointer are local teaching state, not a CI deployment gate or remote rollout.

## Challenge

Change the regression candidate's claim for one rejected case. Predict how the per-case result, aggregate pass rate, safety flag and promotion decision should change. Explain any disagreement with the optional judge using the host effect evidence.

## Run locally

```powershell
node --import tsx --test tests/lab52-evals.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab52-browser-demonstration.mjs
```

Baseline and comparison
1. Run the baseline for two trials and inspect ledger-backed holdout results.
2. Run the regression candidate; compare false refund claims against host effects and the baseline.
3. Calibrate an agreeing, disagreeing and invalid JSON judge without overriding host safety.
4. Run the recovered candidate, compare the pair, and promote its local result only if all gates pass.

Student challenge
Change a candidate claim and decide whether the regression and safety gates should permit local promotion.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab52-evals.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L53 Debugging session and host traces

Reproduce a session or host failure and identify its first useful redacted event, decision or effect.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 53 Debugging session and host traces after the preceding lesson. Goal: Reproduce a session or host failure and identify its first useful redacted event, decision or effect.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c53. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept53Debugging.tsx
- server/concepts/53-debugging.ts
- shared/lab53-debugging.ts
- server/debugging/lab53.ts
- server/lib/session-events.ts
- server/capstone/tools.ts
- server/capstone/store.ts
- Tab53-debugging.md

Implementation brief
Goal: Reproduce a failure and locate the first useful event or effect.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept53Debugging.tsx; server/concepts/53-debugging.ts; Tab53-debugging.md

Build: Record redacted Managed events, resolved configuration, host handler decisions and effect ledger with local run, remote session, thread and sevt_ identifiers. Replay through the actual consumer and explain causes from recorded evidence. No SDK hook trace or child process initialization is assumed.

Experiment: Malformed report, denied tool, missing idle event, local turn limit, stream EOF and cleanup timeout; show what distinguishes each.

Verify: Bound logs, use fictional data, flag history gaps and compare replayed effects/state. An EOF does not establish remote completion or failure.

Reference route inventory under /api/c53: GET /facts; GET /code; POST /run; GET /runs/:id

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Complete the Acme Support Desk and offline testing lessons. This lab uses fictional event IDs and sessions; no API key, `.env` loading, provisioning or provider request is needed. The shared event consumer and the actual support-desk custom-tool handler are imported directly.

## Controls

Choose a scenario and press **Run trace**. **Inspect saved run** retrieves the same owner-scoped record without reapplying host effects. Start with the valid control, then compare malformed report, denied tool, missing idle event, local turn limit, stream EOF and cleanup timeout.

## Evidence to inspect

Each result records a local run ID, fictional remote session ID, optional thread ID, `sevt_` event IDs, resolved fixture tool list, redacted event summaries, host decisions and ledger effects. The orange marker identifies the first useful evidence for the cause. The replay passes the recorded events through `createEventConsumer`, then compares its lifecycle verdict with the original and checks the recorded effect count against the host ledger. The replay does not re-execute a refund.

A final-looking `agent.message` followed by EOF remains incomplete without `session.status_idle`. A completed turn with malformed final JSON still fails the application report schema. A denied custom tool is a host decision, while `requires_action` is a paused session state. A local turn limit and cleanup timeout are host-side boundaries. The latter leaves archival pending and remote stop unconfirmed. The trace flags history gaps instead of filling them with inferred events.

## Troubleshooting

If a result appears inconsistent, compare `firstUsefulSequence` to the chronological trace, then inspect the host decision and ledger count. Distinguish the raw event outcome from the final report verdict. An event stream closing does not establish remote completion or failure. A saved run belongs to its local experiment owner and cannot be read by another owner.

## Limitations

The traces are bounded authored fixtures with whitelisted, redacted summaries and at most 40 entries. Agent version and provider usage are unknown offline. No SDK hook trace or child-process initialization is assumed. A local replay proves only that the consumer reproduces its recorded event interpretation; it cannot resolve missing remote history or a cleanup timeout.

## Challenge

Change one variable in a failing trace. Explain whether the change addresses the first evidenced cause. For example, add a confirmed idle event to the missing-idle scenario, then compare it with the malformed-report case where idle already exists but validation fails.

## Run locally

```powershell
node --import tsx --test tests/lab53-debugging.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab53-browser-demonstration.mjs
```

Baseline and comparison
1. Run the valid control and compare the host refund ledger with replayed event outcome.
2. Inspect malformed report and denied tool traces; identify the first host gate that explains each.
3. Run missing idle, stream EOF and local turn limit; separate incomplete local evidence from remote state.
4. Run cleanup timeout and inspect why archival and remote stop remain unconfirmed.

Student challenge
Change one trace variable and explain whether it fixes the first evidenced cause without inventing a remote outcome.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab53-debugging.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L54 Designing tools the model uses well

Compare vague and explicit Managed custom-tool contracts while keeping refund policy and idempotency in the host handler.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 54 Designing tools the model uses well after the preceding lesson. Goal: Compare vague and explicit Managed custom-tool contracts while keeping refund policy and idempotency in the host handler.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c54. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept54ToolDesign.tsx
- server/concepts/54-tool-design.ts
- shared/lab54-tool-design.ts
- server/tool-design/lab54.ts
- server/capstone/tools.ts
- server/capstone/store.ts
- Tab54-tool-design.md

Implementation brief
Goal: Design tool schemas and recovery messages for reliable use.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept54ToolDesign.tsx; server/concepts/54-tool-design.ts; Tab54-tool-design.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Create a tool-design workshop using the same fixture business operation with vague versus explicit names/descriptions, tight schemas and actionable errors. Inspect annotations and metadata; compare ambiguity, units and defaults.

Experiment: Demonstrate invalid input, domain rejection, missing prerequisites and a correct idempotent action. Include a contract linter and scripted choice/recovery traces.

Verify: Handlers enforce policy independently of descriptions. Test integer money units, no effect on error and stable idempotency. Live comparison measures actual choices, not synthetic scores.

Reference route inventory under /api/c54: GET /facts; GET /code; POST /call; POST /run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Complete the Acme Support Desk custom-tool and approval labs. This workshop calls the actual `propose_refund` host handler with fictional data. No API key, Managed session, billing or external write is needed. The installed `@anthropic-ai/sdk` 0.133.0 custom-tool type has a name, description and input schema; risk/effect annotations shown here are host metadata, not unsupported fields sent to the API.

## Controls

Switch between the vague and explicit contract and inspect the generated JSON Schema. Select invalid input, domain rejection, missing prerequisite or correct idempotent action and press **Call scripted tool**. **Run all four cases** displays the authored choice/recovery traces together. The vague variant needs a recovery step that names integer USD cents and the trusted review boundary; the explicit variant expresses those in its contract.

## Evidence to inspect

Both schemas come from Zod and are closed. The workshop linter checks the name/description, integer-cent unit, order ID pattern and closed object. The handler revalidates every `agent.custom_tool_use` input and returns one `user.custom_tool_result` keyed by its `sevt_` ID. The server's selected customer and conversation are not model arguments. Errors provide a safe recovery direction and leave the refund ledger unchanged.

In the correct action, the first proposal creates a pending approval. A repeated proposal returns the same stable business action key and pending approval, despite a different `sevt_` event ID. Trusted host approval issues one refund. A later replay is rejected because the action was already applied. The sandbox cannot change this local ledger through tool wording alone. Unused built-in tools, MCP and skills are outside the authored toolset.

## Troubleshooting

If the vague `amount` field seems to mean dollars, inspect the rejected input and recovery text; the handler accepts only `amountCents` as a positive integer. An undamaged order fails domain policy even with a perfect schema. A missing owned conversation fails before approval. A descriptive tool is guidance for model choice, never an authorization to bypass the host gate.

## Limitations

The displayed choices and recoveries are scripted examples. The workshop gives no synthetic model success score. A live comparison would require actual, separately opted-in model runs and report observed choices and provider usage. The installed Managed custom-tool type has no native annotation property; the risk and effect notes belong to this host workshop.

## Challenge

Rename the vague `amount` field to `amountCents` and make its description explicit about USD cents, prerequisites and approval. Predict which linter findings disappear and verify that the host still denies an undamaged order or duplicate effect.

## Run locally

```powershell
node --import tsx --test tests/lab54-tool-design.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab54-browser-demonstration.mjs
```

Baseline and comparison
1. Inspect both tool names, descriptions, Zod-derived schemas and linter findings.
2. Run invalid input, domain rejection and missing prerequisite cases; check that no refund is issued.
3. Run the idempotent action and distinguish sevt_ correlation from a stable business action key.
4. Compare scripted choice and recovery traces without treating them as live model measurements.

Student challenge
Improve one vague field name or error message and predict how the linter and host effects should differ.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab54-tool-design.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L55 Official SDK and API upgrades

Rehearse SDK and Managed API compatibility gates, canary, promotion and rollback without changing the locked teaching app.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 55 Official SDK and API upgrades after the preceding lesson. Goal: Rehearse SDK and Managed API compatibility gates, canary, promotion and rollback without changing the locked teaching app.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c55. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept55UpgradingSdk.tsx
- server/concepts/55-upgrading-sdk.ts
- shared/lab55-upgrading-sdk.ts
- server/upgrades/lab55.ts
- server/lib/session-events.ts
- Tab55-upgrading-sdk.md

Implementation brief
Goal: Rehearse promotion and rollback against Managed contracts.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept55UpgradingSdk.tsx; server/concepts/55-upgrading-sdk.ts; Tab55-upgrading-sdk.md

Build: Compare baseline/candidate official @anthropic-ai/sdk manifests, beta headers, session/thread event unions, configuration rules, permissions, usage and eval evidence. Keep baseline 0.133.0 locked; test candidates in isolated tooling without upgrading the teaching app. Record API compatibility separately from npm version and pinned agent/environment/skill versions.

Experiment: Compatible change, removed type, stream change, policy drift, missing usage, quality regression and missing evidence in a server-computed promote/canary/rollback state machine.

Verify: Client eligible:true grants nothing. No automatic npm upgrade/provisioning and no fixture claim that a real release passed. Rollback of host code does not rewind already-created remote sessions.

Reference route inventory under /api/c55: GET /facts; GET /code; POST /run; POST /transition

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

The teaching app keeps `@anthropic-ai/sdk` locked at 0.133.0 in `package.json` and the lockfile. This lesson reads the installed baseline manifest and uses authored candidate manifests for an offline rehearsal. It does not run npm install, provision a resource or contact Anthropic.

## Controls

Analyze each candidate fixture to inspect server-computed checks. A client-supplied `eligible: true` is intentionally ignored. The compatible fixture can enter an **authored canary**, then a simulated promotion and rollback. Removed event types, changed stream order, permission drift, missing usage, quality regression and missing evidence each block advancement at a different check.

## Evidence to inspect

The baseline records npm 0.133.0, the Managed beta header, required session and send-event unions, open-before-send ordering, pinned and restricted configuration, host-owned permissions, usage handling, eval results and separately named agent/environment/skill pins. Candidate npm version stays unknown because no candidate package is installed. API compatibility is reported independently of npm identity. A missing event type or changed stream sequence is incompatible; absent evidence remains unknown rather than passing.

The state machine advances only from candidate to authored canary to simulated promotion. It checks every gate on the server and records an explicit rollback. Canary evidence is an authored fixture, not an observed release trial. Rollback affects the hypothetical host version only; already-created remote sessions and their effects would still require reconciliation.

## Troubleshooting

If **Rehearse canary** is disabled, inspect the blocked check in the result. Promotion requires the compatible candidate and the preceding canary state; an arbitrary client eligibility flag cannot skip it. Missing usage and missing evidence are not equivalent to zero usage or success. No fixture result states that a real candidate SDK was installed or that a production release passed.

## Limitations

The candidate comparisons are deterministic offline fixtures. They do not verify a real new npm release, provider API availability or model quality. The pinned versions shown are fictional rehearsal labels, not actual provisioned resources. No automatic dependency upgrade, deployment, provider request or remote rollback occurs.

## Challenge

Remove `user.custom_tool_result` from a candidate event manifest. Identify the failed union check, decide whether the API contract is compatible, and explain why a larger npm version number would not permit promotion.

## Run locally

```powershell
node --import tsx --test tests/lab55-upgrading-sdk.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab55-browser-demonstration.mjs
```

Baseline and comparison
1. Inspect the installed 0.133.0 baseline and separate npm, API and pinned resource identities.
2. Analyze each candidate fixture and identify which server check blocks it.
3. Run the compatible fixture through authored canary, promotion and host-code rollback.
4. Observe that a client eligible hint grants nothing and rollback cannot rewind remote sessions.

Student challenge
Make one candidate fixture lose a required event type and explain why a version bump alone cannot authorize promotion.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab55-upgrading-sdk.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L56 Teams and evidence messages

Coordinate two application roles with checked evidence, stable envelopes and explicit completion gates.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 56 Teams and evidence messages after the preceding lesson. Goal: Coordinate two application roles with checked evidence, stable envelopes and explicit completion gates.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c56. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept56AgentTeams.tsx
- server/concepts/56-agent-teams.ts
- shared/lab56-agent-teams.ts
- server/teams/lab56.ts
- Tab56-agent-teams.md

Implementation brief
Goal: Assign ownership and exchange checked evidence.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept56AgentTeams.tsx; server/concepts/56-agent-teams.ts; Tab56-agent-teams.md

Build: Create an application team reducer for task ownership/dependencies, claims, stable message envelopes, delivery, acknowledgment, completion and shutdown. Use researcher/reviewer and sum 12 + 18 + 7 = 37. Optional native delegation uses Managed thread_message_sent/received and thread IDs; host-driven workers can use bounded send_message/read_messages custom tools on separate sessions. Do not assume Claude Code SendMessage or private mailbox files.

Experiment: Blocked review, competing claim, busy shutdown, duplicate envelope, acknowledgment before delivery, rejected 30, verified 37 and clean shutdown.

Verify: Delivery is not completion evidence. Test reducer idempotency, known identities and bounded replay. Native children share a sandbox; role authorization remains enforced in handlers.

Reference route inventory under /api/c56: GET /facts; GET /code; POST /replay; POST /live

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local learning platform. This lab is a deterministic application-owned team reducer. It makes no provider request and needs no API key. Native Managed delegation would require a separately verified live configuration.

## Controls

Choose a scenario and select **Replay team actions**. Each action records whether the reducer accepted it and its effect. **Check live delegation** shows the unsupported-mode response; it does not start a billed session. The closed scenario set covers blocked review, competing claims, busy shutdown, duplicate envelopes, acknowledgment before delivery, rejected 30, verified 37 and clean shutdown.

## Evidence to inspect

The researcher owns the research task and the reviewer owns review. Review starts blocked. The researcher must claim work, complete the checked sum 12 + 18 + 7 = 37, and send an envelope with a stable ID. The reviewer can act only after the envelope is delivered and acknowledged. A duplicate identical envelope is idempotent; a conflicting duplicate is rejected. Delivery does not imply acknowledgment or completion. Clean shutdown requires both tasks done and all messages acknowledged.

The timeline shows accepted/rejected actions, task states, envelope states and the host-verified answer. `providerCalls: 0` marks authored offline evidence. The reducer bounds each replay to 24 actions and 8 envelopes. It recognizes only the researcher and reviewer identities. Role checks are in the reducer rather than depending on a model instruction.

## Troubleshooting

If review is blocked, check whether the researcher completed work and whether its evidence envelope reached acknowledgment. A claimed task is still busy; shutdown rejects it. A response of 422 from the live route means delegation has not been configured and no live prompt was sent.

## Limitations

Offline actions are application fixtures, not observations of model delegation. Native Managed delegation would need checked `thread_message_sent` and `thread_message_received` events with thread IDs. A host-driven variant could use bounded `send_message` and `read_messages` custom tools in separate sessions. Neither route assumes Claude Code `SendMessage` or private mailbox files. Native children may share a sandbox, so role authorization must remain in host handlers.

## Challenge

Replay acknowledgment before delivery. Identify the rejected action and explain why the review dependency remains blocked. Then replay verified 37 and clean shutdown and compare their final states.

## Run locally

```powershell
node --import tsx --test tests/lab56-agent-teams.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab56-browser-demonstration.mjs
```

Baseline and comparison
1. Replay blocked review and competing claim to see task ownership and dependencies enforced.
2. Compare a queued envelope, delivery and acknowledgment; none alone completes the review.
3. Reject 30, verify 37 using host arithmetic, then perform a clean shutdown.
4. Inspect the optional live route and identify why native delegation is unavailable without checked setup.

Student challenge
Try to acknowledge evidence before delivery and explain which state transition must occur first.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab56-agent-teams.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L57 Workers in host Git worktrees

Rehearse isolated Git worktrees and host-verified, serialized integration of two worker edits.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 57 Workers in host Git worktrees after the preceding lesson. Goal: Rehearse isolated Git worktrees and host-verified, serialized integration of two worker edits.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c57. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept57ParallelWorktrees.tsx
- server/concepts/57-parallel-worktrees.ts
- shared/lab57-parallel-worktrees.ts
- server/worktrees/lab57.ts
- Tab57-parallel-worktrees.md

Implementation brief
Goal: Isolate fixture checkouts and integrate verified changes.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept57ParallelWorktrees.tsx; server/concepts/57-parallel-worktrees.ts; Tab57-parallel-worktrees.md

Build: Create a disposable Git repository with greeting/tax functions, base SHA and independent worker worktrees. Run separate Managed worker sessions with custom host read/write/edit/test tools bound to each worktree; disable remote built-in filesystem/bash so local files are the authoritative teaching tree. Cloud /workspace is not the Windows worktree. Start workers concurrently under a host cap; verify changed/untracked paths and behavioral tests before host commits.

Experiment: Serial cherry-pick and combined tests, competing greeting edits, failed worker and cancellation with retained evidence.

Verify: Failure blocks integration; abort conflicts and preserve branches/report. Host Git/ref operations are serialized and bounded. Worktrees are not OS or tenant isolation; test workers get no API key.

Reference route inventory under /api/c57: GET /code; POST /run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Git and Node.js must be available locally. The app creates disposable repositories under ignored `artifacts/lab57/runs/`. The offline exercise makes no Anthropic request and does not need an API key. A single server instance admits at most eight fixture runs to bound retained worktree data.

## Controls

Choose serial integration, competing greeting edits, failed worker or cancelled worker, then select **Run local worktrees**. Each run creates a new base repository with `greeting.js` and `tax.js`, two worker branches and two worktrees. The host applies fixed edits through allowlisted local file operations, verifies changed and untracked paths, runs behavioral tests, commits passing worker edits, and cherry-picks commits serially.

## Evidence to inspect

The result reports the base SHA, each worker branch, changed and untracked paths, test result, commit state, integration state and timeline. Serial integration must pass combined greeting and tax tests. In the competing edit case, both edits target `greeting.js`; the second cherry-pick conflicts. The host aborts that cherry-pick and keeps both worker branch refs and report. A failed worker or cancelled worker never reaches integration. Worker claims are shown separately from host evidence.

## Troubleshooting

If the route reports a fixture failure, check local Git availability. If capacity is reached, restart the lesson server after reviewing the retained runs. A conflict means no combined result passed, even though each worker's isolated test did. Failed and cancelled workers keep their branch and worktree for inspection but have no verified commit to integrate.

## Limitations

The workers are authored offline actions, not Managed sessions. A live extension would need separate Managed worker sessions with bounded host read/write/edit/test custom tools, disabled remote built-in filesystem/bash, cancellation and deadlines. Cloud `/workspace` is separate from these Windows worktrees. Git worktrees are not OS or tenant isolation; worker tests receive no Anthropic API key. The fixture runs workers sequentially and caps them at two, so it does not measure parallel model execution.

## Challenge

Compare the competing edit report with serial integration. Explain which SHA and path evidence proves isolation, why the host aborts the conflict, and why a successful isolated worker test does not prove combined correctness.

## Run locally

```powershell
node --import tsx --test tests/lab57-parallel-worktrees.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab57-browser-demonstration.mjs
```

Baseline and comparison
1. Run the serial fixture and inspect base SHA, worker branches, allowed paths and behavioral tests.
2. Compare a competing greeting edit and confirm conflict abort preserves branch refs.
3. Run failed-worker and cancelled-worker fixtures; neither may integrate.
4. Distinguish local authored worker actions from Managed sessions and cloud /workspace.

Student challenge
Explain why a worker claim cannot substitute for host path checks, tests or serialized cherry-pick.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab57-parallel-worktrees.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L58 Tool catalogs and bounded discovery

Search a 64-tool application catalog with a bounded host scorer and dispatch only through a checked schema and host context.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 58 Tool catalogs and bounded discovery after the preceding lesson. Goal: Search a 64-tool application catalog with a bounded host scorer and dispatch only through a checked schema and host context.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c58. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept58ToolSearch.tsx
- server/concepts/58-tool-search.ts
- shared/lab58-tool-search.ts
- server/tool-search/lab58.ts
- Tab58-tool-search.md

Implementation brief
Goal: Find relevant definitions while preserving handler policy.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept58ToolSearch.tsx; server/concepts/58-tool-search.ts; Tab58-tool-search.md

Build: Author 64 tools across eight domains including billing_refund_invoice for INV-2042. Keep the keyword scorer (+3 name, +2 hint, +1 description) as an explicit host simulator. Expose search_catalog plus a fixed-schema invoke_catalog_tool dispatcher; the dispatcher validates the chosen tool's closed schema and trusted context before execution. Do not pretend returned definitions register new native custom tools. Native ToolSearch, searchHint, alwaysLoad and false/true/auto:N SDK settings are unsupported unless an exact Managed capability is later documented and tested.

Experiment: Good versus vague metadata, narrow query, wrong tool, unauthorized refund and bounded result-size/context estimates. Optional live measures actual search/dispatch calls, not Claude's internal ranking.

Verify: Catalog prose is untrusted, descriptions grant no authority and init names prove no loaded context. Readiness checks launch no billed work. Dynamic idle tool updates, if used, have a separate validated adapter.

Reference route inventory under /api/c58: GET /facts; GET /code; POST /search; POST /plan; POST /measure; POST /run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local learning platform. This lab uses a deterministic host catalog and makes no Anthropic request. No API key, provisioning or live session is needed.

## Controls

Search the 64 definitions across eight domains. Compare good and vague metadata. The host simulator scores each query term with +3 for a name match, +2 for a hint match and +1 for a description match; it returns at most five definitions. **Try unauthorized refund** and **Run authorized fixture** pass a fixed `billing_refund_invoice` call for `INV-2042` to a host dispatcher.

## Evidence to inspect

`POST /plan` returns names, a rough initial token estimate and zero loaded definitions. `POST /search` returns scored definitions and a rough returned-context estimate; neither result registers a native tool. `POST /measure` compares good and vague metadata for the same query. The fixed dispatcher validates the selected tool's closed input schema and trusted host context. It records an authorized offline refund at most once for an owner and invoice/amount key. Unauthorized, wrong-tool and malformed input cause no refund effect. Catalog prose is untrusted data and cannot authorize a handler.

## Troubleshooting

If the desired tool is missing, narrow the query to its domain and action, such as `billing refund invoice`. A zero or low score describes this host scorer, not Claude's internal ranking. A refund denial comes from host context or schema validation, not from the tool description. `GET /facts` reports unsupported native ToolSearch and `searchHint`, `alwaysLoad`, `false`, `true` and `auto:N` settings because no exact Managed capability is configured here.

## Limitations

The catalog and scorer are authored fixtures. The token counts are JSON-length approximations, not actual model context or billing. Optional live measurement would have to count observed search and dispatch calls; this lesson does not infer Claude's internal ranking. Dynamic idle tool updates need a separate validated adapter if ever added.

## Challenge

Change the refund tool's description to claim that no approval is needed. Then run the unauthorized fixture and explain why the host still refuses the effect.

## Run locally

```powershell
node --import tsx --test tests/lab58-tool-search.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab58-browser-demonstration.mjs
```

Baseline and comparison
1. Inspect initial names and confirm no definitions are reported as loaded.
2. Compare good and vague metadata for the INV-2042 refund query.
3. Inspect the five-result bound and estimated returned context size.
4. Try a wrong tool and unauthorized refund, then run the authorized offline fixture.

Student challenge
Rewrite a catalog description to promise authority and explain why the fixed dispatcher still rejects an unauthorized refund.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab58-tool-search.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L59 Routing with verified outcomes

Compare seven routing strategies on 13 tasks using independent answer keys and full attempt accounting.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 59 Routing with verified outcomes after the preceding lesson. Goal: Compare seven routing strategies on 13 tasks using independent answer keys and full attempt accounting.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c59. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept59ModelRouting.tsx
- server/concepts/59-model-routing.ts
- shared/lab59-model-routing.ts
- server/routing/lab59.ts
- server/routing/lab59-keys.ts
- Tab59-model-routing.md

Implementation brief
Goal: Route tasks by observed correctness, usage and latency.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept59ModelRouting.tsx; server/concepts/59-model-routing.ts; Tab59-model-routing.md

Build: Author 13 checkable light/standard/deep tasks and independent answer keys. Implement fixed model, supported effort, rule router, classifier, cascade and draft/review strategies using explicit Managed agent/session configurations. Validate answer/confidence through a custom report tool or host JSON parsing. Model switching creates separately identified sessions; no query setModel or inherited Claude Code model settings.

Experiment: Offline routing with labeled assumed token figures; optional live correctness, cost per correct, median time and spend including classifier/reviewer sessions.

Verify: Confidence is not ground truth. Account for all attempts and uncertain sends; no historical prices/availability guarantees. Bound total live spending and stop before admitting another call when exhausted.

Reference route inventory under /api/c59: GET /facts; GET /code; GET /plan; POST /run; POST /delegate; GET /models; POST /resolution

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local learning platform. This lesson is a deterministic offline routing fixture with 13 authored tasks and separate application answer keys. It needs no API key and makes no provider request. The model names and effort settings are illustrative local configurations, not a guarantee of current account availability.

## Controls

Choose fixed light, standard or deep, rule, classifier, cascade or draft/review. Set an assumed spend-unit budget and run the fixture. `GET /plan` lists the task prompts without their answers; `GET /models` lists the illustrative model/effort pairs. `POST /delegate` rehearses one task, while `POST /resolution` validates closed JSON `{answer,confidence}` and checks the independent answer key.

## Evidence to inspect

Each attempt has a separate hypothetical session ID, tier, model, effort, role, authored token/spend/time figures, answer, confidence and host verification. Classifier and reviewer attempts count toward spend and time. The final result reports correct tasks, sessions, cost per correct, median task time and whether the budget stopped admission before another call. A wrong answer can have 0.94 confidence; only the host key establishes correctness. A malformed or extra-field report fails closed validation.

## Troubleshooting

If fewer than 13 tasks appear, the budget stopped before admitting another assumed session. Compare attempted and total tasks and include incomplete cascades when assessing cost. A session ID here is an offline trace label, not proof of a remote session. There is no query `setModel` switch; a real model change would create another Managed session with its own identity and usage.

## Limitations

Token figures, latency and spend units are authored assumptions, not measured usage or historical prices. Availability may change. The fixture has no uncertain sends; a live adapter would need to account for those and stop admission under a total spend cap before each new call. No live sessions, provisioning or billed requests occur in this lesson.

## Challenge

Run fixed light on a deep task and find its high-confidence wrong answer. Compare the host answer-key verdict with the confidence and explain which field should drive routing evaluation.

## Run locally

```powershell
node --import tsx --test tests/lab59-model-routing.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab59-browser-demonstration.mjs
```

Baseline and comparison
1. Inspect the 13 tasks, illustrative model/effort configurations and independent key boundary.
2. Run fixed tiers, rule routing, classifier, cascade and draft/review with the same budget.
3. Compare verified correctness, assumed spend per correct, median time and all session attempts.
4. Lower the budget and verify admission stops before another assumed session.

Student challenge
Find a high-confidence wrong answer and explain why confidence cannot replace the independent host key.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab59-model-routing.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L60 Durable long running agents

Recover a fictional refund batch from atomic host journals and a stable idempotent ledger.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 60 Durable long running agents after the preceding lesson. Goal: Recover a fictional refund batch from atomic host journals and a stable idempotent ledger.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c60. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept60DurableAgents.tsx
- server/concepts/60-durable-agents.ts
- shared/lab60-durable-agents.ts
- server/durable/lab60.ts
- Tab60-durable-agents.md

Implementation brief
Goal: Resume bounded agent work using journals and idempotency.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept60DurableAgents.tsx; server/concepts/60-durable-agents.ts; Tab60-durable-agents.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Build an eight-item fictional refund batch with a 30-day, 200 EUR, unused-item policy. Add atomic journal writes, stable effect keys, a ledger, lease/heartbeat and a bounded supervisor that chooses resume/retry/fresh/done/fail.

Experiment: Inject a crash after effect 3 but before journal write. Compare naive restart, journal-only and journal plus idempotency; show duplicates and suppressed keys. Include lease loss and no-progress stop.

Verify: No actual payments or email. Test one applied effect per key and recovery without repeating completed work. A transcript alone is not durable business state.

Reference route inventory under /api/c60: GET /facts; GET /code; GET /simulate; GET /policy; GET /jobs; POST /reset; POST /run; POST /recover

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local learning platform. This lesson writes fictional jobs under ignored `artifacts/lab60/jobs/`. No payment, email, provider request or API key is involved. Reset clears only jobs owned by the current browser's experiment owner.

## Controls

Start a crash-after-third, lease-loss or no-progress scenario. For a crash, choose naive restart, journal-only or journal plus idempotency and recover. Start a fresh job for each comparison. `GET /policy` shows all eight items and the 30-day, 200 EUR, unused-item rule. `GET /simulate` previews expected duplicates without creating a job. `GET /jobs` is owner-scoped.

## Evidence to inspect

The host writes `journal.json` and `ledger.json` atomically through temporary files and rename. After the third eligible effect, the crash occurs before its journal update: three effects exist, but two keys are journaled. Naive restart repeats all three effects, journal-only repeats effect 3, and journal plus stable effect-key idempotency suppresses it. An eligible item may be processed once per job key. The final ledger has five unique eligible effects; three other items fail age, amount or unused policy.

The application defines dedicated Zod-derived closed custom-tool schemas. A Managed `agent.custom_tool_use` would be answered by `user.custom_tool_result` with the original `sevt_` ID; the stable business effect key is separate. Host policy, lease and ledger validation govern effects. The offline fixture does not create a Managed session or assume cloud `/workspace` can read local files. Built-in tools, MCP and skills are not available as bypasses in this exercise.

## Troubleshooting

A lost lease and three no-progress checks cause the supervisor to fail rather than retry indefinitely. A terminal job cannot be recovered again. A wrong owner, malformed job ID, invalid `sevt_` ID or invented tool field is rejected. If eight jobs already exist for an owner, reset the local exercise after inspecting evidence.

## Limitations

This is an offline host simulation. It does not guarantee an atomic transaction across a real external payment provider and the journal. A real integration would need a durable external idempotency contract, lease coordination, reconciliation of uncertain sends and bounded retries. A transcript alone does not establish business state.

## Challenge

Compare a new crash job under all three strategies. Identify the effect missing from the journal, the duplicated keys in the first two recoveries and the suppressed key in the third.

## Run locally

```powershell
node --import tsx --test tests/lab60-durable-agents.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab60-browser-demonstration.mjs
```

Baseline and comparison
1. Read the eight-item 30-day, 200 EUR, unused-item policy and Zod-derived host tool definitions.
2. Crash after effect 3 and compare three ledger effects with only two journaled keys.
3. Recover separate jobs with naive, journal-only and journal-plus-idempotency strategies; compare duplicates.
4. Run lease-loss and no-progress cases and inspect bounded supervisor failure.

Student challenge
Explain why the third effect can exist in the ledger without a journal entry and which stable key suppresses it.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab60-durable-agents.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L61 Exposing your agent as an MCP server

Expose a typed fictional support/refund review through a bearer-protected local MCP transport.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 61 Exposing your agent as an MCP server after the preceding lesson. Goal: Expose a typed fictional support/refund review through a bearer-protected local MCP transport.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c61. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept61AgentMcpServer.tsx
- server/concepts/61-agent-as-mcp-server.ts
- shared/lab61-agent-mcp-server.ts
- server/mcp-agent/lab61.ts
- server/mcp-agent/lab61-client.ts
- Tab61-agent-as-mcp-server.md

Implementation brief
Goal: Expose an agent behind a typed MCP interface.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept61AgentMcpServer.tsx; server/concepts/61-agent-as-mcp-server.ts; Tab61-agent-as-mcp-server.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Expose a support/refund agent behind a Streamable HTTP MCP endpoint. Validate bearer authentication before session lookup; bound client sessions and keep tenant/customer identity host-owned. Separate transport request IDs, MCP session IDs and agent sessions.

Experiment: Use a local MCP client to list tools and call the agent; inspect progress, structured response and cancellation. Include unauthorized, foreign-session, concurrent and timed-out calls.

Verify: Token stays server-side and may be generated when absent. Close transports and pending requests. Do not expose general shell or caller-selected workspaces through the actual typed custom handlers.

Reference route inventory under /api/c61: Author the routes required by this lab and document them.

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local learning platform. This lesson implements a narrow, sessionful [MCP 2025-11-25 Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) subset for one fictional support/refund review tool. The browser's demo invokes a local MCP client on the server; its bearer token is never sent to the browser. `LAB61_MCP_TOKEN` can configure an external client's token on the server, otherwise an ephemeral token is generated. No Anthropic API key or Managed agent is required.

## Controls

Run normal, timeout, cancellation and concurrent-call scenarios. The local client initializes a transport, receives `Mcp-Session-Id`, lists tools, calls `review_support_refund`, then deletes the transport session. The normal call receives progress notifications and a host-validated structured report. The timeout, cancellation and concurrent scenarios show distinct incomplete or rejected results.

## Evidence to inspect

Transport JSON-RPC request IDs (101–104), MCP session ID and the fictional agent-session ID are distinct. Authentication runs before request decoding and session lookup. Session capacity is four; each session permits one active call. The bearer token maps to a host-owned tenant and customer, so a foreign token cannot use another tenant's session. The tool's Zod-derived input permits only the fixed order, a bounded question and a test scenario. It does not expose shell commands or caller-selected workspaces. The output contains both MCP text content and an independently validated `structuredContent` object. There is no actual refund effect.

## Troubleshooting

403 means bearer authentication failed. A 404 after authentication can mean an unknown, expired or foreign MCP session. 409 on a second active call means the session's concurrency bound held. A timed-out call returns an MCP tool error result; local cancellation stops the waiting client and closes the transport. Closing the server aborts pending requests and clears sessions.

## Limitations

This is an application-authored 2025-11-25 JSON/SSE transport subset, not a general MCP SDK server or a live Managed agent. The [2026-07-28 MCP revision](https://modelcontextprotocol.io/specification/draft/changelog) removes protocol-level sessions; this lesson deliberately demonstrates the earlier sessionful contract and does not claim modern stateless compatibility. The host-created structured report is offline fixture evidence, not an observed model answer. A production server would need full MCP conformance, token rotation, rate limits and deployment controls.

## Challenge

Use a second host-issued bearer identity with a session created under the first. Verify the foreign-session request fails after authentication, and explain why a transport request ID cannot authorize session access.

## Run locally

```powershell
node --import tsx --test tests/lab61-agent-mcp-server.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab61-browser-demonstration.mjs
```

Baseline and comparison
1. Run the local client and compare transport request, MCP session and agent session IDs.
2. Inspect one listed closed-schema tool, progress events and validated structured output.
3. Try timeout, cancellation and concurrent calls; then compare foreign-session and unauthorized tests.
4. Confirm the bearer token and tenant/customer mapping stay on the host.

Student challenge
Send a valid MCP session ID with a different bearer identity and explain why authentication precedes lookup.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab61-agent-mcp-server.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L62 Retrieval RAG through custom tools

Retrieve tenant-filtered current policy chunks and verify answer citations against the exact returned set.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 62 Retrieval RAG through custom tools after the preceding lesson. Goal: Retrieve tenant-filtered current policy chunks and verify answer citations against the exact returned set.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c62. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept62RetrievalRag.tsx
- server/concepts/62-retrieval-rag.ts
- shared/lab62-retrieval-rag.ts
- server/retrieval/lab62.ts
- Tab62-retrieval-rag.md

Implementation brief
Goal: Retrieve filtered evidence and validate cited answers.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept62RetrievalRag.tsx; server/concepts/62-retrieval-rag.ts; Tab62-retrieval-rag.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Create fictional current/archived/foreign-tenant return policies, shipping/security documents and an imported hostile note. Chunk by headings into stable IDs and implement keyword/BM25-style scoring after tenant/version filtering.

Experiment: Expose search, regression eval and optional agent query through a narrow knowledge tool. Require final answer plus evidence IDs/quotes validated against results returned during that run.

Verify: Current Acme policy is 30 days; archived 60 and foreign 90 are excluded. Include no-match and fabricated-citation cases. Label lexical retrieval honestly; no embeddings are implied.

Reference route inventory under /api/c62: GET /facts; GET /code; POST /search; GET /eval; POST /query

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local learning platform. This lesson uses fictional documents and deterministic lexical retrieval. It makes no Anthropic request, needs no API key and does not use embeddings.

## Controls

Enter a question and choose grounded, fabricated citation, wrong policy, no match or hostile note. Run the offline retrieval fixture. `POST /search` exposes a bounded search; `GET /eval` replays the five regressions; `POST /query` returns the tool event, filtered results, authored report and host verification.

## Evidence to inspect

Documents are split by heading into stable IDs such as `doc-acme-returns#eligibility`. The host filters tenant `acme` and current version before keyword/heading scoring. The current return policy says unused items may be returned within **30 days**. An archived Acme document says 60 days and a foreign-tenant document says 90 days; neither enters the scored set. A shipping document, security document and imported hostile note round out the corpus.

The Zod-derived `search_knowledge` custom-tool schema is closed. The offline handler returns `user.custom_tool_result` correlated by the original `sevt_` ID. Reports require an answer and evidence IDs/quotes. The host checks every ID against the exact results returned during that run and each quote against that chunk's text. A policy answer must match the 30-day host key and cite the current eligibility chunk. A fabricated ID, an archived answer, empty no-match evidence and an imported instruction claiming 365 days fail. The hostile note is data, not authority.

## Troubleshooting

A no-match query cannot support a cited answer. A quote with changed punctuation or words fails exact text validation. A search hit alone does not prove a report is true; inspect the final `verified` flag and reason. Caller-supplied tenant/version selectors and Agent SDK fields are outside the closed route schemas.

## Limitations

This is heading and keyword scoring, not semantic/vector retrieval. The answer drafts are authored fixtures and not observed model behavior. A live Managed extension would need an injected session, narrow toolset, bounded calls and host validation of its final JSON or tool report. No local files are assumed present in the cloud sandbox.

## Challenge

Try to cite the archived 60-day policy or the foreign 90-day policy. Explain why filtering before scoring means neither ID can validate against the run’s returned evidence.

## Run locally

```powershell
node --import tsx --test tests/lab62-retrieval-rag.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab62-browser-demonstration.mjs
```

Baseline and comparison
1. Search current Acme policy and compare stable heading IDs with archived and foreign documents.
2. Run a grounded 30-day answer and inspect quote and ID verification.
3. Run fabricated citation, archived 60-day answer, no-match and hostile-note scenarios.
4. Compare lexical scores with evidence validity; imported text cannot set host policy.

Student challenge
Cite an archived or foreign-tenant policy ID and explain why the run’s filtered result set rejects it.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab62-retrieval-rag.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L63 A safe database agent

Read tenant-scoped orders through fixed queries and let a separate human endpoint commit one checked cancellation.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 63 A safe database agent after the preceding lesson. Goal: Read tenant-scoped orders through fixed queries and let a separate human endpoint commit one checked cancellation.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c63. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept63SafeDatabaseAgent.tsx
- server/concepts/63-safe-database-agent.ts
- shared/lab63-safe-database-agent.ts
- server/database/lab63.ts
- Tab63-safe-database-agent.md

Implementation brief
Goal: Use narrow database tools with host-owned write checks.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept63SafeDatabaseAgent.tsx; server/concepts/63-safe-database-agent.ts; Tab63-safe-database-agent.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Use node:sqlite DatabaseSync for a disposable order database. Model tools read through fixed parameterized SELECT with tenant predicates and propose cancellation without committing. Store proposal, row version, five-minute expiry and audit.

Experiment: A separate human endpoint rejects or approves through BEGIN IMMEDIATE and a version/status/tenant-checked update, then restores query_only. Show pending, approved, rejected, stale and expired.

Verify: Test exactly one changed row, rollback on mismatch, replay rejection, other tenant isolation and blocked arbitrary SQL. Agent prose never counts as a database commit.

Reference route inventory under /api/c63: GET /facts; GET /code; POST /sessions; GET /sessions/:id; POST /sessions/:id/blocked-sql; POST /sessions/:id/query

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run Node.js with `node:sqlite` and the local learning platform. Each session creates a disposable SQLite database under ignored `artifacts/lab63/sessions/`. No external database, payment, provider request or API key is involved.

## Controls

Create a session, read the fixed order `O-A1`, and propose cancellation. A proposal records the order version, a stable business key, a five-minute expiry and an audit entry, but leaves the order open. **Approve as human** or **Reject as human** uses a separate endpoint. For stale and expired experiments, create a new session and proposal, then change the row version or advance the fixture clock before approval. **Try arbitrary SQL** sends text that the host deliberately never executes.

## Evidence to inspect

The host chooses tenant identity; the browser cannot supply a tenant. Fixed parameterized SELECT queries include the tenant predicate. Agent custom-tool schemas for read and propose are Zod-derived, closed and correlated to `user.custom_tool_result` by the `sevt_` event ID. A stable cancellation effect key is separate from the tool event. Both SQLite connections report `PRAGMA query_only=ON` outside host-controlled writes.

The human approval path uses `BEGIN IMMEDIATE` and a single `UPDATE` whose WHERE clause checks order ID, host tenant, open status and captured row version. Exactly one row must change or the transaction rolls back. Proposal status and audit are recorded. A replay of a decided proposal is rejected. Agent prose never counts as a database commit.

## Troubleshooting

If the order read fails, verify it belongs to the host tenant. If approval returns stale, compare the captured and current versions; the order remains open. Expired and rejected proposals change zero order rows. A second decision fails because the proposal is no longer pending. The blocked-SQL demonstration returns a refusal without passing the text to `DatabaseSync`.

## Limitations

The database is a fictional local fixture. It demonstrates narrow host tools and approval control, not a production multi-tenant database deployment. The live Managed custom-tool shape is modeled and tested, but no Managed session calls it. No general SQL execution, shell tool or caller-selected workspace is exposed.

## Challenge

Propose cancellation, change the row version, then approve. Identify the zero-row update, rollback, stale proposal and unchanged open order.

## Run locally

```powershell
node --import tsx --test tests/lab63-safe-database-agent.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab63-browser-demonstration.mjs
```

Baseline and comparison
1. Create a disposable SQLite session and inspect query-only state.
2. Read the host tenant order, propose cancellation and confirm no order row changed.
3. Approve or reject through the human endpoint and inspect changed-row and audit evidence.
4. Repeat with changed row version, expired proposal, foreign tenant and arbitrary SQL fixtures.

Student challenge
Change the order version after proposal and show why the checked UPDATE rolls back rather than cancelling it.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab63-safe-database-agent.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L64 Browser tools across host and cloud

Automate a fixture page through host-side Playwright MCP and verify the actual DOM and screenshot.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 64 Browser tools across host and cloud after the preceding lesson. Goal: Automate a fixture page through host-side Playwright MCP and verify the actual DOM and screenshot.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c64. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept64BrowserPlaywrightMcp.tsx
- server/concepts/64-browser-playwright-mcp.ts
- shared/lab64-browser-playwright-mcp.ts
- Tab64-browser-playwright-mcp.md

Implementation brief
Goal: Automate a fixture browser with independently checked effects.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept64BrowserPlaywrightMcp.tsx; server/concepts/64-browser-playwright-mcp.ts; Tab64-browser-playwright-mcp.md

Build: Author a local fixture web app and pinned @playwright/mcp server with a fresh profile. The host MCP client executes allowlisted browser operations behind closed Managed custom tools; the cloud session cannot reach the host localhost or spawn its stdio MCP server. A separately configured reachable remote browser/MCP deployment is optional and must be labeled accordingly. Enforce fixture origin and redirect rules in the bridge and browser setup, deny arbitrary downloads/files/external URLs and disable bypass tools.

Experiment: Inspect product, fill fictional form, assert DOM/screenshot evidence, blocked navigation and missing browser. Guided offline actions use real local browser code without model calls.

Verify: Validate proof from browser state, close contexts/processes on cancellation and bound all calls. Model click prose and cloud event fixtures are not browser evidence.

Reference route inventory under /api/c64: GET /facts; GET /code; GET /artifacts/:id/proof.png; POST /run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Install the pinned development dependencies and a local Chrome browser. The exercise starts an ephemeral loopback fixture and fresh isolated Playwright browser profile. It makes no Anthropic request and needs no API key.

## Controls

**Inspect product** navigates to the fixed fictional field kit page, requests an MCP snapshot and independently checks heading and price in the live DOM. **Fill fictional form** uses MCP fill and click operations, then checks the rendered confirmation. **Try blocked navigation** submits an external URL to the host bridge; the host refuses it before MCP dispatch. **Missing browser** shows the absence of proof without a model claim.

## Evidence to inspect

The host client connects to pinned `@playwright/mcp@0.0.83` through an in-memory MCP transport. Only navigate, snapshot, fill, click and screenshot are issued; unsafe evaluation, file upload, download and arbitrary URLs are not bridged. A Playwright route blocks requests beyond the fixture origin, including redirected requests. Each run gets a fresh host browser context and fixture server. Proof checks MCP snapshot text against independent live DOM reads and a host-captured screenshot. Model prose and cloud event fixtures are not browser proof.

The screenshot route requires the same local experiment owner as the run. The cloud Managed session cannot access host localhost or spawn this local MCP server; a reachable remote browser is a separate setup and is not configured here.

## Troubleshooting

If Chrome is missing, install a local Playwright-compatible browser. A blocked URL is an expected refusal, not a product failure. The browser and fixture server close after every run, including failure. The host limits concurrent runs and MCP calls.

## Limitations

This is a local, guided browser experiment. The attached host context requires `isolated: false` in the MCP connection; `isolated: true` asks the package to create an unsupported second context. The host already creates a fresh temporary profile for each run. It does not grant a cloud agent browser access. The fixture form records no real personal information.

## Challenge

Compare the MCP action trace with the host-verified DOM fields and screenshot. Explain why a successful tool result alone cannot prove the expected product state.

## Run locally

```powershell
node --import tsx --test tests/lab64-browser-playwright-mcp.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab64-browser-demonstration.mjs
```

Baseline and comparison
1. Inspect a fictional product through an isolated local browser and MCP snapshot.
2. Fill the fictional form using allowlisted MCP tools, then check its DOM confirmation.
3. Try blocked external navigation and a missing-browser scenario.
4. Compare tool events with independent browser proof and cloud reachability limits.

Student challenge
Explain why successful MCP tool prose without DOM and screenshot checks is insufficient browser proof.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab64-browser-playwright-mcp.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L65 Human approval over Slack Teams or email

Bind a fictional case archive to one trusted reviewer decision after an immutable proposal and local notification.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 65 Human approval over Slack Teams or email after the preceding lesson. Goal: Bind a fictional case archive to one trusted reviewer decision after an immutable proposal and local notification.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c65. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept65HumanApproval.tsx
- server/concepts/65-human-approval.ts
- shared/lab65-human-approval.ts
- Tab65-human-approval.md

Implementation brief
Goal: Bind human approval to a specific pending action.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept65HumanApproval.tsx; server/concepts/65-human-approval.ts; Tab65-human-approval.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Implement approval proposals with immutable action/arguments, trusted reviewer identity, expiry and single-use decision state. Default notification delivery is local. Build optional adapters for Slack, Teams Workflow webhook and Graph email with secrets on the server.

Experiment: Show preview → notify → inspect → approve/reject → execute/audit. Include duplicate click, tampered action, wrong reviewer and expired link. Require same-origin local decisions or a reviewed external capability flow.

Verify: No message is sent by default. Check execution happens once only after valid approval; agent text cannot authorize it. Provider credentials and public HTTPS origin are optional setup.

Reference route inventory under /api/c65: GET /facts; GET /code; GET /review; POST /run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local platform. The default exercise writes only a fictional SQLite effect record under ignored `artifacts/lab65/`; it sends no message and makes no Anthropic call. The app uses a local same-origin reviewer cookie for demonstration, not production identity verification.

## Controls

**Preview proposal** creates an immutable `archive_fictional_case` request for `CASE-2042` through a closed custom-tool input. It returns `user.custom_tool_result` correlated by the `sevt_` event ID, while the stable business key includes the host exercise owner and case ID. **Notify locally** records review availability without sending a message. Inspect the action, reason, reviewer and expiry before **Approve as reviewer** or **Reject as reviewer**. Try **Duplicate click**, **Tamper action**, **Wrong reviewer** and **Expire proposal** on fresh proposals.

## Evidence to inspect

The tool result creates a proposal only; it never executes the archive. Approval requires the local reviewer session, a pending notified proposal and an unexpired immutable action. The host inserts a unique business key in the SQLite effect ledger. A replay, second proposal for the same case, rejection, changed case ID, wrong reviewer or expired proposal cannot create another effect. Agent prose cannot authorize it. Unused built-in tools, MCP and skills are not included in this offline path.

`GET /api/c65/facts` exposes the closed tool definition; `GET /code` lists the teaching sources; `GET /review` establishes and shows a same-origin local reviewer session; `POST /run` accepts only the authored actions. The host validates the input and never accepts a caller-supplied reviewer identity or action change during decision.

## Optional notifications

The server contains gated notification adapters for [Slack incoming webhooks](https://api.slack.com/messaging/webhooks), [Teams Workflows webhooks](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook), and [Microsoft Graph `sendMail`](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0). They are disabled by default. Set `LAB65_EXTERNAL_NOTIFICATIONS=1` and the channel-specific server secrets only in an environment with a reviewed deployment. Notifications contain no approval link; the reviewer must use the local same-origin app. A public HTTPS origin and remote reviewer flow are future setup, not part of this exercise. Notification setup now shows missing or invalid server setting names without their values. Configure the chosen channel from .env.example, enable LAB65_EXTERNAL_NOTIFICATIONS=1 and restart the backend. Each explicit Send button stays disabled until its channel is configured and a proposal is pending. Run npm run notifications:ready for a local diagnostic with no provider calls. Provider transport acceptance does not approve the proposal. Never treat a webhook or delivered email as approval.

## Troubleshooting

If approval is rejected, notify locally first and inspect proposal state, reviewer cookie and expiry. Use a new proposal after a reject or expired fixture. A second proposal can be approved but the unique business key prevents a second effect. The local cookie is HttpOnly and SameSite Strict; it is bound to the exercise owner. Browser headers alone are not reviewer identity.

## Limitations

The local reviewer cookie proves possession of a same-origin fixture session, not enterprise authentication. Proposals live in memory for the process lifetime; only business effects persist in SQLite. External adapters were validated with offline stubs, not real deliveries; a production external review link needs a separate reviewed capability or SSO flow. No cloud Managed session or provider billing is started.

## Challenge

Approve a notified proposal, then approve a second proposal for the same fictional case. Explain why two `sevt_` IDs and two approval records still produce one business effect.

## Run locally

```powershell
node --import tsx --test tests/lab65-human-approval.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab65-browser-demonstration.mjs
```

Baseline and comparison
1. Preview a closed-schema custom-tool proposal; inspect its event ID and separate business key.
2. Notify locally, inspect the reviewer and immutable action, then approve or reject.
3. Try duplicate clicks, changed action arguments, a wrong reviewer and an expired proposal.
4. Compare the SQLite effect ledger and audit with agent text and optional notification channels.

Student challenge
Approve twice or approve a second proposal for the same case and explain why the effect ledger stays at one.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab65-human-approval.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L66 Real time frontends over WebSocket

Stream a bounded offline or explicitly started Managed turn over authenticated local WebSocket, with replay after reconnect.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 66 Real time frontends over WebSocket after the preceding lesson. Goal: Stream a bounded offline or explicitly started Managed turn over authenticated local WebSocket, with replay after reconnect.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c66. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept66RealtimeWebSocket.tsx
- server/concepts/66-realtime-websocket.ts
- shared/lab66-realtime-websocket.ts
- server/index.ts
- Tab66-realtime-websocket.md

Implementation brief
Goal: Stream an agent to a real-time frontend over WebSocket.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept66RealtimeWebSocket.tsx; server/concepts/66-realtime-websocket.ts; Tab66-realtime-websocket.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Attach an authenticated, same-origin WebSocket route to the HTTP server using ws. Define a typed protocol for start/message/cancel/ack, sequenced events, bounded replay and run state. Keep the agent and credentials in Node.

Experiment: Show live/guided chat, slow-consumer handling, disconnect/reconnect from the last sequence, duplicate command and terminal replay. Bound buffers, message size and connections.

Verify: Transport reconnection must not start a second billed run. Test authorization, event order, backpressure, cancellation and shutdown. Offline runner still uses real local WebSockets.

Reference route inventory under /api/c66: GET /code

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local platform with `ws@8.22.0`. The guided path uses real local WebSocket connections and an authored fixture; it does not contact Anthropic. The **Start live Managed run** button is disabled unless the existing Managed setup is ready. A live message starts a billed session only after you explicitly select that mode and send it.

## Controls

**Start guided run** creates a retained host run without sending a message. **Send message** triggers one turn and streams ordered events. **Disconnect** closes only the socket; the run continues in Node. **Reconnect and replay** repeats the original start command with `afterSeq` and reattaches to the same run. **Duplicate command** repeats the message command ID and must not start a second turn. **Cancel** aborts the host run. A new turn requires a new run.

## Evidence to inspect

The browser first obtains a short-lived HttpOnly, SameSite local cookie from `GET /api/c66/code`; the HTTP server attaches a `/api/c66/ws` upgrade handler and checks same-origin, cookie and connection capacity. Client commands use closed Zod schemas for start, message, cancel and ack. Each emitted frame has a run ID, sequence, source and state. The host retains at most 64 frames, sends a gap marker if older frames have been evicted, and closes a slow consumer while retaining the run. The WebSocket payload is capped at 2 KiB.

The offline reply passes through a closed, Zod-derived `compose_fixture_reply` custom-tool input and a `user.custom_tool_result` correlated to its `sevt_` ID. It has no business effect; the host does not enable built-in tools, MCP or skills in this path. Live mode reuses the existing Managed session-event consumer and cleanup port. Credentials remain in Node; reconnection never calls the runner again.

## Troubleshooting

If the socket is rejected, reload the lesson to obtain a fresh local cookie and check that the browser and backend share an origin through the Vite proxy. A duplicate command is acknowledged but does not create another run. A transport disconnect is not cancellation; use **Cancel** for a run stop. A replay gap means the 64-frame host ring no longer contains earlier chunks.

## Limitations

Each run accepts one message. Guided frames are authored text delivered over a real socket, not a cloud agent stream. A live run, if explicitly enabled, uses a fresh Managed session for its one turn and follows the existing Lab 01 cleanup behavior. WebSocket ack records what the browser has seen; it is not proof of model completion. Runs and replay buffers are process-local and expire with server restart.

## Challenge

Disconnect before the terminal event, reconnect with the original start command and last sequence, then repeat the message command. Explain why the run ID and terminal outcome stay the same.

## Run locally

```powershell
node --import tsx --test tests/lab66-realtime-websocket.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab66-browser-demonstration.mjs
```

Baseline and comparison
1. Start a guided run, send one message and inspect ordered chunks and the terminal event.
2. Disconnect midstream, reconnect with the same start command and replay from the last sequence.
3. Repeat a message command and confirm it does not start a second turn.
4. Cancel a fresh run and compare transport close with host run cancellation.

Student challenge
Reconnect after a terminal frame and show the same run ID and sequence without another accepted message.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab66-realtime-websocket.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L67 A multi tenant SaaS architecture

Enforce tenant ownership across project sources, runs, sessions, transcripts, cancellation and quota reservations.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 67 A multi tenant SaaS architecture after the preceding lesson. Goal: Enforce tenant ownership across project sources, runs, sessions, transcripts, cancellation and quota reservations.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c67. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept67MultiTenantSaas.tsx
- server/concepts/67-multi-tenant-saas.ts
- shared/lab67-multi-tenant-saas.ts
- Tab67-multi-tenant-saas.md

Implementation brief
Goal: Enforce tenant boundaries across projects, sessions and tools.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept67MultiTenantSaas.tsx; server/concepts/67-multi-tenant-saas.ts; Tab67-multi-tenant-saas.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Build a two-tenant SaaS workshop with synthetic authenticated principals, tenant-scoped stores, run/session ownership, quotas, concurrency reservations and usage ledger. Never accept trusted tenant identity from a model or client body.

Experiment: Run two tenants concurrently and attempt cross-tenant session, source, transcript and cancellation access. Show reservation release on failure and rate-limit outcomes.

Verify: Selectors are a local authentication simulation. Tests enforce every boundary and missing principal; the guide identifies what production identity/persistence would replace.

Reference route inventory under /api/c67: Author the routes required by this lab and document them.

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local platform. Alice/Acme and Bob/Birch are synthetic authentication principals. The sign-in selector is a local simulation and grants an opaque workshop token; it is not a production login. No API key, Anthropic call or provider cost is involved.

## Controls

**Simulate both sign-ins** creates two host-authenticated fixture identities. Choose **Hold for concurrency probes**, then **Run both tenants** to hold separate reservations. **Probe Birch as Acme** attempts foreign run, session, source, transcript and cancellation access; all five should return HTTP 404. **Try another Acme run** shows the per-tenant concurrency reservation. **Cancel own Acme run** releases only Acme's reservation. Choose the failure scenario to inspect release without charge. Repeated successful runs consume the six illustrative units of tenant quota.

## Evidence to inspect

The host maps each opaque token to a principal, tenant and project. Neither a client body nor model input can choose tenant authority. A closed Zod-derived `read_project_policy` custom tool validates its source ID and checks the host tenant before returning `user.custom_tool_result` correlated by `sevt_` ID. A separate principal-scoped request ID deduplicates starts and reservations. Unused built-in tools, MCP and skills are disabled in this offline path.

Every protected read, transcript and cancellation checks the host tenant and project. One active run per tenant reserves two illustrative units before starting; the reservation releases exactly once on completion, failure, cancellation or shutdown. Only success charges usage. Rate limits and workshop capacity bound admission. The two tenants can run concurrently without sharing quota.

## Routes

- `POST /api/c67/auth`: select a synthetic principal; no tenant field is accepted.
- `GET /facts` and `GET /code`: public teaching metadata and source inventory.
- `GET /usage`: authenticated tenant usage and reservation ledger.
- `POST /runs`: closed request ID and scenario input.
- `GET /runs/:id`, `GET /sessions/:id`, `GET /runs/:id/transcript`: owner-scoped evidence.
- `GET /sources/:id`: project policy data checked against the host tenant.
- `POST /runs/:id/cancel`: owner-scoped cancellation with an empty body.

## Troubleshooting

A foreign ID returns 404 without another tenant's metadata. Missing or invalid principal tokens return 401. A second active run returns 429 for concurrency; exhausted quota or the per-principal rate limit also returns 429 with an authored reason. Failure and cancellation release reservations without spending quota. Wait for the evidence refresh after cancellation.

## Limitations

This workshop uses process-local stores and an illustrative unit ledger. Production replaces the selector with verified identity claims, durable tenant-scoped storage and atomic distributed reservations. It also needs token expiry and revocation. The fixture session IDs identify authored local evidence, not cloud sessions.

## Challenge

Try to add `tenant: "birch"` to an Acme start body or custom-tool input. Identify the closed-schema rejection and the host identity check that still protects source reads.

## Run locally

```powershell
node --import tsx --test tests/lab67-multi-tenant-saas.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab67-browser-demonstration.mjs
```

Baseline and comparison
1. Simulate Alice/Acme and Bob/Birch sign-ins; inspect host-selected tenant and project identities.
2. Start both tenants concurrently and inspect separate reservation and usage ledgers.
3. Probe Birch objects as Acme and compare five refusals with the still-running Birch run.
4. Try another active run, a failed runner and exhausted quota; confirm reservations release once.

Student challenge
Add a tenant field to a model tool input or start body and explain why it cannot choose authority.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab67-multi-tenant-saas.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L68 Scheduled and event driven agents

Admit scheduled and signed incident jobs into a bounded queue, then explicitly claim, retry or cancel them.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 68 Scheduled and event driven agents after the preceding lesson. Goal: Admit scheduled and signed incident jobs into a bounded queue, then explicitly claim, retry or cancel them.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c68. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept68ScheduledAgents.tsx
- server/concepts/68-scheduled-event-driven.ts
- shared/lab68-scheduled-event-driven.ts
- Tab68-scheduled-event-driven.md

Implementation brief
Goal: Schedule jobs and deduplicate event-driven work.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept68ScheduledAgents.tsx; server/concepts/68-scheduled-event-driven.ts; Tab68-scheduled-event-driven.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Build one bounded queue fed by interval schedules and HMAC-SHA256 incident webhooks over timestamp + raw body. Mount express.raw before express.json; verify freshness and constant-time signatures. Return HTTP 202 on admission and duplicates.

Experiment: Tick/coalesce missed intervals, deduplicate event IDs, claim synchronously, run one job per worker click, retry after 1/2 seconds and dead-letter the third failure. Add cancellation and a clock-advance control.

Verify: Queue at most 100 jobs; intervals 5–3600 seconds. Advanced clock changes scheduling only, never signature freshness. Acknowledged does not mean executed; no billed run starts just from a trigger.

Reference route inventory under /api/c68: Author the routes required by this lab and document them.

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local platform. The exercise queues fictional jobs and writes idempotent local triage effects under ignored `artifacts/lab68/`. It makes no Anthropic request. An optional `LAB68_WEBHOOK_SECRET` stays on the server; without it the host generates an ephemeral signing key. The signed-fixture control never exposes that key.

## Controls

Create a five-second schedule, advance its scheduling clock by sixty seconds, then **Tick and coalesce**. One job represents the missed intervals. Admit the same signed incident twice to see HTTP 202 for admission and duplicate acknowledgement, with one job ID. **Run one successful worker** claims and executes one due job. Fail a fresh job, advance one second, fail again, advance two seconds, then fail a third time to inspect the dead-letter state. Cancel a queued or retrying job with **Cancel next pending job**.

## Evidence to inspect

The webhook route mounts `express.raw` before the JSON parser. HMAC-SHA256 covers the timestamp, a dot separator, and the exact raw request bytes. A constant-time comparison follows fixed-format and real-time freshness checks. Advancing the scheduling clock never changes signature freshness. The local fixture control uses this same verifier; bad and stale requests are refused.

The queue stores at most 100 jobs and ten schedules; intervals are limited to 5–3600 seconds. A tick coalesces missed occurrences rather than starting a worker. A worker claims synchronously before its first await, runs one job per click and has a two-second deadline. The first two failures retry after one and two seconds; the third enters dead letter. Cancellation and owner checks apply to queued and running work.

The closed Zod-derived `record_incident_triage` custom tool requires a live host claim. Its `user.custom_tool_result` uses the `sevt_` ID. A separate owner/event or owner/schedule business key is stored in SQLite to suppress duplicate effects. Built-in tools, MCP and skills are not enabled. Trigger acknowledgement never proves execution.

## Routes

- `POST /api/c68/webhook`: raw signed incident payload; `X-Lab68-Timestamp` is Unix seconds and `X-Lab68-Signature` is lowercase hex HMAC.
- `GET /facts`, `GET /code`, `GET /state`: owner-scoped metadata and evidence.
- `POST /schedules`, `POST /advance`, `POST /tick`: authored scheduling controls.
- `POST /fixtures/webhook`: local valid, bad-signature or stale fixture admission.
- `POST /worker`: one explicit success/failure claim.
- `POST /jobs/:id/cancel`: owner-scoped cancellation with an empty body.

## Troubleshooting

HTTP 202 means accepted or duplicate, not executed. A worker with no due job returns a conflict; advance the scheduling clock for a retry or tick a due schedule. A bad signature, altered whitespace or stale real timestamp is rejected before incident parsing. A full queue returns 429 while a known duplicate remains acknowledged.

## Limitations

Jobs and schedules live in process memory, and ticks are explicit exercise controls rather than a background service. SQLite persists business effect keys only. Production replaces this with durable queue/lease storage, delivery authentication and supervised workers. The clock advance is local to the experiment owner. No billed run starts from a trigger.

## Challenge

Advance the scheduling clock, submit a stale signed request, and explain why it still fails. Then admit one event twice and identify the distinct admission, claim, tool-event and persisted business-effect evidence.

## Run locally

```powershell
node --import tsx --test tests/lab68-scheduled-event-driven.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab68-browser-demonstration.mjs
```

Baseline and comparison
1. Create a five-second schedule, advance the scheduling clock and coalesce missed intervals with a tick.
2. Admit a signed incident twice and compare the same job ID with duplicate admission.
3. Run one worker per click; fail three attempts with one- and two-second retry delays.
4. Try stale signatures after advancing the scheduling clock, then inspect cancellation and effect keys.

Student challenge
Show why an HTTP 202 trigger and an advanced schedule clock cannot prove execution or signature freshness.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab68-scheduled-event-driven.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L69 Desktop and IDE host integration

Supply explicit document context from a trusted host and apply a reviewed patch only when version and hash still match.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 69 Desktop and IDE host integration after the preceding lesson. Goal: Supply explicit document context from a trusted host and apply a reviewed patch only when version and hash still match.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c69. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept69EmbeddingSdk.tsx
- server/concepts/69-embedding-sdk.ts
- shared/lab69-embedding-sdk.ts
- server/lib/lab69-host.ts
- extensions/lab69/src/extension.ts
- extensions/lab69/package.json
- Tab69-embedding-sdk.md

Implementation brief
Goal: Supply explicit context and reviewable edits to a remote agent.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept69EmbeddingSdk.tsx; server/concepts/69-embedding-sdk.ts; Tab69-embedding-sdk.md

Build: Separate browser/VS Code adapters from a trusted host/backend that calls Managed APIs and owns session credentials. Author extension manifest, TypeScript host and webview with one active run, typed messages and correlation IDs. API keys stay in server-side configuration or approved secret storage, never in the packaged webview/bundle. Custom file tools bind to trusted allowed folders; remote sandbox changes reach local documents only as checked patches with version/hash conflict checks.

Experiment: Browser guided mode and runnable extension show start, previews, final outcome, cancellation, transport failure and changed-document conflict. Workspace trust is resolved by the trusted host.

Verify: Build/test extension disposal, stale messages and actual patch apply guards. Browser simulation does not prove extension execution; local cancellation still needs remote cleanup.

Reference route inventory under /api/c69: Author the routes required by this lab and document them.

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local learning platform. Guided mode uses an authored remote-review fixture and an owner-scoped fictional document; no Anthropic call is made. The separate VS Code extension is in `extensions/lab69`. API keys remain in the Node backend, outside the webview and extension bundle.

## Controls

**Start guided review** captures explicit document text, version and SHA-256 hash. Inspect previews and the proposed replacement. **Apply reviewed patch** asks the local host to check identity, correlation, version and hash before changing the document. **Change local document** makes an older patch conflict. Choose transport failure or hang to inspect errors and **Cancel review**. Live review is available only with existing Managed setup and explicit user selection.

## Evidence to inspect

The backend validates the context hash and final closed patch JSON. A remote sandbox never directly edits the local document. One active run per host owner, a global concurrency bound, a deadline and correlation deduplication control execution. Cancellation requests and cleanup evidence are separate. A lost start response can be resolved by correlation ID before cleanup is requested.

The extension manifest declares workspace-trust requirements. Its trusted Node host resolves the active saved document through real paths inside an allowed workspace folder; the webview sends only closed start/cancel/apply messages and correlation IDs. The webview has no network access or local resource roots and renders evidence through `textContent`. The host ignores stale messages, aborts polling on disposal, requests backend cancellation with a fresh signal and checks cleanup. Patch application rechecks workspace trust, URI/document identity, version and hash, then uses the VS Code editor edit operation.

## Run the extension

```powershell
cd C:\claude-managed-agents
npm run lab69:extension:build
npm run dev:server
# In another terminal:
code --extensionDevelopmentPath="C:\claude-managed-agents\extensions\lab69" "C:\claude-managed-agents\extensions\lab69\fixture"
```

Open `observation.md` in the Extension Development Host, trust the fictional fixture workspace, and run **Managed Labs 69: Review Active Document** from the Command Palette. The extension's [README](extensions/lab69/README.md) describes conflict and transport checks. Official [workspace trust](https://code.visualstudio.com/api/extension-guides/workspace-trust) and [webview API](https://code.visualstudio.com/api/extension-guides/webview) guidance informs these boundaries.

## Routes

`GET /api/c69/facts`, `GET /code`, and `GET /document` provide readiness, sources and the browser fixture. `POST /document/change` changes that fixture; `POST /document/apply` accepts only a stored run ID. `POST /runs` starts an explicit-context review, `GET /runs/:id` polls evidence, `GET /correlations/:id` resolves a lost start response, and `POST /runs/:id/cancel` requests cleanup. All routes require the local host owner header.

## Troubleshooting

A changed document is expected to reject an older patch; capture fresh context and review again. A stale correlation cannot replace the current review. If transport fails, local cancellation alone cannot prove a remote stop; inspect cleanup or retry lookup through the trusted backend. The extension accepts User-level loopback backend configuration only.

## Limitations

The browser is a simulation of a host document. Tests execute the bundled extension in a mocked VS Code host and validate actual file guards; a separate real VS Code 1.142.0 run also passed the actual command/webview, guided patch apply and concurrent-edit conflict checks. The fixture does not grant arbitrary file tools or cloud access to local paths. Live mode reuses the existing text-only Managed runner and validates final JSON; the later authorized live backend smoke test validated a patch and host apply, then confirmed remote archival. Run npm run test:editor:real separately to repeat the installed-editor check. It uses an isolated disposable profile and copied fictional document, with zero provider calls; workspace trust is disabled only in that fixture profile. Set LAB69_VSCODE_EXECUTABLE if needed. See [live evidence](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/blob/main/docs/course-validation.md).

## Challenge

Capture context, obtain a valid patch, then edit the document locally. Explain why the patch's correct JSON and correlation still cannot overcome the version/hash conflict.

## Run locally

```powershell
node --import tsx --test tests/lab69-embedding-sdk.test.ts tests/lab69-extension.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab69-browser-demonstration.mjs
```

Baseline and comparison
1. Start a guided review and inspect preview events and the proposed replacement before applying.
2. Change the local document after proposal and confirm the older patch is rejected.
3. Compare cancellation and transport failure with independent cleanup evidence.
4. Build the VS Code extension and inspect host trust, file scope and typed webview messages separately.

Student challenge
Change a document after its context snapshot and explain why a valid remote patch still cannot apply.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab69-embedding-sdk.test.ts, tests/lab69-extension.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L70 Python client for Managed Agents

Compare the Managed session protocol through an isolated Python worker and the TypeScript host bridge.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Lab 70 Python client for Managed Agents after the preceding lesson. Goal: Compare the Managed session protocol through an isolated Python worker and the TypeScript host bridge.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c70. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept70PythonSdk.tsx
- server/concepts/70-python-sdk.ts
- shared/lab70-python-sdk.ts
- server/lib/lab70-python.ts
- python/lab70/worker.py
- python/lab70/requirements.txt
- Tab70-python-sdk.md

Implementation brief
Goal: Compare Python and TypeScript clients for the same remote session protocol.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept70PythonSdk.tsx; server/concepts/70-python-sdk.ts; Tab70-python-sdk.md

Build: Pin an explicitly verified anthropic Python package version whose beta Managed session/agent APIs match the exercise; record it in requirements.txt independently from npm 0.133.0. Do not use claude-agent-sdk, async query or ClaudeSDKClient. A JSON-lines worker accepts one bounded request and uses official create, event stream/send, custom-tool result, retrieve and cleanup methods. Keep the platform TypeScript; Node spawns the selected interpreter with fixed arguments and a narrow environment. Host custom tools replace Python SDK hooks.

Experiment: Offline protocol adapter, readiness facts, one-shot/retained session, custom tool call, malformed stdout and missing Python. Prefer .venv or an allowlisted PYTHON_SDK_EXECUTABLE.

Verify: No live work/install runs during ordinary checks. Test bridge cleanup and bounded stderr; worker termination cannot establish remote stop. Document Windows venv/install commands and the exact tested package capability; if no verified package version is available, keep live disabled with an actionable reason.

Reference route inventory under /api/c70: Author the routes required by this lab and document them.

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

The platform remains TypeScript and uses npm `@anthropic-ai/sdk@0.133.0`. The independent Python requirement is `anthropic==1.7.0` in `python/lab70/requirements.txt`. That official package was inspected locally for session create, event stream/send, custom-tool result, retrieve/archive and agent lookup APIs. Its [PyPI release](https://pypi.org/project/anthropic/1.7.0/) and [official SDK source](https://github.com/anthropics/anthropic-sdk-python) identify the client. No Agent SDK query or `ClaudeSDKClient` is used.

The bridge prefers `.venv`, then an allowlisted system interpreter. It uses fixed `-I -u -B` arguments and a narrow environment. Isolated Python ignores user-site packages, so a package installed only in the user profile does not make the selected worker ready. Install explicitly when you want live capability:

```powershell
cd C:\claude-managed-agents
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r python\lab70\requirements.txt
$env:PYTHON_SDK_EXECUTABLE = 'C:\claude-managed-agents\.venv\Scripts\python.exe'
npm run dev
```

Readiness, build and offline tests never run pip or contact Anthropic.

## Controls

**Check Python readiness** inspects the selected interpreter without network calls. **Start offline Python** runs a real standard-library JSON-lines worker. Compare one-shot cleanup, retained start, another retained turn and idle close. The host accepts only its opaque session handle and checks owner/mode/idle state before reuse; the browser cannot submit a remote session ID.

Choose **custom-tool** to see Python emit `agent.custom_tool_use`, Node validate the closed tool input and return `user.custom_tool_result` by `sevt_` ID. Compare malformed stdout, diagnostic overflow, hang/cancel and missing-Python scenarios. Live mode requires the exact verified package surface, existing server Managed setup and explicit user selection.

## Evidence to inspect

Node spawns one worker request with fixed arguments and no shell. Offline workers never import the provider package. JSON-lines frames, line size, total stdout, stderr capture, calls and process lifetime are bounded. Host custom tools replace Python hooks; the formatting tool has no business effect. Event IDs correlate replies and are not business idempotency keys.

The live adapter uses official `client.beta.sessions.create`, `events.stream`, `events.send`, `retrieve` and `archive` calls. It establishes the stream before sending the message, deduplicates events, handles custom-tool results and verifies the resolved tools/MCP/skills configuration. Retained reuse requires confirmed idle. Cancellation sends an interrupt, then retrieves status before retention or archive. Acknowledgement, local process termination and confirmed remote idle remain separate evidence.

## Routes

`GET /api/c70/facts` returns non-network readiness facts and the independent pins; `GET /code` lists TypeScript and Python sources. `POST /probe` explicitly inspects the isolated interpreter. `POST /runs` starts one bounded worker, `GET /runs/:id` polls evidence, and `POST /runs/:id/cancel` requests graceful cancellation. `GET /sessions` lists owner-scoped retained handles. All routes require the local experiment owner.

## Troubleshooting

If readiness says not installed, create the venv and install the exact requirements manually. A user-profile install is ignored by `-I`. Malformed stdout terminates the worker and is reported as a protocol failure. Diagnostics are bounded and redacted. A missing interpreter produces an actionable error without invoking a shell. Use the same mode and an idle owned handle for retained turns; close it before starting another retained session.

## Limitations

After explicit setup, the pinned Python 1.7.0 requirements were installed in the local .venv and capability probing passed. Actual live tests verified retained-session reuse, explicit close and a correlated host-tool call. The budget uses integer decimal strings, and descriptor-based control reads permit clean shutdown with stdin open. See [live evidence](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/blob/main/docs/course-validation.md). A fresh checkout still requires the explicit venv setup and probe. Offline retained IDs and cleanup are authored simulations. Killing a worker cannot establish remote stop; inspect interruption/cleanup or perform an owner-authorized follow-up through the provider API.

## Challenge

Compare an interrupt acknowledgement, an idle confirmation, archive evidence and a killed child process. Identify which evidence permits retained-session reuse.

## Run locally

```powershell
node --import tsx --test tests/lab70-python-sdk.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab70-browser-demonstration.mjs
```

Baseline and comparison
1. Check selected interpreter readiness without installing packages or contacting Anthropic.
2. Run one-shot and retained offline turns, then close the confirmed-idle handle.
3. Run the host custom-tool round trip and inspect its sevt_ correlation.
4. Compare malformed stdout, bounded stderr, missing Python and cancellation with cleanup evidence.

Student challenge
Terminate a worker and explain why process exit cannot prove a remote Managed session has stopped.

Verification
Create the focused test files appropriate to this lesson, using the reference responsibilities tests/lab70-python-sdk.test.ts. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.


---

## L71 A data analysis agent

Build a sales analysis from scoped CSV data, executable calculations and ledger-cited reports and charts.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Begin the multi-step Lab 71 A data analysis agent. Read the remainder as the final target contract for the whole lab. In THIS parent checkpoint, establish the specification and minimal compiling scaffolding needed by 71A; implement the feature through the following lettered prompts 71A. Do not try to pass the full end-to-end lesson before those implementation substeps. Keep unfinished behavior unpublished and do not register a placeholder as an implemented lesson. Goal: Build a sales analysis from scoped CSV data, executable calculations and ledger-cited reports and charts.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c71. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept71DataAnalysisAgent.tsx
- server/concepts/71-data-analysis-agent.ts
- shared/lab71-data-analysis-agent.ts
- server/lib/lab71-analysis.ts
- fixtures/lab71/sales.csv
- Tab71-data-analysis-agent.md

Implementation brief
Goal: Build an analysis from scoped data and executable checks.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept71DataAnalysisAgent.tsx; server/concepts/71-data-analysis-agent.ts; Tab71-data-analysis-agent.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Create a six-month sales CSV with four regions/two products, duplicate row, missing revenue, 940-unit outlier and hostile note. Define raw/clean rules using duplicates, empty cells and 1.5×IQR. Build profile_dataset, aggregate, compare_periods and make_chart with closed schemas.

Experiment: Store computation IDs C1… and chart IDs G1…; structured report findings cite computations. Draw charts from ledger data. Run a scripted analyst and a tampered report through the same verifier.

Verify: Ratios are ratios of sums, missing cells are skipped, and n/skippedEmpty are reported. Reject unknown evidence/value/chart; warn on uncited prose. Use the extra 71A prompt.

Reference route inventory under /api/c71: GET /facts; GET /code; POST /sessions; GET /sessions/:id; POST /sessions/:id/tool; POST /sessions/:id/scripted; POST /sessions/:id/verify; POST /sessions/:id/query

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Run the local platform. This lesson includes the parent Lab 71 and supplemental 71A calculation/report rules. `fixtures/lab71/sales.csv` has six months, four regions, two products, a duplicate row, a missing revenue cell, a 940-unit outlier and a quoted hostile note. Notes remain untrusted read-only data. No model request or API key is needed.

## Controls

Create an analysis session. Compare raw and clean profiles, select a metric/reduction/group/month scope, then aggregate it. Compare January/June and chart an existing aggregate. **Run scripted analyst** calls the same closed host tools, creates computation IDs `C1…`, a chart ID `G1…`, and a structured report. **Verify tampered report** changes a value/citation without changing the ledger; the same verifier rejects it.

## Evidence to inspect

The small RFC 4180 reader supports quoted delimiters, newlines and escaped quotes. Empty or whitespace-only numeric cells become absent values, never zero. Raw mode retains all parsed rows. Clean mode removes exact parsed-row duplicates, then whole rows whose units fall outside per-product 1.5×IQR fences. Quartiles use Type 7: linear interpolation at `(n - 1) * p`, over the entire deduplicated six-month product population before month filtering. The authored data yields 49 raw rows and 47 clean rows.

Closed tools are `profile_dataset`, `aggregate`, `compare_periods` and `make_chart`. Numeric metrics support sum, mean, median, min, max and count of nonmissing values. Every group reports eligible `n` and `skippedEmpty`; profile counts rows with any absent numeric cell. `return_rate = 100 × sum(returns) / sum(units)` over rows with both cells present. `avg_price_eur = sum(revenue_eur) / sum(units)` uses rows with both revenue and units present. A zero denominator produces no numeric value. Ratios never average row ratios.

Computations store validated input/output under stable session-local C IDs. Comparison records both named months, absolute difference and percentage change; a zero base leaves percentage undefined. Charts accept only an existing aggregate ID, read its ledger numbers and escape SVG labels. The model cannot supply chart values. Custom-tool results correlate by `sevt_` event ID; repeated delivery of an event does not duplicate the ledger entry. No built-in tools, MCP or skills bypass this boundary.

The closed report contains title, quality choice, findings with explicit value/unit/computation ID, chart IDs and optional commentary. Verification requires a known computation, matching quality, a matching recorded value/unit within absolute tolerance 0.005, and existing charts of the same quality. Unknown IDs, unsupported values and nonexistent charts are rejected. Numeric prose and uncited commentary generate warnings. Matching numbers does not establish a sensible causal conclusion.

## Routes

`GET /api/c71/facts`, `GET /code`, `POST /sessions`, `GET /sessions/:id`, `POST /sessions/:id/tool`, `POST /sessions/:id/scripted`, `POST /sessions/:id/verify` and `POST /sessions/:id/query` are owner-scoped. The query route supports the offline analyst. Optional live analysis is disabled until a dedicated bounded custom-tool adapter is configured; externally supplied final JSON still uses the same verifier.

## Troubleshooting

Use `ratio_of_sums` for ratio metrics; incompatible reductions are rejected. A missing cell is skipped while a real zero remains eligible. Chart creation requires an aggregate C ID, not a comparison or unknown ID. A report must cite computations from this session and its chosen quality. Create a new session after reaching ledger bounds.

## Limitations

This is a host-computed fictional analysis, with process-local ledgers and SVG charts drawn from recorded numbers. No live analyst adapter or billed run was tested. The verifier validates evidence membership, values, units and quality; statement meaning and causal interpretation remain review tasks.

## Challenge

Use two rows with one return out of one unit and zero returns out of nine units. Explain why the correct aggregate is ten percent while the mean of row rates is fifty percent. Then try to cite an unsupported report value.

## Run locally

```powershell
npm run test:analysis
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab71-browser-demonstration.mjs
```

Baseline and comparison
1. Create a session and compare raw/clean profiles, duplicate removal and per-product IQR fences.
2. Aggregate numeric metrics or ratios of eligible sums; inspect n and skipped empty counts.
3. Run the scripted analyst and inspect computation C IDs and ledger-derived chart G IDs.
4. Tamper a report value or citation and verify rejection without changing its evidence ledger.

Student challenge
Explain why averaging row return rates differs from the host ratio of summed returns to summed units.

Verification
At this parent checkpoint verify the new scaffolding compiles and prior lessons still work, then continue immediately to L71A. Full lesson registration, browser evidence and acceptance belong after L71A, not before the lettered implementation prompts. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** This is the whole-lab brief and compiling scaffold. Continue to L71A; complete the full lesson checks after L71A.


---

## L71A Verify calculations reports and charts

Implement this detailed substep of Lab 71 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Apply the Managed platform constraints and dedicated host custom-tool boundary from this workbook. Preserve the exact domain rules below. Do not implement Agent SDK callbacks or local query options; verify every provider-specific operation against pinned official Managed types.

Finish AnalysisLab with a small RFC 4180 CSV reader supporting quoted delimiters/newlines. Author sales rows with month, region, product, units, revenue_eur, returns and notes. Keep notes untrusted and read-only. Raw mode keeps every row; clean mode removes duplicates and product-unit IQR outliers and skips absent numeric cells. Define quantile conventions and test them.

Closed tools allow enumerated metrics/groups/months and sum, mean, median, min, max and count. return_rate = 100 × sum(returns)/sum(units); avg_price_eur = sum(revenue_eur)/sum(units) over the documented eligible set. Guard zero denominators. Return counts, skipped values and quality choices with every result.

Record validated input and computed output under stable C1… IDs. make_chart references an existing aggregate and stores G1…; SVG charts are drawn only from recorded numbers and use escaped labels. compare_periods names both months and reports absolute and percentage change with a documented zero-base outcome.

The report schema includes title, quality choice, findings {statement,value,unit,computationId} and chart IDs. verifyReport rejects unknown evidence, absent values beyond the chosen rounding tolerance and nonexistent charts. Report unchecked numeric prose as warnings. Explain that evidence matching cannot prove a sensible causal conclusion.

Expose session creation, tool calls, scripted analysis, report verification and optional bounded live query. Add a tampered-report button that changes a value/ID without changing the ledger. The same verifier must reject both scripted and live unsupported claims.

Use independent small fixtures to test ratios of sums versus mean of ratios, missing cells versus zero, duplicate/IQR removal, quantiles, period comparison and tampered citations. Run test:analysis plus the course checks and inspect every rendered chart/report view.

Apply the current detailed Lab 71 specification in L71 and its challenge when the older brief omits a boundary. This is the final substep: finish the real UI/router registration and guide, run the complete lesson baseline/comparison/error cases and focused tests, verify source links and typecheck/build, then continue to the next numbered lesson. Never register an unfinished placeholder.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L72 Document generation with Skills

Generate a deterministic Word document from a closed specification and independently inspect the package and immutable skill bundle.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Begin the multi-step Lab 72 Document generation with Skills. Read the remainder as the final target contract for the whole lab. In THIS parent checkpoint, establish the specification and minimal compiling scaffolding needed by 72A; implement the feature through the following lettered prompts 72A. Do not try to pass the full end-to-end lesson before those implementation substeps. Keep unfinished behavior unpublished and do not register a placeholder as an implemented lesson. Goal: Generate a deterministic Word document from a closed specification and independently inspect the package and immutable skill bundle.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c72. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept72DocumentGenerationSkills.tsx
- server/concepts/72-document-generation-skills.ts
- shared/lab72-document-generation-skills.ts
- server/lib/lab72-docgen.ts
- Tab72-document-generation-skills.md

Implementation brief
Goal: Generate documents through skills and host validation.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept72DocumentGenerationSkills.tsx; server/concepts/72-document-generation-skills.ts; Tab72-document-generation-skills.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Package docgen-skills/atmira-docx with SKILL.md, spec reference, incident-report reference, brand JSON and deterministic build-docx.mjs. Model writes a JSON spec; builder owns OOXML/layout; host independently inspects the DOCX and skill hashes.

Experiment: Use fictional incident notes with conflicting impact numbers, unknown owner, a fake secret and an injection. Permit only spec writes and the exact builder command in a per-run workspace.

Verify: Escape XML, validate sections/tables/classification, reject placeholders/secrets and protect skill files. Downloads use opaque run IDs. Use the extra 72A prompt to build and verify the artifact pipeline.

Reference route inventory under /api/c72: GET /facts; GET /code; POST /sessions; GET /sessions/:id; POST /sessions/:id/build; POST /sessions/:id/policy; GET /sessions/:id/files/:name; POST /sessions/:id/query

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Use Node 24 and install the pinned project dependencies. This exercise is offline. The authored skill lives in `docgen-skills/atmira-docx`, with SKILL.md, progressive references, brand assets and a dependency-free deterministic builder. A local skill folder is not automatically mounted in Managed sessions.

## Controls

Choose incident or ordinary and Build document. The scripted agent uses only read_spec_reference, write_spec and build_document. It cannot run arbitrary commands. Compare invalid-spec, placeholder, injection and skill-tamper fixtures. The injection scenario preserves conflicting impact counts and excludes instructions and the fake token from the report. Check command policy inspects a string without executing it. Download verified DOCX fetches an owner-scoped opaque file ID.

## Evidence to inspect

Inspect correlated custom tool result IDs, both reference reads for incidents, the authored skill SHA256 manifest, independent package checks and the separate incident contract. Reports preserve both 120 and 145 as unconfirmed impact estimates, an unknown root cause and explicit unassigned owners. ZIP timestamps, ordering and document properties are fixed. Numbered lists restart independently. XML-like input is literal text and is escaped; there is no inline markup grammar.

Each session copies the five allowlisted skill files into `docgen-lab/runs/<uuid>`. The host verifies every skill hash before execution and afterward, invokes only the fixed builder path and arguments with no shell, and independently reads the output ZIP. Downloads repeat integrity checks. Cancellation terminates only the local builder; no remote session exists in this exercise. Owner headers isolate local fixtures and are not production authentication.

## Troubleshooting

Invalid specifications produce SPEC ERROR and builder exit 2. Placeholder and fake-secret patterns fail host inspection. Changed or unexpected skill files prevent execution. A rejected document has no download ID. Session capacity is twenty per server process; restart the backend to reset the teaching store. Builds have a five-second child-process deadline and a global limit of two.

## Limitations

The scripted exercise does not claim model-generated tool calls or remote skill loading. The live query route explicitly rejects unsupported mode. `npm run docgen:package` creates a local ZIP and hash manifest only; deliberate upload and immutable version configuration are separate setup through the Managed Skills API, as explained in Lab 11. Do not reuse its format-observation pins for this different skill. Configure a dedicated read-only Managed agent with only these custom tools before adding a live adapter. Do not give remote agents host shell access or assume remote skill paths equal local paths.

Package checks validate the narrow authored OOXML profile, not all possible Word documents, factual correctness, semantic compliance or pagination. Open the downloaded document in Word and inspect every page, table, footer and list restart. Automated package checks cannot substitute for that visual review. Skill hashes attest bytes, not trustworthiness of their instructions. The intentionally tiny grammar supports literal text and native lists only.

## Challenge

Add two separate numbered lists and XML-looking text. Show that each list starts at one and markup remains visible text. Remove an incident section and explain why ordinary package validation and the incident contract answer different questions.

## Run locally

Run `npm run dev`, then open lesson 72. Run `npm run test:docgen`, `npm run docgen:package`, typecheck, build, guide audit and focused browser checks. No paid provider calls are needed.

Baseline and comparison
1. Build an incident report and inspect the two progressive reference reads.
2. Compare an ordinary document with the incident contract.
3. Run invalid spec, placeholder and skill tamper scenarios and inspect rejection.
4. Probe command policy and download only verified documents for visual review.

Student challenge
Explain why a valid OOXML package does not prove factual correctness or good pagination in Word.

Verification
At this parent checkpoint verify the new scaffolding compiles and prior lessons still work, then continue immediately to L72A. Full lesson registration, browser evidence and acceptance belong after L72A, not before the lettered implementation prompts. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** This is the whole-lab brief and compiling scaffold. Continue to L72A; complete the full lesson checks after L72A.


---

## L72A Build and inspect the document skill pipeline

Implement this detailed substep of Lab 72 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Apply the Managed platform constraints and dedicated host custom-tool boundary from this workbook. Preserve the exact domain rules below. Do not implement Agent SDK callbacks or local query options; verify every provider-specific operation against pinned official Managed types.

Author the complete atmira-docx teaching skill. SKILL.md has valid name/description frontmatter and directs progressive loading of reference/spec-format.md and reference/incident-report.md. assets/brand.json supplies allowed typography/classification. scripts/build-docx.mjs validates an explicit JSON spec and creates an actual DOCX package, using a dependency-free OOXML/ZIP writer or a pinned library.

Define spec fields for title, kind, classification, ISO date and blocks. Allow paragraph, heading, bullet/numbered list and table with bounded rows/cells/widths. Incident reports require Summary, Impact, Timeline, Root cause and Action items in order, plus Owner/Due columns. Emit actionable SPEC ERROR <path> messages with exit 2. XML-escape all user content; any inline formatting has a deliberately tiny documented grammar.

Build DOCX styles, numbering, repeatable table headers, page-number footer and document properties. Make bytes deterministic through fixed ZIP timestamps and stable ordering. Test identical specs yielding identical hashes, escaped malicious markup, restarted numbered lists and invalid structure.

Create per-run workspaces under docgen-lab/runs/<id>. Copy the immutable skill, fictional notes and empty output folder. Expose only custom read_spec_reference, write_spec and build_document handlers to this agent. The build handler runs fixed host arguments for the checked builder/spec/output paths; agent text cannot choose a shell command. Package the same authored skill for explicit Managed Skills API setup; a remote attached skill path is not the host .claude path. Reject chaining, substitutions, other executables and arbitrary paths.

After the adapter returns, the host independently opens ZIP members and inspects styles, title, sections, action table, length, placeholders and secret patterns. Hash skill files before/after. The model cannot approve its own output. Compare ordinary document and incident-contract checks; expose invalid-spec, injection, placeholder and skill-tamper scenarios.

A successful output is downloadable through an opaque run/file ID allowlist, not a caller path. Generate and open a DOCX in Word for visual inspection; automated package checks do not validate pagination. Record exactly which package and visual checks ran. Run test:docgen, then course checks.

Apply the current detailed Lab 72 specification in L72 and its challenge when the older brief omits a boundary. This is the final substep: finish the real UI/router registration and guide, run the complete lesson baseline/comparison/error cases and focused tests, verify source links and typecheck/build, then continue to the next numbered lesson. Never register an unfinished placeholder.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L73 An autonomous PR reviewer and fixer

Route changed-line review findings to a constrained fixer and commit only after independent host gates and real tests.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Begin the multi-step Lab 73 An autonomous PR reviewer and fixer. Read the remainder as the final target contract for the whole lab. In THIS parent checkpoint, establish the specification and minimal compiling scaffolding needed by 73A; implement the feature through the following lettered prompts 73A. Do not try to pass the full end-to-end lesson before those implementation substeps. Keep unfinished behavior unpublished and do not register a placeholder as an implemented lesson. Goal: Route changed-line review findings to a constrained fixer and commit only after independent host gates and real tests.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c73. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept73PrReviewerFixer.tsx
- server/concepts/73-pr-reviewer-fixer.ts
- shared/lab73-pr-reviewer-fixer.ts
- server/lib/lab73-prbot.ts
- Tab73-pr-reviewer-fixer.md

Implementation brief
Goal: Review and fix a pull request through explicit host gates.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept73PrReviewerFixer.tsx; server/concepts/73-pr-reviewer-fixer.ts; Tab73-pr-reviewer-fixer.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Create a fixture PR repository, numbered diff and host-owned test runner. Reviewer has read-only tools and structured findings; deterministic code routes only high-confidence medium-or-higher findings on changed lines to a fixer, with others for a person.

Experiment: Fixer writes only assigned changed files; host checks scope, protected files, diff size and tests before commit. Show good fix, out-of-scope fix, skipped tests and unresolved findings.

Verify: No remote GitHub write is needed. Keep PR prose untrusted, allowlist Git/Node commands and scrub test env. Use the extra 73A prompt for the gate and report workflow.

Reference route inventory under /api/c73: GET /facts; GET /code; POST /gate; POST /sessions; POST /sessions/:id/policy; POST /sessions/:id/review; POST /sessions/:id/fix; GET /sessions/:id/patch; POST /sessions/:id/run

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Install Git and Node 24. This offline exercise creates a real disposable fixture repository beneath `prbot-lab/runs/<uuid>`. It never pushes that repository. PR prose is untrusted, including the authored instruction to delete CI or change the package version.

## Controls

Run PR review and fix creates main and feature branches, a numbered diff, a reviewer report and a constrained fix attempt. Choose good-fix, out-of-scope, skipped-tests, unresolved, malformed-review or timeout. Cancel local work aborts an active test process; no remote session exists. Session review/fix routes also permit inspecting the stages separately. Two local fix rounds are the maximum; there is no unlimited agent loop.

## Evidence to inspect

Findings contain file, line, severity, confidence, message and question. Only high-confidence, medium-or-higher non-question findings on actual changed lines reach the fixer. Other findings go to a person. Reviewer tools are read-only; the fixed write handler can change only the assigned source. Host gates independently inspect tracked and untracked paths, protected edits, bounded diff, skip/only/todo test gaming and real Node tests. A local fix commit occurs only after the gates pass, then the full suite runs again. Compare the recorded hashes with `git -C prbot-lab/runs/<id> log --oneline --all` in PowerShell. Main remains unchanged.

## Troubleshooting

Git must be available on PATH. Host Git and test processes use argument arrays, fixed checkout paths, bounded output/deadlines and an environment without provider keys. A missing Git executable or interrupted process fails closed. Failed fixture state is retained. Use the patch and handoff details to inspect it. A twelve-session process limit bounds retained fixtures; restart the server to reset the teaching store.

## Limitations

Roles are scripted fixtures using the same closed host handlers; this is not an observed Claude review. No live adapter is configured. Out-of-scope and test-gaming scenarios deliberately mutate the local fixture behind the normal tool boundary to test independent gates. No remote GitHub write is performed. Handoff commands are reviewable suggestions and require a person to select a remote. Local owner headers are not production authentication. Git worktrees and scrubbed environments do not provide OS containment against arbitrary code; use a sandbox for untrusted real repositories.

## Challenge

Submit a question on a changed line and a high-confidence finding on an unchanged line. Explain why neither can authorize a fix. Compare a green skipped test suite with host rejection.

## Run locally

Run `npm run dev` and open lesson 73. Run `npm run test:prbot`, typecheck, build, guide checks and the focused browser demonstration. Real local Git commits occur only inside the disposable fixture.

Baseline and comparison
1. Run the good fix and inspect numbered diff, gates and local commit hash.
2. Compare out-of-scope changes, skipped tests, unresolved findings and process timeout.
3. Inspect the reviewable patch and draft handoff after a rejected fix.
4. Explain why a high-confidence claim does not authorize Git or protected file changes.

Student challenge
Route a low-confidence finding and a question to a person without granting fixer authority.

Verification
At this parent checkpoint verify the new scaffolding compiles and prior lessons still work, then continue immediately to L73A. Full lesson registration, browser evidence and acceptance belong after L73A, not before the lettered implementation prompts. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** This is the whole-lab brief and compiling scaffold. Continue to L73A; complete the full lesson checks after L73A.


---

## L73A Enforce the review fix and handoff gates

Implement this detailed substep of Lab 73 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Apply the Managed platform constraints and dedicated host custom-tool boundary from this workbook. Preserve the exact domain rules below. Do not implement Agent SDK callbacks or local query options; verify every provider-specific operation against pinned official Managed types.

Create a disposable fixture repository under prbot-lab/runs/<id> with main, a feature branch, authored source/tests and one real bug. Host Git helpers use spawn with argument arrays, fixed cwd and timeouts. The test runner has a sanitized environment without the API key. Agents receive no shell/Git capability.

Implement parseDiff and numberedDiff for main…feature with file and changed-line mapping. Reviewer outputs findings {file,line,severity,confidence,message,question}. Validate against the actual diff; high-confidence medium-or-higher findings on changed lines go to the fixer. Low-confidence, unrelated lines and questions go to a human report.

Fixer has read access inside its checkout and write access only to assigned source/test files. After every attempt, inspect tracked/untracked paths, protected file changes, diff size and actual behavior tests. Detect added skip/only/todo instead of treating a green skipped suite as proof. Cap rework rounds and preserve failed evidence.

Commit only after host validation. The agent cannot author Git commands or choose protected changes. Rerun the full fixture suite and record commit hashes, findings disposition and limits. Test out-of-scope edits, malformed review, test gaming, unresolved high findings and process timeout.

Generate a local ready/draft PR description and safe reviewable push/gh commands. This exercise does not push or publish automatically. Keep the report and patch available for a person; stop with escalation when a gate fails. Export reusable Git, path-policy, test and diff helpers for lesson 75.

Add test:prbot and include it in test:offline. Confirm local Git history, source evidence and the browser's gate table agree. Run typecheck/build and retain the isolated fixture state for inspection.

Apply the current detailed Lab 73 specification in L73 and its challenge when the older brief omits a boundary. This is the final substep: finish the real UI/router registration and guide, run the complete lesson baseline/comparison/error cases and focused tests, verify source links and typecheck/build, then continue to the next numbered lesson. Never register an unfinished placeholder.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L74 Prompt injection red teaming

Measure attempted and executed prompt-injection effects alongside safe support-desk utility.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Begin the multi-step Lab 74 Prompt injection red teaming. Read the remainder as the final target contract for the whole lab. In THIS parent checkpoint, establish the specification and minimal compiling scaffolding needed by 74A; implement the feature through the following lettered prompts 74A. Do not try to pass the full end-to-end lesson before those implementation substeps. Keep unfinished behavior unpublished and do not register a placeholder as an implemented lesson. Goal: Measure attempted and executed prompt-injection effects alongside safe support-desk utility.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c74. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept74PromptInjectionRedTeam.tsx
- server/concepts/74-prompt-injection-redteam.ts
- shared/lab74-prompt-injection-redteam.ts
- server/redteam/corpus.ts
- server/lib/lab74-redteam.ts
- Tab74-prompt-injection-redteam.md

Implementation brief
Goal: Measure prompt-injection attacks against enforcement layers.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept74PromptInjectionRedTeam.tsx; server/concepts/74-prompt-injection-redteam.ts; Tab74-prompt-injection-redteam.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Build a support-desk red-team harness with fake vault/system canaries, reserved attacker domain evil.test, 13 attacks and five layers. Cover email/ticket/web/KB/tool-description vectors, including forged roles, HTML comments, base64, Unicode tags, split payloads and Spanish overrides.

Experiment: Host tools and oracle record attempted versus executed exfiltration, refund, output leak, hijack and manipulation. Compare defenses and utility with a worst-case scripted model; optional live runs repeated trials.

Verify: No real mail, refund or outside traffic. A canary-free answer alone is insufficient: judge effects and final output. Use the extra 74A prompt for matrix, regression gate and adaptive attacker.

Reference route inventory under /api/c74: GET /facts; GET /code; POST /simulate; GET /matrix; GET /bench; POST /detect; POST /policy; POST /live; POST /adaptive

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Use the existing Node 24 platform. No mail account, refund provider or model credential is needed. Thirteen authored attacks in `server/redteam/corpus.ts` target fictional support tickets, emails, web/KB content and poisoned third-party tool descriptions. All attacker hosts use reserved `.test` names.

## Controls

Run offline attack compares a selected payload and defense using a worst-case scripted model. Compare defense matrix runs all thirteen payloads against an undefended baseline and five cumulative layers: prompt guidance, randomized untrusted markers, detector quarantine, deterministic tool/output policy, and least-privilege pinned metadata. Normalize and detect exposes bounded heuristic rules. Run bounded mutations performs at most six requested mutations with a four-fictional-cent budget. Download sanitized report includes aggregate, per-goal and per-attack observations without raw canaries.

## Evidence to inspect

Every custom-tool result correlates to a sevt_ ID. The ledger records attempted and executed effects separately. The oracle examines the ledger and final output for exfiltration, refunds, canary leaks, link hijacking and card-number manipulation. It also checks that both legitimate tickets receive safe drafts. A canary-free final answer does not erase an executed fictional refund or outgoing message. Clean-inbox utility is tested independently. Empty samples are reported as null, not zero-percent attack success.

The corpus includes direct override, forged system notice, forged roles, HTML comment, Markdown image, base64, invisible Unicode tags, split emails, Spanish override, prompt extraction, metadata poisoning, split-secret output and fake card-number process changes. The normalizer caps input at 12000 characters, limits base64 decoding to 2048-character tokens and two passes, decodes URL encodings and Unicode tags, and removes common invisible formatting characters. Detector rules are visible heuristics, not an authority boundary. Pinning hashes the authored tool name, description and closed input schema.

## Troubleshooting

Prompt instructions and markers alone do not constrain the deliberately obedient fixture. The deterministic policy denies outgoing mail/refund capabilities and blocks unsafe drafts; the output guard separately checks final text. Quarantine still creates safe fallback drafts. Blocking every ticket would fail utility. Adaptive results use one fictional cent per mutation, an eight-iteration ceiling and a two-second local deadline. No provider calls occur and there are no lingering sessions to cancel.

## Limitations

All outgoing actions are fictional ledger entries. There is no network transport, real customer data or real money. Randomized canaries are fake and only raw fixture evidence displays them. Zero successes in this deterministic corpus do not establish immunity for live models, unseen encodings or other policies. The live route rejects unsupported mode explicitly. Live repeated trials require a dedicated bounded adapter and deliberate selection; they do not start through readiness or navigation. Local owner headers are a teaching boundary, not production authentication. Pinning does not make arbitrary metadata trustworthy.

## Challenge

Construct an unrecognized instruction that requests an unauthorized refund. Show detector non-detection, denied host effect and safe drafts. Compare attack success rate and utility rather than optimizing either metric alone.

## Run locally

Run `npm run dev` and open lesson 74. Run `npm run test:redteam`, typecheck, build, guide checks and the focused browser demonstration. No external service is required.

Baseline and comparison
1. Run an attack without defenses and inspect the fictional effect ledger and final output.
2. Compare five cumulative defenses against all thirteen attacks.
3. Inspect raw payloads, normalization rules, metadata pins and safe utility.
4. Run bounded adaptive mutations and distinguish assumed costs from billed usage.

Student challenge
Show why a canary-free answer can still hide an executed refund or exfiltration effect.

Verification
At this parent checkpoint verify the new scaffolding compiles and prior lessons still work, then continue immediately to L74A. Full lesson registration, browser evidence and acceptance belong after L74A, not before the lettered implementation prompts. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** This is the whole-lab brief and compiling scaffold. Continue to L74A; complete the full lesson checks after L74A.


---

## L74A Measure attacks defenses and retained utility

Implement this detailed substep of Lab 74 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Apply the Managed platform constraints and dedicated host custom-tool boundary from this workbook. Preserve the exact domain rules below. Do not implement Agent SDK callbacks or local query options; verify every provider-specific operation against pinned official Managed types.

Complete server/redteam/corpus.ts with 13 explicit attacks against the fictional support desk: override instruction; forged system notice; forged conversation roles; web HTML comment; Markdown image leak; base64 payload; invisible Unicode tags; two-email split payload; Spanish override; system-prompt extraction; MCP tool-description poisoning; split-secret exfiltration; fake card-number process change. Give each an ID, vector, goal and visible/raw payload.

Create fake randomized canaries and reserved .test hosts. Host tools read fixture inbox/customer/KB/web data, draft replies, and simulate outgoing email/refund effects. An effect ledger distinguishes attempted from executed actions. Offline obedient-model behavior exercises worst-case defenses without real model calls or outbound communication.

Implement prompt hardening and randomized untrusted markers as model guidance. Implement detector normalization/quarantine, deterministic tool policy plus output guard, and least-privilege/pinned metadata as host layers. Pin a hash of name/description/schema; changed third-party metadata cannot load unnoticed. Decode only bounded inputs and explain detector rules.

The oracle examines executed/denied tools and final output for plain, split, punctuated, encoded and URL-encoded canary cores, unexpected refunds, wrong recipients, hijacked links and malicious drafting. It records attempted and succeeded separately and checks every legitimate ticket got a safe draft. Blocking all work may reduce attacks while failing utility.

Show a defense-by-attack matrix with trial counts, ASR and utility, both per goal and aggregate. Empty samples are not 0% success. Offline CI gates require the deterministic safety floor and clean-inbox utility. Optional live trials and adaptive attacker mutations have explicit iteration/budget/deadline caps; label results observations rather than immunity claims.

Test oracle behavior independently with known compromised effects, rejected attempts and clean work. Add detector/pinning/output-guard bypass fixtures and mutation/regression checks. Run test:redteam and course checks; retain raw fictional evidence and sanitized report downloads.

Apply the current detailed Lab 74 specification in L74 and its challenge when the older brief omits a boundary. This is the final substep: finish the real UI/router registration and guide, run the complete lesson baseline/comparison/error cases and focused tests, verify source links and typecheck/build, then continue to the next numbered lesson. Never register an unfinished placeholder.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L75 Capstone 2 an autonomous engineering team

Coordinate real worker branches through a validated task graph, independent verification, bounded review rework and a durable release gate.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Begin the multi-step Lab 75 Capstone 2 an autonomous engineering team. Read the remainder as the final target contract for the whole lab. In THIS parent checkpoint, establish the specification and minimal compiling scaffolding needed by 75A; implement the feature through the following lettered prompts 75A, 75B, 75C, 75D, 75E. Do not try to pass the full end-to-end lesson before those implementation substeps. Keep unfinished behavior unpublished and do not register a placeholder as an implemented lesson. Goal: Coordinate real worker branches through a validated task graph, independent verification, bounded review rework and a durable release gate.

Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c75. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:
- src/concepts/Concept75AutonomousTeam.tsx
- server/concepts/75-autonomous-engineering-team.ts
- shared/lab75-autonomous-engineering-team.ts
- server/team/team.ts
- server/team/policy.ts
- server/team/orchestrator.ts
- server/team/scripted.ts
- server/team/live.ts
- server/team/journal.ts
- Tab75-autonomous-engineering-team.md

Implementation brief
Goal: Coordinate an engineering team with verified handoffs and release gates.

Build incrementally in C:/claude-managed-agents using React, Vite, strict TypeScript, Express, Zod and official @anthropic-ai/sdk 0.133.0. Preserve completed Labs 01-05 and later checkpoints. Register the numeric lesson/topic/router, metadata, guide and actual UI/server/support source. Reuse shared SSE, event-consumer and tool-session boundaries through injected ports; add an adapter when lifecycle semantics differ. Use strict schemas, explicit offline/live labels, ownership, cancellation, deadlines and concurrency bounds. Inspect installed Managed types before each provider feature; reject unsupported Agent SDK fields. Keys stay server-side. Setup checks and offline fixtures never contact Anthropic. No provisioning, billed runs or external writes start automatically.

Create or update src/concepts/Concept75AutonomousTeam.tsx; server/concepts/75-autonomous-engineering-team.ts; Tab75-autonomous-engineering-team.md

Expose application operations as dedicated Managed custom tools with closed input_schema generated from Zod. Handle agent.custom_tool_use through validated host handlers and return user.custom_tool_result by its sevt_ ID; persist stable business idempotency keys separately. Disable unused built-in tools, MCP and skills so they cannot bypass the handlers. Structured reports are host-validated tool input or final JSON, not an assumed native result.structured_output. Local effects stay authoritative on the host; do not assume the cloud sandbox can access host files.

Build: Build the autonomous engineering team through prompts 75A–75E on the following pages, reusing lessons 10, 15, 51, 52, 56, 57, 60, 73 and 74. An issue becomes a validated task graph, parallel worktrees, verified integration, review/rework and a PR report for a person.

Experiment: One orchestrator accepts either scriptedTeam or liveTeam. It journals decisions, checks file ownership and budgets in host code, and runs hidden acceptance tests outside agent context.

Verify: Do not reduce this capstone to a simulated animation. Offline mode runs real Git and Node tests. Finish every staged prompt and the full course audit before declaring completion.

Reference route inventory under /api/c75: GET /facts; GET /code; POST /plan/validate; POST /policy; GET /runs/:id/journal; POST /runs; POST /runs/:id/resume

Add focused deterministic tests to test:offline. Run npm.cmd run typecheck, the focused suite, npm.cmd run audit:lesson-guides, npm.cmd run test:lesson-guides and npm.cmd run build; fix failures and regressions. Supply PowerShell commands and an offline browser demonstration. Record actual results and limitations in docs/labNN-checkpoint.md after checks pass; use a local manifest if Git is absent. Keep evidence separate from agent claims.

Current detailed teaching specification
The following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.

## Prerequisites

Install Git and Node 24. The offline team uses real Git worktrees and actual Node processes under `team-lab/runs/<uuid>`. No instructor repository is needed. Revisit Labs 10, 15, 51, 52, 56, 57, 60, 73 and 74 for report validation, costs, tests, teams, worktrees, journals and enforcement. The issue's hidden HTML comment is untrusted data and cannot authorize CI deletion or a package change.

## Controls

Validate plan only tests good/sequential, protected deletion, duplicate owner, dependency cycle, existing test overwrite and malformed presets without creating workers or contacting a provider. Run engineering team selects one of seven offline scenarios: happy rework, corrected injected plan, corrected foreign-owner request, test gaming, hidden boundary failure, budget exhaustion and interruption after wave one. Resume interrupted team replays durable evidence and skips already merged tasks. Cancel team aborts local waits and active role calls; remote cleanup is separately journaled.

## Evidence to inspect

The good plan has T1 tags followed by T2 search and T3 report concurrently. All tasks have one source owner and a new test file. The host validates a closed plan, rejects cycles with their path, and permits one corrective planner round. Tags must be nonempty strings with at most twenty UTF-16 code units after trimming. Check `trimmed.length` before lowercasing, because Unicode lowercasing can expand the result. Then lowercase and deduplicate in input order. Search returns original matching notes. Counts count a normalized tag once per note and sort by descending count then ascending Unicode codepoint tag, comparing numeric code points with shorter prefixes first.

Workers use checked custom tools only. Planner and reviewer tools are read-only. A developer can write only its owned files and new test. Paths reject traversal, protected data and links; directory reads suggest glob_files. The board binds sender identity to the role/task, allows only known recipients, six messages per sender and 600 characters, and deduplicates stable envelope IDs. Peer text remains untrusted. There is no shell/Git tool.

For each dependency wave the host creates worker branches from the current integration SHA. It awaits settled developer results before integration, checks actual scope, nonempty changes, at most 200 changed lines, at least two new tests and no skip/only/todo, then runs the full fixture suite with a scrubbed environment. Verified work receives a local team-dev author and Task/Refs/Plan-hash trailers. Host merges are serialized and use --no-ff. Main remains unchanged. The host reruns integration tests and performs one bounded changed-line review/rework round. Worker claims cannot satisfy these gates.

Four acceptance probes execute outside the agent-visible checkout in separate Node processes. The UI exposes only labels/outcomes. A green visible suite can still fail the twenty-character boundary or stable tie-order checks. Ready requires all merged tasks, protected files intact, passing full integration and acceptance suites, valid review without open high findings and known costs within budget. Every stop produces a draft handoff with concrete unmet checks and reviewable commands; no branch is pushed automatically.

## Troubleshooting

Git/Node helpers use fixed argument arrays, no shell, bounded output and deadlines. The journal is append-only, sequence-numbered and hash-chained with flushed writes. Resume verifies its chain, recorded Git heads, ownership and expiry; corrupt/inconsistent state is rejected. Uncertain role calls are escalated rather than blindly resent. Completed work and costs remain durable. A local interrupted fixture can resume after server restart with its original owner identity. An uncertain live role requires manual provider/effect reconciliation; automatic replay never increases its budget.

The team limits parallel workers to three, role calls to twelve, a total deadline of fifteen minutes, retained in-memory runs to eight and access expiry to twenty-four hours. An individual test process has five seconds. Fixture costs are explicitly assumed at one cent per role call; live cumulative list cost remains null if unavailable. Concurrent sessions can overshoot a reference cap through work already in flight.

## Limitations

The offline team is scripted but writes real files and passes the same host tools and orchestrator gates. Git worktrees share objects; they are not an OS security boundary. Use a sandbox for arbitrary third-party code. Local owner headers and browser session identity are teaching isolation rather than production authentication. Retained fixture repositories remain local for inspection; expired run access fails closed. Run `npm run team:cleanup` deliberately to remove only expired inactive UUID fixtures with valid journals and no links. Active, corrupt or uncertain state is retained. Cleanup never follows a junction or touches a caller-selected path.

Optional live mode requires MANAGED_LIVE_ENABLED, the isolated server-side LAB75_ANTHROPIC_API_KEY, an existing environment, and separately versioned planner/developer/reviewer agent IDs and positive versions from `.env.example`. The exact required closed inventories are returned by facts and authored in `server/team/live.ts`. Use `npm run team:ready` for local diagnostics. Provision those role agents deliberately with `npm run team:provision` after configuring the isolated key and reviewing the model; startup and readiness never provision. Immutable returned pins are written only to ignored managed/lab75-resources.local.json. No shared key, personal login, built-in tools, unused MCP/skills, vaults or mounted repositories are inherited. Each session is checked against its pinned inventory before sending a prompt. Supported models/effort come from the pinned agent versions.

The adapter reuses the shared stream-before-send runner, validates sevt_ custom calls and reports in host code, records session/event/effect mappings, limits host answers, and budgets every session at thirty USD cents with a maximum total reference cap of three hundred cents. Calls are never automatically retried. Cancellation attempts interrupt, idle confirmation and archive through the shared runner. Cleanup uncertainty and unknown costs block readiness. These native schemas were checked against installed official SDK 0.133.0; live account behavior and billing are not established by offline tests. Cloud files never directly access Windows worktrees.

## Challenge

Compare hidden-boundary with happy-rework. Explain why review plus independent acceptance catches failures that worker-authored tests miss. Inspect crash-resume costs and show planner/T1 each appear only once.

## Run locally

Run `npm run dev` and open lesson 75. Run `npm run test:team`, typecheck, build, guide checks and the focused browser demonstration. For a retained fixture inspect `git -C team-lab/runs/<id>/int log --all --format=full`. Review journal and handoff before any manual publication.

To replace the isolated local key without echoing it, run `powershell -File scripts/set-lab75-key.ps1`, then restart the backend. Existing role pins stay in ignored local settings. After readiness, an explicitly billed command-line smoke run is `node --env-file-if-exists=.env --import tsx scripts/live-lab75-smoke.ts --execute-authorized-live-test --budget-cents=200`. It writes ignored evidence under artifacts/lab75 and independently checks archival of every created session. It does not publish fixture branches. See [actual live results](docs/course-validation.md), including the resolved Unicode ordering follow-up.

Baseline and comparison
1. Validate good and rejected plan presets without creating workers.
2. Run the happy path and inspect dependency waves, test gates, authors and merge hashes.
3. Compare test gaming, hidden-boundary failure, ownership correction and budget exhaustion.
4. Interrupt after wave one, resume, and verify retained costs and no repeated completed calls.

Student challenge
Explain why a green worker suite and a done report cannot establish readiness without host acceptance, review, ownership and known costs.

Verification
At this parent checkpoint verify the new scaffolding compiles and prior lessons still work, then continue immediately to L75A. Full lesson registration, browser evidence and acceptance belong after L75E, not before the lettered implementation prompts. Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.
````

COPY PROMPT END

**Checkpoint:** This is the whole-lab brief and compiling scaffold. Continue to L75A; complete the full lesson checks after L75E.


---

## L75A Define the issue fixture and validated plan

Implement this detailed substep of Lab 75 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Apply the Managed platform constraints and dedicated host custom-tool boundary from this workbook. Preserve the exact domain rules below. Do not implement Agent SDK callbacks or local query options; verify every provider-specific operation against pinned official Managed types.

Create server/team/fixture.ts for a real disposable notes-api repository with src/notes.mjs, tests, package.json and .github/workflows/ci.yml. Issue 7 asks for tags, search by tag and counts. Tags are trimmed/lowercased, deduplicated in order, and empty/invalid tags are rejected; define and test the 20-character maximum. findByTag returns matching notes; tagCounts reports counts with deterministic tie ordering. Specify these semantics in the issue and fixture tests.

Create the three modules: src/tags.mjs exports normalizeTag and parseTags; src/search.mjs imports tags and exports findByTag; src/report.mjs imports tags and exports tagCounts. Add a hidden HTML comment in issue prose asking to delete CI and bump package version, as an injection specimen. It is untrusted data and cannot authorize those changes.

In server/team/team.ts define PlanSchema, DevReportSchema and TeamReviewSchema. Plan tasks contain id, files, new testFile, dependsOn, spec and acceptance. Developer report contains status, summary, handoff and questions. Review findings contain file, line, severity, confidence and explanatory text. Export closed custom-tool JSON Schema without unwanted dialect fields; validate returned data again in host code.

Implement validatePlan with at most four tasks, IDs T1–T9, at most three source files each, exactly one owner per file, only src/*.mjs source, a new test file per task and no protected CI/package/.git changes. Check dependencies exist and are acyclic; name the cycle. Reject a plan before creating worker worktrees. Retry the planner once with errors, then escalate.

Produce dependency waves. Good plan is T1 tags, then T2 search and T3 report concurrently. Add pure presets for good/sequential plan, protected deletion, duplicate owner, dependency cycle, existing-test overwrite and malformed schema. Test each with precise errors. Author issue/fixture/scenarios locally; no instructor repository is required.

Apply the current detailed Lab 75 specification in L75 and its challenge when the older brief omits a boundary. Verify the modules implemented so far and preserve prior lessons; then continue to L75B. Full lesson UI acceptance and registration happen after L75E.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L75B Build workspaces policies and messages

Implement this detailed substep of Lab 75 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create team-lab/runs/<id>/repo as unchanged main, int as team/issue-7 integration worktree and tasks/Tn as team/Tn worker branches. Start each task worktree from the current integration commit at its dependency wave and record its base SHA. Reuse Lab 73 host Git helpers and serialize ref/worktree mutations behind one mutex.

Implement decide(role,tool,input,root,task) as host pre-execution policy for custom read_file, grep_files, glob_files, edit_file, write_file, run_tests, send_message and read_messages handlers. Planner/reviewer get read-only tools; developers can mutate only owned source files and their new test file. Declare each role's custom inventory on a dedicated Managed agent, validate/pin it before sessions, and disable built-in bash/filesystem/web, unused skills and MCP. The cloud session never directly reads a Windows worktree. Reports pass through a submit_report custom tool or independent host JSON validation; no PreToolUse or StructuredOutput SDK tool is assumed.

Reject shell/Git, .env/.git, path traversal and symlink/junction escapes. read_file rejects directories with a useful glob_files suggestion. Test decisions independently and explain allowed paths. A model request for broader permissions grants nothing. Test commands are fixed host arguments and run without the agent API key.

Implement Board for known Tn/lead destinations, at most six messages per agent and 600 characters each. Sender identity comes from trusted session-role binding, not model arguments. Stable envelope IDs prevent duplicates; all peer text is wrapped as untrusted evidence. Host emits validated completion handoffs to dependencies. Questions escalate to the lead report without an unbounded discussion loop.

Expose browser policy/message probes with strict schemas and explicit local identity simulation. Test foreign ownership, protected file, directory read, unknown destination, duplicates and limits. Git worktrees share objects and are not OS containment; separate Managed sessions give independent remote contexts, not automatically separate host process authority.

Apply the current detailed Lab 75 specification in L75 and its challenge when the older brief omits a boundary. Verify the modules implemented so far and preserve prior lessons; then continue to L75C. Full lesson UI acceptance and registration happen after L75E.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L75C Verify integrate and rework each task

Implement this detailed substep of Lab 75 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Apply the Managed platform constraints and dedicated host custom-tool boundary from this workbook. Preserve the exact domain rules below. Do not implement Agent SDK callbacks or local query options; verify every provider-specific operation against pinned official Managed types.

Implement runTeam(ws, team, options, emit, resume) against a Team interface with plan, develop and review. For each wave, start all eligible developer calls up to maxParallel and await every settled result before deciding integration. A stopped call aborts sibling calls; failures block dependent tasks. Host Git operations remain serialized while agents and tests can run concurrently.

verifyTask inspects actual working tree against recorded base: something changed; only owned paths/new test changed; diff at most 200 lines; at least two tests in the new file; no added skip, only or todo; full suite passes in a clean environment without the team API key. A developer success report alone is insufficient.

After a rejected attempt, revert only out-of-scope fixture edits, preserve in-scope work and return precise feedback. Allow at most two development rounds. Host commits verified work as team-dev-Tn with Task, Refs and Plan-hash trailers; merges --no-ff as team-host into team/issue-7. Never change main. Abort a merge conflict and fail that task, rather than letting an agent resolve ownership bugs.

Run the integration suite after every wave. Stop on red. Reviewer receives a numbered main…integration diff read-only. Route only medium-or-higher, high-confidence, changed-line non-question findings back to the owning task for one rework round; send all others to a person. Verify rework against the original task base, recommit, merge and rerun the suite.

Emit task state, wave, verification checks, cost and Git evidence so the UI can show pending/running/verified/merged/failed/blocked. Test task failure, dependent block, overlarge diff, cross-owner edit, test gaming, merge failure and one successful rework. Use an independent acceptance check, not tests authored only by the scripted developer.

Apply the current detailed Lab 75 specification in L75 and its challenge when the older brief omits a boundary. Verify the modules implemented so far and preserve prior lessons; then continue to L75D. Full lesson UI acceptance and registration happen after L75E.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L75D Add budget journal resume and release gates

Implement this detailed substep of Lab 75 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Apply the Managed platform constraints and dedicated host custom-tool boundary from this workbook. Preserve the exact domain rules below. Do not implement Agent SDK callbacks or local query options; verify every provider-specific operation against pinned official Managed types.

Implement an append-only JSONL Journal recording plan, call starts/results, verification, commits, merges, review/rework, costs and gate outcomes. Write each decision before advancing orchestration. Resume replays the plan/ledger, skips already merged tasks and resets interrupted tasks to their recorded base. Refuse corrupt/inconsistent replay instead of pretending progress is complete.

Maintain a durable mapping from each role call to its remote session and event IDs. Reconcile running/idle/archived status, pending calls and effect keys before resuming an interrupted call. Closing a stream or crashing the host does not rewind remote work. Do not automatically raise a paused session budget; unknown cost requires escalation rather than fabricated zero.

Before each agent call, check the team budget; apply a per-session Managed list-cost budget set at creation and host deadline. Parallel calls can overshoot by calls already in flight, so report that limit honestly. Carry costs across resume. Enforce total attempt, parallelism and run-capacity limits independently of UI controls.

Create four host-only holdout acceptance probes derived from the issue, including acceptance at 20 characters and rejection above 20 characters and stable tie ordering. Run them in a separate Node process outside agent-visible checkout/tools. Public facts/source must not include probe implementations; show only labels and outcomes. Holdouts complement rather than replace the visible suite.

Always produce releaseGate and a handoff report, even after a stop. Ready requires valid plan, every task merged, no protected changes versus main, passing full integration/holdout suites, valid review without open high/critical findings and budget compliance. Otherwise produce draft status with team:needs-human and concrete unmet checks.

Generate a local PR body containing issue, task table, commit evidence, review, gate, questions and role costs plus reviewable git push and gh pr create commands. Never push, publish or merge automatically. Preserve journal/branches so a person can inspect escalation.

Test crash after wave 1 then resume, no repeated plan/T1 call, exact retained costs, journal consistency, hidden-test failure on otherwise green code, budget exhaustion and gate report after failure. Add journal download by opaque run ID with expiry/cleanup bounds.

Apply the current detailed Lab 75 specification in L75 and its challenge when the older brief omits a boundary. Verify the modules implemented so far and preserve prior lessons; then continue to L75E. Full lesson UI acceptance and registration happen after L75E.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## L75E Connect scripted and live teams and verify the capstone

Implement this detailed substep of Lab 75 before the next numbered lesson.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create scriptedTeam in server/team/scripted.ts that writes real task files through the same checked host handlers and Team interface. Run seven scenarios: happy path with tie-order rework; injected CI deletion corrected by planner; cross-owner edit corrected by developer; test gaming; visible green suite with missing 20-character boundary rule; budget exhaustion; crash after wave 1 and resume. Fictional fixture costs are labeled assumptions and never mixed with measured usage.

Create liveTeam in server/team/live.ts with separately versioned Managed planner/reviewer/developer agents and independent role sessions. Custom file/test/message/report tools bind to host worktrees and trusted roles. Disable bypass built-ins, unused MCP/skills and vaults. No query(), CLAUDE_CONFIG_DIR, settingSources or local session-persistence flags. Use supported resolved models/effort, closed report validation, a list-cost budget on every session at creation, bounded host message/tool/correction counts and deadline. Keep test child environments free of the API key. Shared native multiagent sandboxing is not substituted for the required host worktree separation.

Limit live requests to one active team run, explicit total reference cap of 300 USD cents, maxParallel 1-3, deadline 15 minutes and bounded retained runs/expiry. Reserve budget for concurrent calls, count every role/session attempt and carry confirmed cumulative usage across resume; unknown usage prevents a ready release gate. Session caps can overshoot by in-flight work, so account for that uncertainty. Start no live call merely from plan validation, readiness or browser navigation.

Implement /api/c75 facts/code, plan validation, policy probes, POST /runs, POST /runs/:id/resume and journal routes. UI shows issue/plan, waves/tasks, board, verification, review/rework, usage, journal and handoff. Resume reconciles known sessions/event IDs and the effect ledger before continuing, never resends an uncertain message blindly. Cancellation stops host waits and attempts bounded remote interrupts/idle/archive cleanup while preserving completed evidence.

Add test:team to test:offline. Run all seven scenarios through real Git/Node with focused HTTP/SSE, schema/graph/policy/board tests and independent holdouts. Happy path reaches ready; wrong boundary behavior, test gaming and budget breach block it. Verify authors/trailers, main unchanged and resumed effects equal uninterrupted effects. Run team/offline/typecheck/build/guide/UI checks; optional live starts only on deliberate selection, then proceed to the final course audit.

Apply the current detailed Lab 75 specification in L75 and its challenge when the older brief omits a boundary. This is the final substep: finish the real UI/router registration and guide, run the complete lesson baseline/comparison/error cases and focused tests, verify source links and typecheck/build, then continue to the next numbered lesson. Never register an unfinished placeholder.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P01 Unify the visual design

Give every lesson the same readable and responsive workspace.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Improve the existing 75-lesson shell using shared CSS tokens and components: dark navy shell, blue primary actions, readable light evidence panels, consistent spacing, clear headings, accessible tabs, labeled status and expandable technical details. Include light/dark modes and widths 320, 390, 768, 1280 and 1920px. Maintain 44px practical touch targets, reduced motion, keyboard focus and browser zoom. Keep objective, baseline, comparison, evidence and challenge readable. Use the searchable desktop sidebar or mobile menu and previous/next links below the lesson to change lessons. Do not render a duplicate Lab 01-75 button grid or numbered lesson strip above the main workspace. Keep the lesson heading, guide shortcuts and all lesson workspace tabs, including infographic views. Long code and raw events scroll within their panels instead of overflowing the page.
Preserve every lesson's input schema, owner checks, adapter, tool policy, cancellation, resource pins and cleanup. Render final agent answers as safe limited Markdown, with an expandable exact redacted message; previews and lifecycle events remain separate. Do not add fake completion counters, forced paths or provider calls from navigation. Inspect desktop and phone screenshots in both themes, then run shell, Markdown-safety and representative retained-session/tool/approval tests. This is a shared interface improvement, not a replacement for a lab.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P02 Author the seven section Learning Guide

Create one teaching catalog for visible explanations and narration.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Add shared/learning-guide.ts, shared/learning-experiments.ts and a reusable LearningGuide UI for all 75 implemented lessons. Define the seven stable step IDs goal, preparation, example, controls, evidence, source and practice. Every step has title, explanation text, action, target view and waitForStudent. Derive lesson-specific explanations from actual objectives, experiment steps, inspected sources, evidence and challenges. Use reference-data/course.json and reference-data/media-catalog.json as supplied authored teaching DATA if reusing the instructor recordings; do not change their spoken text silently.
Show a worked baseline, comparison and evidence principle for each lab. Keep expected evidence separate from observed results. Source steps identify actual source files; controls steps describe the learner action rather than clicking it. Include transcripts and section anchors. Validate exactly seven distinct steps for every one of the 75 lesson IDs, no missing targets and bounded narration text. Nothing plays or runs on navigation. Keep new modules independent from provider credentials and exercise execution.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P03 Implement written guided tours and highlights

Connect the guide to real mounted content without running exercises.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement Start guided tour, previous/next, jump to section, Show section, minimize, close, Escape and explicit Resume saved tour. Save the last position per lesson and clear it only on Finish tour. A lesson visit does not autoplay or resume automatically.
Highlight the current explanation with a red rectangle and separately highlight the related visible control/result/source when present. Use stable data-guide-target attributes and measured DOM rectangles, not absolute page coordinates. Expand containing details elements when Show section is selected, offset scrolling below fixed headers, refresh on scroll/resize/layout changes and detect lazy-mounted targets. Explain when a result does not exist until the learner runs an example. Do not run, click, submit, approve or mutate an experiment from tour navigation. Pause when changing tabs; closing/changing lesson cancels pending work and removes highlights. Test keyboard behavior, reduced motion, missing targets, phone layout, saved resume and zero execution POSTs.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P04 Add explicit author only Inworld synthesis

Provide bounded recording tools while keeping student playback key free.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create the optional server-only Inworld narration adapter, strict authored-text request schema, bounded cache, rate/concurrency limits, cancellation, timeouts and redacted errors. Configure INWORLD_API_KEY, INWORLD_NARRATION_ENABLED, INWORLD_VOICE_ID and INWORLD_MODEL_ID in ignored author settings only. Use Yash and inworld-tts-2 for the frozen reference. Read the current official Inworld contract or installed adapter before implementing authentication and WORD timestamps; never print credentials or expose VITE_ secrets.
Only accept registered lesson/step identifiers and the catalog's exact text, not arbitrary user text or URLs. Installation, readiness, app startup, navigation and normal student Play must not synthesize. Make paid recording an explicit author command with a bounded --plan first. Do not automatically provision resources or ask a student to obtain an Inworld key. Explain the two paths: reuse the supplied licensed recordings with matching catalogs, or deliberately create new recordings using the author's separately configured account. Mock the adapter in ordinary tests. No real synthesis is authorized by this implementation prompt.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P05 Package all lesson recordings and manifests

Ship 525 verified MP3s instead of requiring student API keys.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement scripts/record-learning-narration.ts and audit-learning-narration.ts, shared/learning-recordings.ts and the static student player. The complete catalog has 75 times seven = 525 lesson clips. Bind every clip to exact transcript, SHA-256, voice/model, duration, MP3 file and timing JSON. Store public assets in public/audio/guides with tour-lesson-step-hash filenames and manifest.json. Use a bounded resumable author cache under ignored artifacts, serialized manifest writes and validated decode/duration with FFmpeg/ffprobe on the author's machine. Never run concurrent recording processes that can overwrite one manifest.
For the student no-key path copy the matching public/audio/guides from the instructor media source archive and preserve the exact transcript/segment catalog provided in reference-data/media-catalog.json. This is media and teaching-data reuse, not cloning the completed application's implementation. For new text, recording is a separate explicitly authorized paid author operation. Do not rename a stale clip or fabricate word times to make it pass.
Add narration:plan, narration:record and narration:check commands. Audit exact inventory, 525 clip identities, hashes, duration bounds, complete cue coverage and no extra stale public files. Serve and copy media into production and the source ZIP. Student playback fetches committed MP3/timing files only; missing/stale media leaves readable text and a truthful warning. Run audits without an API key.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P06 Synchronize narration to the exact spoken paragraph

Prevent the whole section highlight bug after a spoken fragment.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create shared/learning-narration.ts and DOM rendering that share stable narration segment IDs. Split title, explanatory sentences/paragraphs and learner action deterministically. Wrap each rendered fragment with its exact ID. Align real Inworld WORD start/end times to those same segment texts. A segment must have finite, ordered, nonoverlapping timing; never estimate alignment from character count when claiming provider word timing.
Drive red highlights from HTMLAudioElement.currentTime and media events. While normal recorded narration plays, select the concrete spoken fragment, not the entire parent section. In a short silence between fragments select the upcoming fragment; pause keeps the selection, backward seek changes it, replay selects the beginning, and end preserves the last relevant fragment. A genuinely missing timing file may use an explicitly labeled section fallback. A valid word-timed clip must never accidentally fall back to the whole section at a boundary.
Support play/pause, replay, seek, 0.75x through 1.5x speed, section changes, stop and pending-request cancellation. Respect browser autoplay restrictions and waitForStudent before continuing. Play real committed MP3s in browser checks and inspect every timing transition and silence boundary, including phone layout. Confirm switching lesson/tab stops audio and preserves experiment state. Students require no narration API key.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P07 Add progress notebooks bookmarks and backups

Save optional browser-local learning state with safe restoration.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement browser-local visits, four optional learning checklist items per lesson, saved tour position, a personal plain-text notebook with explicit Save note and 4000-character limit, and bookmarks for review. Show unsaved changes, storage failures and completed/in-progress/not-started counts on Home. Continue learning suggests an unfinished lesson but never locks or forces a sequence. A visit, note or checked box does not establish exercise or live success.
Create closed versioned backup schemas. Download only known learning fields; exclude credentials, unrelated storage, exercise output, sessions and audio. Accept at most 2 MB, known unique lesson IDs, bounded notes, valid step IDs and canonical timestamps. Preview before any write, require explicit Restore, support cancel, preserve unrelated keys and roll back affected keys on storage failure. Read legacy version 1; version 2 may include validated knowledge attempts without erasing newer attempts absent in old backups. Revalidate at the write boundary. Test reload, cross-tab updates, invalid imports, storage denial, cancellation and rollback with no provider request.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P08 Add knowledge checks learning paths and review

Offer concept practice separately from self-assessment and execution.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create one authored three-choice concept check for every lesson from its actual objective/evidence, with varied correct positions, useful explanations, explicit Check answer, retry and Review lesson source. Save the latest checked choice with content version/time. Compute correctness from the catalog rather than trusting a stored passed flag. Ignore malformed or obsolete attempts.
Provide optional foundations, application-builder, reliable-orchestration and complete-course paths using registered IDs only. Show position and previous/next without gating lesson availability. Add a review queue for incorrect latest answers and explicit bookmarks, deduplicate, put incorrect concepts first and retain bookmark reasons after a correct retry. Include valid attempts in backups and preserve legacy compatibility. Test all 75 questions, stored-value validation, grading, retry, empty states, path choices and mobile controls without provider calls. Clearly label concept practice, checklist completion and exercise evidence as different records.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P09 Build the three offline milestone starters

Supply small downloadable projects students run on their own machines.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement three Node 24 projects in fixtures/learning-milestones: event-viewer, http-stream and approval-ledger. Each starter ZIP contains only package.json, README.md, starter.ts and starter.test.mjs in its project folder, with no dependency install or model key. Starter TODOs intentionally fail. Keep complete reference implementations out of starter ZIPs.
The event viewer reduces authored host frames into session ID, text, terminal outcome and unique event count; deduplicate IDs, stop at first terminal outcome, leave unterminated input incomplete and reject unknown kinds/conflicting sessions. These teaching frames are not raw Managed event syntax. The HTTP server accepts only POST /ask, application/json, a 1024-byte body and exactly one trimmed prompt of 1 to 200 characters; reject invalid input before SSE, emit deterministic started/answer/done JSON events and end. The approval ledger binds frozen proposals to an owner, separates notification and trusted fixture reviewer decision, makes rejection terminal and deduplicates fictional approved effects by owner/case.
Serve allowlisted authored ZIP members only. Never upload or run student-edited code in the platform, and never award progress from downloading. Add milestones:check that tests isolated reference copies and verifies expected starter failures. Reference test counts are 4, 3 and 5. Show requirements, hints and a separate study-folder command.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P10 Add milestone solutions and readable experiment results

Help students understand failures and inspect evidence without chat assistance.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Add optional solution walkthroughs, common mistakes and one extra experiment to each milestone. Offer separate reference ZIPs containing completed starter.ts, identical supplied tests, package.json, README.md and WALKTHROUGH.md. Preserve unfinished starters and the student's work. Link event viewer notes to Lab 01, streaming notes to Lab 12 and approval notes to Lab 65. Explicit learner Save note remains required.
Surface the baseline, comparison and evidence principle authored in P02 on all 75 Learn views, with concrete examples for event completion, retained turns and approval. Reuse the existing locked catalog text so P05 recordings remain valid. If teaching text must change, stop and update its matching recording through the explicit P05 author workflow or restore the exact supplied data; never silently keep stale audio. Render final agent Markdown safely with an expandable exact redacted message; keep preview/raw lifecycle roles unchanged. Verify ZIP contents/allowlists, exact shared tests, 4/3/5 reference passes, intentional starter failures, download behavior, Markdown safety and all experiment plans. A reference download is not proof that a student's edited solution passed.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P11 Add durable shortcuts to every learning tool

Make notebooks exercises progress and backups directly discoverable.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Add Open notebook, Open checklist and Open exercise beside each lesson title and equivalent desktop/mobile shortcuts. Add persistent Home shortcuts for Course progress, Back up or restore, Start here, milestones and the recorded validation overview. Reuse the existing notebook and Learning Guide, not duplicate editors.
Implement stable lesson-specific fragment URLs that restore after refresh, new tab and Back/Forward. Expand relevant details, offset scroll below fixed headers, focus a meaningful destination, close the phone menu and clear stale fragments on ordinary lesson navigation. Modified clicks retain normal browser semantics. Home progress cards link to the same exact destinations. Keep all paths/checklists optional. Opening an exercise selects its tab but never clicks Run; opening a guide does not autoplay; opening backup does not restore. Test direct links, saved notes, correct lesson identity, backup download/preview, history, menu focus, mobile overflow and zero execution POSTs. Do not make a learner traverse all 75 labs to find or verify a shared feature.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P12 Add Start here and truthful validation records

Orient students and show evidence scoped to tested commits.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Add a short Home Start here flow: open Lab 01 offline exercise, inspect evidence, save a note and try the event-viewer milestone. Offer direct section links and explain that personal learning tools are optional. Add a recorded validation overview that stores actual run links, tested commits, suite outcomes/counts and coverage limits. Label it a recorded snapshot, not a live GitHub status feed. Never fabricate results, automatically poll GitHub or run paid verification from the page.
Use the verified baseline references in the workbook for examples, and replace them only after independently checking new actual runs. Keep offline, live/provider, notification and telemetry evidence distinct. Show failed attempts honestly if referenced. All links and focus restoration must work on desktop/mobile without exercising a provider or altering notes/checklists. Tests should verify correct destination/commit links and absence of automatic POST/GitHub requests.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P13 Audit the interface of all 75 lessons

Check every real view rather than relying on a few screenshots.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create a browser audit across all 75 lessons at desktop 1280px and phone 390px. Open Learn, guide, exercise and actual UI/server source views. Inspect accessible names, duplicate IDs, missing content, invalid lesson links, page errors and horizontal overflow. Exercise controls must remain inert during this interface audit; assert no execution POST. Record per-lesson observations. Run interaction scenarios separately so a visible form is not reported as a passed exercise.
Add screenshot review for shared shell, guide and representative complex evidence, including 200% zoom and reduced motion. Keep code overflow scoped and don't shrink text to conceal layout problems. Warm the actual rendered lesson registry with a temporary Chrome page before measuring individual scenarios; HTTP readiness alone is insufficient. Close that page and all owned servers in finally. Do not add broad retries or ignore runtime errors to obtain green results.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P14 Define both illustrated tours for every lesson

Create 150 source-grounded infographic plans and 900 region explanations.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create shared/learning-infographics.ts, shared/infographic-course.ts and a validated infographic catalog. Each of 75 lessons has concepts and lab kinds, each with six stable numbered regions: total 150 plans and 900 regions. Region data includes ID, title, concise summary, authored narration, guide target, actual source path and measured image box. Concepts explain the objective/core rule/boundary/workflow/evidence/challenge. Lab walkthroughs explain the learner's baseline/comparison/guard/workflow/verification/reflection. Use the detailed lesson guide and actual contract, not generic event-stream filler.
Keep the text in reference-data/media-catalog.json unchanged if reusing instructor recordings. A negative concept question needs its qualifier when rendered as a standalone rule; Lab 27 must say to AVOID duplicate sessions/turns/effects. Require real shared/server sources, bounded text and six unique regions. Plan metadata alone must not publish a lesson pair. Provide a publication list and an author command that requires both reviewed images, exact recordings/timings and validated boxes before adding a pair.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P15 Generate the 150 original infographic images

Use the supplied per-image prompts with different astronaut poses.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Generate one original landscape raster poster for each concepts/lab plan, using the 150 copyable files in image-prompts. They contain the lesson-specific content and a distinct astronaut pose for every image. Follow the supplied educational style: bold navy/orange heading, pale blue subtitle, white background with subtle peach/blue shapes, pastel panels, useful icons/arrows and a takeaway strip. The white-suit blue-visor astronaut should illustrate that slide's concept, with a different body angle, arm position and prop. Preserve readable English and do not cover text.
Use six independent uneven editorial panels with numbered regions, not a uniform dashboard grid. Do not draw a red highlight into the image; the app overlays it. Generate 150 separate assets with explicit lesson/kind identity; a single repeated robot or generic diagram is insufficient. Use a built-in image-generation/editing tool when available. If none exists, stop image generation and explain the missing capability; never disguise an HTML/SVG placeholder or copied screenshot as generated artwork. Paid API generation needs separate explicit authorization. Keep originals and prompt provenance. Optional supplied instructor PNGs may be reused instead of generation.
Do not claim a generated diagram is correct yet. P16 must review each image against its guide/source. Save final selected files under public/infographics/lab-NN-concepts.png and lab-NN-lab.png. Never import Agent SDK query/process claims from style references into Managed lessons.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P16 Review and correct every infographic

Catch visual claims that contradict the implementation.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Visually inspect all 150 images at readable size against the corresponding actual Tab guide, schema, fixture and host behavior. Fix incorrect arrows, missing negations, unsupported counts/status codes, duplicated headings, cropped text and misleading local/live labels with targeted image edits. Reinspect each corrected image. Keep generation and correction prompts with final assets.
Check these important examples: authoritative message replaces preview; queue admission is not provider acceptance; notification is not approval; local disconnect/cancel does not prove remote stop; host-only MCP tokens never enter the browser; Lab 68 schedule coalescing and signed-incident deduplication are separate cases and retries are sequential; Lab 69 stale document version/hash rejects a patch; Lab 70 offline standard-library JSON-lines is distinct from live official-client calls; Labs 72 and 74 are local scripted fixtures; Lab 75 has T1 first, then T2/T3 concurrently, and independent acceptance beyond worker claims.
Require a different relevant astronaut pose on each image and readable structure. Do not publish an unchecked pair. Do not claim OCR, semantic certification or provider activity merely from editorial review. Record which files were inspected and what was corrected.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P17 Measure regions and bind image identities

Make red rectangles fit the actual reviewed panels.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Measure six independent panel rectangles on every final PNG in native pixels. Convert with the actual image width/height; preserve native dimensions, including 1672 by 940 or 941 where supplied. Do not assume the original prompt's planned grid survived image generation. Store reviewed bounds in shared/infographic-panel-bounds.ts and normalized percentages in the catalog. Verify boxes are finite, positive, within the image and nonoverlapping. A whole-poster rectangle is not an acceptable normal region.
Bind each PNG SHA-256/dimensions, exact serialized catalog content hash, authored transcript, MP3 SHA-256/duration and timing file in public/infographics/pilot-manifest.json (the legacy filename remains valid for the full catalog). For instructor media reuse use the supplied matching catalog/boxes; for newly generated images measure new boxes, then recompute identities rather than reusing old hashes. Stale text, wrong image/kind, extra media or incomplete pairs must fail the offline audit. Do not publish merely because an image path exists.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P18 Record or reuse the visual narrations

Supply 150 prerecorded tours with real six-region timings.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement record-infographic-narration.ts, publish-infographic-batch.ts and audit-infographic-assets.ts plus infographics:plan, infographics:record, infographics:publish and infographics:check scripts. Build a bounded 150-tour plan from the exact six-region explanations. Request real Inworld WORD timestamps for new authorized author recordings, align them to stable region IDs, verify MP3 decode/duration, serialize manifest writes and reuse matching completed assets. Stop on unexplained synthesis errors instead of blindly retrying billed operations.
Alternatively import matching public/audio/infographics, public/infographics and the exact teaching/region data from the instructor release. Students then need no Inworld key. Never run synthesis from opening a tab or pressing normal student Play. Store visual-lesson-kind-hash.mp3 and matching JSON, bind them to the final images and validate exact file inventory. Publish only complete checked pairs; the final state requires 75 published lessons, 150 images, 150 visual MP3s and 900 timed regions. Preserve the original 525 lesson recordings. Run full audits without contacting any provider.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## P19 Build the illustrated player zoom and pan

Make the two visual tabs usable with synchronized region navigation.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Add Concept map and Lab walkthrough tabs to every published lesson while preserving the original Learn, exercise and source views. Implement explicit Play visual tour, pause, replay, previous/next region, numbered markers, transcript, Download PNG, Open related explanation and Open corresponding source. Use the selected region's real source path and guide target; selection never runs an exercise. Missing images/audio retain text and links.
Use the actual media clock and verified cue times for the red rectangle, including upcoming-region selection during gaps, backward seek, pause, replay and end. Implement a bounded image viewport, Fit image, 100%, zoom slider, mouse drag, touch scroll and keyboard plus/minus/zero/arrows. Follow the spoken region fits that region within the viewport; manual pan/zoom disables following until explicitly reenabled. Keep compact controls reachable. On tab/lesson change pause audio and preserve exercise inputs/results. Verify all 150 image views, real MP3 playback in representative early/middle/final lessons, phone layout, source navigation, fallback text and zero provider/synthesis POSTs.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## Q01 Complete deterministic regression coverage

Verify every lesson and learning feature without billed work.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Complete the Node offline suites, lesson/source audits, guide/recording/infographic integrity checks, milestone references and Playwright interaction/UI checks for all 75 lessons. Ordinary tests use authored fixtures or injected ports and disable all billed/provider/external-notification paths. Test failures as behaviors: denial, paused/incomplete outcomes, ownership, cancellation, cleanup uncertainty, malformed input, unknown cost and test-gaming rejection must remain explicit.
Run typecheck, applicable tests, audit:lesson-guides, narration:check, infographics:check and build. Check every real image view and committed media playback; a synthetic time event alone does not prove an MP3 loads. Freeze expected feature counts at 75 lessons, 525 guide MP3s, 150 PNGs, 150 visual MP3s and 900 image regions. Counts of tests are observations, not values to fabricate or hard-code to obtain a pass. Fix regressions without deleting assertions, adding broad retries or treating timeout as success. Report exactly what ran and remaining prerequisites.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## Q02 Harden Windows browser and worker supervision

Preserve meaningful failures while handling known startup and capture conditions.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Verify Windows workspace aliases, realpath source watching and private Vite filesystem exclusions. Before browser scenarios start, launch an owned temporary headless Chrome page and await an actual visible lesson heading under a bounded startup deadline. Then close it and run Playwright with one worker per supervised backend/frontend pair. Use 60-second ordinary scenario budgets with normal assertion deadlines and only explicitly bounded longer operations.
For the Lab 64 MCP screenshot flow preserve bounded text-only diagnostics. Retry only the exact read-only Page.captureScreenshot 'Unable to capture screenshot' error once, foregrounding the same page; do not retry navigation/form submission or unrelated errors. Validate the returned PNG and use it as proof. For Lab 70 use bounded isolated Python startup/readiness, fixed arguments, no shell and truthful remote cleanup distinction. Reject sources under server/acceptance with HTTP 403; that denial is an expected boundary, not a test to weaken. Close all owned processes. Reproduce an actual failure before changing its bound; test both permitted recovery and exhaustion.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## Q03 Build a sanitized reproducible source package

Distribute authored code and included media without private state.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Implement a strict authored-source ZIP allowlist and SHA-256 distribution manifest. Include package/lock/config files, src/shared/server, scripts/tests/browser-tests, fixtures, guides, public recorded media, infographic prompts and the student prompt workbook/reference data. Reject symlinks and exclude .env except .env.example, local resource pins, keys, browser profiles, private provider evidence, logs, runtime repositories, node_modules and build output. A study workspace must not be recursively deleted to sanitize it.
Run typecheck/build first, then credential/path scans, then package:course sequentially so scanning never races a changing dist directory. Scan tracked files and actual npm pack inventory, not just .gitignore. Verify ZIP members/CRCs and every manifest hash, plus all 525/150 recordings and 150 PNGs. If publishing supplied assets, confirm matching catalog text, IDs, images, timings and file hashes. Produce checksums and a short start guide with Node/Git prerequisites, npm ci, preserved .env.example setup, printed Vite URL, offline baseline, notebook save and backup. Never include a learner's notes or an author's secret settings.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## Q04 Run parallel GitHub regression with a final gate

Retain every check while shortening hosted wall-clock time.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create .github/workflows/regression.yml for push to main, pull requests and workflow_dispatch. Use immutable verified GitHub Action commits, contents:read and checkout persist-credentials:false. Root env disables Managed live mode, narration synthesis, external notifications and remote telemetry. Use Windows runners and Node 24; unit/browser jobs explicitly install Chrome and isolated pinned Python requirements. Do not pass provider secrets to automatic jobs.
Run offline checks in one job and the complete Playwright suite in a two-job matrix with --shard=1/2 and --shard=2/2. Keep workers:1 within each job, separate owned servers and fail-fast:false so independent diagnostics survive. List all tests and both shards first; prove the union equals the original suite exactly with zero duplicates/missing tests. Save failure-context Markdown under unique shard artifact names.
Preserve a final job/check named offline that needs both the checks job and browser matrix. Its !cancelled() condition must allow it to report failure after a prerequisite fails. Explicitly reject any needs result other than success before checkout/build/scan/package/upload. Only every-success may upload authored-course-commitSHA. Give bounded per-job timeouts with realistic room for setup and media packaging. Lint YAML/action expressions and test gate cases for failure/skipped/cancelled. Verify an actual hosted run, its complete test counts and uploaded artifact; estimate no speedup until measured. Keep the independent billed workflow separate.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## Q05 Create bounded manual live acceptance

Verify actual provider behavior and independent session archival.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Create a separate main-only workflow_dispatch live-acceptance.yml with reviewed choices course, learning, host, team and all, an explicit confirm_billing input and a restricted live-tests environment. Keep shared and isolated engineering-team credentials separate; store keys in environment secrets and versioned resource IDs in variables. Do not transfer local keys, provision agents/upload skills or run paid sessions merely because a workflow file is created.
Preflight every selected suite before the first billed session: shared settings, immutable skill pins/hashes, isolated Python capability and dedicated team role inventories/versions. Run suites sequentially with no automatic billed retry and stop later suites on failure. Course covers completion, cancel-after-send, deadline and two verified reports in the same retained session then close; learning covers previews, instructions and three skill variants; host covers editor patch/apply plus retained Python and a correlated host tool; team requires independent acceptance, all merged tasks and no unresolved questions.
Validate actual evidence, not exit code zero. Independently retrieve all created sessions to confirm archival, distinguish interrupt acknowledgement from confirmed idle and expose pending cleanup. The reference course uses four, learning six, host three and a successful team commonly five bounded sessions, but actual observed counts must be reported. Keep session budgets, overall role-call caps and execution/cleanup deadlines explicit. Unknown cost/cleanup blocks readiness. Upload authored status/count summaries only; provider payloads and IDs stay private. A live run requires a separate explicit user authorization at execution time.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## Q06 Verify live acceptance when explicitly authorized

Observe online outcomes without broadening the selected scope.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

This is an execution checkpoint, not authorization to incur charges. First present the concrete suite selection, configured existing resources, session/reference budget limits and cleanup behavior. If the user has explicitly authorized these billed tests in this session, dispatch the existing bounded live workflow on the exact offline-tested commit; otherwise stop before the paid action and request the missing authorization. Never paste/print keys or provision replacements silently.
Follow the run until its outcomes are known. Download its sanitized summary, require every selected suite to pass and independently confirmed archival of every created session. On a failure, stop later sessions, inspect sanitized diagnostics and reconcile only the run's owned resources. Do not claim configuration readiness is a live pass, automatically increase budgets or blindly resend uncertain work. Record run URL, tested commit, observed scenario counts, cleanup verification and scope limitations. Provider list costs are not final invoices. Verify optional notifications/telemetry separately; these suites do not establish every cloud integration.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## Q07 Prepare and publish a verified student release

Attach an exact tested package with setup instructions and checksums.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Prepare a versioned GitHub release for a concrete commit that passed both required offline CI and the deliberately authorized live acceptance. Download the source ZIP from that successful CI run instead of rebuilding from an untracked local workspace. Independently verify members and distribution-manifest hashes and complete media inventory. Add START-HERE instructions, SHA256SUMS and sanitized live-validation JSON with run URLs and tested commit. Explain offline startup, optional paid setup, student notes/backups and included no-key narration.
Prepare a draft first, compare every uploaded asset's SHA-256 and size with the local checked file, and verify its target commit. Preserve earlier releases/tags rather than retargeting them. Publishing requires the user's authorization; prepare a reviewable draft before asking if it is missing. Once authorized, publish and verify the final release/tag/assets. Do not claim newest main is live-tested if the evidence belongs to an earlier commit. Document real counts and limitations; do not invent a pass, billing total or successful external delivery. Keep release build products/private evidence out of Git.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## R01 Recover a failed implementation checkpoint

Repair the current step without skipping to later features.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

The current workbook checkpoint failed. Read the exact error, changed files and checkpoint requirements before editing. Reproduce the smallest relevant case. Explain whether the problem is missing implementation, stale test selector, startup/readiness, configuration or an unverified external capability. Fix the cause without deleting acceptance checks, forcing success, overwriting unrelated work or skipping to the next prompt. Preserve the last working checkpoint and show the changed files and exact commands/results. Do not make paid requests or external writes to diagnose an offline failure. If a prerequisite is missing, state the concrete missing capability and keep independent work moving.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## R02 Recover a media or timing mismatch

Keep narration and red rectangles aligned to their real data.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Diagnose this clip/image mismatch using its lesson/kind/step, manifest identity, exact authored text, SHA-256, native image dimensions, WORD timing JSON and DOM/region IDs. Determine whether the wrong asset was copied, the transcript changed, the timestamp source is missing, a gap boundary is wrong or the measured box no longer matches the final image. Fix that identity or mapping; do not fabricate timings, relabel stale audio, draw one whole-section highlight or stretch an arbitrary grid to conceal the mismatch. Preserve valid recordings. Re-recording or image regeneration is a separate authorized author action. Run the specific audit and real playback/seek/gap tests and report evidence.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

## R03 Audit final feature parity

Find concrete omissions before calling the rebuild complete.

COPY PROMPT START

````text
Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.

Compare the rebuilt platform against 11-final-parity-checklist.md and coverage.json in this workbook. Inspect actual code, mounted UI, artifacts and test results. Require every numbered lab and inserted extension, Home/navigation/themes, real source views, guide/player paragraph highlights, 525 lesson clips, notes/backups/quizzes/paths/milestones, 150 original infographics, 150 visual clips, 900 regions, zoom/pan, transcripts/downloads, all audits, explicit live gates and final package/release controls. Verify behaviors rather than matching screenshots or counting placeholder files. Mark each requirement implemented and checked, implemented but unverified, blocked or missing. Repair missing offline capabilities first. Claim a live/provider result only from actual observed authorized execution. Provide the remaining concrete work and never certify bit-for-bit or behavioral equivalence solely because an AI prompt was followed.
````

COPY PROMPT END

**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.


---

# Final feature parity checklist

Assess behavior and evidence, not placeholder counts or visual resemblance. Mark each row checked, unverified, blocked or missing. AI-generated code and images are not guaranteed to reproduce byte-for-byte. This workbook has not independently replayed every prompt into a fresh implementation; the acceptance gates define what the student must actually verify.

| Capability | Prompts | Required evidence |
| --- | --- | --- |
| 75 implemented lessons and 11 inserted extensions | L01 to L75 and lettered extensions | Real forms, strict host contracts, guides, fixtures, challenges and source inspection for every ID. |
| Empty-folder scaffold and optional Managed runtime | F01 to F05 | Working health/shell/dev/build, no key required for fixtures; no automatic provisioning. |
| Themes responsive navigation source views | F02 F04 P01 P11 P13 | Desktop/phone, search/topic/order, history and stable focus; no execution from navigation. |
| Seven-step guides and spoken fragment highlights | P02 to P06 | 525 exact transcripts/clips; concrete paragraph/sentence DOM selection including gaps/seek/replay. |
| Notes checklists visits and backups | P07 | Explicit saves, optional self-assessment, closed preview/restore, legacy compatibility and rollback. |
| Knowledge practice paths and review | P08 | 75 real questions, stored attempt validation, optional paths and bookmark/incorrect review. |
| Three milestone starters and references | P09 P10 | Intentionally failing starters, separate complete references, 4/3/5 tests, no learner-code upload. |
| Start here and recorded validation | P12 | Direct offline baseline links and evidence scoped to actual tested commits. |
| Two illustrated tabs for each lesson | P14 to P19 | 150 PNGs, distinct poses, 150 visual MP3s, 900 measured regions; actual source links and transcripts. |
| Zoom pan and follow spoken region | P19 | Keyboard/touch/manual navigation, following opt-in, tab switch stops audio and keeps experiment inputs. |
| Media integrity and student no-key playback | P05 P17 P18 Q01 | 675 total MP3s with verified identities/timings; paid author generation separate from playback. |
| Host/provider execution boundaries | All lessons and Q05 Q06 | Fixture/live distinction, owner/role checks, bounded calls/deadlines/costs and independently verified cleanup. |
| All lesson regression and sharded CI | Q01 Q02 Q04 | Original test set partitions exactly once; no weakened assertions; every prerequisite gates packaging. |
| Sanitized source distribution and versioned release | Q03 Q07 | Exact tested package, hash manifest/checksums, verified uploads; credentials/runtime state excluded. |

Navigation revision, 21 October 2026: Use the searchable desktop sidebar or mobile menu and previous/next links below the lesson to change lessons. Do not render a duplicate Lab 01-75 button grid or numbered lesson strip above the main workspace. Keep the lesson heading, guide shortcuts and all lesson workspace tabs, including infographic views. This intentional UI change supersedes the frozen reference layout.

The frozen source reference is [963cbbf](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/tree/963cbbf8a30b2341d0a932baab53d79766c32337). The app release [v0.2.0](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/releases/tag/v0.2.0) targets e61bcac, with the same application features before the later workflow-only parallelization. The repository is private: students require granted access or the instructor-supplied downloads. Do not put instructor account/resource IDs or credentials into student prompts.
