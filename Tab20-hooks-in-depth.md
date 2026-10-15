# Lab 20: Lifecycle events and host interceptors

Managed Agents streams persisted session, span, agent and thread events. They are observations, not Claude Agent SDK hook callbacks. A host can deny an action before execution through its custom-tool handler or an `always_ask` confirmation. Seeing a completed tool event afterward cannot undo its effect.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=20`. Offline scenarios need no credentials and contact no provider. Live requires an isolated server API key, a configured Managed base and the Lab 07 custom-tool agent (`CLAUDE_MANAGED_LAB07_AGENT_ID`), plus `MANAGED_LIVE_ENABLED=true`. A deliberate live click starts a billed session. Readiness is a server-configuration check only and creates none.

## Controls

Use **Run offline lifecycle** for six cases. Passing policy edits `draft.md`; denied pre-execution protects `protected.md`; tool failure reaches the handler with an absent old fragment; interceptor exception fails before creating a session or invoking the handler; deadline advances fixture-only virtual ticks without a provider call; final validation failure completes a fixture turn and edit but rejects the agent text against a closed application report schema. A failing final report starts no automatic corrective loop.

The results show an observed provider-event projection, separate host-audit entries, correlation IDs, outcome, cleanup and actual fixture file content. **Inspect run files** and **Inspect draft.md** read the server-owned fixture after the turn; **Reset this fixture** requires the selected run ID and explicit confirmation.

The local routes are `POST /api/c20/run`, `GET /files`, `GET /file`, `POST /reset`, plus a configuration-only `GET /availability`. Run responses stream over SSE. Requests are strict and bounded. Owner/origin checks, concurrency, deadline, budget, event counts and retained fixtures are capped. No Agent SDK `hooks`, `PreToolUse` or `PostToolUse` field is passed to Managed Agents.

## Evidence to inspect

Compare the host audit's **pre-execution** decision, handler before/after phase and post-execution record with the file's final bytes. Tool failure has a handler failure record; interceptor failure records a skipped handler and no session. A provider error is classified separately from either. The final verifier can reject a completed provider turn. Model spans, approvals and child-thread events are shown only if observed; absence is recorded as coverage, not an invented event. Custom-tool results need no `always_ask` confirmation. A multiagent thread can have its own ID; matching event IDs and thread IDs are carried when observed.

## Troubleshooting

If live setup is unavailable, check the isolated API key, Managed resource IDs, Lab 07 custom-tool agent and explicit opt-in. If the live agent's toolset differs from the expected custom tools, creation fails closed. If a local stream is canceled or a deadline expires, inspect interruption and cleanup before another paid run. Run fixtures remain bounded until reset or server shutdown.

## Limitations

Offline provider frames are authored and labeled `authored-fixture`. Virtual ticks are not wall-clock or provider timing. The fixture uses a single thread and may emit no model spans or approval decisions; those absences do not prove they cannot occur live. Live mode supports only passing-policy and denied-pre-execution; failure variants are offline exercises. The host audit is separate from provider events and cannot attest hidden execution. The final report example uses one closed check and deliberately makes no corrective call. Post-execution observation cannot prevent a prior effect.

## Challenge

Compare a host interceptor exception with a failed tool execution. Which one reached the handler, which created a session, and what does `draft.md` prove in each case?

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab20-hooks-in-depth.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab20-browser-demonstration.mjs
```

Official references checked 2026-10-15: [session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [event type reference](https://platform.claude.com/docs/en/managed-agents/reference), [permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies), [session threads](https://platform.claude.com/docs/en/managed-agents/session-threads).
