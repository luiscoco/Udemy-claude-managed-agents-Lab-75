import { useRef, useState } from 'react';
import { lab27SnapshotSchema } from '../../shared/lab27-background-tasks';
type Snapshot = ReturnType<typeof lab27SnapshotSchema.parse>;
export default function Concept27BackgroundTasks() {
  const owner = useRef(crypto.randomUUID()); const [task, setTask] = useState<Snapshot>();
  const [request, setRequest] = useState('Prepare a fictional Aurora Finch field note.');
  const [backgroundAllowed, setBackgroundAllowed] = useState(true); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Offline task events are authored; no provider call is made.');
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  async function post(path: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c27/${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab27SnapshotSchema.parse(data); setTask(checked);
    setStatus(`${checked.taskState}; remote ${checked.remoteStatus}; browser ${checked.browserConnection}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Task control failed.'); } finally { setBusy(false); } }
  const call = (operation: 'detach' | 'reconnect' | 'inspect' | 'stop' | 'close') => { if (task) void post('call', { operation, taskId: task.taskId }); };
  return <section aria-labelledby="lab27-heading"><h2 id="lab27-heading">Remote work beyond a browser connection</h2>
    <p>A host task ledger ties one task card to an owned session and thread. Browser detachment changes only the connection state. Reconnect inspects the same task and deduplicates replayed events.</p>
    <div className="lab-controls"><label>Task request<input value={request} maxLength={240} onChange={event => setRequest(event.target.value)} /></label>
      <label><input type="checkbox" checked={backgroundAllowed} onChange={event => setBackgroundAllowed(event.target.checked)} /> Allow host background work</label>
      <button disabled={busy} onClick={() => void post('open', { mode: 'scripted', backgroundAllowed, scenario: 'slow', request })}>Open slow offline task</button>
      <button disabled={busy} onClick={() => void post('oneshot', { mode: 'scripted', backgroundAllowed, scenario: 'completed', request })}>Run completed one-shot</button></div>
    {task && <><p>Task <code>{task.taskId}</code>; session <code>{task.sessionId}</code>; primary thread <code>{task.threadId}</code>.</p>
      <div className="lab-controls"><button disabled={busy} onClick={() => call('detach')}>Detach browser</button>
        <button disabled={busy} onClick={() => call('reconnect')}>Reconnect same task</button>
        <button disabled={busy} onClick={() => call('inspect')}>Inspect task</button>
        <button disabled={busy} onClick={() => call('stop')}>Stop and confirm idle</button>
        <button disabled={busy || task.remoteStatus !== 'idle'} onClick={() => call('close')}>Close idle session</button></div>
      <p>Task: {task.taskState}. Remote: {task.remoteStatus}. Browser: {task.browserConnection}. Child activity: {task.childActivity}.</p>
      <p>Provider creates: {task.createCount}. Duplicate cards: {task.duplicateCards}. Stop evidence: {task.stopEvidence}.</p>
      <p>Observed event IDs: {task.eventIds.join(', ') || 'none'}. Snapshot applied: {task.snapshotApplied ? 'yes' : 'no'}.</p>
      <p>Report: {(task.report ?? 'pending').replace(/\.$/, '')}. Independently verified: {task.reportVerified ? 'yes' : 'no'}.</p>
      <p>{task.note}</p></>}
    <p role="status" aria-label="Lab 27 status">{status}</p>
    <p>Native workflow runs require separate run-aware stopping; an interrupt alone does not end them. Live mode is unavailable until a configured Managed adapter is reviewed.</p>
  </section>;
}
