# Lab 51 checkpoint

The offline host-testing lesson imports the Acme Support Desk's actual store, typed custom-tool handler, retained scripted port and shared event consumer. It tests closed inputs, customer ownership, approval denial, cancellation, incomplete turns, child-thread metadata, duplicate persisted events, preview replacement, final-report validation and retained session identity. A virtual clock makes the 31-day-old order fail the real 30-day rule. The deliberate 60-day mutation fails that boundary assertion as expected; the unmodified handler creates no approval or refund.

Verification: three focused tests and all 377 cumulative offline tests passed. Typecheck, production build, guide audit for Labs 1–51, four guide tests, nine browser tests and desktop/mobile browser demonstration passed. The distribution scan passed across 1,973 files. Screenshots and test logs are in ignored `artifacts/lab51/`.

Limitations: these are local host and consumer tests with authored events, not evidence of model quality or live Managed availability. No `.env` file, provisioning command or Anthropic request is loaded by the test runner. The mutation is an injected policy variant in the test harness; the real handler still uses the 30-day rule. Provider usage and cost are not measured.
