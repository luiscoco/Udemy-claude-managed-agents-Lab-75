# Lab 73 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 73 — Concept map"; then "An autonomous PR reviewer and fixer". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Kneeling while examining a holographic document with a magnifier, dynamic forward lean with the prop held in both hands. The prop illustrates An autonomous PR reviewer and fixer. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Route changed-line review findings to a constrained fixer and commit only after independent host gates and real tests."
Teaching context for the visual explanation (do not print this entire paragraph): Route changed-line review findings to a constrained fixer and commit only after independent host gates and real tests.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "After independent host gates and actual tests."
Teaching context for the visual explanation (do not print this entire paragraph): When should a constrained fix be committed? After independent host gates and actual tests.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "Review findings, constrained edits and independent verification govern publication."
Teaching context for the visual explanation (do not print this entire paragraph): Review findings, constrained edits and independent verification govern publication.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Run the good fix and inspect numbered diff, gates and local commit hash."
Teaching context for the visual explanation (do not print this entire paragraph): Run the good fix and inspect numbered diff, gates and local commit hash. Compare out-of-scope changes, skipped tests, unresolved findings and process timeout.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "After independent host gates and actual tests."
Teaching context for the visual explanation (do not print this entire paragraph): After independent host gates and actual tests. Review findings, constrained edits and independent verification govern publication. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Route a low-confidence finding and a question to a person without granting fixer authority."
Teaching context for the visual explanation (do not print this entire paragraph): Route a low-confidence finding and a question to a person without granting fixer authority. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Run PR review and fix creates main and feature branches, a numbered diff, a reviewer report and a constrained fix attempt. Choose good-fix, out-of-scope, skipped-tests, unresolved, malformed-review or timeout. Cancel local work aborts an active test process; no remote session exists. Session review/fix routes also permit inspecting the stages separately. Two local fix rounds are the maximum; there is no unlimited agent loop.


## Evidence to inspect

Findings contain file, line, severity, confidence, message and question. Only high-confidence, medium-or-higher non-question findings on actual changed lines reach the fixer. Other findings go to a person. Reviewer tools are read-only; the fixed write handler can change only the assigned source. Host gates independently inspect tracked and untracked paths, protected edits, bounded diff, skip/only/todo test gaming and real Node tests. A local fix commit occurs only after the gates pass, then the full suite runs again. Compare the recorded hashes with `git -C prbot-lab/runs/<id> log --oneline --all` in PowerShell. Main remains unchanged.


## Limitations

Roles are scripted fixtures using the same closed host handlers; this is not an observed Claude review. No live adapter is configured. Out-of-scope and test-gaming scenarios deliberately mutate the local fixture behind the normal tool boundary to test independent gates. No remote GitHub write is performed. Handoff commands are reviewable suggestions and require a person to select a remote. Local owner headers are not production authentication. Git worktrees and scrubbed environments do not provide OS containment against arbitrary code; use a sandbox for untrusted real repositories.


## Challenge

Submit a question on a changed line and a high-confidence finding on an unchanged line. Explain why neither can authorize a fix. Compare a green skipped test suite with host rejection.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Correct only two labels. Panel 1 PR changes caption should say 'Numbered diff scopes eligible fixer findings' instead of claiming only changed lines can be reviewed. Panel 2 Confirm commit caption should say 'Commit after gates and real tests; rerun full suite after commit' to make chronology clear. All commits are local disposable fixtures, no remote push. Preserve all six panel boundaries, dimensions, diagram layout, remaining accurate text and astronaut.
````

COPY PROMPT END
