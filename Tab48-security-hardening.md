# Lab 48: Security hardening

## Prerequisites

Use this local exercise without Anthropic credentials. The range contains a fake canary only. The installed Managed SDK's custom-tool event/result pattern informs the fixture, but no Managed session is started.

## Controls

Choose a naive prompt-only policy or a layered host policy. Try secret read, out-of-scope write and injected egress. Each run creates a fresh `sevt_fixture_` event ID and a separate host business idempotency key.

## Evidence to inspect

Compare attempted and executed effects, the outside-file state and loopback collector hits. The layered policy denies private reads, canonical out-of-scope writes and injected network egress. The naive policy illustrates a vulnerable effect using only fictional data. The response pairs a custom-tool result with its event ID; the stable business key is separately tracked to prevent replay. Closed Zod inputs generate the custom tool JSON Schema. Unused built-in tools, MCP servers and skills are absent from this range's configuration.

## Troubleshooting

Use the local app origin and a valid experiment owner. The routes accept only scripted inputs. `GET /api/c48/facts` shows the tool schema and disabled surfaces; `GET /api/c48/code` identifies the implementation.

## Limitations

This is a local security range, not a cloud sandbox test or a provider security guarantee. No genuine credentials enter the range. The loopback witness only sees requests made by this fixture. Prompts and working directory do not replace host authorization, path checks, environment scrubbing or egress policy. A remote cloud sandbox cannot be assumed to see host files.

## Challenge

Identify the host check that protects data when the model is misled. Verify it using collector hits and outside-file state, not model prose.

## Run locally

```powershell
node --import tsx --test tests/lab48-security-hardening.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab48-browser-demonstration.mjs
```
