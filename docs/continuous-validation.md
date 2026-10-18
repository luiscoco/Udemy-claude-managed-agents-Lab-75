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
