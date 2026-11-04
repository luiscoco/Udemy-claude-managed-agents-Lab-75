import { useEffect, useRef, useState } from 'react';
import { lab07FileResponseSchema, lab07FrameSchema, lab07Policies, lab07Prompt, lab07Prompts, lab07ResultSchema, lab07Scenarios, lab07Tools } from '../../shared/lab07-hooks';
import type { Lab07Frame, Lab07Policy, Lab07Result, Lab07Scenario } from '../../shared/lab07-hooks';
import { LiveActionButton } from '../components/LiveActionButton';
import { CodeBlock } from '../components/CodeBlock';
import { streamPost } from '../lib/sse';
import { request } from '../lib/api';
import { redact } from '../lib/presentation';

const labels: Record<Lab07Policy, string> = { 'audit-only': 'Audit only: safe edit executes', 'deny-write': 'Deny write: protected file stays unchanged', 'rewrite-input': 'Rewrite input: proposed.md becomes draft.md' };
export default function Concept07Hooks() {
  const [policy, setPolicy] = useState<Lab07Policy>('audit-only'); const [scenario, setScenario] = useState<Lab07Scenario>('normal');
  const [prompt, setPrompt] = useState(lab07Prompt); const [pending, setPending] = useState(false); const [frames, setFrames] = useState<Lab07Frame[]>([]);
  const [result, setResult] = useState<Lab07Result>(); const [status, setStatus] = useState('Ready. These are host pipeline phases, not Managed Agents hook events.');
  const [fileText, setFileText] = useState(''); const [liveReady, setLiveReady] = useState(false); const controller = useRef<AbortController | null>(null);
  useEffect(() => { void fetch('/api/managed/setup').then((r) => r.json()).then((v: { liveReady?: boolean }) => setLiveReady(v.liveReady === true)).catch(() => {}); return () => controller.current?.abort(); }, []);
  async function run(mode: 'scripted' | 'live') { if (pending) return; const abort = new AbortController(); controller.current = abort; setPending(true); setFrames([]); setResult(undefined); setFileText('');
    try { const outcome = await streamPost('/api/c7/query', { mode, policy, scenario: mode === 'live' ? 'normal' : scenario, prompt, deadlineSeconds: 30, handlerTimeoutMs: 1000,
        ...(mode === 'live' ? { budgetCents: 50 } : {}) }, { signal: abort.signal, idleMs: 25_000, deadlineMs: 45_000, resultSchema: lab07ResultSchema,
        onEvent: (type, data) => { if (type === 'progress') setFrames((all) => [...all, lab07FrameSchema.parse(data)]); } });
      if (outcome.kind === 'success') { setResult(outcome.result); setStatus(outcome.result.message); } else setStatus('Cancelled locally; the server attempted bounded interrupt and cleanup.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Run failed.'); } finally { controller.current = null; setPending(false); } }
  async function load(name: 'draft.md' | 'protected.md' | 'proposed.md') { if (!result) return; try { const value = await request(`/api/c7/file?runId=${result.runId}&name=${name}`, lab07FileResponseSchema); setFileText(`${value.file.containerPath}\n${value.file.content}`); }
    catch (error) { setFileText(error instanceof Error ? error.message : 'File read failed.'); } }
  const audits = result?.audits ?? frames.flatMap((frame) => frame.kind === 'audit' ? [frame.audit] : []);
  return <section aria-labelledby="c7-heading"><h2 id="c7-heading">Host policy before execution, audit after execution</h2>
    <p>Managed Agents does not emit Agent SDK <code>PreToolUse</code> or <code>PostToolUse</code> hooks. This dedicated agent declares three custom tools. The host validates original input, decides, optionally rewrites, revalidates, executes, records the actual effect and returns <code>user.custom_tool_result</code>.</p>
    <details><summary>Dedicated custom tools ({lab07Tools.length})</summary><CodeBlock label="Lab 07 tools" lineNumbers={false} code={JSON.stringify(lab07Tools, null, 2)} /></details>
    <fieldset disabled={pending}><legend>Policy experiment</legend><label htmlFor="c7-policy">Host policy</label><select id="c7-policy" value={policy} onChange={(e) => { const next = e.target.value as Lab07Policy; setPolicy(next); setPrompt((current) => Object.values(lab07Prompts).includes(current) ? lab07Prompts[next] : current); }}>{lab07Policies.map((p) => <option key={p} value={p}>{labels[p]}</option>)}</select>
      <label htmlFor="c7-scenario">Offline scenario</label><select id="c7-scenario" value={scenario} onChange={(e) => setScenario(e.target.value as Lab07Scenario)}>{lab07Scenarios.map((s) => <option key={s}>{s}</option>)}</select>
      <label htmlFor="c7-prompt">Prompt</label><textarea id="c7-prompt" rows={3} value={prompt} maxLength={1000} onChange={(e) => setPrompt(e.target.value)} /></fieldset>
    <div className="lab-controls"><button disabled={pending} onClick={() => void run('scripted')}>Run offline fixture</button>{pending && <button onClick={() => controller.current?.abort()}>Cancel query</button>}</div>
    <div className="lab-live"><LiveActionButton busy={pending} available={liveReady} keyIsolated setup={liveReady ? 'Live base setup is ready; the Lab 07 agent ID is also required.' : 'Live Managed setup is not ready.'}
      checkAvailability={async () => liveReady} onRun={() => void run('live')} /></div><p role="status" aria-live="polite">{redact(status)}</p>
    <h3>Policy and execution audit</h3>{audits.length ? <div className="table-scroll"><table aria-label="Policy audit"><thead><tr><th>Tool</th><th>Decision</th><th>Validation</th><th>Execution</th><th>Effect</th></tr></thead><tbody>{audits.map((a) => <tr key={a.id}><td>{a.tool}<br /><code>{a.id}</code></td><td>{a.decision}<br />{a.reason}</td><td>{a.validation}<br /><code>{a.originalInput}</code>{a.effectiveInput && a.effectiveInput !== a.originalInput ? <><br />→ <code>{a.effectiveInput}</code></> : null}</td><td>{a.outcome}; handler {a.handlerRan ? 'ran' : 'did not run'}<br />{a.result.isError ? 'is_error' : 'ok'}: {a.result.text}</td><td><code>{a.before ?? 'absent'}</code><br />→<br /><code>{a.after ?? 'absent'}</code></td></tr>)}</tbody></table></div> : <p className="muted">Run a policy to see every phase.</p>}
    <h3>File evidence</h3><div className="lab-controls">{(['draft.md', 'protected.md', 'proposed.md'] as const).map((name) => <button key={name} disabled={!result || pending} onClick={() => void load(name)}>Load {name}</button>)}</div>
    {fileText && <pre aria-label="Loaded file evidence" style={{ whiteSpace: 'pre-wrap' }}>{redact(fileText)}</pre>}
    {result && <p><strong>Outcome:</strong> {result.outcome.kind}. Results sent: {result.resultsSent}. Interruption: {result.interruption}. Cleanup: {result.cleanup}.</p>}
  </section>;
}

