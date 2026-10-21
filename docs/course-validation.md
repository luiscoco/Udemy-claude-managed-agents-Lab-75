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

## Offline milestone projects

Three authored Node 24 projects apply the learning paths to event reduction, local SSE validation and a fictional approval/effect ledger. Each downloadable ZIP contains a README, package manifest, incomplete TypeScript starter and native Node tests, without dependency installation or provider credentials. The server exposes only allowlisted starter downloads, not learner code execution. Reference solutions remain separate from downloads.

The author validation command confirmed all three starters fail as expected and all three reference implementations pass. It ran only copied authored code in disposable ignored folders with a minimal environment. Download-route checks verified exact file contents, reference exclusion, unknown-path rejection and the absence of an execution endpoint. These results do not grade a learner's separately edited files or claim production readiness.

Thirteen browser checks passed for milestone downloads, mobile layout, paths, review queue and the existing shell. Course coverage and guide audits passed; the raw-resource catalog check timed out during parallel Vite work and passed on an isolated rerun. Typecheck, production build and distribution scan passed, and the course ZIP was refreshed. Browser navigation and milestone download made no exercise or narration POST requests.

## Learning shortcuts and updated prompts workbook

On 18 October 2026, persistent navigation links were added for Course progress and expanded backup controls. Each lesson now has a direct Open notebook button and a current-lesson notebook shortcut in desktop and mobile navigation. Destinations open containing disclosures, scroll below the fixed header and receive keyboard focus. Learning paths, checklists and personal records remain optional and do not gate lessons.

Fifteen browser checks passed for direct notebook access, saving a note, progress navigation, backup download, mobile menu closure, the existing backup and path behavior, and shell navigation at responsive widths. The two shortcut checks also passed after adding reduced-motion and mobile viewport assertions; the mobile backup screenshot was inspected. Fifteen focused unit checks passed, including course coverage, progress, backups, paths and milestone downloads. Typecheck, production build and the guide audit for all 75 lessons passed. No provider, narration or notification send was needed.

The canonical Word workbook and existing visual-style alias contain 103 matched copyable prompt blocks: all 97 existing blocks plus six learning-platform prompts. A structural check preserved the original paragraph text and numbered Lab 01 through Lab 75 headings. Both Word files are byte-identical. The bundled runtime has no LibreOffice; native Word page metafiles rendered all 117 pages after PDF export stalled. Page overviews and full-size supplement pages 111 through 117 were inspected for layout. Rendering artifacts remain ignored. The builder and Windows native rendering scripts are included for reproducibility.

## Worked experiments readable responses and milestone references

The next teaching increment adds baseline-and-comparison plans for all 75 lessons using their authored steps, source paths and concept explanations, with detailed examples for Labs 01, 12 and 65. Their evidence principles also appear in the shared narration transcript. These are teaching expectations, not observed results. Final agent prose in Labs 01–05, 09, 11, 13 and 14 now uses a limited Markdown presenter with safe links and inert raw HTML, plus an exact redacted message view mounted only when opened. Streaming previews, IDs, lifecycle events and terminal outcomes remain separate.

All three milestone cards now include an optional walkthrough, common mistakes, expected reference test count, extra experiment, notebook lesson link and separate reference download. Starter ZIPs retain their four unfinished files. Reference ZIPs contain a completed starter.ts identical to the authored reference, the unchanged supplied tests, package manifest, reference README and WALKTHROUGH.md. They execute only when a learner runs them locally; downloading does not grade work or change checklists.

The complete offline suite passed 516 tests with zero failures or skips. All three starter checks failed as intended and all three reference checks passed. Forty distinct browser checks passed across the initial run and focused rerun. The initial Lab 04 check detected duplicate text in the collapsed raw-message view; mounting raw content only after expansion fixed that issue, and all seven Lab 01/Lab 04 checks passed on rerun, including exact-message inspection. Browser checks covered reference downloads, mobile fit, keyboard navigation, source copying, previews, cancellation and affected lesson outcomes. Typecheck, production build and the guide audit across all 75 lessons passed. The mobile walkthrough screenshot was inspected.

The workbook and visual-style alias are identical and now contain 104 paired prompt blocks. Native Word rendered 118 pages, and the revised supplement pages 112–118 were visually inspected. Existing lab prompts remain preserved. No live synthesis, external notification or billed model test was required for this release.

## Full interface and bounded live audit (18 October 2026)

