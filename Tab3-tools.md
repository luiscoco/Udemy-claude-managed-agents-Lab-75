# Lab 03: Built-in tools

A tool being **enabled** means it is in the session's toolset. A call being **permitted** depends on that tool's `permission_policy` and, when the session pauses, on the host's `user.tool_confirmation`. This lab keeps the two apart, and it checks results by reading files on disk, never by trusting what the agent says.

The agent works inside the session container. Its working directory is `/workspace`, file resources are mounted read-only under `/mnt/session/uploads/`, and files it writes to `/mnt/session/outputs/` are captured by the Files API. Nothing runs on your computer except the host, which answers confirmations and keeps a sandbox copy of the files.

## Prerequisites

Use Node 24 or newer and the installed Anthropic TypeScript SDK 0.133.0. Labs 01 and 02 should already work. Offline mode needs no credentials, provisioning or account access. Run from this workspace in PowerShell:

```powershell
npm run dev
```

Open http://127.0.0.1:5174/?lesson=3 and select **Run the exercise**. If your NVM installation blocks npm, run the entrypoints directly:

```powershell
node scripts/dev-server.mjs
# In a second PowerShell window:
node node_modules/vite/bin/vite.js
```

Live runs are optional and billed. They upload two small Markdown files, create one session and need `MANAGED_LIVE_ENABLED=true`. See docs/managed-setup.md for configuring existing resources; do not provision just to run fixtures. The server never updates the shared agent.

## Concept mapping

| Agent SDK term | Managed Agents equivalent |
| --- | --- |
| `tools` (available) | `agent_toolset_20260401` with `default_config.enabled: false` and `configs[].enabled: true` per tool (bash, read, write, edit, glob, grep). `web_fetch` and `web_search` are always disabled. |
| `allowedTools` / permission rules | Per-tool `permission_policy`: `always_allow`, `always_ask` or `auto` |
| `permissionMode` | `default_config.permission_policy` |
| Host approval (`canUseTool`) | `user.tool_confirmation` with `tool_use_id` = the `sevt_…` event ID, `result` allow or deny, plus a `deny_message` |
| `cwd` | Container working directory `/workspace`. Fixtures mount read-only at `/mnt/session/uploads/…`; outputs go to `/mnt/session/outputs/`. |

Requests that contain `allowedTools`, `disallowedTools`, `permissionMode`, `cwd` or `canUseTool` get HTTP 400 and the message names the field. They are never forwarded or translated into fields the provider doesn't have. The session is created with `agent: { type: "agent_with_overrides", id, version?, tools: [<lab toolset>], mcp_servers: [], skills: [] }`, so the toolset applies to this session only.

## Controls

- **Preset** chooses the toolset and the host's answers:
  1. **Read-only**: only `read`, `glob` and `grep` are enabled (`always_allow`).
  2. **Unavailable Write**: `write` and `edit` are not enabled. A write attempt arrives with `evaluated_permission: "deny"` and **no** `evaluation` object, because no policy was evaluated.
  3. **Denied Write**: `write` is enabled with `always_ask`. The session goes idle with `requires_action`, and the host sends `user.tool_confirmation` with `result: "deny"` and a `deny_message`.
  4. **Permitted edit**: `edit` and `bash` are enabled with `always_ask`. The host allows the allowlisted `cp` and an edit to `/mnt/session/outputs/draft.md`, and denies anything else.
  5. **Auto (server-evaluated, not a human checkpoint)**: `read`, `write` and `edit` use `auto`; the server runs, denies or pauses each call. `bash` remains `always_ask`.
- **Remove enabled tools** removes tools from the preset before the session is created. Use it for the challenge.
- **Prompt** defaults to the preset's instructions and uses only container paths. Offline fixtures follow an authored plan and ignore your wording.
- **Local deadline (seconds)** is 1 to 120 and cannot exceed MANAGED_DEADLINE_MS. It limits local waiting and triggers an interruption attempt.
- **Live session budget (US cents)** is 1 to 500, sent as `budget.max_list_cost` on the session.
- **Offline scenario**: Normal turn, or "Agent keeps working", which hangs after the first tool result so you can practise Cancel query and the deadline.
- **Refresh files** calls `GET /api/c3/files`. **Reset sandbox** calls `POST /api/c3/reset` and restores the authored fixtures; it returns 429 while a query is using that sandbox.

Bash is only ever enabled with `always_ask`. The host approves only these exact commands and denies everything else, including extra spaces, chained commands and any path outside the three roots:

```text
ls /workspace
ls /mnt/session/uploads
ls /mnt/session/outputs
cat /mnt/session/uploads/notes.md
cat /mnt/session/uploads/draft.md
cp /mnt/session/uploads/draft.md /mnt/session/outputs/draft.md
```

## Experiment

