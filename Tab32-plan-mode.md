# Lab 32: Plan review and execution gate

## Prerequisites

Run the local server and open Lab 32. No API key is needed for the offline fixture.

## Goal

Review a versioned plan before a separate, bounded execution phase. This is a host workflow, not an Agent SDK permission mode.

## Controls

**Start plan** creates a versioned plan. **Approve current plan**, **Reject plan**, **Request revision**, and **Try stale approval** exercise the host decision gate. **Try planning write**, **Try unselected execution tool**, **Cancel pending plan**, and **Inspect file evidence** show enforcement.

## Exercise

Start an offline plan. The host creates a disposable fictional `notes.txt` and records its SHA-256 hash. The planning session has no file-write capability. Try **Try planning write** and confirm its denial and unchanged file hash.

Approve the current plan using its exact version and hash. The host creates a new execution session ID and permits one checked `append_checklist` action against the fixed fixture path. Compare the initial and current file hashes and the single execution effect. Try the unselected `write_anywhere` tool; it remains denied even after approval. Plan text never grants capabilities.

Request a revision with feedback. The host creates a new version and hash. Try a stale approval for the old version, then approve the current plan. Repeat with rejection and cancellation; neither executes. The fixture is removed when the server closes.

## Evidence to inspect

Compare plan version and SHA-256 hash, planning and execution session IDs, the fixture file hashes and text, file-effect counters, and the last host tool decision. Read `shared/lab32-plan-mode.ts`, `server/lib/lab32-plan-gate.ts`, and `server/concepts/32-plan-mode.ts`.

## Troubleshooting

An expired, rejected, canceled, or already approved plan returns a conflict. Start a new run. After revision, use the displayed current version and hash.

## Limitations

The offline fixture makes zero Anthropic calls. A live implementation would require a separately configured read-only Managed planning agent and a dedicated restricted execution agent in a fresh session, with checked session configuration and host-enforced tool handlers. No `EnterPlanMode`, `ExitPlanMode`, or `setPermissionMode` field is inferred from the Agent SDK. This lab deliberately does not provision agents or start billed sessions.

## Run locally

```powershell
node --import tsx --test tests/lab32-plan-mode.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab32-browser-demonstration.mjs
```

## Challenge

Request a revision and verify that an older approval cannot authorize the new plan. Explain which host fields changed and why no file effect occurred until the current plan was approved.
