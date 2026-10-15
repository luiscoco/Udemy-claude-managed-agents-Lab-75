# Lab 33: Human forms during tool work

## Prerequisites

Run the local development server. This exercise starts an authored local MCP stdio process; it needs no Anthropic key.

## Controls

**Start MCP form** creates a local MCP client/server exchange. **Submit form**, **Try invalid quantity**, **Decline**, **Abort waiting**, and **Inspect state** control the pending elicitation. Choose **timeout** to watch the host deadline. **url-consent** shows a fixed fictional local consent path.

## Exercise

The host initializes a local MCP server, discovers `collect_field_note`, and calls it. That tool requests `elicitation/create` with a closed date and quantity form. The host retains separate run, MCP request, custom-tool call and consent IDs. A valid answer passes the host Zod schema, returns one response to the MCP request, and lets the server complete its tool call. The host then constructs one correlated `user.custom_tool_result` shape for the bridge. No Managed session is contacted in the offline exercise.

Try an invalid quantity or date. The host rejects it before sending a result to MCP, leaving the form pending. Decline returns an MCP error result. Timeout and abort close the local transport without claiming a completed answer.

## Evidence to inspect

Compare the distinct identifiers, protocol evidence, answer count, MCP tool result, and final custom-tool result. Inspect `mcp-servers/lab33-form.mjs`, `server/lib/lab33-elicitation.ts`, and the closed schemas.

## Troubleshooting

If a pending form expires, start a new run. Responses with mismatched IDs or a foreign owner are rejected. An invalid value does not consume the form.

## Limitations

This is local MCP over stdio with a host bridge. Direct cloud MCP `onElicitation` callback support is not assumed. The consent path is same-origin and fictional; it is not a real OAuth authorization or arbitrary URL navigation. The offline fixture has zero provider calls.

## Challenge

Submit invalid values and identify the host schema layer that rejects them before the MCP server receives a reply.

## Run locally

```powershell
node --import tsx --test tests/lab33-mcp-elicitation.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab33-browser-demonstration.mjs
```
