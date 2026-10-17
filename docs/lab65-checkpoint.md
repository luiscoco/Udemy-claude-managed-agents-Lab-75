# Lab 65 checkpoint: human approval

Lab 65 uses a closed Zod-derived Managed custom-tool proposal shape and correlates a host `user.custom_tool_result` to its `sevt_` ID. A proposal stores immutable fictional action arguments, expiry, reviewer identity and audit. Notification defaults to local with no external message. Approval or rejection requires a separate same-origin local reviewer session; the approved effect is a unique SQLite business key. The event ID is never used as the business idempotency key.

Slack, Teams Workflow and Microsoft Graph email delivery adapters are present behind an explicit server opt-in and secrets. The UI now shows per-channel readiness and explicit external-send buttons, disabled until configured and a proposal is pending. Tests inject a fetch stub and do not contact any provider. The local reviewer cookie is a teaching boundary, not enterprise login; proposals are process-local, while effects persist in SQLite. A production external review link requires a separately reviewed capability or SSO flow.

Focused tests cover schema rejection, custom-tool correlation, no pre-approval effect, local notification, wrong reviewer, tampering, expiry, duplicate click, second-proposal idempotency and route cookie checks. Typecheck, guide audit, build and browser demonstration are run for this checkpoint. No Anthropic session, cloud resource or external message is created.

Readiness validates channel settings without transport or secret disclosure. Missing/invalid names are visible in the exercise and npm run integrations:ready. Tests cover lookalike webhook host refusal, secret redaction and no send during inspection. No destination is configured locally, so real external delivery remains untested.
