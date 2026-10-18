import { useEffect, useId, useRef, useState } from 'react';
import { apiErrorSchema } from '../../shared/contracts';
import { conceptMapping, defaultChallengeInput, handlerLimits, lab05FrameSchema, lab05Prompt, lab05ResultSchema, lab05Scenarios,
  lab05Tools, tasksResponseSchema } from '../../shared/lab05-custom-tools';
import type { CustomCall, Lab05Frame, Lab05Request, Lab05Result, Lab05Scenario, Task, TasksResponse } from '../../shared/lab05-custom-tools';
import { CodeBlock } from '../components/CodeBlock';
import { LiveActionButton } from '../components/LiveActionButton';
import { redact } from '../lib/presentation';
import { streamPost } from '../lib/sse';

type Mode = 'scripted' | 'live';
const scenarioLabels: Record<Lab05Scenario, string> = {
  'tour': 'Tour: valid calls, malformed input, unknown and repeated IDs',
  'valid-only': 'Valid only: list, add, complete, list',
  'slow-handler': 'Slow handler: add_task passes its deadline',
  'hang': 'Hang: the agent keeps working (cancel or deadline)',
};
const outcomeLabels: Record<CustomCall['outcome'], string> = {
  'ok': 'handler ran', 'tool-error': 'handler ran, returned an error', 'rejected': 'rejected before the handler',
  'unknown-tool': 'unknown tool', 'timeout': 'handler deadline passed', 'not-seen': 'call not seen',
};

/** What one call changed, read from its before/after snapshots. */
export function stateChange(before: readonly Task[], after: readonly Task[]): string {
  const old = new Map(before.map((task) => [task.id, task]));
  const changes = after.flatMap((task) => {
    const previous = old.get(task.id);
    if (!previous) return [`added ${task.id}`];
    return previous.status !== task.status ? [`${task.id} ${previous.status} → ${task.status}`] : [];
  });
  return changes.join(', ') || 'no change';
}
/** Table preview only; the full result text is in the raw user.custom_tool_result event. */
const preview = (text: string) => text.length > 140 ? `${text.slice(0, 140)}…` : text;
const taskLine = (task: Task) => `${task.id} [${task.status}] ${task.title} (${task.priority})`;

