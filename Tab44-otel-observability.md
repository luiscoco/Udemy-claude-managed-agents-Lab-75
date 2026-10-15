# Lab 44: Host telemetry and provider event traces

## Prerequisites

Run the local development server. The host exporter opens a bounded loopback OTLP JSON collector only when an offline trace runs. No Anthropic key is needed.

## Controls

Run successful, denied, failed-tool or missing-provider-span cases. Compare host spans, effect count and provider event records. Toggle fictional content recording explicitly, then inspect the collector count.

## Exercise

Host spans cover the Express request, Managed-port operation, approval wait, custom handler and cleanup. Trace ID and parent span ID connect them; session, thread and `sevt_` tool event IDs are attributes. Prompt and tool content are redacted by default. The optional recording toggle adds only fictional content for the current owner. The local exporter sends OTLP HTTP JSON to a collector with batch, payload and storage bounds. Managed `span.model_request_start` and `span.model_request_end` records are provider event evidence, not host-exported spans. A missing event is a signal gap, not proof of no model activity.

## Evidence to inspect

Compare the denied case's approval decision and zero effects with the successful case's handler and one effect. Inspect trace/parent IDs, collector span count and redaction attributes in `server/lib/lab44-telemetry.ts`. The provider event IDs are separately labeled authored fixture records.

## Troubleshooting

If no fictional prompt attribute appears, enable recording before starting a new run. The denied case intentionally has no custom-handler span. The missing-provider-span case intentionally has no provider event records.

## Limitations

The collector is local and never exports to a remote OTLP destination. Model-span event fixtures do not prove remote OTLP export or full provider traces. This lab makes zero Anthropic calls. Claude Code child-process telemetry environment variables do not apply to the Managed cloud harness.

## Challenge

Compare denied and executed actions in the host trace and effect ledger.

## Run locally

```powershell
node --import tsx --test tests/lab44-telemetry.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab44-browser-demonstration.mjs
```
