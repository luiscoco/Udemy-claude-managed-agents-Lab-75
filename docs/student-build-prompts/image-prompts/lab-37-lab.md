# Lab 37 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 37 — Lab walkthrough"; then "External policy decision service: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Leaning backward in zero gravity while holding two linked modules, backpack partly visible, turning the helmet toward the viewer. The prop illustrates External policy decision service. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Start a preallowed observation and see that no gate request or confirmation is needed."
Teaching context for the visual explanation (do not print this entire paragraph): Start a preallowed observation and see that no gate request or confirmation is needed.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Run the worker deny and inspect the exact sevt_ ID, deny_message and unchanged fixture file."
Teaching context for the visual explanation (do not print this entire paragraph): Run the worker deny and inspect the exact sevt_ ID, deny_message and unchanged fixture file.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Try malformed output and timeout; neither can produce a confirmation or file effect."
Teaching context for the visual explanation (do not print this entire paragraph): Try malformed output and timeout; neither can produce a confirmation or file effect.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Run host-refusal: the worker allows but the fixed host path limit denies."
Teaching context for the visual explanation (do not print this entire paragraph): Run host-refusal: the worker allows but the fixed host path limit denies.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "The exact paused action plus independent path checks."
Teaching context for the visual explanation (do not print this entire paragraph): The exact paused action plus independent path checks. A gate decision is scoped and does not replace independent host checks. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Return an invalid gate response and inspect the prevented effect."
Teaching context for the visual explanation (do not print this entire paragraph): Return an invalid gate response and inspect the prevented effect. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Choose a scenario and either isolated policy worker or local reviewer, then **Start policy review**. **Ask policy worker**, **Reviewer allows**, **Reviewer denies**, and **Cancel pending** resolve or invalidate an exact paused action.


## Evidence to inspect

Compare the exact event ID, gate and host decisions, confirmation count and fixture file text. Read `server/lib/lab37-policy-gate.ts` for the worker boundary, closed output validation, independent path check and single-use decision guard.


## Limitations

The fixture makes zero Anthropic calls. A live version needs a configured Managed agent with a built-in `always_ask` pause. The host policy service is not an agent tool and cannot rewrite the confirmation input.


## Challenge

Return an invalid gate response and inspect the prevented file effect.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
