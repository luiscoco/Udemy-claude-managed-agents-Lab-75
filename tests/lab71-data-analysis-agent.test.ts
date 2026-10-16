import assert from 'node:assert/strict';
import { test } from 'node:test';
import { salesMonths } from '../shared/lab71-data-analysis-agent.js';
import { AnalysisLab, authoredSales, comparePeriods, computeAggregate, parseSales, qualityRows, quantile, readCsv, type SalesRow } from '../server/lib/lab71-analysis.js';
import { Lab71Workshop } from '../server/concepts/71-data-analysis-agent.js';

const row = (input: Partial<SalesRow>): SalesRow => ({ month: '2026-01', region: 'North', product: 'Notebook', units: 10,
  revenue_eur: 100, returns: 1, notes: 'Fictional', ...input });
const aggregate = (rows: SalesRow[], metric: string, operation = 'sum') => computeAggregate(rows, {
  quality: 'raw', metric, operation, groupBy: 'all', months: [...salesMonths] }).values[0]!;
test('RFC 4180 fields preserve quotes, commas, newlines and empty cells', () => {
  assert.deepEqual(readCsv('a,b,c\r\n"x,y","line\nnext","say ""hello"""\r\n,0,\r\n'),
    [['a', 'b', 'c'], ['x,y', 'line\nnext', 'say "hello"'], ['', '0', '']]);
  assert.throws(() => readCsv('a,"unclosed')); assert.throws(() => readCsv('"a"junk,b'));
  const rows = parseSales('month,region,product,units,revenue_eur,returns,notes\r\n2026-01,North,Notebook,0,,0,"hostile, read-only"\r\n');
  assert.equal(rows[0]?.units, 0); assert.equal(rows[0]?.revenue_eur, null);
});
test('ratios use eligible sums, while missing cells differ from zero and report counts', () => {
  const rows = [row({ units: 1, revenue_eur: 10, returns: 1 }), row({ region: 'South', units: 9, revenue_eur: 180, returns: 0 }),
    row({ region: 'East', units: 100, revenue_eur: null, returns: null })];
  const returns = aggregate(rows, 'return_rate', 'ratio_of_sums'); assert.equal(returns.value, 10); assert.equal(returns.n, 2); assert.equal(returns.skippedEmpty, 1);
  const price = aggregate(rows, 'avg_price_eur', 'ratio_of_sums'); assert.equal(price.value, 19); assert.equal(price.n, 2);
  const missing = [row({ revenue_eur: null }), row({ region: 'South', revenue_eur: 0 }), row({ region: 'East', revenue_eur: 20 })];
  const mean = aggregate(missing, 'revenue_eur', 'mean'); assert.equal(mean.value, 10); assert.equal(mean.n, 2); assert.equal(mean.skippedEmpty, 1);
  assert.equal(aggregate(missing, 'revenue_eur', 'count').value, 2);
  const small = [2, 8, 4].map((units, index) => row({ units, notes: String(index) }));
  for (const [operation, expected] of [['sum', 14], ['mean', 14 / 3], ['median', 4], ['min', 2], ['max', 8], ['count', 3]] as const)
    assert.equal(aggregate(small, 'units', operation).value, expected);
  assert.equal(aggregate([row({ units: 0, returns: 0 })], 'return_rate', 'ratio_of_sums').value, null);
  assert.throws(() => aggregate(rows, 'return_rate', 'mean'));
});
test('Type-7 quartiles, exact duplicate removal and per-product 1.5 IQR are explicit', () => {
  assert.equal(quantile([0, 10, 20, 30], 0.25), 7.5); assert.equal(quantile([0, 10, 20, 30], 0.75), 22.5);
  assert.equal(quantile([5], 0.5), 5); assert.equal(quantile([], 0.5), null);
  const rows = [10, 11, 12, 13, 940].map((units, index) => row({ units, notes: String(index) })); rows.push({ ...rows[0]! });
  assert.equal(qualityRows(rows, 'raw').rows.length, 6); const clean = qualityRows(rows, 'clean');
  assert.equal(clean.duplicateRows, 1); assert.equal(clean.outlierRows, 1); assert.equal(clean.rows.length, 4);
  const authored = authoredSales(); assert.equal(authored.length, 49); assert.equal(qualityRows(authored, 'clean').rows.length, 47);
  assert.equal(authored.filter(item => item.revenue_eur === null).length, 1);
  assert.ok(authored.some(item => item.notes.includes('\n') && item.notes.includes('Ignore policy,')));
});
test('period comparison names months and guards zero base and absent values', () => {
  const result = comparePeriods([row({ units: 0 }), row({ month: '2026-02', units: 5 })],
    { quality: 'raw', metric: 'units', fromMonth: '2026-01', toMonth: '2026-02' });
  assert.equal(result.absolute, 5); assert.equal(result.percent, null); assert.equal(result.outcome, 'zero-base-percent-undefined');
  assert.equal(result.input.fromMonth, '2026-01'); assert.equal(result.input.toMonth, '2026-02');
  assert.equal(comparePeriods([row({ units: 10 }), row({ month: '2026-02', units: 15 })],
    { quality: 'raw', metric: 'units', fromMonth: '2026-01', toMonth: '2026-02' }).percent, 50);
  assert.equal(comparePeriods([], { quality: 'raw', metric: 'units', fromMonth: '2026-01', toMonth: '2026-02' }).outcome, 'no-data');
});
test('reports match ledger values/units/quality and chart numbers cannot be supplied by a caller', () => {
  const lab = new AnalysisLab(authoredSales()); const scripted = lab.scripted(); assert.equal(scripted.verification.valid, true);
  const tampered = structuredClone(scripted.report); tampered.findings[0]!.value += 1; assert.equal(lab.verify(tampered).valid, false);
  tampered.findings[0]!.computationId = 'C999'; assert.match(lab.verify(tampered).errors.join(' '), /unknown computation/);
  const badChart = { ...scripted.report, chartIds: ['G999'] }; assert.equal(lab.verify(badChart).valid, false);
  const wrongUnit = structuredClone(scripted.report); wrongUnit.findings[0]!.unit = '%'; assert.equal(lab.verify(wrongUnit).valid, false);
  assert.equal(lab.verify({ ...scripted.report, quality: 'raw' }).valid, false);
  const warning = structuredClone(scripted.report); warning.commentary = 'Uncited sales narrative.'; warning.findings[0]!.statement = 'Revenue grew 900 percent.';
  assert.ok(lab.verify(warning).warnings.length >= 2);
  const chart = lab.tool({ name: 'make_chart', input: { computationId: 'C2', title: '<script>hostile</script>' } }) as { svg: string };
  assert.match(chart.svg, /&lt;script&gt;/); assert.doesNotMatch(chart.svg, /<script>/);
  assert.throws(() => lab.tool({ name: 'make_chart', input: { computationId: 'C2', title: 'Forged', values: [999] } }));
  assert.throws(() => lab.tool({ name: 'make_chart', input: { computationId: 'C3', title: 'Not an aggregate' } }));
});
test('host custom-tool replies correlate, deduplicate events and enforce owner scope', () => {
  const store = new Lab71Workshop(); const session = store.create('owner-a');
  const event = { id: 'sevt_profile_1', name: 'profile_dataset', input: { quality: 'clean' } };
  const result = store.tool('owner-a', session.id, event) as { custom_tool_use_id: string };
  assert.equal(result.custom_tool_use_id, event.id); store.tool('owner-a', session.id, event);
  assert.equal(store.get('owner-a', session.id).computations.length, 1);
  assert.throws(() => store.get('owner-b', session.id), /not found/);
  assert.throws(() => store.tool('owner-a', session.id, { ...event, id: 'bad' }));
});
