# Lab 67 checkpoint: tenant boundaries

Lab 67 adds a two-tenant local SaaS workshop with synthetic principal-to-tenant/project mapping, opaque tokens, tenant-scoped source data, run/session/transcript/cancellation checks, per-tenant concurrency and quota reservations, and a usage ledger. A closed custom tool uses the host identity to read a project policy and correlates the result by `sevt_` ID. A distinct request ID deduplicates start admission and reservations.

The default path is entirely local. No Anthropic session or external write starts. The sign-in selector simulates authentication, and the stores/ledger are process-local. Production identity claims, token lifecycle, durable storage and distributed atomic reservations are deliberately identified as replacements in the guide.

Focused tests cover both tenants concurrently, all five foreign-object probes, missing principal, model/client tenant injection, custom-tool correlation, reservation release, request replay, quota and rate limits. Typecheck, guide checks, build and real browser demonstrations are run for this checkpoint.