export default function Concept05CustomTools() {
  const promptId = useId(), scenarioId = useId(), challengeId = useId();
  const [prompt, setPrompt] = useState(lab05Prompt);
  const [scenario, setScenario] = useState<Lab05Scenario>('tour');
  const [challengeText, setChallengeText] = useState(JSON.stringify(defaultChallengeInput));
  const [handlerTimeoutMs, setHandlerTimeoutMs] = useState<number>(handlerLimits.defaultMs);
  const [deadlineSeconds, setDeadlineSeconds] = useState(120);
  const [budgetCents, setBudgetCents] = useState(50);
  const [mode, setMode] = useState<Mode>('scripted');
  const [pending, setPending] = useState(false);
  const [frames, setFrames] = useState<Lab05Frame[]>([]);
  const [result, setResult] = useState<Lab05Result>();
  const [serverTasks, setServerTasks] = useState<TasksResponse | null>(null);
  const [status, setStatus] = useState('Ready. Offline fixtures need no credentials and make no API calls.');
  const [liveReady, setLiveReady] = useState(false);
  const [setupText, setSetupText] = useState('Live mode creates one billed session on the provisioned Lab 05 agent. Checking server setup…');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);

  async function readSetup() {
    const [setup, tools] = await Promise.all([fetch('/api/managed/setup', { signal: AbortSignal.timeout(5000) }),
      fetch('/api/c5/tools', { signal: AbortSignal.timeout(5000) })]);
    if (!setup.ok || !tools.ok) throw new Error('setup');
    const data = await setup.json() as { liveReady: boolean; liveEnabled: boolean; missing: string[]; invalid: string[] };
    const agent = (await tools.json() as { liveAgent: { envVar: string; configured: boolean } }).liveAgent;
    const problems = [data.missing.length ? `missing: ${data.missing.join(', ')}` : '', data.invalid.length ? `invalid: ${data.invalid.join(', ')}` : '',
      !data.liveEnabled ? 'MANAGED_LIVE_ENABLED is not "true"' : '', !agent.configured ? `${agent.envVar} is not set` : ''].filter(Boolean);
    const ready = data.liveReady && agent.configured;
    setSetupText(ready ? 'Live setup is ready.' : `Live mode is not ready (${problems.join('; ') || 'SDK check failed'}). Provision the Lab 05 agent with "npm run managed:provision -- lab05", set ${agent.envVar} on the server and restart the backend. See docs/managed-setup.md.`);
    return ready;
  }
  useEffect(() => {
    void readSetup().then((ready) => { if (mounted.current) setLiveReady(ready); })
      .catch(() => { if (mounted.current) setSetupText('Could not reach the backend setup endpoints. Start the API server (npm run dev) and check again.'); });
  }, []);

  function challengeInput(): Record<string, unknown> | undefined | 'invalid' {
    if (scenario !== 'tour' || !challengeText.trim()) return undefined;
    try {
      const value: unknown = JSON.parse(challengeText);
      return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : 'invalid';
    } catch { return 'invalid'; }
  }

  async function run(chosen: Mode) {
    if (controller.current) return;
    if (!prompt.trim()) { setStatus('Enter a prompt before running. Nothing was sent.'); return; }
    const challenge = chosen === 'scripted' ? challengeInput() : undefined;
    if (challenge === 'invalid') { setStatus('The challenge input must be a JSON object, for example {"title": 42}. Nothing was sent.'); return; }
    setMode(chosen);
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setFrames([]); setResult(undefined); setServerTasks(null);
    setStatus(chosen === 'live' ? 'Running live: verifying the Lab 05 agent and creating a session…' : 'Running offline fixture…');
    const body: Lab05Request = { mode: chosen, prompt, deadlineSeconds, handlerTimeoutMs,
      ...(chosen === 'live' ? { budgetCents } : { scenario, ...(challenge ? { challengeInput: challenge } : {}) }) };
    try {
      const outcome = await streamPost('/api/c5/query', body, { signal: abort.signal, idleMs: 25_000, deadlineMs: 170_000,
        resultSchema: lab05ResultSchema,
        onEvent: (type, data) => { if (type === 'progress' && mounted.current) setFrames((all) => [...all.slice(-399), lab05FrameSchema.parse(data)]); } });
      if (!mounted.current) return;
      if (outcome.kind === 'success') { setResult(outcome.result); setStatus(outcome.result.message); }
      else setStatus('Cancelled locally. The server attempted user.interrupt; its result cannot reach this page once the connection is closed. The run\'s task state is still readable below.');
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'The query failed.'); }
    finally { controller.current = null; if (mounted.current) setPending(false); }
  }

  const runFrame = frames.find((f): f is Extract<Lab05Frame, { kind: 'run' }> => f.kind === 'run');
  async function loadTasks() {
    if (!runFrame) return;
    try {
      const response = await fetch(`/api/c5/tasks?runId=${encodeURIComponent(runFrame.runId)}`, { signal: AbortSignal.timeout(5000) });
      const data: unknown = await response.json();
      if (!response.ok) { const error = apiErrorSchema.safeParse(data); setStatus(`HTTP ${response.status}: ${error.success ? error.data.error.message : 'request failed'}`); return; }
      if (mounted.current) setServerTasks(tasksResponseSchema.parse(data));
    } catch { if (mounted.current) setStatus('GET /api/c5/tasks could not be read.'); }
  }

  const calls = frames.flatMap((f) => f.kind === 'custom_call' ? [f.call] : []);
  const messages = frames.filter((f) => f.kind === 'message');

  return <section aria-labelledby="c5-heading">
    <h2 id="c5-heading">Custom tools answered by the host</h2>
    <p>The Agent SDK runs <code>createSdkMcpServer</code> tools in-process. Managed Agents has no in-process server: the <strong>agent</strong> declares <code>custom</code> tools, the session emits <code>agent.custom_tool_use</code> and pauses with <code>requires_action</code>, and this host validates the input, runs the handler and answers once with <code>user.custom_tool_result</code>.</p>
    <h3>Agent SDK to Managed Agents</h3>
    <div className="table-scroll"><table><thead><tr><th scope="col">Agent SDK term</th><th scope="col">Managed Agents equivalent</th></tr></thead>
      <tbody>{conceptMapping.map((row) => <tr key={row.sdk}><td><code>{row.sdk}</code></td><td>{row.managed}</td></tr>)}</tbody></table></div>
    <details><summary>Custom tool definitions on the agent ({lab05Tools.length})</summary>
      <p className="muted">Generated from the Zod shapes in shared/lab05-custom-tools.ts. managed/lab05-agent.json contains exactly these.</p>
      <CodeBlock label="Custom tool definitions" lineNumbers={false} code={JSON.stringify(lab05Tools, null, 2)} /></details>

    <fieldset disabled={pending}><legend>Run settings</legend>
      <label htmlFor={promptId}>Prompt</label>
      <textarea id={promptId} className="lab-prompt" rows={3} maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <label>Handler deadline (ms) <input type="number" min={handlerLimits.minMs} max={handlerLimits.maxMs} step={100} value={handlerTimeoutMs} onChange={(e) => setHandlerTimeoutMs(Number(e.target.value))} /></label>
      <label>Local deadline (seconds) <input type="number" min={1} max={120} step={1} value={deadlineSeconds} onChange={(e) => setDeadlineSeconds(Number(e.target.value))} /></label>
      <label>Live session budget (US cents) <input type="number" min={1} max={500} step={1} value={budgetCents} onChange={(e) => setBudgetCents(Number(e.target.value))} /></label>
    </fieldset>
    <div className="lab-controls">
      <div className="lab-field"><label htmlFor={scenarioId}>Offline scenario</label>
        <select id={scenarioId} value={scenario} disabled={pending} onChange={(e) => setScenario(e.target.value as Lab05Scenario)}>
          {lab05Scenarios.map((name) => <option key={name} value={name}>{scenarioLabels[name]}</option>)}
        </select></div>
      <button type="button" disabled={pending} onClick={() => void run('scripted')}>Run offline fixture</button>
      {pending && <button type="button" onClick={() => controller.current?.abort()}>Cancel query</button>}
    </div>
    {scenario === 'tour' && <div className="lab-field"><label htmlFor={challengeId}>Malformed add_task input (Tour, offline)</label>
      <textarea id={challengeId} rows={2} maxLength={400} disabled={pending} value={challengeText} onChange={(e) => setChallengeText(e.target.value)} />
      <p className="muted">The fourth call of the Tour sends this object as add_task input. Try {'{"title": 42}'} or {'{"title": "x", "owner": "me"}'}.</p></div>}
    <div className="lab-live"><LiveActionButton busy={pending} available={liveReady} keyIsolated setup={setupText}
      checkAvailability={async () => { const ready = await readSetup(); setLiveReady(ready); return ready; }} onRun={() => void run('live')} /></div>
    <p role="status" aria-live="polite">{redact(status)}</p>
    <p><strong>Mode:</strong> {result ? (result.source === 'authored-fixture' ? 'Offline authored fixture: recorded tool calls, real host handlers, no Claude.' : 'Live Managed Agents: billed API execution.') : mode === 'live' ? 'Live Managed Agents (billed).' : 'Offline authored fixture (no API calls).'}</p>

    <h3>1. Custom tool calls</h3>
    {calls.length === 0 ? <p className="muted">Each agent.custom_tool_use appears here once the host has answered it.</p>
      : <div className="table-scroll"><table aria-label="Custom tool calls">
        <thead><tr><th scope="col">Call</th><th scope="col">Raw input</th><th scope="col">Validation</th><th scope="col">Handler</th><th scope="col">Result sent</th><th scope="col">State change</th></tr></thead>
        <tbody>{calls.map((call) => <tr key={call.id}>
          <td>{call.name}<br /><code style={{ whiteSpace: 'nowrap' }}>{call.id}</code></td>
          <td><code>{redact(call.rawInput)}</code></td>
          <td style={{ minWidth: '6rem' }}>{call.validation.ok ? 'passed' : <>rejected: {call.validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}</>}</td>
          <td style={{ minWidth: '7rem' }}>{call.handlerRan ? outcomeLabels[call.outcome] : `did not run (${outcomeLabels[call.outcome]})`}</td>
          <td><strong style={{ whiteSpace: 'nowrap' }}>{call.result.isError ? 'is_error: true' : 'is_error: false'}</strong> <code>{preview(redact(call.result.text))}</code></td>
          <td style={{ minWidth: '8rem' }}>{stateChange(call.before, call.after)}</td>
        </tr>)}</tbody></table></div>}

    <h3>2. Task state</h3>
    {result ? <div role="group" aria-label="Task state">
      <p><strong>Before the run:</strong></p><ul>{result.tasks.initial.map((task) => <li key={task.id}>{taskLine(task)}</li>)}</ul>
      <p><strong>After the run:</strong></p><ul>{result.tasks.final.map((task) => <li key={task.id}>{taskLine(task)}</li>)}</ul>
      <p>Handler calls: list_tasks {result.handlerCalls.list_tasks}, add_task {result.handlerCalls.add_task}, complete_task {result.handlerCalls.complete_task} — for {result.calls.length} tool calls and {result.resultsSent} results sent.</p>
    </div> : <p className="muted">Each run has its own task store, seeded with the same two tasks.</p>}
    <div className="lab-controls"><button type="button" disabled={!runFrame || pending} onClick={() => void loadTasks()}>Load task state from GET /api/c5/tasks</button></div>
    {serverTasks && <div role="group" aria-label="Server task state"><p>Run <code>{serverTasks.runId}</code> ({serverTasks.active ? 'active' : 'finished'}):</p>
      <ul>{serverTasks.tasks.map((task) => <li key={task.id}>{taskLine(task)}</li>)}</ul></div>}

    <h3>3. Agent text</h3>
    {messages.length ? messages.map((m) => <AgentMessage key={m.eventId} text={m.text} />) : <p className="muted">No agent.message yet.</p>}

    <h3>4. Turn outcome</h3>
    {result ? <div role="group" aria-label="Turn outcome"><p><strong>{result.outcome.kind}</strong>{result.outcome.stopReason ? ` (${result.outcome.stopReason})` : ''}. {result.outcome.detail}</p>
      <p>Session tools: {result.sessionTools?.map((tool) => `${tool.name} (${tool.type})`).join(', ') ?? 'none'}. Interruption: {result.interruption}. Session cleanup: {result.cleanup}.</p></div>
      : <p className="muted">A requires_action pause is not the end of the turn; only end_turn completes it.</p>}
    <details><summary>Raw events</summary><CodeBlock label="Raw session events" lineNumbers={false}
      code={frames.flatMap((f) => 'raw' in f && f.raw ? [redact(f.raw)] : []).join('\n') || 'No events yet.'} /></details>
  </section>;
}
import { AgentMessage } from '../components/AgentMessage';
