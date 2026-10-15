import { useRef, useState } from 'react';
import { lab47Scenarios, lab47SnapshotSchema } from '../../shared/lab47-multi-agent';
import type { Lab47Route, Lab47Scenario } from '../../shared/lab47-multi-agent';

type Snapshot = ReturnType<typeof lab47SnapshotSchema.parse>;
const routes: readonly Lab47Route[] = ['orchestrator', 'hierarchy', 'pipeline', 'fanout', 'evaluator'];
export default function Concept47MultiAgent() {
  const owner = useRef(crypto.randomUUID()); const [route, setRoute] = useState<Lab47Route>('orchestrator');
  const [scenario, setScenario] = useState<Lab47Scenario>('regional-sales'); const [snapshot, setSnapshot] = useState<Snapshot>();
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. All reports below are authored offline fixtures.');
  async function run() { setBusy(true); try {
    const response = await fetch(`/api/c47/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ mode: 'scripted', scenario }), signal: AbortSignal.timeout(7000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab47SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`Verification gate: ${checked.gate}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Coordinator failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab47-heading"><h2 id="lab47-heading">Model driven and host driven orchestration</h2>
    <p>Compare native worker threads in one Managed session with a host-owned dependency pipeline of separate sessions. Closed reports and fixture values, rather than agent prose, control every handoff.</p>
    <div className="lab-controls"><label>Orchestration route<select value={route} onChange={event => setRoute(event.target.value as Lab47Route)}>
      {routes.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as Lab47Scenario)}>
        {lab47Scenarios.map(value => <option key={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Run offline coordination</button></div>
    {snapshot && <><p>Architecture: {snapshot.architecture}. Native capability in installed SDK: {String(snapshot.nativeCapability)};
      pinned configuration depth limit: {snapshot.depthLimit}. Provider calls: {snapshot.providerCalls}.</p>
      <p>Parent session: <code>{snapshot.parentSessionId ?? 'independent worker sessions'}</code>. Gate: <strong>{snapshot.gate}</strong>.</p>
      <div className="lab-results">{snapshot.workers.map(worker => <section key={worker.role}><h3>{worker.role} worker: {worker.state}</h3>
        <p>Session <code>{worker.sessionId ?? 'none'}</code>; thread <code>{worker.threadId ?? 'none'}</code>; attempts {worker.attempts}.</p>
        <p>Raw report: <code>{worker.rawReport ?? 'none'}</code></p>
        <p>Verified report: <code>{worker.verifiedReport ? JSON.stringify(worker.verifiedReport) : 'none'}</code></p>
        <p>Usage scope: {worker.usageScope}; input {worker.inputTokens ?? 'unknown'}; output {worker.outputTokens ?? 'unknown'}.</p>
        <p>{worker.evidence}</p></section>)}</div>
      <h3>Parent final text</h3><p>{snapshot.parentFinalText ?? 'none'}</p>
      <p>Shared session usage: {snapshot.sessionUsage ? JSON.stringify(snapshot.sessionUsage) : 'not applicable'}.
        Host aggregate: {snapshot.hostAggregate ? JSON.stringify(snapshot.hostAggregate) : 'not applicable'}.</p>
      <ul>{snapshot.notes.map(note => <li key={note}>{note}</li>)}</ul></>}
    <p role="status" aria-label="Lab 47 status">{status}</p>
    <p>Offline type support does not prove account entitlement. No live Managed session starts from this exercise.</p>
  </section>;
}
