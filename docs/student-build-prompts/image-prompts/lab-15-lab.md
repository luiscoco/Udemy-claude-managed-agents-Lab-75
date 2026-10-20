# Lab 15 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 15 — Lab walkthrough"; then "Usage and session budgets: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Standing with a clipboard and raising a gloved stop palm, three-quarter side view, looking upward toward the diagram. The prop illustrates Usage and session budgets. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Compare an intermediate usage event with the retrieved idle-session snapshot."
Teaching context for the visual explanation (do not print this entire paragraph): Compare an intermediate usage event with the retrieved idle-session snapshot.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Repeat usage events and inspect child attribution without double counting."
Teaching context for the visual explanation (do not print this entire paragraph): Repeat usage events and inspect child attribution without double counting.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Reach a local turn limit or platform budget, then explicitly decide whether to raise the cap."
Teaching context for the visual explanation (do not print this entire paragraph): Reach a local turn limit or platform budget, then explicitly decide whether to raise the cap.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Explain why intermediate usage differs from the final session snapshot, and why list cost is not a guaranteed invoice total."
Teaching context for the visual explanation (do not print this entire paragraph): Explain why intermediate usage differs from the final session snapshot, and why list cost is not a guaranteed invoice total.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Keep them separate rather than summing overlapping totals."
Teaching context for the visual explanation (do not print this entire paragraph): Keep them separate rather than summing overlapping totals. Cumulative and overlapping scopes can double-count when added blindly. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Explain why intermediate usage differs from the final session snapshot, and why list cost is not a guaranteed invoice total."
Teaching context for the visual explanation (do not print this entire paragraph): Explain why intermediate usage differs from the final session snapshot, and why list cost is not a guaranteed invoice total. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
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


## Limitations

Live tools and orchestration are disabled, so this lab demonstrates child attribution using fixtures rather than starting extra worker agents. Usage can lag; a later idle-session retrieval can differ from the stream snapshot. Budgets govern platform list cost, while invoice totals may differ. In-flight requests can finish beyond the cap. Session and thread active time/cost have different scopes. The SDK permits updating an existing budget, but rejects adding one to a session created without it; removing a cap is one-way, and this host disallows removal entirely.

The installed session usage, usage-event, span, thread and budget-update types were inspected. Official references checked 2026-10-14: [usage](https://platform.claude.com/docs/en/managed-agents/session-observability) and [budgets](https://platform.claude.com/docs/en/managed-agents/budgets). Current capabilities and account behavior still need deliberate live verification.


## Challenge

Explain why intermediate usage differs from the final session snapshot. Identify which values are cumulative session totals, partial observed spans and overlapping child attribution. Demonstrate that repeated events do not increase totals, a missing field stays unknown, and retrieving usage at a budget pause does not resume work.


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Correct only the inner content of regions3 and4, keeping their exact headings and summary sentences. Region3: replace the combined budget-or-turn-limit pause diagram with TWO separate bands: "Platform budget reached" / "New model requests pause at the cap; inspect reported state."; "Host turn/message limit reached" / "Host refuses a new turn; do not infer a remote stop." Bottom note: "Raise budget and resume is explicit and capped, only for a budget-paused session within the remaining turn limit." Region4: replace the old pause/resume flow with five usage-evidence steps: "Observe usage event" -> "Retrieve idle-session usage" -> "Compare same scope and source" -> "Keep child attribution separate" -> "Leave missing values unknown". A host turn limit is not a remote interruption. Preserve all other regions, text, astronaut pose, outer panel bounds and dimensions.
````

COPY PROMPT END
