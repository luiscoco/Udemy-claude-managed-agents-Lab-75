import { useEffect, useRef, useState } from 'react';
import { lab17Actions, lab17ReportSchema, lab17RestoreSchema, lab17SendSchema, lab17SessionSchema } from '../../shared/lab17-checkpointing';
import type { Lab17Report, Lab17Send } from '../../shared/lab17-checkpointing';
import { LiveActionButton } from '../components/LiveActionButton';
import { streamPost } from '../lib/sse';

export default function Concept17Checkpointing() {
  const owner = useRef(crypto.randomUUID()), current = useRef<string | null>(null), controller = useRef<AbortController | null>(null), mounted = useRef(true);
  const [report, setReport] = useState<Lab17Report>(), [status, setStatus] = useState('Ready. Fixture files live only in this server workspace.');
  const [busy, setBusy] = useState(false), [liveReady, setLiveReady] = useState(false);
  const [action, setAction] = useState<Lab17Send['action']>('edit-notes'), [text, setText] = useState('reviewed');
  const [prompt, setPrompt] = useState('Remember that I am editing the fictional Aurora Finch notebook.');
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const headers = { 'X-Lab-Owner': owner.current, 'Content-Type': 'application/json' };
  async function setup() { const response = await fetch('/api/managed/setup', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Cannot check live setup.'); const data = await response.json(); if (mounted.current) setLiveReady(data.liveReady === true); return data.liveReady === true; }
  function accept(data: Lab17Report) { current.current = data.runId; if (mounted.current) { setReport(data); setStatus(data.message); } }
  useEffect(() => { mounted.current = true; void setup().catch(() => { if (mounted.current) setStatus('Start the backend to check setup.'); });
    return () => { mounted.current = false; controller.current?.abort(); if (current.current) void fetch('/api/c17/end', { method: 'POST', headers, body: JSON.stringify({ runId: current.current }), keepalive: true }); };
  }, []);
  async function post(operation: 'session' | 'snapshot' | 'restore' | 'end', body: unknown) {
    const response = await fetch(`/api/c17/${operation}`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) { const data = await response.json(); throw new Error(data.error?.message ?? `HTTP ${response.status}`); }
    const data = lab17ReportSchema.parse(await response.json()); accept(data); return data;
  }
  async function close() { if (!current.current) return;
    const data = await post('end', { runId: current.current }); if (data.state !== 'closed') throw new Error(data.message); current.current = null; }
  async function start(mode: 'scripted' | 'live') {
    if (busy) return; setBusy(true);
    try { await close(); if (mode === 'live' && !await setup()) throw new Error('Live setup is unavailable.');
      const data = await post('session', lab17SessionSchema.parse({ mode, deadlineSeconds: 30, budgetCents: 50 }));
      setSelectedSnapshot('');
      if (mode === 'live') await sendAction('read-notes', data, 'Read the project name from the conversation request. Do not claim host file effects.', '');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not start the session.'); }
    finally { setBusy(false); }
  }
  async function sendAction(nextAction = action, source = report, nextPrompt = prompt, nextText = text) {
    if (!source || controller.current) return;
    const abort = new AbortController(); controller.current = abort; setBusy(true);
    try {
      const body = lab17SendSchema.parse({ runId: source.runId, action: nextAction, prompt: nextPrompt, text: nextText, expectedVersion: source.version });
      setStatus(nextAction === 'inspect-remote-outputs' ? 'Inspecting session-scoped outputs separately…' : 'Sending one bounded turn, then applying the selected host handler…');
      const result = await streamPost('/api/c17/send', body, { headers, signal: abort.signal, idleMs: 30000, deadlineMs: 160000,
        resultSchema: lab17ReportSchema, onEvent: (type, data) => { if (type === 'progress') {
          const parsed = lab17ReportSchema.safeParse(data); if (parsed.success) accept(parsed.data);
        } } });
      if (result.kind === 'success') accept(result.result);
      else { setStatus('Cancelled locally. Closing and reconciling the session…'); await close(); }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Host action failed.'); }
    finally { controller.current = null; setBusy(false); }
  }
  async function takeSnapshot() { if (!report || busy) return; setBusy(true);
    try { const data = await post('snapshot', { runId: report.runId }); setSelectedSnapshot(data.snapshots.at(-1)?.snapshotId ?? ''); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Snapshot failed.'); } finally { setBusy(false); } }
  async function restore(dryRun: boolean) { if (!report || !selectedSnapshot || busy) return; setBusy(true);
    try { await post('restore', lab17RestoreSchema.parse({ runId: report.runId, snapshotId: selectedSnapshot,
      expectedVersion: report.version, dryRun, ...(!dryRun ? { planId: report.plan?.planId } : {}) })); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Restore rejected.'); } finally { setBusy(false); } }
  async function oneShot() { if (busy) return; setBusy(true); const abort = new AbortController(); controller.current = abort;
    try { await close(); const result = await streamPost('/api/c17/oneshot', { session: { mode: 'scripted', deadlineSeconds: 30, budgetCents: 50 },
      action: 'read-notes', prompt, text: '' }, { headers, signal: abort.signal, idleMs: 30000, deadlineMs: 160000, resultSchema: lab17ReportSchema });
      if (result.kind === 'success') { accept(result.result); current.current = null; } else setStatus('One-shot run cancelled; inspect server cleanup.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'One-shot run failed.'); }
    finally { controller.current = null; setBusy(false); } }
  const idle = report?.state === 'idle' || report?.state === 'prepared';
  return <section aria-labelledby="lab17-heading"><h2 id="lab17-heading">Restore host files, keep the conversation</h2>
    <p>Take a host snapshot, change tracked files, then inspect the dry-run restore plan. Confirming it changes only the two tracked fixture paths.</p>
    <div className="lab-controls"><button disabled={busy} onClick={() => void start('scripted')}>Start offline fixture session</button>
      <button disabled={busy || !idle} onClick={() => void takeSnapshot()}>Take host snapshot</button>
      {busy && <button onClick={() => controller.current?.abort()}>Cancel active turn</button>}
      <button disabled={busy || !report || report.state === 'closed'} onClick={() => void close().catch(error => setStatus(String(error)))}>Close session</button>
      <button disabled={busy} onClick={() => void oneShot()}>Run one-shot offline</button></div>
    <LiveActionButton busy={busy} available={liveReady} checkAvailability={setup} onRun={() => void start('live')} keyIsolated
      setup="Configure a single-agent base, isolated server API key, environment and MANAGED_LIVE_ENABLED=true. Run live starts one billed text-only session. Host file handlers run only on the separate allowlisted fixture tree." />
    <fieldset disabled={busy || !idle}><legend>Bounded host handler and conversation turn</legend>
      <label>Host action<select aria-label="Host action" value={action} onChange={event => setAction(event.target.value as typeof action)}>{lab17Actions.filter(value => value !== 'inspect-remote-outputs').map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Host text or new status<input maxLength={200} value={text} onChange={event => setText(event.target.value)} /></label>
      <label>User message<textarea className="lab-prompt" rows={3} maxLength={600} value={prompt} onChange={event => setPrompt(event.target.value)} /></label>
      <button disabled={!idle} onClick={() => void sendAction()}>Send turn and run host handler</button>
      <button disabled={report?.state !== 'idle'} onClick={() => void sendAction('inspect-remote-outputs')}>Inspect remote outputs separately</button>
    </fieldset>
    <fieldset disabled={busy || !idle}><legend>Two-phase tracked-file restoration</legend>
      <label>Snapshot<select aria-label="Snapshot" value={selectedSnapshot} onChange={event => setSelectedSnapshot(event.target.value)}><option value="">Choose a host snapshot</option>{report?.snapshots.map(item => <option key={item.snapshotId} value={item.snapshotId}>{item.snapshotId.slice(0, 8)} · version {item.version}</option>)}</select></label>
      <button disabled={!selectedSnapshot} onClick={() => void restore(true)}>Dry-run restore</button>
      <button disabled={!report?.plan || report.plan.snapshotId !== selectedSnapshot} onClick={() => void restore(false)}>Confirm restore</button>
    </fieldset>
    <p role="status" aria-label="Snapshot experiment status">{status}</p>
    {report && <div aria-label="Snapshot evidence"><h3>Session and host state</h3><p>Source: {report.source}. State: {report.state}. Host version: {report.version}. Session: <code>{report.sessionId ?? 'not created'}</code>. Built-in filesystem tools: disabled. Host handler calls: {report.hostHandlerCalls}. Cleanup: {report.cleanup}.</p>
      <div className="provenance-grid">{report.files.map(file => <article className="provenance-card" aria-label={file.path} key={file.path}><h4>{file.path} {file.tracked ? '(tracked)' : '(untracked)'}</h4>
        <p>Exists: {String(file.exists)}. SHA-256: <code>{file.hash ?? 'absent'}</code></p><pre>{file.content ?? '(absent)'}</pre></article>)}</div>
      <h3>Host snapshots</h3>{report.snapshots.length ? <ul>{report.snapshots.map(item => <li key={item.snapshotId}><code>{item.snapshotId}</code> at host version {item.version}; session {item.sessionId ?? 'not created'}; {item.relatedHostEventIds.length} host event ID(s), {item.relatedManagedEventIds.length} observed stream event ID(s) ({report.source}).</li>)}</ul> : <p>No snapshot yet.</p>}
      {report.plan && <article aria-label="Restore plan"><h3>Dry-run plan</h3><p>Plan <code>{report.plan.planId}</code>; expected version {report.plan.expectedVersion}. Untracked file and remote session remain untouched.</p>
        {report.plan.changes.length ? <ul>{report.plan.changes.map(change => <li key={change.path}>{change.operation} {change.path}: {change.fromHash ?? 'absent'} → {change.toHash ?? 'absent'}</li>)}</ul> : <p>No tracked-file changes needed.</p>}</article>}
      <h3>Conversation history</h3>{report.turns.length ? <ol>{report.turns.map(turn => <li key={turn.hostEventId}>Host event <code>{turn.hostEventId}</code>; action {turn.action}; session {turn.sessionId ?? 'unknown'}; outcome {turn.outcome?.kind ?? 'unknown'}. Prompt: {turn.prompt}. Response: {turn.response || '(no public text)'}</li>)}</ol> : <p>No completed turns yet.</p>}
      <h3>Remote outputs</h3><p>{report.remoteOutputs.status}: {report.remoteOutputs.note}</p><ul>{report.remoteOutputs.files.map(file => <li key={file.name}>{file.name} · {file.sizeBytes} bytes · SHA-256 {file.hash}</li>)}</ul>
    </div>}
  </section>;
}
