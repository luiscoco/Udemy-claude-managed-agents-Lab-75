# Lab 03 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 03 — Lab walkthrough"; then "Built-in tools: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Standing with a clipboard and raising a gloved stop palm. The prop illustrates Built-in tools. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Run Read-only offline and confirm that every file on disk is unchanged."
Teaching context for the visual explanation (do not print this entire paragraph): Run Read-only offline and confirm that every file on disk is unchanged.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Run Unavailable Write and Denied Write; compare the evaluated_permission, the evaluation object and the permission denials list."
Teaching context for the visual explanation (do not print this entire paragraph): Run Unavailable Write and Denied Write; compare the evaluated_permission, the evaluation object and the permission denials list.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Run Permitted edit: the host allows the allowlisted cp and the in-fixture edit, and denies the traversal attempts."
Teaching context for the visual explanation (do not print this entire paragraph): Run Permitted edit: the host allows the allowlisted cp and the in-fixture edit, and denies the traversal attempts.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Inspect outputs/draft.md on disk, then reset the sandbox and run Auto to see server-evaluated outcomes."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect outputs/draft.md on disk, then reset the sandbox and run Auto to see server-evaluated outcomes.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "The checked file effects and policy evidence."
Teaching context for the visual explanation (do not print this entire paragraph): The checked file effects and policy evidence. Availability, permission and observed effects are distinct. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Take the Permitted edit preset and remove edit from the enabled tools. Before you run it, predict whether the edit attempt is unavailable (deny with no evaluation) or denied, and what outputs/draft.md contains on disk afterwards."
Teaching context for the visual explanation (do not print this entire paragraph): Take the Permitted edit preset and remove edit from the enabled tools. Before you run it, predict whether the edit attempt is unavailable (deny with no evaluation) or denied, and what outputs/draft.md contains on disk afterwards. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. If event types are shown, use event_start, event_delta, agent.message, session.status_running and session.status_idle in the correct lifecycle order. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Change ONLY the diagram inside region4 "Follow the workflow" of this Lab03 walkthrough. Remove the generic session event stream and its wrong ordering. Illustrate the actual authored steps instead as a horizontal workflow: "Inspect outputs/draft.md" -> "Reset sandbox" -> "Run Auto" -> "Inspect chosen tool and policy evaluation" -> "Verify file effects on disk". Use file, reset, lightning, shield and checked-document icons. Caption under last two: "Server-evaluated evidence". Do not add any event type names or make model prose proof of file changes. Preserve the region4 heading, summary, bounds and every other panel, exact text, colors and astronaut STOP pose.
````

COPY PROMPT END
