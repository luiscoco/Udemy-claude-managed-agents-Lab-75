# Agent Evaluation Studio — Claude Managed Agents

170 Managed Agents evaluation cases in 17 sections, instruction variants, review criteria, case navigation, run history, scoped MCP and optional independent Managed review sessions.

Adapted from the three milestone apps in https://github.com/luiscoco/Udemy-Claude-Agent-SDK-Student-Rebuild. This version uses Claude Managed Agents through `@anthropic-ai/sdk@1.3.0`. The Claude Agent SDK package and local `query()` runtime are not dependencies.

## Run

Use Node 24. In this folder run `npm ci`, `npm test`, `npm run build`, then `npm run dev`. Open http://127.0.0.1:5192/. Alternatively use the course sidebar's **Milestone projects** controls after `npm run projects:install` in the course folder.

Browser tests need Chromium: `npx playwright install chromium`. Publishing also needs Python with `python -m pip install -r requirements.txt`; set `PYTHON` to the intended interpreter when needed. Course launch controls select the root .venv interpreter when available. All uploaded/generated files and runtime histories remain local; in-memory history clears when the server stops.

## Prepared and live

Prepared mode is the default and makes zero provider calls. Its authored content is not a tailored answer or evidence of live success. Live mode requires private server variables `ANTHROPIC_API_KEY`, `CLAUDE_MANAGED_AGENT_ID`, `CLAUDE_MANAGED_ENVIRONMENT_ID`, and `MANAGED_LIVE_ENABLED=true`. Existing configured agent and environment resources are reused; no persistent agents or environments are created or changed. Never put credentials in Vite variables.

Each live request requires fresh consent. A new session uses `agent_with_overrides` for model, system, explicit tool/MCP lists and cleared skills. Its budget has an enforced list-cost ceiling in minor currency units. Open the event stream before sending `user.message`, deduplicate events, and require `session.status_idle` with `end_turn` for completion. Partial text is not a completed answer. Local event and deadline limits are host controls, not Agent SDK turn options.

On failure/cancellation the host sends `user.interrupt`, inspects remote status and usage, and archives confirmed-idle sessions. If cleanup cannot be confirmed, retain and inspect the session ID in Claude Console. Token/model-request counts and cost are reported evidence; unknown values are not zero. There are no automatic paid retries.

Study Coach replays a bounded conversation history into a new Managed session for each paid question. Evaluation's optional reviewer uses a second independent tool-free Managed session, with the selected combined budget split across the two sessions; it is not a native subagent. Publishing JSON plans are requested as text then parsed with the local schema before deterministic file generation. A valid file signature does not establish factual correctness or good pagination.

## Build stages

Follow M08–M14 in `prompts/`. The prepared workflow is a runnable starting point. Build the stages in your own copy and record observed evidence; opening a reference, generating an answer or passing an authored fixture never automatically marks course progress complete.

The guided catalogs are generated from this repository's actual Managed Agents lesson objectives, source excerpts and evidence challenges by `scripts/build-managed-milestones.ts` in the parent course. Host patterns are labelled separately from Managed API concepts. Live integration is covered with injected fake Managed clients in offline tests; account access and live provider behavior require an independently authorized live run.
