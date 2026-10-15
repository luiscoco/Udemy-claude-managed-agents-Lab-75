# Lab 37: External policy decision service

## Prerequisites

Run the local development server. The policy worker is an authored local fixture; the exercise needs no Anthropic key.

## Controls

Choose a scenario and either isolated policy worker or local reviewer, then **Start policy review**. **Ask policy worker**, **Reviewer allows**, **Reviewer denies**, and **Cancel pending** resolve or invalidate an exact paused action.

## Exercise

A fictional built-in `Write` call with `always_ask` pauses on a `sevt_` event ID. The host asks a non-model-callable policy service about that exact action. A valid closed gate output is followed by an independent fixed path check. Only then does the host construct one typed `user.tool_confirmation` with the original event ID. A checked allow changes only a disposable fixture file.

Preallowed observation never reaches the gate. Deny returns one `deny_message`. Malformed output and timeout fail closed without a confirmation or effect. In host-refusal, the worker allows but a stricter host path limit denies. The application precedence is host path limit over validated gate decision; this is not a claim about Managed `canUseTool`, rules or hooks precedence.

## Evidence to inspect

Compare the exact event ID, gate and host decisions, confirmation count and fixture file text. Read `server/lib/lab37-policy-gate.ts` for the worker boundary, closed output validation, independent path check and single-use decision guard.

## Troubleshooting

If the gate times out or returns malformed JSON, start another run. A repeated, foreign or wrong-ID decision is rejected. A local reviewer must provide an explicit allow or deny.

## Limitations

The fixture makes zero Anthropic calls. A live version needs a configured Managed agent with a built-in `always_ask` pause. The host policy service is not an agent tool and cannot rewrite the confirmation input.

## Challenge

Return an invalid gate response and inspect the prevented file effect.

## Run locally

```powershell
node --import tsx --test tests/lab37-permission-prompt-tool.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab37-browser-demonstration.mjs
```
