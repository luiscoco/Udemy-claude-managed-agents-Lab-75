# Lab 12 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut in a white padded spacesuit, blue gloves, navy visor and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 12 — Lab walkthrough"; then "Queue a follow-up and inspect its evidence". Robot stays in the header and does not cover text.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Create offline session"
Summary verbatim: "Start a local baseline and note its session ID."
Teaching context for the visual explanation (do not print this entire paragraph): Choose Create offline session in the exercise and note its session identity. This creates the authored local baseline. Opening the infographic does not create any queue or session.

REGION 2
Title verbatim: "Send one message"
Summary verbatim: "Queue Normal and inspect both kinds of IDs."
Teaching context for the visual explanation (do not print this entire paragraph): Queue one Normal message. Inspect the host command identifier and returned user event identifier separately. Read its outcome before interpreting the baseline as complete.

REGION 3
Title verbatim: "Queue while busy"
Summary verbatim: "Choose Slow, then queue a follow-up."
Teaching context for the visual explanation (do not print this entire paragraph): Choose Slow and queue a message. While it is busy, queue a follow up. The follow up should wait rather than immediately starting a second provider turn. Watch the waiting commands evidence.

REGION 4
Title verbatim: "Verify ordering"
Summary verbatim: "Both turns complete in the retained session."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect both command results and their event correlations. Check that the follow up started after the first completed idle boundary and that both results refer to the retained session.

REGION 5
Title verbatim: "Test rejection"
Summary verbatim: "An oversized message fails before submission."
Teaching context for the visual explanation (do not print this entire paragraph): Try a message longer than the allowed limit. It should be rejected before provider submission. A rejected input must not be counted as an accepted or completed turn.

REGION 6
Title verbatim: "Close pending work"
Summary verbatim: "Close a Hang run and inspect waiting cancellations."
Teaching context for the visual explanation (do not print this entire paragraph): Use the Hang scenario with waiting work, then choose Close queue and clean up. Inspect cancelled before submission for waiting commands. Record the cleanup source; an offline simulation is not proof of a live archive.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
The reference is STYLE ONLY, create all new specified LAB 12 WALKTHROUGH content. Upper-right ASTRONAUT POSE MUST DIFFER from reference: A crouching astronaut placing a message block at the back of a small queue, other gloved hand raised in a wait gesture, looking toward the active turn.. Keep it in the header. Region 4 diagram: First turn running -> follow-up waits -> completed idle evidence -> next command submitted -> same session. Do not label a local command ID as a provider user event ID. Actual control labels: Create offline session; Normal; Slow; Hang; Close queue and clean up. Invalid oversized input is rejected before submission. Never imply offline cleanup proves live archival. No invented API code.
````

COPY PROMPT END
