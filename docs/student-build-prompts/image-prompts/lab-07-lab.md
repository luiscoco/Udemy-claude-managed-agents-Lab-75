# Lab 07 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 07 — Lab walkthrough"; then "Tool policy and execution audit: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Leaning backward in zero gravity while holding two linked modules. The prop illustrates Tool policy and execution audit. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Run Audit only and confirm the safe draft edit executes."
Teaching context for the visual explanation (do not print this entire paragraph): Run Audit only and confirm the safe draft edit executes.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Run Deny write and verify the protected file is unchanged and the handler did not run."
Teaching context for the visual explanation (do not print this entire paragraph): Run Deny write and verify the protected file is unchanged and the handler did not run.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Run Rewrite input and compare original proposed.md with effective draft.md after revalidation."
Teaching context for the visual explanation (do not print this entire paragraph): Run Rewrite input and compare original proposed.md with effective draft.md after revalidation.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Run the handler-exception and repeated-call fixtures."
Teaching context for the visual explanation (do not print this entire paragraph): Run the handler-exception and repeated-call fixtures.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Before execution, then audit actual effects."
Teaching context for the visual explanation (do not print this entire paragraph): Before execution, then audit actual effects. The host pipeline enforces policy before execution and records what actually happened. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Block a protected-file call and identify the host decision that prevented the effect before any handler ran."
Teaching context for the visual explanation (do not print this entire paragraph): Block a protected-file call and identify the host decision that prevented the effect before any handler ran. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."
Reference is STYLE ONLY. Replace ALL lesson body content with this new lesson's exact copy. Do not reuse the reference's event stream diagrams or technical labels. Use the actual supplied steps for region4 and evidence checks for region5. No generic code or event-type list. Keep panels separated and numbered1..6, with the astronaut in the specified distinct pose.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Edit ONLY the diagram in region4 "Follow the workflow". Correct both branches to the actual fixture behavior: branch1 "Handler exception" -> "Policy permits the call" -> "Handler runs and fails" -> "is_error result; file unchanged". Branch2 "Repeated call" -> "Same sevt_ call ID repeats" -> "Deduplicate the call" -> "One execution and at most one correlated result". A handler exception is not a policy denial. A repeated call ID must not execute the action repeatedly. Preserve the heading, summary, panel bounds, all other regions, exact copy, astronaut pose and dimensions.
````

COPY PROMPT END
