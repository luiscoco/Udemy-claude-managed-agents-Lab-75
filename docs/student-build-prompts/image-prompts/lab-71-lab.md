# Lab 71 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Use case: infographic-diagram. Create a polished, high-resolution, landscape 16:9 educational infographic for a Claude Managed Agents course.
Input reference role: STYLE AND CONTENT HIERARCHY ONLY. Match the supplied teaching-poster examples: oversized heavy navy headline with vivid orange emphasis, pale blue subtitle capsule, a friendly astronaut with a padded white spacesuit, blue gloves, navy reflective visor, boots and life-support backpack in the upper right, airy white background with subtle peach and sky-blue rounded corner shapes, pastel blue/mint/lilac/peach/pink panels, glossy technical icons, bright blue directional arrows, and a star takeaway strip. This is original artwork with new Managed Agents content. Do not copy the reference's Agent SDK claims, query() code, endpoints or server-process architecture.
Header at y=2%-25%: "How Claude Managed Agents Works" (Claude Managed Agents in orange); subtitle "Lab 71 — Lab walkthrough"; then "A data analysis agent: guided experiment". Astronaut stays in the header and does not cover text. Its unique content-specific pose: Turning over one shoulder to present a before-and-after comparison, three-quarter view with the prop beside the helmet. The prop illustrates A data analysis agent. Show the astronaut actively carrying out the learner workflow. Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.
Content structure: six individually bounded regions with varied editorial hierarchy, not six identical cards. Region 1 is a core-idea panel at x=2%-40%, y=28%-54%. Region 2 is a narrower explanation at x=42%-69%, y=28%-54%. Region 3 is a contract/evidence panel at x=71%-98%, y=28%-54%. Region 4 is a wide architecture or decision-flow diagram at x=2%-59%, y=56%-83%. Region 5 is a step-by-step check list at x=61%-98%, y=56%-83%. Region 6 is a full-width takeaway strip at x=2%-98%, y=86%-96%. Keep panels separated by white gutters. Give each a small numbered circle 1 through 6. All six regions must remain independent for synchronized audio highlighting. No embedded red rectangle.
Each region must include its exact title and summary below, plus a useful mini-diagram or visual sequence derived strictly from its teaching context. Use concise labels instead of full narration paragraphs. Use recognizable browser, session, queue, document, shield, reviewer and ledger icons where relevant. Show arrows and labeled state changes instead of generic decorative icons. Optional small dark monospace evidence chips may quote exact identifiers from the teaching context; do not invent code or execution results.
REGION 1
Title verbatim: "Prepare the baseline"
Summary verbatim: "Create a session and compare raw/clean profiles, duplicate removal and per-product IQR fences."
Teaching context for the visual explanation (do not print this entire paragraph): Create a session and compare raw/clean profiles, duplicate removal and per-product IQR fences.

REGION 2
Title verbatim: "Run the comparison"
Summary verbatim: "Aggregate numeric metrics or ratios of eligible sums; inspect n and skipped empty counts."
Teaching context for the visual explanation (do not print this entire paragraph): Aggregate numeric metrics or ratios of eligible sums; inspect n and skipped empty counts.

REGION 3
Title verbatim: "Inspect the boundary"
Summary verbatim: "Run the scripted analyst and inspect computation C IDs and ledger-derived chart G IDs."
Teaching context for the visual explanation (do not print this entire paragraph): Run the scripted analyst and inspect computation C IDs and ledger-derived chart G IDs.

REGION 4
Title verbatim: "Follow the workflow"
Summary verbatim: "Tamper a report value or citation and verify rejection without changing its evidence ledger."
Teaching context for the visual explanation (do not print this entire paragraph): Tamper a report value or citation and verify rejection without changing its evidence ledger.

REGION 5
Title verbatim: "Verify the result"
Summary verbatim: "Executable calculations and ledger-cited reports."
Teaching context for the visual explanation (do not print this entire paragraph): Executable calculations and ledger-cited reports. Scoped CSV evidence and real computations support the report and chart. Compare the result with your baseline.

