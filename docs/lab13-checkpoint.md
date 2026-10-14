# Lab 13 checkpoint: MCP connections and reachability

Implemented the workbook's next lesson in the existing Managed Agents stack. It preserves Labs 01–12 and uses the shared visual layout. The independent private repository is [Udemy-claude-managed-agents-Lab-13](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-13); publication is verified against local HEAD after pushing.

## Implemented

- Real protocol-only notes stdio server and authenticated loopback Streamable HTTP inventory server, pinned to MCP 2025-11-25. Both are owned by the exercise and stopped on close.
- Strict bounded MCP clients, request/result correlation, initialization/tool discovery, local 401/404 experiments and server-only bearer credentials. The child process receives a minimal environment without the Managed API key.
- Typed host custom-tool bridge and a separate native Managed HTTPS inventory path with a matching toolset and existing vault attachment. No browser URLs/commands/tokens, automatic tunnel, OAuth flow or provider provisioning.
- Owned fictional stock effects and reset; disabled or invalid calls fail before MCP dispatch. Native mode is inventory-only and read-only. Local stock is never presented as a cloud measurement.
- Retained-session owner/capacity/expiry/deadline controls, idle server/tool updates, correlated subsequent user turns, separate native tool-use/result evidence and host result-submission acknowledgment.
- Shared tool-session runner gains opt-in retention only for completed, confirmed-idle sessions. Default archive behavior remains unchanged for earlier labs. Failed setup retains returned session identity for cleanup; late creation and shutdown are tested.
- Bounded retained text: call text shares a 64 KiB encoded budget, and agent messages share 48 KiB, with per-field caps. Histories retain at most 10 turns, 40 calls and 80 protocol observations. Histories are teaching evidence, not a complete audit or billing record.

## Verification

- Full offline regression run: 188 tests passed. This run preceded three additional focused edge-case tests.
- Focused Lab 13 suite: 14 tests cover real stdio/HTTP transports, authentication, origin/protocol checks, dispatch guards, retained updates, cancellation/deadline, capacity/ownership, SDK-injected native parameters/event correlation, routing, late creation, mismatched setup and failed result submission.
- Browser run: all 16 checks passed (4 Lab 13, 4 Lab 12 and 8 shell/navigation checks). These prove valid local calls, disabled effects, 401/404 failures, cancelled cleanup, phone overflow and native setup gating without a paid run.
- Typecheck and guide audit passed for registered IDs 1–13. Guide/source/rendering tests: 4 passed.
- Production build passed, with the pre-existing nonfatal dynamic-import notices for teaching files.
- Post-build distribution scan passed: 1260 files checked, with no `.env` contents read. Generated screenshots are excluded from Git and npm packaging.
- Offline screenshot demonstration passed at 390 and 1440 pixels; both images were reviewed for readable controls/evidence and page overflow. Every demonstration session was closed.

## Reproduce

Run the PowerShell commands in README and `node scripts/lab13-browser-demonstration.mjs`. It uses the running app at `http://127.0.0.1:5174` by default, executes only offline plans with real local transports, saves ignored phone/desktop screenshots in `artifacts/lab13/`, and closes each owned session.

## Limits

No paid provider turn or externally reachable MCP deployment was performed. Native URL/vault availability, endpoint DNS/environment policy, cloud connectivity and model-selected tool behavior require deliberate user validation. The local demo is a bounded 2025 protocol subset with JSON HTTP responses, not a general MCP gateway, persistent service or production OAuth implementation. Configuration metadata does not attest connectivity; agent completion does not attest tool success. Local transport cleanup and remote archive are reported separately, including unknown/pending cleanup.

Provider features were checked against installed SDK 0.133.0 and the official [Managed MCP connector](https://platform.claude.com/docs/en/managed-agents/mcp-connector). Transport behavior follows the pinned [MCP 2025-11-25 specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).