All 150 interface cases passed: 75 registered lessons at 1280 and 390 pixels, with Learn, detailed explanation, exercise controls and actual UI/server source views inspected. Checks covered missing visible control names, duplicate IDs, invalid lesson links, horizontal overflow and page errors. Navigation submitted no execution POST requests. This is interface coverage, not proof of successful live execution in every lesson.

Actual bounded Managed API runs verified Lab 01 completion, cancellation and deadline cleanup; Lab 10 two validated reports in one retained session followed by closure; Lab 02 previews enabled and disabled; Lab 09 custom system instructions; and all three configured Lab 11 skill variants. Six learning smoke cases completed and archived. Skill read evidence is recorded separately and does not attest exact bundle-content compliance.

The host integration rerun verified the Lab 69 backend-owned fixture patch and one host apply, Lab 70 two Python turns in one retained session followed by closure, and one correlated Python custom tool execution. All three sessions were archived. An initial attempt stopped after the editor backend case before Python readiness; its original generic error did not establish a root cause. A subsequent readiness probe and full rerun passed. Sanitized error messages are now retained for future diagnosis. This round did not repeat an interactive VS Code UI test.

A real Lab 75 reviewer identified a Unicode case-expansion ambiguity despite the original green gate. The clarified contract measures trimmed input length in UTF-16 code units before lowercasing. The authored reference now follows that order, independent acceptance covers expansion boundaries, and a regression proves the wrong order cannot pass the release gate. Twelve focused team tests passed. The corrected live run reached Ready with no reviewer questions, all three tasks merged, and all five sessions archived. Its immediate provider-reported list cost was 44 cents; this is not a final invoice.

An existing Azure Monitor collector accepted five authored host spans. These were fixture-host spans, not observed provider traces; Log Analytics visibility was not rechecked in this round. Notification preflight found an expired Graph email token, missing Slack and Teams URLs, and missing AWS/OTLP setup. No external notification was sent and no new cloud resource was provisioned. These optional live integrations remain unverified until their setup is completed.

The updated Word aliases are byte-identical with 105 paired prompt blocks, including the original 97. Native Word rendered 119 pages; the new audit prompt and supplement layout were inspected. Local raw run evidence and rendered pages remain ignored, and credentials stay server-side.

The full offline browser interaction run passed 117 of 121 cases initially. Four failures were stale or ambiguous selectors: Lab 02 inspected a collapsed exact-message view, Lab 24 matched a checklist control, Lab 52 matched a knowledge-check answer as well as its dropdown, and the new Lab 56 check overconstrained a dropdown label. Corrected selectors preserve the original behavioral assertions; all eight tests in the four affected lesson files passed on rerun. This accounts for all 121 interaction cases. Typecheck, production build, distribution scan and source ZIP packaging passed. Six learning sessions were also independently retrieved read-only and confirmed archived.

## Automated regression and manual live workflow (18 October 2026)

Added a secret-free push/PR regression workflow and a separate explicit billed workflow on main using the live-tests environment. The automatic job runs offline tests, developer-server supervision, milestone references, guides, the complete browser suite, build, distribution scanning and source packaging. Actions are pinned to verified commit SHAs, repository access is read-only, and checkout credentials are not persisted. Workflow syntax passed actionlint 1.7.12, downloaded from its official release with its published SHA-256 verified.

The live runner preflights selected resources, runs four bounded suites sequentially and evaluates actual JSON evidence. Exit code zero alone cannot establish success. Seven evaluator tests passed, covering incomplete/duplicate scenarios, incorrect outcomes, unconfirmed interruption, remote archival, retained report identity, host team gates and invalid settings/version preflight. Learning scenarios now independently retrieve remote archival before passing. Only authored status summaries are uploaded; provider payloads and logs stay private.

An actual local all-suite run passed course (four sessions), learning (six), host/Python (three) and engineering team (five): 18 sessions total, with archival confirmed. The team reached Ready without reviewer questions and reported 45 cents of immediate list cost, not a final invoice. No external notification, narration synthesis or new infrastructure was requested.

The full offline unit run passed 516 of 517 tests; its Python readiness case hit the existing five-second worker deadline while other heavy checks were concurrent. All five Python tests passed in a focused rerun. The CI job sequences its heavy checks. Developer-server tests, all milestone starter/reference checks and the guide audit across all 75 lessons passed. The Word aliases are identical with 106 paired prompt blocks; native Word rendered 120 pages and the new supplement page was inspected. The renderer now receives its own document directly instead of selecting another open Word instance.

