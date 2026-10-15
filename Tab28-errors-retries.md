# Lab 28 — Errors, retries and reconciliation

Classify authored HTTP, event, custom handler, cancellation, EOF and local disconnect faults. The loopback server never contacts Anthropic.

## Prerequisites

Run `npm install` and `npm run dev`. No API key is needed for the offline exercise.

## Controls

Choose a fault and select **Run offline fault**. The `/api/c28/api` and `/api/c28/run` routes accept the same closed experiment contract; `/api/c28/code` shows the source boundary. A local deadline caps each run, and one owner may run only one experiment at a time.

## Evidence to inspect

For read rate limit, inspect the bounded GET attempts and deduplicated event IDs. For missing create response, the loopback server records the POST but the client receives no ID. For tool result failure, the host idempotency ledger records one effect before the result acknowledgment is lost. Reconnect duplicates reuses a known fixture session and deduplicates by event ID.

## Troubleshooting

Validation and authorization errors are terminal. Do not retry canceled or denied work. A local disconnect does not prove a remote failure. If a mutation response is lost, inspect a known session's bounded history and host ledger before any deliberate retry. If create returned no ID, quarantine it and use owned inventory or operator logs for recovery guidance.

## Limitations

The offline fault server is loopback only. It does not model provider billing, live retries, or complete remote cleanup. Side-effecting SDK requests must set `maxRetries: 0`; bounded backoff is appropriate only for safe GET/list reads. Waiting and cleanup need separate deadlines. Cleanup marked pending means remote stop was not confirmed.

## Challenge

Explain when reconnecting a known session is safer than creating another one.

```powershell
node --import tsx --test tests/lab28-errors-retries.test.ts
node scripts/lab28-browser-demonstration.mjs
```

See the [checkpoint](docs/lab28-checkpoint.md) for actual verification.
