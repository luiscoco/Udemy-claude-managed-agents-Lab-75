import { useEffect, useRef, useState } from 'react';
import type { Lab69Context, Lab69Patch } from '../../shared/lab69-embedding-sdk';

type Run = { id: string; state: string; source: string; cleanup: string; patch: Lab69Patch | null;
  events: { seq: number; type: string; text: string }[] };
export default function Concept69EmbeddingSdk() {
  const owner = useRef(crypto.randomUUID()); const [document, setDocument] = useState<Lab69Context>();
  const [run, setRun] = useState<Run>(); const [scenario, setScenario] = useState('normal'); const [busy, setBusy] = useState(false);
  const [liveReady, setLiveReady] = useState(false); const [status, setStatus] = useState('Loading a fictional host document.');
  async function api(path: string, body?: unknown) { const response = await fetch(`/api/c69/${path}`, {
    method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data; }
  useEffect(() => { void Promise.all([api('document'), api('facts')]).then(([doc, facts]) => {
    setDocument(doc as Lab69Context); setLiveReady(Boolean(facts.liveReady)); setStatus('Ready. Explicit context is local; a proposed patch does not apply itself.');
  }).catch(error => setStatus(String(error))); }, []);
  useEffect(() => { if (!run || run.state !== 'running') return; let alive = true;
    const timer = setInterval(() => { void api(`runs/${run.id}`).then(data => { if (alive) {
      setRun(data as Run); if (data.state !== 'running') setStatus(`${data.state}; cleanup ${data.cleanup}. Review before applying.`); }
    }).catch(error => { if (alive) setStatus(String(error)); }); }, 150);
    return () => { alive = false; clearInterval(timer); }; }, [run?.id, run?.state]);
  async function act(action: 'offline' | 'live' | 'change' | 'apply' | 'cancel') { setBusy(true); try {
    if (action === 'offline' || action === 'live') { const data = await api('runs', { correlationId: crypto.randomUUID(), context: document,
      mode: action, scenario }); setRun(data as Run); setStatus('Host run started with explicit document context.'); }
    else if (action === 'change') { setDocument(await api('document/change', {}) as Lab69Context); setStatus('Local document changed; any older patch must now conflict.'); }
    else if (action === 'apply' && run) { setDocument(await api('document/apply', { runId: run.id }) as Lab69Context);
      setRun(current => current ? { ...current, patch: null } : current);
      setStatus('Reviewed patch applied by the local host guard.'); }
    else if (run) { await api(`runs/${run.id}/cancel`, {}); setStatus('Local cancellation requested; waiting for host cleanup evidence.'); }
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Host operation failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab69-heading"><h2 id="lab69-heading">Desktop and IDE host integration</h2>
    <p>Capture explicit context, inspect previews and a proposed replacement, then apply only if the local document still matches.</p>
    <label>Guided scenario <select value={scenario} onChange={event => setScenario(event.target.value)}>
      <option value="normal">Normal patch proposal</option><option value="transport-failure">Transport failure</option><option value="hang">Hang until cancellation</option></select></label>
    <div className="lab-controls"><button disabled={busy || !document || run?.state === 'running'} onClick={() => void act('offline')}>Start guided review</button>
      <button disabled={busy || !liveReady || run?.state === 'running' || scenario !== 'normal'} onClick={() => void act('live')}>Run live review</button>
      <button disabled={busy || !document} onClick={() => void act('change')}>Change local document</button>
      <button disabled={busy || !run?.patch} onClick={() => void act('apply')}>Apply reviewed patch</button>
      <button disabled={busy || run?.state !== 'running'} onClick={() => void act('cancel')}>Cancel review</button></div>
    <p role="status" aria-label="Lab 69 status">{status}</p>
    {document && <><p>Host document version: {document.version}; hash: <code>{document.hash}</code>.</p>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{document.text}</pre></>}
    {run && <><p>Run: {run.id}; {run.state}; source: {run.source}; cleanup: {run.cleanup}.</p>
      <ol>{run.events.map(event => <li key={event.seq}>{event.type}: {event.text}</li>)}</ol>
      {run.patch && <><h3>Proposed replacement</h3><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{run.patch.replacement}</pre></>}</>}
    <p>The runnable VS Code extension is in extensions/lab69. This browser exercise does not prove extension execution; the trusted extension host resolves workspace trust and file boundaries.</p>
  </section>;
}
