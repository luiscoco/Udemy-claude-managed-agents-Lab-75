# Lab 24: Who owns the agent loop

This lab compares a manual Messages loop, the installed Messages SDK tool runner, and Managed session custom tools. The offline adapters use distinct authored event shapes but dispatch every call through the same host inventory handler. Direct Messages requests and Managed sessions are separate API surfaces; no Agent SDK dependency is used.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=24`. Offline experiments need no API key. The installed `@anthropic-ai/sdk` version is pinned at `0.133.0`; its `beta.messages.toolRunner` method is present in the local type declarations. Live paths need independent reviewed setup and opt-in, and are unavailable in this checkpoint.

## Controls

Choose Manual Messages loop, Messages SDK tool runner, or Managed session custom tools. Choose Reserve 2, Reject 5, or Read then limit. Set the host call cap to 1, 2, or 3 and run the offline harness. `GET /api/c24/tools` shows the shared host contract, `GET /api/c24/code` lists the three provider boundaries and source files, and `POST /api/c24/run` produces a bounded result. Live mode is rejected before any API call.

## Evidence to inspect

The trace orders request, typed call, checked host effect, tool result, answer, and cleanup. The manual loop owns iteration and result history. The tool runner would own iteration but still invokes an application callback for a checked tool effect. Managed Agents owns the session loop and pauses for `agent.custom_tool_use`; the client supplies `user.custom_tool_result`. The offline event adapters demonstrate these shapes, not provider execution. All three paths execute the same host handler in their offline modes. The host effect ledger and final stock, rather than fixture answer text, prove whether inventory changed. A five-unit reservation is rejected; the one-call limit blocks the second call before reservation.

## Troubleshooting

If the backend reports 403, use the local application origin and a valid experiment owner. Invalid harnesses, unknown SDK fields and extra request properties are rejected with 400. A 429 means this owner or the four-run global limit already has an active run. The five-second local deadline stops a run without claiming remote interruption.

## Limitations

The offline experiment does not execute Anthropic Messages or Managed API methods, so its fixture answers and typed call events are not model observations. Live Messages requests need a separate opt-in, model and budget; a Managed run needs a pinned, reviewed agent and environment plus session cleanup. Those paths are deliberately unavailable here. A Messages `toolRunner` is a Messages API helper and its options must not be sent to `sessions.create`. See [TypeScript SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript), [tool runner](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner), and [Managed session events](https://platform.claude.com/docs/en/managed-agents/events-and-streaming).

## Challenge

Identify a responsibility the manual loop owns that the Managed harness supplies. Then explain which host responsibility neither layer can take over for this exercise.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab24-harnesses.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab24-browser-demonstration.mjs
```
