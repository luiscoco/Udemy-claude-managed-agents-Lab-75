# Course validation: 16-17 October 2026

The runtime contains exactly 75 implemented numbered lessons and no Lab 00. Each has an exercise component, mounted router, objective, steps, inspect references, challenge, authored guide and actual teaching sources. The automated coverage check inspects registered operations without sending exercise POSTs. Native Managed operations and local host replacements remain distinguished in the guides.

## Executed offline checks

| Check | Actual result |
| --- | --- |
| TypeScript typecheck | Passed on the completed platform |
| Production build and Lab 69 extension build | Passed; existing Vite dynamic-import warnings remain |
| Full offline suite | 475 passed, zero failed, in 282 seconds |
| Added course coverage and live adapter fixture checks | Five passed separately after their addition |
| Lab 75 team and live-boundary suite | Eleven passed, including all seven real Git/Node scenarios, no-op rework and Unicode acceptance regressions |
| Lab 09/10 lifecycle and cleanup regression suites | Twenty-one passed after the live follow-up fixes |
| Guide/objective/source audit | Passed for every ID 1 through 75 |
| Guide/raw-catalog suite | Four passed; host-only acceptance implementation excluded |
| Development watcher check | One passed |
| SSE transport suite | Seventeen passed |
| All-lessons browser suite | 146 passed; the Lab 75 case was interrupted by a guide/source HMR update during ongoing edits |
| Affected Lab 10, Lab 75 and shell rerun after edits stopped | Thirteen passed |
| Final Lab 75 and shell browser rerun | Ten passed after the Unicode change |
| Final Lab 69/70 browser rerun | Two passed after the Python live fixes |
| Lab 69/70 focused checks | Nine passed; five Python checks passed again after the shutdown fix |
| Host-only acceptance browser boundary | Direct development-server access rejected; focused two-test Lab 75 suite passed |
| Read-only live-action fixtures | Five passed; no model backend involved |
| Phone/desktop demonstrations | Lab 72, 73, 74 and 75 passed at 390 and 1440 pixels without page overflow |
| Explicit allowlist course package | Rebuilt: 882 authored files, 75 guides and a SHA256 manifest; credentials excluded |
| Final distribution scan | Passed across 2,307 authored/build/package files; .env contents never read |

The full suite predates the added coverage/live-boundary tests and the Lab 09/10 cleanup regressions. Those additions and affected implementation changes were verified by the focused runs above. Test counts are not added together as if repeated tests were distinct coverage. Browser tests exercise navigation, search, history, guides, source links/copy, retained exercise state, cancellation, keyboard controls, themes and narrow layouts. Unsupported optional live features have no pretend success controls.

Lab 72's two generated DOCX samples were opened read-only in installed Microsoft Word, exported to PDF and visually inspected as page images. Both are one page with readable native styles, intact tables/footer and correct numbered-list restarts. The packaged renderer could not start because pdf2image is unavailable; LibreOffice is also absent. Word supplied the actual rendering evidence. This does not attest every arbitrary generated document's pagination.

## Actual provider verification and live tests

After explicit user authorization, the configured shared agent and environment were verified against Anthropic. Real live completion, cancellation after send and local deadline tests ran through the Managed API with ten-cent session budgets. Completion returned the expected marker. Cancellation and deadline tests confirmed remote interruption and archived their sessions.

Lab 10's first live attempt did not continue successfully. Read-only reconciliation confirmed a valid first report and an archived session; that attempt was not counted as a pass. A fresh retest verified two schema-valid reports in one retained session and explicit close. The host now allows bounded idle-status confirmation after an end_turn event before deciding that completed work needs interruption. A deterministic delayed-idle regression and another real two-turn retest passed after the change. The Lab 09 override port also now attempts archive before rejecting an unexpected resolved session, because the shared runner has not received that created ID yet; both successful and pending-cleanup branches have deterministic regression coverage.

