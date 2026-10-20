# Lab 13 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 13 — Concept map"; then "MCP connections and reachability". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Kneeling while examining a holographic document with a magnifier, three-quarter side view, looking upward toward the diagram. The prop illustrates MCP connections and reachability. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Connect real local MCP transports, separate configuration from observed reachability, and compare host bridges with native Managed HTTPS MCP."
Teaching context for the visual explanation (do not print this entire paragraph): Connect real local MCP transports, separate configuration from observed reachability, and compare host bridges with native Managed HTTPS MCP.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "No; inspect observed connection and transport evidence."
Teaching context for the visual explanation (do not print this entire paragraph): Does MCP configuration prove reachability? No; inspect observed connection and transport evidence.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "Configured transport and observed reachability are distinct."
Teaching context for the visual explanation (do not print this entire paragraph): Configured transport and observed reachability are distinct.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Run Working offline and inspect the real notes stdio and authenticated inventory HTTP handshakes."
Teaching context for the visual explanation (do not print this entire paragraph): Run Working offline and inspect the real notes stdio and authenticated inventory HTTP handshakes. Compare advertised tools with effective tools. Enable fictional reservation, apply the idle configuration and attempt one reservation.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "No; inspect observed connection and transport evidence."
Teaching context for the visual explanation (do not print this entire paragraph): No; inspect observed connection and transport evidence. Configured transport and observed reachability are distinct. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Disable a server and inspect which calls remain possible. Prove the disabled tool had no host MCP effect, and explain why local success does not prove cloud access."
Teaching context for the visual explanation (do not print this entire paragraph): Disable a server and inspect which calls remain possible. Prove the disabled tool had no host MCP effect, and explain why local success does not prove cloud access. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

- Run offline MCP experiment creates owned local transports and an authored agent session, then executes the chosen tool plan through real MCP. Create offline MCP session prepares connections without sending a prompt.
- Working proves local protocol handshakes and tool discovery. Missing uses a fixed nonexistent notes script and missing local HTTP path; Unauthorized supplies an intentionally wrong local credential. Hang exercises cancellation without paid execution.
- Enable/disable the notes server, inventory server or fictional reservation tool, then Apply idle MCP configuration to the retained session. Proposed controls do not change effective configuration until applied.
- Inspect lists notes and calls get_stock. Reserve attempts to reserve one fictional NOTEBOOK. Offline plans deliberately attempt even disabled calls to demonstrate rejection before host dispatch; a live model selects its own calls.
- Reset owned local stock restores only that exercise's fictional inventory while idle. Inspect local stock and session reads the actual host checkpoint, including after cancellation. The host snapshot is never labeled a remote inventory measurement.
- Close MCP session stops the owned child process and HTTP listener, then confirms remote idle and archives. Cancellation of an in-flight stream requests cleanup; inspect afterward before attempting reuse.
- Run live deliberately starts billed work. The host bridge declares typed custom tools and returns their results via `user.custom_tool_result`; it does not pretend those calls were native agent.mcp_tool_use events. Native mode is inventory-only and read-only, declares a matching URL/server toolset and attaches the existing vault at creation. It never forwards browser-supplied URLs, credentials, stdio commands or provider session IDs.


## Evidence to inspect

Connection observations separate advertised tool names from the effective allowlist. A `ready-local` result means a real local MCP handshake/discovery succeeded; `configured-cloud` means configuration metadata only. Neither proves cloud connectivity. The inventory client records actual HTTP 401/404 failures and correlated JSON-RPC request IDs; the notes client consumes protocol-only newline-delimited stdout.

Each bridged call records the agent custom-use event, validated host dispatch, MCP result text or pre-dispatch rejection. Disabled/unknown/invalid calls never reach the tool handler. A transport error after a dispatch is not proof that a mutation did not happen; inspect local stock before retrying. Host answer IDs are deduplicated by the shared tool-session runner.

Native calls require matching agent.mcp_tool_use/result events; unmatched results do not manufacture success. The provider may report connection/authentication session errors even after successful session creation. Result content is reported provider evidence, not an independent host-side remote stock check. Unexpected permission pauses are denied rather than permitting unreviewed tools.

A completed agent turn can contain tool errors. Check the call outcomes and actual stock, not the agent's claims. Only a completed, confirmed-idle session is retained for another turn. Other outcomes follow existing interruption/archive semantics and can leave cleanup pending. Session ownership, two-session capacity, deadlines, idle expiry, bounded turns/calls and local-origin checks protect the host state. Every subsequent live turn gates the provider stream on its newly returned user event ID, so old idle events cannot finish a new turn.

The host bridge uses only two authored server destinations. Its child process receives a minimal environment without the Managed API key. The inventory bearer token is generated on the server and retained only in memory. Native mode takes one configured HTTPS destination from server settings; credential attachment uses `vault_ids`, with no invented token field on mcp_servers. Idle updates change tools and MCP server lists together; model changes remain a separate session operation.

| Route | Purpose |
| --- | --- |
| GET /api/c13/servers | Authored catalog and local setup metadata; no provider calls |
| POST /api/c13/session | Prepare owned transports and a retained session |
| POST /api/c13/query | Create and run one explicit turn through shared SSE |
| POST /api/c13/send | Run another turn in an owned idle session |
| POST /api/c13/configure | Apply supported idle tool/server configuration |
| POST /api/c13/end | Stop local transports and request verified remote cleanup |
| GET /api/c13/stock | Inspect owned host inventory and session checkpoint |
| POST /api/c13/stock/reset | Reset idle fictional host inventory only |


## Limitations

The servers are small teaching implementations pinned to MCP 2025-11-25, not general MCP gateways or production OAuth services. No public exposure, tunnel, vault provisioning or paid validation is automatic. Native endpoint DNS/environment reachability, vault URL matching, live tool behavior and model availability require deliberate user testing. Local discovery does not mount a .claude folder or stdio process in a Managed sandbox. Metadata does not attest connectivity. State is in-memory and tied to the local server process; output and event histories are bounded.

See the official [Managed MCP connector](https://platform.claude.com/docs/en/managed-agents/mcp-connector) for URL declarations, toolset policies, vault matching and provider errors, and the pinned [MCP transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) for stdio and Streamable HTTP behavior.


## Challenge

Enable reservation, apply configuration and reserve one NOTEBOOK. Disable inventory, apply again and attempt the same reservation. Confirm the second call is rejected before MCP dispatch and stock stays unchanged. Then explain what additional evidence a native cloud connection would require.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Change ONLY the diagram under the title/summary in region1. Show TWO SEPARATE execution paths, not a connection between them. Upper row: "Host bridge" with Browser -> Local host -> Notes stdio / Inventory HTTP. Lower row: "Native Managed MCP" with Managed runtime -> Configured HTTPS endpoint (inventory only, read-only). Separate the rows clearly and label "Compare paths — local success does not prove cloud access." There must be NO arrow connecting the local transports to the native Managed MCP box. Keep region1 exact heading and summary, panel bounds, all other regions, astronaut and dimensions unchanged.
````

COPY PROMPT END
