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

The default collector is local. An explicit remote export adapter is also available: configure LAB44_OTLP_ENDPOINT with a reviewed HTTPS /v1/traces destination, optional LAB44_OTLP_BEARER_TOKEN and LAB44_REMOTE_EXPORT_ENABLED=1, then restart the backend. Remote collector setup reports missing or invalid setting names. Export redacted host trace sends only an owned run, strips recorded content and provider event fixtures, labels the payload authored-fixture, rejects redirects and bounded/partial-failure responses, and deduplicates confirmed exports. Collector acceptance proves transport acceptance of fixture spans, not a genuine provider model trace. Model-span event fixtures do not prove remote OTLP export or full provider traces. This lab makes zero Anthropic calls. Claude Code child-process telemetry environment variables do not apply to the Managed cloud harness.

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

## Azure Monitor

Azure is the selected monitoring target. The official Azure Monitor OpenTelemetry exporter is pinned at 1.0.0-beta.46 with OpenTelemetry 2.12.0. Configure APPLICATIONINSIGHTS_CONNECTION_STRING and LAB44_AZURE_EXPORT_ENABLED=1 to enable the explicit Azure export button. It sends authored span names, status and source correlation IDs only, with an authored-fixture resource label. Recorded content and provider event fixtures are excluded. Acceptance is transport evidence, not a provider model trace. A fake transport with the actual OTel pipeline verifies success and rejection locally.

The prepared scripts/azure-monitor-resources.json template creates only a dedicated North Europe Log Analytics workspace and Application Insights resource, with 30-day retention and a 1 GB daily ingestion quota. That quota is not a spending cap. scripts/azure-monitor-setup.ps1 defaults to read-only inspection; -Provision creates the resources and stores connection information only in ignored .env, preserving the Anthropic key. Actual provisioning requires explicit cost authorization. No hosting deployment or notification is included.

References: [Microsoft Azure exporter](https://learn.microsoft.com/en-us/javascript/api/overview/azure/monitor-opentelemetry-exporter-readme), [workspace-based Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/create-workspace-resource). Native Azure OTLP ingestion uses a separate Entra-authenticated collector path; this adapter uses the official Azure exporter.

The configured workspace successfully accepted a five-span Azure smoke test after explicit provisioning approval. Repeat deliberately with node --env-file-if-exists=.env --import tsx scripts/live-azure-monitor-smoke.ts --execute-approved-azure-test. It emits only redacted authored host metadata and incurs Azure ingestion, not an Anthropic model call.
