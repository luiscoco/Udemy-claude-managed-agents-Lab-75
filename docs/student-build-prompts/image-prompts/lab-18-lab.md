# Lab 18 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 18 — Lab walkthrough"; then "Cloud sandbox and host boundaries: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Standing with one boot on a platform and pointing at a diagram, three-quarter side view, looking upward toward the diagram. The prop illustrates Cloud sandbox and host boundaries. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Read the local platform manifest without starting a session."
Teaching context for the visual explanation (do not print this entire paragraph): Read the local platform manifest without starting a session.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Run Allowed mount and Outside mount offline; compare actual host read counts and hashes."
Teaching context for the visual explanation (do not print this entire paragraph): Run Allowed mount and Outside mount offline; compare actual host read counts and hashes.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Run Blocked network and Missing environment; inspect the fail-closed results and zero socket calls."
Teaching context for the visual explanation (do not print this entire paragraph): Run Blocked network and Missing environment; inspect the fail-closed results and zero socket calls.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Explicitly inspect live cloud metadata, then optionally start a bounded billed pwd diagnostic with host confirmation."
Teaching context for the visual explanation (do not print this entire paragraph): Explicitly inspect live cloud metadata, then optionally start a bounded billed pwd diagnostic with host confirmation.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Check cloud policy and host file boundaries separately."
Teaching context for the visual explanation (do not print this entire paragraph): Check cloud policy and host file boundaries separately. Cloud sandbox policy and disposable host filesystem tests establish different boundaries. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Explain why an unavailable configured environment fails closed before a session and why an offline host path denial does not prove cloud OS containment."
Teaching context for the visual explanation (do not print this entire paragraph): Explain why an unavailable configured environment fails closed before a session and why an offline host path denial does not prove cloud OS containment. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

On page load, `GET /api/c18/platform` reads **local configuration only**: environment ID, optional agent version pin, the authored policy and the single approved offline host fixture path. SDK 0.133.0 exposes no environment version field. A separately requested live availability check retrieves the environment's `updated_at` as a revision marker; it starts no session.

Use **Run offline host test** for Allowed mount, Outside mount, Blocked network and Missing environment. Each available case creates a disposable host tree. Allowed mount reads an exact allowlisted text file and hashes actual bytes. Outside mount is denied before a read. Blocked network is an authored host policy decision with zero socket calls; it is not a cloud egress test. Missing environment fails closed before creating a fixture tree. The tree is deleted after evidence is captured.

**Inspect live environment** is a deliberate metadata-only provider read. **Run live** separately rechecks the cloud policy, creates one budgeted session with only `bash` enabled under `always_ask`, and asks for `pwd`. The host confirms only the exact `pwd` command; all other calls are denied. The built-in command executes in the Managed cloud sandbox, never in native Windows PowerShell. No file resource is mounted in this live diagnostic. The result shows observed tool use, tool result and cleanup; an agent answer alone is not command evidence.

Routes under `/api/c18` are `GET /platform`, `POST /availability` and `POST /run`. Closed Zod requests reject Agent SDK native sandbox flags. Origin, owner, deadline, budget, concurrency, cancellation and session cleanup are bounded. Setup checks do not create a billed session.


## Evidence to inspect

Compare the four offline cases: one allowed read with a SHA-256 hash; outside path and blocked network with zero read/socket calls; missing environment with no fixture ID and no effects. Inspect the live environment ID, `updated_at`, network policy and archive status before a session. For a live run, require a matching `agent.tool_use`, host confirmation and non-error `agent.tool_result` for `pwd` before calling the command successful.


## Limitations

The offline network denial is simulated; no socket or cloud sandbox is exercised. The live diagnostic has no file mount, so it observes a remote `pwd` call only and cannot prove mount enforcement or every OS containment property. A permission flag governs agent tool use, while cloud environment configuration governs sandbox networking; custom host handlers still require their own validation. The environment's `updated_at` is not a version pin.


## Challenge

Run Missing environment and explain why no file read, socket call or session starts. Then contrast that result with Outside mount and explain why neither local observation proves cloud OS containment.

Official references checked 2026-10-15: [cloud environment setup](https://platform.claude.com/docs/en/managed-agents/environments), [secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment), [sandbox boundaries](https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks), and [cloud sandbox reference](https://platform.claude.com/docs/en/managed-agents/cloud-sandboxes-reference).


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END
