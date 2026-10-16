import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { aggregateSchema, chartSchema, comparisonSchema, lab71ToolSchema, profileSchema, reportSchema,
  salesMonths, salesProducts, salesRegions, type Quality, type SalesMetric, type SalesReport } from '../../shared/lab71-data-analysis-agent.js';

export function readCsv(text: string): string[][] {
  if (text.length > 65536) throw new Error('CSV too large.');
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false, closed = false;
  const field = () => { row.push(cell); cell = ''; closed = false; if (row.length > 16) throw new Error('Too many CSV columns.'); };
  const record = () => { field(); rows.push(row); row = []; if (rows.length > 1000) throw new Error('Too many CSV rows.'); };
  for (let index = 0; index < text.length; index++) { const char = text[index]!;
    if (quoted) { if (char === '"') { if (text[index + 1] === '"') { cell += '"'; index++; } else { quoted = false; closed = true; } }
      else cell += char; continue; }
    if (closed && char !== ',' && char !== '\r' && char !== '\n') throw new Error('Unexpected text after CSV quote.');
    if (char === '"') { if (cell || closed) throw new Error('Quote inside unquoted CSV cell.'); quoted = true; }
    else if (char === ',') field();
    else if (char === '\r' || char === '\n') { record(); if (char === '\r' && text[index + 1] === '\n') index++; }
    else cell += char;
  }
  if (quoted) throw new Error('Unclosed CSV quote.'); if (cell || row.length || closed) record(); return rows;
}
const rowSchema = z.strictObject({ month: z.enum(salesMonths), region: z.enum(salesRegions), product: z.enum(salesProducts),
  units: z.number().int().nonnegative().nullable(), revenue_eur: z.number().nonnegative().nullable(),
  returns: z.number().int().nonnegative().nullable(), notes: z.string().max(500) });
export type SalesRow = z.infer<typeof rowSchema>;
export function parseSales(text: string): SalesRow[] {
  const [header, ...rows] = readCsv(text); const expected = ['month', 'region', 'product', 'units', 'revenue_eur', 'returns', 'notes'];
  if (JSON.stringify(header) !== JSON.stringify(expected)) throw new Error('Unexpected sales CSV header.');
  return rows.map(cells => { if (cells.length !== expected.length) throw new Error('Sales CSV column count mismatch.');
    const numeric = (index: number) => cells[index]!.trim() === '' ? null : Number(cells[index]!.trim());
    return rowSchema.parse({ month: cells[0], region: cells[1], product: cells[2], units: numeric(3),
      revenue_eur: numeric(4), returns: numeric(5), notes: cells[6] }); });
}
export function quantile(values: number[], p: number): number | null {
  if (p < 0 || p > 1) throw new Error('Invalid quantile.'); if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), index = (sorted.length - 1) * p, lower = Math.floor(index), fraction = index - lower;
  return sorted[lower]! + fraction * (sorted[Math.min(lower + 1, sorted.length - 1)]! - sorted[lower]!);
}
export function qualityRows(rows: SalesRow[], quality: Quality) {
  const seen = new Set<string>(); const unique: SalesRow[] = []; let duplicates = 0;
  for (const row of rows) { const key = JSON.stringify([row.month, row.region, row.product, row.units, row.revenue_eur, row.returns, row.notes]);
    if (seen.has(key)) duplicates++; else { seen.add(key); unique.push(row); } }
  const fences = salesProducts.map(product => { const values = unique.filter(row => row.product === product && row.units !== null).map(row => row.units!);
    const q1 = quantile(values, 0.25), q3 = quantile(values, 0.75); const iqr = q1 !== null && q3 !== null ? q3 - q1 : null;
    return { product, q1, q3, lower: iqr === null ? null : q1! - 1.5 * iqr, upper: iqr === null ? null : q3! + 1.5 * iqr }; });
  const outlier = (row: SalesRow) => { const fence = fences.find(item => item.product === row.product)!;
    return row.units !== null && fence.lower !== null && fence.upper !== null && (row.units < fence.lower || row.units > fence.upper); };
  const outliers = unique.filter(outlier).length;
  return { rows: quality === 'raw' ? [...rows] : unique.filter(row => !outlier(row)), quality,
    inputRows: rows.length, duplicateRows: duplicates, outlierRows: outliers,
    removedDuplicates: quality === 'clean' ? duplicates : 0, removedOutliers: quality === 'clean' ? outliers : 0,
    quantile: 'Type 7: linear interpolation at (n-1)*p; fences per product on all deduplicated months.', fences };
}
const unitFor = (metric: SalesMetric, operation?: string) => operation === 'count' ? 'rows' :
  ({ units: 'units', revenue_eur: 'EUR', returns: 'returns', return_rate: '%', avg_price_eur: 'EUR/unit' } as const)[metric];
