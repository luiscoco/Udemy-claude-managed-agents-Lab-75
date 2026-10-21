# Learning platform implementation supplement

Adopted requirements through 18 October 2026. Apply these independent prompts to the existing Managed Agents platform with Labs 01 through 75. Preserve the original numbered lesson prompts and the visual style prompt. This supplement supersedes the earlier implementation checkpoint and any suggestion that learners must complete every checklist or follow a fixed path. All learning tools are optional.

## Continuous regression and explicit live acceptance

COPY PROMPT START

Add GitHub Actions workflows to the combined course repository. Run offline unit and browser tests, developer-server checks, milestone reference checks, guide coverage, production build and distribution scanning on pushes and pull requests. Include all registered lessons and shared learning tools. Install the pinned Python dependency and Chrome explicitly on a Windows runner. Use immutable action revisions, read-only repository permissions and no provider secrets in automatic regression jobs.

Provide a separate manually dispatched workflow on main for billed live acceptance. Require an explicit billing confirmation, use an environment named live-tests, queue overlapping runs without cancelling remote cleanup, and expose only authored bounded suite choices. Cover course lifecycle and retained reports, learning options and skill variants, editor backend and Python tools, and the configured engineering team. Do not provision agents, upload skills, synthesize narration, send notifications or deploy infrastructure as a side effect.

Validate all selected local prerequisites before starting paid sessions. Keep shared and dedicated team credentials separate. Support a reviewed skill pin manifest with strict schema and bundle hash checks; never overwrite an existing manifest. Keep API keys in server settings locally or GitHub environment secrets remotely. Document required variables and secrets without transferring local keys automatically.

Make acceptance depend on observed evidence, not process exit code alone. Reject missing or duplicate scenarios, incorrect terminal outcomes, unverified reports, unconfirmed interruption, unresolved review, failed host acceptance and unconfirmed remote archival. Stop later suites after failure and make no automatic billed retry. Preserve private diagnostic logs locally while uploading only authored pass or fail summaries and counts. Explain that forced cancellation can prevent cleanup confirmation and that budget guards are not final invoices.

Test the evaluator with complete and incomplete evidence and with incorrect cleanup, outcomes and reports. Run the actual configured bounded live suites when authorized, verify cleanup independently, report real results and keep optional integrations distinct. Update the setup documentation, validation report, Word workbook and source package. Publish the reviewed changes and clearly distinguish local results from an observed GitHub-hosted workflow run.

COPY PROMPT END

## Learning Guide and Inworld narration

COPY PROMPT START

Extend the existing Managed Agents application with a shared Learning Guide for all 75 registered lessons. Adapt useful capabilities from the user's Agent SDK reference platform to the actual Managed Agents objectives, controls, source files and evidence. Do not substitute Agent SDK lifecycle assumptions or invent provider capabilities.

Author seven sections per lesson: objective, preparation, example, controls, evidence, source and practice. Use the same authored explanation for visible text and narration. Provide transcripts, previous and next controls, section selection, show-section navigation, pause, replay, playback speed, minimization and explicit resume of a saved tour. Never start an exercise, submit a prompt or mark a checklist complete through guide navigation.

Add a red rectangle around the current explanation and a separate highlight around the relevant visible exercise control or result. Locate real mounted elements, refresh highlights when content changes, and report when evidence is not yet present. Respect reduced motion, keyboard focus, scrolling and mobile layouts. Stop playback and cancel pending requests when the learner changes lesson or closes the player.

Keep the Inworld API key and opt-in on the server in ignored settings. Accept only registered lesson and section identifiers at the audio endpoint; synthesize authored text only. Enforce local request checks, bounded text and response sizes, deadlines, concurrency and rate limits, safe caching and sanitized errors. Use the configured voice and model; do not expose credentials or generate all clips automatically. Starting a tour must not synthesize audio. Explain that explicit narration playback can incur charges.

Verify lesson coverage, safe audio request handling, playback controls, highlight targets, resume and mobile accessibility. Use mocked transport for regression tests. Real synthesis needs explicit authorization; report actual evidence and distinguish transport verification from subjective audio review.

COPY PROMPT END

## Full course interface and bounded live acceptance

COPY PROMPT START

