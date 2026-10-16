# Lab 48 checkpoint

The local range uses a fake canary, temporary files and a loopback HTTP collector. It compares a naive prompt-only policy with layered host checks. The host records attempted and executed actions, canonical path containment, collector hits and file content. The closed custom-tool schema is generated from Zod; fixture event IDs are separate from business idempotency keys. No genuine credential enters the range.

Verification: four focused tests and all 358 cumulative offline tests passed. Typecheck, production build, guide audit for Labs 1–48, four guide tests, nine browser tests, and the 390/1440-pixel demonstration passed. The distribution scan passed across 1,900 files. Screenshots are in ignored `artifacts/lab48/`.

Limitations: this range does not start a Managed session or prove provider-side isolation. The naive comparison may return only the fictional canary. The loopback witness observes fixture requests, while the cloud sandbox is not assumed to access host files. Tool-output text never substitutes for host file and collector evidence.