GitHub-hosted live execution requires environment secrets and resource variables described in docs/continuous-validation.md. Local keys were preserved and not transferred into GitHub. Local passing results do not imply a hosted workflow has run or that optional unconfigured integrations were tested.

The complete browser run finished with 318 passed, zero failures and one optional cached-audio playback test skipped (319 discovered). The production build returned exit code zero. Distribution scanning passed, and the refreshed source ZIP includes both workflow definitions. Workflow lint and local execution were verified; GitHub-hosted run status must be observed separately after publication.

## First hosted regression correction

The first GitHub-hosted run completed 516 of 517 unit tests and stopped at the source supervisor restart test. Its source-root guard compared realpath output with the original path spelling, incorrectly skipping ordinary source directories beneath aliased Windows paths. The guard now inspects the source-root directory entry with lstat, retaining the rejection of source-root symlinks and junctions while allowing ancestor aliases. A new junction/alias regression verifies source changes remain visible and linked source roots stay excluded. Both standalone watcher tests and both TypeScript supervisor tests passed locally. No billing, provider configuration or live scenario code changed.

## First hosted live acceptance correction (18 October 2026)

Hosted run 39128999911 passed the course (four sessions), learning (six) and host/Python (three) suites. The team implementation passed its integration tests and review, but a developer reported an unresolved malformed-note policy question. The strict evaluator correctly rejected completion. Independent read-only inspection confirmed all five team sessions archived, for 18 archived sessions across the run.

The issue and suggested plan now explicitly require malformed note tags to throw rather than be skipped. Independent search acceptance checks that policy. The application Ready gate also rejects unresolved questions, matching CI. Recoverable scripted interruptions remain journal events rather than unresolved design questions. Failed CI summaries now retain only authored gate labels, task states, counts and archival evidence; raw reports and question text remain excluded. A targeted hosted team rerun is required before claiming the correction passed live.

Targeted hosted team retest 39130740976 passed on commit cc507ed553ff165de1008483bf6de8aebb302c1f: five sessions, confirmed remote archival, Ready with all three tasks merged and no unresolved questions. Reported immediate list cost was 47 cents, not a final invoice. Together with the first run's 13 passing scenarios, all four hosted suites are verified across the two runs. The final focused local run passed all 13 team tests; evaluator/setup tests passed 12/12; Lab 75 browser checks passed 2/2; production build, distribution scan and source packaging passed. The complete preceding hosted offline regression 39128439782 also succeeded. Existing keys were preserved and transferred only to the explicitly approved live-tests environment; no keys were rotated.

## Direct lesson section links (18 October 2026)

Added notebook, checklist and exercise links beside every lesson title and in desktop/mobile navigation. Course progress includes the same destinations for the next lesson and each lesson in its checklist overview. Stable lesson-specific fragment URLs restore the destination after refresh, opening a new tab and browser history navigation. Notebook and checklist panels expand and receive focus; exercise links select the existing tab without running an exercise. Normal lesson navigation clears previous learning-section fragments.

Three routing tests and 25 focused browser checks passed, including saved-note persistence, unchanged checklist values, no exercise POST requests from section links, mobile focus/menu closure, shell navigation, backups and learning paths. Desktop and mobile screenshots were inspected. Typecheck, production build, distribution scanning and source packaging passed. A redundant browser invocation lost its shared test server when the primary harness completed; the primary 12-test run and separate 13-test regression both completed with every assertion passing. No provider scenario was rerun for this navigation change.

## Recorded validation overview (18 October 2026)

Added a Home validation overview, persistent desktop/mobile navigation link and Course progress shortcut. It presents the independently verified offline run 39134515055, the three passing live suites within the failed original run 39128999911, and the successful team retest 39130740976. Tested commits, observed archival, original overall failure and coverage limitations remain explicit. The authored snapshot is not a live status feed and includes no provider payloads or session identities. Current workflow links open GitHub separately.

Typecheck, three routing tests, production build and distribution scan passed. Seventeen unique browser checks were verified: the initial un-warmed local run passed 16 and timed out loading the first page before assertions; the focused overview rerun passed both cases after allowing cold compilation time. Tests verified desktop/mobile access and focus, history/reload, recorded evidence links, unchanged notes/checklists, no automatic GitHub requests, no exercise POSTs and existing shell/progress/shortcut behavior. No billed provider tests were started.

