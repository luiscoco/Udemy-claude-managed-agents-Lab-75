# Lab 03 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 03 — Concept map"; then "Built-in tools". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Reaching upward to connect two suspended interface panels. The prop illustrates Built-in tools. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Distinguish a tool being enabled in the session toolset from a call being permitted by its permission_policy and the host, and verify the effects in files rather than in agent claims."
Teaching context for the visual explanation (do not print this entire paragraph): Distinguish a tool being enabled in the session toolset from a call being permitted by its permission_policy and the host, and verify the effects in files rather than in agent claims.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "The checked file effects and policy evidence."
Teaching context for the visual explanation (do not print this entire paragraph): What proves a permitted file action occurred? The checked file effects and policy evidence.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "Availability, permission and observed effects are distinct."
Teaching context for the visual explanation (do not print this entire paragraph): Availability, permission and observed effects are distinct.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Run Read-only offline and confirm that every file on disk is unchanged."
Teaching context for the visual explanation (do not print this entire paragraph): Run Read-only offline and confirm that every file on disk is unchanged. Run Unavailable Write and Denied Write; compare the evaluated_permission, the evaluation object and the permission denials list.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "The checked file effects and policy evidence."
Teaching context for the visual explanation (do not print this entire paragraph): The checked file effects and policy evidence. Availability, permission and observed effects are distinct. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Take the Permitted edit preset and remove edit from the enabled tools. Before you run it, predict whether the edit attempt is unavailable (deny with no evaluation) or denied, and what outputs/draft.md contains on disk afterwards."
Teaching context for the visual explanation (do not print this entire paragraph): Take the Permitted edit preset and remove edit from the enabled tools. Before you run it, predict whether the edit attempt is unavailable (deny with no evaluation) or denied, and what outputs/draft.md contains on disk afterwards. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. If event types are shown, use event_start, event_delta, agent.message, session.status_running and session.status_idle in the correct lifecycle order. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
````

COPY PROMPT END
