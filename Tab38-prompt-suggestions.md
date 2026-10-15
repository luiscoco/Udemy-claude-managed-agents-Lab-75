# Lab 38: Application follow up suggestions

## Prerequisites

Run the local development server. The offline suggestions need no Anthropic key.

## Controls

Start a conversation, check suggestions, copy one to the input, then press **Send message** separately. Toggle suggestions, close the conversation, and compare normal, delayed, suppressed, stale and disabled scenarios.

## Exercise

The host validates each suggestion and binds it to conversation ID, turn and response version. The Copy button changes only the browser draft. A separate user Send request increments the turn. A stale or mismatched suggestion ID is rejected before send. Suggestions can be delayed, suppressed, disabled or absent without changing the answer.

The offline answer and suggestion usage are attributed separately as authored zero-token fixtures. An optional live suggestion session would have its own budget and usage and would need cancellation when the parent closes; this lab does not start it.

## Evidence to inspect

Compare the suggestion's binding fields, explicit send count, zero auto-send count, separate usage records and stale rejection. Inspect `server/lib/lab38-suggestions.ts` for the send guard.

## Troubleshooting

If a suggestion is absent, check the scenario and feature switch. A delayed suggestion appears after its availability time. After a newer turn, request a new suggestion rather than sending an old one.

## Limitations

No native `prompt_suggestion` SDK event or guaranteed suggestion stream is assumed. The offline fixture makes zero provider calls. A live suggestion session is unavailable until separately configured and budgeted.

## Challenge

Explain why a suggestion may be absent and why accepting one needs a separate send.

## Run locally

```powershell
node --import tsx --test tests/lab38-prompt-suggestions.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab38-browser-demonstration.mjs
```
