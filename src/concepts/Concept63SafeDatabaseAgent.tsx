import { useRef, useState } from 'react';

type Snapshot = { sessionId: string; tenant: string; rows: { id: string; status: string; version: number }[];
  proposals: { id: string; orderId: string; status: string; version: number; expiresAt: number }[];
  audit: { event: string; detail: string }[]; readQueryOnly: boolean; writeQueryOnly: boolean;
  providerCalls: number; note: string };
export default function Concept63SafeDatabaseAgent() {
  const owner = useRef(crypto.randomUUID()); const [snapshot, setSnapshot] = useState<Snapshot>();
  const [status, setStatus] = useState('Ready. Create a disposable local SQLite session.');
  const [busy, setBusy] = useState(false);
  async function post(path: string, body: unknown) { const response = await fetch(`/api/c63/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data; }
  async function act(action: 'start' | 'read' | 'propose' | 'approve' | 'reject' | 'stale' | 'expired' | 'blocked-sql') {
    setBusy(true); try {
      if (action === 'start') { const data = await post('sessions', { mode: 'offline' }) as Snapshot;
        setSnapshot(data); setStatus(`Session ${data.sessionId} created for host tenant ${data.tenant}.`); return; }
      if (!snapshot) return; const path = `sessions/${snapshot.sessionId}`;
      if (action === 'read' || action === 'propose') {
        const data = await post(`${path}/query`, action === 'read' ? { operation: 'read', orderId: 'O-A1' } :
          { operation: 'propose', orderId: 'O-A1', reason: 'Customer requested cancellation.' });
        setStatus(`${action}: ${action === 'read' ? (data as { order: { status: string } }).order.status : 'pending human decision'}.`);
      } else if (action === 'approve' || action === 'reject') {
        const proposal = snapshot.proposals.find(item => item.status === 'pending');
        if (!proposal) { setStatus('No pending proposal.'); return; }
        const data = await post(`${path}/decision`, { proposalId: proposal.id, decision: action });
        setSnapshot(data as Snapshot); setStatus(`Human decision: ${(data as { outcome: string }).outcome}; changed rows ${(data as { changedRows: number }).changedRows}.`);
        return;
      } else if (action === 'stale' || action === 'expired') {
        await post(`${path}/fixture`, { action: action === 'stale' ? 'change-version' : 'advance-time' });
        setStatus(`${action} fixture injected; review the pending proposal.`);
      } else { const data = await post(`${path}/blocked-sql`, { sql: 'DELETE FROM orders' });
        setStatus(`Arbitrary SQL blocked: ${(data as { blocked: boolean }).blocked}.`); }
      const response = await fetch(`/api/c63/${path}`, { headers: { 'X-Lab-Owner': owner.current } });
      if (response.ok) setSnapshot(await response.json() as Snapshot);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Database fixture failed.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="lab63-heading"><h2 id="lab63-heading">A safe database agent</h2>
    <p>Read a fixed tenant-scoped order, propose cancellation, then make a separate human decision against versioned SQLite state.</p>
    <div className="lab-controls"><button disabled={busy} onClick={() => void act('start')}>Create SQLite session</button>
      <button disabled={busy || !snapshot} onClick={() => void act('read')}>Read order</button>
      <button disabled={busy || !snapshot} onClick={() => void act('propose')}>Propose cancellation</button>
      <button disabled={busy || !snapshot} onClick={() => void act('approve')}>Approve as human</button>
      <button disabled={busy || !snapshot} onClick={() => void act('reject')}>Reject as human</button>
      <button disabled={busy || !snapshot} onClick={() => void act('stale')}>Change row version</button>
      <button disabled={busy || !snapshot} onClick={() => void act('expired')}>Advance five minutes</button>
      <button disabled={busy || !snapshot} onClick={() => void act('blocked-sql')}>Try arbitrary SQL</button></div>
    {snapshot && <><p>Session: <code>{snapshot.sessionId}</code>; tenant {snapshot.tenant}; read query-only:
      {String(snapshot.readQueryOnly)}; host write connection restored query-only: {String(snapshot.writeQueryOnly)};
      provider calls: {snapshot.providerCalls}.</p>
      <h3>Orders</h3><ul>{snapshot.rows.map(row => <li key={row.id}>{row.id}: {row.status}, version {row.version}.</li>)}</ul>
      <h3>Proposals</h3><ul>{snapshot.proposals.map(proposal => <li key={proposal.id}><code>{proposal.id}</code>:
        {proposal.status}, captured version {proposal.version}.</li>)}</ul>
      <h3>Audit</h3><ol>{snapshot.audit.map((entry, index) => <li key={index}>{entry.event}: {entry.detail}</li>)}</ol>
      <p>{snapshot.note}</p></>}
    <p role="status" aria-label="Lab 63 status">{status}</p>
    <p>Agent prose cannot commit a cancellation. The human endpoint uses BEGIN IMMEDIATE and a tenant/status/version-checked update.</p>
  </section>;
}
