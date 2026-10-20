# Lab 26 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 26 — Lab walkthrough"; then "Session controls and supported updates: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Crouching while placing a block into a queue, side view with one arm extended toward the evidence. The prop illustrates Session controls and supported updates. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Open a slow offline session and send a turn."
Teaching context for the visual explanation (do not print this entire paragraph): Open a slow offline session and send a turn.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Attempt the idle tool update while running, then interrupt and confirm idle."
Teaching context for the visual explanation (do not print this entire paragraph): Attempt the idle tool update while running, then interrupt and confirm idle.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Remove a tool and MCP server by full replacement and inspect the result."
Teaching context for the visual explanation (do not print this entire paragraph): Remove a tool and MCP server by full replacement and inspect the result.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Try a budget increase without opt-in, then opt in explicitly."
Teaching context for the visual explanation (do not print this entire paragraph): Try a budget increase without opt-in, then opt in explicitly.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Explicitly create new context under checked ownership."
Teaching context for the visual explanation (do not print this entire paragraph): Explicitly create new context under checked ownership. The lesson separates owned session updates from a fresh model handoff. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Change model through a fresh session and inspect its resolved configuration."
Teaching context for the visual explanation (do not print this entire paragraph): Change model through a fresh session and inspect its resolved configuration. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

1. Select **Open offline session**. Send a slow turn and inspect the running state.
2. Try replacing tools while running. The server rejects this update. Interrupt; confirm the session becomes idle before reusing it.
3. Replace the tools and MCP arrays. These are complete replacement values, so an omitted entry is removed.
4. Increase the budget without **Opt in to possible resume**; it is rejected. Check the opt-in and try again.
5. Change model through **New session with summary**. Compare the new session ID, resolved fixture model, parent ID and explicit summary.
6. Archive an idle session. A closed session rejects mutation; unknown and unowned IDs are not exposed.


## Evidence to inspect

Compare the owned fixture session ID, status, history, interruption state, update version, resolved model and parent/summary fields after each control. The server validates every operation against a closed Zod union.


## Limitations

This lab's session is an authored fixture. It cannot confirm provider effects, billed usage, or workflow-run status. The live branch is deliberately unavailable.


## Challenge

Change model through a fresh session and inspect its resolved configuration. Explain which context was explicitly handed off.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END
