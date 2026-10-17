# Lab 65 checkpoint: human approval

Lab 65 uses a closed Zod-derived Managed custom-tool proposal shape and correlates a host `user.custom_tool_result` to its `sevt_` ID. A proposal stores immutable fictional action arguments, expiry, reviewer identity and audit. Notification defaults to local with no external message. Approval or rejection requires a separate same-origin local reviewer session; the approved effect is a unique SQLite business key. The event ID is never used as the business idempotency key.

Slack, Teams Workflow and Microsoft Graph email delivery adapters are present behind an explicit server opt-in and secrets. The UI now shows per-channel readiness and explicit external-send buttons, disabled until configured and a proposal is pending. Tests inject a fetch stub and do not contact any provider. The local reviewer cookie is a teaching boundary, not enterprise login; proposals are process-local, while effects persist in SQLite. A production external review link requires a separately reviewed capability or SSO flow.

Focused tests cover schema rejection, custom-tool correlation, no pre-approval effect, local notification, wrong reviewer, tampering, expiry, duplicate click, second-proposal idempotency and route cookie checks. Typecheck, guide audit, build and browser demonstration are run for this checkpoint. No Anthropic session, cloud resource or external message is created.

Readiness validates channel settings without transport or secret disclosure. Missing/invalid names are visible in the exercise and `npm run integrations:ready`. Tests cover lookalike webhook host refusal, secret redaction and no send during inspection. Live acceptance is recorded separately in ignored local evidence; offline checks do not prove delivery.

## Personal Microsoft email setup

For an Outlook.com or Hotmail mailbox, use delegated `Mail.Send` and `/me/sendMail`. This does not require a client secret or permission to read mail. The dedicated app manifest is `managed/lab65-mail-auth.app.json`.

1. Set `LAB65_GRAPH_SENDER` and `LAB65_GRAPH_RECIPIENT` in ignored `.env`.
2. With an authorized Azure CLI account, run `powershell -File scripts/lab65-mail-auth-setup.ps1`. This deliberately creates a personal-account public-client registration if absent and stores its public client ID. It does not grant consent or create a token.
3. Run `npm run notifications:signin`. Open the displayed Microsoft link, enter its short-lived code, sign in as the sender and review the permission. Never share a password or token. The helper rejects a different signed-in mailbox.
4. To also send one fictional notification immediately after consent, use `npm run notifications:signin -- --send-test-email`. Each explicit invocation requests one send; do not repeat after an uncertain network response without checking the mailbox first.
5. Restart the backend to load saved settings, then inspect `npm run notifications:ready`. A configured UI button can explicitly send a notification for a pending proposal.

The helper saves the short-lived access token, delegated mode, expiry and notification opt-in only to ignored `.env`; it does not persist refresh tokens. Expired tokens disable delivery. Sign in again when needed. Consumer tokens may be opaque and are not decoded as JWTs. The existing application-token `/users/{sender}/sendMail` mode remains available for separately authorized organizational setups.

The opt-in test records Graph acceptance and zero business effects in ignored `artifacts/lab65/live-email.json`. Acceptance does not prove inbox delivery. Notification never approves or executes the fictional archive.

References: [Microsoft device flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code), [Graph sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail), [Mail.Send permission](https://learn.microsoft.com/en-us/graph/permissions-reference#mail-send).
