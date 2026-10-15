# Lab 43: MCP resources through a host bridge

## Prerequisites

Run the local development server. The lab opens a loopback-only MCP JSON-RPC fixture after local consent. No Anthropic key or internet access is needed.

## Controls

Grant local consent, list resources and templates, read a versioned resource, then try a known prompt, bad token, expired token and unknown URI. Refresh the bridge token and retry. Inspect toolsets to compare the host bridge with unavailable direct URL MCP.

## Exercise

The loopback server offers `tools/list`, `resources/list`, `resources/templates/list`, `prompts/list`, `resources/read` and `prompts/get`. Its bearer token stays server-side and is redacted in browser evidence. The host client accepts only server-owned URI versions, bounds result size and turns an approved resource read into a typed `user.custom_tool_result` fixture. Direct Managed URL MCP needs a reachable service and separate vault credentials; it does not automatically expose all resources, prompts or local callbacks. Credential changes follow documented idle update or a fresh session, not a fabricated reconnect control.

## Evidence to inspect

Compare consent, token state, transport method, URI, bounded result, resource version and custom tool result. Inspect `mcp-servers/lab43-resources.ts` and `server/lib/lab43-mcp-bridge.ts` for server authorization, URI allowlisting and transport close.

## Troubleshooting

If a host read is refused, grant consent or refresh the token. Unknown URIs remain refused. The expired-token scenario intentionally needs a new token before a subsequent authorized call.

## Limitations

This is a toy local consent flow and loopback HTTP fixture, not a production OAuth or remote MCP service. It makes zero Anthropic calls and does not configure direct Managed URL MCP. The returned custom-tool event is authored evidence, not an observed provider tool pause.

## Challenge

Refresh the bridge token and inspect the next authorized call.

## Run locally

```powershell
node --import tsx --test tests/lab43-mcp-bridge.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab43-browser-demonstration.mjs
```
