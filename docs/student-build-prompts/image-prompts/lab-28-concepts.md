# Lab 28 concept map image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 28 — Concept map"; then "Errors, retries and reconciliation". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Seated at a console and pointing at the evidence screen, side view with one arm extended toward the evidence. The prop illustrates Errors, retries and reconciliation. Show the astronaut presenting the core concept. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "The objective"
Summary verbatim: "Classify authored transport, event, handler and cleanup faults while bounding read retries and reconciling uncertain mutations without duplicate effects."
Teaching context for the visual explanation (do not print this entire paragraph): Classify authored transport, event, handler and cleanup faults while bounding read retries and reconciling uncertain mutations without duplicate effects.

REGION 2
Title verbatim: "Core rule"
Summary verbatim: "Reconcile its outcome before risking a duplicate effect."
Teaching context for the visual explanation (do not print this entire paragraph): How should an uncertain mutation be retried? Reconcile its outcome before risking a duplicate effect.

REGION 3
Title verbatim: "Keep the boundary clear"
Summary verbatim: "A transport failure can leave mutation outcome uncertain."
Teaching context for the visual explanation (do not print this entire paragraph): A transport failure can leave mutation outcome uncertain.

REGION 4
Title verbatim: "How the flow works"
Summary verbatim: "Run Read rate limit and inspect three bounded GET attempts."
Teaching context for the visual explanation (do not print this entire paragraph): Run Read rate limit and inspect three bounded GET attempts. Run Missing create response and explain why another create is unsafe without an ID.

REGION 5
Title verbatim: "Evidence to inspect"
Summary verbatim: "Reconcile its outcome before risking a duplicate effect."
Teaching context for the visual explanation (do not print this entire paragraph): Reconcile its outcome before risking a duplicate effect. A transport failure can leave mutation outcome uncertain. Inspect the reported outcome and the host evidence before drawing a conclusion.

REGION 6
Title verbatim: "Put it to the test"
Summary verbatim: "Explain when reconnecting a known session is safer than creating another one."
Teaching context for the visual explanation (do not print this entire paragraph): Explain when reconnecting a known session is safer than creating another one. Record what your evidence establishes and what remains unverified.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Choose a fault and select **Run offline fault**. The `/api/c28/api` and `/api/c28/run` routes accept the same closed experiment contract; `/api/c28/code` shows the source boundary. A local deadline caps each run, and one owner may run only one experiment at a time.


## Evidence to inspect

For read rate limit, inspect the bounded GET attempts and deduplicated event IDs. For missing create response, the loopback server records the POST but the client receives no ID. For tool result failure, the host idempotency ledger records one effect before the result acknowledgment is lost. Reconnect duplicates reuses a known fixture session and deduplicates by event ID.


## Limitations

The offline fault server is loopback only. It does not model provider billing, live retries, or complete remote cleanup. Side-effecting SDK requests must set `maxRetries: 0`; bounded backoff is appropriate only for safe GET/list reads. Waiting and cleanup need separate deadlines. Cleanup marked pending means remote stop was not confirmed.


## Challenge

Explain when reconnecting a known session is safer than creating another one.

```powershell
node --import tsx --test tests/lab28-errors-retries.test.ts
node scripts/lab28-browser-demonstration.mjs
```

See the [checkpoint](docs/lab28-checkpoint.md) for actual verification.


Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Preserve all six panels and astronaut. In orange panel 4 safe GET attempts and Missing create response are SEPARATE FAULT SCENARIOS, never a pipeline. Remove arrow connecting Attempt 3 to Missing create response. Add vertical divider and small headings 'Read rate limit (safe GET)' over first branch and 'Separate case: Missing create response' over right branch. GET retries never create a session. No other content change.
````

COPY PROMPT END
