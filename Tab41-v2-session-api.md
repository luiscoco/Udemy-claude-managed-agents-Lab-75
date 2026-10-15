# Lab 41: Managed session lifecycle comparison

## Prerequisites

Run the local development server. The offline fixture needs no Anthropic key. The project pins official `@anthropic-ai/sdk` 0.133.0.

## Controls

Choose one-shot, retained, interrupt/continue, reconnect or archived refusal. Start the workflow, inspect state, send a second turn, reconnect through history hydration, interrupt or archive as appropriate.

## Exercise

The current adapter in `server/lib/lab06-port.ts` uses `sessions.create`, `events.stream`, `events.send`, `events.list`, `sessions.retrieve` and `sessions.archive`. The Lab 41 fixture uses its matching port boundary to compare lifecycles without billing. One-shot archives after idle. Retained mode keeps the same resolved session ID for a second turn. Reconnect lists history from that ID and creates no second session. Archive refuses future sends. An interrupt is usable for continuation only after idle confirmation.

## Evidence to inspect

Compare resolved session ID, user and agent event IDs, listed history, created-session count, reconnect creation count and archive count. Inspect `server/lib/lab41-lifecycle.ts` for workflow sequencing and `server/lib/lab06-port.ts` for current SDK calls. The historical local-process panel is static and loads no legacy runtime.

## Troubleshooting

If a second turn fails, check whether the workflow already archived. Reconnect requires an owned retained session. Start a fresh workflow to compare an alternate sequence.

## Limitations

The offline fixture reports zero provider calls and cannot prove real remote history or billing. It makes no local process-count or JSONL compatibility claim for Managed Agents. Live workflow execution is not configured in this lesson; current SDK methods are shown through the existing live adapter source.

## Challenge

Describe the Managed event sequence for continuing an idle session.

## Run locally

```powershell
node --import tsx --test tests/lab41-lifecycle.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab41-browser-demonstration.mjs
```