## Hosted Lab 14 loading timeout correction

Hosted run 39159461418 passed the offline checks and 321 browser cases, with one optional cached-audio case skipped. Its single failure was the Lab 14 phone test exhausting the 30-second test budget while waiting for the exercise tab, before the hanging-turn scenario ran. A local cold run reproduced a 30-second page-loading timeout in the same lesson's first case; the remaining 11 repeated cases passed, including the phone cancellation behavior.

The Lab 14 browser suite now has a bounded 60-second test budget for lesson loading. Existing configuration, cancellation, cleanup and layout assertions retain their normal assertion deadlines. No automatic retries were enabled and no application or provider execution behavior changed. All four cases passed three consecutive repetitions after the adjustment (12/12). Workflow lint passed. The offline workflow now retains only isolated Playwright error-context Markdown if its browser step fails, so a future failure has inspectable context; live workflow payload handling is unchanged. A new full hosted regression must establish the replacement run's outcome.

The replacement run 39162324979 passed Lab 14 and 321 browser cases but exposed a separate Lab 64 wait mismatch. Its captured context showed the local browser inspection still running when the default five-second assertion expired. The UI permits 30 seconds for that operation. Lab 64 now waits up to that existing deadline for each required result, with a 120-second budget for the three-operation scenario. Product/price checks, screenshot proof, blocked-navigation verification and missing-browser handling remain required. Three consecutive local repetitions passed (3/3); no provider session or paid model run was used.

The next hosted run, 39164146205, stopped at Python readiness (517/518 unit tests passed): the isolated worker was terminated at its old five-second local budget before importing the pinned SDK. A heavier local check also reproduced premature termination for ordinary offline worker startup. Local readiness and offline workers now have a bounded 15-second default; live workers retain 45 seconds and explicit deadline overrides still take precedence. Readiness HTTP waits allow 20 seconds, and Lab 70 browser outcome waits account for the same local worker bound. Six Python tests passed, including explicit deadline termination without falsely claiming confirmed cleanup; the retained-session browser check and typecheck passed. The production UI build passed. Existing credentials and resource pins were preserved. The user also explicitly requested a fresh run of all four online suites; their observed results must be checked separately from offline CI.

Fresh online run 39165527477 stopped safely in the course suite: the completion case passed, but remote cancellation was still unconfirmed when its ten-second cleanup window expired. Provider lifecycle inspection scoped to that run showed the interrupt processed later, after the response ended. The remaining suites were not started. Both created sessions were independently retrieved and confirmed archived after explicit cleanup of the later-idle session. No billing limit was raised.

The course audit now permits a bounded 60-second independent stop-confirmation window while preserving its execution deadlines and strict interruption/archival acceptance requirements. Failed course summaries retain only allowlisted scenario outcomes, interruption/cleanup states and verification booleans; provider payloads and session IDs remain excluded. The added privacy regression and evaluator/setup checks passed (13/13). The online suite rerun must be evaluated from actual provider results; this change alone does not establish a pass.


Fresh online run 39166185199 on commit 0725b6b9f4032e1062f068c2794cd12078622a7a passed all four suites: course (4 sessions), learning (6), host/Python (3), and engineering team (5). All 18 sessions were independently confirmed archived. The team suite reported 46 list cents at audit time; this is not an invoice total. No further paid run is needed for an unrelated offline diagnostic change.

Offline run 39166150245 passed 518 of 519 unit tests, with Lab 64 returning a generic MCP screenshot failure before the browser suite began. That message discarded the underlying tool error, so the host now preserves bounded text-only diagnostic detail. Existing screenshot success, DOM, owner isolation and call-count requirements remain unchanged. Repeated local real-browser checks are being used to investigate; this diagnostic change alone does not establish a root-cause correction or a full hosted pass.


The diagnostic rerun 39167210093 passed all 519 unit tests and 321 browser cases; one optional audio case was skipped. Its sole failure was Lab 05 exhausting its 30-second total test budget while waiting for the exercise tab, before submitting malformed tool input. The isolated failure context contained no rendered page snapshot. Lab 64 screenshot capture passed in both hosted unit and browser stages, and all 519 local unit tests also passed. The original intermittent screenshot cause remains unconfirmed; bounded MCP diagnostics are retained.

