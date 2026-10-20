# Lab 01 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly white-and-blue robot with a violet code laptop in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 01 — Concept map"; then "Session event streaming". Robot stays in the header and does not cover text.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Session identity"
Summary verbatim: "Keep session metadata separate from answer text."
Teaching context for the visual explanation (do not print this entire paragraph): The session panel identifies the session and its configuration. It is metadata, not the answer and not proof that the current turn completed. Keep that identity while following the other panels.

REGION 2
Title verbatim: "Streaming preview"
Summary verbatim: "Deltas are provisional while the answer arrives."
Teaching context for the visual explanation (do not print this entire paragraph): The text preview helps you follow a response as it streams. A visible preview alone does not establish success. If the stream ends early, it may remain incomplete.

REGION 3
Title verbatim: "Authoritative message"
Summary verbatim: "The final agent.message replaces its matching preview."
Teaching context for the visual explanation (do not print this entire paragraph): The authoritative agent message replaces its matching preview instead of being appended again. Compare the message identity and final text so the same answer is not displayed twice.

REGION 4
Title verbatim: "Lifecycle evidence"
Summary verbatim: "Running and idle events describe the turn lifecycle."
Teaching context for the visual explanation (do not print this entire paragraph): Lifecycle events tell you when the session is running and when it becomes idle. Read the stop reason as well as the status. Idle with end turn supports normal completion; other reasons can mean a pause.

REGION 5
Title verbatim: "Explicit outcome"
Summary verbatim: "Completed, paused, error and incomplete are distinct."
Teaching context for the visual explanation (do not print this entire paragraph): Read the reported outcome independently from the answer text. A partial answer can coexist with an error or an incomplete stream. Requires action and budget reached are not normal successful completion.

REGION 6
Title verbatim: "Execution boundary"
Summary verbatim: "Offline evidence is authored. Live evidence needs a real run."
Teaching context for the visual explanation (do not print this entire paragraph): An offline fixture teaches the event contract without calling a model. A live run is separate evidence and can incur charges. A local browser cancel does not by itself prove remote interruption or cleanup.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

TARGETED EVENT LABEL CORRECTION:
Edit only the two event-type labels in region 2 of this infographic. Replace "message_start" with "event_start". Replace both occurrences of "message_delta" with "event_delta". These are the exact Managed Agents wire event names in this course. Keep all other text, diagrams, colors, dimensions, panel positions, mascot and artwork unchanged. No red highlights. This image is the edit target.

ASTRONAUT REVISION:
Replace ONLY the upper-right header robot mascot with a friendly stylized ASTRONAUT wearing a padded white spacesuit, blue joints and gloves, visible life-support backpack, space boots and a round helmet with a dark navy reflective visor framed in blue. It must read as an astronaut in a space suit, rather than a bare robot. Keep the polished navy/orange/pastel educational illustration style. A floating astronaut, torso turned toward the lesson panels, left arm extended with an open palm presenting the event stream, right hand holding a small glowing message card. Both knees softly bent in zero gravity. Keep all six numbered panels, their exact text and arrows, their positions, headline and subtitle, background and every technical label unchanged. The astronaut fits entirely in the header without overlapping any text. Change no teaching content.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Edit only the two event-type labels in region 2 of this infographic. Replace "message_start" with "event_start". Replace both occurrences of "message_delta" with "event_delta". These are the exact Managed Agents wire event names in this course. Keep all other text, diagrams, colors, dimensions, panel positions, mascot and artwork unchanged. No red highlights. This image is the edit target.
````

COPY PROMPT END
