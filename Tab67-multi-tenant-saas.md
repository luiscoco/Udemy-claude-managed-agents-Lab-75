# Lab 67: A multi-tenant SaaS architecture

## Prerequisites

Run the local platform. Alice/Acme and Bob/Birch are synthetic authentication principals. The sign-in selector is a local simulation and grants an opaque workshop token; it is not a production login. No API key, Anthropic call or provider cost is involved.

## Controls

**Simulate both sign-ins** creates two host-authenticated fixture identities. Choose **Hold for concurrency probes**, then **Run both tenants** to hold separate reservations. **Probe Birch as Acme** attempts foreign run, session, source, transcript and cancellation access; all five should return HTTP 404. **Try another Acme run** shows the per-tenant concurrency reservation. **Cancel own Acme run** releases only Acme's reservation. Choose the failure scenario to inspect release without charge. Repeated successful runs consume the six illustrative units of tenant quota.

## Evidence to inspect

The host maps each opaque token to a principal, tenant and project. Neither a client body nor model input can choose tenant authority. A closed Zod-derived `read_project_policy` custom tool validates its source ID and checks the host tenant before returning `user.custom_tool_result` correlated by `sevt_` ID. A separate principal-scoped request ID deduplicates starts and reservations. Unused built-in tools, MCP and skills are disabled in this offline path.

Every protected read, transcript and cancellation checks the host tenant and project. One active run per tenant reserves two illustrative units before starting; the reservation releases exactly once on completion, failure, cancellation or shutdown. Only success charges usage. Rate limits and workshop capacity bound admission. The two tenants can run concurrently without sharing quota.

## Routes

- `POST /api/c67/auth`: select a synthetic principal; no tenant field is accepted.
- `GET /facts` and `GET /code`: public teaching metadata and source inventory.
- `GET /usage`: authenticated tenant usage and reservation ledger.
- `POST /runs`: closed request ID and scenario input.
- `GET /runs/:id`, `GET /sessions/:id`, `GET /runs/:id/transcript`: owner-scoped evidence.
- `GET /sources/:id`: project policy data checked against the host tenant.
- `POST /runs/:id/cancel`: owner-scoped cancellation with an empty body.

## Troubleshooting

A foreign ID returns 404 without another tenant's metadata. Missing or invalid principal tokens return 401. A second active run returns 429 for concurrency; exhausted quota or the per-principal rate limit also returns 429 with an authored reason. Failure and cancellation release reservations without spending quota. Wait for the evidence refresh after cancellation.

## Limitations

This workshop uses process-local stores and an illustrative unit ledger. Production replaces the selector with verified identity claims, durable tenant-scoped storage and atomic distributed reservations. It also needs token expiry and revocation. The fixture session IDs identify authored local evidence, not cloud sessions.

## Challenge

Try to add `tenant: "birch"` to an Acme start body or custom-tool input. Identify the closed-schema rejection and the host identity check that still protects source reads.

## Run locally

```powershell
node --import tsx --test tests/lab67-multi-tenant-saas.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab67-browser-demonstration.mjs
```
