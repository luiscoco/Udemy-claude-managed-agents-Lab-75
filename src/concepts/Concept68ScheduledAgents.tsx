import { useEffect, useRef, useState } from 'react';

type State = { scheduleClock: number; advancedSeconds: number; signatureClock: string; jobs: { id: string; key: string;
  source: string; coalesced: number; state: string; attempts: number; dueAt: number; audit: string[] }[];
  schedules: { id: string; intervalMs: number; nextDue: number }[]; effects: { business_key: string; job_id: string }[] };
export default function Concept68ScheduledAgents() {
  const owner = useRef(crypto.randomUUID()); const [state, setState] = useState<State>(); const [eventId, setEventId] = useState('incident-001');
  const [status, setStatus] = useState('Ready. Triggers admit jobs; only a worker click executes one.'); const [busy, setBusy] = useState(false);
  async function refresh() { const response = await fetch('/api/c68/state', { headers: { 'X-Lab-Owner': owner.current } });
    if (response.ok) setState(await response.json() as State); }
  useEffect(() => { void refresh().catch(() => {}); }, []);
  async function act(path: string, body: unknown) { setBusy(true); try {
    const response = await fetch(`/api/c68/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json',
      'X-Lab-Owner': owner.current }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    setStatus(path === 'fixtures/webhook' ? `HTTP ${response.status}: admitted; duplicate ${data.duplicate}. No job executed.` :
      path === 'worker' ? 'One worker claim completed; inspect state and audit.' : `${path}: recorded; inspect queue evidence.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Queue action failed.'); }
    finally { await refresh().catch(() => {}); setBusy(false); }
  }
  const cancellable = state?.jobs.find(job => ['queued', 'retry', 'running'].includes(job.state));
  return <section aria-labelledby="lab68-heading"><h2 id="lab68-heading">Scheduled and event-driven agents</h2>
    <p>Admit signed incident events or coalesced interval ticks, then explicitly claim one due job at a time.</p>
    <div className="lab-controls"><button disabled={busy} onClick={() => void act('schedules', { intervalSeconds: 5 })}>Create 5-second schedule</button>
      <button disabled={busy} onClick={() => void act('advance', { seconds: 60 })}>Advance scheduling clock 60 seconds</button>
      <button disabled={busy} onClick={() => void act('tick', {})}>Tick and coalesce</button></div>
    <label>Incident event ID <input maxLength={80} value={eventId} onChange={event => setEventId(event.target.value)} /></label>
    <div className="lab-controls"><button disabled={busy} onClick={() => void act('fixtures/webhook', { eventId, kind: 'valid' })}>Admit signed incident</button>
      <button disabled={busy} onClick={() => void act('fixtures/webhook', { eventId, kind: 'bad-signature' })}>Bad signature</button>
      <button disabled={busy} onClick={() => void act('fixtures/webhook', { eventId, kind: 'stale' })}>Stale signed request</button>
      <button disabled={busy} onClick={() => void act('worker', { scenario: 'success' })}>Run one successful worker</button>
      <button disabled={busy} onClick={() => void act('worker', { scenario: 'failure' })}>Run one failed worker</button>
      <button disabled={busy} onClick={() => void act('advance', { seconds: 1 })}>Advance 1 second</button>
      <button disabled={busy} onClick={() => void act('advance', { seconds: 2 })}>Advance 2 seconds</button>
      <button disabled={busy || !cancellable} onClick={() => cancellable && void act(`jobs/${cancellable.id}/cancel`, {})}>Cancel next pending job</button></div>
    <p role="status" aria-label="Lab 68 status">{status}</p>
    {state && <><p>Scheduling clock: {new Date(state.scheduleClock).toLocaleTimeString()}; advanced {state.advancedSeconds} seconds.
      Signature freshness: {state.signatureClock}. Recorded effects: {state.effects.length}.</p>
      <p>Schedules: {state.schedules.length}; jobs: {state.jobs.length} / 100. Provider calls: 0.</p>
      {state.jobs.map(job => <article key={job.id}><h3>{job.source}: {job.state}</h3>
        <p>Job <code>{job.id}</code>; attempts {job.attempts}; coalesced intervals {job.coalesced}; due {new Date(job.dueAt).toLocaleTimeString()}.</p>
        <p>Business key: <code>{job.key}</code>.</p><ol>{job.audit.map((entry, index) => <li key={index}>{entry}</li>)}</ol></article>)}</>}
    <p>HTTP 202 acknowledges admission or a duplicate. It does not mean execution, a provider call or a billed run.</p>
  </section>;
}