The default browser test budget is now 60 seconds for the shared lesson-registry loading path, replacing the isolated Lab 14 override. Normal assertion deadlines, scenario validation and zero automatic retries are preserved; longer explicitly bounded scenarios retain their own budgets. Lab 05 and Lab 14 are checked together with three repetitions before the next full hosted regression. This is a functional test loading allowance, not a page-load performance claim.


The first focused local run reproduced the missing startup distinction: its first cold page exceeded 60 seconds in page.goto, while subsequent Lab 05 and Lab 14 cases passed. HTTP/backend readiness and transforming main.tsx do not establish that the React lesson registry has rendered. The supervised browser runner now uses a temporary real Chrome page to await a visible lesson heading before starting timed scenarios, with bounded startup waits and guaranteed browser closure. The initial page submits no exercise action. The unchanged browser cases are rerun through this actual runner rather than the earlier local helper.


All 24 Lab 05/Lab 14 cases passed through the revised supervised runner (three repetitions each, browser process exit 0). JavaScript syntax validation and TypeScript typecheck passed. A new complete hosted run is required to confirm the combined regression after this harness correction. The Vite team-holdouts denial is expected: Lab 75 explicitly asserts HTTP 403 for that private acceptance source; the serving restriction is retained.


## Refreshed recorded results (19 October 2026)

Hosted regression 39220328920 on ff2cc39a25876110431f226a149a593a4927a406 passed: 519 offline unit tests, 13 evaluator/setup tests, 322 browser checks and one optional cached-audio skip. All 75 guide/source audits, three milestone reference checks, production build, distribution scanning and source ZIP upload passed. The supervised runner confirmed the real lesson UI rendered before starting scenarios.

The Home validation overview now links this successful offline run and successful all-suite online run 39166185199 on 0725b6b9f4032e1062f068c2794cd12078622a7a. The online card lists course (4), learning (6), host/Python (3) and engineering team (5), with all 18 sessions confirmed archived. Both run conclusions and log counts were rechecked against GitHub. Earlier failed attempts remain documented above; the overview presents the latest verified successful evidence.

The evidence snapshot remains scoped to the linked commits, with no automatic GitHub polling or provider execution. This presentation update does not rerun paid scenarios or claim newer commits were covered by older runs. Typecheck, production build and the desktop/mobile overview browser checks passed, including correct evidence/commit links, navigation focus, unchanged notebook/checklist state and no automatic POST or GitHub requests.


## Start here and bounded screenshot recovery (19 October 2026)

Added a short Home guide with direct Lab 01 exercise/notebook links and a milestone-project destination. Desktop and mobile navigation include Start here. Its fragment and the milestone fragment reopen/focus their destinations after refresh and history navigation; ordinary lesson navigation clears those Home targets. The guide recommends an offline example, a saved observation and the event-viewer starter without requiring completion of the whole course.

The overview-refresh regression 39223605697 exposed the previously intermittent native Chrome error with the new diagnostic: Page.captureScreenshot reported Unable to capture screenshot. Lab 64 now retries only that exact read-only capture error once, foregrounding the same page first. Navigation and form actions are never replayed. Counts include the extra capture, with at most seven calls for the form scenario. A repeated error still fails. The proof uses the validated PNG image returned by MCP instead of taking a second independent screenshot.

Seven focused unit checks passed, including exact-error recovery, no retry for other errors, one-retry exhaustion, real MCP DOM/form checks and owner-scoped PNG access. Nine browser checks passed for the new guide, shortcut reload/history/mobile behavior, validation overview and real Lab 64 proof capture. No exercise POST or project download occurs from guide navigation. The mobile screenshot was inspected. Typecheck passed. No new paid provider sessions were needed; the prior all-suite live acceptance remains separately recorded at its tested commit.

## Black source viewers and policy worker startup (21 October 2026)

All 75 TypeScript source viewers now use a pure black code background with light text, legible line numbers and bright syntax colors in both themes. The current Markdown curriculum, visual specification, guide documentation and student prompt ZIP reflect this requirement. The source viewer styling is scoped; other evidence panels retain their existing colors.

Hosted regression 39564734823 failed the Lab 37 browser case when its isolated policy worker exceeded the 800 ms startup/response deadline. The worker now has a bounded three-second deadline, below the seven-second UI request timeout. It still kills a stalled child and fails closed without a confirmation or file effect; no retry was added. Four focused unit tests passed, including the actual stalled worker. Chrome verification against the production build checked all 75 source viewers in both themes, desktop/phone fit, and zero exercise POSTs during source inspection. The previously failing Lab 37 host-refusal and malformed-output scenarios also passed against the real local worker. Typecheck/build and the generated prompt consistency check passed. These local results do not certify a replacement hosted regression until it finishes. No billed provider calls were needed.

