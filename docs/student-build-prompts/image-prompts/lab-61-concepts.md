# Lab 61 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 61 — Concept map"; then "Exposing an agent as an MCP server". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Kneeling while examining a holographic document with a magnifier, focused side posture with one glove pointing to a label. The prop illustrates Exposing an agent as an MCP server. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Expose a typed fictional support/refund review through a bearer-protected local MCP transport."
Teaching context for the visual explanation (do not print this entire paragraph): Expose a typed fictional support/refund review through a bearer-protected local MCP transport.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "Bearer checks and typed host-owned tool boundaries."
Teaching context for the visual explanation (do not print this entire paragraph): What protects the local MCP support transport? Bearer checks and typed host-owned tool boundaries.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "The MCP interface still needs authentication and checked application contracts."
Teaching context for the visual explanation (do not print this entire paragraph): The MCP interface still needs authentication and checked application contracts.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Run the local client and compare transport request, MCP session and agent session IDs."
Teaching context for the visual explanation (do not print this entire paragraph): Run the local client and compare transport request, MCP session and agent session IDs. Inspect one listed closed-schema tool, progress events and validated structured output.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "Bearer checks and typed host-owned tool boundaries."
Teaching context for the visual explanation (do not print this entire paragraph): Bearer checks and typed host-owned tool boundaries. The MCP interface still needs authentication and checked application contracts. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Send a valid MCP session ID with a different bearer identity and explain why authentication precedes lookup."
Teaching context for the visual explanation (do not print this entire paragraph): Send a valid MCP session ID with a different bearer identity and explain why authentication precedes lookup. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Run normal, timeout, cancellation and concurrent-call scenarios. The local client initializes a transport, receives `Mcp-Session-Id`, lists tools, calls `review_support_refund`, then deletes the transport session. The normal call receives progress notifications and a host-validated structured report. The timeout, cancellation and concurrent scenarios show distinct incomplete or rejected results.


## Evidence to inspect

Transport JSON-RPC request IDs (101–104), MCP session ID and the fictional agent-session ID are distinct. Authentication runs before request decoding and session lookup. Session capacity is four; each session permits one active call. The bearer token maps to a host-owned tenant and customer, so a foreign token cannot use another tenant's session. The tool's Zod-derived input permits only the fixed order, a bounded question and a test scenario. It does not expose shell commands or caller-selected workspaces. The output contains both MCP text content and an independently validated `structuredContent` object. There is no actual refund effect.


## Limitations

This is an application-authored 2025-11-25 JSON/SSE transport subset, not a general MCP SDK server or a live Managed agent. The [2026-07-28 MCP revision](https://modelcontextprotocol.io/specification/draft/changelog) removes protocol-level sessions; this lesson deliberately demonstrates the earlier sessionful contract and does not claim modern stateless compatibility. The host-created structured report is offline fixture evidence, not an observed model answer. A production server would need full MCP conformance, token rotation, rate limits and deployment controls.


## Challenge

Use a second host-issued bearer identity with a session created under the first. Verify the foreign-session request fails after authentication, and explain why a transport request ID cannot authorize session access.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Preserve six panels, astronaut, layout. Correct trust boundaries: browser does NOT receive bearer token. In panel 1 label first device 'Host MCP client (server-side)' instead of 'Local client (browser)'. The local MCP server calls a FICTIONAL agent fixture, no Managed session; change 'Managed agent' labels to 'Agent fixture (offline)'. Panel 4 first box 'Host MCP client', agent processing 'Authored fixture'. Add small 'Sessionful MCP 2025-11-25 teaching subset' subtitle inside panel 1. Panel 6 valid different bearer identity is AUTHENTICATED but ownership lookup rejects foreign MCP session, not authentication failure. Replace red result with 'Authenticated identity B; foreign session lookup refused'. Authentication precedes lookup, valid bearer is not itself unauthorized. No real refund. Everything else unchanged.
````

COPY PROMPT END
