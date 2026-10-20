# Lab 48 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 48 — Concept map"; then "Security hardening". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Floating sideways while turning a holographic control dial, low reaching posture with the prop at knee level. The prop illustrates Security hardening. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Use host-enforced tool input, path and egress checks to distinguish hostile attempts from observed local effects."
Teaching context for the visual explanation (do not print this entire paragraph): Use host-enforced tool input, path and egress checks to distinguish hostile attempts from observed local effects.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "Observed local effect evidence."
Teaching context for the visual explanation (do not print this entire paragraph): What proves a hostile attempt caused an effect? Observed local effect evidence.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "Attempted and executed effects are distinct security outcomes."
Teaching context for the visual explanation (do not print this entire paragraph): Attempted and executed effects are distinct security outcomes.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Compare a naive prompt-only policy with layered host enforcement."
Teaching context for the visual explanation (do not print this entire paragraph): Compare a naive prompt-only policy with layered host enforcement. Try a fake secret read and inspect whether the canary is exposed.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "Observed local effect evidence."
Teaching context for the visual explanation (do not print this entire paragraph): Observed local effect evidence. Attempted and executed effects are distinct security outcomes. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Identify the host check that protects data when the model is misled."
Teaching context for the visual explanation (do not print this entire paragraph): Identify the host check that protects data when the model is misled. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Choose a naive prompt-only policy or a layered host policy. Try secret read, out-of-scope write and injected egress. Each run creates a fresh `sevt_fixture_` event ID and a separate host business idempotency key.


## Evidence to inspect

Compare attempted and executed effects, the outside-file state and loopback collector hits. The layered policy denies private reads, canonical out-of-scope writes and injected network egress. The naive policy illustrates a vulnerable effect using only fictional data. The response pairs a custom-tool result with its event ID; the stable business key is separately tracked to prevent replay. Closed Zod inputs generate the custom tool JSON Schema. Unused built-in tools, MCP servers and skills are absent from this range's configuration.


## Limitations

This is a local security range, not a cloud sandbox test or a provider security guarantee. No genuine credentials enter the range. The loopback witness only sees requests made by this fixture. Prompts and working directory do not replace host authorization, path checks, environment scrubbing or egress policy. A remote cloud sandbox cannot be assumed to see host files.


## Challenge

Identify the host check that protects data when the model is misled. Verify it using collector hits and outside-file state, not model prose.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
