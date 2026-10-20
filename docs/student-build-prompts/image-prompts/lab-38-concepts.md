# Lab 38 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 38 — Concept map"; then "Application follow up suggestions". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Sitting cross-legged in zero gravity and arranging labeled cards, backpack partly visible, turning the helmet toward the viewer. The prop illustrates Application follow up suggestions. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Offer optional application follow-up suggestions bound to a conversation, turn and response version without auto-sending or conflating usage with the answer."
Teaching context for the visual explanation (do not print this entire paragraph): Offer optional application follow-up suggestions bound to a conversation, turn and response version without auto-sending or conflating usage with the answer.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "Only after explicit user selection with current binding."
Teaching context for the visual explanation (do not print this entire paragraph): When should a follow-up suggestion be sent? Only after explicit user selection with current binding.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "Suggestions are optional and bound to conversation, turn and response version."
Teaching context for the visual explanation (do not print this entire paragraph): Suggestions are optional and bound to conversation, turn and response version.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Start a normal offline conversation and inspect the answer before checking suggestions."
Teaching context for the visual explanation (do not print this entire paragraph): Start a normal offline conversation and inspect the answer before checking suggestions. Copy a suggestion into the input and confirm the explicit send count does not change.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "Only after explicit user selection with current binding."
Teaching context for the visual explanation (do not print this entire paragraph): Only after explicit user selection with current binding. Suggestions are optional and bound to conversation, turn and response version. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Explain why a suggestion may be absent and why accepting one needs a separate send."
Teaching context for the visual explanation (do not print this entire paragraph): Explain why a suggestion may be absent and why accepting one needs a separate send. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Start a conversation, check suggestions, copy one to the input, then press **Send message** separately. Toggle suggestions, close the conversation, and compare normal, delayed, suppressed, stale and disabled scenarios.


## Evidence to inspect

Compare the suggestion's binding fields, explicit send count, zero auto-send count, separate usage records and stale rejection. Inspect `server/lib/lab38-suggestions.ts` for the send guard.


## Limitations

No native `prompt_suggestion` SDK event or guaranteed suggestion stream is assumed. The offline fixture makes zero provider calls. A live suggestion session is unavailable until separately configured and budgeted.


## Challenge

Explain why a suggestion may be absent and why accepting one needs a separate send.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
