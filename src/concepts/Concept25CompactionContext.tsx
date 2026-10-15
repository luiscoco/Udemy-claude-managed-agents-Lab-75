import { useEffect, useRef, useState } from 'react';
import { lab25ResultSchema, lab25Scenarios } from '../../shared/lab25-compaction-context';
import type { Lab25Result } from '../../shared/lab25-compaction-context';
import { LiveActionButton } from '../components/LiveActionButton';

type WindowInventory = { reports: Lab25Result['reports']; eventType: string; note: string };
const show = (value: number | null) => value === null ? 'unavailable' : String(value);
export default function Concept25CompactionContext() {
  const owner = useRef(crypto.randomUUID());
  const [window, setWindow] = useState<WindowInventory>(), [scenario, setScenario] = useState<(typeof lab25Scenarios)[number]>('compacted');
  const [includeHandoff, setIncludeHandoff] = useState(true), [result, setResult] = useState<Lab25Result>();
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Ready. Inventory and offline replay never contact Anthropic.');
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  useEffect(() => { void fetch('/api/c25/window', { headers, signal: AbortSignal.timeout(5000) })
    .then(async response => { if (!response.ok) throw new Error(); setWindow(await response.json()); })
    .catch(() => setStatus('Start the backend to inspect the checked reports.')); }, []);
  async function run() { if (busy) return; setBusy(true);
    try { const response = await fetch('/api/c25/run', { method: 'POST', headers,
      body: JSON.stringify({ mode: 'scripted', scenario, includeHandoff, deadlineSeconds: 5 }), signal: AbortSignal.timeout(7000) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
      const checked = lab25ResultSchema.parse(data); setResult(checked);
      setStatus(`Offline replay: ${checked.observedCompaction.length} authored compaction event(s); ${checked.providerCalls} provider calls.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Replay failed.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="lab25-heading"><h2 id="lab25-heading">Context growth and compaction evidence</h2>
    <p>A documented compaction event proves occurrence when observed. Cumulative usage does not tell you the current free context or platform trigger threshold.</p>
    <h3>Checked report inventory</h3><ul>{window?.reports.map(report => <li key={report.id}><code>{report.path}</code> · {report.bytes} bytes · SHA-256 <code>{report.sha256.slice(0, 16)}…</code></li>)}</ul>
    <p>{window?.note ?? 'Loading reviewed reports…'}</p>
    <div className="lab-controls"><label>Offline scenario<select aria-label="Offline scenario" value={scenario} disabled={busy}
      onChange={event => setScenario(event.target.value as typeof scenario)}>{lab25Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label><input type="checkbox" checked={includeHandoff} disabled={busy} onChange={event => setIncludeHandoff(event.target.checked)} /> Include host summary handoff</label>
      <button disabled={busy} onClick={() => void run()}>Run offline replay</button></div>
    <LiveActionButton busy={busy} available={false} checkAvailability={async () => false} onRun={async () => {}}
      setup="A small live Managed report run needs a separately configured and opted-in agent and environment. This lesson neither provisions resources nor starts a billed session automatically. Offline compaction is fixture evidence only." />
    <p role="status" aria-label="Context status">{status}</p>
    {result && <section aria-label="Context replay result"><h3>Observed replay evidence</h3>
      <p>Source: {result.source}. Consumer outcome: {result.consumerOutcome}. Host reads: {result.hostReads.join(', ')}. Provider calls: {result.providerCalls}.</p>
      <p>Thread cumulative usage: input {show(result.metrics.inputTokens)}, output {show(result.metrics.outputTokens)}, cache read {show(result.metrics.cacheReadTokens)} tokens; active seconds {show(result.metrics.threadActiveSeconds)}.</p>
      <p>Context window: unavailable. Free context: unavailable. Compaction threshold: unavailable.</p>
      <p>Compaction events observed: {result.observedCompaction.length ? result.observedCompaction.map(event => event.id).join(', ') : 'none in this stream'}.</p>
      <p>Authoritative fixture message: {result.response}</p><p>{result.note}</p>
      {result.handoff && <section aria-label="Host summary handoff"><h4>Separate host summary handoff</h4>
        <p>Original session: <code>{result.handoff.originalSessionId}</code>. New session: <code>{result.handoff.newSessionId}</code>.</p>
        <p>{result.handoff.summary}</p><ul>{result.handoff.retained.map(item => <li key={item.id}>{item.id}: {item.retained ? 'retained in summary' : 'omitted from summary'}</li>)}</ul>
        <p>New-session fixture answer: {result.handoff.newSessionAnswer}</p></section>}
    </section>}
  </section>;
}
