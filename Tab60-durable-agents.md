# Lab 60: Durable long running agents

## Prerequisites

Run the local learning platform. This lesson writes fictional jobs under ignored `artifacts/lab60/jobs/`. No payment, email, provider request or API key is involved. Reset clears only jobs owned by the current browser's experiment owner.

## Controls

Start a crash-after-third, lease-loss or no-progress scenario. For a crash, choose naive restart, journal-only or journal plus idempotency and recover. Start a fresh job for each comparison. `GET /policy` shows all eight items and the 30-day, 200 EUR, unused-item rule. `GET /simulate` previews expected duplicates without creating a job. `GET /jobs` is owner-scoped.

## Evidence to inspect

The host writes `journal.json` and `ledger.json` atomically through temporary files and rename. After the third eligible effect, the crash occurs before its journal update: three effects exist, but two keys are journaled. Naive restart repeats all three effects, journal-only repeats effect 3, and journal plus stable effect-key idempotency suppresses it. An eligible item may be processed once per job key. The final ledger has five unique eligible effects; three other items fail age, amount or unused policy.

The application defines dedicated Zod-derived closed custom-tool schemas. A Managed `agent.custom_tool_use` would be answered by `user.custom_tool_result` with the original `sevt_` ID; the stable business effect key is separate. Host policy, lease and ledger validation govern effects. The offline fixture does not create a Managed session or assume cloud `/workspace` can read local files. Built-in tools, MCP and skills are not available as bypasses in this exercise.

## Troubleshooting

A lost lease and three no-progress checks cause the supervisor to fail rather than retry indefinitely. A terminal job cannot be recovered again. A wrong owner, malformed job ID, invalid `sevt_` ID or invented tool field is rejected. If eight jobs already exist for an owner, reset the local exercise after inspecting evidence.

## Limitations

This is an offline host simulation. It does not guarantee an atomic transaction across a real external payment provider and the journal. A real integration would need a durable external idempotency contract, lease coordination, reconciliation of uncertain sends and bounded retries. A transcript alone does not establish business state.

## Challenge

Compare a new crash job under all three strategies. Identify the effect missing from the journal, the duplicated keys in the first two recoveries and the suppressed key in the third.

## Run locally

```powershell
node --import tsx --test tests/lab60-durable-agents.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab60-browser-demonstration.mjs
```
