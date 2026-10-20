# Lab 27 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 27 — Lab walkthrough"; then "Remote work beyond a browser connection: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Standing with a clipboard and raising a gloved stop palm, side view with one arm extended toward the evidence. The prop illustrates Remote work beyond a browser connection. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Open a slow offline task and inspect separate task, session, thread and browser identities."
Teaching context for the visual explanation (do not print this entire paragraph): Open a slow offline task and inspect separate task, session, thread and browser identities.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Detach the browser and confirm the task still runs."
Teaching context for the visual explanation (do not print this entire paragraph): Detach the browser and confirm the task still runs.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Reconnect the same task and inspect deduplicated event IDs and unchanged create count."
Teaching context for the visual explanation (do not print this entire paragraph): Reconnect the same task and inspect deduplicated event IDs and unchanged create count.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Wait for authored completion, then inspect the unverified report."
Teaching context for the visual explanation (do not print this entire paragraph): Wait for authored completion, then inspect the unverified report.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Duplicate sessions or task cards for accepted work."
Teaching context for the visual explanation (do not print this entire paragraph): Duplicate sessions or task cards for accepted work. Reconnect should follow the host ledger rather than duplicate accepted work. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Reconnect and identify evidence that the original task stopped."
Teaching context for the visual explanation (do not print this entire paragraph): Reconnect and identify evidence that the original task stopped. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Open a slow offline task, detach the browser, reconnect the same task, inspect, stop, and close after idle. The completed one-shot returns an archived fixture record. Disable **Allow host background work** to see the policy reject creation.


## Evidence to inspect

Compare task, session and thread IDs, browser connection, remote status, stable event IDs, create count and duplicate-card count. Reconnect replays an old event with the same ID; the host ledger ignores it. A task report remains unverified until independently checked.


## Limitations

The fixture models host reconciliation only. No live task was started and no remote completion is asserted. Managed workflow runs have their own run-aware lifecycle. An interrupt stops a turn but does not itself end an open workflow run; this lab disables dynamic workflows rather than inventing a stop-by-ID method. The host-snapshot concept requires explicit snapshot identification, not a generic event.


## Challenge

Reconnect and identify evidence that the original task stopped. Explain why a detached browser does not prove that remote work stopped.

```powershell
node --import tsx --test tests/lab27-background-tasks.test.ts
node scripts/lab27-browser-demonstration.mjs
```

The route catalog is `POST /api/c27/oneshot`, `POST /api/c27/open`, `POST /api/c27/call`, and `GET /api/c27/code`. See the [checkpoint](docs/lab27-checkpoint.md).


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Preserve all six panels and astronaut. Fix panel 5: subtitle must read 'Avoid duplicate sessions or task cards for accepted work.' The erroneous row 'Duplicate if accepted: Create a new session or task card for accepted work' must be replaced with 'No duplicate work: Reconnect the existing task; do not create a new session or task card.' Preserve evidence of stable IDs, unchanged create count, authored offline completion. Do not claim actual remote provider execution.
````

COPY PROMPT END
