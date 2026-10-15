import { useRef, useState } from 'react';
import { lab28ResultSchema, lab28Scenarios } from '../../shared/lab28-errors-retries';
import type { Lab28Result } from '../../shared/lab28-errors-retries';

export default function Concept28ErrorsRetries() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab28Scenarios)[number]>('read-rate-limit');
  const [result, setResult] = useState<Lab28Result>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Offline loopback faults do not contact Anthropic.');
  async function run() { if (busy) return; setBusy(true); try {
    const response = await fetch('/api/c28/run', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ mode: 'scripted', scenario, deadlineMs: 2000 }), signal: AbortSignal.timeout(4000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab28ResultSchema.parse(data); setResult(checked); setStatus(`${checked.classification}; ${checked.mutationAttempts} mutation attempt(s).`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Fault experiment failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab28-heading"><h2 id="lab28-heading">Errors, retries and reconciliation</h2>
    <p>Read requests may retry with a bound. Create, send, confirm, result and interrupt use zero SDK retries because an unseen acknowledgment does not prove the operation failed.</p>
    <div className="lab-controls"><label>Offline fault scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab28Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Run offline fault</button></div>
    <p role="status" aria-label="Lab 28 status">{status}</p>
    {result && <section aria-label="Fault evidence"><h3>Classification and reconciliation</h3>
      <p>Source: {result.source}. Classification: {result.classification}. Known session: {result.sessionId ?? 'none'}.</p>
      <p>Read attempts: {result.readAttempts}. Mutation attempts: {result.mutationAttempts}. Host effects: {result.effectCount}.</p>
      <p>Reconcile: {result.reconcile}. Retry allowed: {result.retryAllowed ? 'bounded read only' : 'no'}. Cleanup: {result.cleanup}.</p>
      <p>Remote stopped: {result.remoteStopped === null ? 'unconfirmed' : result.remoteStopped ? 'yes' : 'no'}.</p>
      <ul>{result.evidence.map(item => <li key={item}>{item}</li>)}</ul><p>{result.guidance}</p></section>}
    <p>Closing this browser request is a local disconnect, not a confirmed remote failure. Live fault injection is unavailable in this lesson.</p>
  </section>;
}
