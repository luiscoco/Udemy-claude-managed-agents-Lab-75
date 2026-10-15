import { useRef, useState } from 'react';
import { lab42SnapshotSchema } from '../../shared/lab42-web-tools';

type Snapshot = ReturnType<typeof lab42SnapshotSchema.parse>;
const scenarios = ['basics', 'fetch', 'injection', 'redirect', 'blocked-host', 'research'] as const;
const routeOf = { basics: 'basics', fetch: 'fetch-lab', injection: 'injection', redirect: 'guard', 'blocked-host': 'guard', research: 'research' } as const;
export default function Concept42WebTools() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof scenarios)[number]>('basics');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Offline research uses authored pages and no network.');
  async function run() { setBusy(true); try {
    const response = await fetch(`/api/c42/${routeOf[scenario]}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ mode: 'scripted', scenario }), signal: AbortSignal.timeout(7000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab42SnapshotSchema.parse(data); setSnapshot(checked);
    setStatus(`${checked.decision}; ${checked.requestCount}/${checked.maxRequests} bounded requests; citations verified: ${checked.citationsVerified}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Research request failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab42-heading"><h2 id="lab42-heading">Bounded web research and citations</h2>
    <p>Web search and fetch have documented Managed toolset fields. This exercise uses a narrow host custom fetch fixture with built-in unrestricted fetch and bash disabled. Every redirect is checked before the next request.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Run research fixture</button></div>
    {snapshot && <><p>Query: {snapshot.query}</p><p>Decision: {snapshot.decision}. {snapshot.reason} Requests: {snapshot.requestCount}/{snapshot.maxRequests}; redirect cap: {snapshot.maxRedirects}.</p>
      <h3>Inspected sources</h3>{snapshot.sources.length ? <ul>{snapshot.sources.map(source => <li key={source.evidenceId}>
        <strong>{source.evidenceId}</strong> — {source.title} ({source.kind}); inspected: {String(source.inspected)}; hostile text: {String(source.hostileInstruction)}.
        <p><code>{source.url}</code></p><blockquote>{source.text}</blockquote></li>)}</ul> : <p>No permitted source returned.</p>}
      <p>Redirect targets: {snapshot.redirects.length ? snapshot.redirects.join(', ') : 'none'}.</p>
      <h3>Answer and citation check</h3><p>{snapshot.answer}</p><p>Citation IDs: {snapshot.citations.join(', ') || 'none'}; verified against inspected records: {String(snapshot.citationsVerified)}.</p>
      <p>Built-in web fetch: {String(snapshot.tools.builtInWebFetch)}. Bash: {String(snapshot.tools.bash)}. Custom host fetch: {String(snapshot.tools.customFetch)}. Provider calls: {snapshot.providerCalls}.</p>
      <h3>Host evidence</h3><ul>{snapshot.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
    <p role="status" aria-label="Lab 42 status">{status}</p>
    <p>A search snippet is not a complete page. Fixture citations are authored evidence, not proof of a live web result.</p>
  </section>;
}
