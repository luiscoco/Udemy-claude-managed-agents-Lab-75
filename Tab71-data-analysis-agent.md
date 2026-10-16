# Lab 71: A data analysis agent

## Prerequisites

Run the local platform. This lesson includes the parent Lab 71 and supplemental 71A calculation/report rules. `fixtures/lab71/sales.csv` has six months, four regions, two products, a duplicate row, a missing revenue cell, a 940-unit outlier and a quoted hostile note. Notes remain untrusted read-only data. No model request or API key is needed.

## Controls

Create an analysis session. Compare raw and clean profiles, select a metric/reduction/group/month scope, then aggregate it. Compare January/June and chart an existing aggregate. **Run scripted analyst** calls the same closed host tools, creates computation IDs `C1…`, a chart ID `G1…`, and a structured report. **Verify tampered report** changes a value/citation without changing the ledger; the same verifier rejects it.

## Evidence to inspect

The small RFC 4180 reader supports quoted delimiters, newlines and escaped quotes. Empty or whitespace-only numeric cells become absent values, never zero. Raw mode retains all parsed rows. Clean mode removes exact parsed-row duplicates, then whole rows whose units fall outside per-product 1.5×IQR fences. Quartiles use Type 7: linear interpolation at `(n - 1) * p`, over the entire deduplicated six-month product population before month filtering. The authored data yields 49 raw rows and 47 clean rows.

Closed tools are `profile_dataset`, `aggregate`, `compare_periods` and `make_chart`. Numeric metrics support sum, mean, median, min, max and count of nonmissing values. Every group reports eligible `n` and `skippedEmpty`; profile counts rows with any absent numeric cell. `return_rate = 100 × sum(returns) / sum(units)` over rows with both cells present. `avg_price_eur = sum(revenue_eur) / sum(units)` uses rows with both revenue and units present. A zero denominator produces no numeric value. Ratios never average row ratios.

Computations store validated input/output under stable session-local C IDs. Comparison records both named months, absolute difference and percentage change; a zero base leaves percentage undefined. Charts accept only an existing aggregate ID, read its ledger numbers and escape SVG labels. The model cannot supply chart values. Custom-tool results correlate by `sevt_` event ID; repeated delivery of an event does not duplicate the ledger entry. No built-in tools, MCP or skills bypass this boundary.

The closed report contains title, quality choice, findings with explicit value/unit/computation ID, chart IDs and optional commentary. Verification requires a known computation, matching quality, a matching recorded value/unit within absolute tolerance 0.005, and existing charts of the same quality. Unknown IDs, unsupported values and nonexistent charts are rejected. Numeric prose and uncited commentary generate warnings. Matching numbers does not establish a sensible causal conclusion.

## Routes

`GET /api/c71/facts`, `GET /code`, `POST /sessions`, `GET /sessions/:id`, `POST /sessions/:id/tool`, `POST /sessions/:id/scripted`, `POST /sessions/:id/verify` and `POST /sessions/:id/query` are owner-scoped. The query route supports the offline analyst. Optional live analysis is disabled until a dedicated bounded custom-tool adapter is configured; externally supplied final JSON still uses the same verifier.

## Troubleshooting

Use `ratio_of_sums` for ratio metrics; incompatible reductions are rejected. A missing cell is skipped while a real zero remains eligible. Chart creation requires an aggregate C ID, not a comparison or unknown ID. A report must cite computations from this session and its chosen quality. Create a new session after reaching ledger bounds.

## Limitations

This is a host-computed fictional analysis, with process-local ledgers and SVG charts drawn from recorded numbers. No live analyst adapter or billed run was tested. The verifier validates evidence membership, values, units and quality; statement meaning and causal interpretation remain review tasks.

## Challenge

Use two rows with one return out of one unit and zero returns out of nine units. Explain why the correct aggregate is ten percent while the mean of row rates is fifty percent. Then try to cite an unsupported report value.

## Run locally

```powershell
npm run test:analysis
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab71-browser-demonstration.mjs
```
