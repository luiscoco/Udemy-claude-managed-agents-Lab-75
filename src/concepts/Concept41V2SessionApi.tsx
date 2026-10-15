import { useRef, useState } from 'react';
import { lab41SnapshotSchema } from '../../shared/lab41-v2-session-api';

type Snapshot = ReturnType<typeof lab41SnapshotSchema.parse>;
const scenarios = ['one-shot', 'retained', 'interrupt-continue', 'reconnect', 'archived-refusal'] as const;
export default function Concept41V2SessionApi() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof scenarios)[number]>('one-shot');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Offline Managed-shaped sessions do not contact Anthropic.');
  async function post(route: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c41/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(8000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab41SnapshotSchema.parse(data); setSnapshot(checked);
    setStatus(`${checked.status}; ${checked.history.length} listed events; ${checked.createdSessions} created session; ${checked.reconnectCreates} reconnect creations.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Lifecycle request failed.'); } finally { setBusy(false); } }
  async function inspect() { if (!snapshot) return; setBusy(true); try {
    const response = await fetch(`/api/c41/state?runId=${encodeURIComponent(snapshot.runId)}`, { headers: { 'X-Lab-Owner': owner.current }, signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab41SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`Resolved session ${checked.sessionId}; ${checked.history.length} events.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'State lookup failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab41-heading"><h2 id="lab41-heading">Managed session lifecycle comparison</h2>
    <p>Compare one-shot auto-close, an owned retained session and reconnect through current Managed session actions. Resolved IDs, listed events and archive evidence come from the fixture adapter.</p>
    <div className="lab-controls"><label>Offline workflow<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post(scenario === 'one-shot' ? 'oneshot' : 'compare', { mode: 'scripted', scenario })}>Start workflow</button></div>
    {snapshot && <><p>Run <code>{snapshot.runId}</code>. Resolved session <code>{snapshot.sessionId}</code>; status {snapshot.status}.</p>
      <p>Created sessions: {snapshot.createdSessions}. Reconnect creations: {snapshot.reconnectCreates}. Archive count: {snapshot.archiveCount}. Provider calls: {snapshot.providerCalls}.</p>
      <div className="lab-controls"><button disabled={busy} onClick={() => void inspect()}>Inspect state</button>
        {(['second-turn', 'interrupt', 'reconnect', 'archive', 'send-after-archive'] as const).map(action =>
          <button key={action} disabled={busy} onClick={() => void post('continue', { runId: snapshot.runId, action })}>{action}</button>)}</div>
      <h3>Current Managed event sequence</h3><ol>{snapshot.lifecycle.map((item, index) => <li key={index}>{item}</li>)}</ol>
      <h3>Listed history</h3><ul>{snapshot.history.map(item => <li key={item.id}><code>{item.id}</code> {item.type}: {item.text}</li>)}</ul>
      <p>User event IDs: {snapshot.userEventIds.join(', ')}. Agent event IDs: {snapshot.agentEventIds.join(', ')}.</p>
      <p>{snapshot.note}</p></>}
    <p role="status" aria-label="Lab 41 status">{status}</p>
    <details><summary>Historical local-process model</summary><p>Older local-process examples owned a subprocess and local files. This static comparison does not import that runtime or claim process-count or JSONL compatibility for the remote Managed harness.</p></details>
  </section>;
}
