# Lab 06 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 06 — Concept map"; then "Sessions and retained context". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Floating sideways while turning a holographic control dial. The prop illustrates Sessions and retained context. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Continue a conversation in the same server-owned Managed session, compare it with fresh context, and reconnect without duplicating persisted events."
Teaching context for the visual explanation (do not print this entire paragraph): Continue a conversation in the same server-owned Managed session, compare it with fresh context, and reconnect without duplicating persisted events.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "Continuing the owned retained session."
Teaching context for the visual explanation (do not print this entire paragraph): What preserves the same remote conversation? Continuing the owned retained session.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "Retained context and reconnect deduplication are separate responsibilities."
Teaching context for the visual explanation (do not print this entire paragraph): Retained context and reconnect deduplication are separate responsibilities.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Start a new offline session with the fictional project introduction."
Teaching context for the visual explanation (do not print this entire paragraph): Start a new offline session with the fictional project introduction. Select the follow-up and Continue; confirm the session ID stays the same and the name is recalled.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "Continuing the owned retained session."
Teaching context for the visual explanation (do not print this entire paragraph): Continuing the owned retained session. Retained context and reconnect deduplication are separate responsibilities. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Ask a follow-up that depends on the first answer. Explain which ID proves session reuse and why fixture recall is evidence only of fixture behavior."
Teaching context for the visual explanation (do not print this entire paragraph): Ask a follow-up that depends on the first answer. Explain which ID proves session reuse and why fixture recall is evidence only of fixture behavior. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
Reference is STYLE ONLY. Replace ALL lesson body content with this new lesson's exact copy. Do not reuse the reference's event stream diagrams or technical labels. Use the actual supplied steps for region4 and evidence checks for region5. No generic code or event-type list. Keep panels separated and numbered1..6, with the astronaut in the specified distinct pose.
````

COPY PROMPT END
