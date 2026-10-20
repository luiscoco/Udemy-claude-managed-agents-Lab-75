# Lab 10 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 10 — Lab walkthrough"; then "Validated reports and interruption: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Floating diagonally while guiding a glowing arrow between panels, right shoulder forward, looking toward the viewer. The prop illustrates Validated reports and interruption. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Run valid and invalid report fixtures and inspect host verification."
Teaching context for the visual explanation (do not print this entire paragraph): Run valid and invalid report fixtures and inspect host verification.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Run Corrected and Exhausted to see the single corrective-round limit."
Teaching context for the visual explanation (do not print this entire paragraph): Run Corrected and Exhausted to see the single corrective-round limit.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Run Hang, interrupt it and confirm idle before sending another turn."
Teaching context for the visual explanation (do not print this entire paragraph): Run Hang, interrupt it and confirm idle before sending another turn.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Disconnect locally or abort and inspect remote cleanup separately."
Teaching context for the visual explanation (do not print this entire paragraph): Disconnect locally or abort and inspect remote cleanup separately.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Validation against the closed application schema."
Teaching context for the visual explanation (do not print this entire paragraph): Validation against the closed application schema. Application validation determines whether the final report satisfies its contract. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Identify the stop action that keeps the same session available for another turn and the evidence required before reuse."
Teaching context for the visual explanation (do not print this entire paragraph): Identify the stop action that keeps the same session available for another turn and the evidence required before reuse. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
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


## Limitations

Offline events are authored examples. Validation proves schema conformance, not factual truth. Only observed spans populate usage; they do not imply complete session cost. Interrupt does not undo prior effects. This text-only single-agent lesson excludes dynamic workflows. A retained run expires after 15 minutes of inactivity; expiry and shutdown request bounded cleanup. Pending remote cleanup remains visible and does not count as a successful archive. Exercise ownership isolates local runs but is not a general multi-user authentication system.


## Challenge

Run Hang, interrupt, confirm idle and send a valid report. Identify the preserved session ID. Compare this with Abort and Close, which end future sends after cleanup.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END