Audit every registered lesson at desktop and phone widths. Open Learn, the detailed guide, the exercise interface and actual UI/server source views without submitting an exercise. Check visible control names, duplicate IDs, missing content, invalid lesson links, runtime errors and horizontal page overflow. Record per-lesson evidence and verify that navigation makes no execution POST requests. Run the existing offline interaction checks separately so static interface inspection is not mistaken for a successful exercise.

When the user explicitly requests live tests, use the existing isolated credentials and pinned resources with bounded session budgets, deadlines and cleanup checks. Exercise completion, cancellation, local deadline, retained reports, options, system instructions, configured skill versions, editor/Python integration and the configured live engineering team where available. Keep fixture tests, real provider sessions, telemetry exports and readiness checks distinct. Never infer successful delivery or remote execution from configuration alone, and never claim optional unconfigured live adapters were tested.

Stop further session creation when cleanup cannot be confirmed. Preserve keys, record sanitized failure diagnostics and independently inspect created session archival. Do not send external notifications or provision new cloud resources as a side effect of an audit. Report expired notification credentials as a setup prerequisite. Provider-reported list costs are not a final invoice.

Use findings from live review to strengthen host acceptance rather than accepting a green worker report at face value. For the fictional tag fixture, validate tag.trim().length in UTF-16 code units before lowercasing, rejecting empty input or more than twenty units. Unicode lowercasing can expand an otherwise valid trimmed value. Keep Unicode codepoint ordering for count ties as a separate requirement. Clarify the public issue and task contract, fix the authored reference and add a regression proving that visible-green code with the wrong length-check order is blocked by independent acceptance.

Retest affected deterministic and live paths, update the validation report, workbook and source package, and publish to the combined platform repository. Preserve historical lesson checkpoints. Summarize actual coverage and any remaining prerequisites without requiring the learner to navigate the course manually.

COPY PROMPT END

## Worked experiments readable answers and milestone help

COPY PROMPT START

Improve the existing teaching experience without making learners ask a chat assistant to resolve each starter failure. Add an optional solution walkthrough to each of the three milestone cards, with implementation steps, common mistakes, an extra experiment and the expected supplied-test count. Link the event viewer to the Lab 01 notebook, HTTP streaming to Lab 12 and the approval ledger to Lab 65. Notebook entries remain explicit learner actions.

Offer a separate reference ZIP alongside each starter ZIP. Preserve unfinished starters. The reference should contain a runnable starter.ts copied from the authored reference, the identical supplied tests, package manifest, a reference README and walkthrough. State how to extract into a separate folder, run node --test starter.test.mjs and preserve the learner's own work. Expected counts are four, three and five respectively. Downloading a solution must never count as a test pass, execute learner code or complete a checklist.

Show a baseline, a comparison and a concrete evidence principle for every registered lesson. Reuse the lesson's authored steps, source paths and concept explanation; use detailed examples for event completion, retained turns and fictional approval. Include the evidence explanation in the shared narration transcript so visible and spoken teaching stay aligned. Do not treat a stated expected principle as an observed run result.

Render final agent prose with readable headings, lists, bold text, inline and fenced code, and simple tables. Keep streaming previews and lifecycle evidence visibly distinct. Offer an expandable exact redacted message for copying. Reuse a safe limited Markdown presenter that leaves raw HTML and embedded resources inert and refuses unsafe link schemes. Preserve existing event IDs, outcomes, redaction and report JSON.

Verify archive allowlists and exact file contents, passing reference tests, expected starter failures, Markdown safety, all 75 experiment plans, bounded narration text, browser downloads and mobile layouts. Run the offline regression suite and distinguish any environment-specific failure from a genuine application regression. Update the workbook and release package, then publish the verified changes to the combined platform repository without changing historical lesson checkpoints.

COPY PROMPT END

## Optional progress notebooks and backups

COPY PROMPT START

Implement browser-local learning progress without treating self-assessment as proof of exercise success. Provide four optional checklist items per lesson, a remembered tour section, a personal plain-text notebook with explicit Save note, and a bookmark for review. Keep notes limited to 4000 characters and clearly show unsaved changes and storage failures.

Show completed, in-progress and unstarted checklist counts on Home. Suggest a next lesson while allowing unrestricted navigation. Record a visit as started only. Show knowledge-check results separately from checklist completion and live execution evidence. Keep all 75 lessons available regardless of progress or selected path.

