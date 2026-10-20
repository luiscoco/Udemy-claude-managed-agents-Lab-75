# Lab 49 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 49 — Lab walkthrough"; then "Headless host and CI outcomes: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Leaning backward in zero gravity while holding two linked modules, upright posture with the prop held above the waist. The prop illustrates Headless host and CI outcomes. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Run the pass fixture and inspect its validated report and zero exit code."
Teaching context for the visual explanation (do not print this entire paragraph): Run the pass fixture and inspect its validated report and zero exit code.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Run validation, limit and execution-error scenarios and compare failure exit codes."
Teaching context for the visual explanation (do not print this entire paragraph): Run validation, limit and execution-error scenarios and compare failure exit codes.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Try SIGTERM, capacity rejection and unconfirmed remote stop; inspect cleanup state."
Teaching context for the visual explanation (do not print this entire paragraph): Try SIGTERM, capacity rejection and unconfirmed remote stop; inspect cleanup state.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Read the authored runner, worker, Dockerfile and sample workflow before any live opt-in."
Teaching context for the visual explanation (do not print this entire paragraph): Read the authored runner, worker, Dockerfile and sample workflow before any live opt-in.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Machine-readable status plus explicit cleanup evidence."
Teaching context for the visual explanation (do not print this entire paragraph): Machine-readable status plus explicit cleanup evidence. Headless work must expose bounded outcomes and cleanup state. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Explain which outcome should fail CI and what remote cleanup evidence is required."
Teaching context for the visual explanation (do not print this entire paragraph): Explain which outcome should fail CI and what remote cleanup evidence is required. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Run pass, validation failure, limit reached, execution error, SIGTERM-shaped cancellation, concurrency rejection or unconfirmed remote stop. The UI calls only authored offline fixtures. The `GET /api/c49/files` route shows the runner, worker, Dockerfile and sample workflow. `POST /api/c49/deploy` is a fixture route, not deployment.


## Evidence to inspect

Each result has a machine outcome, CI exit code, closed report or null, session identity, host limits, interruption and cleanup state. A valid report alone does not pass CI: the live worker also requires turn completion and archive. The runner spawns a worker without a TTY, bounds output and runtime, forwards SIGTERM and emits one JSON verdict. The reused Managed adapter creates a budgeted session with explicit agent/environment IDs, rejects configured tools and MCP servers before sending, limits the work to one text message, and attempts remote cleanup. Pending or unconfirmed remote stop must fail CI.


## Limitations

The authored Dockerfile and workflow are not a deployed service. Offline IDs, reports and outcomes are fixtures, not observed Managed usage. Live CI, provisioning, public hosting and resource mutation require explicit opt-in. No Claude Code `dontAsk` mode or local session-persistence flags are used.


## Challenge

Explain which outcomes fail CI and what remote idle/cleanup evidence is needed after SIGTERM.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
