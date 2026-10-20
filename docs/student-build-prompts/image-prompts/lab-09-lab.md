# Lab 09 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 09 — Lab walkthrough"; then "System instructions and explicit context: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Standing with a clipboard and raising a gloved stop palm, right shoulder forward, looking toward the viewer. The prop illustrates System instructions and explicit context. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Compare all four offline variants with the same question."
Teaching context for the visual explanation (do not print this entire paragraph): Compare all four offline variants with the same question.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Find the omitted system override in Base and the replacement in Custom."
Teaching context for the visual explanation (do not print this entire paragraph): Find the omitted system override in Base and the replacement in Custom.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Inspect base plus append and the authored project context selection."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect base plus append and the authored project context selection.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Compare requested composition with the resolved session snapshot."
Teaching context for the visual explanation (do not print this entire paragraph): Compare requested composition with the resolved session snapshot.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Fresh sessions with the same question and base model."
Teaching context for the visual explanation (do not print this entire paragraph): Fresh sessions with the same question and base model. Holding question and model fixed helps isolate the instruction change. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Keep the question fixed and change only the system instructions. Explain what is inherited and what is replaced."
Teaching context for the visual explanation (do not print this entire paragraph): Keep the question fixed and change only the system instructions. Explain what is inherited and what is replaced. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

- **Fixed user question** stays unchanged during Compare all offline variants.
- **System variant** selects Base, Custom replacement, Base plus appended instructions or Base plus authored project context.
- **Custom replacement instructions** replace the base system in the Custom variant.
- **Appended instructions** are joined to the retrieved base system by the host.
- **Compare all offline variants** runs one fresh fixture session at a time. The server caps simultaneous Lab 09 requests at two or the lower configured limit.
- **Run live** asks for an explicit billed run of only the selected variant.
- **Cancel query** stops the local request and invokes shared bounded interruption and cleanup.


## Evidence to inspect

Each comparison shows the same user question, a fresh session ID, source label, requested composition, resolved model/system/capabilities, answer and cleanup.
The Base variant omits `agent_with_overrides.system`, preserving the base system. Custom is an explicit replacement. Both combined variants compose a complete replacement before creating the session.
The composer pins the retrieved base agent ID and version, preserves its model, and explicitly sets `tools`, `mcp_servers` and `skills` to empty arrays. A multiagent base is rejected before creation.

The fictional `CLAUDE.md` is a server-authored constant selected by `aurora-finch-v1`. No arbitrary path, uploaded text or repository file enters privileged context. Browser-provided project text and `system.message` are rejected. This exercise leaves mid-session system messages disabled; such messages append context rather than replacing configured instructions.


## Limitations

Offline answers are authored examples, not observations of Claude. Usage is null offline and when no live model spans report it. Reported spans do not imply complete billed session cost. The lesson makes no quality or cost ranking. Long base instructions exceeding the exercise composition bounds are rejected. Stored agent configuration remains unchanged.


## Challenge

Keep the question fixed and change only the system instructions. Identify whether the base was inherited or replaced, then explain how explicit project context changed the available facts.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END
