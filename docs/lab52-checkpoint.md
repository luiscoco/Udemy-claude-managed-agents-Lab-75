# Lab 52 checkpoint

The evaluator runs four authored holdout cases through the actual Acme Support Desk custom-tool handler and refund ledger. It records baseline and candidate reports with per-case trials, authoritative effects, safety verdicts, regressions and optional structured-judge output. A regression variant makes false refund claims while the host rejects the unsafe tools. Missing baseline, safety failure, regression, judge disagreement or invalid judge JSON blocks the owner-scoped local promotion pointer. A recovered candidate can pass after a baseline is recorded.

Verification: three focused tests and all 380 cumulative offline tests passed. Typecheck, production build, guide audit through Lab 52, four guide tests, nine browser tests and desktop/mobile browser demonstration passed. The distribution scan passed across 1,992 files. Screenshots and logs are in ignored `artifacts/lab52/`.

Limitations: these are authored offline trials and verify evaluator behavior, not model quality. The SDK/API labels identify the target interface; no agent/model version, measured latency, token usage or cost is invented. The holdout labels are kept out of authored agent-facing messages. No Managed session, provisioning, paid judge, CI deployment or remote agent update was run. Promotion changes only in-memory local teaching state.