export type GroupValue = { label: string; value: number | null; unit: string; n: number; skippedEmpty: number; zeroDenominator: boolean };
export function computeAggregate(rows: SalesRow[], rawInput: unknown) {
  const input = aggregateSchema.parse(rawInput), selected = qualityRows(rows, input.quality);
  const filtered = selected.rows.filter(row => input.months.includes(row.month)); const groups = new Map<string, SalesRow[]>();
  for (const row of filtered) { const label = input.groupBy === 'all' ? 'All selected rows' : row[input.groupBy];
    if (!groups.has(label)) groups.set(label, []); groups.get(label)!.push(row); }
  if (!groups.size && input.groupBy === 'all') groups.set('All selected rows', []);
  const values: GroupValue[] = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([label, entries]) => {
    const ratio = ['return_rate', 'avg_price_eur'].includes(input.metric); let eligible: SalesRow[], value: number | null, zeroDenominator = false;
    if (ratio) { const numerator = input.metric === 'return_rate' ? 'returns' : 'revenue_eur';
      eligible = entries.filter(row => row[numerator] !== null && row.units !== null);
      const sumUnits = eligible.reduce((sum, row) => sum + row.units!, 0), sumNumerator = eligible.reduce((sum, row) => sum + row[numerator]!, 0);
      zeroDenominator = sumUnits === 0; value = !eligible.length || zeroDenominator ? null : sumNumerator / sumUnits * (input.metric === 'return_rate' ? 100 : 1);
    } else { const metric = input.metric as 'units' | 'revenue_eur' | 'returns'; eligible = entries.filter(row => row[metric] !== null);
      const numbers = eligible.map(row => row[metric]!); const sum = numbers.reduce((total, number) => total + number, 0);
      value = input.operation === 'count' ? numbers.length : !numbers.length ? null : input.operation === 'sum' ? sum :
        input.operation === 'mean' ? sum / numbers.length : input.operation === 'median' ? quantile(numbers, 0.5) :
          input.operation === 'min' ? Math.min(...numbers) : Math.max(...numbers);
    }
    return { label, value, unit: unitFor(input.metric, input.operation), n: eligible.length, skippedEmpty: entries.length - eligible.length, zeroDenominator };
  });
  const { rows: _rows, ...qualityChoices } = selected; return { kind: 'aggregate' as const, input, values, qualityChoices,
    n: values.reduce((sum, value) => sum + value.n, 0), skippedEmpty: values.reduce((sum, value) => sum + value.skippedEmpty, 0) };
}
export function comparePeriods(rows: SalesRow[], rawInput: unknown) {
  const input = comparisonSchema.parse(rawInput); const ratio = ['return_rate', 'avg_price_eur'].includes(input.metric);
  const reduce = (month: typeof salesMonths[number]) => computeAggregate(rows, { quality: input.quality, metric: input.metric,
    operation: ratio ? 'ratio_of_sums' : 'sum', groupBy: 'all', months: [month] }).values[0]!;
  const from = reduce(input.fromMonth), to = reduce(input.toMonth);
  const absolute = from.value === null || to.value === null ? null : to.value - from.value;
  const percent = absolute === null || from.value === 0 ? null : absolute / from.value! * 100;
  return { kind: 'comparison' as const, input, from, to, absolute, percent, n: from.n + to.n, skippedEmpty: from.skippedEmpty + to.skippedEmpty,
    unit: unitFor(input.metric), outcome: absolute === null ? 'no-data' : from.value === 0 ? 'zero-base-percent-undefined' : 'compared' };
}
type Computation = { id: string; kind: 'profile'; input: z.infer<typeof profileSchema>; output: { rowCount: number; missingRevenue: number;
  duplicateRows: number; outlierRows: number; n: number; skippedEmpty: number; removedDuplicates: number; removedOutliers: number } }
  | { id: string; kind: 'aggregate'; input: z.infer<typeof aggregateSchema>; output: ReturnType<typeof computeAggregate> }
  | { id: string; kind: 'comparison'; input: z.infer<typeof comparisonSchema>; output: ReturnType<typeof comparePeriods> };
