import { useRef, useState } from 'react';
import { lab52ReportSchema } from '../../shared/lab52-evals';
import type { z } from 'zod';

type Report = z.infer<typeof lab52ReportSchema>;
export default function Concept52Evals() {
  const owner = useRef(crypto.randomUUID()); const [variant, setVariant] = useState<'baseline' | 'regression' | 'recovered'>('baseline');
  const [judge, setJudge] = useState<'none' | 'agree' | 'disagree' | 'invalid-json'>('none');
  const [trials, setTrials] = useState(2); const [baseline, setBaseline] = useState<Report>();
  const [report, setReport] = useState<Report>(); const [comparison, setComparison] = useState('');
  const [calibration, setCalibration] = useState(''); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Offline authored evals make zero provider calls.');
  async function post(path: string, body: object) { const response = await fetch(`/api/c52/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data; }
  async function act(task: () => Promise<void>) { setBusy(true); try { await task(); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Eval action failed.'); } finally { setBusy(false); } }
  function run() { void act(async () => { const checked = lab52ReportSchema.parse(await post('run', { variant, trials, judge }));
    setReport(checked); if (variant === 'baseline') setBaseline(checked);
    setStatus(`${variant} evaluated: ${checked.cases.length} case-trials; ${checked.regressions.length} regressions; promotion ${checked.promotable ? 'allowed' : 'blocked'}.`); }); }
  function pairwise() { if (!baseline || !report) return; void act(async () => {
    const result = await post('pairwise', { baselineRunId: baseline.id, candidateRunId: report.id }) as {
      deltaPassRate: number; regressions: string[]; promotionAllowed: boolean };
    setComparison(`Pass-rate delta ${result.deltaPassRate.toFixed(2)}; regressions: ${result.regressions.join(', ') || 'none'}; promotion allowed: ${result.promotionAllowed}.`);
  }); }
  function promote() { if (!report) return; void act(async () => { await post('promote', { runId: report.id });
    setStatus(`Local promotion pointer set to ${report.id}. No agent or deployment was changed.`); }); }
  function calibrate(scenario: 'agreement' | 'disagreement' | 'invalid-json') { void act(async () => {
    const result = await post('calibrate', { scenario }) as { hostVerdict: string; judgeVerdict: string; usableForPromotion: boolean };
    setCalibration(`Host: ${result.hostVerdict}; optional judge: ${result.judgeVerdict}; usable for promotion: ${result.usableForPromotion}.`); }); }
  return <section aria-labelledby="lab52-heading"><h2 id="lab52-heading">Evals, judges and regression baselines</h2>
    <p>Evaluate the fictional support desk with holdout effect labels. The host ledger and closed report determine safety; an optional authored judge can agree, disagree or return invalid JSON.</p>
    <div className="lab-controls"><label>Candidate<select value={variant} disabled={busy} onChange={event => setVariant(event.target.value as typeof variant)}>
      <option value="baseline">Baseline</option><option value="regression">Regression</option><option value="recovered">Recovered</option></select></label>
      <label>Trials<select value={trials} disabled={busy} onChange={event => setTrials(Number(event.target.value))}>
        {[1, 2, 3].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Optional judge<select value={judge} disabled={busy} onChange={event => setJudge(event.target.value as typeof judge)}>
        <option value="none">No judge</option><option value="agree">Agrees</option><option value="disagree">Disagrees</option>
        <option value="invalid-json">Invalid JSON</option></select></label></div>
    <div className="lab-controls"><button disabled={busy} onClick={run}>Run offline eval</button>
      <button disabled={busy || !baseline || !report || report.variant === 'baseline'} onClick={pairwise}>Compare with baseline</button>
      <button disabled={busy || !report?.promotable} onClick={promote}>Promote local result</button></div>
    <div className="lab-controls"><button disabled={busy} onClick={() => calibrate('agreement')}>Judge agreement</button>
      <button disabled={busy} onClick={() => calibrate('disagreement')}>Judge disagreement</button>
      <button disabled={busy} onClick={() => calibrate('invalid-json')}>Invalid judge JSON</button></div>
    {calibration && <p>Calibration: {calibration}</p>}{comparison && <p>Pairwise: {comparison}</p>}
    {report && <><p>Report <code>{report.id}</code>; host pass rate {Math.round(report.hostPassRate * 100)}%; safety {report.safetyPass ? 'pass' : 'fail'};
      baseline {report.baselineRunId ?? 'missing'}; promotable {String(report.promotable)}.</p>
      <p>SDK {report.sdkVersion}; {report.api}; model and agent version unknown offline. Latency, tokens and cost unknown; provider calls {report.providerCalls}.</p>
      <div className="lab-results"><h3>Holdout results</h3><ol>{report.cases.map(item => <li key={`${item.caseId}-${item.trial}`}>
        <strong>{item.caseId}, trial {item.trial}: {item.hostPass ? 'pass' : 'fail'}</strong>
        <p>Claimed refunds {item.claimedRefunds}; ledger refunds {item.actualRefunds}; safety {item.safetyPass ? 'pass' : 'fail'};
          judge {item.judge}; tool {item.toolRejected ? 'rejected' : 'accepted'}.</p><p>{item.evidence}. Event {item.eventId}.</p></li>)}</ol></div>
      <p>Regressions: {report.regressions.join(', ') || 'none'}. Failures: {report.failures.join(', ') || 'none'}.</p></>}
    <p role="status" aria-label="Lab 52 status">{status}</p>
    <p>Run a baseline first. The regression candidate makes false refund claims despite host rejection; missing baseline or failed safety always blocks local promotion.</p>
  </section>;
}
