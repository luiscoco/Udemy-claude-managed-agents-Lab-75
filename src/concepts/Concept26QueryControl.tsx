import { useEffect, useRef, useState } from 'react';
import { lab26SessionSchema } from '../../shared/lab26-query-control';
import type { Lab26Call } from '../../shared/lab26-query-control';

type Snapshot = ReturnType<typeof lab26SessionSchema.parse>;
type CallWithoutId = Lab26Call extends infer T ? T extends Lab26Call ? Omit<T, 'sessionId'> : never : never;
type Catalog = { operations: string[]; updateFields: string[]; idleAgentUpdate: string; disabled: string[]; budgetNote: string };
export default function Concept26QueryControl() {
  const owner = useRef(crypto.randomUUID()); const [catalog, setCatalog] = useState<Catalog>();
  const [session, setSession] = useState<Snapshot>(); const [status, setStatus] = useState('Ready. Offline controls do not contact Anthropic.');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('Format the Aurora Finch observation.');
  const [title, setTitle] = useState('Field notebook'); const [tag, setTag] = useState('fictional');
  const [budget, setBudget] = useState(12); const [confirmResume, setConfirmResume] = useState(false);
  const [keepRead, setKeepRead] = useState(false); const [model, setModel] = useState<'fixture-model-a' | 'fixture-model-b'>('fixture-model-b');
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  useEffect(() => { void fetch('/api/c26/catalog', { headers, signal: AbortSignal.timeout(5000) }).then(async response => {
    if (!response.ok) throw new Error(); setCatalog(await response.json()); }).catch(() => setStatus('Start the backend to load the operation catalog.')); }, []);
  async function post(path: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c26/${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab26SessionSchema.parse(data); setSession(checked); setStatus(`${checked.source}: ${checked.status}; ${checked.interruption}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Control failed.'); } finally { setBusy(false); } }
  const call = (operation: CallWithoutId) => { if (session) void post('call', { ...operation, sessionId: session.sessionId }); };
  return <section aria-labelledby="lab26-heading"><h2 id="lab26-heading">Session controls and supported updates</h2>
    <p>Use an owned session ID and an allowlisted operation. Agent tool and MCP updates replace the full arrays and require idle. Model changes start a fresh session with an explicit host summary.</p>
    <p>Supported update fields: {catalog?.updateFields.join(', ') ?? 'loading'}. Disabled: {catalog?.disabled.join(', ') ?? 'loading'}.</p>
    <button disabled={busy} onClick={() => void post('open', { mode: 'scripted', scenario: 'slow', budgetCents: 10 })}>Open offline session</button>
    {session && <><p>Session <code>{session.sessionId}</code> · {session.status} · {session.model} · version {session.version}</p>
      <div className="lab-controls"><label>Message<input value={message} maxLength={300} onChange={event => setMessage(event.target.value)} /></label>
        <button disabled={busy || session.status !== 'idle'} onClick={() => call({ operation: 'send', message })}>Send slow turn</button>
        <button disabled={busy || session.status !== 'running'} onClick={() => call({ operation: 'interrupt' })}>Interrupt and confirm idle</button>
        <button disabled={busy} onClick={() => call({ operation: 'retrieve' })}>Retrieve</button>
        <button disabled={busy} onClick={() => call({ operation: 'history' })}>History</button></div>
      <div className="lab-controls"><label>Title<input value={title} maxLength={80} onChange={event => setTitle(event.target.value)} /></label>
        <label>Metadata tag<input value={tag} maxLength={40} onChange={event => setTag(event.target.value)} /></label>
        <button disabled={busy} onClick={() => call({ operation: 'title-metadata', title, tag })}>Update title and metadata</button></div>
      <div className="lab-controls"><label><input type="checkbox" checked={keepRead} onChange={event => setKeepRead(event.target.checked)} /> Keep read_report tool</label>
        <button disabled={busy} onClick={() => call({ operation: 'idle-tools-mcp', tools: keepRead ? ['read_report'] : [], mcpServers: [] })}>Replace idle tools and MCP</button>
        <label>Budget cents<input type="number" min="1" max="100" value={budget} onChange={event => setBudget(Number(event.target.value))} /></label>
        <label><input type="checkbox" checked={confirmResume} onChange={event => setConfirmResume(event.target.checked)} /> Opt in to possible resume</label>
        <button disabled={busy} onClick={() => call({ operation: 'budget-change', budgetCents: budget, confirmResume })}>Change budget</button></div>
      <div className="lab-controls"><label>Fresh fixture model<select value={model} onChange={event => setModel(event.target.value as typeof model)}>
        <option value="fixture-model-a">fixture-model-a</option><option value="fixture-model-b">fixture-model-b</option></select></label>
        <button disabled={busy} onClick={() => call({ operation: 'fresh-model-handoff', model, summary: 'Fictional field notebook: Aurora Finch observed offline.' })}>New session with summary</button>
        <button disabled={busy || session.status !== 'idle'} onClick={() => call({ operation: 'archive' })}>Archive idle session</button></div>
      <p>Tools: {session.tools.join(', ') || 'none'}. MCP: {session.mcpServers.join(', ') || 'none'}. Budget: {session.budgetCents} cents.</p>
      <p>Parent: {session.parentSessionId ?? 'none'}. Summary handoff: {(session.summaryHandoff ?? 'none').replace(/\.$/, '')}.</p>
      <h3>Authored history</h3><ol>{session.history.map((event, index) => <li key={index}>{event}</li>)}</ol></>}
    <p role="status" aria-label="Lab 26 status">{status}</p><p>Live mode is unavailable in this lab. Closing this browser request cannot prove a remote stop; use interrupt and confirmed idle for remote work. {catalog?.budgetNote}</p>
  </section>;
}
