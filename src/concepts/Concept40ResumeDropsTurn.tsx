import { useRef, useState } from 'react';
import { lab40Scenarios, lab40SnapshotSchema } from '../../shared/lab40-resume-drops-turn';

type Snapshot = ReturnType<typeof lab40SnapshotSchema.parse>;
export default function Concept40ResumeDropsTurn() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab40Scenarios)[number]>('kept-turn');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Recovery decisions are based on host ledger evidence.');
  async function post(route: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c40/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(7000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    if (route === 'dry') setStatus(data.rule);
    else { const checked = lab40SnapshotSchema.parse(data); setSnapshot(checked); setStatus(checked.decision); }
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Recovery request failed.'); } finally { setBusy(false); } }
  async function inspect() { if (!snapshot) return; setBusy(true); try {
    const response = await fetch(`/api/c40/state?runId=${encodeURIComponent(snapshot.runId)}`, { headers: { 'X-Lab-Owner': owner.current }, signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab40SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`State version ${checked.version}; remote events ${checked.remoteHistoryCount}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'State lookup failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab40-heading"><h2 id="lab40-heading">Safe recovery boundaries</h2>
    <p>Inspect accepted commands, uncertain sends and pending effects before choosing recovery. Managed event history cannot be truncated. Undo restores only a versioned host draft when no work has been accepted.</p>
    <div className="lab-controls"><label>Offline case<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab40Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post('dry', {})}>Dry check</button>
      <button disabled={busy} onClick={() => void post('build', { mode: 'scripted', scenario })}>Build recovery case</button></div>
    {snapshot && <><p>Run <code>{snapshot.runId}</code>; version {snapshot.version}; retained session {snapshot.sessionId}. Remote events: {snapshot.remoteHistoryCount}.</p>
      <h3>Host command ledger</h3><ul>{snapshot.commandLedger.length ? snapshot.commandLedger.map(item => <li key={item.id}><code>{item.id}</code> — {item.state}: {item.text}</li>) : <li>No accepted command.</li>}</ul>
      <h3>Effect ledger</h3><ul>{snapshot.effectLedger.length ? snapshot.effectLedger.map(item => <li key={item.id}><code>{item.id}</code> — {item.state}: {item.description}</li>) : <li>No effect.</li>}</ul>
      <p>Remote event IDs: {snapshot.remoteEventIds.length ? snapshot.remoteEventIds.join(', ') : 'none'}.</p>
      <div className="lab-controls"><button disabled={busy} onClick={() => void inspect()}>Inspect state</button>
        <button disabled={busy} onClick={() => void post('undo', { runId: snapshot.runId, expectedVersion: snapshot.version })}>Try host-only undo</button></div>
      <div className="lab-controls">{(['continue', 'interrupt', 'fresh-derived', 'reconcile'] as const).map(choice =>
        <button key={choice} disabled={busy || snapshot.recovery !== 'none'} onClick={() => void post('cases', { runId: snapshot.runId, choice })}>{choice}</button>)}</div>
      <p>Recovery: {snapshot.recovery}. Undo: {snapshot.undo}. Host draft: {snapshot.hostDraft}. Snapshot v{snapshot.snapshotVersion}: {snapshot.snapshotDraft}.</p>
      <p>Provider calls: {snapshot.providerCalls}.</p><h3>Evidence</h3><ul>{snapshot.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
    <p role="status" aria-label="Lab 40 status">{status}</p>
    <p>An uncertain send requires reconciliation, not a transient retry. Fresh derived context is selected host evidence, not erased remote history.</p>
  </section>;
}
