# Lab 47: Model driven and host driven orchestration

## Prerequisites

Complete the earlier session, delegation and validated-report labs. This exercise runs authored offline fixtures; it needs no Anthropic key and sends no provider request.

## Controls

Choose a native `orchestrator` or `hierarchy` view, or a host `pipeline`, `fanout` or `evaluator` view. Run regional sales, an incorrect total, a delayed worker or a dependency failure. The route is a teaching comparison; it does not provision agents.

## Evidence to inspect

The pinned SDK exposes `multiagent_20261001` and `session_thread_id`; account capability is unknown offline. Native workers share a parent session and budget while their thread IDs remain distinct. Host workers have independent session IDs and a separate aggregate ledger. Inspect raw worker text alongside schema-and-fixture-verified reports. The incorrect south total of 800 receives one corrective round to reach the fixture value 80. A delayed or blocked report cannot satisfy the handoff gate, even when parent prose says it did. Host dependency graphs can represent deeper workflows without implying native delegation depth beyond one.

## Troubleshooting

If the backend rejects a request, use the local application origin and refresh the page to obtain a new experiment owner. The route accepts only `scripted` mode and one named scenario. Check `GET /api/c47/facts` for the installed type capability and `GET /api/c47/code` for source locations.

## Limitations

All IDs, reports, usage and outcomes are authored fixtures, not provider observations. Role-specific tools and native account entitlement require a separately configured, explicitly opted-in live exercise. Per-worker illustrative counters in the native example must not be added to the parent session usage. The host aggregate applies only to independent-session examples.

## Challenge

Stop one worker and inspect how its dependent editor task is blocked. Explain why parent final text cannot override that gate.

## Run locally

```powershell
node --import tsx --test tests/lab47-multi-agent.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab47-browser-demonstration.mjs
```
