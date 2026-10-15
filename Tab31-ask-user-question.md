# Lab 31 — Host questions and correlated answers

A closed `ask_user` custom tool pauses an authored Managed session fixture. The host stores the question, option rules, run/session/event identity and expiry. A validated human answer becomes one `user.custom_tool_result` for the exact `sevt_` call.

## Prerequisites

Run `npm install` and `npm run dev`. Offline question fixtures need no API key.

## Controls

Start deployment target, option selection, allowed custom text, invalid answer, expiry or cancel-waiting. Choose one radio option or enter allowed custom text. Submit, inspect, cancel or wait for the question to resolve. The wait request has its own timeout and releases its waiter if the browser disconnects.

## Evidence to inspect

Compare run ID, session ID and custom tool event ID. A successful answer produces one result whose `custom_tool_use_id` is exactly the stored event ID. The result count stays one. An answer authorizes no unrelated tool effect. Agent question text does not override the host's stored options or selection rules.

## Troubleshooting

An unknown option, custom text when disabled, or a partial answer is rejected before result creation. A repeated answer after completion, expiry or cancellation returns 409. Foreign run or mismatched session/event IDs cannot resolve the stored question. If a wait times out, inspect the run again; timeout alone does not answer it.

## Limitations

These are authored events and fixture IDs; no live Managed custom-tool result is sent. No built-in `AskUserQuestion` or `canUseTool` mutation is assumed. Live execution requires a dedicated agent, event consumer and explicit result-sending adapter.

## Challenge

Compare a partial answer with a complete validated response.

```powershell
node --import tsx --test tests/lab31-ask-user-question.test.ts
node scripts/lab31-browser-demonstration.mjs
```

Routes: `POST /api/c31/run`, `POST /api/c31/answer`, `POST /api/c31/tools`, `GET /api/c31/code`. See the [checkpoint](docs/lab31-checkpoint.md).
