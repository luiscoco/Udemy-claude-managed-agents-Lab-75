# Lab 14 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 14 — Lab walkthrough"; then "Models and supported effort: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Crouching while placing a block into a queue, three-quarter side view, looking upward toward the diagram. The prop illustrates Models and supported effort. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Hold the prompt and model fixed; compare low, medium and high effort offline."
Teaching context for the visual explanation (do not print this entire paragraph): Hold the prompt and model fixed; compare low, medium and high effort offline.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Reject incompatible values and inspect the resolved model snapshot."
Teaching context for the visual explanation (do not print this entire paragraph): Reject incompatible values and inspect the resolved model snapshot.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Simulate unavailable and uncertain primary models with one explicitly budgeted host fallback."
Teaching context for the visual explanation (do not print this entire paragraph): Simulate unavailable and uncertain primary models with one explicitly budgeted host fallback.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Change supported effort while keeping prompt and model fixed in fresh sessions. Explain why uncertain work blocks fallback."
Teaching context for the visual explanation (do not print this entire paragraph): Change supported effort while keeping prompt and model fixed in fresh sessions. Explain why uncertain work blocks fallback.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Resolved model settings and explicit fallback budgets."
Teaching context for the visual explanation (do not print this entire paragraph): Resolved model settings and explicit fallback budgets. Requested settings, resolved metadata and bounded fallback attempts all matter. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Change supported effort while keeping prompt and model fixed in fresh sessions. Explain why uncertain work blocks fallback."
Teaching context for the visual explanation (do not print this entire paragraph): Change supported effort while keeping prompt and model fixed in fresh sessions. Explain why uncertain work blocks fallback. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Select the model, effort, integer-cent budget and local deadline. Run offline model experiment first. Normal completes; primary-unavailable simulates a rejected creation; uncertain blocks fallback; mismatch sends no prompt; hang exercises local cancellation and cleanup. These scenarios never contact Anthropic.

Allow one host fallback only when you want a second model and have selected its separate budget. The fixed prompt and effort carry over. There are at most two attempts, each with a distinct fresh session. Cancellation, unknown creation, unresolved cleanup and resolved configuration mismatch block fallback. Combined selected limits are displayed; they are not measured costs.

Run live is an explicit billed action. Setup and catalog reads are local checks. Supported effort is configured in a model object at session creation; there is no in-place model/effort setter. Close and reconcile experiment attempts cleanup with fresh requests; a local abort does not prove a remote stop.

The application routes under `/api/c14` are GET `/models`, POST `/run`, `/session`, `/send`, `/new-configuration`, `/end`. `/session` prepares an owned local configuration without provider calls; `/send` starts its one fresh remote session. `/run` combines those two operations. `/new-configuration` reconciles the previous experiment before preparing its replacement. Completed turns are archived after idle confirmation. This lesson intentionally avoids conversational carryover between effort comparisons.


## Evidence to inspect

Compare requested and resolved model ID, effort, pinned base agent version and budget. A mismatched snapshot prevents sending and retains the remote ID for cleanup. Model identity is the session snapshot: installed model-request spans do not carry a model ID. Usage is deduplicated by event ID and counts only model-request end events received after the acknowledged user message. Missing spans mean usage is not reported.

Public messages and outcomes are evidence, not proof of correctness. Private thinking events are filtered. Offline usage, latency and cost measurements stay absent. Live host elapsed time includes setup and cleanup, so it is not pure model latency. Evidence text is bounded and may be clipped.

The closed catalog is a teaching allowlist, not the provider's exhaustive model list. It combines installed model types, [official effort documentation](https://platform.claude.com/docs/en/build-with-claude/effort), [Managed sessions](https://platform.claude.com/docs/en/managed-agents/sessions) and [session creation reference](https://platform.claude.com/docs/en/api/typescript/beta/sessions/create), checked 2026-10-14. Sonnet 4.6 rejects xhigh in this catalog. Account readiness is an explicit operator declaration, not an API-discovered entitlement.


## Limitations

No paid model tests, resource provisioning, automatic entitlement checks, pricing assumptions or private reasoning inspection run during setup or fixtures. Provider capability and account access can differ from the dated catalog. Budgets stop new model requests between requests and should not be interpreted as exact billed-cost measurements. Each request has a finite local deadline; cleanup is separately bounded. Two experiment slots by default, one per owner, prevent unbounded concurrency.


## Challenge

Change supported effort while holding prompt and model fixed. Explain which observations came from authored fixtures, resolved provider metadata, public responses and usage spans. Simulate an unavailable primary with fallback enabled; then switch to uncertain and explain why the second model must not start.


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Replace ONLY the inner diagram of region3 "Inspect the boundary", preserving its exact heading and summary. Show three independent rows with correct conditions: "Primary available" -> "Use primary; one attempt"; "Creation rejected before acceptance" -> "Configured fallback; separate budget"; "Uncertain, mismatched or cancelled" -> "No fallback". Small note: "Unknown creation or unresolved cleanup also blocks fallback." Do not connect uncertain work or configuration mismatch to a fallback model. Keep all other panels, copy, astronaut, colors and dimensions unchanged.
````

COPY PROMPT END