Six test sessions were created in total, each with a ten-cent cap. A separate read-only final audit confirmed all six were archived. The provider then reported six USD cents in aggregate cumulative list costs. Those reported costs are not a complete final invoice or a guarantee about later adjustments. Raw session identifiers and detailed live evidence remain only in ignored local artifacts.

After the user explicitly supplied and authorized a key for Lab 75, it was configured under LAB75_ANTHROPIC_API_KEY in ignored local settings. Three dedicated planner/developer/reviewer agents were provisioned and their immutable versions and exact tool inventories verified. They have no MCP servers, skills or multiagent capability. Keys and resource pins remain outside the published source.

The first actual team run stopped as a draft. It exposed an incomplete public issue contract, missing reviewer feedback on rework and an empty-fix commit path. The issue now names every required module/export and behavior; plans must cover those modules, rework receives its routed findings, new work since the last commit is required, and protected-path checks honor validated owned test filenames. Focused regressions cover these changes.

A fresh actual provider run reached Ready: three tasks merged, full integration and protected-file checks passed, and all four independent acceptance probes passed. Its reviewer raised a low-confidence Unicode ordering question, addressed in the subsequent follow-up below. Five sessions were confirmed archived and the provider reported 42 USD cents. The earlier draft's seven sessions were also archived and reported 55 cents: twelve archived sessions and 97 reported cents across the two Lab 75 runs. The first run used a 300-cent reference cap and the retest 200 cents; individual sessions were capped at 30 cents. Reported list costs are not a final invoice. Fixture branches were never pushed. Detailed evidence remains in ignored artifacts.

On 17 October, the issue and task contract were clarified to require numeric Unicode codepoint comparison, including prefix ordering. The scripted implementation now follows that rule. The existing count/tie acceptance probe also checks BMP versus astral characters and prefixes. A regression proves that otherwise visible-green UTF-16 ordering is rejected. A third actual live team run passed every gate and all strengthened probes, with no reviewer questions. Its five sessions were archived and reported 46 cents. A final read-only audit confirmed all seventeen Lab 75 test sessions archived, with 143 reported USD cents across all three attempts.

Lab 69's actual backend produced a schema-validated patch, preserved the original document until host apply, and applied the patch once. Its snapshot now retains the remote session ID so cleanup can be audited. The later real-editor test is recorded below.

Lab 70's pinned requirements were deliberately installed in workspace-local .venv. Actual testing exposed and fixed a numeric budget wire value (now an integer decimal string) and a buffered-stdin daemon reader that failed at interpreter shutdown (now bounded descriptor reads). The shutdown regression passes with stdin still open. The fresh live run confirmed two turns in one retained session, explicit close, and a correlated custom-tool call in a separate one-shot session, all with clean worker exits. The sessions from earlier diagnostic attempts were reconciled too: five total Lab 69/70 sessions were archived, with three reported cents. The successful smoke run is reproducible with `node --env-file-if-exists=.env --import tsx scripts/live-host-integrations-smoke.ts --execute-authorized-live-tests`. Evidence stays in ignored artifacts.

`team:ready` remains local-only; startup does not provision or run a model. The explicit live smoke command is documented in the Lab 75 guide. The current key was retained unchanged at the user's explicit request. The optional secure local helper is available for future changes.

## Manual or infrastructure checks still pending

The remaining integration limits were checked against the implemented routes and local configuration:

