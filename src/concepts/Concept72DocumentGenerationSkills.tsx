import { useRef, useState } from 'react';
import { scenarioSchema, type DocumentScenario } from '../../shared/lab72-document-generation-skills';
type Snapshot = { id: string; scenario: string; state: string; error?: string; fileId?: string; hashes: Record<string, string>; events: { name: string; custom_tool_use_id: string }[];
  verification?: { valid: boolean; packageValid: boolean; incidentApplicable: boolean; incidentValid: boolean; errors: string[]; sha256: string; parts: number; text: string } };
export default function Concept72DocumentGenerationSkills() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<DocumentScenario>('incident'); const [session, setSession] = useState<Snapshot>();
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Ready. Build an offline document from a closed JSON specification.');
  const [command, setCommand] = useState('build_document && arbitrary-command');
  async function api(path: string, body?: unknown) { const response = await fetch(`/api/c72/${path}`, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? 'Document request failed.'); return data; }
  async function run() { setBusy(true); try { const created = await api('sessions', { scenario }) as Snapshot; setSession(created);
    const result = await api(`sessions/${created.id}/build`, {}) as Snapshot; setSession(result); setStatus(`Document ${result.state}.${result.error ? ` ${result.error}` : ' Package and skill integrity checked.'}`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Document build failed.'); } finally { setBusy(false); } }
  async function download() { if (!session?.fileId) return; try { const response = await fetch(`/api/c72/sessions/${session.id}/files/${session.fileId}`, { headers: { 'X-Lab-Owner': owner.current } });
    if (!response.ok) throw new Error('Download integrity check failed.'); const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = 'verified-report.docx'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Download failed.'); } }
  return <section aria-labelledby="lab72-heading"><h2 id="lab72-heading">Document generation with Skills</h2>
    <p>A scripted agent reads progressive references and writes JSON. A deterministic builder owns Word layout. Independent host checks decide whether the document can be downloaded.</p>
    <div className="lab-controls"><label>Scenario <select aria-label="Scenario" value={scenario} onChange={event => setScenario(event.target.value as DocumentScenario)}>{scenarioSchema.options.map(value => <option key={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Build document</button><button disabled={!session?.fileId || busy} onClick={() => void download()}>Download verified DOCX</button></div>
    <p role="status" aria-label="Lab 72 status">{status}</p>
    {session && <><p>Source: offline-host-docgen. Session {session.id}. State: {session.state}.</p>
      <label>Command policy probe <input value={command} maxLength={500} onChange={event => setCommand(event.target.value)} /></label>
      <button disabled={busy} onClick={() => void api(`sessions/${session.id}/policy`, { command }).then(result => setStatus(`Policy ${result.allowed ? 'accepted typed name' : 'rejected command'}. Executed: ${result.executed}. ${result.reason}`)).catch(() => setStatus('Policy request rejected.'))}>Check command policy</button>
      <h3>Observed tool results</h3><ol>{session.events.map(event => <li key={event.custom_tool_use_id}>{event.name} — {event.custom_tool_use_id}</li>)}</ol>
      {session.verification && <article><h3>Independent document checks</h3><p>Package: {session.verification.packageValid ? 'verified' : 'rejected'}. Incident contract: {session.verification.incidentApplicable ? session.verification.incidentValid ? 'verified' : 'rejected' : 'not applicable'}.</p>
        <p>Parts: {session.verification.parts}. SHA256: <code style={{ overflowWrap: 'anywhere' }}>{session.verification.sha256}</code>.</p><ul>{session.verification.errors.map(error => <li key={error}>{error}</li>)}</ul>
        <details><summary>Extracted document text</summary><p>{session.verification.text}</p></details></article>}
      <details><summary>Immutable skill manifest</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(session.hashes, null, 2)}</pre></details></>}
    <p>Offline fixtures never upload skills or contact Anthropic. Package checks do not establish Word pagination; open the downloaded DOCX for visual review. Notes are untrusted and cannot authorize tools.</p>
  </section>;
}