Provide a downloadable JSON backup of known learning fields only. Exclude provider credentials, sessions, exercise outputs, audio and unrelated browser storage. Validate imports against a closed versioned schema with a 2 MB file limit, registered unique lesson IDs, bounded notes, valid section identifiers and canonical timestamps. Preview the contents without writing storage; require an explicit Restore action and support cancellation.

Preserve compatibility with version 1 learning backups. Version 2 may include validated knowledge attempts; older backups must not erase newer existing knowledge answers. Revalidate at the write boundary, retain unrelated data and roll back affected learning keys on a failed restore. Describe browser-local persistence and allow a learner to download another backup after making changes.

Test notes, bookmarks, progress and restored state across reloads. Verify cancellation, malformed imports, denied storage, rollback behavior and exclusion of unrelated values. No learning-state operation should contact a model provider or start an exercise.

COPY PROMPT END

## Knowledge checks paths and review

COPY PROMPT START

Author one concept question with three distinct choices and an explanatory answer for each registered Managed Agents lesson. Derive questions from the implemented lesson objective and evidence. Vary the correct choice position. Require an explicit Check answer action, permit retries and save only the latest checked choice with its content version and timestamp.

Compute correctness from the authored question rather than trusting a stored passed flag. Ignore invalid or obsolete attempts. Make wrong-answer explanations useful and connect Review lesson source to the real source tab. Describe knowledge checks as concept practice, independent of checklist completion or real execution.

Provide optional paths for Managed Agents foundations, application building, reliable orchestration and the complete course. Filter path membership against registered lessons. Reuse existing checklist progress, show position and previous or next links, and remember the selected path as a browser preference. Never lock a lesson, force a sequence or certify completion.

Add a Home review queue containing lessons whose latest knowledge answer is incorrect and lessons explicitly bookmarked. Put incorrect answers first, deduplicate lessons and provide useful filters. A correct retry removes the knowledge-review reason while retaining a bookmark until the learner removes it.

Verify all 75 questions, grading from the catalog, invalid stored attempts, backup compatibility, path navigation, correct retries, bookmark persistence, empty states and mobile controls. The checks and navigation must work without provider requests.

COPY PROMPT END

## Offline milestone projects

COPY PROMPT START

Provide three independent downloadable starter projects: an event stream evidence viewer, a local streaming tutor endpoint, and a fictional approval and effect ledger. Use native Node 24 or newer TypeScript support, the Node test runner and no required dependency installation or API keys. Include a README, package manifest, starter.ts and starter.test.mjs in each ZIP. Keep reference solutions in repository source, outside starter downloads.

The event viewer reduces authored host frames into session identity, answer text, a terminal outcome and an event count. Deduplicate frame IDs, remain incomplete without a terminal outcome, stop at the first outcome, and reject unexpected kinds or conflicting sessions. Do not present this teaching contract as raw Managed Agents event syntax.

The tutor endpoint validates POST /ask with exactly one prompt field, trimmed length 1 through 200 and a 1024-byte body limit. Return appropriate route, method, content-type and validation errors before SSE starts. Stream deterministic started, answer and done events with JSON data and end the response. Describe its local teaching scope rather than claiming production hardening.

The approval ledger separates proposal, local notification, reviewer decision and effect. Bind proposals to an owner, return frozen snapshots, reject wrong reviewers and premature or repeated decisions, and deduplicate approved effects by a stable owner-and-case business key. Rejection is terminal. Explain that trusted-reviewer is a fixture identity and that the in-memory ledger is not durable authentication or storage.

State prominently that unfinished starters initially fail their tests. Serve only allowlisted authored files, with no arbitrary path or execution endpoint. Verify expected starter failures and passing authored reference solutions in isolated copies. Never execute uploaded or learner-edited code on the platform. Learners run tests locally and may record their results in a notebook; do not automatically award checklist completion.

COPY PROMPT END

## Direct access to learning tools

COPY PROMPT START

Improve discoverability using the actual difficulties reported by the learner. Add persistent Course progress and Back up or restore shortcuts to desktop navigation and the mobile menu. From any lesson, one normal click must open the correct Home section, expand backup controls when needed, scroll the destination below the fixed header and place keyboard focus on it.

