import { useRef, useState } from 'react';
import { salesMonths, type SalesReport } from '../../shared/lab71-data-analysis-agent';

type Group = { label: string; value: number | null; unit: string; n: number; skippedEmpty: number; zeroDenominator: boolean };
type Computation = { id: string; kind: string; input: { quality: string; metric?: string }; output: { values?: Group[]; n?: number; skippedEmpty?: number; [key: string]: unknown } };
type Chart = { id: string; computationId: string; quality: string; svg: string };
type Verification = { valid: boolean; errors: string[]; warnings: string[]; note?: string };
type Snapshot = { id: string; computations: Computation[]; charts: Chart[]; toolEvents: string[];
  report: SalesReport | null; verification: Verification | null };
export default function Concept71DataAnalysisAgent() {
  const owner = useRef(crypto.randomUUID()); const [snapshot, setSnapshot] = useState<Snapshot>();
  const [report, setReport] = useState<SalesReport | null>(null); const [verification, setVerification] = useState<Verification | null>(null);
  const [quality, setQuality] = useState('clean'), [metric, setMetric] = useState('revenue_eur'), [operation, setOperation] = useState('sum');
  const [groupBy, setGroupBy] = useState('month'), [month, setMonth] = useState('all');
  const [status, setStatus] = useState('Ready. Create an owner-scoped analysis ledger.'); const [busy, setBusy] = useState(false);
  async function api(path: string, body?: unknown) { const response = await fetch(`/api/c71/${path}`, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data; }
  function load(data: Snapshot) { setSnapshot(data); setReport(data.report); setVerification(data.verification); }
  async function act(action: 'create' | 'profile' | 'aggregate' | 'compare' | 'chart' | 'scripted' | 'verify' | 'tamper') {
    setBusy(true); try {
      if (action === 'create') { load(await api('sessions', {}) as Snapshot); setStatus('Analysis session created; 49 raw rows, one duplicate, one missing revenue and one unit outlier.'); return; }
      if (!snapshot) return; const root = `sessions/${snapshot.id}`;
      if (action === 'scripted') { load(await api(`${root}/scripted`, {}) as Snapshot); setStatus('Scripted analyst completed; report verified against recorded computations and chart.'); return; }
      if (action === 'verify' || action === 'tamper') { if (!report) return; const proposed = structuredClone(report);
        if (action === 'tamper') { proposed.findings[0]!.value += 999; proposed.findings[0]!.computationId = 'C999'; }
        const result = await api(`${root}/verify`, { report: proposed }) as Verification;
        setReport(proposed); setVerification(result); setStatus(`${action === 'tamper' ? 'Tampered' : 'Current'} report ${result.valid ? 'verified' : 'rejected'}; ledger unchanged.`); return;
      }
      let call: unknown;
      if (action === 'profile') call = { name: 'profile_dataset', input: { quality } };
      else if (action === 'aggregate') call = { name: 'aggregate', input: { quality, metric, operation, groupBy, months: month === 'all' ? [...salesMonths] : [month] } };
      else if (action === 'compare') call = { name: 'compare_periods', input: { quality, metric, fromMonth: salesMonths[0], toMonth: salesMonths[5] } };
      else { const aggregate = [...snapshot.computations].reverse().find(item => item.kind === 'aggregate');
        if (!aggregate) throw new Error('Record an aggregate first.'); call = { name: 'make_chart', input: { computationId: aggregate.id, title: `${aggregate.input.quality} sales ledger values` } }; }
      const result = await api(`${root}/tool`, call); load(await api(root) as Snapshot);
      setStatus(`Host tool result ${result.custom_tool_use_id}; recorded ${result.output.id}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Analysis failed.'); } finally { setBusy(false); }
  }
  const ratios = ['return_rate', 'avg_price_eur'].includes(metric);
  return <section aria-labelledby="lab71-heading"><h2 id="lab71-heading">A data analysis agent</h2>
    <p>Analyze a six-month, four-region, two-product CSV. Notes remain untrusted data; every reported number must match a computation ledger entry.</p>
    <div className="lab-controls"><button disabled={busy} onClick={() => void act('create')}>Create analysis session</button>
      <label>Quality <select value={quality} onChange={event => setQuality(event.target.value)}><option>raw</option><option>clean</option></select></label>
      <label>Metric <select value={metric} onChange={event => { const value = event.target.value; setMetric(value);
        setOperation(['return_rate', 'avg_price_eur'].includes(value) ? 'ratio_of_sums' : 'sum'); }}>
        {['units', 'revenue_eur', 'returns', 'return_rate', 'avg_price_eur'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Reduction <select value={operation} onChange={event => setOperation(event.target.value)}>
        {(ratios ? ['ratio_of_sums'] : ['sum', 'mean', 'median', 'min', 'max', 'count']).map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Group <select value={groupBy} onChange={event => setGroupBy(event.target.value)}>{['all', 'month', 'region', 'product'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Month scope <select value={month} onChange={event => setMonth(event.target.value)}><option value="all">All six months</option>{salesMonths.map(value => <option key={value}>{value}</option>)}</select></label></div>
    <div className="lab-controls">{(['profile', 'aggregate', 'compare', 'chart', 'scripted', 'verify', 'tamper'] as const).map(action =>
      <button key={action} disabled={busy || !snapshot || (['verify', 'tamper'].includes(action) && !report)} onClick={() => void act(action)}>
        {{ profile: 'Profile dataset', aggregate: 'Aggregate metric', compare: 'Compare January/June', chart: 'Chart last aggregate',
          scripted: 'Run scripted analyst', verify: 'Verify current report', tamper: 'Verify tampered report' }[action]}</button>)}</div>
    <p role="status" aria-label="Lab 71 status">{status}</p>
    {snapshot && <><p>Session {snapshot.id}; computations {snapshot.computations.length}; charts {snapshot.charts.length}; host tool events {snapshot.toolEvents.length}.</p>
      {snapshot.computations.map(computation => <article key={computation.id}><h3>{computation.id}: {computation.kind} / {computation.input.quality}</h3>
        {computation.output.values ? <table><thead><tr><th>Group</th><th>Value</th><th>Unit</th><th>n</th><th>Skipped empty</th></tr></thead>
          <tbody>{computation.output.values.map(value => <tr key={value.label}><td>{value.label}</td><td>{value.value === null ? 'No data / zero denominator' : value.value.toFixed(2)}</td><td>{value.unit}</td><td>{value.n}</td><td>{value.skippedEmpty}</td></tr>)}</tbody></table> :
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(computation.output, null, 2)}</pre>}
        {Boolean(computation.output.qualityChoices) && <details><summary>Quality choices and IQR fences</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(computation.output.qualityChoices, null, 2)}</pre></details>}
      </article>)}
      {snapshot.charts.map(chart => <figure key={chart.id}><img style={{ width: '100%' }} alt={`Ledger chart ${chart.id} from ${chart.computationId}`}
        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(chart.svg)}`} /><figcaption>{chart.id}: {chart.computationId}, {chart.quality} ledger numbers.</figcaption></figure>)}</>}
    {report && <article><h3>{report.title}</h3><p>Report quality: {report.quality}.</p><ul>{report.findings.map((finding, index) =>
      <li key={index}>{finding.statement} <strong>{finding.value.toFixed(2)} {finding.unit}</strong> [{finding.computationId}]</li>)}</ul>
      <p>Charts: {report.chartIds.join(', ')}.</p>{report.commentary && <p>{report.commentary}</p>}
      {verification && <><p>Verification: {verification.valid ? 'verified' : 'rejected'}.</p><ul>{verification.errors.map(error => <li key={error}>{error}</li>)}
        {verification.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul><p>{verification.note}</p></>}</article>}
    <p>Ratios are ratios of eligible sums. Clean mode uses Type-7 quartiles and per-product 1.5×IQR fences. Optional live analysis is not configured; externally supplied reports use the same verifier.</p>
  </section>;
}
