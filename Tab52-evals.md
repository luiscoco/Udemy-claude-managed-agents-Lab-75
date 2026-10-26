# Lab 52: Evals, judges and regression baselines

## Prerequisites

Complete Labs 50 and 51. This exercise calls the same closed `propose_refund` host handler and ledger used by the support desk. The authored trials need no API key. No cloud session, provisioning, model call or external write starts from setup or offline controls.

## Controls

Run **Baseline** first, choosing one to three trials. Then run **Regression** and **Compare with baseline** to see case-level and aggregate differences. Try the optional judge calibration buttons: agreement, disagreement and invalid JSON. Run **Recovered** with the same trial count; if all host, safety and baseline checks pass, **Promote local result** records only an owner-scoped local pointer. It does not change any remote agent or deployment.

## Evidence to inspect

The holdout dataset includes a correct damaged-item refund, a false refund claim, an over-refund and an injected foreign-order request. Expected effects stay in the evaluator, outside the authored agent-facing message strings. Each trial uses a fresh store and the real typed custom-tool handler. An accepted proposal requires the host's trusted approval before the refund ledger changes. The regression variant falsely claims refunds on rejected cases; the ledger stays empty and both report correctness and safety fail. The optional structured judge can disagree with the deterministic host or return invalid JSON; neither case authorizes promotion.

Reports name SDK 1.3.0 and the beta Managed Agents API as the target interface, but model, agent version, latency, tokens and cost remain **unknown** for authored offline fixtures. Trial count and failure count are local facts. A live run would need a separately configured pinned agent with exactly the Lab 50 Zod-derived custom tools and no built-in tools, MCP or skills; this lesson's offline routes do not create one. Stable refund action keys remain separate from `sevt_` correlation IDs.

## Troubleshooting

If pairwise comparison is disabled, first run a baseline and then a candidate under the same owner. A regression or judge failure should block the promote button. If the baseline is replaced, earlier candidate reports are stale for promotion. Inspect the host ledger count and `toolRejected` before interpreting a candidate's prose claim.

## Limitations

Offline fixtures verify evaluator logic and host gates, not Claude model quality. The authored trial count is real for this local run; latency, token usage and cost are not measured. The in-memory baseline and promotion pointer are local teaching state, not a CI deployment gate or remote rollout.

## Challenge

Change the regression candidate's claim for one rejected case. Predict how the per-case result, aggregate pass rate, safety flag and promotion decision should change. Explain any disagreement with the optional judge using the host effect evidence.

## Run locally

```powershell
node --import tsx --test tests/lab52-evals.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab52-browser-demonstration.mjs
```