## Browser startup isolation and retained diagnostics (21 October 2026)

Hosted regression 39573724042 on f2af7c34daf52e49ebb48d6989a1b5643be55f99 passed its offline checks and 487 browser cases. The two failures occurred before the relevant UI was ready: Lab 06 waited for its exercise tab until the 60-second test deadline, and the Lab 66 infographic expected five tabs within five seconds while none were rendered. The infographic checks now await the Learn tab with a bounded 30-second loading allowance before their normal assertions. Scenario assertions and zero automatic retries remain intact.

The supervised runner warms both the application and the framework harness until their exercise tabs are visible, uses a separate Vite cache per web port, and disables HMR. File watching is disabled in the resolved browser-test mode: inspection showed that passing watch:null inline was merged with the existing watcher object and did not disable it. Dependency optimization is restricted to the explicit app/harness entry points and client dependencies. Startup stage timings and a 30-second Chrome launch deadline make failures observable. Startup failures retain authored stage/timing JSON; Lab 06 and infographic failures retain bounded, redacted browser diagnostics with URL query strings omitted. CI uploads these JSON files alongside the existing error-context Markdown.

All 165 affected browser checks passed through the supervised runner, including both formerly failing scenarios, all 75 lessons' infographic views, cached narration behavior and workspace/source-panel checks. A separate six-case smoke run through the final watcher-disabled configuration warmed both entry points in nine seconds, passed every selected check and exited cleanly. A temporary deliberate-failure probe verified that the named JSON artifact is written and a dummy secret is redacted; the probe was removed. Typecheck, runner syntax, workflow YAML/artifact-path checks, the production Vite build and distribution scanning (6,176 files) passed. Initial local Chrome launch timeouts were reproduced; a standalone launch succeeded, so those timeouts alone did not establish a sandbox-only cause. These local checks do not certify a new hosted regression. No paid provider scenarios were run.

## Successful hosted regression and verified course package (21 October 2026)

[Hosted regression 39588821437](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/actions/runs/39588821437) succeeded on [d1cfdd01440fdb58d828fdc5f8940f3e94a438db](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/commit/d1cfdd01440fdb58d828fdc5f8940f3e94a438db) in 21 minutes 42 seconds. All four jobs passed. Logs confirm 528 offline tests, 13 evaluator/setup tests, two developer-server tests, three milestone reference checks, and the guide/source audit for all 75 lessons. Browser shards passed 245 and 244 cases respectively: 489 total, with zero skips. Production build, distribution scanning (5,299 files), course packaging and artifact upload also passed.

The Home validation overview now records this offline run and its exact tested commit. The separately recorded online acceptance remains run 39166185199 on 0725b6b9f4032e1062f068c2794cd12078622a7a, with all four suites and 18 confirmed archived sessions. Refreshing the overview does not imply the older live run covered newer commits or execute new provider scenarios.

Downloaded and independently verified [artifact 12342042136](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/actions/runs/39588821437/artifacts/12342042136), named `authored-course-d1cfdd01440fdb58d828fdc5f8940f3e94a438db`. GitHub retains it until 28 October 2026. The artifact wrapper is 536,142,295 bytes with SHA-256 `a351c7f99d8ae6175e372d12cf6d4f6b37936b9c4410337907f5672d48c81c30`. Its contained `managed-agents-labs-01-75.zip` is 567,935,972 bytes with SHA-256 `fd34156ccb28ffcdfda213aeba8b3d799a60cf86bafe2ec77057c175915d6071`, matching the packaging job's output.

Every one of the 3,005 authored members matched its SHA-256 in `distribution-manifest.json`, with no missing, extra or duplicate entries. All 75 root lesson guides and required app/configuration files were present. Checks rejected traversal paths, symlinks, private/runtime folders and unexpected environment files; 2,170 text members passed credential-pattern scanning. Only `.env.example` is permitted. The downloaded ZIP and machine-readable verification report are retained locally under `artifacts/course/verified-39588821437/`; they are ignored by Git. This is the verified source package for the tested commit, prepared for the next release. This later overview/documentation refresh is outside that archive and has its own local checks; no release was published.

