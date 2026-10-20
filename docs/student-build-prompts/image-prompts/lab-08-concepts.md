# Lab 08 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 08 — Concept map"; then "Delegation and session threads". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Sitting cross-legged in zero gravity and arranging labeled cards, right shoulder forward, looking toward the viewer. The prop illustrates Delegation and session threads. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Delegate bounded work to predefined Managed Agents, inspect separate session-thread histories, and verify role capabilities and effects in the host."
Teaching context for the visual explanation (do not print this entire paragraph): Delegate bounded work to predefined Managed Agents, inspect separate session-thread histories, and verify role capabilities and effects in the host.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "Verified role configuration and host-observed effects."
Teaching context for the visual explanation (do not print this entire paragraph): What establishes a worker role capability? Verified role configuration and host-observed effects.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "Worker names alone are not evidence of their configured tools or effects."
Teaching context for the visual explanation (do not print this entire paragraph): Worker names alone are not evidence of their configured tools or effects.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Run the normal fixture and identify the researcher, reviewer and calculator thread IDs."
Teaching context for the visual explanation (do not print this entire paragraph): Run the normal fixture and identify the researcher, reviewer and calculator thread IDs. Separate delegation, report receipt and independent verification states.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "Verified role configuration and host-observed effects."
Teaching context for the visual explanation (do not print this entire paragraph): Verified role configuration and host-observed effects. Worker names alone are not evidence of their configured tools or effects. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Restrict one worker capability and compare its report with the host effect ledger."
Teaching context for the visual explanation (do not print this entire paragraph): Restrict one worker capability and compare its report with the host effect ledger. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
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


## Limitations

- Distinct histories do not imply filesystem or credential isolation.
- Child prose does not automatically become the parent's final answer.
- Offline events are authored and do not prove real parallel execution.
- Live custom-tool handling is intentionally limited to observing thread topology in this bounded lesson; effect claims still require host evidence.


## Challenge

Restrict one worker capability, run the wrong-role scenario, and explain the worker report beside the host effect ledger. The ledger decides whether an effect occurred.


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END
