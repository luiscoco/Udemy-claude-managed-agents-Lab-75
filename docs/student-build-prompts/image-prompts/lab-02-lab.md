# Lab 02 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 02 — Lab walkthrough"; then "Session options: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Crouching while placing a block into a queue. The prop illustrates Session options. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Run normal completion offline, then disable previews while keeping prompt and model fixed."
Teaching context for the visual explanation (do not print this entire paragraph): Run normal completion offline, then disable previews while keeping prompt and model fixed.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Compare requested options with the effective session creation snapshot."
Teaching context for the visual explanation (do not print this entire paragraph): Compare requested options with the effective session creation snapshot.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Run Budget reached and Deadline expires; distinguish paused work from local timeout."
Teaching context for the visual explanation (do not print this entire paragraph): Run Budget reached and Deadline expires; distinguish paused work from local timeout.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Inspect interruption, cleanup and reported usage; offline fixtures are not measurements of Claude."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect interruption, cleanup and reported usage; offline fixtures are not measurements of Claude.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "The host stopped waiting locally."
Teaching context for the visual explanation (do not print this entire paragraph): The host stopped waiting locally. Local waiting limits and remote session state require separate evidence. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Reduce the session budget or local deadline. Explain the outcome, which limit produced it, and whether remote execution was confirmed stopped."
Teaching context for the visual explanation (do not print this entire paragraph): Reduce the session budget or local deadline. Explain the outcome, which limit produced it, and whether remote execution was confirmed stopped. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. If event types are shown, use event_start, event_delta, agent.message, session.status_running and session.status_idle in the correct lifecycle order. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Edit this Lab02 walkthrough only in two specific places. Region2: in the RIGHT "Effective session creation snapshot" column, REMOVE the bullet "deadline", because the local waiting deadline is a host setting, not an effective remote session creation field. Keep requested local deadline on the LEFT. Region4: replace its entire generic event-stream sequence with the actual workflow as five labeled icon blocks: "Interrupt request" -> "Host stops waiting locally" -> "Inspect remote session state independently" -> "Read cleanup evidence" -> "Read reported usage". Add a short note "Offline fixtures are not measurements of Claude." Do not claim interruption proves a remote session stopped, tools stopped, or resources were released. Keep region4 heading and summary, panel bounds, all other panels and all other text, colors and astronaut unchanged. No event_start/event_delta/agent.message sequence.
````

COPY PROMPT END
