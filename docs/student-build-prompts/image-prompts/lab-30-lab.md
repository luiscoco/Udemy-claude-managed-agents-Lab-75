# Lab 30 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 30 — Lab walkthrough"; then "Host task board and completion gates: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Standing with one boot on a platform and pointing at a diagram, side view with one arm extended toward the evidence. The prop illustrates Host task board and completion gates. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Start the three-step offline board and compare agent claim with host task states."
Teaching context for the visual explanation (do not print this entire paragraph): Start the three-step offline board and compare agent claim with host task states.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Attempt review or publish completion before dependencies are done; inspect the correlated is_error result."
Teaching context for the visual explanation (do not print this entire paragraph): Attempt review or publish completion before dependencies are done; inspect the correlated is_error result.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Complete draft, review and publish with exact checked evidence in order."
Teaching context for the visual explanation (do not print this entire paragraph): Complete draft, review and publish with exact checked evidence in order.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Replay a tool event ID and confirm no second effect."
Teaching context for the visual explanation (do not print this entire paragraph): Replay a tool event ID and confirm no second effect.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Checked evidence with dependencies and versions enforced."
Teaching context for the visual explanation (do not print this entire paragraph): Checked evidence with dependencies and versions enforced. The host board validates completion independently of agent claims. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Try a plan change and locate the deterministic accepting or refusing gate."
Teaching context for the visual explanation (do not print this entire paragraph): Try a plan change and locate the deterministic accepting or refusing gate. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Start a three-step board or one of the blocked-review, refused-completion, validated-completion and invalid-plan-replacement fixtures. The buttons call `update_task` with the selected task version and checked evidence. Replay the last event ID to test idempotency.


## Evidence to inspect

Compare the agent claim with host task rows and each correlated result. `create_task`, `update_task`, `list_tasks` and `get_task` have strict input schemas. A duplicate event ID returns the recorded result and applies no second effect. A conflicting payload for the same ID is rejected. Completion checks dependencies, expected version and an exact host evidence marker before changing status.


## Limitations

The fixture is authored and reports no provider calls. It does not prove a live custom-tool result was accepted by Managed Agents. TodoWrite and Claude Code TaskCreate/TaskUpdated labels are historical only. Live execution needs a dedicated pinned Managed agent and a separate result-sending adapter.


## Challenge

Try a plan change and locate the deterministic accepting or refusing gate.

```powershell
node --import tsx --test tests/lab30-todo-tracking.test.ts
node scripts/lab30-browser-demonstration.mjs
```

Routes: `POST /api/c30/run`, `POST /api/c30/tools` and `GET /api/c30/code`. See the [checkpoint](docs/lab30-checkpoint.md).


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END
