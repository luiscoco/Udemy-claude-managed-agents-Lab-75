import { useEffect, useRef, useState } from 'react';
import { lab12Models, lab12Scenarios, lab12SnapshotSchema, lab12TinyImage } from '../../shared/lab12-streaming-input';
import type { Lab12Snapshot, Lab12Message } from '../../shared/lab12-streaming-input';
import { streamPost } from '../lib/sse';
import { CodeBlock } from '../components/CodeBlock';
import { LiveActionButton } from '../components/LiveActionButton';
import { redact } from '../lib/presentation';

export default function Concept12StreamingInput() {
  const [snapshot, setSnapshot] = useState<Lab12Snapshot>(); const [text, setText] = useState('Describe the fictional Aurora Finch notebook in one sentence.');
  const [scenario, setScenario] = useState<Lab12Message['scenario']>('normal'); const [image, setImage] = useState(false);
  const [status, setStatus] = useState('Ready. Create an offline session, then admit messages to its host queue.');
  const [busy, setBusy] = useState(false); const [ready, setReady] = useState(false);
  const [model, setModel] = useState<(typeof lab12Models)[number]>(lab12Models[0]); const [effort, setEffort] = useState<'low' | 'medium' | 'high'>('medium');
  const [context, setContext] = useState('The fictional project is Aurora Finch, an offline observation notebook.');
  const [preset, setPreset] = useState<'none' | 'read-only'>('none');
  const owner = useRef(crypto.randomUUID()); const mounted = useRef(true); const lifetime = useRef(new AbortController()); const watch = useRef<AbortController | null>(null); const currentRun = useRef<string | undefined>(undefined);
  const revision = useRef(-1);
  useEffect(() => {
    mounted.current = true; lifetime.current = new AbortController();
    void checkSetup().catch(() => {});
    return () => { mounted.current = false; lifetime.current.abort(); watch.current?.abort(); };
  }, []);
  async function checkSetup() {
    const response = await fetch('/api/managed/setup', { signal: AbortSignal.any([lifetime.current.signal, AbortSignal.timeout(5000)]) });
    const value = await response.json() as { liveReady?: boolean }; const available = response.ok && value.liveReady === true;
    if (mounted.current) setReady(available); return available;
  }
  function accept(value: Lab12Snapshot) {
    if (!mounted.current || value.runId !== currentRun.current || value.revision < revision.current) return;
    revision.current = value.revision; setSnapshot(value); setStatus(value.message);
  }
  function observe(value: Lab12Snapshot) {
    watch.current?.abort(); currentRun.current = value.runId; revision.current = -1; accept(value);
    const controller = new AbortController(); watch.current = controller;
    void streamPost('/api/c12/events', { runId: value.runId }, { signal: controller.signal, idleMs: 25_000, deadlineMs: 15 * 60_000,
      headers: { 'X-Lab-Owner': owner.current }, resultSchema: lab12SnapshotSchema,
      onEvent: (type, data) => { if (type === 'progress') accept(lab12SnapshotSchema.parse(data)); },
    }).then(result => { if (result.kind === 'success') accept(result.result); }).catch(() => { if (mounted.current && !controller.signal.aborted) setStatus('Browser event stream failed. Inspect run state or close the queue; no message was resubmitted.'); });
  }
  async function post(action: string, body: object) {
    const response = await fetch(`/api/c12/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.any([lifetime.current.signal, AbortSignal.timeout(35_000)]) });
    const value: unknown = await response.json();
    if (!response.ok) throw new Error((value as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`);
    return lab12SnapshotSchema.parse(value);
  }
  async function action(task: () => Promise<Lab12Snapshot>, fresh = false) {
    if (busy) return; setBusy(true);
    try { const value = await task(); if (mounted.current) { if (fresh) observe(value); else accept(value); } }
    catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'Request failed. No automatic retry.'); }
    finally { if (mounted.current) setBusy(false); }
  }
  const open = snapshot && !['closed', 'cleanup-pending', 'stopping'].includes(snapshot.state);
  const retained = snapshot && snapshot.state !== 'closed';
  const idle = open && snapshot.state === 'idle' && snapshot.queueDepth === 0;
  const message = (): Lab12Message => ({ commandId: crypto.randomUUID(), text, scenario: snapshot?.mode === 'live' ? 'normal' : scenario,
    ...(image ? { image: { media_type: 'image/png', data: lab12TinyImage } } : {}) });
  return <section aria-labelledby="c12-heading">
    <h2 id="c12-heading">Admit messages, then inspect their turns</h2>
    <p>The host accepts a bounded queue. Provider acceptance returns a user event ID; completion requires correlated lifecycle evidence. Follow-ups wait until the previous turn finishes.</p>
    <div className="lab-controls"><button disabled={busy || Boolean(retained)} onClick={() => void action(() => post('session', { mode: 'scripted' }), true)}>Create offline session</button>
      <LiveActionButton busy={busy || snapshot?.state === 'running'} available={ready} checkAvailability={checkSetup} onRun={() => void action(() => post('session', { mode: 'live' }), true)}
        {...(retained ? { blockedReason: snapshot.state === 'idle' ? 'An idle session is retained. Queue a message or close it before starting another.' : 'Close the retained queue and confirm cleanup before starting another.' } : {})}
        keyIsolated setup="Configure the base single-agent Managed agent, environment, isolated server API key and live opt-in. Run live creates one billed session; messages are admitted through the controls below." />
    </div>
    <p role="status" aria-live="polite">{redact(status)}</p>
    <label htmlFor="c12-text">Message</label><textarea id="c12-text" value={text} maxLength={1200} rows={3} onChange={e => setText(e.target.value)} />
    <p className="muted">{text.length} characters / 1000 allowed. Oversized input is rejected before admission.</p>
    <div className="lab-controls"><div className="lab-field"><label htmlFor="c12-scenario">Offline scenario</label><select id="c12-scenario" value={scenario} disabled={snapshot?.mode === 'live'} onChange={e => setScenario(e.target.value as Lab12Message['scenario'])}>{lab12Scenarios.map(s => <option key={s}>{s}</option>)}</select></div>
      <label><input type="checkbox" checked={image} onChange={e => setImage(e.target.checked)} /> Attach authored 1 × 1 PNG</label>
      <button disabled={busy || !open} onClick={() => void action(() => post('send', { runId: snapshot!.runId, ...message() }))}>Queue message</button>
      <button disabled={busy || !open} onClick={() => void action(() => post('script', { runId: snapshot!.runId, messages: [message(), { commandId: crypto.randomUUID(), text: 'Give one next step for the same fictional notebook.', scenario: 'normal' }] }))}>Queue two-message script</button>
    </div>
    <div className="lab-controls"><button disabled={busy || !snapshot || snapshot.state === 'closed'} onClick={() => void action(() => post('end', { runId: snapshot!.runId }))}>Close queue and clean up</button>
      <button disabled={busy || !snapshot} onClick={() => void action(async () => {
        const response = await fetch(`/api/c12/state?runId=${snapshot!.runId}`, { headers: { 'X-Lab-Owner': owner.current }, signal: lifetime.current.signal });
        if (!response.ok) throw new Error(`Inspect failed: HTTP ${response.status}`); return lab12SnapshotSchema.parse(await response.json());
      })}>Inspect run state</button></div>
    {snapshot && <div className="agent-response" aria-label="Queue evidence"><h3>Session and queue</h3>
      <p>Mode: <strong>{snapshot.mode === 'live' ? 'Live Managed Agents (billed)' : 'Offline authored fixture (no API calls)'}</strong>. Source: {snapshot.source}.</p>
      <p>Session: <code>{snapshot.sessionId}</code>. State: <strong>{snapshot.state}</strong>. Waiting commands: {snapshot.queueDepth}.</p>
      <p>Model: {snapshot.model}. Effort: {snapshot.effort}. Tools: {snapshot.tools}. MCP servers: {snapshot.mcpServers}.</p>
      <p>Interruption: {snapshot.interruption}. Cleanup: {snapshot.cleanup}. {snapshot.handoffFrom && <>Explicit handoff from <code>{snapshot.handoffFrom}</code>.</>}</p>
      {snapshot.commands.length === 0 && <p>No messages admitted yet.</p>}
      {snapshot.commands.map(command => <article className="report-turn" key={command.commandId} aria-label={`Command ${command.commandId}`}>
        <h4>{command.state}: {command.outcome}</h4><p>{command.text}{command.hasImage && ' [small PNG attached]'}</p>
        <p>Local command: <code>{command.commandId}</code>. Provider user event: <code>{command.userEventId ?? 'not accepted yet'}</code>.</p>
        <p>Admitted: {command.admittedAt}. Processing: {command.startedAt ?? 'waiting'}. Finished: {command.finishedAt ?? 'pending'}.</p>
        {command.output && <pre>{redact(command.output)}</pre>}{command.outputTruncated && <p>Agent text was truncated by the retained evidence limit.</p>}<p>Agent event IDs: {command.agentEventIds.join(', ') || 'none observed'}.</p>
      </article>)}
      <details><summary>Full queue and event evidence</summary><CodeBlock label="Queue evidence JSON" code={JSON.stringify(snapshot, null, 2)} lineNumbers={false} /></details>
    </div>}
    <details><summary>Idle configuration and explicit context handoff</summary>
      <p>Tools/MCP updates apply only to an idle session. This lab exposes no-tools or read-only tools and clears MCP servers. Model and effort use a new session.</p>
      <label htmlFor="c12-tools">Tool preset</label><select id="c12-tools" value={preset} onChange={e => setPreset(e.target.value as typeof preset)}><option value="none">No tools; clear MCP</option><option value="read-only">Read only; clear MCP</option></select>
      <button disabled={busy || !idle} onClick={() => void action(() => post('tools', { runId: snapshot!.runId, preset }))}>Apply idle tools/MCP update</button>
      <label htmlFor="c12-context">Explicit context</label><textarea id="c12-context" value={context} maxLength={1000} onChange={e => setContext(e.target.value)} />
      <button disabled={busy || !idle} onClick={() => void action(() => post('context', { runId: snapshot!.runId, text: context }))}>Append idle system context</button>
      <label htmlFor="c12-model">New session model</label><select id="c12-model" value={model} onChange={e => setModel(e.target.value as typeof model)}>{lab12Models.map(m => <option key={m}>{m}</option>)}</select>
      <label htmlFor="c12-effort">New session effort</label><select id="c12-effort" value={effort} onChange={e => setEffort(e.target.value as typeof effort)}>{['low', 'medium', 'high'].map(e => <option key={e}>{e}</option>)}</select>
      <p>This action closes the old queue, creates a new session and submits the explicit context above as its first user message. In live mode it starts billed work.</p>
      <button disabled={busy || !idle} onClick={() => void action(() => post('new-model-session', { runId: snapshot!.runId, model, effort, context }), true)}>Create new model session with context</button>
    </details>
  </section>;
}
