# Course validation on 16 October 2026

The runtime contains exactly 75 implemented numbered lessons and no Lab 00. Each has an exercise component, mounted router, objective, steps, inspect references, challenge, authored guide and actual teaching sources. The automated coverage check inspects registered operations without sending exercise POSTs. Native Managed operations and local host replacements remain distinguished in the guides.

## Executed offline checks

| Check | Actual result |
| --- | --- |
| TypeScript typecheck | Passed on the completed platform |
| Production build and Lab 69 extension build | Passed; existing Vite dynamic-import warnings remain |
| Full offline suite | 475 passed, zero failed, in 282 seconds |
| Added course coverage and live adapter fixture checks | Five passed separately after their addition |
| Lab 75 team and live-boundary suite | Nine passed, including all seven real Git/Node scenarios |
| Lab 09/10 lifecycle and cleanup regression suites | Twenty-one passed after the live follow-up fixes |
| Guide/objective/source audit | Passed for every ID 1 through 75 |
| Guide/raw-catalog suite | Four passed; host-only acceptance implementation excluded |
| Development watcher check | One passed |
| SSE transport suite | Seventeen passed |
| All-lessons browser suite | 146 passed; the Lab 75 case was interrupted by a guide/source HMR update during ongoing edits |
| Affected Lab 10, Lab 75 and shell rerun after edits stopped | Thirteen passed |
| Host-only acceptance browser boundary | Direct development-server access rejected; focused two-test Lab 75 suite passed |
| Read-only live-action fixtures | Five passed; no model backend involved |
| Phone/desktop demonstrations | Lab 72, 73, 74 and 75 passed at 390 and 1440 pixels without page overflow |
| Explicit allowlist course package | Created and scanned locally; includes 75 guides and a SHA256 manifest |

The full suite predates the added coverage/live-boundary tests and the Lab 09/10 cleanup regressions. Those additions and affected implementation changes were verified by the focused runs above. Test counts are not added together as if repeated tests were distinct coverage. Browser tests exercise navigation, search, history, guides, source links/copy, retained exercise state, cancellation, keyboard controls, themes and narrow layouts. Unsupported optional live features have no pretend success controls.

Lab 72's two generated DOCX samples were opened read-only in installed Microsoft Word, exported to PDF and visually inspected as page images. Both are one page with readable native styles, intact tables/footer and correct numbered-list restarts. The packaged renderer could not start because pdf2image is unavailable; LibreOffice is also absent. Word supplied the actual rendering evidence. This does not attest every arbitrary generated document's pagination.

## Actual provider verification and live tests

After explicit user authorization, the configured shared agent and environment were verified against Anthropic. Real live completion, cancellation after send and local deadline tests ran through the Managed API with ten-cent session budgets. Completion returned the expected marker. Cancellation and deadline tests confirmed remote interruption and archived their sessions.

Lab 10's first live attempt did not continue successfully. Read-only reconciliation confirmed a valid first report and an archived session; that attempt was not counted as a pass. A fresh retest verified two schema-valid reports in one retained session and explicit close. The host now allows bounded idle-status confirmation after an end_turn event before deciding that completed work needs interruption. A deterministic delayed-idle regression and another real two-turn retest passed after the change. The Lab 09 override port also now attempts archive before rejecting an unexpected resolved session, because the shared runner has not received that created ID yet; both successful and pending-cleanup branches have deterministic regression coverage.

Six test sessions were created in total, each with a ten-cent cap. A separate read-only final audit confirmed all six were archived. The provider then reported six USD cents in aggregate cumulative list costs. Those reported costs are not a complete final invoice or a guarantee about later adjustments. Raw session identifiers and detailed live evidence remain only in ignored local artifacts.

Lab 75's actual live team remains blocked by missing LAB75_ANTHROPIC_API_KEY and the three separately pinned role agents/versions. The shared credential was not silently substituted. Its adapter was tested through injected provider-shaped events, including inventory mismatch, stream-before-send, report correlation, usage and cleanup; this is not an actual planner/developer/reviewer provider run. `team:ready` is local-only. `team:provision` is a separate deliberate setup command requiring that isolated key and a reviewed model; it was not executed.

## Manual or infrastructure checks still pending

Live scenarios that require additional lesson-specific agents, isolated keys, cloud resources, vaults, Python environment packages, telemetry collectors or notification transports remain conditional on their setup. No real Slack/Teams/email message, payment/refund, arbitrary remote PR publication, cloud deployment or skill upload was performed in this validation. Lab 69's extension was tested with a mocked VS Code host; interactive IDE installation remains manual. Python 70's isolated interpreter requires explicit dependency installation for live use. Offline fixtures cannot prove remote account availability or cleanup of sessions they never created.

## Distribution and checkpoints

The course package uses explicit source directories/extensions and root-file allowlists, rejects source symlinks and secret patterns, and includes a SHA256 file manifest. It excludes credentials, local resource-ID manifests, dependency/build trees, runtime repositories, journals, stores, logs, artifacts and profiles. It does not delete the learner workspace. The distribution scanner rejects tracked artifact paths before reading them, then checks authored files, npm package contents and the completed build before publication.

Independent private repositories are listed in the repository index. Historical checkpoints are retained as created; this audit does not invent 75 historical commits or claim that every prompt generates byte-identical source. Observable behavior, gates and recorded evidence are the validation basis.
