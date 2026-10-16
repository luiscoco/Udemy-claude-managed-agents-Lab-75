# Lab 56: Teams and evidence messages

## Prerequisites

Run the local learning platform. This lab is a deterministic application-owned team reducer. It makes no provider request and needs no API key. Native Managed delegation would require a separately verified live configuration.

## Controls

Choose a scenario and select **Replay team actions**. Each action records whether the reducer accepted it and its effect. **Check live delegation** shows the unsupported-mode response; it does not start a billed session. The closed scenario set covers blocked review, competing claims, busy shutdown, duplicate envelopes, acknowledgment before delivery, rejected 30, verified 37 and clean shutdown.

## Evidence to inspect

The researcher owns the research task and the reviewer owns review. Review starts blocked. The researcher must claim work, complete the checked sum 12 + 18 + 7 = 37, and send an envelope with a stable ID. The reviewer can act only after the envelope is delivered and acknowledged. A duplicate identical envelope is idempotent; a conflicting duplicate is rejected. Delivery does not imply acknowledgment or completion. Clean shutdown requires both tasks done and all messages acknowledged.

The timeline shows accepted/rejected actions, task states, envelope states and the host-verified answer. `providerCalls: 0` marks authored offline evidence. The reducer bounds each replay to 24 actions and 8 envelopes. It recognizes only the researcher and reviewer identities. Role checks are in the reducer rather than depending on a model instruction.

## Troubleshooting

If review is blocked, check whether the researcher completed work and whether its evidence envelope reached acknowledgment. A claimed task is still busy; shutdown rejects it. A response of 422 from the live route means delegation has not been configured and no live prompt was sent.

## Limitations

Offline actions are application fixtures, not observations of model delegation. Native Managed delegation would need checked `thread_message_sent` and `thread_message_received` events with thread IDs. A host-driven variant could use bounded `send_message` and `read_messages` custom tools in separate sessions. Neither route assumes Claude Code `SendMessage` or private mailbox files. Native children may share a sandbox, so role authorization must remain in host handlers.

## Challenge

Replay acknowledgment before delivery. Identify the rejected action and explain why the review dependency remains blocked. Then replay verified 37 and clean shutdown and compare their final states.

## Run locally

```powershell
node --import tsx --test tests/lab56-agent-teams.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab56-browser-demonstration.mjs
```