const escapeXml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
type Chart = { id: string; computationId: string; quality: Quality; svg: string; values: GroupValue[] };
export class AnalysisLab {
  readonly id = randomUUID(); readonly computations: Computation[] = []; readonly charts: Chart[] = [];
  constructor(private readonly rows: SalesRow[]) {}
  tool(raw: unknown) { const call = lab71ToolSchema.parse(raw);
    if (this.computations.length >= 30 || this.charts.length >= 10) throw new Error('Analysis ledger capacity reached.');
    if (call.name === 'make_chart') { const input = chartSchema.parse(call.input); const computation = this.computations.find(item => item.id === input.computationId);
      if (!computation || computation.kind !== 'aggregate') throw new Error('Chart requires an existing aggregate computation.');
      const values = computation.output.values; const max = Math.max(1, ...values.map(value => value.value ?? 0));
      const height = 100 + values.length * 42; const bars = values.map((value, index) => `<text x="10" y="${65 + index * 42}">${escapeXml(value.label)}</text><rect x="150" y="${48 + index * 42}" width="${Math.max(0, (value.value ?? 0) / max * 330).toFixed(2)}" height="24" fill="#1769aa"/><text x="490" y="${65 + index * 42}">${value.value === null ? 'no data' : value.value.toFixed(2)}</text>`).join('');
      const chart: Chart = { id: `G${this.charts.length + 1}`, computationId: computation.id, quality: computation.input.quality,
        values: structuredClone(values), svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 ${height}" role="img" aria-label="${escapeXml(input.title)}"><rect width="620" height="${height}" fill="white"/><g font-family="sans-serif" font-size="15" fill="#142c46"><text x="10" y="25">${escapeXml(input.title)} (${escapeXml(values[0]?.unit ?? '')})</text>${bars}</g></svg>` };
      this.charts.push(structuredClone(chart)); return chart;
    }
    const id = `C${this.computations.length + 1}`; let computation: Computation;
    if (call.name === 'profile_dataset') { const selected = qualityRows(this.rows, call.input.quality);
      computation = { id, kind: 'profile', input: call.input, output: { rowCount: selected.rows.length,
        missingRevenue: selected.rows.filter(row => row.revenue_eur === null).length, duplicateRows: selected.duplicateRows, outlierRows: selected.outlierRows,
        n: selected.rows.length, skippedEmpty: selected.rows.filter(row => row.units === null || row.revenue_eur === null || row.returns === null).length,
        removedDuplicates: selected.removedDuplicates, removedOutliers: selected.removedOutliers } }; }
    else if (call.name === 'aggregate') computation = { id, kind: 'aggregate', input: call.input, output: computeAggregate(this.rows, call.input) };
    else computation = { id, kind: 'comparison', input: call.input, output: comparePeriods(this.rows, call.input) };
    this.computations.push(structuredClone(computation)); return computation;
  }
  verify(raw: unknown) { const parsed = reportSchema.safeParse(raw); if (!parsed.success) return { valid: false, errors: ['Closed report schema rejected.'], warnings: [] as string[] };
    const report = parsed.data; const errors: string[] = [], warnings: string[] = [];
    for (const [index, finding] of report.findings.entries()) { const computation = this.computations.find(item => item.id === finding.computationId);
      if (!computation) { errors.push(`Finding ${index + 1}: unknown computation.`); continue; }
      if (computation.input.quality !== report.quality) errors.push(`Finding ${index + 1}: quality choice differs.`);
      const evidence = computation.kind === 'aggregate' ? computation.output.values.map(item => ({ value: item.value, unit: item.unit })) :
        computation.kind === 'comparison' ? [{ value: computation.output.absolute, unit: computation.output.unit }, { value: computation.output.percent, unit: '%' }] :
          Object.values(computation.output).map(value => ({ value, unit: 'rows' }));
      if (!evidence.some(item => item.value !== null && item.unit === finding.unit && Math.abs(item.value - finding.value) <= 0.005 + Number.EPSILON))
        errors.push(`Finding ${index + 1}: value/unit absent from computation within 0.005 tolerance.`);
      if (/\d/.test(finding.statement)) warnings.push(`Finding ${index + 1}: numeric prose is unchecked; only the explicit value field was matched.`);
    }
    for (const id of report.chartIds) { const chart = this.charts.find(item => item.id === id);
      if (!chart) errors.push(`Unknown chart ${id}.`); else if (chart.quality !== report.quality) errors.push(`Chart ${id}: quality differs.`); }
    if (report.commentary.trim()) warnings.push('Uncited commentary is not verified.');
    return { valid: errors.length === 0, errors, warnings, note: 'Evidence matching does not establish causal or sensible interpretation.' };
  }
  scripted(dispatch: (input: unknown) => unknown = input => this.tool(input)) { dispatch({ name: 'profile_dataset', input: { quality: 'clean' } });
    const aggregate = dispatch({ name: 'aggregate', input: { quality: 'clean', metric: 'revenue_eur', operation: 'sum', groupBy: 'month', months: [...salesMonths] } }) as Extract<Computation, { kind: 'aggregate' }>;
    const comparison = dispatch({ name: 'compare_periods', input: { quality: 'clean', metric: 'revenue_eur', fromMonth: salesMonths[0], toMonth: salesMonths[5] } }) as Extract<Computation, { kind: 'comparison' }>;
    const chart = dispatch({ name: 'make_chart', input: { computationId: aggregate.id, title: 'Clean monthly revenue' } }) as Chart;
    const report: SalesReport = { title: 'Fictional sales evidence review', quality: 'clean', findings: [
      { statement: 'January revenue sums eligible nonempty revenue cells.', value: aggregate.output.values[0]!.value!, unit: 'EUR', computationId: aggregate.id },
      { statement: 'June versus January absolute revenue change.', value: comparison.output.absolute!, unit: 'EUR', computationId: comparison.id }],
      chartIds: [chart.id], commentary: '' };
    return { report, verification: this.verify(report) };
  }
  snapshot() { return { id: this.id, source: 'offline-host-analysis', computations: structuredClone(this.computations), charts: structuredClone(this.charts),
    note: 'Notes are untrusted read-only data; charts use ledger numbers only.' }; }
}
export const authoredSales = () => parseSales(readFileSync(new URL('../../fixtures/lab71/sales.csv', import.meta.url), 'utf8'));
