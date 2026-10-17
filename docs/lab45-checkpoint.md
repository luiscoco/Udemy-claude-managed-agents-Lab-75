# Lab 45 checkpoint

The dated catalog distinguishes official Managed availability, installed TypeScript client verification and locally enabled routes. Direct Claude API is the installed baseline. Claude Platform on AWS is officially documented for Managed Agents but remains disabled here until an exact installed client and endpoint path are verified. Bedrock, Vertex and Foundry Messages support is not treated as Managed-session support. The loopback emulator uses synthetic credentials and never creates a session.

Verification: four focused tests and all 346 cumulative offline tests passed. Typecheck, production build, guide audit, four guide tests, nine browser tests after a selector correction, and the 390/1440-pixel demonstration passed. The distribution scan passed across 1,849 files. Screenshots are in ignored `artifacts/lab45/`.

Limitations: no provider account, deployment or billed request was used. Emulator success proves only its synthetic wire shape. Availability may change; the official links in the guide were checked on 2026-10-15 and should be revisited before live setup.

The official AWS SDK 0.8.0 was installed with the existing 0.133.0 base SDK. Its Managed method surface and injected SDK GET transport were verified with explicit regional endpoint, workspace header and dedicated AWS key. A read-only resource preflight, readiness diagnostics and UI control are implemented. Five focused provider tests passed. AWS account configuration remains absent, so no actual AWS request or model session was made.
