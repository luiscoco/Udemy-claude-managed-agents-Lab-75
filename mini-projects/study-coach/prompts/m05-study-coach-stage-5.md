# M05 - Replay bounded host conversation history

Build this stage in mini-projects/study-coach. Use the working starter as an example, not proof that your implementation passed.

## Goal

Replay bounded host conversation history. Use Claude Managed Agents through @anthropic-ai/sdk, never the Claude Agent SDK query process.

## Build

1. Inspect server.mjs, managed-runtime.mjs, src/main.jsx and the project tests. Make the smallest reviewable change for this stage.
2. Keep prepared fixtures separate from live results. Validate inputs before opening a remote session.
3. Live execution requires a configured existing agent and environment, MANAGED_LIVE_ENABLED=true and fresh paid consent. Create a budgeted session using agent_with_overrides; do not mutate shared agents.
4. Open sessions.events.stream before sending user.message. Deduplicate event IDs, preserve partial output, and require session.status_idle with end_turn before accepting completion.
5. On cancellation or failure, send user.interrupt, inspect status and usage, archive confirmed-idle sessions, and preserve pending cleanup IDs.
6. Keep host file generation, validation, review decisions and persistence distinct from Managed API behavior. Validate a JSON plan locally; do not invent an SDK outputFormat option.

## Verify

Run npm test and npm run build. Demonstrate a prepared success, a rejected input, an interrupted or budget-limited fake session, and a cleanup failure with its retained session ID. Offline tests use an injected fake Managed client and spend no API credits. A real run needs separate authorization in the UI.

## Student evidence

Record your code change, test output, source path, Managed session/event receipts when applicable, and unresolved limitations. A green fixture does not certify live behavior. No automatic grading or course completion is implied.
