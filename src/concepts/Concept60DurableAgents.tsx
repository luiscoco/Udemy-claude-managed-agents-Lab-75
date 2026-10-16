import { useRef, useState } from 'react';
import { lab60StrategySchema } from '../../shared/lab60-durable-agents';
import type { z } from 'zod';

type Strategy = z.infer<typeof lab60StrategySchema>;
type Scenario = 'crash-after-third' | 'lease-loss' | 'no-progress';
type Snapshot = { jobId: string; scenario: Scenario; state: string; journalKeys: string[];
  ledger: { key: string; itemId: string; amountCents: number }[]; duplicates: number;
  decision: string; supervisor?: string; suppressed?: string[]; repeated?: string[]; providerCalls: number; note: string };
export default function Concept60DurableAgents() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<Scenario>('crash-after-third');
  const [strategy, setStrategy] = useState<Strategy>('journal-idempotency'); const [result, setResult] = useState<Snapshot>();
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. Local fictional ledger only.');
  async function post(path: string, body: unknown) { const response = await fetch(`/api/c60/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data as Snapshot; }
  async function start() { setBusy(true); try { const data = await post('run', { scenario }); setResult(data);
    setStatus(`${scenario}: ${data.state}; ${data.ledger.length} effects, ${data.journalKeys.length} journaled.`); }
  catch (error) { setStatus(error instanceof Error ? error.message : 'Run failed.'); } finally { setBusy(false); } }
  async function recover() { if (!result) return; setBusy(true); try { const data = await post('recover', { jobId: result.jobId, strategy });
    setResult(data); setStatus(`${strategy}: ${data.state}; ${data.duplicates} duplicate effects; ${data.suppressed?.length ?? 0} suppressed.`); }
  catch (error) { setStatus(error instanceof Error ? error.message : 'Recovery failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab60-heading"><h2 id="lab60-heading">Durable long running agents</h2>
    <p>Crash a fictional eight-item refund batch, then compare journal recovery and stable effect-key idempotency.</p>
    <div className="lab-controls"><label>Failure scenario<select value={scenario} onChange={event => setScenario(event.target.value as Scenario)}>
      <option value="crash-after-third">Crash after effect 3</option><option value="lease-loss">Lease loss</option>
      <option value="no-progress">No progress</option></select></label>
      <label>Recovery strategy<select value={strategy} onChange={event => setStrategy(lab60StrategySchema.parse(event.target.value))}>
        {lab60StrategySchema.options.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void start()}>Start offline batch</button>
      <button disabled={busy || !result || result.state !== 'crashed'} onClick={() => void recover()}>Recover batch</button></div>
    {result && <><p>Job: <code>{result.jobId}</code>. State: {result.state}. Supervisor: {result.supervisor ?? result.decision}.
      Journaled keys: {result.journalKeys.length}; ledger effects: {result.ledger.length}; duplicates: {result.duplicates};
      suppressed keys: {result.suppressed?.length ?? 0}; provider calls: {result.providerCalls}.</p>
      <ol>{result.ledger.map((effect, index) => <li key={`${effect.key}-${index}`}><code>{effect.key}</code> —
        {effect.itemId}: {(effect.amountCents / 100).toFixed(2)} EUR fictional effect.</li>)}</ol>
      <p>{result.note}</p></>}
    <p role="status" aria-label="Lab 60 status">{status}</p>
    <p>Host files and stable business keys govern effects. No actual payment or email is sent, and a transcript is not durable business state.</p>
  </section>;
}
