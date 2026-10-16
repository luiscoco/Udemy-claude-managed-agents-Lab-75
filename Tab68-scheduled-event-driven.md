# Lab 68: Scheduled and event-driven agents

## Prerequisites

Run the local platform. The exercise queues fictional jobs and writes idempotent local triage effects under ignored `artifacts/lab68/`. It makes no Anthropic request. An optional `LAB68_WEBHOOK_SECRET` stays on the server; without it the host generates an ephemeral signing key. The signed-fixture control never exposes that key.

## Controls

Create a five-second schedule, advance its scheduling clock by sixty seconds, then **Tick and coalesce**. One job represents the missed intervals. Admit the same signed incident twice to see HTTP 202 for admission and duplicate acknowledgement, with one job ID. **Run one successful worker** claims and executes one due job. Fail a fresh job, advance one second, fail again, advance two seconds, then fail a third time to inspect the dead-letter state. Cancel a queued or retrying job with **Cancel next pending job**.

## Evidence to inspect

The webhook route mounts `express.raw` before the JSON parser. HMAC-SHA256 covers the timestamp, a dot separator, and the exact raw request bytes. A constant-time comparison follows fixed-format and real-time freshness checks. Advancing the scheduling clock never changes signature freshness. The local fixture control uses this same verifier; bad and stale requests are refused.

The queue stores at most 100 jobs and ten schedules; intervals are limited to 5–3600 seconds. A tick coalesces missed occurrences rather than starting a worker. A worker claims synchronously before its first await, runs one job per click and has a two-second deadline. The first two failures retry after one and two seconds; the third enters dead letter. Cancellation and owner checks apply to queued and running work.

The closed Zod-derived `record_incident_triage` custom tool requires a live host claim. Its `user.custom_tool_result` uses the `sevt_` ID. A separate owner/event or owner/schedule business key is stored in SQLite to suppress duplicate effects. Built-in tools, MCP and skills are not enabled. Trigger acknowledgement never proves execution.

## Routes

- `POST /api/c68/webhook`: raw signed incident payload; `X-Lab68-Timestamp` is Unix seconds and `X-Lab68-Signature` is lowercase hex HMAC.
- `GET /facts`, `GET /code`, `GET /state`: owner-scoped metadata and evidence.
- `POST /schedules`, `POST /advance`, `POST /tick`: authored scheduling controls.
- `POST /fixtures/webhook`: local valid, bad-signature or stale fixture admission.
- `POST /worker`: one explicit success/failure claim.
- `POST /jobs/:id/cancel`: owner-scoped cancellation with an empty body.

## Troubleshooting

HTTP 202 means accepted or duplicate, not executed. A worker with no due job returns a conflict; advance the scheduling clock for a retry or tick a due schedule. A bad signature, altered whitespace or stale real timestamp is rejected before incident parsing. A full queue returns 429 while a known duplicate remains acknowledged.

## Limitations

Jobs and schedules live in process memory, and ticks are explicit exercise controls rather than a background service. SQLite persists business effect keys only. Production replaces this with durable queue/lease storage, delivery authentication and supervised workers. The clock advance is local to the experiment owner. No billed run starts from a trigger.

## Challenge

Advance the scheduling clock, submit a stale signed request, and explain why it still fails. Then admit one event twice and identify the distinct admission, claim, tool-event and persisted business-effect evidence.

## Run locally

```powershell
node --import tsx --test tests/lab68-scheduled-event-driven.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab68-browser-demonstration.mjs
```