1. Run **Read-only**. Every call is `allow / always_allow`. Files on disk are unchanged and `outputs/` is empty.
2. Run **Unavailable Write**, then **Denied Write**. Compare the Tool calls table: `deny / no evaluation` (unavailable) versus `ask / always_ask` followed by a host deny. The Permission denials list labels the first as unavailable by session-toolset and the second as denied by host. `outputs/draft.md` is absent after both runs.
3. Run **Permitted edit**. Four confirmations go out by `sevt_` ID: the `cp` is allowed, a `cat` containing `..` is denied, the edit to the outputs copy is allowed, and an edit that traverses out of `/mnt/session/outputs` is denied. Then read `outputs/draft.md` on disk: it says `Status: reviewed`. `uploads/draft.md` still says `Status: draft`.
4. Run **Auto**. The write to `/etc/profile` comes back as `deny / auto (high_risk)`. That is a denial by the server, not an unavailable tool.
5. Select **Agent keeps working**, run, and press **Cancel query**. The server attempts `user.interrupt`. Repeat with a 1-second deadline.

Each query gets a fresh disposable sandbox under the OS temp directory, so every preset starts from the same files. The experiment table records the preset, removed tools, outcome, denials and the `Status:` line of `outputs/draft.md` as read from disk.

## Route inventory

| Route | Purpose |
| --- | --- |
| `POST /api/c3/query` | SSE. Body `{ mode, preset, prompt, deadlineSeconds, budgetCents?, removeTools?, scenario? }`. Streams `progress` frames, then one `result`. |
| `GET /api/c3/files` | Lists the latest sandbox: `uploads/` (read-only mounts) and `outputs/` (writable). |
| `POST /api/c3/reset` | Restores the authored `notes.md` and `draft.md` and empties `outputs/` and `workspace/`. |

## Evidence to inspect

Inspect shared/lab03-tools.ts for the presets, `buildToolset`, the mapping table and `deriveDenials`. server/lib/lab03-sandbox.ts holds both path guards, the bash allowlist and `decideConfirmation`. server/lib/lab03-run.ts handles `agent.tool_use`, `agent.tool_result` and `requires_action` pauses, and sends confirmations. server/lib/lab03-port.ts uploads the fixtures, creates the session with overrides, lists outputs with `scope_id` and deletes the uploaded originals. server/lib/lab03-fixtures.ts is the offline simulator, and server/concepts/03-tools.ts hosts the routes.

Classification rules, applied to each `agent.tool_use`:

| Event | State | Listed as |
| --- | --- | --- |
| `evaluated_permission: "allow"` | allowed | – |
| `evaluated_permission: "ask"`, then host allow | allowed by host | – |
| `evaluated_permission: "ask"`, then host deny | denied by host | denied (host) |
| `evaluated_permission: "deny"` with an `evaluation` | denied by server | denied (server-auto) |
| `evaluated_permission: "deny"`, no `evaluation` | unavailable | unavailable (session-toolset) |

The container path guard rejects `..` segments before normalising, absolute paths outside `/workspace`, `/mnt/session/uploads` and `/mnt/session/outputs`, Windows drive, UNC and backslash paths, and NUL bytes. The host path guard additionally rejects absolute host paths and walks every existing segment with `lstat`, so a symlink or junction that resolves outside the sandbox (or dangles) is refused before any read or write. Host confirmations run tool inputs through the same guard before sending allow, and live output filenames are validated before anything is downloaded or written.

## Troubleshooting

A 400 means validation failed before any disk or provider work: check `fieldErrors`. An Agent SDK field produces a message that names it. A 422 means live mode is not configured. A 429 means two queries are already running, or you tried to reset a sandbox that is in use.

If the outcome is paused with "More than 12 confirmations requested", the agent kept retrying denied calls and the host stopped answering. If live outputs report "none", the agent did not write to `/mnt/session/outputs/`; uploads are read-only, so the agent must copy the draft before editing it. If uploads report "pending", delete the listed files in Claude Console. Remote interruption is confirmed only when `user.interrupt` was accepted and the session was then seen idle or terminated. Otherwise check the session in Claude Console.

## Limitations

The offline agent follows a fixed plan and never adapts to a denial, while a live model may try another tool. Its `auto` decisions are an authored stand-in ("deny paths outside the roots"), not the real server classifier. Offline runs apply effects directly to the host sandbox, and live runs copy session outputs into it after the turn. Neither proves anything about Claude's behaviour, cost or latency.

`auto` is not a human checkpoint: a call the server judges safe runs before anyone sees it. Use `always_ask` where a person must review. Only files under `/mnt/session/outputs/` come back from a live session; changes elsewhere in the container stay there.

## Verification

Run in PowerShell:

```powershell
npm run typecheck
node --import tsx --test tests/lab03-tools.test.ts
npm run test:offline
npm run test:lesson-guides
npm run audit:lesson-guides
npm run build
node scripts/run-browser-tests.mjs lab03.spec.ts
```

With an NVM npm-wrapper restriction, use `node node_modules/typescript/bin/tsc --noEmit`, `node --import tsx --test --test-concurrency=1 tests/*.test.ts`, `node --import tsx scripts/audit-lesson-guides.ts` and `node node_modules/vite/bin/vite.js build`. Do not run managed:provision, live experiments or other external actions as part of verification.

## Challenge

Choose **Permitted edit**, tick **Remove edit**, and predict before you run: does the edit attempt show up as unavailable (`deny` with no `evaluation`) or as denied? What does `outputs/draft.md` contain on disk afterwards? Run it and check your answer against the Tool calls table, the Permission denials list and the file itself. Then explain why the host never received a confirmation request for that edit.
