# Lab 21: Host commands and prompt expansion

This lab uses an application-owned command registry. The command names are not SDK slash commands. Fixed templates expand trusted, validated arguments into a `user.message` on an owned retained session. Local commands touch only bounded host state.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=21`. Offline mode needs no key. Live requires the isolated server API key, configured Managed base agent and environment, and `MANAGED_LIVE_ENABLED=true`. Only a deliberate live model command starts a billed Managed session.

## Controls

Prepare an offline session, select **observation** or **checklist**, and run it. Use **Try invalid args** and **Try unknown command** to see pre-send rejection. **Inspect local history** reads at most three command records; **Reset local history** clears them. Close the command session when finished. The registry is read via `GET /api/c21/commands`; `POST /api/c21/session` prepares or closes; `POST /api/c21/run` handles both local and model commands.

## Evidence to inspect

Compare the displayed expanded `user.message` with the fixed template and selected enum values. A model command increments the session message count. Inspect and reset return zero provider sends, and do not change the retained session's model-message count. Invalid input and foreign owners are rejected before any model call.

## Troubleshooting

If a model command fails, inspect session state and cleanup before another command. A local cancellation cannot prove that remote work stopped. A prepared offline session uses a scripted port; live availability is configuration only.

## Limitations

The offline response is an authored fixture. The local history is bounded, process-local and discarded on restart. There is no shell, arbitrary path, command-file discovery or SDK `supportedCommands` assumption. The registry is distinct from managed skills, whose instruction files are progressively read only when selected by the model. A local inspect action does not attest that a remote session exists yet: session creation is deferred until the first model command.

## Challenge

Why does a local inspect command not create a model turn, while a fixed prompt template does? Show the exact message and the two send counts.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab21-slash-commands.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab21-browser-demonstration.mjs
```

Official references: [session events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [session operations](https://platform.claude.com/docs/en/managed-agents/session-operations).
