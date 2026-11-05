# Lab 16: Environment and configuration provenance

Trace which application setting wins locally, then inspect the separate Managed environment and resource boundary. The host precedence in this lesson is **application-defined**, not an Agent SDK feature.

## Prerequisites

```powershell
Set-Location C:\claude-managed-agents
npm.cmd ci
npm.cmd run dev
# Open the Local URL printed by Vite, then ?lesson=16.
```

All four offline scenarios use synthetic settings and authored fixture events. They never read personal configuration or call Anthropic. The course default observation region is `north`; an optional user override wins over it, and an optional session override wins over both. Resolve host settings and Compare three layers display the selected source alongside the value. Missing credential means fictional readiness is false, not that the server inspected your key.

## Controls

The authored cloud example uses supported `BetaCloudConfigParams`: limited networking with no allowed hosts, MCP egress or package managers, and no packages. It is an example definition, not a provisioned environment or a claim about the configured account. The local manifest names one approved fixture mount, `/mnt/session/uploads/field-guide.txt`.

`GET /api/c16/files` reads server readiness and the allowlist without provider calls. It shows the **names** of `ANTHROPIC_API_KEY`, the base environment setting and `CLAUDE_MANAGED_LAB16_FILE_ID`, plus redacted present/missing status. Keys remain server-side. A host process variable is not automatically injected into the remote container. Agent SDK `env` inheritance/replacement, `settings.env`, `settingSources`, `resolveSettings` and `additionalDirectories` are not translated to Managed session options.

For a deliberate live run, configure the isolated server API key, an active single-agent base and cloud environment matching the restricted authored policy, `MANAGED_LIVE_ENABLED=true`, and a previously uploaded, reviewed fictional file ID in server-only `CLAUDE_MANAGED_LAB16_FILE_ID`. Upload the file separately using the documented Files API; this lesson does not provision, upload or copy any local personal file. Click **Run live** only when ready. The server retrieves the actual environment and agent, checks the limited network and empty package settings, pins the agent version, creates a capped session with one file resource whose only enabled tool is the built-in read tool (file resources require it), and lists returned session resources to verify its mount path before sending the prompt. It archives after confirmed idle. A resource listing confirms the mount metadata; an agent answer does not prove that the file was read. No vault is attached by this lesson. Future credential examples should use a reviewed Managed vault, never `VITE_` variables or agent-visible API keys.

## Evidence to inspect

Run Winning host layer with user `south` and session `north`, then remove the session override: the winner changes from session to user. The remote `OBSERVATION_REGION` row remains “not injected” in both cases. Missing credential changes only the synthetic readiness row. Absent remote mount removes the fictional file resource. Restricted path asks the host guard about `/etc/passwd`; it is denied without opening any file. The path check is a host policy demonstration, not proof of cloud OS containment or blanket filesystem access.

Routes under `/api/c16` are `GET /files` and `POST /env-run`, `/resolve`, `/layers-run`, `/access-run`. Requests are closed Zod shapes, locally owned, bounded and origin checked. Only `/env-run` supports a separately selected live mode; the other experiments are offline. The live run uses the shared SSE, event-consumer and session cleanup boundary through an injected port.

## Troubleshooting

If Run live is unavailable, check the server-only base agent, cloud environment, isolated API key, live opt-in and approved file ID. Check again after restarting the backend. An unconfirmed mount or remote session blocks the prompt or leaves cleanup pending; inspect Claude Console before repeating any paid action. An offline path denial is a local policy result, not a remote sandbox test.

### PowerShell checks

```powershell
npm.cmd run typecheck
node --import tsx --test tests/lab16-settings-env.test.ts
npm.cmd run audit:lesson-guides
npm.cmd run test:lesson-guides
npm.cmd run build
node scripts/lab16-browser-demonstration.mjs
```

## Limitations

Offline environment, credential and mount evidence is authored. Live environment and resource metadata comes from API responses; the text-only agent has no file-read tool, so the lesson does not claim content-read evidence. An unknown create response may require Claude Console reconciliation. Local abort is not proof of remote stop, and cleanup may remain pending. Environment networking metadata shows configuration, not a network test.

## Challenge

Change a host layer and identify the winning source. Explain why the remote container still lacks that variable unless an explicitly supported resource or service path supplies the needed context.

Official references checked 2026-10-14: [Managed environments API](https://platform.claude.com/docs/en/api/typescript/beta/environments/create), [adding files](https://platform.claude.com/docs/en/managed-agents/files), and [secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment).
