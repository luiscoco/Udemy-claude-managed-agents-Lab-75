# Lab 12 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly white-and-blue robot with a violet code laptop in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 12 — Concept map"; then "A host queue around one retained session". Robot stays in the header and does not cover text.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Retained session"
Summary verbatim: "Multiple messages can share one session identity."
Teaching context for the visual explanation (do not print this entire paragraph): This lesson retains one session while several messages are processed. Track its identity across turns. The host queue controls admission and ordering; this is not an Agent SDK asynchronous input generator.

REGION 2
Title verbatim: "Local admission"
Summary verbatim: "A local command ID means the host accepted work."
Teaching context for the visual explanation (do not print this entire paragraph): When a message passes local validation, the host admits a command and assigns its own command identifier. Admission is not the same as provider acceptance and does not mean the turn has completed.

REGION 3
Title verbatim: "Wait while busy"
Summary verbatim: "A follow-up waits for completed idle evidence."
Teaching context for the visual explanation (do not print this entire paragraph): If the first message is still running, the next command stays in the host queue. It waits for completed idle evidence before submission. Follow the waiting count instead of assuming two simultaneous provider turns.

REGION 4
Title verbatim: "Provider acceptance"
Summary verbatim: "Keep user event IDs separate from command IDs."
Teaching context for the visual explanation (do not print this entire paragraph): A provider accepted user event has its own identity. Keep it distinct from the host command identifier. Correlate the accepted event, later messages and the outcome rather than treating all identifiers as interchangeable.

REGION 5
Title verbatim: "Turn outcome"
Summary verbatim: "Inspect each result and the shared session identity."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect the reported result for each queued command. A completed first turn does not automatically certify a later turn. Verify both outcomes and confirm that the retained session identity is the one you expected.

REGION 6
Title verbatim: "Explicit close"
Summary verbatim: "Close cancels waiting work and reports cleanup."
Teaching context for the visual explanation (do not print this entire paragraph): Closing the queue is an explicit operation. Waiting commands should be cancelled before submission, and cleanup evidence should describe what happened. Offline simulated cleanup and confirmed live archival are different evidence sources.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
Reference image is STYLE ONLY. Create the distinct LAB 12 CONCEPT MAP with the specified content. No Agent SDK input generator or query(). In region 4 show Browser message -> Host queue (command ID) -> Provider submission (user event ID) -> retained session. One active turn at a time. Local admission and provider acceptance must be separate. Region 5: Turn 1 completed idle -> Turn 2 submitted -> Turn 2 outcome, SAME session ID. Show explicit close cancelling WAITING commands before submission; do not imply closing browser automatically archives remote session. No invented code, API endpoint or identifier values.

ASTRONAUT AND ID BOUNDARY REVISION:
Replace ONLY the upper-right header robot mascot with a friendly stylized ASTRONAUT wearing a padded white spacesuit, blue joints and gloves, visible life-support backpack, space boots and a round helmet with a dark navy reflective visor framed in blue. It must read as an astronaut in a space suit, rather than a bare robot. Keep the polished navy/orange/pastel educational illustration style. A floating astronaut carefully arranging TWO separate message envelopes into one retained-session container, arms spread to show the two identities, body angled diagonally and one boot trailing. Also correct ONE inaccurate label in region 4: beneath Browser message, replace 'User submits a message (with a user event ID)' with 'User submits a message'. The provider assigns the user event ID only after acceptance, so do not put a provider user event ID on the initial browser message. Keep the 'Host queue (command ID)' and 'Provider submission (user event ID)' columns unchanged. Preserve all other exact text, six panels, diagrams, layout and colors. Astronaut stays entirely in header.
````

COPY PROMPT END
