import { useRef, useState } from 'react';
import { lab48SnapshotSchema } from '../../shared/lab48-security-hardening';
import type { Lab48Action, Lab48Policy } from '../../shared/lab48-security-hardening';

type Snapshot = ReturnType<typeof lab48SnapshotSchema.parse>;
const routeOf = (action: Lab48Action) => action === 'injected-egress' ? 'injection' : action === 'secret-read' ? 'secrets' : 'permissions';
export default function Concept48SecurityHardening() {
  const owner = useRef(crypto.randomUUID()); const [policy, setPolicy] = useState<Lab48Policy>('layered');
  const [action, setAction] = useState<Lab48Action>('secret-read'); const [snapshot, setSnapshot] = useState<Snapshot>();
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. The range contains a fake canary only.');
  async function run() { setBusy(true); try {
    const response = await fetch(`/api/c48/${routeOf(action)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ mode: 'scripted', policy, action }), signal: AbortSignal.timeout(7000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab48SnapshotSchema.parse(data); setSnapshot(checked);
    setStatus(checked.executed ? 'The local effect executed.' : `Blocked by ${checked.blockedBy}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Security range failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab48-heading"><h2 id="lab48-heading">Security hardening</h2>
    <p>Probe fake secret reads, out-of-scope writes and an injected request to send a canary to a loopback sink. Compare a naive policy with host-enforced layers.</p>
    <div className="lab-controls"><label>Policy<select value={policy} onChange={event => setPolicy(event.target.value as Lab48Policy)}>
      <option value="layered">Layered host policy</option><option value="naive">Naive prompt-only policy</option></select></label>
      <label>Hostile request<select value={action} onChange={event => setAction(event.target.value as Lab48Action)}>
        <option value="secret-read">Secret read</option><option value="out-of-scope-write">Out-of-scope write</option>
        <option value="injected-egress">Injected egress</option></select></label>
      <button disabled={busy} onClick={() => void run()}>Run local probe</button></div>
    {snapshot && <><h3>Observed effect</h3><p>Attempted: {String(snapshot.attempted)}. Executed: {String(snapshot.executed)}.
      Blocked by: {snapshot.blockedBy ?? 'none'}. Provider calls: {snapshot.providerCalls}.</p>
      <p>Loopback collector hits: {snapshot.collectorHits}. Canary exposed: {String(snapshot.canaryExposed)}.</p>
      <p>Allowed file: {snapshot.insideFile}. Outside file: {snapshot.outsideFile}.</p>
      <p>Custom tool event <code>{snapshot.eventId}</code>; stable business idempotency key <code>{snapshot.idempotencyKey}</code>.</p>
      <p>Tool result: {snapshot.toolResult.text}</p><ul>{snapshot.evidence.map(item => <li key={item}>{item}</li>)}</ul></>}
    <p role="status" aria-label="Lab 48 status">{status}</p>
    <p>Prompts and cwd alone do not enforce host file or network boundaries. All secrets in this range are fictional.</p>
  </section>;
}
