import { useEffect, useId, useRef, useState } from 'react';
import { bashAllowlist, buildToolset, conceptMapping, filesResponseSchema, lab03FrameSchema, lab03Presets, lab03ResultSchema,
  presets, toolNames } from '../../shared/lab03-tools';
import type { Lab03Frame, Lab03Preset, Lab03Request, Lab03Result, SandboxFile, ToolName, ToolState } from '../../shared/lab03-tools';
import { CodeBlock } from '../components/CodeBlock';
import { LiveActionButton } from '../components/LiveActionButton';
import { request as getJson } from '../lib/api';
import { redact } from '../lib/presentation';
import { streamPost } from '../lib/sse';

type Mode = 'scripted' | 'live';
const stateText: Record<ToolState, string> = {
  'allowed': 'allowed by policy', 'allowed-by-host': 'allowed by host confirmation', 'awaiting-host': 'paused: requires_action',
  'denied-by-host': 'denied by host confirmation', 'denied-by-server': 'denied by auto evaluation', 'unavailable': 'unavailable: tool not enabled',
};
type Row = { preset: Lab03Preset; removed: ToolName[]; source: string; outcome: string; denials: string; draft: string };

export default function Concept03Tools() {
  const promptId = useId(), presetId = useId(), scenarioId = useId();
  const [preset, setPreset] = useState<Lab03Preset>('read-only');
  const [prompt, setPrompt] = useState<string>(presets['read-only'].prompt);
  const [removed, setRemoved] = useState<ToolName[]>([]);
  const [scenario, setScenario] = useState<'normal' | 'hang'>('normal');
  const [deadlineSeconds, setDeadlineSeconds] = useState(10);
  const [budgetCents, setBudgetCents] = useState(50);
  const [mode, setMode] = useState<Mode>('scripted');
  const [pending, setPending] = useState(false);
  const [frames, setFrames] = useState<Lab03Frame[]>([]);
  const [result, setResult] = useState<Lab03Result>();
  const [files, setFiles] = useState<SandboxFile[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('Ready. Offline fixtures need no credentials and make no API calls.');
  const [liveReady, setLiveReady] = useState(false);
  const [setupText, setSetupText] = useState('Live mode creates a billed session and uploads two small files. Checking server setup…');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
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
  async function refreshFiles() {
    try { const data = await getJson('/api/c3/files', filesResponseSchema); if (mounted.current) setFiles(data.files); }
    catch { if (mounted.current) setStatus('Could not read the sandbox files. Start the API server (npm run dev).'); }
  }
  async function resetFiles() {
    try {
      const data = await getJson('/api/c3/reset', filesResponseSchema, { method: 'POST' });
      if (mounted.current) { setFiles(data.files); setStatus('Sandbox restored from the authored fixtures.'); }
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'Reset failed.'); }
  }
  useEffect(() => {
    void readSetup().then((ready) => { if (mounted.current) setLiveReady(ready); })
      .catch(() => { if (mounted.current) setSetupText('Could not reach the backend setup endpoint. Start the API server (npm run dev) and check again.'); });
    void refreshFiles();
  }, []);

  function choosePreset(next: Lab03Preset) { setPreset(next); setPrompt(presets[next].prompt); setRemoved([]); }
  const toolset = buildToolset(preset, removed);

  async function run(chosen: Mode) {
    if (controller.current) return;
    if (!prompt.trim()) { setStatus('Enter a prompt before running. Nothing was sent.'); return; }
    setMode(chosen);
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setFrames([]); setResult(undefined);
    setStatus(chosen === 'live' ? 'Running live: uploading fixtures and creating a session…' : 'Running offline fixture…');
    const body: Lab03Request = { mode: chosen, preset, prompt, deadlineSeconds, removeTools: removed,
      ...(chosen === 'live' ? { budgetCents } : { scenario }) };
    try {
      const outcome = await streamPost('/api/c3/query', body, { signal: abort.signal, idleMs: 25_000, deadlineMs: 170_000,
        resultSchema: lab03ResultSchema,
        onEvent: (type, data) => { if (type === 'progress' && mounted.current) setFrames((all) => [...all.slice(-399), lab03FrameSchema.parse(data)]); } });
      if (!mounted.current) return;
      if (outcome.kind === 'success') {
        const value = outcome.result;
        setResult(value); setFiles(value.files); setStatus(value.message);
        const draft = value.files.find((file) => file.path === 'outputs/draft.md');
        setRows((all) => [...all.slice(-19), { preset: value.requested.preset, removed: value.requested.removeTools, source: value.source,
          outcome: `${value.outcome.kind}${value.outcome.stopReason ? ` (${value.outcome.stopReason})` : ''}`,
          denials: value.denials.map((d) => `${d.tool}: ${d.kind} by ${d.by}`).join('; ') || 'none',
          draft: draft ? draft.content.split('\n').find((line) => line.startsWith('Status:')) ?? '(no status line)' : 'absent' }]);
      } else {
        setStatus('Cancelled locally. The server attempts user.interrupt for this request’s session; its result cannot reach this page once the connection is closed.');
        void refreshFiles();
      }
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'The query failed.'); }
    finally { controller.current = null; if (mounted.current) setPending(false); }
  }

  const uses = frames.filter((f) => f.kind === 'tool_use');
  const results = new Map(frames.flatMap((f) => f.kind === 'tool_result' ? [[f.toolUseId, f] as const] : []));
  const answers = new Map(frames.flatMap((f) => f.kind === 'confirmation' ? [[f.toolUseId, f] as const] : []));
  const awaiting = uses.filter((use) => use.state === 'awaiting-host' && !answers.has(use.id));
  const messages = frames.filter((f) => f.kind === 'message');
  const session = frames.find((f) => f.kind === 'session')?.session ?? result?.session ?? null;
  const lifecycle = frames.filter((f) => f.kind === 'lifecycle' || f.kind === 'duplicate');
  const enabledByPreset = toolNames.filter((name) => presets[preset].tools[name]);

  return <section aria-labelledby="c3-heading">
    <h2 id="c3-heading">Enabled is not permitted</h2>
    <p>A tool in the session toolset is <strong>enabled</strong>. Whether one call runs is decided by its <strong>permission_policy</strong> and, when the session pauses, by the <strong>host</strong>. The agent works in the session container, not on this computer.</p>
    <h3>Agent SDK to Managed Agents</h3>
    <div className="table-scroll"><table><thead><tr><th scope="col">Agent SDK term</th><th scope="col">Managed Agents equivalent</th></tr></thead>
      <tbody>{conceptMapping.map((row) => <tr key={row.sdk}><td>{row.sdk}</td><td>{row.managed}</td></tr>)}</tbody></table></div>
    <p className="muted">allowedTools, disallowedTools, permissionMode, cwd and canUseTool are rejected with HTTP 400. Only the toolset below is sent.</p>

    <fieldset disabled={pending}><legend>Experiment</legend>
      <label htmlFor={presetId}>Preset</label>
      <select id={presetId} value={preset} onChange={(e) => choosePreset(e.target.value as Lab03Preset)}>
        {lab03Presets.map((name) => <option key={name} value={name}>{presets[name].label}</option>)}
      </select>
      <p>{presets[preset].summary}</p>
      <fieldset><legend>Remove enabled tools (student challenge)</legend>
        {enabledByPreset.map((name) => <label key={name}><input type="checkbox" checked={removed.includes(name)}
          onChange={(e) => setRemoved((all) => e.target.checked ? [...all, name] : all.filter((n) => n !== name))} /> Remove {name}</label>)}
      </fieldset>
      <label htmlFor={promptId}>Prompt</label>
      <textarea id={promptId} className="lab-prompt" rows={4} maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <label>Local deadline (seconds) <input type="number" min={1} max={120} step={1} value={deadlineSeconds} onChange={(e) => setDeadlineSeconds(Number(e.target.value))} /></label>
      <label>Live session budget (US cents) <input type="number" min={1} max={500} step={1} value={budgetCents} onChange={(e) => setBudgetCents(Number(e.target.value))} /></label>
    </fieldset>
    <details><summary>Session toolset sent as tools[0]</summary><CodeBlock label="Session toolset" lineNumbers={false} code={JSON.stringify(toolset, null, 2)} /></details>
    <p className="muted">Bash is only ever enabled with always_ask. The host approves exactly: {bashAllowlist.join(' · ')}</p>
    <div className="lab-controls">
      <div className="lab-field"><label htmlFor={scenarioId}>Offline scenario</label>
        <select id={scenarioId} value={scenario} disabled={pending} onChange={(e) => setScenario(e.target.value as 'normal' | 'hang')}>
          <option value="normal">Normal turn</option><option value="hang">Agent keeps working (cancel or deadline)</option>
        </select></div>
      <button type="button" disabled={pending} onClick={() => void run('scripted')}>Run offline fixture</button>
      {pending && <button type="button" onClick={() => controller.current?.abort()}>Cancel query</button>}
    </div>
    <div className="lab-live"><LiveActionButton busy={pending} available={liveReady} keyIsolated setup={setupText}
      checkAvailability={async () => { const ready = await readSetup(); setLiveReady(ready); return ready; }} onRun={() => void run('live')} /></div>
    <p role="status" aria-live="polite">{redact(status)}</p>
    <p><strong>Mode:</strong> {result ? (result.source === 'authored-fixture' ? 'Offline authored fixture: the plan is fixed and is not a measurement of Claude.' : 'Live Managed Agents: billed API execution.') : mode === 'live' ? 'Live Managed Agents (billed).' : 'Offline authored fixture (no API calls).'}</p>

    <h3>1. Session</h3>
    {session ? <ul><li>Session <code>{session.id}</code> ({session.source}); agent <code>{session.agentId}</code> v{session.agentVersion ?? '?'}; environment <code>{session.environmentId}</code></li>
      {result?.effectiveTools && <li>Effective tools from the creation response: {result.effectiveTools.map((t) => `${t.name}=${t.enabled ? t.policy : 'disabled'}`).join(', ')}</li>}
    </ul> : <p className="muted">No session yet.</p>}

    <h3>2. Tool calls</h3>
    {uses.length === 0 ? <p className="muted">No agent.tool_use events yet.</p> : <div className="table-scroll"><table aria-label="Tool calls">
      <thead><tr><th scope="col">Event</th><th scope="col">Tool and input</th><th scope="col">evaluated_permission / evaluation.type</th><th scope="col">Decision</th><th scope="col">agent.tool_result</th></tr></thead>
      <tbody>{uses.map((use) => { const answer = answers.get(use.id); const res = results.get(use.id);
        const state = answer ? (answer.result === 'allow' ? 'allowed-by-host' : 'denied-by-host') : use.state;
        return <tr key={use.id}><td><code>{use.id}</code></td><td><strong>{use.name}</strong><br /><code>{redact(use.input)}</code></td>
          <td>{use.evaluatedPermission ?? 'absent'} / {use.evaluationType ?? 'no evaluation'}{use.reasonCode ? ` (${use.reasonCode})` : ''}</td>
          <td>{stateText[state]}{answer && <><br />{answer.reason}</>}</td>
          <td>{res ? <>{res.isError ? 'is_error: true' : 'ok'}<pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: '9em', overflow: 'auto' }}>{redact(res.text) || '(empty)'}</pre></> : 'none yet'}</td></tr>; })}</tbody></table></div>}
    {awaiting.length > 0 && <p role="alert">Pending requires_action: {awaiting.map((u) => u.id).join(', ')}. The host is answering with user.tool_confirmation.</p>}

    <h3>3. Permission denials</h3>
    {result ? (result.denials.length ? <ul aria-label="Permission denials">{result.denials.map((d) => <li key={d.toolUseId}>
      <strong>{d.kind === 'unavailable' ? 'Unavailable' : 'Denied'}</strong> {d.tool} <code>{d.toolUseId}</code> by {d.by}: {d.reason}</li>)}</ul>
      : <p>No denials in this run.</p>) : <p className="muted">Derived after the turn: unavailable (deny with no evaluation) is listed separately from denied (auto deny or host deny).</p>}

    <h3>4. Files on disk (host sandbox)</h3>
    <p>Read from the disposable sandbox after the run, not from the agent’s message. uploads/ mirrors the read-only mounts; outputs/ mirrors /mnt/session/outputs.</p>
    <div className="lab-controls"><button type="button" disabled={pending} onClick={() => void refreshFiles()}>Refresh files</button>
      <button type="button" disabled={pending} onClick={() => void resetFiles()}>Reset sandbox</button></div>
    <div role="group" aria-label="Sandbox files">{files.map((file) => <div key={file.path}><p><strong>{file.path}</strong> → <code>{file.containerPath}</code> ({file.writable ? 'writable' : 'read-only mount'}, {file.size} bytes)</p>
      <pre>{file.content}{file.truncated ? '\n[truncated]' : ''}</pre></div>)}</div>
    {result && <p>Outputs: {result.outputs.status}. {result.outputs.detail} Uploaded originals: {result.uploads}.</p>}

    <h3>5. Agent text and turn outcome</h3>
    {messages.map((m) => <pre key={m.eventId}>{redact(m.text)}</pre>)}
    {result ? <div role="group" aria-label="Turn outcome"><p><strong>{result.outcome.kind}</strong>{result.outcome.stopReason ? ` (${result.outcome.stopReason})` : ''}. {result.outcome.detail}</p>
      <p>Interruption: {result.interruption}. Session cleanup: {result.cleanup}. Events read: {result.eventCount}.</p></div>
      : <p className="muted">Pauses for confirmation are not the end of the turn; only end_turn completes it.</p>}
    {lifecycle.length > 0 && <details><summary>Lifecycle events ({lifecycle.length})</summary><ol>{lifecycle.map((f) => <li key={f.seq}>
      {f.kind === 'duplicate' ? `duplicate ignored ${f.id}` : `${f.type} ${f.id} ${f.detail}`}</li>)}</ol></details>}
    <details><summary>Raw events</summary><CodeBlock label="Raw session events" lineNumbers={false}
      code={frames.flatMap((f) => 'raw' in f && f.raw ? [redact(f.raw)] : []).join('\n') || 'No events yet.'} /></details>
    {result && <details><summary>Result JSON</summary><CodeBlock label="Result JSON" lineNumbers={false} code={redact(JSON.stringify(result, null, 2))} /></details>}

    <h3>Experiment table</h3>
    <div className="table-scroll"><table className="options-experiments"><thead><tr><th scope="col">Preset</th><th scope="col">Removed tools</th><th scope="col">outputs/draft.md on disk</th><th scope="col">Outcome</th><th scope="col">Denials</th></tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}><td>{presets[row.preset].label}<br />{row.source}</td><td>{row.removed.join(', ') || 'none'}</td>
        <td>{row.draft}</td><td>{row.outcome}</td><td>{row.denials}</td></tr>)}</tbody></table></div>
  </section>;
}
