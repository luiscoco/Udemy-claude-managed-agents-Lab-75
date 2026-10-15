# Lab 17: Host snapshots and file restoration

Restore an isolated host fixture tree while retaining Managed session conversation history. These snapshots belong to this application. They are separate from the Managed platform's cloud sandbox checkpoints and do not rewind a remote container.

## Prerequisites

```powershell
Set-Location C:\claude-managed-agents
npm.cmd ci
npm.cmd run dev
# Open the Local URL printed by Vite, then ?lesson=17.
```

The offline exercise uses authored session events and real files under the ignored `generated/lab17/<run-id>/` tree. It does not contact Anthropic. For an optional billed live run, configure the isolated server API key, a single-agent base, cloud environment and `MANAGED_LIVE_ENABLED=true`, then select **Run live**. The live session is text-only with built-in filesystem, MCP and skill tools disabled. No provider resource is created by a readiness check.

## Controls

Start an offline fixture session and take a host snapshot. The tracked paths are exactly `notes.md` and `draft.md`; `scratch.md` is deliberately untracked. The UI action sends a bounded conversation turn through the shared retained-session event consumer. Once confirmed idle, the selected host handler reads, edits or creates a file in the isolated tree. Its effect is application-controlled and independent of the model's answer. Three turns are allowed per session.

After editing `notes.md` and creating `draft.md`, select the original snapshot and **Dry-run restore**. The plan lists exact tracked-path operations and hashes. **Confirm restore** requires that plan ID, the same owner, snapshot and unchanged fixture version. It restores the original `notes.md` and deletes the newly created `draft.md`; it leaves `scratch.md` and conversation turns alone. A new edit invalidates the plan. Unknown snapshots, foreign owners, stale versions and active or uncertain sessions are refused.

**Inspect remote outputs separately** is available after an idle turn. Offline it reports that no remote files exist. Live it lists session-scoped Files API outputs and downloads up to three bounded `.txt` or `.md` files for size/hash inspection, never into the snapshot tree. **Close session** archives the retained session; **Run one-shot offline** demonstrates a separate session that closes after one turn.

Routes under `/api/c17` are `POST /session`, `/send`, `/snapshot`, `/restore`, `/end` and `/oneshot`. Closed Zod request/report shapes, local origin and owner checks, a five-snapshot and two-session cap, version guards, cancellation, deadlines, SSE events and cleanup bound the exercise.

## Evidence to inspect

Compare file content and SHA-256 before and after restoration. A snapshot records its ID, tracked hashes, related session ID, host event IDs and up to twelve **observed** Managed stream event IDs. An ID records correlation, not proof that every remote event was seen. Confirm that the conversation list and session ID remain the same after restore, while `scratch.md` remains present. The `generated/lab17/<run-id>/snapshots/<snapshot-id>.json` file contains only the two tracked contents.

## Troubleshooting

If live setup is unavailable, check the server-only API key, base agent, environment and opt-in. A session that has not reached confirmed idle cannot be snapshotted or restored. If cleanup is pending, reconcile the remote session before another paid run. If restore says the version changed, inspect the latest files and generate a fresh dry run. Avoid editing the generated fixture tree outside this lesson while a plan is pending; the restore also checks current hashes before applying it.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab17-checkpointing.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab17-browser-demonstration.mjs
```

## Limitations

The host file handlers follow explicit UI actions after a model turn; the agent does not invoke a filesystem tool. Offline event and answer evidence is authored. Restoring host files does not reverse conversation events, API calls, remote outputs, usage, network effects or the cloud sandbox. The live output list is bounded and only reports files available through the session-scoped API. A local cancellation does not prove a remote stop.

## Challenge

Edit the original note, create the tracked draft and untracked scratch file, then restore the first snapshot. Explain why the conversation still records those turns and why a remote output would need separate inspection or cleanup.

Official references checked 2026-10-15: [Managed files](https://platform.claude.com/docs/en/managed-agents/files), [events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), and [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations).
