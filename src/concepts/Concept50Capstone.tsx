import { useEffect, useRef, useState } from 'react';
import { lab50SnapshotSchema } from '../../shared/lab50-capstone';
import type { z } from 'zod';

type Snapshot = z.infer<typeof lab50SnapshotSchema>;
type Customer = 'C-1' | 'C-2';
type DeskState = { orders: { id: string; item: string; paidCents: number; remainingCents: number; note: string }[];
  refunds: { id: string; orderId: string; amountCents: number }[]; tickets: { id: string; orderId: string; reason: string }[];
  audit: { id: string; kind: string; detail: string }[] };
type Evals = { cases: { name: string; pass: boolean; expectedRefunds: number; actualRefunds: number; evidence: string }[] };
export default function Concept50Capstone() {
  const owner = useRef(crypto.randomUUID()); const conversation = useRef<{ id: string; customer: Customer } | null>(null);
  const [customer, setCustomer] = useState<Customer>('C-1'); const [mode, setMode] = useState<'scripted' | 'live'>('scripted');
  const [message, setMessage] = useState('Refund 25 for O-1001'); const [snapshot, setSnapshot] = useState<Snapshot>();
  const [state, setState] = useState<DeskState>(); const [evals, setEvals] = useState<Evals>();
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. Offline support desk; no provider calls.');
  const headers = () => ({ 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current });
  useEffect(() => () => { const current = conversation.current; if (current) void fetch('/api/c50/close', { method: 'POST',
    headers: headers(), body: JSON.stringify({ customerId: current.customer, conversationId: current.id }), keepalive: true }).catch(() => {}); }, []);
  async function readState(selected = customer) { const response = await fetch(`/api/c50/state?customerId=${selected}`, { headers: headers() });
    if (!response.ok) throw new Error('Back-office state unavailable.'); setState(await response.json() as DeskState); }
  async function post(path: string, body: object) { const response = await fetch(`/api/c50/${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data; }
  async function send() { setBusy(true); try { const checked = lab50SnapshotSchema.parse(await post('chat', {
      mode, customerId: customer, conversationId: conversation.current?.customer === customer ? conversation.current.id : null, message }));
    conversation.current = { id: checked.conversationId, customer }; setSnapshot(checked); await readState();
    setStatus(checked.status === 'waiting-approval' ? 'Trusted host review is pending.' : checked.note);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Chat failed.'); } finally { setBusy(false); } }
  async function decide(decision: 'approve' | 'deny') { if (!snapshot?.pendingApproval) return; setBusy(true); try {
    const checked = lab50SnapshotSchema.parse(await post('approve', { customerId: customer, conversationId: snapshot.conversationId,
      approvalId: snapshot.pendingApproval.id, decision })); setSnapshot(checked); await readState(); setStatus(checked.note);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Review failed.'); } finally { setBusy(false); } }
  async function close() { if (!conversation.current) return; setBusy(true); try {
    const checked = lab50SnapshotSchema.parse(await post('close', { customerId: conversation.current.customer,
      conversationId: conversation.current.id })); setSnapshot(checked); conversation.current = null; await readState(); setStatus(`Cleanup: ${checked.cleanup}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Close failed.'); } finally { setBusy(false); } }
  async function runEvals() { setBusy(true); try { setEvals(await post('evals', {}) as Evals); setStatus('Four host-handler eval cases completed offline.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Evals failed.'); } finally { setBusy(false); } }
  async function selectCustomer(next: Customer) { if (conversation.current) await close(); setCustomer(next); setSnapshot(undefined);
    try { await readState(next); } catch (error) { setStatus(error instanceof Error ? error.message : 'State unavailable.'); } }
  return <section aria-labelledby="lab50-heading"><h2 id="lab50-heading">Acme Support Desk</h2>
    <p>Inspect customer-owned orders, ask the retained desk agent for help, and review a refund through the trusted host. Only the host ledger records an issued refund.</p>
    <div className="lab-controls"><label>Customer<select value={customer} disabled={busy} onChange={event => void selectCustomer(event.target.value as Customer)}>
      <option value="C-1">C-1 Avery</option><option value="C-2">C-2 Blair</option></select></label>
      <label>Execution<select value={mode} disabled={busy || Boolean(conversation.current)} onChange={event => setMode(event.target.value as 'scripted' | 'live')}>
        <option value="scripted">Offline scripted</option><option value="live">Live Managed (explicit opt-in)</option></select></label>
      <button disabled={busy} onClick={() => void readState()}>Refresh back office</button></div>
    <label>Customer message<textarea value={message} maxLength={500} onChange={event => setMessage(event.target.value)} /></label>
    <div className="lab-controls"><button disabled={busy || !message.trim()} onClick={() => void send()}>Send to desk</button>
      <button disabled={busy || !conversation.current} onClick={() => void close()}>Close conversation</button>
      <button disabled={busy} onClick={() => void runEvals()}>Run offline evals</button></div>
    {snapshot && <><p>Conversation <code>{snapshot.conversationId}</code>; session <code>{snapshot.sessionId}</code>;
      state {snapshot.status}; source {snapshot.source}; cleanup {snapshot.cleanup}.</p>
      <h3>Conversation</h3><div className="lab-results">{snapshot.messages.map(item => <p key={item.id}><strong>{item.role}:</strong> {item.text}</p>)}</div>
      <p>Validated summary: {snapshot.summary ? `${snapshot.summary.caseStatus}: ${snapshot.summary.summary}` : 'none yet'}.</p>
      {snapshot.pendingApproval && <section aria-label="Pending refund review"><h3>Host approval required</h3>
        <p>Order {snapshot.pendingApproval.orderId}; amount {snapshot.pendingApproval.amountCents} cents; review {snapshot.pendingApproval.id}.</p>
        <button disabled={busy} onClick={() => void decide('approve')}>Approve refund</button>
        <button disabled={busy} onClick={() => void decide('deny')}>Deny refund</button></section>}
      <details><summary>Correlated event evidence</summary><pre>{JSON.stringify(snapshot.rawEvents, null, 2)}</pre>
        <p>Reported usage: {snapshot.usage ? JSON.stringify(snapshot.usage) : 'unknown'}; provider calls: {snapshot.providerCalls ?? 'not counted'}.</p></details></>}
    {snapshot && <p>Read-only policy expert: session <code>{snapshot.policyExpert.sessionId}</code>;
      tools {snapshot.policyExpert.allowedTools.join(', ')}; last result {snapshot.policyExpert.lastResult}; usage unknown.</p>}
    <h3>Back office</h3>{state ? <><p>Orders: {state.orders.map(order => `${order.id} ${order.item} (${order.remainingCents}/${order.paidCents} cents remaining)`).join('; ') || 'none'}.</p>
      <p>Refunds: {state.refunds.map(refund => `${refund.id} ${refund.amountCents} cents`).join('; ') || 'none'}.
        Tickets: {state.tickets.map(ticket => ticket.id).join('; ') || 'none'}.</p>
      <details><summary>Audit timeline</summary><ol>{state.audit.map(item => <li key={item.id}>{item.kind}: {item.detail}</li>)}</ol></details></> : <p>Refresh to inspect customer-owned state.</p>}
    {evals && <section><h3>Deterministic host evals</h3><ul>{evals.cases.map(item => <li key={item.name}>{item.name}: {item.pass ? 'pass' : 'fail'};
      expected {item.expectedRefunds}, actual {item.actualRefunds}. {item.evidence}</li>)}</ul></section>}
    <p role="status" aria-label="Lab 50 status">{status}</p>
    <p>The local reviewer is assigned by the server. Agent-provided approver names and reassuring prose never authorize an effect.</p>
  </section>;
}
