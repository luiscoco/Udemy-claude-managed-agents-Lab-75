# Lab 22: Explicit project context and memory

The host reads selected authored project files, records their hashes, and sends their text as a `user.message` on a fresh session. File names are teaching fixtures: this application does not assume Claude Code or Agent SDK `CLAUDE.md` discovery. A separate summary fixture demonstrates an explicit handoff. No cloud memory store is attached.

## Prerequisites

Run `npm.cmd ci` and `npm.cmd run dev`, then open `?lesson=22`. Offline cases need no credentials and contact no provider. A deliberate live run needs the isolated server API key, configured single-agent Managed base and environment, and `MANAGED_LIVE_ENABLED=true`; it can be billed. Live conflict is disabled.

## Controls

`GET /api/c22/files` previews four fixed, allowlisted files. **Nested** reads root and observation-module documents. **Conflict** adds an untrusted imported note. **Disabled** reads no context. **Handoff** reads root plus a separate summary fixture on a fresh session. `POST /api/c22/run` executes one bounded turn and returns a typed SSE result; `POST /api/c22/reset` removes an owned result after explicit confirmation. Changing a scenario starts a new session, not an implicit continuation.

## Evidence to inspect

Compare selected keys, SHA-256 hashes and the exact composed `user.message` with the file inventory. The host read list is evidence of local file access. The cloud memory field is `not-attached`; remote file reads remain empty because no file-reading tools are enabled in the text-only session. A model response or scripted fixture response is separate from those observations. The untrusted note's instruction is content, not an authorization rule.

## Troubleshooting

If file inventory fails, confirm the authored `fixtures/lab22` files exist. If live setup is unavailable, inspect the isolated server key, base agent, environment and opt-in. If an active run is canceled or times out, local cancellation alone does not prove remote termination; the retained-session cleanup path reconciles the session before a retry.

## Limitations

Offline responses are authored fixtures, not proof of Claude behavior. This exercise reads only fixed workspace fixtures; it never reads a home memory file. It does not attach, create or modify a Managed memory store. [Managed memory stores](https://platform.claude.com/docs/en/managed-agents/memory) are separate workspace resources attached at session creation; the agent then reads them with enabled file tools. Such a setup needs its own tenant ownership and capability checks. No automatic scoped rules loader is inferred from the fixture paths. A selected summary is explicit host input, not persisted cloud recall.

## Challenge

Change from Nested to Handoff. Predict which authored markers disappear and which appear, then compare the exact sent message to your prediction.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab22-claude-md-memory.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab22-browser-demonstration.mjs
```

Official references: [Managed memory](https://platform.claude.com/docs/en/managed-agents/memory), [session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming).
