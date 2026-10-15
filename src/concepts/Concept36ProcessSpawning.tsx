import { useRef, useState } from 'react';
import { lab36Scenarios, lab36SnapshotSchema } from '../../shared/lab36-process-spawning';
type Snapshot = ReturnType<typeof lab36SnapshotSchema.parse>;
export default function Concept36ProcessSpawning() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab36Scenarios)[number]>('success');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. The loopback emulator makes no Anthropic call.');
  async function run() { setBusy(true); try {
    const response = await fetch('/api/c36/run', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ mode: 'scripted', scenario }), signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab36SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`${checked.outcome}; cleanup ${checked.cleanup}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Transport experiment failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab36-heading"><h2 id="lab36-heading">Remote transport and host runners</h2>
    <p>The host sends HTTP requests to a loopback Managed-port emulator and consumes a bounded event stream. A separate fixed child process represents an authored host tool worker.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab36Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Run transport experiment</button></div>
    {snapshot && <><p>Run <code>{snapshot.runId}</code>; session <code>{snapshot.sessionId ?? 'none'}</code>; outcome: {snapshot.outcome}.</p>
      <p>Host request: <code>{snapshot.hostRequest}</code>. Events: {snapshot.eventCount}; peak queue: {snapshot.queuePeak}/4.</p>
      <section aria-label="Remote lifecycle"><h3>Remote lifecycle evidence</h3><ol>{snapshot.remoteLifecycle.map((event, index) => <li key={index}>{event}</li>)}</ol></section>
      <p>Host worker started: {String(snapshot.worker.started)}. Exit count: {snapshot.worker.exitCount}. Killed: {String(snapshot.worker.killed)}.
        Stderr redacted: {String(snapshot.worker.stderrRedacted)}.</p>
      <p>Local abort: {String(snapshot.localAbort)}. Remote stop confirmed: {String(snapshot.remoteStopConfirmed)}. Cleanup: {snapshot.cleanup}.
        Provider calls: {snapshot.providerCalls}.</p><p>{snapshot.note}</p></>}
    <p role="status" aria-label="Lab 36 status">{status}</p>
    <p>Killing a host worker does not prove a remote session stopped. This local emulator is not a production remote sandbox or a Claude Code process.</p>
  </section>;
}
