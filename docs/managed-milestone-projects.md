# Claude Managed Agents milestone projects

Open **Milestone projects** in the course sidebar or the Home course-progress toolbar. The three browser apps are adapted from the [Student Rebuild reference repository](https://github.com/luiscoco/Udemy-Claude-Agent-SDK-Student-Rebuild), with their runtime and teaching content migrated to Claude Managed Agents.

| Project | Default web / API ports | Guided material | Stages |
| --- | --- | --- | --- |
| Study Coach | 5191 / 5291 | 127 topics in 17 sections, ten coach prompts per topic | M01–M07 |
| Agent Evaluation Studio | 5192 / 5292 | 170 cases, instruction variants, timeline, review and history | M08–M14 |
| Agent Publishing Studio | 5193 / 5293 | 173 prompts, source uploads, Word/PDF and SVG/PNG exports | M15–M22 |

The starter archives contain source, tests, lockfiles, build prompts and blank configuration examples. They exclude installed dependencies, build output, credentials, runtime history and generated media. Source is under `mini-projects/`. Learner and reference modes show working prepared workflows; stage completion and durable production hosting remain explicit student work. Neither opening an app nor passing an authored fixture marks course progress complete.

## Setup

Use Node 24. From the course folder run `npm run projects:install`. Install publishing's Python dependencies with `.\.venv\Scripts\python.exe -m pip install -r mini-projects/agent-publishing-studio/requirements.txt` on this Windows workspace. Install its export/test browser with `node mini-projects/agent-publishing-studio/node_modules/playwright/cli.js install chromium`. The launcher uses the course virtual environment when present, or an explicit `PYTHON` override.

Start a project from its card, then choose **Open**. An occupied port is preserved and another available pair is selected. **Stop** ends only processes owned by the course launcher. The frontend receives runtime settings without provider credentials. Each project can also run independently: extract the starter, run `npm ci`, follow its README prerequisites, then `npm test`, `npm run build`, and `npm run dev`.

## Managed Agents migration

All three projects depend on `@anthropic-ai/sdk@1.3.0`. The Claude Agent SDK package, `query()` subprocess, `maxTurns`, SDK `outputFormat`, and SDK result-subtype execution adapters are absent. The generated study catalogs use this course's 75 actual lesson objectives, source excerpts, source digests and evidence challenges. Regenerate them with `node --import tsx scripts/build-managed-milestones.ts`, then refresh the archive allowlist using `node scripts/mini-project-manifest.mjs`.

Each live request creates a [Managed session](https://platform.claude.com/docs/en/managed-agents/sessions) with a configured existing agent and environment. Session-local `agent_with_overrides` sets model, system instructions, explicit tools/MCP and cleared skills, leaving the persistent agent unchanged. A [session budget](https://platform.claude.com/docs/en/managed-agents/budgets) sets `max_list_cost` in minor currency units. Host deadline/event limits are separate from provider budgets.

The host opens `sessions.events.stream` before sending `user.message`, deduplicates event IDs, keeps subthread output separate, and requires `session.status_idle` with `end_turn` for completion. Usage and list cost are retrieved from the session; unknown values stay unknown. Cancellation/failure sends `user.interrupt`, inspects remote state, and archives confirmed-idle sessions. An unconfirmed cleanup retains the session ID for Claude Console recovery. No automatic paid retry occurs.

Study Coach replays bounded host conversation history into a new Managed session for each paid question. Evaluation's optional independent reviewer uses a second tool-free Managed session and splits the selected combined budget across both sessions. This is host coordination, not native multiagent delegation. Publishing requests JSON plans as text and validates them locally before building files. PNG visual planning sends a validated image block; prepared styling samples colors and crops locally. Documents and images remain host-generated artifacts.

## Live configuration and verification

Prepared mode is the default and makes zero provider calls. Live mode requires `ANTHROPIC_API_KEY`, `CLAUDE_MANAGED_AGENT_ID`, `CLAUDE_MANAGED_ENVIRONMENT_ID`, and `MANAGED_LIVE_ENABLED=true` in the server environment. `MILESTONE_LIVE_ENABLED=false` disables live milestone execution. Existing course credentials and IDs are forwarded only to project backends. Each paid question, evaluation or content plan requires fresh consent; MCP access has separate consent. Starting an app creates no remote agent, environment or session.

Use `npm run projects:check` for the three standalone suites and `npm run projects:build` for their production builds. Integration coverage is in `tests/mini-projects.test.ts` and `browser-tests/mini-projects.spec.ts`. Live protocol tests inject fake Managed clients and make no provider requests. These checks verify the implementation contract, not live account permissions or real provider execution.

Histories and downloads are local, in-memory teaching state and clear when their server stops. File signatures and self-reviewed criteria do not prove factual correctness or production readiness. The original dependency-free offline milestone exercises remain below the new browser apps.
