# Lab 75 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 75 — Lab walkthrough"; then "Capstone 2 an autonomous engineering team: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Standing with a clipboard and raising a gloved stop palm, dynamic forward lean with the prop held in both hands. The prop illustrates Capstone 2 an autonomous engineering team. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Validate good and rejected plan presets without creating workers."
Teaching context for the visual explanation (do not print this entire paragraph): Validate good and rejected plan presets without creating workers.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Run the happy path and inspect dependency waves, test gates, authors and merge hashes."
Teaching context for the visual explanation (do not print this entire paragraph): Run the happy path and inspect dependency waves, test gates, authors and merge hashes.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Compare test gaming, hidden-boundary failure, ownership correction and budget exhaustion."
Teaching context for the visual explanation (do not print this entire paragraph): Compare test gaming, hidden-boundary failure, ownership correction and budget exhaustion.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Interrupt after wave one, resume, and verify retained costs and no repeated completed calls."
Teaching context for the visual explanation (do not print this entire paragraph): Interrupt after wave one, resume, and verify retained costs and no repeated completed calls.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Host acceptance, review, ownership and accounted costs."
Teaching context for the visual explanation (do not print this entire paragraph): Host acceptance, review, ownership and accounted costs. Independent release gates are required beyond worker-reported success. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Explain why a green worker suite and a done report cannot establish readiness without host acceptance, review, ownership and known costs."
Teaching context for the visual explanation (do not print this entire paragraph): Explain why a green worker suite and a done report cannot establish readiness without host acceptance, review, ownership and known costs. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Validate plan only tests good/sequential, protected deletion, duplicate owner, dependency cycle, existing test overwrite and malformed presets without creating workers or contacting a provider. Run engineering team selects one of seven offline scenarios: happy rework, corrected injected plan, corrected foreign-owner request, test gaming, hidden boundary failure, budget exhaustion and interruption after wave one. Resume interrupted team replays durable evidence and skips already merged tasks. Cancel team aborts local waits and active role calls; remote cleanup is separately journaled.


## Evidence to inspect

The good plan has T1 tags followed by T2 search and T3 report concurrently. All tasks have one source owner and a new test file. The host validates a closed plan, rejects cycles with their path, and permits one corrective planner round. Tags must be nonempty strings with at most twenty UTF-16 code units after trimming. Check `trimmed.length` before lowercasing, because Unicode lowercasing can expand the result. Then lowercase and deduplicate in input order. Search returns original matching notes. Counts count a normalized tag once per note and sort by descending count then ascending Unicode codepoint tag, comparing numeric code points with shorter prefixes first.

Workers use checked custom tools only. Planner and reviewer tools are read-only. A developer can write only its owned files and new test. Paths reject traversal, protected data and links; directory reads suggest glob_files. The board binds sender identity to the role/task, allows only known recipients, six messages per sender and 600 characters, and deduplicates stable envelope IDs. Peer text remains untrusted. There is no shell/Git tool.

For each dependency wave the host creates worker branches from the current integration SHA. It awaits settled developer results before integration, checks actual scope, nonempty changes, at most 200 changed lines, at least two new tests and no skip/only/todo, then runs the full fixture suite with a scrubbed environment. Verified work receives a local team-dev author and Task/Refs/Plan-hash trailers. Host merges are serialized and use --no-ff. Main remains unchanged. The host reruns integration tests and performs one bounded changed-line review/rework round. Worker claims cannot satisfy these gates.

Four acceptance probes execute outside the agent-visible checkout in separate Node processes. The UI exposes only labels/outcomes. A green visible suite can still fail the twenty-character boundary or stable tie-order checks. Ready requires all merged tasks, protected files intact, passing full integration and acceptance suites, valid review without open high findings and known costs within budget. Every stop produces a draft handoff with concrete unmet checks and reviewable commands; no branch is pushed automatically.


## Limitations

The offline team is scripted but writes real files and passes the same host tools and orchestrator gates. Git worktrees share objects; they are not an OS security boundary. Use a sandbox for arbitrary third-party code. Local owner headers and browser session identity are teaching isolation rather than production authentication. Retained fixture repositories remain local for inspection; expired run access fails closed. Run `npm run team:cleanup` deliberately to remove only expired inactive UUID fixtures with valid journals and no links. Active, corrupt or uncertain state is retained. Cleanup never follows a junction or touches a caller-selected path.

Optional live mode requires MANAGED_LIVE_ENABLED, the isolated server-side LAB75_ANTHROPIC_API_KEY, an existing environment, and separately versioned planner/developer/reviewer agent IDs and positive versions from `.env.example`. The exact required closed inventories are returned by facts and authored in `server/team/live.ts`. Use `npm run team:ready` for local diagnostics. Provision those role agents deliberately with `npm run team:provision` after configuring the isolated key and reviewing the model; startup and readiness never provision. Immutable returned pins are written only to ignored managed/lab75-resources.local.json. No shared key, personal login, built-in tools, unused MCP/skills, vaults or mounted repositories are inherited. Each session is checked against its pinned inventory before sending a prompt. Supported models/effort come from the pinned agent versions.

The adapter reuses the shared stream-before-send runner, validates sevt_ custom calls and reports in host code, records session/event/effect mappings, limits host answers, and budgets every session at thirty USD cents with a maximum total reference cap of three hundred cents. Calls are never automatically retried. Cancellation attempts interrupt, idle confirmation and archive through the shared runner. Cleanup uncertainty and unknown costs block readiness. These native schemas were checked against installed official SDK 0.133.0; live account behavior and billing are not established by offline tests. Cloud files never directly access Windows worktrees.


## Challenge

Compare hidden-boundary with happy-rework. Explain why review plus independent acceptance catches failures that worker-authored tests miss. Inspect crash-resume costs and show planner/T1 each appear only once.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Correct ONLY panel 2 dependency graph and panel 4 first-step caption, keeping all six panel boundaries, dimensions, astronaut, styling and other content unchanged. Panel 2 show TWO waves: Wave 1 = T1 tags. Wave 2 = T2 search AND T3 report concurrently. Graph T1 forks into T2/T3, not T1->T2->T3 and not three waves. Both wave-2 tasks fork from the integration SHA after T1. Panel 4 first-step caption should read 'Select interruption-after-wave-one scenario', not happy path, before interrupt and durable resume.
````

COPY PROMPT END
