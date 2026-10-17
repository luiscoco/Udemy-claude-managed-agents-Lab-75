# Lab 75: Capstone 2 an autonomous engineering team

## Prerequisites

Install Git and Node 24. The offline team uses real Git worktrees and actual Node processes under `team-lab/runs/<uuid>`. No instructor repository is needed. Revisit Labs 10, 15, 51, 52, 56, 57, 60, 73 and 74 for report validation, costs, tests, teams, worktrees, journals and enforcement. The issue's hidden HTML comment is untrusted data and cannot authorize CI deletion or a package change.

## Controls

Validate plan only tests good/sequential, protected deletion, duplicate owner, dependency cycle, existing test overwrite and malformed presets without creating workers or contacting a provider. Run engineering team selects one of seven offline scenarios: happy rework, corrected injected plan, corrected foreign-owner request, test gaming, hidden boundary failure, budget exhaustion and interruption after wave one. Resume interrupted team replays durable evidence and skips already merged tasks. Cancel team aborts local waits and active role calls; remote cleanup is separately journaled.

## Evidence to inspect

The good plan has T1 tags followed by T2 search and T3 report concurrently. All tasks have one source owner and a new test file. The host validates a closed plan, rejects cycles with their path, and permits one corrective planner round. Tags are trimmed/lowercased, nonempty strings, at most twenty characters after trimming, with ordered deduplication. Search returns original matching notes. Counts count a normalized tag once per note and sort by descending count then ascending Unicode codepoint tag, comparing numeric code points with shorter prefixes first.

Workers use checked custom tools only. Planner and reviewer tools are read-only. A developer can write only its owned files and new test. Paths reject traversal, protected data and links; directory reads suggest glob_files. The board binds sender identity to the role/task, allows only known recipients, six messages per sender and 600 characters, and deduplicates stable envelope IDs. Peer text remains untrusted. There is no shell/Git tool.

For each dependency wave the host creates worker branches from the current integration SHA. It awaits settled developer results before integration, checks actual scope, nonempty changes, at most 200 changed lines, at least two new tests and no skip/only/todo, then runs the full fixture suite with a scrubbed environment. Verified work receives a local team-dev author and Task/Refs/Plan-hash trailers. Host merges are serialized and use --no-ff. Main remains unchanged. The host reruns integration tests and performs one bounded changed-line review/rework round. Worker claims cannot satisfy these gates.

Four acceptance probes execute outside the agent-visible checkout in separate Node processes. The UI exposes only labels/outcomes. A green visible suite can still fail the twenty-character boundary or stable tie-order checks. Ready requires all merged tasks, protected files intact, passing full integration and acceptance suites, valid review without open high findings and known costs within budget. Every stop produces a draft handoff with concrete unmet checks and reviewable commands; no branch is pushed automatically.

## Troubleshooting

Git/Node helpers use fixed argument arrays, no shell, bounded output and deadlines. The journal is append-only, sequence-numbered and hash-chained with flushed writes. Resume verifies its chain, recorded Git heads, ownership and expiry; corrupt/inconsistent state is rejected. Uncertain role calls are escalated rather than blindly resent. Completed work and costs remain durable. A local interrupted fixture can resume after server restart with its original owner identity. An uncertain live role requires manual provider/effect reconciliation; automatic replay never increases its budget.

The team limits parallel workers to three, role calls to twelve, a total deadline of fifteen minutes, retained in-memory runs to eight and access expiry to twenty-four hours. An individual test process has five seconds. Fixture costs are explicitly assumed at one cent per role call; live cumulative list cost remains null if unavailable. Concurrent sessions can overshoot a reference cap through work already in flight.

## Limitations

The offline team is scripted but writes real files and passes the same host tools and orchestrator gates. Git worktrees share objects; they are not an OS security boundary. Use a sandbox for arbitrary third-party code. Local owner headers and browser session identity are teaching isolation rather than production authentication. Retained fixture repositories remain local for inspection; expired run access fails closed. Run `npm run team:cleanup` deliberately to remove only expired inactive UUID fixtures with valid journals and no links. Active, corrupt or uncertain state is retained. Cleanup never follows a junction or touches a caller-selected path.

Optional live mode requires MANAGED_LIVE_ENABLED, the isolated server-side LAB75_ANTHROPIC_API_KEY, an existing environment, and separately versioned planner/developer/reviewer agent IDs and positive versions from `.env.example`. The exact required closed inventories are returned by facts and authored in `server/team/live.ts`. Use `npm run team:ready` for local diagnostics. Provision those role agents deliberately with `npm run team:provision` after configuring the isolated key and reviewing the model; startup and readiness never provision. Immutable returned pins are written only to ignored managed/lab75-resources.local.json. No shared key, personal login, built-in tools, unused MCP/skills, vaults or mounted repositories are inherited. Each session is checked against its pinned inventory before sending a prompt. Supported models/effort come from the pinned agent versions.

The adapter reuses the shared stream-before-send runner, validates sevt_ custom calls and reports in host code, records session/event/effect mappings, limits host answers, and budgets every session at thirty USD cents with a maximum total reference cap of three hundred cents. Calls are never automatically retried. Cancellation attempts interrupt, idle confirmation and archive through the shared runner. Cleanup uncertainty and unknown costs block readiness. These native schemas were checked against installed official SDK 0.133.0; live account behavior and billing are not established by offline tests. Cloud files never directly access Windows worktrees.

## Challenge

Compare hidden-boundary with happy-rework. Explain why review plus independent acceptance catches failures that worker-authored tests miss. Inspect crash-resume costs and show planner/T1 each appear only once.

## Run locally

Run `npm run dev` and open lesson 75. Run `npm run test:team`, typecheck, build, guide checks and the focused browser demonstration. For a retained fixture inspect `git -C team-lab/runs/<id>/int log --all --format=full`. Review journal and handoff before any manual publication.

To replace the isolated local key without echoing it, run `powershell -File scripts/set-lab75-key.ps1`, then restart the backend. Existing role pins stay in ignored local settings. After readiness, an explicitly billed command-line smoke run is `node --env-file-if-exists=.env --import tsx scripts/live-lab75-smoke.ts --execute-authorized-live-test --budget-cents=200`. It writes ignored evidence under artifacts/lab75 and independently checks archival of every created session. It does not publish fixture branches. See [actual live results](docs/course-validation.md), including the resolved Unicode ordering follow-up.
