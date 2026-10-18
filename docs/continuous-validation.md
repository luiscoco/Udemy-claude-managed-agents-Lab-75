# Continuous regression and live acceptance

**Course regression** runs on pushes to main, pull requests and manual dispatch without provider secrets. It installs Node 24, Chrome and the pinned Python worker dependency, then checks offline tests, dev-server supervision, milestone references, lesson guides, every browser test, the production build and distribution boundaries. A successful run uploads only the authored course ZIP for seven days.

**Bounded live acceptance** is manually dispatched from main. It requires the billing confirmation checkbox and uses the `live-tests` environment. It does not run on a push, pull request or schedule. Both workflows use read-only repository permissions, immutable action SHAs and disabled persisted checkout credentials. Live runs queue rather than cancel one another, allowing remote cleanup to finish.

## Configure live execution once

Create a GitHub environment named `live-tests` in repository Settings > Environments. Add required reviewers if desired and restrict its deployment branches to main. Automatic regression never transfers local credentials to GitHub.

Alternatively, use the explicit setup helper after signing in with the official GitHub CLI:

```powershell
gh auth login --hostname github.com --web
node --env-file-if-exists=.env --import tsx scripts/configure-github-live.mjs --check
node --env-file-if-exists=.env --import tsx scripts/configure-github-live.mjs --configure-live-environment
```

The check command is local and displays setting names only. The configure command sends the existing required keys and reviewed skill manifest to this repository's environment secrets through GitHub CLI stdin; values never enter command arguments or output. It requires repository administration access, creates a new environment restricted to main, and preserves existing reviewers, timers and branch rules. Existing secrets are not overwritten. Conflicting variables or an unrestricted existing environment stop setup before writes. Remote verification checks names and variables; a live workflow must still verify that preserved secret values work. Set `LEARNING_GH_EXECUTABLE` to an absolute CLI path if it is not on PATH.

| Setting | Kind | Required for |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Environment secret | course, learning, host, all |
| `CLAUDE_MANAGED_AGENT_ID` | Environment variable | course, learning, host, all |
| `CLAUDE_MANAGED_ENVIRONMENT_ID` | Environment variable | All selections |
| `LAB11_SKILL_PINS_JSON` | Environment secret | learning, all |
| `LAB75_ANTHROPIC_API_KEY` | Environment secret | team, all |
| `LAB75_PLANNER_AGENT_ID`, `LAB75_PLANNER_AGENT_VERSION` | Environment variables | team, all |
| `LAB75_DEVELOPER_AGENT_ID`, `LAB75_DEVELOPER_AGENT_VERSION` | Environment variables | team, all |
| `LAB75_REVIEWER_AGENT_ID`, `LAB75_REVIEWER_AGENT_VERSION` | Environment variables | team, all |

The skill manifest must match the reviewed existing `managed/lab11-skills.local.json`, including v1 and v2 bundle hashes and immutable provider versions. The runner validates its schema and bundle hashes, creates the ignored manifest only if absent, and removes only the file it created. Existing local pins are never overwritten. No skill upload or agent provisioning occurs. The shared base agent follows the existing latest-version policy when no local version pin is supplied; team roles require explicit versions.

## Run a live suite

Open Actions > Bounded live acceptance > Run workflow. Choose a suite and confirm billed execution.

| Suite | Actual coverage | Bounds |
| --- | --- | --- |
| course | Completion, cancellation, deadline and retained structured reports | At most four sessions; ten-cent session budgets |
| learning | Options with/without previews, custom instructions and three skill variants | At most six sessions; ten-cent session budgets |
| host | Editor backend fixture patch, Python retained turns, closure and custom tool | At most three sessions; ten-cent session budgets |
| team | Planner, developers, reviewer and independent acceptance | Thirty-cent session budgets; 300-cent reference aggregate guard; bounded role rounds |
| all | All four suites sequentially | Stops on failed process or acceptance; no automatic retry |

Budgets are checked between model requests. Aggregate guards and provider-reported list costs are not a prepaid guarantee or final invoice. Provider access, model availability and reviewed resource configuration remain prerequisites.

Local execution with existing server settings:

```powershell
node --env-file-if-exists=.env --import tsx scripts/run-live-audit.mjs --execute-authorized-live-tests --suite=all
```

The evaluator checks actual outcomes and remote archival instead of trusting exit code zero. It rejects missing scenarios, unconfirmed interruption, incorrect retained reports, unresolved reviews and failed acceptance. A failure stops later suites. Inspect ignored local logs and provider session state before a deliberate retry. Forced runner cancellation or job timeout can prevent cleanup confirmation and must not be interpreted as success; this workflow cannot guarantee cleanup after forced termination.

CI uploads only an authored status summary with suite names, pass/fail, session counts and optional reported team cost. Raw provider responses, session identities and diagnostic logs are not uploaded. Local evidence is under ignored `artifacts/ci/`; smoke-script evidence stays in its existing ignored folders. Hosted-runner private logs are ephemeral, so investigate remote sessions through the provider console after an unsuccessful run.

Slack, Teams, email delivery, AWS execution, Azure export and Inworld synthesis are outside these suites. They require their own configured integration checks. This automation does not send notifications, synthesize narration, deploy the application or create infrastructure.

Workflow events, inputs and permissions follow [GitHub workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax). Environment secrets and review controls follow [GitHub environment documentation](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

Failed team summaries include authored release-gate labels, task states, failed-check counts, unresolved-question counts and observed archival status. Unknown gate text is replaced with a generic label. Question text, reports, tool output and session identities are excluded. Missing completion evidence leaves cleanup unknown rather than claiming archival.

Both workflows pin checkout v7.0.1, setup-node v7.1.0, setup-python v7.0.0 and upload-artifact v7.0.2 to their verified upstream commit SHAs. Each pinned action declares the Node.js 24 runtime. This removes the Node.js 20 action-runtime deprecation warning from subsequent runs. The application continues using Node 24 and Python 3.13; billed execution still requires the existing explicit manual confirmation.

## Recorded validation overview

Home's Validation results section and its sidebar/mobile shortcut show an authored evidence snapshot, including tested commits, workflow run links and session archival observations. The Course progress overview also links to it. The browser makes no GitHub or provider request to display this snapshot and has no workflow-dispatch control.

The initial snapshot uses offline run 39134515055 (518 offline tests, 12 evaluator/setup tests, 320 browser passes and one optional cached-audio skip). Course, learning and host suites passed in run 39128999911, which is explicitly labeled an overall failure because the team stage failed later. The corrected team retest passed in run 39130740976. The records do not certify later commits or optional unconfigured live integrations. Current workflow links open GitHub in another tab and may require repository access.

Refresh shared/course-validation.ts only after inspecting actual run evidence and cleanup, retaining the tested commit and original overall outcome. Do not infer a suite result from a green process exit alone, learner checklist progress or an unrelated successful run. Keep raw provider payloads, session identities and credentials out of this authored snapshot.

Offline browser failures now upload only Playwright error-context Markdown generated by the isolated fixture tests, retained for seven days. This step runs only when the browser-check step fails. It does not upload traces, runtime folders or provider logs. Lab 14 has a bounded 60-second test budget because a cold Windows lesson-registry load was observed exceeding the previous 30 seconds; outcome assertions retain their normal deadlines and automatic retries remain disabled.
