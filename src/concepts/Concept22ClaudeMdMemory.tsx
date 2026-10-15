import { useEffect, useRef, useState } from 'react';
import { lab22FileSchema, lab22ResultSchema, lab22Scenarios } from '../../shared/lab22-claude-md-memory';
import type { Lab22Result } from '../../shared/lab22-claude-md-memory';
import { LiveActionButton } from '../components/LiveActionButton';
import { streamPost } from '../lib/sse';

type File = ReturnType<typeof lab22FileSchema.parse>;
export default function Concept22ClaudeMdMemory() {
  const owner = useRef(crypto.randomUUID()), controller = useRef<AbortController | null>(null);
  const [files, setFiles] = useState<File[]>([]), [scenario, setScenario] = useState<(typeof lab22Scenarios)[number]>('nested');
  const [question, setQuestion] = useState('Which observation details are confirmed, and which are still unknown?');
  const [result, setResult] = useState<Lab22Result>(), [busy, setBusy] = useState(false), [liveReady, setLiveReady] = useState(false);
  const [status, setStatus] = useState('Ready. Offline file reads use authored fixtures and contact no provider.');
  const headers = { 'X-Lab-Owner': owner.current, 'Content-Type': 'application/json' };
  async function inventory() { const response = await fetch('/api/c22/files', { headers, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`File inventory HTTP ${response.status}`);
    const data = await response.json() as { files: unknown[] };
    setFiles(data.files.map(file => lab22FileSchema.parse(file)));
  }
  async function setup() { const response = await fetch('/api/managed/setup', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Cannot check live setup.');
    const data = await response.json() as { liveReady: boolean }; setLiveReady(data.liveReady === true); return data.liveReady === true; }
  useEffect(() => { void inventory().catch(() => setStatus('Start the backend to inspect fixture files.'));
    void setup().catch(() => setLiveReady(false)); return () => { controller.current?.abort(); }; }, []);
  async function run(mode: 'scripted' | 'live') { if (busy || controller.current) return;
    const abort = new AbortController(); controller.current = abort; setBusy(true);
    try { if (mode === 'live' && !await setup()) throw new Error('Live setup is unavailable.');
      setStatus(mode === 'live' ? 'Starting one bounded billed session…' : 'Reading selected authored files and running a fresh offline session…');
      const outcome = await streamPost('/api/c22/run', { mode, scenario, question, deadlineSeconds: 30, budgetCents: 50 },
        { headers, signal: abort.signal, idleMs: 30000, deadlineMs: 70000, resultSchema: lab22ResultSchema });
      if (outcome.kind !== 'success') { setStatus('Local run stopped. Inspect cleanup before retrying live.'); return; }
      setResult(outcome.result); setStatus(`Fresh ${outcome.result.source} session finished; cleanup: ${outcome.result.cleanup}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Context run failed.'); }
    finally { controller.current = null; setBusy(false); }
  }
  async function reset() { if (!result || busy) return; setBusy(true);
    try { const response = await fetch('/api/c22/reset', { method: 'POST', headers,
      body: JSON.stringify({ runId: result.runId, confirmReset: true }) });
      if (!response.ok) throw new Error(`Reset HTTP ${response.status}`);
      setResult(undefined); setStatus('Owned result cleared. The authored fixture files are unchanged.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Reset failed.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="lab22-heading"><h2 id="lab22-heading">Explicit project context and memory</h2>
    <p>The host selects named files and adds their bytes to a user message. No automatic CLAUDE.md hierarchy, home memory, or cloud memory attachment is assumed.</p>
    <h3>Authored file inventory</h3><ul>{files.map(file => <li key={file.key}><strong>{file.key}</strong>: <code>{file.path}</code> ({file.trust}, {file.bytes} bytes, SHA-256 <code>{file.sha256.slice(0, 16)}…</code>)</li>)}</ul>
    <details><summary>Preview authored files</summary>{files.map(file => <article key={file.key}><h4>{file.path}</h4><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{file.content}</pre></article>)}</details>
    <div className="lab-controls"><label>Context scenario<select aria-label="Context scenario" value={scenario} disabled={busy} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab22Scenarios.map(value => <option value={value} key={value}>{value}</option>)}</select></label>
      <label>Question<input aria-label="Context question" value={question} maxLength={100} disabled={busy} onChange={event => setQuestion(event.target.value)} /></label>
      <button disabled={busy} onClick={() => void run('scripted')}>Run offline context</button>
      {busy && <button onClick={() => controller.current?.abort()}>Cancel active run</button>}
      <button disabled={busy || !result} onClick={() => void reset()}>Reset selected result</button></div>
    <LiveActionButton busy={busy} available={liveReady && scenario !== 'conflict'} checkAvailability={setup} onRun={() => void run('live')} keyIsolated
      {...(scenario === 'conflict' ? { blockedReason: 'The conflicting untrusted document is an offline-only exercise.' } : {})}
      setup="Configure the isolated server API key, a single-agent Managed base and environment, and MANAGED_LIVE_ENABLED=true. Run live starts one billed text-only session; no memory store is attached. The conflict scenario is offline only." />
    <p role="status" aria-label="Context status">{status}</p>
    {result && <section aria-label="Context result"><h3>Fresh session evidence</h3>
      <p>Source: {result.source}. Session: <code>{result.sessionId ?? 'none'}</code>. State: {result.sessionState}. Cleanup: {result.cleanup}.</p>
      <p>Selected host reads: {result.readKeys.join(', ') || 'none'}. Disabled sources: {result.disabledKeys.join(', ') || 'none'}.</p>
      <p>Cloud memory: {result.cloudMemory}. Observed remote file reads: {result.remoteFileReads.length}.</p>
      <h4>Exact user.message sent</h4><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{result.userMessage}</pre>
      <h4>Observed model or fixture text</h4><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{result.response || 'No text observed.'}</pre>
      <p>{result.note}</p></section>}
  </section>;
}
