import { useRef, useState } from 'react';
import { lab35Scenarios, lab35SnapshotSchema } from '../../shared/lab35-session-stores';
type Snapshot = ReturnType<typeof lab35SnapshotSchema.parse>;
export default function Concept35SessionStores() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab35Scenarios)[number]>('normal');
  const [flush, setFlush] = useState<'eager' | 'batched'>('eager'); const [snapshot, setSnapshot] = useState<Snapshot>();
  const [status, setStatus] = useState('Ready. The local mirror never owns remote session state.'); const [busy, setBusy] = useState(false);
  async function post(path: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c35/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    if ('deleted' in data) { setSnapshot(undefined); setStatus('Local conversation mirror reset.'); return; }
    const checked = lab35SnapshotSchema.parse(data); setSnapshot(checked);
    setStatus(`${checked.mirrorStatus}; ${checked.persistedCount} persisted and ${checked.pendingCount} pending canonical event(s).`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Mirror request failed.'); } finally { setBusy(false); } }
  const manage = (operation: 'flush' | 'crash-restart' | 'reconcile' | 'archive') => { if (snapshot) void post('manage', { operation, conversationId: snapshot.conversationId }); };
  return <section aria-labelledby="lab35-heading"><h2 id="lab35-heading">Event mirrors and conversation indexes</h2>
    <p>A file-backed host mirror stores canonical <code>sevt_</code> events by thread and indexes an owned <code>sesn_</code> ID. It cannot recreate a remote sandbox or resume an archived session.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab35Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Flush strategy<select value={flush} onChange={event => setFlush(event.target.value as typeof flush)}>
        <option value="eager">eager</option><option value="batched">batched</option></select></label>
      <button disabled={busy} onClick={() => void post('run', { mode: 'scripted', scenario, flush })}>Start mirror</button></div>
    {snapshot && <><p>Conversation <code>{snapshot.conversationId}</code>; remote session <code>{snapshot.sessionId}</code> ({snapshot.remoteState}).
      Owner: <code>{snapshot.owner}</code>.</p>
      <p>Persisted: {snapshot.persistedCount}. Pending: {snapshot.pendingCount}. Mirror: {snapshot.mirrorStatus}. Append failure: {String(snapshot.appendFails)}.
        Effect ledger records: {snapshot.effectLedgerCount}. Provider calls: {snapshot.providerCalls}.</p>
      <div className="lab-controls"><button disabled={busy || !snapshot.pendingCount} onClick={() => manage('flush')}>Flush batch</button>
        <button disabled={busy} onClick={() => manage('crash-restart')}>Simulate crash and restart</button>
        <button disabled={busy || snapshot.remoteState === 'archived'} onClick={() => manage('reconcile')}>Reconcile history</button>
        <button disabled={busy || snapshot.remoteState === 'archived'} onClick={() => manage('archive')}>Archive remote fixture</button>
        <button disabled={busy} onClick={() => void post('failures', { conversationId: snapshot.conversationId, appendFails: !snapshot.appendFails })}>
          {snapshot.appendFails ? 'Restore appends' : 'Simulate append failure'}</button>
        <button disabled={busy} onClick={() => void post('reset', { conversationId: snapshot.conversationId })}>Reset local mirror</button></div>
      <section aria-label="Canonical mirror events"><h3>Persisted canonical events</h3>
        {snapshot.events.length ? <ol>{snapshot.events.map(event => <li key={event.eventId}>
          <code>{event.eventId}</code> · <code>{event.threadId}</code> · {event.kind}: {event.text}</li>)}</ol> : <p>No persisted events.</p>}
      </section><p>{snapshot.note}</p></>}
    <p role="status" aria-label="Lab 35 status">{status}</p>
    <p>Preview fragments are not stored. A second host must use the Managed API with an owned live session ID; this offline fixture does not restore a transcript into a live session.</p>
  </section>;
}
