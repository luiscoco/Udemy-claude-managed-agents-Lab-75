import { useRef, useState } from 'react';
import { lab32Scenarios, lab32SnapshotSchema } from '../../shared/lab32-plan-mode';
type Snapshot = ReturnType<typeof lab32SnapshotSchema.parse>;
export default function Concept32PlanMode() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab32Scenarios)[number]>('approval');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [feedback, setFeedback] = useState('Keep the checklist short.');
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. Offline planning uses a disposable fixture.');
  async function post(path: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c32/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab32SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`${checked.status}; plan v${checked.planVersion}; ${checked.executionFileEffects} execution file effect(s).`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Plan request failed.'); } finally { setBusy(false); } }
  const decision = (choice: 'approve' | 'reject' | 'revise', stale = false) => { if (snapshot) void post('decide', {
    runId: snapshot.runId, planVersion: stale ? snapshot.planVersion - 1 : snapshot.planVersion,
    planHash: stale ? '0'.repeat(64) : snapshot.planHash, decision: choice,
    ...(choice === 'revise' ? { feedback } : {}) }); };
  const who = (operation: 'inspect' | 'attempt-write' | 'cancel', phase: 'planning' | 'execution' = 'planning',
    tool: 'append_checklist' | 'write_anywhere' = 'append_checklist') => { if (snapshot) void post('who', { operation, runId: snapshot.runId,
      ...(operation === 'attempt-write' ? { phase, tool } : {}) }); };
  return <section aria-labelledby="lab32-heading"><h2 id="lab32-heading">Plan review and execution gate</h2>
    <p>A read-only planning phase produces a versioned plan. The host checks one reviewer decision against its immutable hash. Approval starts a fresh restricted execution session and checks its sole file action.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab32Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post('run', { mode: 'scripted', scenario })}>Start plan</button></div>
    {snapshot && <><section aria-label="Plan under review"><h3>Plan v{snapshot.planVersion}</h3><p>{snapshot.planText}</p>
      <p>Hash: <code>{snapshot.planHash}</code></p><p>Planning session: <code>{snapshot.planningSessionId}</code>. Execution session: <code>{snapshot.executionSessionId ?? 'none'}</code>.</p>
      <label>Revision feedback<input value={feedback} maxLength={300} onChange={event => setFeedback(event.target.value)} /></label>
      <div className="lab-controls"><button disabled={busy || snapshot.status !== 'pending'} onClick={() => decision('approve')}>Approve current plan</button>
        <button disabled={busy || snapshot.status !== 'pending'} onClick={() => decision('reject')}>Reject plan</button>
        <button disabled={busy || snapshot.status !== 'pending' || !feedback.trim()} onClick={() => decision('revise')}>Request revision</button>
        <button disabled={busy || snapshot.status !== 'pending' || snapshot.planVersion === 1} onClick={() => decision('approve', true)}>Try stale approval</button></div></section>
      <div className="lab-controls"><button disabled={busy} onClick={() => who('attempt-write')}>Try planning write</button>
        <button disabled={busy} onClick={() => who('attempt-write', 'execution', 'write_anywhere')}>Try unselected execution tool</button>
        <button disabled={busy || snapshot.status !== 'pending'} onClick={() => who('cancel')}>Cancel pending plan</button>
        <button disabled={busy} onClick={() => who('inspect')}>Inspect file evidence</button></div>
      <section aria-label="File evidence"><h3>Fixture file evidence</h3><p>Planning effects: {snapshot.planningFileEffects}. Execution effects: {snapshot.executionFileEffects}.
        Initial SHA-256: <code>{snapshot.initialFileHash}</code>. Current SHA-256: <code>{snapshot.currentFileHash}</code>.</p>
        <pre>{snapshot.fileText}</pre>{snapshot.lastTool && <p>Last tool: {snapshot.lastTool.phase} / {snapshot.lastTool.tool}: {snapshot.lastTool.allowed ? 'allowed' : 'denied'} — {snapshot.lastTool.reason}</p>}</section>
      <p>{snapshot.note} Provider calls: {snapshot.providerCalls}.</p></>}
    <p role="status" aria-label="Lab 32 status">{status}</p>
    <p>Live use needs separately configured Managed planning and execution agents; this exercise makes no provider call.</p>
  </section>;
}