| Integration | Remaining requirement or boundary |
| --- | --- |
| Lab 44 remote provider telemetry | A remote redacted fixture-span exporter is implemented, with owner checks, HTTPS-only configuration, content filtering, authored-data labeling and response bounds. Azure Monitor is deployed and accepted the actual five-span test; genuine provider traces remain distinct. |
| Lab 45 alternate clouds | Official AWS SDK 0.8.0 and a read-only agent/environment preflight are implemented and locally verified. Actual AWS access needs its separate issued key, workspace/region and existing resource IDs. Model-session routes remain disabled; other Messages providers do not establish Managed support. |
| Lab 64 browser MCP | The lesson uses actual local Playwright MCP; cloud access to host localhost is not supported. |
| Lab 65 Slack/Teams/email | Email passed delegated Microsoft sign-in, actual Graph acceptance, user-confirmed inbox delivery, reviewer approval and duplicate-click rejection with exactly one fictional effect. Slack and Teams remain unconfigured and untested live. |
| Lab 69 actual editor | Passed with installed VS Code 1.142.0: actual webview, guided patch application and concurrent-edit conflict guard, using an isolated fixture profile and zero provider calls. |
| Other infrastructure-dependent scenarios | Account-specific resources, vaults and deployment destinations remain prerequisites; the current validation does not claim every optional live scenario ran. |

No payment/refund, arbitrary remote PR publication, cloud deployment or skill upload occurred in this validation. Offline fixtures cannot prove remote account availability or cleanup of sessions they never created.

## Distribution and checkpoints

The course package uses explicit source directories/extensions and root-file allowlists, rejects source symlinks and secret patterns, and includes a SHA256 file manifest. It excludes credentials, local resource-ID manifests, dependency/build trees, runtime repositories, journals, stores, logs, artifacts and profiles. It does not delete the learner workspace. The distribution scanner rejects tracked artifact paths before reading them, then checks authored files, npm package contents and the completed build before publication.

Independent private repositories are listed in the repository index. Historical checkpoints are retained as created; this audit does not invent 75 historical commits or claim that every prompt generates byte-identical source. Observable behavior, gates and recorded evidence are the validation basis.

## Follow-up: real editor and actionable integration setup

Installed VS Code 1.142.0 was driven through Playwright Electron using a copied fictional workspace, a fresh profile and a local offline backend. The actual command opened its webview, a guided patch changed the editor buffer and a later patch was refused after a concurrent local edit. Screenshots were inspected and JSON evidence remains in ignored artifacts. The explicit test command is npm run test:editor:real. User documents and the normal editor profile were untouched.

Notification readiness now exposes setting names only, validates HTTPS hosts and email fields, and never sends on inspection. Send controls require configured channels and pending proposals. npm run integrations:ready writes a redacted local report for cloud capabilities, notifications and telemetry. The current key stays unchanged. Real cloud, notification and remote-collector tests still require the user-selected account/resource, recipient/destination and local credentials; no external account or destination was inferred.

Remote telemetry export and the AWS preflight have now been implemented; only external configuration and actual account/destination verification remain for those paths. Seventeen affected telemetry/provider/notification checks and typecheck passed. AWS wire checks used injected SDK transport and did not contact an account. The 65/69 browser run attempted during dependency/source edits timed out while loading; a stable rerun follows after edits stop.

## Azure selection and approval boundary

The user selected Azure. A read-only CLI check found an enabled active subscription and no relevant application, monitoring or communication resources. A dedicated West Europe monitoring ARM template and explicit provisioning script are prepared. Automatic approval review rejected the provisioning command because choosing Azure did not explicitly authorize resource creation or costs. That initial rejection was resolved by subsequent explicit user approval; the completed North Europe deployment and actual ingestion evidence are recorded below.

The Azure Monitor exporter and real OTel pipeline are implemented and pass a redacted success/rejection test. Exporter 1.0.0-beta.46 replaces the older default beta tag to address dependency advisories; the installation audit reported zero vulnerabilities. In total, eighteen affected telemetry/provider/notification tests and typecheck passed. The previous stable five-test browser rerun passed before the added Azure control; the final affected checks are recorded after source edits stop. The real editor apply/conflict test passed in installed VS Code. The Anthropic key is unchanged.

## Approved Azure deployment and actual ingestion

