import { useEffect, useRef, useState } from 'react';

type Frame = { kind: string; runId?: string; seq?: number; text?: string; state?: string; source?: string;
  commandId?: string; duplicate?: boolean; liveReady?: boolean };
export default function Concept66RealtimeWebSocket() {
  const socket = useRef<WebSocket | null>(null); const runId = useRef<string | undefined>(undefined);
  const startCommand = useRef<string | undefined>(undefined);
  const messageCommand = useRef<string | undefined>(undefined); const lastSeq = useRef(0); const framesRef = useRef<Frame[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]); const [status, setStatus] = useState('Preparing local WebSocket access.');
  const [prompt, setPrompt] = useState('Describe an Aurora Finch observation in two sentences.');
  const [mode, setMode] = useState<'offline' | 'live'>('offline'); const [liveReady, setLiveReady] = useState(false);
  const send = (value: unknown) => { if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(value)); };
  function connect(resume = false) {
    if (socket.current && socket.current.readyState <= WebSocket.OPEN) return;
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/c66/ws`);
    socket.current = ws; setStatus(resume ? 'Reconnecting from last sequence…' : 'Connecting to local WebSocket…');
    ws.onopen = () => { setStatus('WebSocket connected.'); if (resume && startCommand.current)
      send({ kind: 'start', commandId: startCommand.current, mode, afterSeq: lastSeq.current }); };
    ws.onmessage = event => { let frame: Frame; try { frame = JSON.parse(String(event.data)) as Frame; } catch { return; }
      if (frame.kind === 'command-ack' && frame.runId) { runId.current = frame.runId;
        setStatus(frame.duplicate ? 'Duplicate command acknowledged; existing run retained.' : `Run ${frame.runId} ready.`); return; }
      if (frame.kind === 'error') { setStatus(frame.text ?? (frame as { message?: string }).message ?? 'WebSocket command rejected.'); return; }
      if (frame.kind === 'ready') return;
      if (frame.seq !== undefined && frame.seq <= lastSeq.current) return;
      if (frame.seq !== undefined) { lastSeq.current = frame.seq; if (frame.runId) send({ kind: 'ack', runId: frame.runId, seq: frame.seq }); }
      framesRef.current = [...framesRef.current.slice(-79), frame]; setFrames(framesRef.current);
      if (frame.kind === 'terminal') setStatus(`${frame.state}: ${frame.text}`);
    };
    ws.onclose = () => { if (socket.current === ws) { socket.current = null; setStatus('Disconnected; the host retains the run for replay.'); } };
    ws.onerror = () => setStatus('WebSocket transport error.');
  }
  useEffect(() => { let alive = true;
    void fetch('/api/c66/code').then(response => response.json()).then(data => { if (!alive) return;
      setLiveReady(Boolean(data.liveReady)); connect(); }).catch(() => { if (alive) setStatus('Local WebSocket setup unavailable.'); });
    return () => { alive = false; socket.current?.close(); }; }, []);
  function start(nextMode: 'offline' | 'live') { setMode(nextMode); runId.current = undefined;
    startCommand.current = crypto.randomUUID(); messageCommand.current = undefined; lastSeq.current = 0;
    framesRef.current = []; setFrames([]); send({ kind: 'start', commandId: startCommand.current, mode: nextMode, afterSeq: 0 }); }
  function message() { if (!runId.current) { setStatus('Start a run first.'); return; }
    messageCommand.current = crypto.randomUUID(); send({ kind: 'message', commandId: messageCommand.current,
      runId: runId.current, text: prompt }); }
  return <section aria-labelledby="lab66-heading"><h2 id="lab66-heading">Real-time frontends over WebSocket</h2>
    <p>Stream one turn from Node to this page. Reconnect and replay events from the last sequence without starting another run.</p>
    <div className="lab-controls"><button onClick={() => start('offline')}>Start guided run</button>
      <button disabled={!liveReady} onClick={() => start('live')}>Start live Managed run</button>
      <button disabled={!runId.current} onClick={message}>Send message</button>
      <button disabled={!runId.current || !messageCommand.current} onClick={() => send({ kind: 'message',
        commandId: messageCommand.current, runId: runId.current, text: prompt })}>Duplicate command</button>
      <button disabled={!runId.current} onClick={() => send({ kind: 'cancel', commandId: crypto.randomUUID(), runId: runId.current })}>Cancel</button>
      <button onClick={() => socket.current?.close()}>Disconnect</button>
      <button onClick={() => connect(true)}>Reconnect and replay</button></div>
    <label>Message <input value={prompt} maxLength={500} onChange={event => setPrompt(event.target.value)} /></label>
    <p role="status" aria-label="Lab 66 status">{status}</p>
    <p>Mode: {mode}; last sequence: {lastSeq.current}; buffered replay: at most 64 events. Live readiness: {String(liveReady)}.</p>
    <ol>{frames.map(frame => <li key={`${frame.runId}-${frame.seq}`}>
      #{frame.seq} {frame.kind} ({frame.state}, {frame.source}): {frame.text}</li>)}</ol>
    <p>Disconnect closes only the transport. The host run, its deadline and any Managed session cleanup remain in Node.</p>
  </section>;
}
