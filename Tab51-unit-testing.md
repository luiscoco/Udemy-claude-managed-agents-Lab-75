# Lab 51: Testing the Managed host offline

## Prerequisites

Complete Lab 50. This lesson imports its actual store, typed custom-tool handlers, retained session desk and the shared event consumer. It needs no API key and does not load `.env`, provision a resource or call Anthropic. The authored SDK-shaped port supplies deterministic events.

## Controls

Choose **Run complete offline suite** to inspect assertions for malformed and foreign orders, review denial, cancellation, missing terminal state, child-thread metadata, duplicate events, invalid JSON report, retained session and a virtual-time policy mutation. Select one scenario to narrow the evidence. **Replay recorded events** is available for the three event-consumer cases.

## Evidence to inspect

The host rejects malformed custom-tool input before changing the approval or refund ledger. Customer identity comes from the host context, so a foreign order cannot cross the boundary. Denial and cancellation leave no refund. A missing idle event is incomplete even if a stream ends. A repeated persisted event cannot create a second authoritative message, while a preview is replaced by its final message. A child-thread identifier stays evidence, not a new owner or independent refund authority. The closed report schema rejects extra fields. Two chat turns retain one session and reject a foreign owner.

The mutation case advances the store's virtual clock to 31 days after purchase. The real 30-day rule rejects a refund. A deliberate 60-day policy variant would allow it, so its boundary assertion fails **as expected**. The overall suite passes only when that failure is detected and the unmodified handler still denies the request. This is a local mutation demonstration, not a change to the deployed policy.

## Inspect the code

`server/unit-testing/lab51.ts` runs assertions against production modules. `server/capstone/tools.ts` holds the pure eligibility predicate and closed handlers; `server/capstone/store.ts` owns ledger effects. `server/lib/session-events.ts` consumes the same event shapes used by the other lessons. `/api/c51/facts` is host-only metadata; `/api/c51/run` and `/api/c51/replay` are offline; `/api/c51/code` lists public teaching source.

## Challenge

Change the virtual policy window from 30 to 60 days. Predict the failed assertion for the 31-day-old order, then restore the 30-day rule. Compare the mutated predicate's answer with the actual handler's ledger evidence.

## Troubleshooting

If a scenario fails unexpectedly, inspect the observed value and effect evidence before rerunning it. The duplicate-event replay should produce one authoritative message and one ignored duplicate. The missing-terminal replay should remain incomplete. If the local backend is unavailable, start `npm run dev` and retry the offline exercise.

## Run locally

```powershell
npm run test:offline
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab51-browser-demonstration.mjs
```

## Limitations

These assertions verify the host and injected event handling, not model quality. The exercise does not use Agent SDK hooks or a local Claude process. Its synthetic thread and event IDs are authored examples; no billed Managed session is opened.