The user explicitly approved monitoring provisioning and subsequently approved North Europe after Azure rejected new customers in West Europe. The tagged resource group was created during the first attempt; the monitoring resources were then successfully deployed in North Europe. Log Analytics uses 30-day retention and a 1 GB daily ingestion quota, which is not a monetary spending cap. Application Insights is linked to that workspace. Connection information is stored only in ignored .env; the Anthropic key was preserved. No application hosting, model deployment or external notification was provisioned.

An actual Azure exporter smoke test returned collector acceptance for five redacted authored host spans. A later Application Insights query confirmed exactly five matching spans by their original source trace ID. A separate diagnostic batch returned HTTP 200 with all six submitted envelopes accepted (five spans plus a resource metric) and no errors. It made zero Anthropic calls. This establishes actual Azure transport acceptance and query visibility, distinct from provider model traces or final billing. The final affected browser rerun passed all five checks after the runner began warming Vite static imports before timed tests. Eighteen focused checks, typecheck, production build and the real editor apply/conflict test passed.

The independent Lab 44, 45, 65 and 69 update branches passed their focused checks and were published. Final source/dependency/settings updates are included in the Lab 75 platform checkpoint.

## Lab 65 live email and reviewer validation (18 October 2026)

A dedicated personal-account public client requested delegated Mail.Send only. The user completed Microsoft sign-in and consent; the short-lived access token remains only in ignored server settings, with no persisted refresh token. The initial authorized smoke email was accepted by Graph with zero business effects, and the user supplied an inbox screenshot confirming delivery.

The user then tested the application workflow: a new fictional CASE-2042 proposal received email-provider acceptance, its notification reached the inbox, and local reviewer approval produced exactly one effect. A duplicate approval was rejected while the proposal remained approved and the effect ledger stayed at one. These application and inbox results are user-supplied evidence; automated tests separately cover the same decision and idempotency guards with injected transport. No additional email was sent while clarifying the UI.

The UI now separates configuration readiness, notification-provider acceptance and inbox confirmation. Its zero-call label explicitly counts model-provider calls, not notification requests. Repeated decisions identify the already-decided state and report that no additional effect ran. Slack and Teams are optional and remain unconfigured; this result does not claim their live validation.

## Learning Guide adaptation (18 October 2026)

All 75 Managed Agents labs now have shared written explanations and a seven-section guided tour adapted from the requested Agent SDK reference project. The tour changes views, opens explanations and draws a red rectangle; it does not submit exercise actions. It includes transcripts, pause/replay/speed controls, manual navigation, action pauses, mobile minimization and a per-lab browser self-assessment checklist.

Inworld synthesis uses only authored catalog text and a server-only credential behind explicit opt-in and Play. Local readiness and starting a tour make no synthesis request. Requests have origin/header and closed-schema checks, bounded concurrency and rate, a fixed provider endpoint, timeout, response bounds and a bounded audio cache. Automated tests verify all 525 section texts fit the synchronous API limit, plus credential redaction, cache reuse and failure fallback. Course coverage and guide-resource catalog tests passed. Browser checks cover highlight navigation, transcript fallback, local checklist persistence and the existing Lab 65 decision flow. Live Inworld synthesis remains a separate explicitly authorized check; implementation and stub transport checks do not establish provider voice availability or listening quality.

The user subsequently authorized reuse of the reference project's local Inworld key and one short billed narration test. Credentials and narration opt-in were configured only in ignored server settings, preserving unrelated settings. One actual Inworld request successfully synthesized the Lab 65 objective using Yash and inworld-tts-2, returning a 259,584-byte MP3 with a verified header. Audio and redacted request evidence remain in ignored artifacts. This confirms the configured voice and synthesis path work; pronunciation and subjective listening quality remain a learner check. No lesson agent ran and no email was sent during the voice test.

