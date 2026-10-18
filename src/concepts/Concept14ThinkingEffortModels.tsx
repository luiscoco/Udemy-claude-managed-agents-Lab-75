import { useEffect, useRef, useState } from 'react';
import { lab14CatalogSchema, lab14Efforts, lab14Models, lab14RequestSchema, lab14ResultSchema } from '../../shared/lab14-models';
import type { Lab14Catalog, Lab14Configuration, Lab14Input, Lab14Result } from '../../shared/lab14-models';
import { LiveActionButton } from '../components/LiveActionButton';
import { CodeBlock } from '../components/CodeBlock';
import { streamPost } from '../lib/sse';

export default function Concept14ThinkingEffortModels() {
  const owner = useRef(crypto.randomUUID()), controller = useRef<AbortController | null>(null), current = useRef<string | null>(null);
  const mounted = useRef(true);
  const [catalog, setCatalog] = useState<Lab14Catalog>();
  const [prompt, setPrompt] = useState('Give three practical steps for safely syncing an offline bird observation notebook.');
  const [model, setModel] = useState<Lab14Configuration['model']>('claude-sonnet-5-5');
  const [effort, setEffort] = useState<Lab14Configuration['effort']>('high');
  const [budget, setBudget] = useState(50), [fallbackBudget, setFallbackBudget] = useState(50);
  const [fallback, setFallback] = useState(false), [deadline, setDeadline] = useState(30);
  const [scenario, setScenario] = useState<Lab14Input['scenario']>('normal');
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Ready. Offline experiments do not contact Anthropic.');
  const [report, setReport] = useState<Lab14Result>(), [comparisons, setComparisons] = useState<Lab14Result[]>([]);
  const headers = { 'X-Lab-Owner': owner.current };
  async function readCatalog() {
    const response = await fetch('/api/c14/models', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Cannot read the model catalog.');
    const data = lab14CatalogSchema.parse(await response.json()); if (mounted.current) setCatalog(data);
    return data.liveReady && Boolean(data.models.find(item => item.id === model)?.accountReady)
      && (!fallback || Boolean(data.models.find(item => item.id === (model === 'claude-opus-5-5' ? 'claude-sonnet-5-5' : 'claude-opus-5-5'))?.accountReady));
  }
  useEffect(() => { mounted.current = true; void readCatalog().catch(() => { if (mounted.current) setStatus('Start the backend to read the catalog.'); });
    return () => { mounted.current = false; controller.current?.abort(); if (current.current) void fetch('/api/c14/end', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: current.current }), keepalive: true }); };
  }, []);
  async function close() {
    if (!current.current) return;
    const response = await fetch('/api/c14/end', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: current.current }) });
    if (!response.ok) throw new Error('Could not close the experiment.');
    const data = lab14ResultSchema.parse(await response.json());
    if (mounted.current) { setReport(data); setStatus(data.message); }
    if (data.state === 'pending') throw new Error('Earlier work remains uncertain. Check Claude Console before another attempt.');
    current.current = null;
  }
  function request(mode: Lab14Input['mode']) { return lab14RequestSchema.parse({ mode, prompt,
    configuration: { model, effort, budgetCents: budget }, scenario: mode === 'live' ? 'normal' : scenario, deadlineSeconds: deadline,
    fallback: fallback ? { model: model === 'claude-opus-5-5' ? 'claude-sonnet-5-5' : 'claude-opus-5-5', effort, budgetCents: fallbackBudget } : null }); }
  async function run(mode: Lab14Input['mode']) {
    if (controller.current) return;
    let input: Lab14Input;
    try { input = request(mode); } catch { setStatus('Invalid configuration: check model/effort compatibility, prompt and integer budget/deadline bounds. Nothing was sent.'); return; }
    setBusy(true); const abort = new AbortController(); controller.current = abort;
    try {
      await close();
      if (mode === 'live' && !await readCatalog()) throw new Error('Base setup or selected model readiness is unavailable.');
      setStatus(mode === 'live' ? 'Running a billed fresh session…' : 'Running an offline authored experiment…');
      const outcome = await streamPost('/api/c14/run', input, { headers, signal: abort.signal, idleMs: 30000, deadlineMs: 320000, resultSchema: lab14ResultSchema,
        onEvent: (type, data) => {
          if (type === 'prepared' && data && typeof data === 'object' && 'runId' in data && typeof data.runId === 'string') current.current = data.runId;
          if (type === 'progress' && data && typeof data === 'object' && 'kind' in data && data.kind === 'session' && mounted.current) setStatus('Fresh session created. Waiting for the turn to finish.');
        } });
      if (!mounted.current) return;
      if (outcome.kind === 'success') { setReport(outcome.result); setComparisons(rows => [...rows.slice(-7), outcome.result]); setStatus(outcome.result.message); }
      else { setStatus('Cancelled locally. Close and reconcile the experiment to inspect cleanup.'); await close(); }
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'Experiment failed.'); }
    finally { controller.current = null; if (mounted.current) setBusy(false); }
  }
  const fallbackModel = model === 'claude-opus-5-5' ? 'claude-sonnet-5-5' : 'claude-opus-5-5';
  const ready = Boolean(catalog?.liveReady && catalog.models.find(item => item.id === model)?.accountReady && (!fallback || catalog.models.find(item => item.id === fallbackModel)?.accountReady));
  return <section aria-labelledby="lab14-heading">
    <h2 id="lab14-heading">Compare models and supported effort</h2>
    <p>Keep prompt and model fixed; change effort in a fresh session. Observe public responses, resolved configuration and returned token usage.</p>
    <fieldset disabled={busy}><legend>Fresh session configuration</legend>
      <label>User question<textarea className="lab-prompt" rows={3} maxLength={1000} value={prompt} onChange={event => setPrompt(event.target.value)} /></label>
      <label>Model<select aria-label="Model" value={model} onChange={event => setModel(event.target.value as typeof model)}>{lab14Models.map(id => <option key={id}>{id}</option>)}</select></label>
      <label>Effort<select aria-label="Effort" value={effort} onChange={event => setEffort(event.target.value as typeof effort)}>{lab14Efforts.map(level => <option key={level}>{level}</option>)}</select></label>
      <label>Primary budget (US cents)<input type="number" min={1} max={500} value={budget} onChange={event => setBudget(Number(event.target.value))} /></label>
      <label>Local deadline (seconds)<input type="number" min={1} max={catalog?.deadlineSeconds ?? 120} value={deadline} onChange={event => setDeadline(Number(event.target.value))} /></label>
      <label><input type="checkbox" checked={fallback} onChange={event => setFallback(event.target.checked)} /> Allow one host fallback after reconciled failure</label>
      {fallback && <><p>Fallback model: <code>{fallbackModel}</code>, same effort and prompt. A separate fresh session receives its own selected budget. Combined requested limit: {budget + fallbackBudget} US cents; list-cost limits are not measured charges.</p>
        <label>Fallback budget (US cents)<input type="number" min={1} max={500} value={fallbackBudget} onChange={event => setFallbackBudget(Number(event.target.value))} /></label></>}
      <label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
        {['normal', 'primary-unavailable', 'uncertain', 'mismatch', 'hang'].map(value => <option key={value}>{value}</option>)}</select></label>
    </fieldset>
    <div className="lab-controls"><button disabled={busy} onClick={() => void run('scripted')}>Run offline model experiment</button>
      {busy && <button onClick={() => controller.current?.abort()}>Cancel experiment</button>}
      <button disabled={busy || !current.current} onClick={() => void close().catch(error => setStatus(String(error)))}>Close and reconcile experiment</button>
      <button disabled={busy} onClick={() => setComparisons([])}>Clear comparisons</button></div>
    <LiveActionButton busy={busy} available={ready} checkAvailability={readCatalog} onRun={() => void run('live')} keyIsolated
      setup="Configure the base agent/environment, server API key and MANAGED_LIVE_ENABLED=true. Declare the selected account models in CLAUDE_MANAGED_LAB14_MODELS (comma-separated IDs), restart the backend and check again. Setup does not verify provider access. Run live starts one session, or at most two under the selected fallback policy." />
    <p role="status" aria-label="Model experiment status">{status}</p>
    <h3>Server-owned capability catalog</h3>
    {catalog ? <><p>SDK {catalog.sdkVersion}; documentation checked {catalog.checkedOn}. Account access verified by setup: no.</p>
      <ul>{catalog.models.map(item => <li key={item.id}><code>{item.id}</code>: {item.efforts.join(', ')}. {item.readiness}</li>)}</ul>
      <details><summary>Unsupported controls and documentation</summary><ul>{catalog.unsupported.map(item => <li key={item.setting}><strong>{item.setting}:</strong> {item.reason}</li>)}</ul>
        <ul>{catalog.sources.map(source => <li key={source}><a href={source}>Official documentation: {new URL(source).pathname.split('/').pop()}</a></li>)}</ul></details></> : <p>Catalog not loaded.</p>}
    <h3>Fresh session evidence</h3>
    <div aria-label="Model experiment evidence">{report ? <><p>Source: {report.source}. State: {report.state}. {report.fallbackDecision}</p>
      {report.attempts.map(attempt => <article key={attempt.attempt}><h4>Attempt {attempt.attempt}: {attempt.result.outcome.kind}</h4>
        <p>Session: <code>{attempt.result.sessionId ?? 'No confirmed session ID'}</code>. Creation: {attempt.creation}. Cleanup: {attempt.result.cleanup}. Interruption: {attempt.result.interruption}.</p>
        <p>Requested: {attempt.requested.model} / {attempt.requested.effort}. Resolved: {attempt.resolved ? `${attempt.resolved.model} / ${attempt.resolved.effort ?? 'not returned'}; configuration matches: ${attempt.resolved.matches}` : 'not returned'}.</p>
        {attempt.result.messages.map(message => <AgentMessage key={message.eventId} text={message.text} />)}
        <p>{attempt.result.outcome.detail}</p>
        <p>Reported usage: {attempt.reportedUsage ? `${attempt.reportedUsage.inputTokens} input / ${attempt.reportedUsage.outputTokens} output; ${attempt.reportedUsage.cacheCreationTokens} cache creation / ${attempt.reportedUsage.cacheReadTokens} cache read; ${attempt.reportedUsage.requests} request spans` : 'not reported; offline fixtures are not measurements'}.</p>
        <p>Host elapsed time: {attempt.elapsedMs === null ? 'not measured for fixtures' : `${attempt.elapsedMs} ms (includes setup and cleanup)`}. Actual billed cost: not reported.</p></article>)}
      <details><summary>Full model experiment JSON</summary><CodeBlock label="Model experiment JSON" code={JSON.stringify(report, null, 2)} /></details></> : <p>No attempt yet.</p>}</div>
    <h3>Effort comparisons</h3><p>Each row is a separate run. Fixture responses, latency and costs cannot establish model quality or performance. Usage covers observed model-request spans, not total billed session cost. Model identity comes from the resolved session snapshot; spans do not report it separately.</p>
    <div className="table-scroll"><table><thead><tr><th>Prompt / source</th><th>Configuration</th><th>Outcome</th></tr></thead><tbody>
      {comparisons.flatMap(row => row.attempts.map(attempt => <tr key={`${row.runId}-${attempt.attempt}`}><td>{row.prompt}<br />{row.source}</td><td>{attempt.requested.model} / {attempt.requested.effort}<br />Session: {attempt.result.sessionId ?? 'unknown'}</td><td>{attempt.result.outcome.kind}; {attempt.result.cleanup}</td></tr>))}
    </tbody></table></div>
  </section>;
}
import { AgentMessage } from '../components/AgentMessage';
