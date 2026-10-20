# Lab 54 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 54 — Concept map"; then "Designing tools the model uses well". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Floating sideways while turning a holographic control dial, upright posture with the prop held above the waist. The prop illustrates Designing tools the model uses well. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Compare vague and explicit Managed custom-tool contracts while keeping refund policy and idempotency in the host handler."
Teaching context for the visual explanation (do not print this entire paragraph): Compare vague and explicit Managed custom-tool contracts while keeping refund policy and idempotency in the host handler.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "In the host handler despite better tool descriptions."
Teaching context for the visual explanation (do not print this entire paragraph): Where should refund policy and idempotency live? In the host handler despite better tool descriptions.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "A clearer tool contract does not replace host enforcement."
Teaching context for the visual explanation (do not print this entire paragraph): A clearer tool contract does not replace host enforcement.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Inspect both tool names, descriptions, Zod-derived schemas and linter findings."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect both tool names, descriptions, Zod-derived schemas and linter findings. Run invalid input, domain rejection and missing prerequisite cases; check that no refund is issued.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "In the host handler despite better tool descriptions."
Teaching context for the visual explanation (do not print this entire paragraph): In the host handler despite better tool descriptions. A clearer tool contract does not replace host enforcement. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Improve one vague field name or error message and predict how the linter and host effects should differ."
Teaching context for the visual explanation (do not print this entire paragraph): Improve one vague field name or error message and predict how the linter and host effects should differ. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Switch between the vague and explicit contract and inspect the generated JSON Schema. Select invalid input, domain rejection, missing prerequisite or correct idempotent action and press **Call scripted tool**. **Run all four cases** displays the authored choice/recovery traces together. The vague variant needs a recovery step that names integer USD cents and the trusted review boundary; the explicit variant expresses those in its contract.


## Evidence to inspect

Both schemas come from Zod and are closed. The workshop linter checks the name/description, integer-cent unit, order ID pattern and closed object. The handler revalidates every `agent.custom_tool_use` input and returns one `user.custom_tool_result` keyed by its `sevt_` ID. The server's selected customer and conversation are not model arguments. Errors provide a safe recovery direction and leave the refund ledger unchanged.

In the correct action, the first proposal creates a pending approval. A repeated proposal returns the same stable business action key and pending approval, despite a different `sevt_` event ID. Trusted host approval issues one refund. A later replay is rejected because the action was already applied. The sandbox cannot change this local ledger through tool wording alone. Unused built-in tools, MCP and skills are outside the authored toolset.


## Limitations

The displayed choices and recoveries are scripted examples. The workshop gives no synthetic model success score. A live comparison would require actual, separately opted-in model runs and report observed choices and provider usage. The installed Managed custom-tool type has no native annotation property; the risk and effect notes belong to this host workshop.


## Challenge

Rename the vague `amount` field to `amountCents` and make its description explicit about USD cents, prerequisites and approval. Predict which linter findings disappear and verify that the host still denies an undamaged order or duplicate effect.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
