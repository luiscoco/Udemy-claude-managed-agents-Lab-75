# Lab 11: Managed skills and progressive loading

## Prerequisites

Use Node.js 24 and the installed official TypeScript SDK 0.133.0. Offline mode requires no credentials. The authored bundles live in `skills/lab11/`, with a `format-observation/SKILL.md` and a reference file in v1 and v2. The missing-reference bundle deliberately omits that file.

For live mode, reuse the configured base agent and environment, with server-only API credentials and explicit live opt-in. No upload, agent provisioning or model execution occurs at startup, during an offline exercise, or during a local setup check.

```powershell
cd C:\claude-managed-agents
npm.cmd install
npm.cmd run skills:check -- v1
npm.cmd run skills:check -- missing-reference
npm.cmd run skills:check -- v2
npm.cmd run dev
```

Open the actual localhost URL printed by Vite, then select Lab 11. Vite prefers 5174 and can select a free port. Keep the backend running with outbound connectivity for deliberate live runs.

Skill uploads are separate explicit external writes. Run these only when you choose to create the cloud resources:

```powershell
npm.cmd run skills:upload -- v1
npm.cmd run skills:upload -- missing-reference
npm.cmd run skills:upload -- v2
```

The first command creates a skill; subsequent commands upload complete snapshots as new versions of that skill. Returned IDs and immutable version IDs are recorded in `managed/lab11-skills.local.json`, excluded from Git and npm distribution. The command refuses to overwrite an existing revision pin. Never retry an uncertain upload automatically; reconcile the returned resource in Claude Console if local recording failed. Uploads do not create a session or run a model.

## Controls

- **Skill variant** selects no attachment, pinned v1, missing ID, missing reference, or pinned v2.
- **Offline loading scenario** selects successful reads, metadata only, failed reads, duplicate events or a hanging stream.
- **Preview authored instructions / reference** loads an allowlisted host file. This preview is not an agent read and never changes a run's evidence.
- **Refresh pin metadata** checks the local manifest and bundle hashes without contacting Anthropic. Configured readiness is not verified provider access.
- **Run offline skill experiment** creates an authored fresh session. Missing ID creates no session.
- **Compare all offline variants** runs the five comparisons serially; every created session has a different ID. This button never runs a live comparison.
- **Cancel experiment** stops local waiting and initiates fresh bounded remote interrupt/status/archive requests through the shared runner.
- **Run live** explicitly runs one selected variant in a billed fresh session. It requires matching pins for attached skills. The host reads provider version metadata before session creation, but never uploads in a run request.

Routes under `/api/c11`: `GET /skills` returns authored metadata and pin readiness; `POST /load` previews a selected local file; `POST /invoke` and `POST /new-session` both run one fresh comparison turn and archive it after idle confirmation. These route names are host operations, not a provider Skill tool. Run requests require `X-Lab-Owner`. Each request owns its newly created session; callers cannot supply a remote session ID or control another request. At most two runs are active, and one per exercise owner. Retained-session controls remain in Labs 06 and 10.

## Evidence to inspect

Keep three layers separate: the authored bundle and its SHA-256; the configured immutable attachment and resolved session skills; and observed `read` tool uses correlated by event ID with `agent.tool_result`. Read attempts, successes and errors are distinct. Duplicate events count once. Instruction and reference reads are displayed separately, with their event IDs and paths.

Only clean absolute paths under a skills directory ending in the authored skill name and exact allowlisted filename are classified. A main-thread read result can show successful loading; an exact authored-text match provides additional evidence. This does not attest semantic compliance or independently prove the entire remote bundle. Truncated or line-numbered output may not establish an exact text match. Agent claims and host previews never count as read evidence. Unrecognized paths stay visible in full tool evidence JSON. A model may not load a relevant-looking skill; missing events are not proof of no read.

The session override pins the retrieved base agent version, preserves its model/system, replaces inherited tools with read only, clears MCP and attaches only the selected custom skill version. Unexpected resolved capabilities block the prompt and trigger cleanup of the returned session ID. Write, edit, bash and web tools are disabled by the toolset; a skill description does not authorize them. Unexpected pauses are denied. The lesson does not implement a manual-only Skill invocation API.

The session can return a numeric version alias while the configured immutable pin uses a `skver_` ID. The host preserves the raw returned version and resolves a numeric alias with a read-only, skill-scoped version lookup. It accepts only the exact configured skill and canonical version ID. Unknown aliases, unavailable lookups, extra skills and `latest` remain rejected before prompt submission; the created session ID is still available for cleanup. Raw and verified canonical versions appear separately in the evidence.

Live usage is aggregated only from deduplicated model-request spans. It includes observed input/output/cache counts, not complete billed session cost. Offline results have no measured usage. Cleanup is separate from completion and can remain pending; an interrupt acknowledgment is followed by status confirmation.

## Troubleshooting

- 400: unsupported Agent SDK fields, invalid file selection, missing owner or limits exceeding server policy.
- 403: wrong local application origin.
- 404 from Preview: the selected revision has no reference file, as intended.
- 422: missing, outdated or invalid pins, disabled live mode or incomplete configuration. Check locally, upload deliberately and refresh metadata. Provider failures after streaming appear in the outcome; inspect safe diagnostics and Claude Console.
- 429: active capacity or same-owner concurrency bound reached.
- No observed reads: use Metadata only offline to understand that attachment is not loading. Live relevance is decided by the model; it need not load every skill.
- Cleanup pending: inspect the printed session ID in Claude Console. Local cancellation does not prove a remote stop or archive.

## Limitations

Fixtures teach the event protocol; they are not measured model relevance or quality. Missing reference in a live run requires its own explicitly uploaded snapshot. Revised versions apply in another fresh session, with no hot reload of existing sessions.

A local `.claude/skills` directory is not automatically mounted into a cloud session. A separately mounted trusted GitHub repository can expose its root `.claude/skills/<name>/SKILL.md` at session start. This lab mounts no repository. Review repository instructions before trusting that distinct discovery path. Plugin discovery, Agent SDK Skill tool calls, manual-only flags, hot reload and subagent preload APIs are not assumed. Skill filtering is not authorization. Child agents require independent worker skill/capability configuration; this lesson rejects multiagent bases.

## Challenge

Run With pinned skill using Metadata only, then successful reads. Compare configured/resolved metadata with the two read event pairs. Preview the reference and explain why that does not add agent evidence. Compare v1 and v2, then remove the reference. Predict which evidence can change while the attachment count remains one.

## Official references

- [Managed Agents skills](https://platform.claude.com/docs/en/managed-agents/skills)
- [Create a skill](https://platform.claude.com/docs/en/api/beta/skills/create)
- [Skill versions](https://platform.claude.com/docs/en/api/beta/skills/versions/create)
- [Get Skill Version](https://platform.claude.com/docs/en/api/typescript/beta/skills/versions/retrieve)
- [Managed Agents permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies)

The checked-in implementation uses the installed SDK types as the parameter contract.
