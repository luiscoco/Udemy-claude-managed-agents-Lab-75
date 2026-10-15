import { useRef, useState } from 'react';
import { lab39Scenarios, lab39SnapshotSchema } from '../../shared/lab39-project-config-root';

type Snapshot = ReturnType<typeof lab39SnapshotSchema.parse>;
export default function Concept39ProjectConfigRoot() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab39Scenarios)[number]>('conflict');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [path, setPath] = useState('notes.txt');
  const [text, setText] = useState('Fictional observation: four Aurora Finches.'); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. A host manifest selects authority; checkout files remain data.');
  async function post(route: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c39/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    if (route === 'dry') setStatus(`Host-only dry check: manifest SHA-256 ${data.manifestHash}; provider calls ${data.providerCalls}.`);
    else { const checked = lab39SnapshotSchema.parse(data); setSnapshot(checked); setStatus(checked.lastOperation ?
      `${checked.lastOperation.decision}: ${checked.lastOperation.reason}` : `Manifest ${checked.status}; checkout ${checked.worktreeKind}.`); }
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Configuration request failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab39-heading"><h2 id="lab39-heading">Trusted configuration and untrusted checkouts</h2>
    <p>The host pins an immutable manifest and SHA-256 hash. The branch checkout supplies only source data through checked tools. Its CLAUDE.md cannot replace host instructions or run hooks.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab39Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post('dry', {})}>Dry check</button>
      <button disabled={busy} onClick={() => void post('start', { mode: 'scripted', scenario })}>Create disposable worktree</button></div>
    {snapshot && <><p>Run <code>{snapshot.runId}</code>. Configuration: <strong>{snapshot.status}</strong>. Source: {snapshot.worktreeKind}.</p>
      <p>Manifest hash: <code>{snapshot.expectedHash}</code>. Supplied hash: <code>{snapshot.suppliedHash ?? 'missing'}</code>.</p>
      <p>Trusted agent: {snapshot.trustedManifest.agent}. Tools: {snapshot.trustedManifest.tools.join(', ')}. MCP: {snapshot.trustedManifest.mcp.length}. Skills: {snapshot.trustedManifest.skills.length}.</p>
      <p>Host instruction: <code>{snapshot.effectiveSystemMarker ?? 'not applied'}</code>. Branch file says: <code>{snapshot.branchMarker}</code></p>
      <div className="lab-controls"><button disabled={busy} onClick={() => void post('where', { runId: snapshot.runId })}>Inspect provenance</button>
        <button disabled={busy} onClick={() => void post('takeover', { runId: snapshot.runId })}>Try branch takeover</button></div>
      <label>Checked relative path<input value={path} maxLength={180} onChange={event => setPath(event.target.value)} /></label>
      <label>Edit data text<input value={text} maxLength={300} onChange={event => setText(event.target.value)} /></label>
      <div className="lab-controls"><button disabled={busy || snapshot.status !== 'ready'} onClick={() => void post('try', { runId: snapshot.runId, operation: 'read', path })}>Checked read</button>
        <button disabled={busy || snapshot.status !== 'ready'} onClick={() => void post('try', { runId: snapshot.runId, operation: 'edit', path, text })}>Checked edit</button></div>
      {snapshot.lastOperation && <p>Tool result: {snapshot.lastOperation.operation} {snapshot.lastOperation.path}: {snapshot.lastOperation.decision}. {snapshot.lastOperation.content}</p>}
      <p>Branch hook runs: {snapshot.branchHookRuns}. Provider calls: {snapshot.providerCalls}.</p>
      <h3>Host evidence</h3><ul>{snapshot.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
    <p role="status" aria-label="Lab 39 status">{status}</p>
    <p>A remote mount needs a reviewed resource policy. No current working directory grants configuration authority.</p>
  </section>;
}
