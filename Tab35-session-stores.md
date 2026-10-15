# Lab 35: Event mirrors and conversation indexes

## Prerequisites

Run the local development server. The offline file-backed mirror needs no Anthropic key.

## Controls

Select a scenario and eager or batched flush, then **Start mirror**. **Flush batch**, **Simulate crash and restart**, **Reconcile history**, **Archive remote fixture**, **Simulate append failure**, and **Reset local mirror** exercise persistence and recovery.

## Exercise

The host indexes a fictional owned `sesn_` ID, writes canonical `sevt_` events to thread-partitioned JSONL files, and atomically replaces its conversation index. Preview fragments are not stored. The effect idempotency ledger is a separate empty file.

Eager flush writes events immediately. Batched flush holds them in memory until explicit flush; a simulated crash loses unflushed events and marks the mirror incomplete. Reconciliation deduplicates known canonical event IDs and adds a checked worker-thread event. Missing thread history and append failures remain visible as incomplete evidence. An archived remote session cannot be made resumable by a local mirror.

## Evidence to inspect

Compare persisted and pending counts, thread IDs, event IDs and mirror status. Inspect `server/lib/lab35-mirror.ts` for atomic index writes, owner checks, bounded loads, safe file keys and the separate effect ledger.

## Troubleshooting

If an append fails, restore appends and reconcile or start a new run. A crash can lose pending events. Do not interpret a local file as proof that the remote session still exists.

## Limitations

This is an authored offline mirror. No Agent SDK `SessionStore` adapter is installed. A second live host would continue an owned remote session through the Managed API, not by replaying a guessed transcript. The mirror cannot recreate a sandbox or resume an archived session. No provider call is made here.

## Challenge

Compare flush strategies and identify which records survive a simulated crash.

## Run locally

```powershell
node --import tsx --test tests/lab35-session-stores.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab35-browser-demonstration.mjs
```
