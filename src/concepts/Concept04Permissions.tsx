import { useEffect, useId, useRef, useState } from 'react';
import { apiErrorSchema } from '../../shared/contracts';
import { approvalLimits, conceptMapping, lab04FrameSchema, lab04Prompt, lab04ResultSchema, lab04Scenarios, lab04Toolset } from '../../shared/lab04-permissions';
import type { DecisionLogEntry, Lab04Frame, Lab04Request, Lab04Result } from '../../shared/lab04-permissions';
import { CodeBlock } from '../components/CodeBlock';
import { LiveActionButton } from '../components/LiveActionButton';
import { redact } from '../lib/presentation';
import { streamPost } from '../lib/sse';

type Mode = 'scripted' | 'live';
type Review = Extract<Lab04Frame, { kind: 'review' }>;
type DecisionBody = { runId: string; toolUseId: string; decisionToken: string; decision: 'allow' | 'deny'; denyMessage?: string };
const scenarioLabels: Record<(typeof lab04Scenarios)[number], string> = {
  'review': 'Review: write, two edits and a second file', 'preallowed-only': 'Preallowed only: read and glob, nothing to review',
};
const defaultDeny = 'The reviewer denied this call. Do not retry it.';

async function postDecision(body: DecisionBody) {
  const response = await fetch('/api/c4/decide', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
  const data: unknown = await response.json().catch(() => null);
  const error = apiErrorSchema.safeParse(data);
  return { status: response.status, message: error.success ? error.data.error.message : response.ok ? 'Decision applied.' : `HTTP ${response.status}` };
}

export default function Concept04Permissions() {
  const promptId = useId(), scenarioId = useId(), dialogTitle = useId(), denyId = useId();
  const [prompt, setPrompt] = useState(lab04Prompt);
  const [scenario, setScenario] = useState<(typeof lab04Scenarios)[number]>('review');
  const [approvalSeconds, setApprovalSeconds] = useState<number>(approvalLimits.defaultSeconds);
  const [deadlineSeconds, setDeadlineSeconds] = useState(120);
  const [budgetCents, setBudgetCents] = useState(50);
  const [mode, setMode] = useState<Mode>('scripted');
  const [pending, setPending] = useState(false);
  const [frames, setFrames] = useState<Lab04Frame[]>([]);
  const [result, setResult] = useState<Lab04Result>();
  const [status, setStatus] = useState('Ready. Offline fixtures need no credentials and make no API calls.');
  const [denyMessage, setDenyMessage] = useState(defaultDeny);
  const [dialogNote, setDialogNote] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [lastDecision, setLastDecision] = useState<DecisionBody | null>(null);
  const [testerLog, setTesterLog] = useState<string[]>([]);
  const [liveReady, setLiveReady] = useState(false);
  const [setupText, setSetupText] = useState('Live mode creates a billed session and uploads two small files. Checking server setup…');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);

  async function readSetup() {
    const response = await fetch('/api/managed/setup', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('setup');
    const data = await response.json() as { liveReady: boolean; liveEnabled: boolean; missing: string[]; invalid: string[] };
    const problems = [data.missing.length ? `missing: ${data.missing.join(', ')}` : '', data.invalid.length ? `invalid: ${data.invalid.join(', ')}` : '',
      !data.liveEnabled ? 'MANAGED_LIVE_ENABLED is not "true"' : ''].filter(Boolean);
    setSetupText(data.liveReady ? 'Live setup is ready.' : `Live mode is not ready (${problems.join('; ') || 'SDK check failed'}). Set these on the server, restart the backend, then check again. See docs/managed-setup.md.`);
    return data.liveReady;
  }
  useEffect(() => {
    void readSetup().then((ready) => { if (mounted.current) setLiveReady(ready); })
      .catch(() => { if (mounted.current) setSetupText('Could not reach the backend setup endpoint. Start the API server (npm run dev) and check again.'); });
  }, []);

  const runFrame = frames.find((f) => f.kind === 'run');
  const settled = new Set(frames.flatMap((f) => f.kind === 'decision' ? [f.entry.toolUseId] : f.kind === 'expired' ? [f.toolUseId] : []));
  const queue = frames.filter((f): f is Review => f.kind === 'review' && !settled.has(f.toolUseId));
  const current = queue[0];

  // While a review is open: tick the countdown, move focus into the dialog, and restore it afterwards.
  useEffect(() => {
    if (!current) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [current]);
  useEffect(() => {
    if (!current) return;
    returnFocus.current ??= document.activeElement as HTMLElement | null;
    setDenyMessage(defaultDeny); setDialogNote('');
    dialogRef.current?.focus();
  }, [current?.toolUseId]);
  useEffect(() => {
    if (current || !returnFocus.current) return;
    returnFocus.current.focus?.(); returnFocus.current = null;
  }, [current]);

  async function run(chosen: Mode) {
    if (controller.current) return;
    if (!prompt.trim()) { setStatus('Enter a prompt before running. Nothing was sent.'); return; }
    setMode(chosen); setTesterLog([]); setLastDecision(null);
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setFrames([]); setResult(undefined);
    setStatus(chosen === 'live' ? 'Running live: uploading fixtures and creating a session…' : 'Running offline fixture…');
    const body: Lab04Request = { mode: chosen, prompt, deadlineSeconds, approvalSeconds,
      ...(chosen === 'live' ? { budgetCents } : { scenario }) };
    try {
      const outcome = await streamPost('/api/c4/query', body, { signal: abort.signal, idleMs: 25_000, deadlineMs: 170_000,
        resultSchema: lab04ResultSchema,
        onEvent: (type, data) => { if (type === 'progress' && mounted.current) setFrames((all) => [...all.slice(-399), lab04FrameSchema.parse(data)]); } });
      if (!mounted.current) return;
      if (outcome.kind === 'success') { setResult(outcome.result); setStatus(outcome.result.message); }
      else setStatus('Cancelled locally. The server released every pending approval without sending a confirmation and attempted user.interrupt; its result cannot reach this page once the connection is closed.');
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'The query failed.'); }
    finally { controller.current = null; if (mounted.current) setPending(false); }
  }

  async function decide(decision: 'allow' | 'deny') {
    if (!current || !runFrame || runFrame.kind !== 'run' || deciding) return;
    const body: DecisionBody = { runId: runFrame.runId, toolUseId: current.toolUseId, decisionToken: runFrame.decisionToken, decision,
      ...(decision === 'deny' ? { denyMessage: denyMessage.trim() || defaultDeny } : {}) };
    setDeciding(true);
    try {
      const answer = await postDecision(body);
      if (!mounted.current) return;
      if (answer.status === 200) setLastDecision(body);
      else setDialogNote(`HTTP ${answer.status}: ${answer.message}`);
    } catch { if (mounted.current) setDialogNote('The decision could not reach the server.'); }
    finally { if (mounted.current) setDeciding(false); }
  }
  async function probe(kind: 'replay' | 'wrong-token') {
    if (!lastDecision) return;
    const body = kind === 'replay' ? lastDecision : { ...lastDecision, decisionToken: 'x'.repeat(32) };
    const answer = await postDecision(body).catch(() => ({ status: 0, message: 'Network error.' }));
    if (mounted.current) setTesterLog((all) => [...all.slice(-9), `${kind === 'replay' ? 'Replay' : 'Wrong token'}: HTTP ${answer.status}. ${answer.message}`]);
  }

  const uses = frames.filter((f) => f.kind === 'tool_use');
  const neverAsked = uses.filter((u) => u.evaluatedPermission !== 'ask');
  const asked = uses.filter((u) => u.evaluatedPermission === 'ask');
  const decisions: DecisionLogEntry[] = frames.flatMap((f) => f.kind === 'decision' ? [f.entry] : []);
  const messages = frames.filter((f) => f.kind === 'message');
  const secondsLeft = current ? Math.max(0, Math.ceil((Date.parse(current.expiresAt) - now) / 1000)) : 0;

  return <section aria-labelledby="c4-heading">
    <h2 id="c4-heading">Review tool calls before they run</h2>
    <p>The Agent SDK calls <code>canUseTool</code>. Managed Agents instead <strong>pauses</strong> an <code>always_ask</code> call with <code>requires_action</code>, and the host answers once with <code>user.tool_confirmation</code>. This page is that host's reviewer.</p>
    <h3>Agent SDK to Managed Agents</h3>
    <div className="table-scroll"><table><thead><tr><th scope="col">Agent SDK term</th><th scope="col">Managed Agents equivalent</th></tr></thead>
      <tbody>{conceptMapping.map((row) => <tr key={row.sdk}><td><code>{row.sdk}</code></td><td>{row.managed}</td></tr>)}</tbody></table></div>
    <p className="muted">Preallowed tools never call the review handler: <code>read</code> and <code>glob</code> are <code>always_allow</code> here, so the absence of a review is not proof that a call was reviewed.</p>

    <fieldset disabled={pending}><legend>Run settings</legend>
      <label htmlFor={promptId}>Prompt</label>
      <textarea id={promptId} className="lab-prompt" rows={4} maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <label>Approval window (seconds) <input type="number" min={approvalLimits.minSeconds} max={approvalLimits.maxSeconds} step={1} value={approvalSeconds} onChange={(e) => setApprovalSeconds(Number(e.target.value))} /></label>
      <label>Local deadline (seconds) <input type="number" min={1} max={120} step={1} value={deadlineSeconds} onChange={(e) => setDeadlineSeconds(Number(e.target.value))} /></label>
      <label>Live session budget (US cents) <input type="number" min={1} max={500} step={1} value={budgetCents} onChange={(e) => setBudgetCents(Number(e.target.value))} /></label>
    </fieldset>
    <details><summary>Session toolset sent as tools[0]</summary><CodeBlock label="Session toolset" lineNumbers={false} code={JSON.stringify(lab04Toolset, null, 2)} /></details>
    <div className="lab-controls">
      <div className="lab-field"><label htmlFor={scenarioId}>Offline scenario</label>
        <select id={scenarioId} value={scenario} disabled={pending} onChange={(e) => setScenario(e.target.value as typeof scenario)}>
          {lab04Scenarios.map((name) => <option key={name} value={name}>{scenarioLabels[name]}</option>)}
        </select></div>
      <button type="button" disabled={pending} onClick={() => void run('scripted')}>Run offline fixture</button>
      {pending && <button type="button" onClick={() => controller.current?.abort()}>Cancel query</button>}
    </div>
    <div className="lab-live"><LiveActionButton busy={pending} available={liveReady} keyIsolated setup={setupText}
      checkAvailability={async () => { const ready = await readSetup(); setLiveReady(ready); return ready; }} onRun={() => void run('live')} /></div>
    <p role="status" aria-live="polite">{redact(status)}</p>
    <p><strong>Mode:</strong> {result ? (result.source === 'authored-fixture' ? 'Offline authored fixture: the plan and its reactions are authored, not Claude.' : 'Live Managed Agents: billed API execution.') : mode === 'live' ? 'Live Managed Agents (billed).' : 'Offline authored fixture (no API calls).'}</p>

    {current && <div className="review-dialog" role="dialog" aria-modal="true" aria-labelledby={dialogTitle} ref={dialogRef} tabIndex={-1}
      onKeyDown={(event) => {
        // Keep keyboard focus inside the dialog while a review is open.
        if (event.key !== 'Tab') return;
        const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button, textarea') ?? [])].filter((el) => !el.hasAttribute('disabled'));
        if (!items.length) return;
        const first = items[0]!, last = items[items.length - 1]!;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      style={{ border: '2px solid var(--accent)', borderRadius: 8, padding: 16, margin: '16px 0', background: 'var(--surface)' }}>
      <h3 id={dialogTitle}>Review tool call: {current.tool}</h3>
      <p><code>{current.toolUseId}</code> · {queue.length} waiting · expires in <strong>{secondsLeft}s</strong></p>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{redact(current.input)}</pre>
      <p>Container path: <code>{current.containerPath ?? 'none'}</code>. Host guard: <strong>{current.guard.ok ? 'can be allowed' : 'allow will be refused'}</strong> ({current.guard.reason})</p>
      <label htmlFor={denyId}>Deny message (sent to the agent)</label>
      <textarea id={denyId} rows={2} maxLength={300} value={denyMessage} onChange={(e) => setDenyMessage(e.target.value)} />
      <div className="lab-controls">
        <button type="button" disabled={deciding} onClick={() => void decide('allow')}>Allow</button>
        <button type="button" disabled={deciding} onClick={() => void decide('deny')}>Deny</button>
      </div>
      {dialogNote && <p role="alert">{dialogNote}</p>}
      <p className="muted">No updatedInput: a confirmation cannot change the input. To correct a call, deny it and say what to do instead.</p>
    </div>}

    <h3>1. Tool calls</h3>
    <p><strong>Never asked (preallowed):</strong> {neverAsked.length ? neverAsked.map((u) => `${u.name} ${u.id}`).join(', ') : 'none'}</p>
    <p><strong>Asked (paused for review):</strong> {asked.length ? asked.map((u) => `${u.name} ${u.id}`).join(', ') : 'none'}</p>

    <h3>2. Decision log</h3>
    {decisions.length === 0 ? <p className="muted">No decisions yet.</p> : <div className="table-scroll"><table aria-label="Decision log">
      <thead><tr><th scope="col">Tool use</th><th scope="col">Decision</th><th scope="col">Decided by</th><th scope="col">Latency</th><th scope="col">Confirmation sent</th><th scope="col">Deny message</th></tr></thead>
      <tbody>{decisions.map((d) => <tr key={d.toolUseId}><td>{d.tool} <code>{d.toolUseId}</code></td><td>{d.decision}</td><td>{d.decidedBy}</td>
        <td>{(d.latencyMs / 1000).toFixed(1)}s</td><td>{d.confirmationSent ? 'yes, once' : 'no'}</td><td>{d.denyMessage ?? '—'}</td></tr>)}</tbody></table></div>}

    <h3>3. Decision tester</h3>
    <p>Send the last applied decision again, or send it with a wrong token. A decision applies once and only within its own run.</p>
    <div className="lab-controls"><button type="button" disabled={!lastDecision} onClick={() => void probe('replay')}>Replay last decision</button>
      <button type="button" disabled={!lastDecision} onClick={() => void probe('wrong-token')}>Send with a wrong token</button></div>
    {testerLog.length > 0 && <ul aria-label="Decision tester results">{testerLog.map((line, i) => <li key={i}>{line}</li>)}</ul>}

    <h3>4. Permission denials and agent text</h3>
    {result?.denials.length ? <ul aria-label="Permission denials">{result.denials.map((d) => <li key={d.toolUseId}><strong>{d.kind}</strong> {d.tool} <code>{d.toolUseId}</code> by {d.by}: {d.reason}</li>)}</ul>
      : <p className="muted">{result ? 'No denials in this run.' : 'Listed after the turn.'}</p>}
    {messages.map((m) => <pre key={m.eventId} style={{ whiteSpace: 'pre-wrap' }}>{redact(m.text)}</pre>)}

    <h3>5. Files on disk</h3>
    {result ? <div role="group" aria-label="Sandbox files">{result.files.map((file) => <div key={file.path}><p><strong>{file.path}</strong> → <code>{file.containerPath}</code> ({file.writable ? 'writable' : 'read-only mount'})</p>
      <pre>{file.content}{file.truncated ? '\n[truncated]' : ''}</pre></div>)}</div> : <p className="muted">Read back from the run's sandbox after the turn.</p>}

    <h3>6. Turn outcome</h3>
    {result ? <div role="group" aria-label="Turn outcome"><p><strong>{result.outcome.kind}</strong>{result.outcome.stopReason ? ` (${result.outcome.stopReason})` : ''}. {result.outcome.detail}</p>
      <p>Interruption: {result.interruption}. Session cleanup: {result.cleanup}. Outputs: {result.outputs.status}.</p></div>
      : <p className="muted">A pause for review is not the end of the turn; only end_turn completes it.</p>}
    <details><summary>Raw events</summary><CodeBlock label="Raw session events" lineNumbers={false}
      code={frames.flatMap((f) => 'raw' in f && f.raw ? [redact(f.raw)] : []).join('\n') || 'No events yet.'} /></details>
  </section>;
}
