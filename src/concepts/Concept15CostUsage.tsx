import { useEffect, useRef, useState } from 'react';
import { displayCents, lab15RequestSchema, lab15Scenarios, lab15SnapshotSchema } from '../../shared/lab15-usage';
import type { Lab15Input, Lab15Reading, Lab15Snapshot } from '../../shared/lab15-usage';
import { CodeBlock } from '../components/CodeBlock';
import { LiveActionButton } from '../components/LiveActionButton';
import { streamPost } from '../lib/sse';

const number = (value: number | null) => value === null ? 'not available' : String(value);
function Reading({ row }: { row: Lab15Reading }) {
  return <article aria-label={`${row.scope} ${row.via} usage`}><h4>{row.scope} / {row.via}</h4>
    <p><code>{row.identity}</code>{row.agentName ? `; agent: ${row.agentName}` : ''}. Observed: {row.asOf}.</p>
    <p>Input: {number(row.metrics.inputTokens)}; output: {number(row.metrics.outputTokens)}; cache read: {number(row.metrics.cacheReadTokens)} tokens.</p>
    <p>Cache creation: {number(row.metrics.cacheCreationTokens)} tokens (5 min: {number(row.metrics.cache5mTokens)}; 1 hour: {number(row.metrics.cache1hTokens)}).</p>
    <p>Active time: {number(row.metrics.activeSeconds)} seconds. List cost: {displayCents(row.metrics.listCostCents)}{row.metrics.listCostCents !== null ? ` (${row.metrics.listCostCents} US cents)` : ''}.</p>
    <p>Web search requests: {number(row.metrics.webSearchRequests)}; web fetch requests: {number(row.metrics.webFetchRequests)}.</p>
    <p>Comparable change — input: {number(row.delta.inputTokens)}, output: {number(row.delta.outputTokens)}, list cost: {displayCents(row.delta.listCostCents)}. {row.deltaNote}</p>
  </article>;
}
export default function Concept15CostUsage() {
  const owner = useRef(crypto.randomUUID()), current = useRef<string | null>(null), controller = useRef<AbortController | null>(null), mounted = useRef(true);
  const [prompt, setPrompt] = useState('Summarize a safe offline notebook synchronization plan in three short steps.');
  const [scenario, setScenario] = useState<Lab15Input['scenario']>('normal'), [budget, setBudget] = useState(50);
  const [maxTurns, setMaxTurns] = useState(3), [maxMessages, setMaxMessages] = useState(3), [deadline, setDeadline] = useState(30);
  const [newBudget, setNewBudget] = useState(100), [acknowledge, setAcknowledge] = useState(false);
  const [context, setContext] = useState('Keep observations concise and distinguish confirmed facts from unknown details.');
  const [snapshot, setSnapshot] = useState<Lab15Snapshot>(), [busy, setBusy] = useState(false), [liveReady, setLiveReady] = useState(false);
  const [status, setStatus] = useState('Ready. Offline accounting values are authored fixtures, not measurements of Claude.');
  const headers = { 'X-Lab-Owner': owner.current, 'Content-Type': 'application/json' };
  async function setup() { const response = await fetch('/api/managed/setup', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Cannot check setup.'); const data = await response.json(); if (mounted.current) setLiveReady(data.liveReady === true); return data.liveReady === true; }
  function accept(data: Lab15Snapshot) { current.current = data.runId; if (mounted.current) { setSnapshot(data); setStatus(data.message); } }
  useEffect(() => { mounted.current = true; void setup().catch(() => { if (mounted.current) setStatus('Start the backend and check setup again.'); });
    return () => { mounted.current = false; controller.current?.abort(); if (current.current) void fetch('/api/c15/end', { method: 'POST', headers, body: JSON.stringify({ runId: current.current }), keepalive: true }); };
  }, []);
  async function post(operation: string, body: unknown) {
    const response = await fetch(`/api/c15/${operation}`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) { const data = await response.json(); throw new Error(data.error?.message ?? 'Request failed.'); }
    const data = lab15SnapshotSchema.parse(await response.json()); accept(data); return data;
  }
  async function close() { if (!current.current) return; const data = await post('end', { runId: current.current }); if (data.state !== 'closed') throw new Error(data.message); current.current = null; }
  async function run(mode: Lab15Input['mode'], followup = false, raising = false) {
    if (controller.current) return;
    let input: Lab15Input;
    try { input = lab15RequestSchema.parse({ mode, prompt, scenario: mode === 'live' ? 'normal' : scenario, budgetCents: budget, maxTurns, maxMessages, deadlineSeconds: deadline }); }
    catch { setStatus('Check prompt, integer-cent budget, deadline and message/turn bounds. Nothing was sent.'); return; }
    setBusy(true); const abort = new AbortController(); controller.current = abort;
    try {
      if (!followup && !raising) await close();
      if (mode === 'live' && !await setup()) throw new Error('Live setup is unavailable.');
      if (raising && !acknowledge) throw new Error('Acknowledge that raising the budget can immediately resume billed work.');
      const operation = raising ? 'budget' : followup ? 'send' : 'run';
      setStatus(raising ? 'Explicit budget raise requested; paused work may resume.' : 'Starting a bounded session turn…');
      const body = raising ? { runId: current.current, budgetCents: newBudget, acknowledgeResume: true } : followup ? { runId: current.current, prompt } : input;
      const result = await streamPost(`/api/c15/${operation}`, body, { headers, signal: abort.signal, idleMs: 30000, deadlineMs: 220000, resultSchema: lab15SnapshotSchema,
        onEvent: (type, data) => { if (type === 'prepared' && data && typeof data === 'object' && 'runId' in data && typeof data.runId === 'string') current.current = data.runId;
          if (type === 'progress') { const parsed = lab15SnapshotSchema.safeParse(data); if (parsed.success) accept(parsed.data); } } });
      if (result.kind === 'success') accept(result.result);
      else { setStatus('Cancelled locally. Reconciling remote work…'); if (current.current) await close(); }
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'Experiment failed.'); }
    finally { controller.current = null; if (mounted.current) setBusy(false); }
  }
  async function control(operation: string) { setBusy(true); try { if (operation === 'end') await close(); else await post(operation, { runId: current.current, ...(operation === 'context' ? { text: context } : {}) }); }
    catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'Request failed.'); } finally { if (mounted.current) setBusy(false); } }
  const idle = snapshot?.state === 'idle', paused = snapshot?.state === 'budget-paused';
  return <section aria-labelledby="lab15-heading"><h2 id="lab15-heading">Read usage and bound session spending</h2>
    <p>Session totals, observed request spans and thread attribution overlap. Compare their scope; never add them together.</p>
    <fieldset disabled={busy || Boolean(current.current)}><legend>New session limits</legend>
      <label>Offline scenario<select aria-label="Offline scenario" value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>{lab15Scenarios.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Creation budget (US cents)<input type="number" min={1} max={500} value={budget} onChange={event => setBudget(Number(event.target.value))} /></label>
      <label>Host turn limit<input type="number" min={1} max={3} value={maxTurns} onChange={event => setMaxTurns(Number(event.target.value))} /></label>
      <label>Host message limit<input type="number" min={1} max={3} value={maxMessages} onChange={event => setMaxMessages(Number(event.target.value))} /></label>
      <label>Local deadline (seconds)<input type="number" min={1} max={120} value={deadline} onChange={event => setDeadline(Number(event.target.value))} /></label>
      <p>Tool calls allowed: 0. One context message and at most one explicit budget raise. Live uses a text-only, single-agent configuration; child attribution is an offline experiment.</p>
    </fieldset>
    <label>User question<textarea className="lab-prompt" rows={3} value={prompt} maxLength={1000} disabled={busy} onChange={event => setPrompt(event.target.value)} /></label>
    <div className="lab-controls"><button disabled={busy || Boolean(current.current)} onClick={() => void run('scripted')}>Start offline usage experiment</button>
      <button disabled={busy || !idle} onClick={() => void run(snapshot!.source === 'managed-api' ? 'live' : 'scripted', true)}>Send another turn</button>
      <button disabled={busy || !(idle || paused)} onClick={() => void control('usage')}>Retrieve session usage</button>
      <button disabled={busy || !current.current} onClick={() => void control('end')}>Close usage session</button>
      {busy && <button onClick={() => controller.current?.abort()}>Cancel experiment</button>}</div>
    <LiveActionButton busy={busy} available={liveReady} checkAvailability={setup} onRun={() => void run('live')} keyIsolated
      {...(current.current ? { blockedReason: 'Close the current experiment before creating another billed session.' } : {})}
      setup="Configure the existing single-agent base agent, environment, isolated server API key and MANAGED_LIVE_ENABLED=true. No resource or model test starts during setup. Run live creates a billed budgeted session with at most three host turns and zero tools." />
    <p role="status" aria-label="Usage experiment status">{status}</p>
    <details><summary>Explicit context message</summary><label>Context text<textarea value={context} maxLength={1000} disabled={busy} onChange={event => setContext(event.target.value)} /></label>
      <button disabled={busy || !idle || Boolean(snapshot?.contextsUsed)} onClick={() => void control('context')}>Send one context message</button></details>
    <details><summary>Explicit budget raise and resume</summary><p>Changing an existing cap can resume paused work immediately. This host allows one increase up to 500 cents; removing a cap, adding one late and automatic increases are disabled. A resumed operation also consumes a host turn.</p>
      <label>New cap (US cents)<input type="number" min={1} max={500} value={newBudget} disabled={busy} onChange={event => setNewBudget(Number(event.target.value))} /></label>
      <label><input type="checkbox" checked={acknowledge} disabled={busy} onChange={event => setAcknowledge(event.target.checked)} /> I understand raising the cap can resume billed work</label>
      <button disabled={busy || !paused || !acknowledge || Boolean(snapshot?.budgetRaisesUsed)} onClick={() => void run(snapshot!.source === 'managed-api' ? 'live' : 'scripted', false, true)}>Raise budget and resume</button></details>
    <div aria-label="Usage evidence"><h3>Session and host boundaries</h3>{snapshot ? <><p>Source: {snapshot.source}. State: {snapshot.state}. Session: <code>{snapshot.sessionId ?? 'not created'}</code>.</p>
      <p>Cap: {displayCents(snapshot.budgetCents)}. Turns: {snapshot.turnsUsed} / {snapshot.maxTurns}; messages: {snapshot.messagesUsed} / {snapshot.maxMessages}; context: {snapshot.contextsUsed} / 1; tool calls allowed: 0.</p>
      <p>Outcome: {snapshot.outcome?.kind ?? 'not started'}{snapshot.outcome?.stopReason ? ` / ${snapshot.outcome.stopReason}` : ''}. Cleanup: {snapshot.cleanup}. Interruption: {snapshot.interruption}.</p>
      {snapshot.response && <pre>{snapshot.response}</pre>}
      <p>Duplicate usage events ignored: {snapshot.duplicateEvents}. Stale snapshots ignored: {snapshot.staleSnapshots}. {snapshot.threadsNote}</p>
      <h3>Cumulative usage by source and scope</h3><p>{snapshot.source === 'authored-fixture' ? 'All values below are fictional accounting fixtures; no Anthropic request or measurement occurred.' : 'Returned Managed API usage. Missing values stay unknown; list cost is not guaranteed invoice cost.'}</p>
      {snapshot.readings.map(row => <Reading key={`${row.scope}:${row.identity}:${row.via}`} row={row} />)}
      <details><summary>Snapshot history and comparable deltas</summary>{snapshot.history.map((row, index) => <Reading key={index} row={row} />)}</details>
      <details><summary>Full usage evidence JSON</summary><CodeBlock label="Usage evidence JSON" code={JSON.stringify(snapshot, null, 2)} /></details></> : <p>No session created yet.</p>}</div>
    <p>The platform cap governs new work at list rates; in-flight work can finish past it. Usage reads never raise a cap. Intermediate stream snapshots can differ from a later retrieved session snapshot. Thread active time can overlap, and thread costs may exclude session runtime; keep attribution separate.</p>
  </section>;
}