The follow-up adds saved tour positions with explicit resumption, direct section selection and a second red outline for visible exercise inputs, control groups, evidence and source blocks. Target discovery observes dynamically loaded content and never activates controls. Missing result panels remain explicitly distinct from completed exercise evidence. Six browser checks passed, including an opt-in actual Chrome playback test reusing the existing authorized MP3 with zero provider requests: Play, Pause, Replay, 1.25x speed and stopping audio on section change all passed. Resuming a saved tour did not submit an exercise or narration request.

## Browser-local course progress

Home now reads the existing per-lesson checklists and saved tour sections to show self-assessed completion, in-progress lessons and topic totals. Continue learning recommends an unfinished lesson without starting a tour or audio. Visiting a page never establishes a successful run. Current-tab change events and cross-tab storage events refresh the overview; invalid values and unavailable storage degrade safely. Only known progress keys are read. Automated checks cover corrupt data, unknown IDs, completion counts, recommendation order, denied storage and the zero-request continuation boundary.

Eight focused progress/narration tests and fourteen browser checks passed, including the shared navigation shell at 320, 390 and 1280 pixels, keyboard focus behavior, checklist updates and returning to a saved tour without POST requests. Typecheck, production build and distribution scan passed; the course ZIP was refreshed without credentials or generated recordings.

## Personal learning notebook and portable backups

Each lesson now has a plain-text notebook with explicit save and a review bookmark. Home lists bookmarked lessons and notes indicators. A download contains only known learning fields; it does not inspect unrelated browser settings or server credentials. Restore validates a bounded, closed versioned schema, displays a preview, requires an explicit apply action and updates only included lessons. Cancel and invalid files write nothing. A storage-error check verifies rollback of values changed before a failed write; rollback refusal is reported rather than hidden. These controls do not submit provider requests or certify exercise success.

Nine focused backup/progress checks passed, including round-trip restoration, strict schema rejection, unrelated-key exclusion, partial updates and storage failure/rollback reporting. Eight browser checks passed for the notebook, backups, existing guided tours and progress overview; the backup preview also received a mobile layout check. Typecheck and the production build passed. Generated recordings and local credentials remain excluded from the course distribution.

## Authored lesson knowledge checks

All 75 labs now include a concept question adapted from their implemented learning objective, with three choices, an answer explanation, explicit local grading and retries. Questions address Managed Agents boundaries rather than copying Agent SDK assumptions. The current authored catalog is versioned; saved choices are validated and regraded, and malformed, stale or forged success objects are ignored. A correct answer never completes a learning checklist or establishes that an exercise ran.

Home reports attempted and correct knowledge checks separately. Backup version 2 carries validated choices; version 1 imports remain supported and preserve existing knowledge results. Twelve focused question/progress/backup checks passed, covering all 75 question definitions, invalid attempts, independent checklist counts and old/new backup compatibility. No provider request is needed for grading or restoration.

Ten browser checks passed for explained feedback, retries, saved results, source navigation, mobile layout, storage refusal, existing guided tours and both backup generations. Typecheck, production build and distribution scan passed. Practice grading did not submit a provider request, mark a checklist complete or execute a lesson effect.

## Suggested learning paths and review queue

Four optional paths adapt the requested reference platform's role-oriented progression to Managed Agents. The complete-course path contains all 75 labs; every path filters its suggestions to registered lessons. Existing checklists drive path progress, and path navigation never locks an out-of-path lesson. Selected path is a local UI preference, separate from portable learning records. The review queue deduplicates bookmarks and incorrect knowledge answers, prioritizes incorrect answers and removes only the knowledge-review reason after a correct retry. These features neither submit provider work nor establish verified exercise completion.

Seven focused path/progress checks and fourteen browser checks passed. Browser evidence covers saved selection, path navigation, correct-retry queue updates, retained bookmarks, mobile layout, clearing a path and the existing shell's routes, keyboard focus, health checks and responsive widths. Typecheck, production build and distribution scan passed. Path selection, continuation and review navigation made zero exercise or narration POST requests.
