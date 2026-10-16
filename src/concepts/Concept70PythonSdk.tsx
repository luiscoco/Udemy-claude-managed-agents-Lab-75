import { useEffect, useRef, useState } from 'react';
import type { Lab70Frame } from '../../shared/lab70-python-sdk';

type Facts = { pythonPin: string; typescriptPin: string; interpreterAvailable: boolean; liveReady: boolean;
  capability: { version: string; capable: boolean; reason: string } | null };
type Session = { handle: string; remoteId: string; state: string; mode: string };
type Run = { id: string; state: string; source: string; frames: Lab70Frame[]; sessionHandle: string | null;
  reply: { protocolError: string | null; stderrBytes: number; stderrTruncated: boolean; killed: boolean; stderrPreview: string } | null };
export default function Concept70PythonSdk() {
  const owner = useRef(crypto.randomUUID()); const [facts, setFacts] = useState<Facts>(); const [sessions, setSessions] = useState<Session[]>([]);
  const [run, setRun] = useState<Run>(); const [operation, setOperation] = useState('one-shot'); const [scenario, setScenario] = useState('normal');
  const [prompt, setPrompt] = useState('Format a fictional observation of three Aurora Finches.');
  const [status, setStatus] = useState('Ready. Offline Python uses standard-library fixtures and never installs packages.'); const [busy, setBusy] = useState(false);
  async function api(path: string, body?: unknown) { const response = await fetch(`/api/c70/${path}`, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000) }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data; }
  useEffect(() => { void api('facts').then(data => setFacts(data as Facts)).catch(() => {}); }, []);
  useEffect(() => { if (!run || run.state !== 'running') return; let alive = true;
    const timer = setInterval(() => { void api(`runs/${run.id}`).then(async data => { if (!alive) return;
      const list = data.state !== 'running' ? await api('sessions') as Session[] : null;
      if (!alive) return; setRun(data as Run);
      if (list) { setStatus(`${data.state}: Python worker finished; inspect protocol and cleanup evidence.`); setSessions(list); }
    }).catch(error => { if (alive) setStatus(String(error)); }); }, 150);
    return () => { alive = false; clearInterval(timer); }; }, [run?.id, run?.state]);
  async function start(mode: 'offline' | 'live') { setBusy(true); try {
    const session = sessions.find(item => item.state === 'idle' && item.mode === mode);
    const data = await api('runs', { mode, operation, scenario, prompt,
      ...(['retained-turn', 'close'].includes(operation) && session ? { sessionHandle: session.handle } : {}) });
    setRun(data as Run); setStatus('Python worker started with fixed arguments and a narrow environment.');
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Python bridge failed.'); } finally { setBusy(false); } }
  async function probe() { setBusy(true); try { setFacts(await api('probe', {}) as Facts); setStatus('Readiness checked locally; no package install or provider request.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Readiness failed.'); } finally { setBusy(false); } }
  const final = run?.frames.find((frame): frame is Extract<Lab70Frame, { type: 'result' }> => frame.type === 'result');
  return <section aria-labelledby="lab70-heading"><h2 id="lab70-heading">Python client for Managed Agents</h2>
    <p>Compare the same remote session protocol through a bounded JSON-lines Python worker while the learning platform remains TypeScript.</p>
    {facts && <p>Python pin: anthropic {facts.pythonPin}; TypeScript pin: {facts.typescriptPin}. Interpreter available: {String(facts.interpreterAvailable)}.
      Selected isolated package: {facts.capability?.version ?? 'not checked'}. {facts.capability?.reason}</p>}
    <label>Session operation <select value={operation} onChange={event => setOperation(event.target.value)}>
      <option value="one-shot">One-shot with cleanup</option><option value="retained-start">Start retained session</option>
      <option value="retained-turn">Another retained turn</option><option value="close">Close idle retained session</option></select></label>
    <label>Offline scenario <select value={scenario} onChange={event => setScenario(event.target.value)}>
      {['normal', 'custom-tool', 'malformed-stdout', 'stderr-flood', 'hang', 'missing-python'].map(item => <option key={item}>{item}</option>)}</select></label>
    <label>Prompt <input maxLength={500} value={prompt} onChange={event => setPrompt(event.target.value)} /></label>
    <div className="lab-controls"><button disabled={busy || run?.state === 'running'} onClick={() => void probe()}>Check Python readiness</button>
      <button disabled={busy || run?.state === 'running'} onClick={() => void start('offline')}>Start offline Python</button>
      <button disabled={busy || run?.state === 'running' || !facts?.liveReady || !['normal', 'custom-tool'].includes(scenario)} onClick={() => void start('live')}>Run live Python</button>
      <button disabled={run?.state !== 'running'} onClick={() => run && void api(`runs/${run.id}/cancel`, {}).then(() => setStatus('Cancellation sent; worker termination alone cannot prove remote stop.')).catch(error => setStatus(String(error)))}>Cancel Python worker</button></div>
    <p role="status" aria-label="Lab 70 status">{status}</p>
    {run && <><p>Run: {run.id}; source: {run.source}; state: {run.state}.</p><ol>{run.frames.map((frame, index) =>
      <li key={index}>{frame.type}: {frame.type === 'progress' ? frame.text : frame.type === 'session' ? `${frame.id} (${frame.status})` :
        frame.type === 'tool_use' ? `${frame.name}, event ${frame.id}` : frame.type === 'result' ? `${frame.outcome}; interruption ${frame.interruption}; cleanup ${frame.cleanup}` : frame.reason}</li>)}</ol>
      {final && <pre style={{ whiteSpace: 'pre-wrap' }}>{final.text}</pre>}
      {run.reply && <p>Protocol: {run.reply.protocolError ?? 'valid JSON-lines'}; stderr {run.reply.stderrBytes} bytes;
        truncated: {String(run.reply.stderrTruncated)}; process terminated: {String(run.reply.killed)}.</p>}</>}
    <h3>Owned retained sessions</h3><ul>{sessions.map(session => <li key={session.handle}>Handle {session.handle}; remote {session.remoteId}; {session.state}.</li>)}</ul>
    <p>Readiness and offline checks never install packages. A killed Python process leaves remote stop unconfirmed unless separate idle/cleanup evidence exists.</p>
  </section>;
}
