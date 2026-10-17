import { useEffect, useRef, useState } from 'react';

type Proposal = { id: string; action: string; args: { caseId: string; reason: string }; eventId: string;
  businessKey: string; reviewer: string; expiresAt: number; state: string; notified: string | null; audit: string[] };
type Snapshot = { proposals: Proposal[]; effects: { business_key: string; case_id: string; proposal_id: string }[];
  reviewerMode: string; providerCalls: number };
type NotificationSetup = { channel: 'slack' | 'teams' | 'email'; ready: boolean; enabled: boolean; missing: string[]; invalid: string[]; enableSetting: string };
export default function Concept65HumanApproval() {
  const owner = useRef(crypto.randomUUID()); const [snapshot, setSnapshot] = useState<Snapshot>();
  const [status, setStatus] = useState('Ready. No notification has been sent.'); const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<NotificationSetup[]>([]);
  useEffect(() => { void fetch('/api/c65/review', { headers: { 'X-Lab-Owner': owner.current } })
    .then(response => response.json()).then(data => setSnapshot(data as Snapshot)).catch(() => {}); }, []);
  useEffect(() => { void fetch('/api/c65/facts', { headers: { 'X-Lab-Owner': owner.current } })
    .then(response => { if (!response.ok) throw new Error('Notification setup unavailable.'); return response.json(); })
    .then(data => setSetup(data.notificationSetup ?? [])).catch(() => setStatus('Notification setup unavailable; check the backend.')); }, []);
  const selected = snapshot?.proposals.at(-1);
  async function run(action: 'propose' | 'notify' | 'decide' | 'reject' | 'tamper' | 'expire' | 'wrong-reviewer' | 'duplicate', channel: 'local' | 'slack' | 'teams' | 'email' = 'local') {
    setBusy(true); try {
      const other = action === 'wrong-reviewer'; const actual = other || action === 'duplicate' || action === 'reject' ? 'decide' : action;
      const body = actual === 'propose' ? { action: 'propose' } : actual === 'notify' ?
        { action: 'notify', proposalId: selected?.id, channel } : actual === 'decide' ?
          { action: 'decide', proposalId: selected?.id, decision: action === 'reject' ? 'reject' : 'approve' } : actual === 'tamper' ?
            { action: 'tamper', proposalId: selected?.id, caseId: 'CASE-9999' } :
            { action: 'expire', proposalId: selected?.id };
      const response = await fetch('/api/c65/run', { method: 'POST', headers: { 'Content-Type': 'application/json',
        'X-Lab-Owner': other ? 'wrong-reviewer-fixture' : owner.current }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
      if (actual === 'propose') { setSnapshot(data.snapshot as Snapshot);
        setStatus(`Pending proposal ${data.toolResult.proposalId}; custom tool result correlated to ${data.toolResult.custom_tool_use_id}.`); }
      else if (actual === 'tamper') { setSnapshot(data.snapshot as Snapshot); setStatus(`Changed action blocked: ${data.blocked}.`); }
      else { setSnapshot(data as Snapshot); setStatus(actual === 'notify' ? channel === 'local' ? 'Local notification recorded; no message sent.' : `${channel} notification accepted by the configured provider; approval is still required.` :
        actual === 'expire' ? 'Proposal expired before review.' : `Decision recorded; effects: ${data.effects.length}.`); }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Approval operation failed.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="lab65-heading"><h2 id="lab65-heading">Human approval over Slack, Teams or email</h2>
    <p>Preview a fictional case archive, notify locally, inspect immutable arguments, then approve or reject as the local reviewer.</p>
    <div className="lab-controls"><button disabled={busy} onClick={() => void run('propose')}>Preview proposal</button>
      <button disabled={busy || !selected} onClick={() => void run('notify')}>Notify locally</button>
      <button disabled={busy || !selected} onClick={() => void run('decide')}>Approve as reviewer</button>
      <button disabled={busy || !selected} onClick={() => void run('reject')}>Reject as reviewer</button>
      <button disabled={busy || !selected} onClick={() => void run('duplicate')}>Duplicate click</button>
      <button disabled={busy || !selected} onClick={() => void run('tamper')}>Tamper action</button>
      <button disabled={busy || !selected} onClick={() => void run('wrong-reviewer')}>Wrong reviewer</button>
      <button disabled={busy || !selected} onClick={() => void run('expire')}>Expire proposal</button></div>
    <p role="status" aria-label="Lab 65 status">{status}</p>
    <h3>Notification setup</h3><p>Settings are checked locally. Delivery is verified only after an explicit send.</p>
    <ul>{setup.map(item => <li key={item.channel}><strong>{item.channel}</strong>: {item.ready ? 'configured; delivery not yet verified' : 'setup required'}.
      {!item.enabled && <p>Enable {item.enableSetting} on the server.</p>}
      {item.missing.length > 0 && <p>Missing: {item.missing.join(', ')}.</p>}
      {item.invalid.length > 0 && <p>Invalid: {item.invalid.join(', ')}.</p>}
      <button disabled={busy || !item.ready || selected?.state !== 'pending'} onClick={() => void run('notify', item.channel)}>Send {item.channel} notification</button>
    </li>)}</ul>
    {snapshot && <><p>Reviewer mode: {snapshot.reviewerMode}. Provider calls: {snapshot.providerCalls}.</p>
      {snapshot.proposals.map(proposal => <article key={proposal.id}><h3>{proposal.action}: {proposal.args.caseId}</h3>
        <p>Immutable reason: {proposal.args.reason}. State: {proposal.state}. Notified: {proposal.notified ?? 'no'}.</p>
        <p>Tool event: <code>{proposal.eventId}</code>. Business key: <code>{proposal.businessKey}</code>.</p>
        <p>Reviewer: {proposal.reviewer}. Expires: {new Date(proposal.expiresAt).toLocaleTimeString()}.</p>
        <ol>{proposal.audit.map((entry, index) => <li key={index}>{entry}</li>)}</ol></article>)}
      <p>Executed effects: {snapshot.effects.length}.</p></>}
    <p>Slack, Teams Workflow and Graph email are optional server-configured notification adapters. They are disabled by default and never approve a proposal; only a reviewed same-origin decision does.</p>
  </section>;
}
