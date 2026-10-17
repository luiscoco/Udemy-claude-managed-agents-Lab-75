# Lab 65: Human approval over Slack, Teams or email

## Prerequisites

Run the local platform. The default exercise writes only a fictional SQLite effect record under ignored `artifacts/lab65/`; it sends no message and makes no Anthropic call. The app uses a local same-origin reviewer cookie for demonstration, not production identity verification.

## Controls

**Preview proposal** creates an immutable `archive_fictional_case` request for `CASE-2042` through a closed custom-tool input. It returns `user.custom_tool_result` correlated by the `sevt_` event ID, while the stable business key includes the host exercise owner and case ID. **Notify locally** records review availability without sending a message. Inspect the action, reason, reviewer and expiry before **Approve as reviewer** or **Reject as reviewer**. Try **Duplicate click**, **Tamper action**, **Wrong reviewer** and **Expire proposal** on fresh proposals.

## Evidence to inspect

The tool result creates a proposal only; it never executes the archive. Approval requires the local reviewer session, a pending notified proposal and an unexpired immutable action. The host inserts a unique business key in the SQLite effect ledger. A replay, second proposal for the same case, rejection, changed case ID, wrong reviewer or expired proposal cannot create another effect. Agent prose cannot authorize it. Unused built-in tools, MCP and skills are not included in this offline path.

`GET /api/c65/facts` exposes the closed tool definition; `GET /code` lists the teaching sources; `GET /review` establishes and shows a same-origin local reviewer session; `POST /run` accepts only the authored actions. The host validates the input and never accepts a caller-supplied reviewer identity or action change during decision.

## Optional notifications

The server contains gated notification adapters for [Slack incoming webhooks](https://api.slack.com/messaging/webhooks), [Teams Workflows webhooks](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook), and [Microsoft Graph `sendMail`](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0). They are disabled by default. Set `LAB65_EXTERNAL_NOTIFICATIONS=1` and the channel-specific server secrets only in an environment with a reviewed deployment. Notifications contain no approval link; the reviewer must use the local same-origin app. A public HTTPS origin and remote reviewer flow are future setup, not part of this exercise. Notification setup now shows missing or invalid server setting names without their values. Configure the chosen channel from .env.example, enable LAB65_EXTERNAL_NOTIFICATIONS=1 and restart the backend. Each explicit Send button stays disabled until its channel is configured and a proposal is pending. Run npm run notifications:ready for a local diagnostic with no provider calls. Provider transport acceptance does not approve the proposal. Never treat a webhook or delivered email as approval.

## Troubleshooting

If approval is rejected, notify locally first and inspect proposal state, reviewer cookie and expiry. Use a new proposal after a reject or expired fixture. A second proposal can be approved but the unique business key prevents a second effect. The local cookie is HttpOnly and SameSite Strict; it is bound to the exercise owner. Browser headers alone are not reviewer identity.

## Limitations

The local reviewer cookie proves possession of a same-origin fixture session, not enterprise authentication. Proposals live in memory for the process lifetime; only business effects persist in SQLite. External adapters were validated with offline stubs, not real deliveries; a production external review link needs a separate reviewed capability or SSO flow. No cloud Managed session or provider billing is started.

## Challenge

Approve a notified proposal, then approve a second proposal for the same fictional case. Explain why two `sevt_` IDs and two approval records still produce one business effect.

## Run locally

```powershell
node --import tsx --test tests/lab65-human-approval.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab65-browser-demonstration.mjs
```
