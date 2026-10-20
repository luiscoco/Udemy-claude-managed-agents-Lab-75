# Lab 72 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 72 — Lab walkthrough"; then "Document generation with Skills: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Standing with one boot on a platform and pointing at a diagram, three-quarter view with the prop beside the helmet. The prop illustrates Document generation with Skills. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Build an incident report and inspect the two progressive reference reads."
Teaching context for the visual explanation (do not print this entire paragraph): Build an incident report and inspect the two progressive reference reads.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Compare an ordinary document with the incident contract."
Teaching context for the visual explanation (do not print this entire paragraph): Compare an ordinary document with the incident contract.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Run invalid spec, placeholder and skill tamper scenarios and inspect rejection."
Teaching context for the visual explanation (do not print this entire paragraph): Run invalid spec, placeholder and skill tamper scenarios and inspect rejection.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Probe command policy and download only verified documents for visual review."
Teaching context for the visual explanation (do not print this entire paragraph): Probe command policy and download only verified documents for visual review.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Independent package inspection and a closed specification."
Teaching context for the visual explanation (do not print this entire paragraph): Independent package inspection and a closed specification. Deterministic generation and independent artifact checks are separate steps. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Explain why a valid OOXML package does not prove factual correctness or good pagination in Word."
Teaching context for the visual explanation (do not print this entire paragraph): Explain why a valid OOXML package does not prove factual correctness or good pagination in Word. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Choose incident or ordinary and Build document. The scripted agent uses only read_spec_reference, write_spec and build_document. It cannot run arbitrary commands. Compare invalid-spec, placeholder, injection and skill-tamper fixtures. The injection scenario preserves conflicting impact counts and excludes instructions and the fake token from the report. Check command policy inspects a string without executing it. Download verified DOCX fetches an owner-scoped opaque file ID.


## Evidence to inspect

Inspect correlated custom tool result IDs, both reference reads for incidents, the authored skill SHA256 manifest, independent package checks and the separate incident contract. Reports preserve both 120 and 145 as unconfirmed impact estimates, an unknown root cause and explicit unassigned owners. ZIP timestamps, ordering and document properties are fixed. Numbered lists restart independently. XML-like input is literal text and is escaped; there is no inline markup grammar.

Each session copies the five allowlisted skill files into `docgen-lab/runs/<uuid>`. The host verifies every skill hash before execution and afterward, invokes only the fixed builder path and arguments with no shell, and independently reads the output ZIP. Downloads repeat integrity checks. Cancellation terminates only the local builder; no remote session exists in this exercise. Owner headers isolate local fixtures and are not production authentication.


## Limitations

The scripted exercise does not claim model-generated tool calls or remote skill loading. The live query route explicitly rejects unsupported mode. `npm run docgen:package` creates a local ZIP and hash manifest only; deliberate upload and immutable version configuration are separate setup through the Managed Skills API, as explained in Lab 11. Do not reuse its format-observation pins for this different skill. Configure a dedicated read-only Managed agent with only these custom tools before adding a live adapter. Do not give remote agents host shell access or assume remote skill paths equal local paths.

Package checks validate the narrow authored OOXML profile, not all possible Word documents, factual correctness, semantic compliance or pagination. Open the downloaded document in Word and inspect every page, table, footer and list restart. Automated package checks cannot substitute for that visual review. Skill hashes attest bytes, not trustworthiness of their instructions. The intentionally tiny grammar supports literal text and native lists only.


## Challenge

Add two separate numbered lists and XML-looking text. Show that each list starts at one and markup remains visible text. Remove an incident section and explain why ordinary package validation and the incident contract answer different questions.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Correct two areas while preserving six panel outlines, dimensions, style, astronaut and other accurate content. Panel 1 MUST show correct order: Build document request -> two progressive reference reads -> generated incident DOCX, NOT generated DOCX before reference reads. Panel 4 command policy check is an independent NONEXECUTING string inspection; separate it visually from document generation (no arrow implying approval starts build). Document generation flow is 'Local scripted agent' -> closed host tools read_spec_reference/write_spec/build_document -> verified DOCX -> visual Word review. Replace 'Managed agent with Skills' with 'Local scripted agent'. No live model request or remote skill mounting in this exercise.
````

COPY PROMPT END
