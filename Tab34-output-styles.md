# Lab 34: Output instruction variants

## Prerequisites

Run the local development server. The offline comparison needs no Anthropic key.

## Controls

**Compare in fresh session** applies one trusted style. **Compare all four** repeats the fixed question with distinct session IDs. **Try unknown style** tests preflight rejection. Expand **Exact composed system override** to inspect the selected file content and hash.

## Exercise

The host registry names four files: concise, explanatory, review-v1 and review-v2. Each file supplies an output preference appended to a stable base system instruction. The comparison snapshot includes the file path, SHA-256, exact composed override, fixed question, empty tool capabilities and a fresh session ID. Existing snapshots do not silently update when a new style version is selected.

The authored answers show formatting differences only. A separate closed Zod schema validates the JSON report regardless of style text. An unknown name fails before any session is created.

## Evidence to inspect

Compare instruction hashes, session IDs, the fixed question and unchanged capabilities. Read `server/lib/lab34-styles.ts` for the trusted file registry and separate report validator. Compare review-v1 and review-v2 to see explicit host versioning.

## Troubleshooting

An unknown style returns an invalid-request error. Select a trusted file name and start a new comparison. A closed or expired run requires another fresh comparison.

## Limitations

This fixture makes zero provider calls and contains no measured style-quality scores. Live style comparison requires a dedicated configured Managed agent. No Agent SDK `settings.outputStyle`, plugin precedence, `reloadStyles`, or `keep-coding-instructions` field is assumed.

## Challenge

Use an unknown style and inspect the preflight rejection. Explain why no new session was created.

## Run locally

```powershell
node --import tsx --test tests/lab34-output-styles.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab34-browser-demonstration.mjs
```
