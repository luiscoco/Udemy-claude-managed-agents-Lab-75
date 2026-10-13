# Managed Agents lab setup

Requires Node 24+, this project's pinned Anthropic TypeScript SDK 0.133.0,
a Claude Console account with API access and available credits, and access to
Managed Agents. Cloud sessions run remotely: Docker, Claude Code login and a
local Agent SDK process are unnecessary. A Claude web subscription does not
configure API authentication or cover API billing.

## Local configuration

If an API key was posted in chat, revoke it in Claude Console and generate a new
one before continuing. Never paste the replacement into chat.

Run from PowerShell:

```powershell
Set-Location C:\claude-managed-agents
npm.cmd ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
. .\scripts\set-managed-key.ps1
npm.cmd run managed:ready
```

The key prompt hides your input and keeps the literal secret out of shell history.
It sets ANTHROPIC_API_KEY for this shell and its children, without writing the key
to disk. Repeat after opening a new shell. Remove it with
`Remove-Item Env:ANTHROPIC_API_KEY` after stopping the backend. Keep the key field
in `.env` blank when using this method. Startup does not require a key for offline
work. Secret files are ignored; never use VITE_* credentials.

On this machine, if npm.cmd is unavailable, substitute each `npm.cmd` with:

```powershell
node 'C:\Users\luisc\AppData\Local\Author Software\nvm\installs\v24.21.0\node_modules\npm\bin\npm-cli.js' run managed:ready
```

## Resources (explicit remote commands)

Reuse existing resource IDs by setting CLAUDE_MANAGED_AGENT_ID and
CLAUDE_MANAGED_ENVIRONMENT_ID in `.env`. The existing agent must have no tools,
MCP servers or multiagent configuration for this first lesson.

Alternatively, review managed/lab01-agent.json and lab01-environment.json, set
MANAGED_MODEL to an available, supported model in `.env`, then explicitly run:

```powershell
npm.cmd run managed:provision
```

This contacts Anthropic and creates remote resources; it does not start a session.
It writes IDs and agent version to ignored managed/resources.local.json. Copy the
printed IDs to `.env`; the script does not overwrite `.env`. If environment
creation fails, the created agent ID remains recorded. Inspect Console and reuse
that agent; do not blindly repeat provisioning. The script refuses to provision
again while the record exists. Tool-enabled later lessons must use separate agents.
Agent IDs select the latest version in the existing adapter. Provider session
creation also supports `{ id, version }` for pinning; this setup does not enable
pinning or silently update resources.

Run this optional read-only remote check:

```powershell
npm.cmd run managed:verify
```

It checks access to the agent and environment and the text-only agent's
capabilities. No session, prompt or model work is started. Local readiness never
contacts Anthropic and always reports providerVerified=false; a successful remote
check confirms access at that moment only.

### Lab 05 custom tools agent

Lab 05's live mode needs a separate agent that declares the three custom task
tools. Review managed/lab05-agent.json, then explicitly run:

```powershell
npm.cmd run managed:provision -- lab05
```

This creates one agent and no environment or session; Lab 05 reuses
CLAUDE_MANAGED_ENVIRONMENT_ID. It writes the ID to ignored
managed/lab05-resources.local.json and refuses to run again while that record
exists. Copy the printed CLAUDE_MANAGED_LAB05_AGENT_ID to `.env`. The optional
read-only check `npm.cmd run managed:verify -- lab05` confirms that the agent's
tools are exactly list_tasks, add_task and complete_task.

## Execution settings

| Server variable | Purpose / provider mapping |
| --- | --- |
| ANTHROPIC_API_KEY | SDK authentication; never returned to the browser |
| CLAUDE_MANAGED_AGENT_ID | sessions.create `agent` |
| CLAUDE_MANAGED_ENVIRONMENT_ID | sessions.create `environment_id` |
| MANAGED_LIVE_ENABLED | App gate; false by default, true enables live requests |
| MANAGED_DEADLINE_MS | App deadline; 1,000–120,000 ms, default 120,000 |
| MANAGED_MAX_CONCURRENT | App concurrent checks; 1–10, default 2 |
| MANAGED_BUDGET_CENTS | Session budget.max_list_cost.amount, USD integer cents; 1–9,999, default 50 |
| MANAGED_MODEL | Manual provisioning model; not a session override |
| CLAUDE_MANAGED_LAB05_AGENT_ID | Lab 05 only: the custom-tools agent, verified before each session and pinned to that version |

Legacy MANAGED_AGENT_ID and MANAGED_ENVIRONMENT_ID remain supported; canonical
names take precedence. The SDK attaches managed-agents-2026-04-01 automatically;
an offline SDK transport test verifies the header. API retries are disabled.
The budget is checked between model requests, so the last request may exceed it.
List cost is not necessarily billed cost. Live execution can incur charges.

Start locally, then open http://127.0.0.1:5174:

```powershell
npm.cmd run dev
```

Choose the Offline scripted walkthrough without credentials. To run live, set
MANAGED_LIVE_ENABLED=true, restart the backend, click Check live setup, select
Live, and explicitly click Run. Local setup reports only configuration, not
provider verification. Cancel attempts independent remote interruption and bounded
cleanup; unconfirmed cleanup shows the session ID for Console recovery. Stop with
Ctrl+C. No setup command starts a development server automatically.

## Checks and troubleshooting

```powershell
npm.cmd run typecheck
npm.cmd run test:offline
npm.cmd run test:lesson-guides
npm.cmd run build
```

Missing settings: fill the named fields and restart. Disabled live: explicitly
enable the gate and check setup. Authentication failure: replace the key locally.
403/404: confirm resource IDs and workspace access. 429: wait and retry manually.
Invalid model or fields: check current provider documentation. Readiness validates
local SDK methods, not account model availability. Never log raw provider errors.

Official references: [Quickstart](https://platform.claude.com/docs/en/managed-agents/quickstart),
[Agent setup](https://platform.claude.com/docs/en/managed-agents/agent-setup),
[Environments](https://platform.claude.com/docs/en/managed-agents/environments),
[Budgets](https://platform.claude.com/docs/en/managed-agents/budgets).

## Lab 01 (session event streaming)

`POST /api/c1/query` runs one session turn. Offline scenarios use authored fixtures
and need nothing above. Live mode reuses the settings in the table: the session is
created with the `MANAGED_BUDGET_CENTS` cap (the documented session budget), the
agent must have no tools or MCP servers, and at most `MANAGED_MAX_CONCURRENT` queries
run at once. `MANAGED_DEADLINE_MS` bounds the turn; on deadline or cancellation the
backend sends a separate bounded `user.interrupt` before closing the stream, then
reports whether it could confirm the session stopped. Live runs are billed and are
never started by tests or setup commands.
