import { useEffect, useId, useRef, useState } from 'react';
import { lab01FrameSchema, lab01ResultSchema, lab01Scenarios } from '../../shared/lab01-events';
import type { Lab01Frame, Lab01Result } from '../../shared/lab01-events';
import { CodeBlock } from '../components/CodeBlock';
import { LiveActionButton } from '../components/LiveActionButton';
import { redact } from '../lib/presentation';
import { streamPost } from '../lib/sse';

const scenarioLabels: Record<(typeof lab01Scenarios)[number], string> = {
  'normal': 'Normal turn', 'session-error': 'Session error', 'stream-ended': 'Stream ends early',
  'repeated-events': 'Repeated events and partial preview', 'requires-action': 'Idle: requires_action',
  'budget-reached': 'Idle: budget_reached', 'cancel': 'Cancel (press Cancel query)', 'deadline': 'Deadline expires',
};
type Mode = 'scripted' | 'live';
const outcomeText: Record<string, string> = {
  completed: 'Completed: session.status_idle with stop_reason end_turn.',
  paused: 'Paused: the turn did not finish and needs attention.',
  error: 'Error: the session reported a failure.',
  incomplete: 'Incomplete: the stream ended before the turn finished.',
  cancelled: 'Cancelled before the turn was confirmed finished.',
  deadline: 'Deadline expired before the turn was confirmed finished.',
};

