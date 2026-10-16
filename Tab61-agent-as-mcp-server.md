# Lab 61: Exposing an agent as an MCP server

## Prerequisites

Run the local learning platform. This lesson implements a narrow, sessionful [MCP 2025-11-25 Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) subset for one fictional support/refund review tool. The browser's demo invokes a local MCP client on the server; its bearer token is never sent to the browser. `LAB61_MCP_TOKEN` can configure an external client's token on the server, otherwise an ephemeral token is generated. No Anthropic API key or Managed agent is required.

## Controls

Run normal, timeout, cancellation and concurrent-call scenarios. The local client initializes a transport, receives `Mcp-Session-Id`, lists tools, calls `review_support_refund`, then deletes the transport session. The normal call receives progress notifications and a host-validated structured report. The timeout, cancellation and concurrent scenarios show distinct incomplete or rejected results.

## Evidence to inspect

Transport JSON-RPC request IDs (101–104), MCP session ID and the fictional agent-session ID are distinct. Authentication runs before request decoding and session lookup. Session capacity is four; each session permits one active call. The bearer token maps to a host-owned tenant and customer, so a foreign token cannot use another tenant's session. The tool's Zod-derived input permits only the fixed order, a bounded question and a test scenario. It does not expose shell commands or caller-selected workspaces. The output contains both MCP text content and an independently validated `structuredContent` object. There is no actual refund effect.

## Troubleshooting

403 means bearer authentication failed. A 404 after authentication can mean an unknown, expired or foreign MCP session. 409 on a second active call means the session's concurrency bound held. A timed-out call returns an MCP tool error result; local cancellation stops the waiting client and closes the transport. Closing the server aborts pending requests and clears sessions.

## Limitations

This is an application-authored 2025-11-25 JSON/SSE transport subset, not a general MCP SDK server or a live Managed agent. The [2026-07-28 MCP revision](https://modelcontextprotocol.io/specification/draft/changelog) removes protocol-level sessions; this lesson deliberately demonstrates the earlier sessionful contract and does not claim modern stateless compatibility. The host-created structured report is offline fixture evidence, not an observed model answer. A production server would need full MCP conformance, token rotation, rate limits and deployment controls.

## Challenge

Use a second host-issued bearer identity with a session created under the first. Verify the foreign-session request fails after authentication, and explain why a transport request ID cannot authorize session access.

## Run locally

```powershell
node --import tsx --test tests/lab61-agent-mcp-server.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab61-browser-demonstration.mjs
```
