# Lab 70 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 70 — Lab walkthrough"; then "Python client for Managed Agents: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Floating diagonally while guiding a glowing arrow between panels, three-quarter view with the prop beside the helmet. The prop illustrates Python client for Managed Agents. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Check selected interpreter readiness without installing packages or contacting Anthropic."
Teaching context for the visual explanation (do not print this entire paragraph): Check selected interpreter readiness without installing packages or contacting Anthropic.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Run one-shot and retained offline turns, then close the confirmed-idle handle."
Teaching context for the visual explanation (do not print this entire paragraph): Run one-shot and retained offline turns, then close the confirmed-idle handle.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Run the host custom-tool round trip and inspect its sevt_ correlation."
Teaching context for the visual explanation (do not print this entire paragraph): Run the host custom-tool round trip and inspect its sevt_ correlation.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Compare malformed stdout, bounded stderr, missing Python and cancellation with cleanup evidence."
Teaching context for the visual explanation (do not print this entire paragraph): Compare malformed stdout, bounded stderr, missing Python and cancellation with cleanup evidence.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "The Managed protocol and isolated worker boundary."
Teaching context for the visual explanation (do not print this entire paragraph): The Managed protocol and isolated worker boundary. An isolated Python worker is a bridge to the same remote protocol. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Terminate a worker and explain why process exit cannot prove a remote Managed session has stopped."
Teaching context for the visual explanation (do not print this entire paragraph): Terminate a worker and explain why process exit cannot prove a remote Managed session has stopped. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

**Check Python readiness** inspects the selected interpreter without network calls. **Start offline Python** runs a real standard-library JSON-lines worker. Compare one-shot cleanup, retained start, another retained turn and idle close. The host accepts only its opaque session handle and checks owner/mode/idle state before reuse; the browser cannot submit a remote session ID.

Choose **custom-tool** to see Python emit `agent.custom_tool_use`, Node validate the closed tool input and return `user.custom_tool_result` by `sevt_` ID. Compare malformed stdout, diagnostic overflow, hang/cancel and missing-Python scenarios. Live mode requires the exact verified package surface, existing server Managed setup and explicit user selection.


## Evidence to inspect

Node spawns one worker request with fixed arguments and no shell. Offline workers never import the provider package. JSON-lines frames, line size, total stdout, stderr capture, calls and process lifetime are bounded. Host custom tools replace Python hooks; the formatting tool has no business effect. Event IDs correlate replies and are not business idempotency keys.

The live adapter uses official `client.beta.sessions.create`, `events.stream`, `events.send`, `retrieve` and `archive` calls. It establishes the stream before sending the message, deduplicates events, handles custom-tool results and verifies the resolved tools/MCP/skills configuration. Retained reuse requires confirmed idle. Cancellation sends an interrupt, then retrieves status before retention or archive. Acknowledgement, local process termination and confirmed remote idle remain separate evidence.


## Limitations

After explicit setup, the pinned Python 1.7.0 requirements were installed in the local .venv and capability probing passed. Actual live tests verified retained-session reuse, explicit close and a correlated host-tool call. The budget uses integer decimal strings, and descriptor-based control reads permit clean shutdown with stdin open. See [live evidence](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/blob/main/docs/course-validation.md). A fresh checkout still requires the explicit venv setup and probe. Offline retained IDs and cleanup are authored simulations. Killing a worker cannot establish remote stop; inspect interruption/cleanup or perform an owner-authorized follow-up through the provider API.


## Challenge

Compare an interrupt acknowledgement, an idle confirmation, archive evidence and a killed child process. Identify which evidence permits retained-session reuse.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Correct only panel 5's protocol comparison. Offline worker does NOT run the remote protocol or contact the provider. Replace the left caption with 'Offline: standard-library JSON-lines simulation; no provider import'. Replace middle cloud caption with 'Live only: official Python client talks to Managed service'. Heading/caption may say 'Compare separate modes'. Keep host validation and event correlation as shared design, not proof of remote execution. Preserve six panel outlines, dimensions, layout and astronaut.
````

COPY PROMPT END
