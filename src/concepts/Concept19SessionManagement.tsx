import { useEffect, useRef, useState } from 'react';
import { lab19DetailSchema, lab19ListSchema } from '../../shared/lab19-session-management';
import type { Lab19Detail, Lab19Summary } from '../../shared/lab19-session-management';
import { LiveActionButton } from '../components/LiveActionButton';
import { streamPost } from '../lib/sse';

const base = '/api/c19';
export default function Concept19SessionManagement() {
  const owner = useRef(crypto.randomUUID()), controller = useRef<AbortController | null>(null);
  const [mode, setMode] = useState<'scripted' | 'live'>('scripted');
  const [prompt, setPrompt] = useState('Remember that my fictional project is Aurora Finch.');
  const [selected, setSelected] = useState('');
  const [boundary, setBoundary] = useState('');
  const [title, setTitle] = useState('Aurora field notebook');
  const [tag, setTag] = useState('reviewed');
  const [sessions, setSessions] = useState<Lab19Summary[]>([]);
  const [detail, setDetail] = useState<Lab19Detail>();
  const [status, setStatus] = useState('Ready. Start an offline conversation; no provider request is made on page load.');
  const [busy, setBusy] = useState(false);
  const [liveReady, setLiveReady] = useState(false);
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  async function json(path: string, body?: unknown) {
    const response = await fetch(`${base}${path}`, { method: body === undefined ? 'GET' : 'POST', headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data: unknown = await response.json();
    if (!response.ok) throw new Error((data as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`);
    return data;
  }
  async function inventory(provider = false) {
    const data = lab19ListSchema.parse(await json(`/sessions${provider ? '?provider=yes' : ''}`));
    setSessions(data.sessions); if (provider) setStatus(`${data.note} Provider listing: ${data.providerListing}; omitted page: ${data.providerPageOmitted}.`);
  }
  async function availability() {
    const data = await json('/availability') as { liveReady: boolean };
    setLiveReady(data.liveReady === true); return data.liveReady === true;
  }
  useEffect(() => { void inventory().catch(() => setStatus('Start the backend to inspect the session inventory.'));
    void availability().catch(() => setLiveReady(false)); }, []);
  async function inspect(id = selected, cursor?: string, provider = false) {
    const query = new URLSearchParams(); if (cursor) query.set('cursor', cursor); if (provider) query.set('provider', 'yes');
    const data = lab19DetailSchema.parse(await json(`/sessions/${id}${query.size ? `?${query}` : ''}`));
    setSelected(id); setDetail(data); setBoundary(data.hostEvents.at(-1)?.id ?? ''); setStatus(data.note);
  }
  async function run(action: 'new' | 'continue' | 'branch', requestedMode = mode) {
    if (busy) return; if (action !== 'new' && !selected) { setStatus('Select an owned conversation first.'); return; }
    if (action === 'branch' && !boundary) { setStatus('Select a host event boundary first.'); return; }
    setBusy(true); const abort = new AbortController(); controller.current = abort;
    try {
      const path = action === 'branch' ? `/sessions/${selected}/branch` : '/turn';
      const body = action === 'branch' ? { boundaryEventId: boundary, prompt, deadlineSeconds: 30, budgetCents: 50 }
        : { mode: requestedMode, action, ...(action === 'continue' ? { conversationId: selected } : {}), prompt,
          deadlineSeconds: 30, budgetCents: 50 };
      setStatus(action === 'branch' ? 'Creating a fresh session from selected host history…' : 'Waiting for the session turn…');
      const result = await streamPost(`${base}${path}`, body, { headers, signal: abort.signal, idleMs: 30000,
        deadlineMs: 70000, resultSchema: lab19DetailSchema });
      if (result.kind !== 'success') { setStatus('Local stream ended without a confirmed result; inspect cleanup.'); return; }
      const data = result.result; setDetail(data); setSelected(data.session.conversationId);
      setBoundary(data.hostEvents.at(-1)?.id ?? ''); await inventory();
      setStatus(`${action === 'branch' ? 'Derived' : 'Retained'} session ${data.session.sessionId ?? 'unconfirmed'}: ${data.session.state}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Session operation failed.'); }
    finally { controller.current = null; setBusy(false); }
  }
  async function mutate(action: 'rename' | 'tag' | 'archive' | 'delete') {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const body = action === 'rename' ? { title } : action === 'tag' ? { tag }
        : action === 'delete' ? { confirmDelete: true } : {};
      const data = await json(`/sessions/${selected}/${action}`, body);
      if (action === 'delete') { setDetail(undefined); setSelected(''); setBoundary(''); setStatus('Selected owned idle session deleted.'); }
      else { const next = lab19DetailSchema.parse(data); setDetail(next); setStatus(next.note); }
      await inventory();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Session action failed.'); }
    finally { setBusy(false); }
  }
  async function reset() { if (busy) return; setBusy(true); try { await json('/reset', { mode: 'scripted', confirmReset: true });
    setDetail(undefined); setSelected(''); setBoundary(''); await inventory(); setStatus('Owned offline fixtures closed and removed.');
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Reset failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab19-heading"><h2 id="lab19-heading">Session inventory and explicit branches</h2>
    <p>Continue an owned session, page through captured events, or start a new derived session with a visible selected-history summary.</p>
    <div className="lab-controls"><label>Experiment mode<select aria-label="Experiment mode" value={mode} disabled={busy}
      onChange={event => setMode(event.target.value as 'scripted' | 'live')}><option value="scripted">Offline fixture</option><option value="live">Live Managed API</option></select></label>
      <label>Prompt<input aria-label="Session prompt" value={prompt} maxLength={500} onChange={event => setPrompt(event.target.value)} /></label>
      <button disabled={busy || mode !== 'scripted'} onClick={() => void run('new')}>Start offline session</button>
      <button disabled={busy || !selected || detail?.session.state !== 'idle'} onClick={() => void run('continue', detail?.session.mode ?? mode)}>Send another turn</button>
      <button disabled={busy || !selected || !boundary || detail?.session.state !== 'idle'} onClick={() => void run('branch', detail?.session.mode ?? mode)}>Derive conversation</button>
      <button disabled={busy} onClick={() => void inventory()}>Refresh owned inventory</button>
      <button disabled={busy} onClick={() => void reset()}>Reset offline fixtures</button>
      {busy && <button onClick={() => controller.current?.abort()}>Cancel active turn</button>}</div>
    <LiveActionButton busy={busy} available={liveReady} checkAvailability={availability} onRun={() => void run('new', 'live')}
      keyIsolated setup="Configure the isolated server API key, base agent and MANAGED_LIVE_ENABLED=true. Run live creates one billed fresh session; follow-up operations may create additional billed turns." />
    <p role="status" aria-label="Session experiment status">{status}</p>
    <h3>Owned conversation inventory</h3><ul>{sessions.map(session => <li key={session.conversationId}>
      <button disabled={busy} onClick={() => void inspect(session.conversationId)}>{session.title}: {session.mode}, {session.state}, {session.turnCount} turns</button>
      <small> {session.conversationId}; remote {session.sessionId ?? 'pending'}; parent {session.lineageParentId ?? 'none'}</small>
    </li>)}</ul>
    {detail && <article aria-label="Selected conversation evidence"><h3>Selected conversation</h3>
      <p>Title: {detail.session.title}. State: {detail.session.state}. Remote session: <code>{detail.session.sessionId ?? 'none'}</code>. Tag: {detail.session.tag ?? 'none'}.</p>
      <p>Parent: <code>{detail.session.lineageParentId ?? 'none'}</code>. Boundary: <code>{detail.session.lineageBoundaryEventId ?? 'none'}</code>.</p>
      {detail.summaryHandoff && <p>Explicit summary handoff: {detail.summaryHandoff}</p>}
      <div className="lab-controls"><label>Rename<input aria-label="Session title" value={title} maxLength={80} onChange={event => setTitle(event.target.value)} /></label>
        <button disabled={busy || detail.session.state !== 'idle'} onClick={() => void mutate('rename')}>Rename idle session</button>
        <label>Tag<input aria-label="Session tag" value={tag} maxLength={32} onChange={event => setTag(event.target.value)} /></label>
        <button disabled={busy || detail.session.state !== 'idle'} onClick={() => void mutate('tag')}>Tag idle session</button>
        <button disabled={busy || detail.session.state !== 'idle'} onClick={() => void mutate('archive')}>Archive idle session</button>
        <button disabled={busy || detail.session.state !== 'idle'} onClick={() => void mutate('delete')}>Delete selected idle session</button>
        <button disabled={busy || detail.session.mode !== 'live'} onClick={() => void inspect(selected, undefined, true)}>Retrieve provider metadata and events</button></div>
      <h4>Host-captured events and branch boundary</h4><ol>{detail.hostEvents.map(event => <li key={event.id}>
        <label><input type="radio" name="branch-boundary" checked={boundary === event.id} onChange={() => setBoundary(event.id)} />
          {event.type}: {event.text}</label></li>)}</ol>
      <h4>History page</h4><p>Source: {detail.page.source}. More pages omitted: {String(detail.page.omittedPages)}.</p>
      <ol>{detail.page.events.map(event => <li key={event.id}>{event.type}: {event.text}</li>)}</ol>
      {detail.page.nextCursor && <button disabled={busy} onClick={() => void inspect(selected, detail.page.nextCursor ?? undefined,
        detail.page.source === 'managed-api')}>Load next history page</button>}
      <p>{detail.note}</p></article>}
  </section>;
}
