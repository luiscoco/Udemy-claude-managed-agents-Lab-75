import { useRef, useState } from 'react';
import { lab56ResultSchema, lab56ScenarioSchema } from '../../shared/lab56-agent-teams';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab56ScenarioSchema>;
type Result = z.infer<typeof lab56ResultSchema>;
const labels: Record<Scenario, string> = {
  'blocked-review': 'Blocked review', 'competing-claim': 'Competing claim', 'busy-shutdown': 'Busy shutdown',
  'duplicate-envelope': 'Duplicate envelope', 'ack-before-delivery': 'Acknowledge before delivery',
  'rejected-30': 'Reject answer 30', 'verified-37': 'Verify answer 37', 'clean-shutdown': 'Clean shutdown',
};
export default function Concept56AgentTeams() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<Scenario>('blocked-review');
  const [result, setResult] = useState<Result>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. The application team reducer runs offline.');
  async function replay() { setBusy(true); try { const response = await fetch('/api/c56/replay', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
    body: JSON.stringify({ scenario }), signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab56ResultSchema.parse(data); setResult(checked);
    setStatus(`${scenario}: ${checked.timeline.filter(item => item.accepted).length} accepted and ${checked.timeline.filter(item => !item.accepted).length} rejected actions.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Replay failed.'); } finally { setBusy(false); } }
  async function checkLive() { setBusy(true); try { const response = await fetch('/api/c56/live', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
    body: JSON.stringify({ mode: 'live', confirmed: true }) }); const data = await response.json();
    setStatus(data.error?.message ?? `Live route HTTP ${response.status}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Live setup check failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab56-heading"><h2 id="lab56-heading">Teams and evidence messages</h2>
    <p>Assign researcher and reviewer work, move a stable evidence envelope through delivery and acknowledgment, verify 12 + 18 + 7 = 37, and close only when work is complete.</p>
    <div className="lab-controls"><label>Team scenario<select value={scenario} disabled={busy}
      onChange={event => setScenario(lab56ScenarioSchema.parse(event.target.value))}>
      {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button disabled={busy} onClick={() => void replay()}>Replay team actions</button>
      <button disabled={busy} onClick={() => void checkLive()}>Check live delegation</button></div>
    {result && <><p>Verified answer: {result.verifiedAnswer ?? 'none'}; clean shutdown: {String(result.shutdown)};
      provider calls: {result.providerCalls}.</p>
      <div className="lab-results"><h3>Action timeline</h3><ol>{result.timeline.map(item => <li key={item.step}>
        <strong>{item.action}: {item.accepted ? 'accepted' : 'rejected'}</strong> — {item.reason} {item.effect}</li>)}</ol></div>
      <h3>Task ownership</h3><ul>{result.tasks.map(task => <li key={task.id}>{task.id}: {task.state}; owner {task.owner ?? 'none'}.</li>)}</ul>
      <h3>Evidence envelopes</h3>{result.messages.length ? <ul>{result.messages.map(message => <li key={message.id}>
        <code>{message.id}</code> from {message.from} to {message.to}: {message.status}; evidence {message.evidence}.</li>)}</ul> : <p>No envelopes yet.</p>}
      <p>{result.note}</p></>}
    <p role="status" aria-label="Lab 56 status">{status}</p>
    <p>Delivery is not acknowledgment, and acknowledgment is not task completion. Native Managed thread messages require separate live configuration and checked thread identities.</p>
  </section>;
}
