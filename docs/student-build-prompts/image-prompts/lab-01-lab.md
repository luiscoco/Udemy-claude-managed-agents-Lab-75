# Lab 01 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly white-and-blue robot with a violet code laptop in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 01 — Lab walkthrough"; then "Trace one turn from stream to outcome". Robot stays in the header and does not cover text.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Choose offline"
Summary verbatim: "Select Normal turn and keep the baseline prompt."
Teaching context for the visual explanation (do not print this entire paragraph): Open the exercise and choose the Normal turn offline scenario. Keep the baseline prompt so you can compare the result with later scenarios. Viewing this illustration never starts the exercise for you.

REGION 2
Title verbatim: "Run the fixture"
Summary verbatim: "Click Run offline fixture yourself."
Teaching context for the visual explanation (do not print this entire paragraph): Press Run offline fixture in the exercise. Watch the separate session, text, raw event and outcome panels. This baseline is authored evidence and makes no model provider request.

REGION 3
Title verbatim: "Compare text"
Summary verbatim: "Watch the authoritative message replace its preview."
Teaching context for the visual explanation (do not print this entire paragraph): Locate the authoritative agent message. Compare it with the preview and confirm that the preview was replaced. The final answer should not appear twice because two event representations arrived.

REGION 4
Title verbatim: "Verify completion"
Summary verbatim: "Inspect idle, stop reason and the reported outcome."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect the idle lifecycle event, its stop reason and the outcome panel together. In the normal fixture, end turn supports completed. Text appearing on its own is not the completion signal.

REGION 5
Title verbatim: "Compare failures"
Summary verbatim: "Try repeated events, Stream ended and Session error."
Teaching context for the visual explanation (do not print this entire paragraph): Change one offline scenario at a time. Repeated events test deduplication. Stream ended demonstrates incomplete evidence. Session error demonstrates a failure even when some text has already arrived.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Explain the evidence before saving your note."
Teaching context for the visual explanation (do not print this entire paragraph): Explain which message is authoritative and which lifecycle evidence supports the outcome. Save your observation in the lesson notebook. A saved note or checked learning box is self assessment, not a new verified run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
Managed Agents event-type labels, if shown, must be event_start, event_delta, agent.message, session.status_running, session.status_idle; do not use message_start/message_delta. Show actual control labels only: Normal turn; Run offline fixture; Repeated events; Stream ended; Session error. Do not add fictitious code.

TARGETED LIFECYCLE CORRECTION:
Edit target: this Lab 01 walkthrough infographic. Change ONLY the flow inside region 4 "Verify completion". Its current event order is wrong. Replace its horizontal sequence with this exact left-to-right order and labels: 1) "session.status_running" / "Session is running"; 2) "event_start" / "Preview starts"; 3) "event_delta" / "Streaming text"; 4) "agent.message" / "Authoritative message"; 5) "session.status_idle" / "Idle with stop reason"; 6) outcome panel "Completed" / "end_turn supports completion." Use icons and arrows in that order. Keep the region 4 heading and summary, its bounds, and ALL other regions, all other text, styling and mascot unchanged. Readable labels, no clipped text.

ASTRONAUT REVISION:
Replace ONLY the upper-right header robot mascot with a friendly stylized ASTRONAUT wearing a padded white spacesuit, blue joints and gloves, visible life-support backpack, space boots and a round helmet with a dark navy reflective visor framed in blue. It must read as an astronaut in a space suit, rather than a bare robot. Keep the polished navy/orange/pastel educational illustration style. A seated astronaut operating a small violet control laptop, leaning forward, right index finger pressing a button, left arm pointing toward the completed outcome. Keep all six numbered panels, their exact text and arrows, their positions, headline and subtitle, background and every technical label unchanged. In particular preserve the corrected region 4 sequence session.status_running -> event_start -> event_delta -> agent.message -> session.status_idle -> Completed. The astronaut fits entirely in the header without overlapping any text. Change no teaching content.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Edit target: this Lab 01 walkthrough infographic. Change ONLY the flow inside region 4 "Verify completion". Its current event order is wrong. Replace its horizontal sequence with this exact left-to-right order and labels: 1) "session.status_running" / "Session is running"; 2) "event_start" / "Preview starts"; 3) "event_delta" / "Streaming text"; 4) "agent.message" / "Authoritative message"; 5) "session.status_idle" / "Idle with stop reason"; 6) outcome panel "Completed" / "end_turn supports completion." Use icons and arrows in that order. Keep the region 4 heading and summary, its bounds, and ALL other regions, all other text, styling and mascot unchanged. Readable labels, no clipped text.
````

COPY PROMPT END
