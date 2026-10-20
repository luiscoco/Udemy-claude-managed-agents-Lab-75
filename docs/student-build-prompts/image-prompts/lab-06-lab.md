# Lab 06 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 06 — Lab walkthrough"; then "Sessions and retained context: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Standing with one boot on a platform and pointing at a diagram. The prop illustrates Sessions and retained context. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Start a new offline session with the fictional project introduction."
Teaching context for the visual explanation (do not print this entire paragraph): Start a new offline session with the fictional project introduction.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Select the follow-up and Continue; confirm the session ID stays the same and the name is recalled."
Teaching context for the visual explanation (do not print this entire paragraph): Select the follow-up and Continue; confirm the session ID stays the same and the name is recalled.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Start a fresh session with only the follow-up and compare the answer."
Teaching context for the visual explanation (do not print this entire paragraph): Start a fresh session with only the follow-up and compare the answer.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Reconnect and inspect stream-before-history ordering plus duplicate counts."
Teaching context for the visual explanation (do not print this entire paragraph): Reconnect and inspect stream-before-history ordering plus duplicate counts.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Continuing the owned retained session."
Teaching context for the visual explanation (do not print this entire paragraph): Continuing the owned retained session. Retained context and reconnect deduplication are separate responsibilities. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Ask a follow-up that depends on the first answer. Explain which ID proves session reuse and why fixture recall is evidence only of fixture behavior."
Teaching context for the visual explanation (do not print this entire paragraph): Ask a follow-up that depends on the first answer. Explain which ID proves session reuse and why fixture recall is evidence only of fixture behavior. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
Reference is STYLE ONLY. Replace ALL lesson body content with this new lesson's exact copy. Do not reuse the reference's event stream diagrams or technical labels. Use the actual supplied steps for region4 and evidence checks for region5. No generic code or event-type list. Keep panels separated and numbered1..6, with the astronaut in the specified distinct pose.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Change ONLY the small caption under the first "Reconnect" icon in region4. Erase the whole old caption area, then print just TWO words: "Owned session". Do not retain or duplicate any old caption letters. Keep the bold Reconnect label, all other captions, all diagrams, text, colors, astronaut, panel bounds and dimensions unchanged.
````

COPY PROMPT END
