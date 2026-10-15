# Lab 40: Safe recovery boundaries

## Prerequisites

Run the local development server. The authored recovery fixture needs no Anthropic key.

## Controls

Build a kept turn, uncertain send, queued follow-up, pending effect or clean snapshot. Inspect the state, try host-only undo, then choose continuation, bounded interrupt, fresh derived context or reconciliation.

## Exercise

The host command/effect ledger records accepted and processed messages, pending or applied effects and immutable remote event IDs. A queued follow-up must be carried forward once. An uncertain send needs receipt reconciliation before any retry. A pending effect needs effect reconciliation before continuing. A fresh derived session is allowed only after outstanding work is accounted for. Undo uses a versioned host fixture snapshot; it cannot erase a remote turn, accepted command or applied effect.

## Evidence to inspect

Compare command IDs, effect IDs, event IDs, version, recovery choice and unchanged history count. The source in `server/lib/lab40-recovery.ts` contains the refusal rules. Agent claims do not substitute for host ledger evidence.

## Troubleshooting

If a choice returns 409, inspect uncertain, queued or pending entries. Reconciliation is a separate recorded outcome; the fixture does not guess whether a remote send was accepted. Rebuild the case to compare another choice.

## Limitations

The offline fixture does not contact Anthropic or interrupt a real session. Its confirmed-idle interrupt is authored evidence only. A production host must observe remote idle before reuse and must query external effect receipts before marking uncertainty resolved. Remote history is never truncated by this lesson.

## Challenge

Explain how queued work changes the safe recovery boundary.

## Run locally

```powershell
node --import tsx --test tests/lab40-recovery.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab40-browser-demonstration.mjs
```
