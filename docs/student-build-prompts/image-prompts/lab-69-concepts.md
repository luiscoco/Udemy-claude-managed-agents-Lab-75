# Lab 69 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 69 — Concept map"; then "Desktop and IDE host integration". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Reaching upward to connect two suspended interface panels, three-quarter view with the prop beside the helmet. The prop illustrates Desktop and IDE host integration. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Supply explicit document context from a trusted host and apply a reviewed patch only when version and hash still match."
Teaching context for the visual explanation (do not print this entire paragraph): Supply explicit document context from a trusted host and apply a reviewed patch only when version and hash still match.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "When the trusted document version and hash still match."
Teaching context for the visual explanation (do not print this entire paragraph): When may a reviewed document patch be applied? When the trusted document version and hash still match.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "The host checks the current document before applying a reviewed patch."
Teaching context for the visual explanation (do not print this entire paragraph): The host checks the current document before applying a reviewed patch.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Start a guided review and inspect preview events and the proposed replacement before applying."
Teaching context for the visual explanation (do not print this entire paragraph): Start a guided review and inspect preview events and the proposed replacement before applying. Change the local document after proposal and confirm the older patch is rejected.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "When the trusted document version and hash still match."
Teaching context for the visual explanation (do not print this entire paragraph): When the trusted document version and hash still match. The host checks the current document before applying a reviewed patch. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Change a document after its context snapshot and explain why a valid remote patch still cannot apply."
Teaching context for the visual explanation (do not print this entire paragraph): Change a document after its context snapshot and explain why a valid remote patch still cannot apply. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

**Start guided review** captures explicit document text, version and SHA-256 hash. Inspect previews and the proposed replacement. **Apply reviewed patch** asks the local host to check identity, correlation, version and hash before changing the document. **Change local document** makes an older patch conflict. Choose transport failure or hang to inspect errors and **Cancel review**. Live review is available only with existing Managed setup and explicit user selection.


## Evidence to inspect

The backend validates the context hash and final closed patch JSON. A remote sandbox never directly edits the local document. One active run per host owner, a global concurrency bound, a deadline and correlation deduplication control execution. Cancellation requests and cleanup evidence are separate. A lost start response can be resolved by correlation ID before cleanup is requested.

The extension manifest declares workspace-trust requirements. Its trusted Node host resolves the active saved document through real paths inside an allowed workspace folder; the webview sends only closed start/cancel/apply messages and correlation IDs. The webview has no network access or local resource roots and renders evidence through `textContent`. The host ignores stale messages, aborts polling on disposal, requests backend cancellation with a fresh signal and checks cleanup. Patch application rechecks workspace trust, URI/document identity, version and hash, then uses the VS Code editor edit operation.


## Limitations

The browser is a simulation of a host document. Tests execute the bundled extension in a mocked VS Code host and validate actual file guards; a separate real VS Code 1.142.0 run also passed the actual command/webview, guided patch apply and concurrent-edit conflict checks. The fixture does not grant arbitrary file tools or cloud access to local paths. Live mode reuses the existing text-only Managed runner and validates final JSON; the later authorized live backend smoke test validated a patch and host apply, then confirmed remote archival. Run npm run test:editor:real separately to repeat the installed-editor check. It uses an isolated disposable profile and copied fictional document, with zero provider calls; workspace trust is disabled only in that fixture profile. Set LAB69_VSCODE_EXECUTABLE if needed. See [live evidence](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/blob/main/docs/course-validation.md).


## Challenge

Capture context, obtain a valid patch, then edit the document locally. Explain why the patch's correct JSON and correlation still cannot overcome the version/hash conflict.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Correct only panel 4 first caption. Replace the setup requirement with 'Capture fictional document context; guided mode needs no API key'. The guided review must not require a Managed Agents setup. Preserve six panel outlines, dimensions, astronaut, and all other accurate content.
Follow-up: Correct ONLY the bottom panel 6 subtitle, which currently incorrectly says a changed document's patch can still apply. Exact replacement: 'Change a document after its context snapshot and explain why the stale patch must be rejected.' Keep all other corrected content, panel outlines, dimensions, layout and astronaut unchanged.
````

COPY PROMPT END
