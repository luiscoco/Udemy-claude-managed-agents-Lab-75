import { useEffect, useRef, useState } from 'react';
import { lab21Commands } from '../../shared/lab21-slash-commands';
import { LiveActionButton } from '../components/LiveActionButton';

type Snapshot = { runId: string; state: string; messagesUsed: number; response: string; cleanup: string; message: string };
type Result = { kind: 'local' | 'model'; command: string; expanded: string | null; providerSends: number; history: string[]; snapshot?: Snapshot };
export default function Concept21SlashCommands() {
  const owner = useRef(crypto.randomUUID()), current = useRef<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [result, setResult] = useState<Result>();
  const [command, setCommand] = useState('observation');
  const [species, setSpecies] = useState('Aurora Finch'), [count, setCount] = useState(3), [location, setLocation] = useState('north marsh');
  const [busy, setBusy] = useState(false), [liveReady, setLiveReady] = useState(false);
  const [status, setStatus] = useState('Ready. Host commands are authored here and are not Claude Code slash commands.');
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  async function setup() { const response = await fetch('/api/managed/setup', { signal: AbortSignal.timeout(5000) });
    const data = await response.json() as { liveReady: boolean }; setLiveReady(data.liveReady === true); return data.liveReady === true; }
  useEffect(() => { void setup().catch(() => setLiveReady(false)); return () => { if (current.current) void fetch('/api/c21/session', {
    method: 'POST', headers, body: JSON.stringify({ action: 'close', runId: current.current }), keepalive: true }); }; }, []);
  async function post(path: string, body: unknown) {
    const response = await fetch(`/api/c21/${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(45000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data;
  }
  async function prepare(mode: 'scripted' | 'live') { if (busy) return; setBusy(true);
    try { if (mode === 'live' && !await setup()) throw new Error('Live setup is unavailable.');
      const data = await post('session', { action: 'prepare', mode }) as Snapshot;
      current.current = data.runId; setSnapshot(data); setResult(undefined); setStatus('Owned command session prepared. No model message was sent.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Preparation failed.'); } finally { setBusy(false); }
  }
  async function run(name = command, override?: Record<string, unknown>) { if (!current.current || busy) return; setBusy(true);
    try { const args = override ?? (name === 'observation' ? { species, count, location } : name === 'checklist' ? { location } : {});
      const data = await post('run', { runId: current.current, command: name, args }) as Result;
      setResult(data); if (data.snapshot) setSnapshot(data.snapshot);
      setStatus(data.kind === 'local' ? 'Local command completed with zero provider sends.' : data.snapshot?.message ?? 'Model command completed.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Command failed.'); } finally { setBusy(false); }
  }
  async function close() { if (!current.current || busy) return; setBusy(true);
    try { const data = await post('session', { action: 'close', runId: current.current }) as Snapshot;
      setSnapshot(data); if (data.state === 'closed') current.current = null; setStatus(data.message);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Close failed.'); } finally { setBusy(false); }
  }
  return <section aria-labelledby="lab21-heading"><h2 id="lab21-heading">Host commands and prompt expansion</h2>
    <p>The application owns this registry. A model command becomes an exact user message on an owned retained session. Inspect and reset stay local.</p>
    <h3>Command registry</h3><ul>{lab21Commands.map(item => <li key={item.name}><code>{item.name}</code> ({item.kind}): {item.description} Arguments: {item.arguments}. {item.template && <code>{item.template}</code>}</li>)}</ul>
    <div className="lab-controls"><button disabled={busy || Boolean(current.current)} onClick={() => void prepare('scripted')}>Prepare offline session</button>
      <button disabled={busy || !current.current} onClick={() => void close()}>Close command session</button></div>
    <LiveActionButton busy={busy} available={liveReady} checkAvailability={setup} onRun={() => void prepare('live')} keyIsolated
      {...(current.current ? { blockedReason: 'Close the current command session first.' } : {})}
      setup="Configure the isolated server API key, Managed base agent and environment, and MANAGED_LIVE_ENABLED=true. Preparing is local; running a model command creates a billed Managed session." />
    <p role="status" aria-label="Command status">{status}</p><p>Session: <code>{snapshot?.runId ?? 'none'}</code>. State: {snapshot?.state ?? 'none'}. Messages used: {snapshot?.messagesUsed ?? 0}.</p>
    <div className="lab-controls"><label>Command<select aria-label="Host command" value={command} onChange={event => setCommand(event.target.value)}>{lab21Commands.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
      {command === 'observation' && <><label>Species<select aria-label="Species" value={species} onChange={event => setSpecies(event.target.value)}><option>Aurora Finch</option><option>Silver Heron</option><option>Forest Wren</option></select></label>
        <label>Count<input aria-label="Count" type="number" min={1} max={50} value={count} onChange={event => setCount(Number(event.target.value))} /></label></>}
      {(command === 'observation' || command === 'checklist') && <label>Location<select aria-label="Location" value={location} onChange={event => setLocation(event.target.value)}><option>north marsh</option><option>pine grove</option><option>river bend</option></select></label>}
      <button disabled={busy || !current.current} onClick={() => void run()}>Run host command</button></div>
    <div className="lab-controls"><button disabled={busy || !current.current} onClick={() => void run('observation', { species, count, location: '../secret' })}>Try invalid args</button>
      <button disabled={busy || !current.current} onClick={() => void post('run', { runId: current.current, command: 'execute', args: {} }).then(() => setStatus('Unexpected acceptance.')).catch(() => setStatus('Unknown command rejected before provider send.'))}>Try unknown command</button>
      <button disabled={busy || !current.current} onClick={() => void run('inspect')}>Inspect local history</button>
      <button disabled={busy || !current.current} onClick={() => void run('reset')}>Reset local history</button></div>
    {result && <section aria-label="Command result"><h3>{result.kind} command result</h3><p>Expanded user.message: <code>{result.expanded ?? 'none'}</code></p>
      <p>Session message count: {result.snapshot?.messagesUsed ?? snapshot?.messagesUsed ?? 0}. This action provider sends: {result.kind === 'local' ? 0 : 1}.</p>
      <p>Local history: {result.history.length ? result.history.join(' | ') : 'empty'}</p>
      {result.snapshot && <p>Outcome: {result.snapshot.state}. {result.snapshot.response}</p>}</section>}
  </section>;
}