REGION 6
Title verbatim: "Reflect and record"
Summary verbatim: "Explain why averaging row return rates differs from the host ratio of summed returns to summed units."
Teaching context for the visual explanation (do not print this entire paragraph): Explain why averaging row return rates differs from the host ratio of summed returns to summed units. Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.
Maintain complete readable English copy, strong navy contrast, generous spacing and clean diagram alignment. No cropped panels or tiny illegible pseudo-code. Do not import event-stream diagrams, event type labels, API fields, source paths, controls, or identifiers from the style reference. Use only the supplied lesson context. Never assign numeric status codes, handler counts, timeouts, identifier values or guaranteed effects to a condition unless the context explicitly states that exact mapping. Where the mapping is not supplied, label a refusal as rejected without inventing a code or count. Region 4 must illustrate the specified workflow, not a generic session stream. Region 5 must show evidence checks, not invented event sequences. If no code or event names are supplied, omit them entirely. Do not introduce fictional identifiers or code not present in this lesson context. Do not imply that notification alone authorizes an effect, that a local cancel archives a remote session, or that this illustration proves a live run. Small footer: "Illustrated teaching summary — inspect actual exercise evidence."

AUTHORITATIVE LESSON REFERENCE (not text to reproduce wholesale):
## Controls

Create an analysis session. Compare raw and clean profiles, select a metric/reduction/group/month scope, then aggregate it. Compare January/June and chart an existing aggregate. **Run scripted analyst** calls the same closed host tools, creates computation IDs `C1…`, a chart ID `G1…`, and a structured report. **Verify tampered report** changes a value/citation without changing the ledger; the same verifier rejects it.


## Evidence to inspect

The small RFC 4180 reader supports quoted delimiters, newlines and escaped quotes. Empty or whitespace-only numeric cells become absent values, never zero. Raw mode retains all parsed rows. Clean mode removes exact parsed-row duplicates, then whole rows whose units fall outside per-product 1.5×IQR fences. Quartiles use Type 7: linear interpolation at `(n - 1) * p`, over the entire deduplicated six-month product population before month filtering. The authored data yields 49 raw rows and 47 clean rows.

Closed tools are `profile_dataset`, `aggregate`, `compare_periods` and `make_chart`. Numeric metrics support sum, mean, median, min, max and count of nonmissing values. Every group reports eligible `n` and `skippedEmpty`; profile counts rows with any absent numeric cell. `return_rate = 100 × sum(returns) / sum(units)` over rows with both cells present. `avg_price_eur = sum(revenue_eur) / sum(units)` uses rows with both revenue and units present. A zero denominator produces no numeric value. Ratios never average row ratios.

Computations store validated input/output under stable session-local C IDs. Comparison records both named months, absolute difference and percentage change; a zero base leaves percentage undefined. Charts accept only an existing aggregate ID, read its ledger numbers and escape SVG labels. The model cannot supply chart values. Custom-tool results correlate by `sevt_` event ID; repeated delivery of an event does not duplicate the ledger entry. No built-in tools, MCP or skills bypass this boundary.

The closed report contains title, quality choice, findings with explicit value/unit/computation ID, chart IDs and optional commentary. Verification requires a known computation, matching quality, a matching recorded value/unit within absolute tolerance 0.005, and existing charts of the same quality. Unknown IDs, unsupported values and nonexistent charts are rejected. Numeric prose and uncited commentary generate warnings. Matching numbers does not establish a sensible causal conclusion.


## Limitations

This is a host-computed fictional analysis, with process-local ledgers and SVG charts drawn from recorded numbers. No live analyst adapter or billed run was tested. The verifier validates evidence membership, values, units and quality; statement meaning and causal interpretation remain review tasks.


## Challenge

Use two rows with one return out of one unit and zero returns out of nine units. Explain why the correct aggregate is ten percent while the mean of row rates is fifty percent. Then try to cite an unsupported report value.



Follow the exact lesson semantics above. Do not infer outcomes from a scenario name. If a status code, count, state transition or effect is not specified, use an inspection instruction without guessing. Preserve the six verbatim region titles and summaries. Do not copy the reference image technical labels or workflow.\nDIAGRAM SAFETY: Every conditional arrow must state its condition. Show alternative scenarios as independent branches, not one shared chain. Never group host limits with provider pauses, or local connectivity with cloud reachability. When a relation is a comparison rather than a connection, use a divider labeled Compare. Do not insert addition symbols between quantities that must stay separate. If an outcome is not explicitly supported by the lesson reference, write Inspect the result rather than inventing a guarantee.
````

COPY PROMPT END
