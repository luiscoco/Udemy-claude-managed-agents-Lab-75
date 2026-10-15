import { useEffect, useRef, useState } from 'react';
import { lab20FileSchema, lab20FilesSchema, lab20ResultSchema, lab20Scenarios } from '../../shared/lab20-hooks-in-depth';
import type { Lab20Result } from '../../shared/lab20-hooks-in-depth';
import { LiveActionButton } from '../components/LiveActionButton';
import { streamPost } from '../lib/sse';

export default function Concept20HooksInDepth() {
  const owner = useRef(crypto.randomUUID()), controller = useRef<AbortController | null>(null);
  const [scenario, setScenario] = useState<(typeof lab20Scenarios)[number]>('passing-policy');
  const [prompt, setPrompt] = useState('Review the draft fixture and report whether the edit succeeded.');
  const [result, setResult] = useState<Lab20Result>();
  const [status, setStatus] = useState('Ready. Offline fixtures start no Anthropic session.');
  const [busy, setBusy] = useState(false), [liveReady, setLiveReady] = useState(false);
  const [fileText, setFileText] = useState('');
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  async function availability() {
    const response = await fetch('/api/c20/availability', { headers, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Availability HTTP ${response.status}`);
    const data = await response.json() as { liveReady: boolean };
    setLiveReady(data.liveReady === true); return data.liveReady === true;
  }
  useEffect(() => { void availability().catch(() => setLiveReady(false)); }, []);
  async function run(mode: 'scripted' | 'live') {
    if (busy || controller.current) return;
    setBusy(true); const abort = new AbortController(); controller.current = abort;
    try {
      setStatus(mode === 'live' ? 'Starting one bounded billed Managed session…' : 'Running the authored offline fixture…');
      const body = { mode, scenario: mode === 'live' ? 'passing-policy' : scenario, prompt, deadlineSeconds: 30, budgetCents: 50 };
      const output = await streamPost('/api/c20/run', body, { headers, signal: abort.signal, idleMs: 30000,
        deadlineMs: 70000, resultSchema: lab20ResultSchema });
      if (output.kind !== 'success') { setStatus('Local stream ended without a confirmed result; inspect cleanup before retrying.'); return; }
      setResult(output.result); setFileText(''); setStatus(`${output.result.outcome}. ${output.result.note}`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Run failed.'); }
    finally { controller.current = null; setBusy(false); }
  }
  async function readFiles() {
    if (!result) return;
    try {
      const response = await fetch(`/api/c20/files?runId=${result.runId}`, { headers });
      if (!response.ok) throw new Error(`Files HTTP ${response.status}`);
      const data = lab20FilesSchema.parse(await response.json());
      setFileText(data.files.map(file => `${file.path}:\n${file.content}`).join('\n\n'));
    } catch (error) { setStatus(error instanceof Error ? error.message : 'File inspection failed.'); }
  }
  async function readDraft() {
    if (!result) return;
    try {
      const response = await fetch(`/api/c20/file?runId=${result.runId}&name=draft.md`, { headers });
      if (!response.ok) throw new Error(`File HTTP ${response.status}`);
      const data = lab20FileSchema.parse(await response.json()); setFileText(data.file.content);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Draft inspection failed.'); }
  }
  async function reset() {
    if (!result || busy) return; setBusy(true);
    try { const response = await fetch('/api/c20/reset', { method: 'POST', headers,
      body: JSON.stringify({ runId: result.runId, confirmReset: true }) });
      if (!response.ok) throw new Error(`Reset HTTP ${response.status}`);
      setResult(undefined); setFileText(''); setStatus('Selected host fixture removed.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Reset failed.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="lab20-heading"><h2 id="lab20-heading">Lifecycle events and host interceptors</h2>
    <p>Compare observed Managed events with application audit records. A post-execution event cannot block an effect that already happened.</p>
    <div className="lab-controls"><label>Offline scenario<select aria-label="Offline lifecycle scenario" value={scenario} disabled={busy}
      onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab20Scenarios.map(value => <option value={value} key={value}>{value}</option>)}</select></label>
      <label>Prompt<input aria-label="Lifecycle prompt" value={prompt} maxLength={600} onChange={event => setPrompt(event.target.value)} /></label>
      <button disabled={busy} onClick={() => void run('scripted')}>Run offline lifecycle</button>
      {busy && <button onClick={() => controller.current?.abort()}>Cancel active run</button>}</div>
    <LiveActionButton busy={busy} available={liveReady} checkAvailability={availability} onRun={() => void run('live')} keyIsolated
      setup="Configure the isolated server API key, base Managed setup, LAB07 custom-tool agent and MANAGED_LIVE_ENABLED=true. A deliberate Run live click creates one billed session; only the passing-policy path runs live." />
    <p role="status" aria-label="Lifecycle experiment status">{status}</p>
    {result && <article aria-label="Lifecycle result"><h3>Run and effect evidence</h3>
      <p>Source: {result.source}. Scenario: {result.scenario}. Outcome: <strong>{result.outcome}</strong>. Session: <code>{result.sessionId ?? 'none'}</code>. Cleanup: {result.cleanup}. Virtual ticks: {result.virtualTicks ?? 'not used'}.</p>
      <p>Draft after run: <code>{result.files.find(file => file.path === 'workspace/draft.md')?.content.trim() ?? 'absent'}</code></p>
      <div className="lab-controls"><button onClick={() => void readFiles()}>Inspect run files</button>
        <button onClick={() => void readDraft()}>Inspect draft.md</button>
        <button disabled={busy} onClick={() => void reset()}>Reset this fixture</button></div>
      {fileText && <pre aria-label="Inspected file contents"><code>{fileText}</code></pre>}
      <h3>Provider event projection</h3><p>Only observed stream frames appear here. Authored fixture frames are labeled by source.</p>
      {result.providerEvents.length ? <ol>{result.providerEvents.map((event, index) => <li key={`${event.eventId}-${index}`}>
        <strong>{event.kind}</strong> · {event.type} · {event.detail} <small>event {event.eventId ?? 'none'}, thread {event.threadId ?? 'primary or unspecified'}</small>
      </li>)}</ol> : <p>No provider event was observed in this scenario.</p>}
      <h3>Host audit</h3><ol>{result.hostAudit.map((event, index) => <li key={index}>
        <strong>{event.kind}</strong> · {event.phase} · {event.outcome} · {event.detail} <small>event {event.eventId ?? 'none'}</small>
      </li>)}</ol>
      <p>{result.note}</p></article>}
  </section>;
}
