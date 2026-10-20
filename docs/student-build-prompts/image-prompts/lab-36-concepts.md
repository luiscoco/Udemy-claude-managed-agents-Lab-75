# Lab 36 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 36 — Concept map"; then "Remote transport and host runners". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Floating sideways while turning a holographic control dial, tilted diagonal view with the prop held close to the chest. The prop illustrates Remote transport and host runners. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Inspect the host HTTP/event boundary, bounded event consumption, fixed host worker lifecycle and remote cleanup without spawning Claude Code."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect the host HTTP/event boundary, bounded event consumption, fixed host worker lifecycle and remote cleanup without spawning Claude Code.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "Host lifecycle and remote session cleanup."
Teaching context for the visual explanation (do not print this entire paragraph): What should host worker inspection distinguish? Host lifecycle and remote session cleanup.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "The host bridge does not establish a spawned Claude Code process."
Teaching context for the visual explanation (do not print this entire paragraph): The host bridge does not establish a spawned Claude Code process.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Run the successful loopback Managed-port fixture and inspect host request and remote lifecycle events."
Teaching context for the visual explanation (do not print this entire paragraph): Run the successful loopback Managed-port fixture and inspect host request and remote lifecycle events. Compare connection failure with an early stream close; neither produces a verified completed turn.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "Host lifecycle and remote session cleanup."
Teaching context for the visual explanation (do not print this entire paragraph): Host lifecycle and remote session cleanup. The host bridge does not establish a spawned Claude Code process. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Identify which work runs on the host and which belongs to the remote session."
Teaching context for the visual explanation (do not print this entire paragraph): Identify which work runs on the host and which belongs to the remote session. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Choose success, connection failure, early stream close, handler worker failure or cancel pending cleanup, then select **Run transport experiment**. The result shows host request, remote lifecycle, event count, worker exit, local abort and cleanup state.


## Evidence to inspect

Compare `hostRequest`, lifecycle events, queue peak, worker exit count, `remoteStopConfirmed` and cleanup. Read `server/lib/lab36-transport.ts` for the port interface, loopback protocol and bounded event consumer. The worker file is `mcp-servers/lab36-worker.mjs`.


## Limitations

The loopback emulator is not a production remote sandbox. This exercise makes zero Anthropic calls. Live transport requires a configured Managed agent and explicit opt-in. No `spawnClaudeCodeProcess`, toolAlias or local Claude binary is required.


## Challenge

Identify which work runs on the host and which belongs to the remote session.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
