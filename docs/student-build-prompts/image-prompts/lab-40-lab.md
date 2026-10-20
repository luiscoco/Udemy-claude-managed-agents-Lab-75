# Lab 40 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 40 — Lab walkthrough"; then "Safe recovery boundaries: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Floating diagonally while guiding a glowing arrow between panels, backpack partly visible, turning the helmet toward the viewer. The prop illustrates Safe recovery boundaries. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Build the kept-turn case and compare remote event, command and effect IDs before and after continuation."
Teaching context for the visual explanation (do not print this entire paragraph): Build the kept-turn case and compare remote event, command and effect IDs before and after continuation.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Try host-only undo and confirm it refuses to erase accepted work."
Teaching context for the visual explanation (do not print this entire paragraph): Try host-only undo and confirm it refuses to erase accepted work.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Compare uncertain send and pending effect; both require reconciliation before continuation or retry."
Teaching context for the visual explanation (do not print this entire paragraph): Compare uncertain send and pending effect; both require reconciliation before continuation or retry.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Inspect a queued follow-up and explain why fresh derivation would lose accepted work."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect a queued follow-up and explain why fresh derivation would lose accepted work.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "The host command and effect ledger."
Teaching context for the visual explanation (do not print this entire paragraph): The host command and effect ledger. Accepted work and observed effects determine safe recovery choices. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Explain how queued work changes the safe recovery boundary."
Teaching context for the visual explanation (do not print this entire paragraph): Explain how queued work changes the safe recovery boundary. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Build a kept turn, uncertain send, queued follow-up, pending effect or clean snapshot. Inspect the state, try host-only undo, then choose continuation, bounded interrupt, fresh derived context or reconciliation.


## Evidence to inspect

Compare command IDs, effect IDs, event IDs, version, recovery choice and unchanged history count. The source in `server/lib/lab40-recovery.ts` contains the refusal rules. Agent claims do not substitute for host ledger evidence.


## Limitations

The offline fixture does not contact Anthropic or interrupt a real session. Its confirmed-idle interrupt is authored evidence only. A production host must observe remote idle before reuse and must query external effect receipts before marking uncertainty resolved. Remote history is never truncated by this lesson.


## Challenge

Explain how queued work changes the safe recovery boundary.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Edit ONLY orange panel 4's Fresh derived context branch. It must show REFUSED while accepted queued work remains unresolved. Replace caption 'Would lose accepted work because queued work is not included' with 'Refused until queued work is accounted for; never drop accepted work'. Add red refusal mark to this branch. Do not present it as an allowed loss of work. Preserve six panels, exact geometry and astronaut.
````

COPY PROMPT END
