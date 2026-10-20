# Lab 67 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 67 — Lab walkthrough"; then "A multi-tenant SaaS architecture: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Leaning backward in zero gravity while holding two linked modules, three-quarter view with the prop beside the helmet. The prop illustrates A multi-tenant SaaS architecture. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Simulate Alice/Acme and Bob/Birch sign-ins; inspect host-selected tenant and project identities."
Teaching context for the visual explanation (do not print this entire paragraph): Simulate Alice/Acme and Bob/Birch sign-ins; inspect host-selected tenant and project identities.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Start both tenants concurrently and inspect separate reservation and usage ledgers."
Teaching context for the visual explanation (do not print this entire paragraph): Start both tenants concurrently and inspect separate reservation and usage ledgers.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Probe Birch objects as Acme and compare five refusals with the still-running Birch run."
Teaching context for the visual explanation (do not print this entire paragraph): Probe Birch objects as Acme and compare five refusals with the still-running Birch run.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Try another active run, a failed runner and exhausted quota; confirm reservations release once."
Teaching context for the visual explanation (do not print this entire paragraph): Try another active run, a failed runner and exhausted quota; confirm reservations release once.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Across sources, runs, sessions, transcripts and cancellation."
Teaching context for the visual explanation (do not print this entire paragraph): Across sources, runs, sessions, transcripts and cancellation. Ownership and quota boundaries must hold throughout the operation lifecycle. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Add a tenant field to a model tool input or start body and explain why it cannot choose authority."
Teaching context for the visual explanation (do not print this entire paragraph): Add a tenant field to a model tool input or start body and explain why it cannot choose authority. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

**Simulate both sign-ins** creates two host-authenticated fixture identities. Choose **Hold for concurrency probes**, then **Run both tenants** to hold separate reservations. **Probe Birch as Acme** attempts foreign run, session, source, transcript and cancellation access; all five should return HTTP 404. **Try another Acme run** shows the per-tenant concurrency reservation. **Cancel own Acme run** releases only Acme's reservation. Choose the failure scenario to inspect release without charge. Repeated successful runs consume the six illustrative units of tenant quota.


## Evidence to inspect

The host maps each opaque token to a principal, tenant and project. Neither a client body nor model input can choose tenant authority. A closed Zod-derived `read_project_policy` custom tool validates its source ID and checks the host tenant before returning `user.custom_tool_result` correlated by `sevt_` ID. A separate principal-scoped request ID deduplicates starts and reservations. Unused built-in tools, MCP and skills are disabled in this offline path.

Every protected read, transcript and cancellation checks the host tenant and project. One active run per tenant reserves two illustrative units before starting; the reservation releases exactly once on completion, failure, cancellation or shutdown. Only success charges usage. Rate limits and workshop capacity bound admission. The two tenants can run concurrently without sharing quota.


## Limitations

This workshop uses process-local stores and an illustrative unit ledger. Production replaces the selector with verified identity claims, durable tenant-scoped storage and atomic distributed reservations. It also needs token expiry and revocation. The fixture session IDs identify authored local evidence, not cloud sessions.


## Challenge

Try to add `tenant: "birch"` to an Acme start body or custom-tool input. Identify the closed-schema rejection and the host identity check that still protects source reads.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
