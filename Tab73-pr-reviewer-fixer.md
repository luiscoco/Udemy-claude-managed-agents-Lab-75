# Lab 73: An autonomous PR reviewer and fixer

## Prerequisites

Install Git and Node 24. This offline exercise creates a real disposable fixture repository beneath `prbot-lab/runs/<uuid>`. It never pushes that repository. PR prose is untrusted, including the authored instruction to delete CI or change the package version.

## Controls

Run PR review and fix creates main and feature branches, a numbered diff, a reviewer report and a constrained fix attempt. Choose good-fix, out-of-scope, skipped-tests, unresolved, malformed-review or timeout. Cancel local work aborts an active test process; no remote session exists. Session review/fix routes also permit inspecting the stages separately. Two local fix rounds are the maximum; there is no unlimited agent loop.

## Evidence to inspect

Findings contain file, line, severity, confidence, message and question. Only high-confidence, medium-or-higher non-question findings on actual changed lines reach the fixer. Other findings go to a person. Reviewer tools are read-only; the fixed write handler can change only the assigned source. Host gates independently inspect tracked and untracked paths, protected edits, bounded diff, skip/only/todo test gaming and real Node tests. A local fix commit occurs only after the gates pass, then the full suite runs again. Compare the recorded hashes with `git -C prbot-lab/runs/<id> log --oneline --all` in PowerShell. Main remains unchanged.

## Troubleshooting

Git must be available on PATH. Host Git and test processes use argument arrays, fixed checkout paths, bounded output/deadlines and an environment without provider keys. A missing Git executable or interrupted process fails closed. Failed fixture state is retained. Use the patch and handoff details to inspect it. A twelve-session process limit bounds retained fixtures; restart the server to reset the teaching store.

## Limitations

Roles are scripted fixtures using the same closed host handlers; this is not an observed Claude review. No live adapter is configured. Out-of-scope and test-gaming scenarios deliberately mutate the local fixture behind the normal tool boundary to test independent gates. No remote GitHub write is performed. Handoff commands are reviewable suggestions and require a person to select a remote. Local owner headers are not production authentication. Git worktrees and scrubbed environments do not provide OS containment against arbitrary code; use a sandbox for untrusted real repositories.

## Challenge

Submit a question on a changed line and a high-confidence finding on an unchanged line. Explain why neither can authorize a fix. Compare a green skipped test suite with host rejection.

## Run locally

Run `npm run dev` and open lesson 73. Run `npm run test:prbot`, typecheck, build, guide checks and the focused browser demonstration. Real local Git commits occur only inside the disposable fixture.
