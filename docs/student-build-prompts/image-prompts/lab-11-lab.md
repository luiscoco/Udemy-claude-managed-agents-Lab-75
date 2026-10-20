# Lab 11 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 11 — Lab walkthrough"; then "Managed skills and progressive loading: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Turning over one shoulder to present a before-and-after comparison, right shoulder forward, looking toward the viewer. The prop illustrates Managed skills and progressive loading. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Compare all five offline variants and identify distinct session IDs."
Teaching context for the visual explanation (do not print this entire paragraph): Compare all five offline variants and identify distinct session IDs.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Preview the authored instructions and reference; confirm a host preview is not an agent read."
Teaching context for the visual explanation (do not print this entire paragraph): Preview the authored instructions and reference; confirm a host preview is not an agent read.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Run Metadata only and Failed read to distinguish attachment, attempted loading and successful loading."
Teaching context for the visual explanation (do not print this entire paragraph): Run Metadata only and Failed read to distinguish attachment, attempted loading and successful loading.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Compare revision v1 with v2 and inspect their different pinned versions."
Teaching context for the visual explanation (do not print this entire paragraph): Compare revision v1 with v2 and inspect their different pinned versions.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Matching file-read call and result evidence."
Teaching context for the visual explanation (do not print this entire paragraph): Matching file-read call and result evidence. Attached metadata does not establish that instructions or references were read. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Compare attached metadata with event evidence that SKILL.md was read. Explain why no observed read does not prove the skill was unavailable."
Teaching context for the visual explanation (do not print this entire paragraph): Compare attached metadata with event evidence that SKILL.md was read. Explain why no observed read does not prove the skill was unavailable. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

- **Skill variant** selects no attachment, pinned v1, missing ID, missing reference, or pinned v2.
- **Offline loading scenario** selects successful reads, metadata only, failed reads, duplicate events or a hanging stream.
- **Preview authored instructions / reference** loads an allowlisted host file. This preview is not an agent read and never changes a run's evidence.
- **Refresh pin metadata** checks the local manifest and bundle hashes without contacting Anthropic. Configured readiness is not verified provider access.
- **Run offline skill experiment** creates an authored fresh session. Missing ID creates no session.
- **Compare all offline variants** runs the five comparisons serially; every created session has a different ID. This button never runs a live comparison.
- **Cancel experiment** stops local waiting and initiates fresh bounded remote interrupt/status/archive requests through the shared runner.
- **Run live** explicitly runs one selected variant in a billed fresh session. It requires matching pins for attached skills. The host reads provider version metadata before session creation, but never uploads in a run request.

Routes under `/api/c11`: `GET /skills` returns authored metadata and pin readiness; `POST /load` previews a selected local file; `POST /invoke` and `POST /new-session` both run one fresh comparison turn and archive it after idle confirmation. These route names are host operations, not a provider Skill tool. Run requests require `X-Lab-Owner`. Each request owns its newly created session; callers cannot supply a remote session ID or control another request. At most two runs are active, and one per exercise owner. Retained-session controls remain in Labs 06 and 10.


## Evidence to inspect

Keep three layers separate: the authored bundle and its SHA-256; the configured immutable attachment and resolved session skills; and observed `read` tool uses correlated by event ID with `agent.tool_result`. Read attempts, successes and errors are distinct. Duplicate events count once. Instruction and reference reads are displayed separately, with their event IDs and paths.

Only clean absolute paths under a skills directory ending in the authored skill name and exact allowlisted filename are classified. A main-thread read result can show successful loading; an exact authored-text match provides additional evidence. This does not attest semantic compliance or independently prove the entire remote bundle. Truncated or line-numbered output may not establish an exact text match. Agent claims and host previews never count as read evidence. Unrecognized paths stay visible in full tool evidence JSON. A model may not load a relevant-looking skill; missing events are not proof of no read.

The session override pins the retrieved base agent version, preserves its model/system, replaces inherited tools with read only, clears MCP and attaches only the selected custom skill version. Unexpected resolved capabilities block the prompt and trigger cleanup of the returned session ID. Write, edit, bash and web tools are disabled by the toolset; a skill description does not authorize them. Unexpected pauses are denied. The lesson does not implement a manual-only Skill invocation API.

The session can return a numeric version alias while the configured immutable pin uses a `skver_` ID. The host preserves the raw returned version and resolves a numeric alias with a read-only, skill-scoped version lookup. It accepts only the exact configured skill and canonical version ID. Unknown aliases, unavailable lookups, extra skills and `latest` remain rejected before prompt submission; the created session ID is still available for cleanup. Raw and verified canonical versions appear separately in the evidence.

Live usage is aggregated only from deduplicated model-request spans. It includes observed input/output/cache counts, not complete billed session cost. Offline results have no measured usage. Cleanup is separate from completion and can remain pending; an interrupt acknowledgment is followed by status confirmation.


## Limitations

Fixtures teach the event protocol; they are not measured model relevance or quality. Missing reference in a live run requires its own explicitly uploaded snapshot. Revised versions apply in another fresh session, with no hot reload of existing sessions.

A local `.claude/skills` directory is not automatically mounted into a cloud session. A separately mounted trusted GitHub repository can expose its root `.claude/skills/<name>/SKILL.md` at session start. This lab mounts no repository. Review repository instructions before trusting that distinct discovery path. Plugin discovery, Agent SDK Skill tool calls, manual-only flags, hot reload and subagent preload APIs are not assumed. Skill filtering is not authorization. Child agents require independent worker skill/capability configuration; this lesson rejects multiagent bases.


## Challenge

Run With pinned skill using Metadata only, then successful reads. Compare configured/resolved metadata with the two read event pairs. Preview the reference and explain why that does not add agent evidence. Compare v1 and v2, then remove the reference. Predict which evidence can change while the attachment count remains one.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Edit ONLY the Result list in region1 "Prepare the baseline" of this Lab11 walkthrough. Replace the third result row "Session C (unique ID)" with "Missing ID: no session created" and a small red crossed-circle icon. A missing skill ID is rejected before session creation. Keep SessionA,SessionB,SessionD,SessionE rows and the note "Each created session has a different ID." unchanged. Preserve all other content, panels, astronaut pose, layout, colors and dimensions exactly.
````

COPY PROMPT END
