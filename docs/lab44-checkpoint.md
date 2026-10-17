# Lab 44 checkpoint

A host OTLP HTTP JSON exporter sends correlated, redacted spans to a bounded loopback collector. Managed model-span event records are separately labeled authored provider evidence. Denied, failed and executed tools have distinct host spans and effect counts.

Verification: five focused tests and all 342 cumulative offline tests passed. Typecheck, production build, guide audit, four guide tests, nine browser tests and the 390/1440-pixel demonstration passed. The distribution scan passed across 1,832 files. Screenshots are in ignored `artifacts/lab44/`.

Limitations: the collector has no remote destination, and the model-span records are authored fixtures with zero Anthropic calls. Their presence or absence does not prove provider OTLP export or complete remote tracing. The implementation uses a small OTLP JSON exporter rather than a full OpenTelemetry SDK instrumentation package.

Remote fixture-span export is now implemented behind an explicit HTTPS server destination and enable flag. Content is removed regardless of local recording opt-in, authored data is labeled, export requires owner identity, redirects and partial rejection fail closed, and confirmed sends are deduplicated. Seven focused telemetry tests passed. No remote endpoint is configured, so actual remote delivery remains unverified.

Azure follow-up: the official Azure Monitor exporter is implemented with a real OTel pipeline and redacted authored metadata. Eight telemetry tests pass, including Azure export success/rejection. A dedicated monitoring template and explicit setup script are prepared. Azure provisioning was blocked by automatic approval review pending explicit resource/cost authorization; no resource was created.

The user then explicitly approved provisioning and the North Europe fallback after Azure rejected West Europe. The dedicated Azure monitoring resources were deployed, and the actual exporter accepted five authored redacted host spans. Connection settings remain local and ignored. The Anthropic key is unchanged. Azure ingestion has consumption charges; the 1 GB quota is not a spending cap.
