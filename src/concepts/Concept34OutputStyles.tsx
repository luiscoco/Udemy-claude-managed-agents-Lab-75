import { useEffect, useRef, useState } from 'react';
import { lab34FixedQuestion, lab34SnapshotSchema, lab34StyleNames } from '../../shared/lab34-output-styles';
type Snapshot = ReturnType<typeof lab34SnapshotSchema.parse>;
export default function Concept34OutputStyles() {
  const owner = useRef(crypto.randomUUID()); const [style, setStyle] = useState<(typeof lab34StyleNames)[number]>('concise');
  const [runs, setRuns] = useState<Snapshot[]>([]); const [status, setStatus] = useState('Ready. All comparisons use authored offline answers.');
  const [busy, setBusy] = useState(false); const [catalog, setCatalog] = useState('Loading trusted styles…');
  useEffect(() => { void fetch('/api/c34/styles', { headers: { 'X-Lab-Owner': owner.current } })
    .then(async response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
    .then(data => setCatalog(`${data.styles.length} trusted host instruction files.`))
    .catch(() => setCatalog('Style catalog unavailable.')); }, []);
  async function compare(name: string) { setBusy(true); try {
    const response = await fetch('/api/c34/compare', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ mode: 'scripted', style: name }), signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab34SnapshotSchema.parse(data); setRuns(current => [...current.slice(-5), checked]);
    setStatus(`${checked.style}: fresh session ${checked.sessionId}; report ${checked.reportValid ? 'valid' : 'invalid'}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Style comparison failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab34-heading"><h2 id="lab34-heading">Output instruction variants</h2>
    <p>Trusted host files supply output preferences in the system override of each fresh session. The fixed question, empty tool capabilities and independent report schema stay the same.</p>
    <p>{catalog} Question: <strong>{lab34FixedQuestion}</strong></p>
    <div className="lab-controls"><label>Trusted style<select value={style} onChange={event => setStyle(event.target.value as typeof style)}>
      {lab34StyleNames.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
      <button disabled={busy} onClick={() => void compare(style)}>Compare in fresh session</button>
      <button disabled={busy} onClick={() => void compare('missing-style')}>Try unknown style</button>
      <button disabled={busy} onClick={() => void Promise.all(lab34StyleNames.map(name => compare(name)))}>Compare all four</button></div>
    {runs.map(run => <section key={run.runId} aria-label={`${run.style} comparison`}><h3>{run.style} · {run.status}</h3>
      <p>Run <code>{run.runId}</code>; fresh session <code>{run.sessionId}</code>. Instruction file: <code>{run.stylePath}</code>.
        SHA-256: <code>{run.styleHash}</code>.</p>
      <p>Answer: {run.answer}</p><p>Report schema: {run.reportValid ? 'valid' : run.reportErrors.join('; ')}. Capabilities: {run.capabilities.length}. Provider calls: {run.providerCalls}.</p>
      <details><summary>Exact composed system override</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{run.configuredSystem}</pre></details>
      <p>{run.note}</p></section>)}
    <p role="status" aria-label="Lab 34 status">{status}</p>
    <p>Unknown style names fail before session creation. Existing run snapshots do not change when another style version is selected.</p>
  </section>;
}
