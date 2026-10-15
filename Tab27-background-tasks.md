# Lab 27 — Remote work beyond a browser connection

An owned host task ledger tracks a remote session and primary thread separately from the browser connection. The offline exercise uses authored events and does not contact Anthropic.

## Prerequisites

Run `npm install` and `npm run dev`. No API key is needed for the authored scenario.

## Controls

Open a slow offline task, detach the browser, reconnect the same task, inspect, stop, and close after idle. The completed one-shot returns an archived fixture record. Disable **Allow host background work** to see the policy reject creation.

## Evidence to inspect

Compare task, session and thread IDs, browser connection, remote status, stable event IDs, create count and duplicate-card count. Reconnect replays an old event with the same ID; the host ledger ignores it. A task report remains unverified until independently checked.

## Troubleshooting

Unknown or unowned IDs return 404. An expired retained task starts cleanup and returns 410. Closing a running task returns 409: stop it, confirm idle and then close. Start the backend if the exercise cannot load.

## Limitations

The fixture models host reconciliation only. No live task was started and no remote completion is asserted. Managed workflow runs have their own run-aware lifecycle. An interrupt stops a turn but does not itself end an open workflow run; this lab disables dynamic workflows rather than inventing a stop-by-ID method. The host-snapshot concept requires explicit snapshot identification, not a generic event.

## Challenge

Reconnect and identify evidence that the original task stopped. Explain why a detached browser does not prove that remote work stopped.

```powershell
node --import tsx --test tests/lab27-background-tasks.test.ts
node scripts/lab27-browser-demonstration.mjs
```

The route catalog is `POST /api/c27/oneshot`, `POST /api/c27/open`, `POST /api/c27/call`, and `GET /api/c27/code`. See the [checkpoint](docs/lab27-checkpoint.md).
