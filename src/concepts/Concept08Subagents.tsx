import { useEffect, useRef, useState } from 'react';
import { lab08AgentsResponseSchema, lab08FrameSchema, lab08Prompt, lab08ResultSchema, lab08Scenarios } from '../../shared/lab08-subagents';
import type { Lab08Frame, Lab08Result, Lab08Scenario } from '../../shared/lab08-subagents';
import { LiveActionButton } from '../components/LiveActionButton';
import { streamPost } from '../lib/sse';
import { request } from '../lib/api';
import { redact } from '../lib/presentation';

export default function Concept08Subagents() {
  const [scenario, setScenario] = useState<Lab08Scenario>('normal'); const [prompt, setPrompt] = useState(lab08Prompt); const [pending, setPending] = useState(false);
  const [frames, setFrames] = useState<Lab08Frame[]>([]); const [result, setResult] = useState<Lab08Result>(); const [status, setStatus] = useState('Ready. Offline histories are authored evidence, not proof of real parallel execution.');
  const [liveReady, setLiveReady] = useState(false); const [agentReady, setAgentReady] = useState(false); const controller = useRef<AbortController | null>(null);
  useEffect(() => { void Promise.all([fetch('/api/managed/setup').then((r) => r.json()), request('/api/c8/agents', lab08AgentsResponseSchema)]).then(([setup, roster]) => { setLiveReady((setup as {liveReady?:boolean}).liveReady === true); setAgentReady(roster.liveAgent.configured); }).catch(() => {}); return () => controller.current?.abort(); }, []);
  async function run(mode: 'scripted'|'live') { if (pending) return; const abort = new AbortController(); controller.current = abort; setPending(true); setFrames([]); setResult(undefined);
    // Live delegation to three workers can stream nothing for a long time, so live uses the server's 120 s maximum.
    const live = mode === 'live';
    try { const value = await streamPost('/api/c8/query', { mode, prompt, scenario: live ? 'normal' : scenario, deadlineSeconds: live ? 120 : 30, ...(live ? { budgetCents: 50 } : {}) },
      { signal: abort.signal, idleMs: live ? 130_000 : 25_000, deadlineMs: live ? 135_000 : 45_000, resultSchema: lab08ResultSchema, onEvent: (type, data) => { if (type === 'progress') setFrames((all) => [...all, lab08FrameSchema.parse(data)]); } });
      if (value.kind === 'success') { setResult(value.result); setStatus(value.result.message); } else setStatus('Cancelled locally; the server stopped child activity through its interrupt boundary.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Run failed.'); } finally { controller.current = null; setPending(false); } }
  const threads = result?.threads ?? frames.flatMap((frame) => frame.kind === 'thread' ? [frame.thread] : []); const effects = result?.effects ?? frames.flatMap((frame) => frame.kind === 'effect' ? [frame.effect] : []);
  return <section aria-labelledby="c8-heading"><h2 id="c8-heading">Delegation with separate session threads</h2>
    <p>The coordinator uses the pinned SDK's <code>multiagent_20261001</code> configuration with three predefined agents. Inline agents and workflows are disabled. Child streams are identified by <code>sthr_</code> IDs; no <code>parent_tool_use_id</code> contract is assumed.</p>
    <fieldset disabled={pending}><legend>Delegation experiment</legend><label htmlFor="c8-scenario">Offline scenario</label><select id="c8-scenario" value={scenario} onChange={(e) => setScenario(e.target.value as Lab08Scenario)}>{lab08Scenarios.map((item) => <option key={item}>{item}</option>)}</select>
      <label htmlFor="c8-prompt">Prompt</label><textarea id="c8-prompt" rows={3} value={prompt} maxLength={1200} onChange={(e) => setPrompt(e.target.value)} /></fieldset>
    <div className="lab-controls"><button disabled={pending} onClick={() => void run('scripted')}>Run offline delegation</button>{pending && <button onClick={() => controller.current?.abort()}>Cancel query</button>}</div>
    <div className="lab-live"><LiveActionButton busy={pending} available={liveReady && agentReady} keyIsolated setup={liveReady && agentReady ? 'Live setup and Lab 08 coordinator are configured.' : 'Live setup and CLAUDE_MANAGED_LAB08_AGENT_ID are required.'} checkAvailability={async () => liveReady && agentReady} onRun={() => void run('live')} /></div>
    <p role="status" aria-live="polite">{redact(status)}</p>
    <h3>Thread histories</h3>{threads.length ? <div className="table-scroll"><table aria-label="Session threads"><thead><tr><th>Thread</th><th>Agent</th><th>Status</th><th>History</th></tr></thead><tbody>{threads.map((t, i) => <tr key={`${t.threadId}-${i}`}><td><code>{t.threadId}</code></td><td>{t.role}<br />{t.agentName}</td><td>{t.status}</td><td>{t.history.map((h) => <div key={h.id}><strong>{h.direction}:</strong> {h.text}</div>)}</td></tr>)}</tbody></table></div> : <p className="muted">Run the fixture to inspect each thread separately.</p>}
    <h3>Capability and effect ledger</h3>{effects.length ? <div className="table-scroll"><table aria-label="Effect ledger"><thead><tr><th>Role</th><th>Action</th><th>Decision</th><th>Verified effect</th></tr></thead><tbody>{effects.map((e) => <tr key={e.id}><td>{e.role}</td><td>{e.action}</td><td>{e.decision}; handler {e.handlerRan ? 'ran' : 'did not run'}</td><td>{e.effect}</td></tr>)}</tbody></table></div> : <p className="muted">Effects appear here after host verification.</p>}
    {result && <p><strong>States:</strong> {result.states.join(' → ')}. Duplicates ignored: {result.duplicatesIgnored}. Outcome: {result.outcome}.</p>}
  </section>;
}