The overview refresh passed TypeScript checking, production build and both existing desktop/mobile browser checks against that production build, including evidence links, tested commits, history/reload focus, saved notes/checklists and zero automatic POST or GitHub requests. Both screenshots were inspected. Two initial supervised development runs stopped at backend readiness before any test scenarios; a directly started backend subsequently became ready, and both production-browser checks passed with exit code zero. These local startup timeouts do not invalidate the separately verified successful hosted run. No new live acceptance was executed.

## Six-colour visual style (21 October 2026)

Added shared red, orange, yellow, green, blue and purple families with separate readable ink/tint values for light and dark themes. Shared cards, tabs, prompt accents, progress, review, notes, paths, shortcuts and Home architecture cards use stable semantic identities. Filled controls use contrasting text; selected tabs also use bold type, a contrasting underline and inset border. Phone tabs use two columns to avoid cramped labels. All TypeScript code backgrounds remain black, and existing narration highlight colours are preserved.

The complete student implementation prompt, including token values, section mappings, responsive requirements and acceptance checks, is at `docs/student-build-prompts/12-six-colour-visual-style.md`. Its source is `sixColourStyle` in `scripts/student-prompt-stages.mjs`; generation embeds it in P01 and WORKBOOK.md and includes it in `artifacts/course/udemy-platform-build-prompts.zip`. README and both existing visual/learning prompt documents link to it. Prompt generation, packaging and consistency checks passed for 289 generated files and the existing 120 ordered prompts, with no provider requests.

Typecheck and production build passed. All 13 relevant existing browser regressions passed; after the final phone-tab adjustment, keyboard tabs, source-copy/theme checks and mobile menu behavior passed again (three checks). A production UI review covered 16 layouts across both themes and widths 320, 390, 768, 1280 and 1920. All 170 sampled rendered text/background pairs exceeded 4.5:1 contrast (minimum 5.64:1); no horizontal page overflow or exercise POST occurred. Desktop/phone screenshots, Home architecture cards and black source panels were inspected. A doubled CSS page-scale check also had no page overflow; this is not a claim about every browser's native zoom implementation. Screenshots and measured samples are under `artifacts/visual-style/`. The guide/objective/UI/server source audit also passed for all 75 lessons. Existing guides and lesson execution contracts were not edited. This visual change has local validation only and is outside the earlier hosted run's tested commit. No paid provider, publication or release action was performed.

## Learning Guide vertical scrolling (21 October 2026)

Reproduced nested scrolling in the expanded floating guide: both the outer panel and an inner transcript area scrolled independently. At 390x844 and 844x390, scrolling the outer panel could hide Close/Minimize above its visible bounds. Removed the inner scroll constraint, retained one outer scroll container with overscroll containment and stable scrollbar space, and made the step/Minimize/Expand/Pause/Close toolbar sticky. The active guide is keyboard focusable and supports Home/Page Up/Page Down. Checklists, notes and playback remain mounted.

The narration path previously called scrollIntoView on every cue, even for already visible text. The new shared guide-scroll helper reveals only the hidden portion, accounting for the top bar and floating player where space permits. Follow highlighted text can be disabled in the expanded player: highlighting still follows the actual media clock, while paragraph changes and automatic section continuation leave the page still. Explicit section/target navigation remains available. No spoken transcript, media timing or recording identity changed.

Typecheck and production build passed. All 22 relevant browser checks passed against the production app: notes/backups, recorded MP3 playback, timing, scrolling, progress and shortcuts. All 13 guide/playback/timing checks passed again after the final disabled-follow automatic-continuation correction. Regression cases cover real wheel input and boundary containment, Home/PageDown, bottom-of-panel control bounds, minimize/expand and close at 1280x900, 390x844, 320x568 and 844x390. Additional checks cover stable visible paragraphs, disabled-follow seek and automatic section changes, compact phone highlight visibility, pause/replay and no automatic exercise requests. Production screenshots confirmed no nested transcript scroller and reachable controls on desktop, phone and landscape. One intermediate development run used modules cached before the new follow option existed; its missing-checkbox failure was resolved by verifying the final production build, not by weakening assertions or adding retries.

Updated `docs/learning-guide.md`, student P03/P06, the generated workbook and the student prompt ZIP; document consistency and packaging checks passed. Local screenshots are under `artifacts/learning-guide/scroll-before-*.png` and `scroll-after-*.png`. This is local verification, separate from the earlier hosted commit; no paid synthesis, provider session, release or deployment was run.
