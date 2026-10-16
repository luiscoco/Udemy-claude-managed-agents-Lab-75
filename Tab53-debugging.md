# Lab 53: Debugging session and host traces

## Prerequisites

Complete the Acme Support Desk and offline testing lessons. This lab uses fictional event IDs and sessions; no API key, `.env` loading, provisioning or provider request is needed. The shared event consumer and the actual support-desk custom-tool handler are imported directly.

## Controls

Choose a scenario and press **Run trace**. **Inspect saved run** retrieves the same owner-scoped record without reapplying host effects. Start with the valid control, then compare malformed report, denied tool, missing idle event, local turn limit, stream EOF and cleanup timeout.

## Evidence to inspect

Each result records a local run ID, fictional remote session ID, optional thread ID, `sevt_` event IDs, resolved fixture tool list, redacted event summaries, host decisions and ledger effects. The orange marker identifies the first useful evidence for the cause. The replay passes the recorded events through `createEventConsumer`, then compares its lifecycle verdict with the original and checks the recorded effect count against the host ledger. The replay does not re-execute a refund.

A final-looking `agent.message` followed by EOF remains incomplete without `session.status_idle`. A completed turn with malformed final JSON still fails the application report schema. A denied custom tool is a host decision, while `requires_action` is a paused session state. A local turn limit and cleanup timeout are host-side boundaries. The latter leaves archival pending and remote stop unconfirmed. The trace flags history gaps instead of filling them with inferred events.

## Troubleshooting

If a result appears inconsistent, compare `firstUsefulSequence` to the chronological trace, then inspect the host decision and ledger count. Distinguish the raw event outcome from the final report verdict. An event stream closing does not establish remote completion or failure. A saved run belongs to its local experiment owner and cannot be read by another owner.

## Limitations

The traces are bounded authored fixtures with whitelisted, redacted summaries and at most 40 entries. Agent version and provider usage are unknown offline. No SDK hook trace or child-process initialization is assumed. A local replay proves only that the consumer reproduces its recorded event interpretation; it cannot resolve missing remote history or a cleanup timeout.

## Challenge

Change one variable in a failing trace. Explain whether the change addresses the first evidenced cause. For example, add a confirmed idle event to the missing-idle scenario, then compare it with the malformed-report case where idle already exists but validation fails.

## Run locally

```powershell
node --import tsx --test tests/lab53-debugging.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab53-browser-demonstration.mjs
```
