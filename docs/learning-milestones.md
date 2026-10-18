# Offline milestone projects

On **Home**, select **Milestone projects** near the top of Course progress. Three projects help you apply the learning paths without a provider request:

| Project | Suggested path | Preparation | Practice |
| --- | --- | --- | --- |
| Event stream evidence viewer | Managed Agents foundations | Labs 01, 06, 15 | Separate answer text, session identity and terminal outcomes; deduplicate event IDs. |
| Local streaming tutor endpoint | Application builder | Labs 01, 12, 28, 51 | Validate a closed prompt request, bound input and emit parseable deterministic SSE frames. |
| Fictional approval and effect ledger | Reliable orchestration | Labs 05, 31, 60, 65 | Separate immutable proposals, notification, trusted fixture review and idempotent effects. |

All three projects remain available regardless of path selection. The Complete course path highlights all three. Preparation links point only to registered lessons; they do not lock access.

## Working on a project

1. Open its requirements and hints, then download the starter ZIP.
2. Extract it into a separate study folder. Open the project subfolder containing `starter.ts` and `starter.test.mjs` in a terminal.
3. Use Node 24 or newer. No dependency installation, provider credential or internet connection is required. The HTTP project uses local loopback only.
4. Run `node --test starter.test.mjs` (or `npm test`). **Initial failure is intentional** because starter functions throw Not implemented.
5. Implement the TODOs in `starter.ts`, rerun the tests and explain the evidence and limits in your lesson notebook.

Each ZIP contains only `README.md`, `package.json`, `starter.ts` and `starter.test.mjs` inside the project folder. The platform never uploads, imports or executes your edited files. It does not automatically mark the milestone or a learning checklist complete. Supplied tests demonstrate the stated teaching cases; a green result is not a production security certification or proof of live Managed execution.

## Teaching boundaries

The viewer's frames are a small authored host contract, not raw provider events. The HTTP answer is a deterministic string, not a model response. The approval project uses a fixed reviewer string and an in-memory ledger: neither is enterprise authentication or durable production storage. No real case archive, payment, email, cloud deployment or model call occurs.

## How it was built, step by step

1. Adapted the reference platform's milestone idea to the implemented Managed Agents boundaries and paths.
2. Authored a shared three-project manifest with requirements, hints and preparation links.
3. Created isolated Node 24 starter folders and tests with no third-party dependencies.
4. Added separate instructor reference implementations under `fixtures/learning-milestones`. They are in the source repository for inspection but excluded from starter downloads.
5. Added a fixed allowlist download route under `/api/learning-milestones/:id/starter.zip`. It checks the project ID, resolved directory, regular file types and file sizes. It never accepts arbitrary file paths or code to execute.
6. Reused the existing deterministic ZIP writer and verified downloaded members against authored starter files.
7. Added `npm run milestones:check` to run the authored starters and reference copies in disposable ignored folders with a minimal child environment. Starter failures are expected; reference failures are not. It does not run learner-edited code or forward provider credentials to child processes.
8. Added browser checks for the Home shortcut, requirements, actual download filename/ZIP bytes, mobile layout and the absence of exercise POST requests.

The validation command writes redacted results under ignored `artifacts/learning-guide/milestone-checks`. Its successful reference tests establish that the authored exercises are solvable within their test contracts, not that a student's separate implementation passed.
