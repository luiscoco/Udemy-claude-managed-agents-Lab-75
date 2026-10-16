# Lab 57: Workers in host Git worktrees

## Prerequisites

Git and Node.js must be available locally. The app creates disposable repositories under ignored `artifacts/lab57/runs/`. The offline exercise makes no Anthropic request and does not need an API key. A single server instance admits at most eight fixture runs to bound retained worktree data.

## Controls

Choose serial integration, competing greeting edits, failed worker or cancelled worker, then select **Run local worktrees**. Each run creates a new base repository with `greeting.js` and `tax.js`, two worker branches and two worktrees. The host applies fixed edits through allowlisted local file operations, verifies changed and untracked paths, runs behavioral tests, commits passing worker edits, and cherry-picks commits serially.

## Evidence to inspect

The result reports the base SHA, each worker branch, changed and untracked paths, test result, commit state, integration state and timeline. Serial integration must pass combined greeting and tax tests. In the competing edit case, both edits target `greeting.js`; the second cherry-pick conflicts. The host aborts that cherry-pick and keeps both worker branch refs and report. A failed worker or cancelled worker never reaches integration. Worker claims are shown separately from host evidence.

## Troubleshooting

If the route reports a fixture failure, check local Git availability. If capacity is reached, restart the lesson server after reviewing the retained runs. A conflict means no combined result passed, even though each worker's isolated test did. Failed and cancelled workers keep their branch and worktree for inspection but have no verified commit to integrate.

## Limitations

The workers are authored offline actions, not Managed sessions. A live extension would need separate Managed worker sessions with bounded host read/write/edit/test custom tools, disabled remote built-in filesystem/bash, cancellation and deadlines. Cloud `/workspace` is separate from these Windows worktrees. Git worktrees are not OS or tenant isolation; worker tests receive no Anthropic API key. The fixture runs workers sequentially and caps them at two, so it does not measure parallel model execution.

## Challenge

Compare the competing edit report with serial integration. Explain which SHA and path evidence proves isolation, why the host aborts the conflict, and why a successful isolated worker test does not prove combined correctness.

## Run locally

```powershell
node --import tsx --test tests/lab57-parallel-worktrees.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab57-browser-demonstration.mjs
```
