import { useEffect, useRef, useState } from 'react';
import { lab29Names, lab29ResultSchema } from '../../shared/lab29-images-files';
import type { Lab29Result } from '../../shared/lab29-images-files';

type Inventory = { files: { name: string; mime: string; bytes: number; sha256: string }[] };
export default function Concept29ImagesFiles() {
  const owner = useRef(crypto.randomUUID()); const [inventory, setInventory] = useState<Inventory>();
  const [name, setName] = useState<(typeof lab29Names)[number]>('aurora-finch.png'); const [route, setRoute] = useState<'inline' | 'upload' | 'disk'>('inline');
  const [payload, setPayload] = useState<'fixture' | 'malformed' | 'oversized'>('fixture');
  const [question, setQuestion] = useState('What does this fictional observation show?');
  const [result, setResult] = useState<Lab29Result>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Fixture inventory does not upload anything.');
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  useEffect(() => { void fetch('/api/c29/files', { headers, signal: AbortSignal.timeout(5000) }).then(async response => {
    if (!response.ok) throw new Error(); setInventory(await response.json()); }).catch(() => setStatus('Start the backend to inspect the fixtures.')); }, []);
  async function run() { if (busy) return; setBusy(true); try {
    const selected = payload === 'oversized' ? 'observation.txt' : name;
    const data = payload === 'fixture' ? undefined : payload === 'malformed' ? '%%%not-base64' : 'QUFB'.repeat(3000);
    const response = await fetch(`/api/c29/${route}`, { method: 'POST', headers,
      body: JSON.stringify({ mode: 'scripted', name: selected, question, ...(data ? { data } : {}) }), signal: AbortSignal.timeout(5000) });
    const body = await response.json(); if (!response.ok) throw new Error(body.error?.message ?? `HTTP ${response.status}`);
    const checked = lab29ResultSchema.parse(body); setResult(checked); setStatus(`${route}: ${checked.bytes} checked bytes; ${checked.providerCalls} provider calls.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'File experiment failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab29-heading"><h2 id="lab29-heading">Images, documents and mounted files</h2>
    <p>Compare a pinned SDK inline content block with an explicit file resource and a separate downloaded output. Local host paths do not become remote sandbox paths automatically.</p>
    <h3>Authored fixtures</h3><ul>{inventory?.files.map(file => <li key={file.name}><a href={`/api/c29/file/${file.name}`} target="_blank" rel="noreferrer">{file.name}</a> · {file.mime} · {file.bytes} bytes · SHA-256 <code>{file.sha256.slice(0, 12)}</code></li>)}</ul>
    <div className="lab-controls"><label>Selected fixture<select value={name} onChange={event => setName(event.target.value as typeof name)}>
      {lab29Names.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Delivery route<select value={route} onChange={event => { setRoute(event.target.value as typeof route); setPayload('fixture'); }}>
        <option value="inline">Inline block</option><option value="upload">File upload and mount preview</option><option value="disk">Downloaded output preview</option></select></label>
      <label>Payload scenario<select value={payload} disabled={route !== 'inline'} onChange={event => setPayload(event.target.value as typeof payload)}>
        <option value="fixture">Checked fixture</option><option value="malformed">Malformed base64</option><option value="oversized">Oversized text payload</option></select></label>
      <label>Question<input value={question} maxLength={240} onChange={event => setQuestion(event.target.value)} /></label>
      <button disabled={busy} onClick={() => void run()}>Run offline comparison</button></div>
    <p role="status" aria-label="Lab 29 status">{status}</p>
    {result && <section aria-label="File evidence"><h3>Redacted request and evidence</h3>
      <p>{result.name}: {result.mime}; {result.bytes} bytes; SHA-256 <code>{result.sha256}</code>.</p>
      <pre>{JSON.stringify(result.sentBlocks, null, 2)}</pre>
      <p>Uploaded file ID: {result.uploadedFileId ?? 'none'}. Mount path: {result.mountPath ?? 'none'}.</p>
      <p>Agent text: {result.agentText}</p><p>Downloaded output: {result.downloadedOutput ?? 'none'}</p>
      <p>Provider calls: {result.providerCalls}. Usage: {result.usage === null ? 'not reported by authored fixture' : result.usage}. {result.note}</p></section>}
    <p>Live upload is unavailable until a separate explicit Files API adapter is configured. Source inspection never uploads a file.</p>
  </section>;
}
