# Lab 44 checkpoint

A host OTLP HTTP JSON exporter sends correlated, redacted spans to a bounded loopback collector. Managed model-span event records are separately labeled authored provider evidence. Denied, failed and executed tools have distinct host spans and effect counts.

Verification: five focused tests and all 342 cumulative offline tests passed. Typecheck, production build, guide audit, four guide tests, nine browser tests and the 390/1440-pixel demonstration passed. The distribution scan passed across 1,832 files. Screenshots are in ignored `artifacts/lab44/`.

Limitations: the collector has no remote destination, and the model-span records are authored fixtures with zero Anthropic calls. Their presence or absence does not prove provider OTLP export or complete remote tracing. The implementation uses a small OTLP JSON exporter rather than a full OpenTelemetry SDK instrumentation package.