export default function Concept01Query() {
  const promptId = useId();
  const scenarioId = useId();
  const [prompt, setPrompt] = useState('Give me three bullet points about Claude Managed Agents sessions.');
  const [mode, setMode] = useState<Mode>('scripted');
  const [scenario, setScenario] = useState<(typeof lab01Scenarios)[number]>('normal');
  const [pending, setPending] = useState(false);
  const [frames, setFrames] = useState<Lab01Frame[]>([]);
  const [result, setResult] = useState<Lab01Result>();
  const [status, setStatus] = useState('Ready. Offline fixtures need no credentials and make no API calls.');
  const [problem, setProblem] = useState('');
  const controller = useRef<AbortController | null>(null);
  const [liveReady, setLiveReady] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);

  const [setupText, setSetupText] = useState('Live mode creates a billed session. Checking server setup…');
  // Read-only: reports which server settings are missing, never their values.
  async function readSetup() {
    const response = await fetch('/api/managed/setup', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('setup');
    const data = await response.json() as { liveReady: boolean; liveEnabled: boolean; missing: string[]; invalid: string[] };
    const problems = [
      data.missing.length ? `missing: ${data.missing.join(', ')}` : '',
      data.invalid.length ? `invalid: ${data.invalid.join(', ')}` : '',
      !data.liveEnabled ? 'MANAGED_LIVE_ENABLED is not "true"' : '',
    ].filter(Boolean);
    setSetupText(data.liveReady ? 'Live setup is ready.' : `Live mode is not ready (${problems.join('; ') || 'SDK check failed'}). Set these on the server, restart the backend, then check again. See docs/managed-setup.md.`);
    return data.liveReady;
  }
  useEffect(() => {
    void readSetup().then((ready) => { if (mounted.current) setLiveReady(ready); })
      .catch(() => { if (mounted.current) setSetupText('Could not reach the backend setup endpoint. Start the API server (npm run dev) and check again.'); });
  }, []);
  async function liveAvailable() {
    const ready = await readSetup();
    setLiveReady(ready);
    return ready;
  }
  async function run(chosen: Mode) {
    if (controller.current) return;
    if (!prompt.trim()) { setProblem('Enter a prompt before running. Nothing was sent.'); return; }
    setProblem(''); setMode(chosen);
    const request = new AbortController(); controller.current = request;
    setPending(true); setFrames([]); setResult(undefined);
    setStatus(chosen === 'live' ? 'Running live: creating a session…' : 'Running offline fixture…');
    try {
      const outcome = await streamPost('/api/c1/query', { mode: chosen, prompt, ...(chosen === 'scripted' ? { scenario } : {}) }, {
        signal: request.signal, idleMs: 25_000, deadlineMs: 150_000, resultSchema: lab01ResultSchema,
        onEvent: (type, data) => {
          if (type !== 'progress' || !mounted.current) return;
          const frame = lab01FrameSchema.parse(data);
          setFrames((current) => [...current.slice(-299), frame]);
        },
      });
      if (!mounted.current) return;
      if (outcome.kind === 'success') { setResult(outcome.result); setStatus(outcome.result.message); }
      else setStatus('Cancelled locally. The server attempts user.interrupt for this request’s session, but its result cannot reach this page once the connection is closed. A live session may still need checking in Claude Console.');
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'The query failed.'); }
    finally { controller.current = null; if (mounted.current) setPending(false); }
  }

  const session = frames.find((frame) => frame.kind === 'session')?.session ?? result?.session ?? null;
  // Authoritative messages replace their previews; a preview is shown only until that happens.
  const messages = frames.filter((frame) => frame.kind === 'message');
  const replaced = new Set(messages.map((frame) => frame.eventId));
  const livePreviews = new Map<string, string>();
  for (const frame of frames) if (frame.kind === 'preview' && !replaced.has(frame.eventId)) livePreviews.set(frame.eventId, frame.text);
  const incomplete = new Map((result?.previews ?? []).filter((preview) => preview.state === 'incomplete').map((preview) => [preview.eventId, preview.text]));
  const notices = frames.filter((frame) => frame.kind === 'notice');
  const lifecycle = frames.filter((frame) => frame.kind === 'lifecycle' || frame.kind === 'span' || frame.kind === 'duplicate');

  return <section aria-labelledby="c1-heading">
    <h2 id="c1-heading">Query a session and read its events</h2>
    <p>A turn is finished by a lifecycle event, not by text. Send one prompt and watch which events carry the answer and which carry status.</p>
    <label htmlFor={promptId}>Prompt</label>
    <textarea id={promptId} value={prompt} rows={3} maxLength={1000} disabled={pending} onChange={(event) => setPrompt(event.target.value)} className="lab-prompt" />
    {problem && <p role="alert">{problem}</p>}
    <div className="lab-controls">
      <div className="lab-field"><label htmlFor={scenarioId}>Offline scenario</label>
        <select id={scenarioId} value={scenario} disabled={pending} onChange={(event) => setScenario(event.target.value as typeof scenario)}>
          {lab01Scenarios.map((name) => <option key={name} value={name}>{scenarioLabels[name]}</option>)}
        </select></div>
      <button type="button" disabled={pending} onClick={() => void run('scripted')}>Run offline fixture</button>
      {pending && <button type="button" onClick={() => controller.current?.abort()}>Cancel query</button>}
    </div>
    <div className="lab-live">
    <LiveActionButton busy={pending} available={liveReady} checkAvailability={liveAvailable} onRun={() => void run('live')} keyIsolated
      setup={setupText} />
    </div>
    <p role="status" aria-live="polite">{status}</p>
    <p><strong>Mode:</strong> {result ? (result.source === 'authored-fixture' ? 'Offline authored fixture: not a measurement of Claude.' : 'Live Managed Agents: billed API execution.') : mode === 'live' ? 'Live Managed Agents (billed).' : 'Offline authored fixture (no API calls).'}</p>

    <h3>1. Session metadata</h3>
    {session ? <ul>
      <li>Session: <code>{session.id}</code> ({session.status}) <span className="muted">{session.source}</span></li>
      <li>Agent: <code>{session.agentId}</code> v{session.agentVersion ?? '?'}; tools: {session.toolCount}; MCP servers: {session.mcpServerCount}</li>
      <li>Environment: <code>{session.environmentId}</code>; budget: {session.budget ?? 'none'}</li>
    </ul> : <p className="muted">Metadata comes from the session creation response, not from a stream event.</p>}

    <div className="agent-response"><h3>2. Agent text</h3>
    {messages.length === 0 && livePreviews.size === 0 && incomplete.size === 0 && <p className="muted">No agent text yet.</p>}
    {[...livePreviews].map(([id, text]) => incomplete.has(id) ? null : <div key={id}><p><strong>Preview</strong> <code>{id}</code> — streaming, not final</p><pre>{redact(text) || '…'}</pre></div>)}
    {messages.map((frame) => <div key={frame.eventId}><p><strong>Authoritative agent.message</strong> <code>{frame.eventId}</code>{frame.replacedPreview ? ' — replaced its preview' : ''}</p><AgentMessage text={frame.text} /></div>)}
    {[...incomplete].map(([id, text]) => <div key={id}><p><strong>Incomplete preview</strong> <code>{id}</code> — never received its agent.message</p><pre>{redact(text)}</pre></div>)}

    </div>
    <h3>3. Lifecycle and span events</h3>
    {lifecycle.length === 0 ? <p className="muted">None yet.</p> : <ol>{lifecycle.map((frame) => <li key={frame.seq}>
      {frame.kind === 'duplicate' ? <><strong>duplicate ignored</strong> <code>{frame.id}</code> ({frame.eventType})</>
        : <><strong>{frame.type}</strong> <code>{frame.id}</code> {frame.detail}</>}</li>)}</ol>}
    {notices.length > 0 && <details><summary>Notices ({notices.length})</summary><ul>{notices.map((frame) => <li key={frame.seq}>{frame.text}</li>)}</ul></details>}

    <h3>4. Turn outcome</h3>
    {result ? <div role="group" aria-label="Turn outcome">
      <p><strong>{result.outcome.kind}</strong>{result.outcome.stopReason ? ` (${result.outcome.stopReason})` : ''}. {outcomeText[result.outcome.kind]}</p>
      <p>{result.outcome.detail}</p>
      <p>Interruption: {result.interruption}. Session cleanup: {result.cleanup}. Duplicates ignored: {result.duplicatesIgnored}. Events read: {result.eventCount}.</p>
    </div> : <p className="muted">Derived from session.status_idle.stop_reason or session.error when the turn ends.</p>}

    <details><summary>Raw events ({frames.filter((frame) => 'raw' in frame && frame.raw).length})</summary>
      <CodeBlock label="Raw session events" lineNumbers={false}
        code={frames.flatMap((frame) => 'raw' in frame && frame.raw ? [frame.raw] : []).join('\n') || 'No events yet.'} /></details>
    {result && <details><summary>Result JSON</summary><CodeBlock label="Result JSON" lineNumbers={false} code={JSON.stringify(result, null, 2)} /></details>}
  </section>;
}
import { AgentMessage } from '../components/AgentMessage';
