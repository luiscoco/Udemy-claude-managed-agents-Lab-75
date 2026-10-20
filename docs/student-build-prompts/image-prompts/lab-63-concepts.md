# Lab 63 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 63 — Concept map"; then "A safe database agent". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Reaching upward to connect two suspended interface panels, focused side posture with one glove pointing to a label. The prop illustrates A safe database agent. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Read tenant-scoped orders through fixed queries and let a separate human endpoint commit one checked cancellation."
Teaching context for the visual explanation (do not print this entire paragraph): Read tenant-scoped orders through fixed queries and let a separate human endpoint commit one checked cancellation.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "A separate human endpoint after host validation."
Teaching context for the visual explanation (do not print this entire paragraph): Who commits the checked order cancellation? A separate human endpoint after host validation.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "Read access and the reviewed mutation endpoint have separate authority."
Teaching context for the visual explanation (do not print this entire paragraph): Read access and the reviewed mutation endpoint have separate authority.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Create a disposable SQLite session and inspect query-only state."
Teaching context for the visual explanation (do not print this entire paragraph): Create a disposable SQLite session and inspect query-only state. Read the host tenant order, propose cancellation and confirm no order row changed.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "A separate human endpoint after host validation."
Teaching context for the visual explanation (do not print this entire paragraph): A separate human endpoint after host validation. Read access and the reviewed mutation endpoint have separate authority. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Change the order version after proposal and show why the checked UPDATE rolls back rather than cancelling it."
Teaching context for the visual explanation (do not print this entire paragraph): Change the order version after proposal and show why the checked UPDATE rolls back rather than cancelling it. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Create a session, read the fixed order `O-A1`, and propose cancellation. A proposal records the order version, a stable business key, a five-minute expiry and an audit entry, but leaves the order open. **Approve as human** or **Reject as human** uses a separate endpoint. For stale and expired experiments, create a new session and proposal, then change the row version or advance the fixture clock before approval. **Try arbitrary SQL** sends text that the host deliberately never executes.


## Evidence to inspect

The host chooses tenant identity; the browser cannot supply a tenant. Fixed parameterized SELECT queries include the tenant predicate. Agent custom-tool schemas for read and propose are Zod-derived, closed and correlated to `user.custom_tool_result` by the `sevt_` event ID. A stable cancellation effect key is separate from the tool event. Both SQLite connections report `PRAGMA query_only=ON` outside host-controlled writes.

The human approval path uses `BEGIN IMMEDIATE` and a single `UPDATE` whose WHERE clause checks order ID, host tenant, open status and captured row version. Exactly one row must change or the transaction rolls back. Proposal status and audit are recorded. A replay of a decided proposal is rejected. Agent prose never counts as a database commit.


## Limitations

The database is a fictional local fixture. It demonstrates narrow host tools and approval control, not a production multi-tenant database deployment. The live Managed custom-tool shape is modeled and tested, but no Managed session calls it. No general SQL execution, shell tool or caller-selected workspace is exposed.


## Challenge

Propose cancellation, change the row version, then approve. Identify the zero-row update, rollback, stale proposal and unchanged open order.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
