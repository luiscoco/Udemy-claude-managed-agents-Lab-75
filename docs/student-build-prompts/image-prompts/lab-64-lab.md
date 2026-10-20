# Lab 64 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 64 — Lab walkthrough"; then "Browser tools across host and cloud: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Floating diagonally while guiding a glowing arrow between panels, focused side posture with one glove pointing to a label. The prop illustrates Browser tools across host and cloud. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Inspect a fictional product through an isolated local browser and MCP snapshot."
Teaching context for the visual explanation (do not print this entire paragraph): Inspect a fictional product through an isolated local browser and MCP snapshot.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Fill the fictional form using allowlisted MCP tools, then check its DOM confirmation."
Teaching context for the visual explanation (do not print this entire paragraph): Fill the fictional form using allowlisted MCP tools, then check its DOM confirmation.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Try blocked external navigation and a missing-browser scenario."
Teaching context for the visual explanation (do not print this entire paragraph): Try blocked external navigation and a missing-browser scenario.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Compare tool events with independent browser proof and cloud reachability limits."
Teaching context for the visual explanation (do not print this entire paragraph): Compare tool events with independent browser proof and cloud reachability limits.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "The actual fixture DOM and screenshot evidence."
Teaching context for the visual explanation (do not print this entire paragraph): The actual fixture DOM and screenshot evidence. Host-side Playwright MCP must be checked against real page state. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Explain why successful MCP tool prose without DOM and screenshot checks is insufficient browser proof."
Teaching context for the visual explanation (do not print this entire paragraph): Explain why successful MCP tool prose without DOM and screenshot checks is insufficient browser proof. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

**Inspect product** navigates to the fixed fictional field kit page, requests an MCP snapshot and independently checks heading and price in the live DOM. **Fill fictional form** uses MCP fill and click operations, then checks the rendered confirmation. **Try blocked navigation** submits an external URL to the host bridge; the host refuses it before MCP dispatch. **Missing browser** shows the absence of proof without a model claim.


## Evidence to inspect

The host client connects to pinned `@playwright/mcp@0.0.83` through an in-memory MCP transport. Only navigate, snapshot, fill, click and screenshot are issued; unsafe evaluation, file upload, download and arbitrary URLs are not bridged. A Playwright route blocks requests beyond the fixture origin, including redirected requests. Each run gets a fresh host browser context and fixture server. Proof checks MCP snapshot text against independent live DOM reads and a host-captured screenshot. Model prose and cloud event fixtures are not browser proof.

The screenshot route requires the same local experiment owner as the run. The cloud Managed session cannot access host localhost or spawn this local MCP server; a reachable remote browser is a separate setup and is not configured here.


## Limitations

This is a local, guided browser experiment. The attached host context requires `isolated: false` in the MCP connection; `isolated: true` asks the package to create an unsupported second context. The host already creates a fresh temporary profile for each run. It does not grant a cloud agent browser access. The fixture form records no real personal information.


## Challenge

Compare the MCP action trace with the host-verified DOM fields and screenshot. Explain why a successful tool result alone cannot prove the expected product state.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Preserve six panels, astronaut pose, all text and layout. Replace all blue T-shirt product illustrations in the browser thumbnails and astronaut prop with the fictional blue Field Kit backpack used in Lab64. Use the same backpack visual as the concept map, no new prices or product details. This is the fixed field-kit fixture page, not a clothing shop. No other changes.
````

COPY PROMPT END
