# Lab 55 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 55 — Concept map"; then "Official SDK and API upgrades". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Kneeling while examining a holographic document with a magnifier, relaxed diagonal posture with elbows spread. The prop illustrates Official SDK and API upgrades. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Rehearse SDK and Managed API compatibility gates, canary, promotion and rollback without changing the locked teaching app."
Teaching context for the visual explanation (do not print this entire paragraph): Rehearse SDK and Managed API compatibility gates, canary, promotion and rollback without changing the locked teaching app.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "Compatibility gates, canary, promotion and rollback."
Teaching context for the visual explanation (do not print this entire paragraph): What does the upgrade rehearsal test? Compatibility gates, canary, promotion and rollback.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "This lesson rehearses change gates without silently upgrading the app."
Teaching context for the visual explanation (do not print this entire paragraph): This lesson rehearses change gates without silently upgrading the app.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Inspect the installed 0.133.0 baseline and separate npm, API and pinned resource identities."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect the installed 0.133.0 baseline and separate npm, API and pinned resource identities. Analyze each candidate fixture and identify which server check blocks it.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "Compatibility gates, canary, promotion and rollback."
Teaching context for the visual explanation (do not print this entire paragraph): Compatibility gates, canary, promotion and rollback. This lesson rehearses change gates without silently upgrading the app. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Make one candidate fixture lose a required event type and explain why a version bump alone cannot authorize promotion."
Teaching context for the visual explanation (do not print this entire paragraph): Make one candidate fixture lose a required event type and explain why a version bump alone cannot authorize promotion. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Analyze each candidate fixture to inspect server-computed checks. A client-supplied `eligible: true` is intentionally ignored. The compatible fixture can enter an **authored canary**, then a simulated promotion and rollback. Removed event types, changed stream order, permission drift, missing usage, quality regression and missing evidence each block advancement at a different check.


## Evidence to inspect

The baseline records npm 0.133.0, the Managed beta header, required session and send-event unions, open-before-send ordering, pinned and restricted configuration, host-owned permissions, usage handling, eval results and separately named agent/environment/skill pins. Candidate npm version stays unknown because no candidate package is installed. API compatibility is reported independently of npm identity. A missing event type or changed stream sequence is incompatible; absent evidence remains unknown rather than passing.

The state machine advances only from candidate to authored canary to simulated promotion. It checks every gate on the server and records an explicit rollback. Canary evidence is an authored fixture, not an observed release trial. Rollback affects the hypothetical host version only; already-created remote sessions and their effects would still require reconciliation.


## Limitations

The candidate comparisons are deterministic offline fixtures. They do not verify a real new npm release, provider API availability or model quality. The pinned versions shown are fictional rehearsal labels, not actual provisioned resources. No automatic dependency upgrade, deployment, provider request or remote rollback occurs.


## Challenge

Remove `user.custom_tool_result` from a candidate event manifest. Identify the failed union check, decide whether the API contract is compatible, and explain why a larger npm version number would not permit promotion.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
