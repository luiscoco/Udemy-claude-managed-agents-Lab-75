# Lab 02 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 02 — Concept map"; then "Session options". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Sitting cross-legged in zero gravity and arranging labeled cards. The prop illustrates Session options. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Control a dedicated Managed Agents session with model and system overrides, a list-cost budget, connection previews and a local deadline."
Teaching context for the visual explanation (do not print this entire paragraph): Control a dedicated Managed Agents session with model and system overrides, a list-cost budget, connection previews and a local deadline.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "The host stopped waiting locally."
Teaching context for the visual explanation (do not print this entire paragraph): What does a local deadline prove? The host stopped waiting locally.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "Local waiting limits and remote session state require separate evidence."
Teaching context for the visual explanation (do not print this entire paragraph): Local waiting limits and remote session state require separate evidence.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Run normal completion offline, then disable previews while keeping prompt and model fixed."
Teaching context for the visual explanation (do not print this entire paragraph): Run normal completion offline, then disable previews while keeping prompt and model fixed. Compare requested options with the effective session creation snapshot.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "The host stopped waiting locally."
Teaching context for the visual explanation (do not print this entire paragraph): The host stopped waiting locally. Local waiting limits and remote session state require separate evidence. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Reduce the session budget or local deadline. Explain the outcome, which limit produced it, and whether remote execution was confirmed stopped."
Teaching context for the visual explanation (do not print this entire paragraph): Reduce the session budget or local deadline. Explain the outcome, which limit produced it, and whether remote execution was confirmed stopped. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. If event types are shown, use event_start, event_delta, agent.message, session.status_running and session.status_idle in the correct lifecycle order. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Change ONLY the diagram inside region5 "Evidence to inspect" of this Lab02 concept map. Remove the black event-type list and its incorrect sequence. Replace the right column with three ordinary evidence check rows: "Session state" / "Inspect remote lifecycle evidence"; "Cleanup evidence" / "Check what was actually stopped or archived"; "Effective settings" / "Compare requested and resolved session options". Keep the left outcome rows, heading, subtitle and all other regions unchanged. Do not add any wire event names or arrows between unrelated states. Preserve dimensions and astronaut pose.

SECOND OUTCOME CORRECTION:
Edit ONLY two short outcome descriptions in region5 of this Lab02 concept map. The "Completed" description must become "Reported completed outcome with matching lifecycle evidence." Final answer text by itself does not prove completion. The "Paused" description must become "Session paused, for example budget reached or requires_action." A local waiting deadline is NOT a remote paused outcome. Keep the Error and Incomplete rows, all three right-column evidence checks, all six region positions, every other exact text, astronaut, colors and dimensions unchanged.

FINAL EVIDENCE PANEL:
Edit ONLY the inner content of region5 "Evidence to inspect"; keep its title and subtitle. Replace ALL inner rows and both columns with a clean two-by-two grid of FOUR evidence-check tiles. Exact tile copy only: 1 clock icon "Host deadline" / "Local waiting stopped."; 2 cloud icon "Remote state" / "Inspect independently."; 3 trash icon "Cleanup" / "Check actual evidence."; 4 gear icon "Effective settings" / "Compare requested and resolved." Remove the old Completed/Paused/Error/Incomplete list entirely. Do not include any other text in the four tiles. Keep all other regions, all other text, all outer panel bounds, astronaut pose and dimensions unchanged.
````

COPY PROMPT END
