import { useRef, useState } from 'react';
import { lab37Scenarios, lab37SnapshotSchema } from '../../shared/lab37-permission-prompt-tool';
type Snapshot = ReturnType<typeof lab37SnapshotSchema.parse>;
export default function Concept37PermissionPromptTool() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab37Scenarios)[number]>('deny');
  const [gate, setGate] = useState<'worker' | 'local-reviewer'>('worker'); const [snapshot, setSnapshot] = useState<Snapshot>();
  const [status, setStatus] = useState('Ready. The policy gate is a host service, not an agent tool.'); const [busy, setBusy] = useState(false);
  async function post(path: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c37/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab37SnapshotSchema.parse(data); setSnapshot(checked);
    setStatus(`${checked.status}; ${checked.confirmationCount} confirmation(s), ${checked.fileEffects} checked file effect(s).`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Policy request failed.'); } finally { setBusy(false); } }
  const decide = (reviewerDecision?: 'allow' | 'deny') => { if (snapshot?.eventId) void post('decide', { runId: snapshot.runId,
    eventId: snapshot.eventId, ...(reviewerDecision ? { reviewerDecision } : {}) }); };
  return <section aria-labelledby="lab37-heading"><h2 id="lab37-heading">External policy decision service</h2>
    <p>A built-in <code>always_ask</code> action pauses on an exact <code>sevt_</code> ID. A host-only gate returns a closed decision; an independent path check can still refuse it.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab37Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Gate source<select value={gate} onChange={event => setGate(event.target.value as typeof gate)}>
        <option value="worker">isolated policy worker</option><option value="local-reviewer">local reviewer</option></select></label>
      <button disabled={busy} onClick={() => void post('run', { mode: 'scripted', scenario, gate })}>Start policy review</button></div>
    {snapshot && <><p>Run <code>{snapshot.runId}</code>; pending event <code>{snapshot.eventId ?? 'none'}</code>.</p>
      <p>Action: {snapshot.action ? `${snapshot.action.tool} ${snapshot.action.path}` : 'preallowed observation'}.</p>
      <div className="lab-controls"><button disabled={busy || snapshot.status !== 'pending' || gate === 'local-reviewer'} onClick={() => decide()}>Ask policy worker</button>
        <button disabled={busy || snapshot.status !== 'pending' || gate !== 'local-reviewer'} onClick={() => decide('allow')}>Reviewer allows</button>
        <button disabled={busy || snapshot.status !== 'pending' || gate !== 'local-reviewer'} onClick={() => decide('deny')}>Reviewer denies</button>
        <button disabled={busy || snapshot.status !== 'pending'} onClick={() => void post('failures', { runId: snapshot.runId })}>Cancel pending</button></div>
      <p>Gate: {snapshot.gateDecision ?? 'none'}. Host: {snapshot.hostDecision ?? 'none'}. File effects: {snapshot.fileEffects}.</p>
      <pre>{snapshot.fixtureText}</pre>
      {snapshot.confirmation && <pre style={{ overflowX: 'auto' }}>{JSON.stringify(snapshot.confirmation, null, 2)}</pre>}
      <h3>Decision evidence</h3><ul>{snapshot.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul>
      <p>{snapshot.note} Provider calls: {snapshot.providerCalls}.</p></>}
    <p role="status" aria-label="Lab 37 status">{status}</p>
    <p>Malformed and unavailable gate results fail closed. Agent text cannot bypass the gate, and the gate cannot rewrite confirmation inputs.</p>
  </section>;
}
