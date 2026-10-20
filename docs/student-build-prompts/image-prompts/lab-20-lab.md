# Lab 20 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 20 — Lab walkthrough"; then "Lifecycle events and host interceptors: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Crouching while placing a block into a queue, front view with the working prop raised at shoulder level. The prop illustrates Lifecycle events and host interceptors. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Run the passing offline policy and compare provider events, host audit, and the draft file."
Teaching context for the visual explanation (do not print this entire paragraph): Run the passing offline policy and compare provider events, host audit, and the draft file.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Run denied pre-execution, tool failure, and interceptor exception; identify which boundary prevented or attempted execution."
Teaching context for the visual explanation (do not print this entire paragraph): Run denied pre-execution, tool failure, and interceptor exception; identify which boundary prevented or attempted execution.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Use the virtual-time deadline fixture and inspect cleanup without waiting for a real provider timeout."
Teaching context for the visual explanation (do not print this entire paragraph): Use the virtual-time deadline fixture and inspect cleanup without waiting for a real provider timeout.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Run final validation failure and distinguish the completed provider turn from a rejected application report."
Teaching context for the visual explanation (do not print this entire paragraph): Run final validation failure and distinguish the completed provider turn from a rejected application report.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "No; distinguish events, host decisions and effects."
Teaching context for the visual explanation (do not print this entire paragraph): No; distinguish events, host decisions and effects. Observing an event does not establish host interception or enforcement. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Compare a host interceptor exception with a failed tool execution. Which one reached the handler, and what did the fixture file prove?"
Teaching context for the visual explanation (do not print this entire paragraph): Compare a host interceptor exception with a failed tool execution. Which one reached the handler, and what did the fixture file prove? Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Use **Run offline lifecycle** for six cases. Passing policy edits `draft.md`; denied pre-execution protects `protected.md`; tool failure reaches the handler with an absent old fragment; interceptor exception fails before creating a session or invoking the handler; deadline advances fixture-only virtual ticks without a provider call; final validation failure completes a fixture turn and edit but rejects the agent text against a closed application report schema. A failing final report starts no automatic corrective loop.

The results show an observed provider-event projection, separate host-audit entries, correlation IDs, outcome, cleanup and actual fixture file content. **Inspect run files** and **Inspect draft.md** read the server-owned fixture after the turn; **Reset this fixture** requires the selected run ID and explicit confirmation.

The local routes are `POST /api/c20/run`, `GET /files`, `GET /file`, `POST /reset`, plus a configuration-only `GET /availability`. Run responses stream over SSE. Requests are strict and bounded. Owner/origin checks, concurrency, deadline, budget, event counts and retained fixtures are capped. No Agent SDK `hooks`, `PreToolUse` or `PostToolUse` field is passed to Managed Agents.


## Evidence to inspect

Compare the host audit's **pre-execution** decision, handler before/after phase and post-execution record with the file's final bytes. Tool failure has a handler failure record; interceptor failure records a skipped handler and no session. A provider error is classified separately from either. The final verifier can reject a completed provider turn. Model spans, approvals and child-thread events are shown only if observed; absence is recorded as coverage, not an invented event. Custom-tool results need no `always_ask` confirmation. A multiagent thread can have its own ID; matching event IDs and thread IDs are carried when observed.


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


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END