Add an Open notebook button beside each lesson title and a notebook shortcut for the current lesson in navigation. Open the existing notebook rather than creating a second editor. Automatically expand containing details elements, retain the correct lesson identity and focus the notebook destination. Keep the Learning Guide and knowledge-check shortcuts available.

Place an Open learning backup button near the Course progress heading so learners do not need to search below paths, review queues and milestones. Clearly explain that paths and checklists are optional and that users may explore any lab at their own pace. Avoid instructions that require a learner to traverse all 75 lessons to validate application development.

Reuse existing routing, storage, backup validation and exercise behavior. Modified link clicks must retain normal browser behavior. Close the mobile menu after selection, keep controls readable and keyboard accessible, and avoid horizontal overflow. Opening a learning tool must not synthesize audio, send email, call a provider, start a session or mutate a checklist.

Verify direct access from a lesson and from Home, the correct notebook and saved note, backup download, focus, mobile menu closure and absence of exercise POST requests. Keep existing shell, backup and path regression checks passing.

COPY PROMPT END

## Release verification and repository delivery

COPY PROMPT START

Maintain the original 75 lesson prompts and add dated implementation supplements when requirements grow. Keep the canonical prompts Word document current and synchronize the existing visual-style workbook alias. Preserve original copyable prompt blocks. Render and inspect the updated Word document, record the verification method and provide a downloadable final document.

Run focused unit and browser regressions for changed functionality, typecheck, lesson coverage and the production build. Run distribution scanning only after the build finishes, and regenerate the authored course ZIP. Do not package local credentials, provider responses or private learner notes. Distinguish deterministic fixture tests from real provider runs and record only observed outcomes.

Preserve previously configured server credentials. Do not rotate keys or send notifications as a side effect of release checks. Use offline or mocked provider transports unless a real billable test is explicitly authorized. Previously verified email delivery, Azure telemetry and live team runs do not imply that optional Slack, Teams or AWS integrations were tested.

Commit and push the reviewed changes to the combined platform repository. Keep the user's independent cumulative lesson checkpoint repositories intact; do not rewrite all historical checkpoints to publish a shared platform enhancement. Explain changes, actual validation and material limits briefly. Developer-led verification should not require the learner to navigate every lesson or complete personal checklists.

COPY PROMPT END

## Lesson navigation revision - 21 October 2026

COPY PROMPT START

Use the searchable desktop sidebar or mobile menu and previous/next links below the lesson to change lessons. Do not render a duplicate Lab 01-75 button grid or numbered lesson strip above the main workspace. Keep the lesson heading, guide shortcuts and all lesson workspace tabs, including infographic views. Remove unused grid styles. Preserve numeric lesson URLs and browser history. Verify desktop and phone navigation without starting an exercise or audio. This revision supersedes earlier visual references that show a numbered grid in the main content.

COPY PROMPT END

## Black TypeScript source viewer - 21 October 2026

COPY PROMPT START

Across Labs 01-75, render the TypeScript source code on a pure black (#000000) background in both light and dark themes, with light default text, readable syntax colors and muted but legible line numbers. Scope this styling to the source viewer; retain file selection, copy, supporting imports and existing code wrapping/scrolling. Verify desktop and phone layouts in both themes without executing the source.

COPY PROMPT END


## Six-colour visual style revision - 21 October 2026

Use the complete [copyable six-colour implementation prompt](student-build-prompts/12-six-colour-visual-style.md), also embedded in curriculum step P01 and WORKBOOK.md. It supersedes the earlier blue-primary-only styling guidance with consistent red, orange, yellow, green, blue and purple families, theme-specific contrast tokens and stable section/view identities. Preserve the black TypeScript source panels, navigation, accessible states and all lesson behavior. The generated student prompt ZIP includes this prompt so learners can reproduce the change later.


## Home portal presentation revision - 21 October 2026

Replace the old Home text introduction with the instructor-style portal banner titled **Claude Managed Agents Learning Portal**. Follow the complete [student implementation and artwork prompt](student-build-prompts/13-home-portal-banner.md), also included in P01 and WORKBOOK.md. Use the local instructor asset, preserve accessible and phone-readable HTML text, keep an honest fallback for partial catalogs or missing artwork, retain Start navigation, and include the image in course source packages.
