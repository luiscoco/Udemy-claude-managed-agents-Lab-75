# Lab 14: Models and supported effort

Compare supported model and effort configurations in fresh Managed Agents sessions. Keep the prompt and model fixed when studying effort. Only public response text is shown.

## Prerequisites

Use Node, React, Vite, strict TypeScript, Express, Zod and the pinned official Anthropic SDK 0.133.0. Offline experiments need no credentials. Live runs require the isolated server API key, a single-agent base agent, environment, live opt-in and operator-declared model readiness. Nothing is provisioned by this lesson.

```powershell
npm.cmd install
npm.cmd run dev
# Optional live readiness declaration, after checking your account access:
# Add to your server .env, then restart the backend:
# CLAUDE_MANAGED_LAB14_MODELS=claude-sonnet-5-5,claude-opus-5-5
```

Open http://127.0.0.1:5174/?lesson=14 and choose Run the exercise. Use the actual port printed by Vite if another process occupies 5174.

## Controls

Select the model, effort, integer-cent budget and local deadline. Run offline model experiment first. Normal completes; primary-unavailable simulates a rejected creation; uncertain blocks fallback; mismatch sends no prompt; hang exercises local cancellation and cleanup. These scenarios never contact Anthropic.

Allow one host fallback only when you want a second model and have selected its separate budget. The fixed prompt and effort carry over. There are at most two attempts, each with a distinct fresh session. Cancellation, unknown creation, unresolved cleanup and resolved configuration mismatch block fallback. Combined selected limits are displayed; they are not measured costs.

Run live is an explicit billed action. Setup and catalog reads are local checks. Supported effort is configured in a model object at session creation; there is no in-place model/effort setter. Close and reconcile experiment attempts cleanup with fresh requests; a local abort does not prove a remote stop.

The application routes under `/api/c14` are GET `/models`, POST `/run`, `/session`, `/send`, `/new-configuration`, `/end`. `/session` prepares an owned local configuration without provider calls; `/send` starts its one fresh remote session. `/run` combines those two operations. `/new-configuration` reconciles the previous experiment before preparing its replacement. Completed turns are archived after idle confirmation. This lesson intentionally avoids conversational carryover between effort comparisons.

## Evidence to inspect

Compare requested and resolved model ID, effort, pinned base agent version and budget. A mismatched snapshot prevents sending and retains the remote ID for cleanup. Model identity is the session snapshot: installed model-request spans do not carry a model ID. Usage is deduplicated by event ID and counts only model-request end events received after the acknowledged user message. Missing spans mean usage is not reported.

Public messages and outcomes are evidence, not proof of correctness. Private thinking events are filtered. Offline usage, latency and cost measurements stay absent. Live host elapsed time includes setup and cleanup, so it is not pure model latency. Evidence text is bounded and may be clipped.

The closed catalog is a teaching allowlist, not the provider's exhaustive model list. It combines installed model types, [official effort documentation](https://platform.claude.com/docs/en/build-with-claude/effort), [Managed sessions](https://platform.claude.com/docs/en/managed-agents/sessions) and [session creation reference](https://platform.claude.com/docs/en/api/typescript/beta/sessions/create), checked 2026-10-14. Sonnet 4.6 rejects xhigh in this catalog. Account readiness is an explicit operator declaration, not an API-discovered entitlement.

## Troubleshooting

For unavailable live setup, configure base resources and add selected model IDs to `CLAUDE_MANAGED_LAB14_MODELS`, then restart and check again. Never paste API keys into a user prompt or the browser. Incompatible model/effort values and extra fields are rejected before sending. Thinking budgets, fallbackModel and supportedModels are Agent SDK fields and are unsupported here.

Unknown creation or cleanup reserves the experiment's capacity. Close and reconcile retries known idle-session archival. A creation failure with no returned session ID requires manual Console investigation; do not automatically resend. Reusing a completed configuration is rejected; prepare a new configuration. Prepared local experiments expire after 15 minutes; uncertain work does not expire automatically.

## Limitations

No paid model tests, resource provisioning, automatic entitlement checks, pricing assumptions or private reasoning inspection run during setup or fixtures. Provider capability and account access can differ from the dated catalog. Budgets stop new model requests between requests and should not be interpreted as exact billed-cost measurements. Each request has a finite local deadline; cleanup is separately bounded. Two experiment slots by default, one per owner, prevent unbounded concurrency.

## Challenge

Change supported effort while holding prompt and model fixed. Explain which observations came from authored fixtures, resolved provider metadata, public responses and usage spans. Simulate an unavailable primary with fallback enabled; then switch to uncertain and explain why the second model must not start.
