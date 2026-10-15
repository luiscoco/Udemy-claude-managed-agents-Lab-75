import { useEffect, useRef, useState } from 'react';
import { lab16AccessResultSchema, lab16LayersSchema, lab16ManifestSchema, lab16RequestSchema, lab16ResolutionSchema, lab16RunSchema, lab16Scenarios } from '../../shared/lab16-settings-env';
import type { Lab16Input, Lab16Manifest, Lab16Resolution, Lab16Run } from '../../shared/lab16-settings-env';
import { LiveActionButton } from '../components/LiveActionButton';
import { streamPost } from '../lib/sse';

export default function Concept16SettingsEnv() {
  const owner = useRef(crypto.randomUUID()), running = useRef<AbortController | null>(null), mounted = useRef(true);
  const [manifest, setManifest] = useState<Lab16Manifest>();
  const [scenario, setScenario] = useState<Lab16Input['scenario']>('winning-host-layer');
  const [userRegion, setUserRegion] = useState<Lab16Input['userRegion']>('south');
  const [sessionRegion, setSessionRegion] = useState<Lab16Input['sessionRegion']>(null);
  const [prompt, setPrompt] = useState('Explain the configured observation region and distinguish the approved file mount from a confirmed read.');
  const [path, setPath] = useState<'/mnt/session/uploads/field-guide.txt' | '/etc/passwd' | '../field-guide.txt'>('/mnt/session/uploads/field-guide.txt');
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Ready. Offline exercises use authored settings only.');
  const [resolution, setResolution] = useState<Lab16Resolution>(), [layers, setLayers] = useState<Lab16Resolution[]>([]);
  const [access, setAccess] = useState<string>(), [report, setReport] = useState<Lab16Run>();
  const headers = { 'X-Lab-Owner': owner.current, 'Content-Type': 'application/json' };
  async function readManifest() {
    const response = await fetch('/api/c16/files', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Cannot read the local allowlist.');
    const data = lab16ManifestSchema.parse(await response.json()); if (mounted.current) setManifest(data);
    return data.liveReady;
  }
  useEffect(() => { mounted.current = true; void readManifest().catch(() => { if (mounted.current) setStatus('Start the backend to inspect the local manifest.'); });
    return () => { mounted.current = false; running.current?.abort(); };
  }, []);
  function request(mode: Lab16Input['mode']) { return lab16RequestSchema.parse({ mode, scenario: mode === 'live' ? 'winning-host-layer' : scenario,
    userRegion, sessionRegion, prompt, deadlineSeconds: 30, budgetCents: 50 }); }
  async function postJson(route: string, body: unknown) {
    const response = await fetch(`/api/c16/${route}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`The ${route} experiment was rejected (HTTP ${response.status}).`);
    return response.json();
  }
  async function resolve() { try { setResolution(lab16ResolutionSchema.parse(await postJson('resolve', request('scripted')))); setStatus('Synthetic host and remote provenance resolved.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Resolver failed.'); } }
  async function compare() { try { const data = lab16LayersSchema.parse(await postJson('layers-run', request('scripted'))); setLayers(data.comparisons); setStatus(data.note); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Layer comparison failed.'); } }
  async function inspectPath() { try { const data = lab16AccessResultSchema.parse(await postJson('access-run', { scenario, path })); setAccess(`${data.allowed ? 'Allowed' : 'Denied'}: ${data.reason} ${data.effect}.`); setStatus('Host path-policy decision recorded.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Path policy failed.'); } }
  async function run(mode: Lab16Input['mode']) {
    if (running.current) return; let input: Lab16Input;
    try { input = request(mode); } catch { setStatus('Check the bounded prompt, region and session settings.'); return; }
    const controller = new AbortController(); running.current = controller; setBusy(true); setReport(undefined);
    try {
      if (mode === 'live' && !await readManifest()) throw new Error('The server setup or approved fixture file ID is missing.');
      setStatus(mode === 'live' ? 'Starting one billed Managed session with the approved file mount…' : 'Running an authored offline session…');
      const result = await streamPost('/api/c16/env-run', input, { headers, signal: controller.signal, idleMs: 30000,
        deadlineMs: 160000, resultSchema: lab16RunSchema, onEvent: (type, data) => {
          if (type === 'progress' && data && typeof data === 'object' && 'kind' in data && data.kind === 'session' && mounted.current)
            setStatus('Session created. Waiting for the turn and cleanup evidence.');
        } });
      if (!mounted.current) return;
      if (result.kind === 'success') { setReport(result.result); setResolution(result.result.resolution); setStatus(result.result.message); }
      else setStatus('Cancelled locally. Remote interruption and cleanup are reported only if confirmed.');
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'Experiment failed.'); }
    finally { running.current = null; if (mounted.current) setBusy(false); }
  }
  return <section aria-labelledby="lab16-heading">
    <h2 id="lab16-heading">Trace settings to their source</h2>
    <p>Change a synthetic host layer and inspect which value wins. Then compare it with what the Managed sandbox actually receives through an explicit file resource.</p>
    <fieldset disabled={busy}><legend>Application-defined host layers</legend>
      <label>User region override<select aria-label="User region override" value={userRegion ?? ''} onChange={event => setUserRegion(event.target.value ? event.target.value as 'north' | 'south' : null)}><option value="">Absent</option><option value="north">north</option><option value="south">south</option></select></label>
      <label>Session region override<select aria-label="Session region override" value={sessionRegion ?? ''} onChange={event => setSessionRegion(event.target.value ? event.target.value as 'north' | 'south' : null)}><option value="">Absent</option><option value="north">north</option><option value="south">south</option></select></label>
      <label>Offline scenario<select aria-label="Offline scenario" value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>{lab16Scenarios.map(value => <option key={value} value={value}>{value.replaceAll('-', ' ')}</option>)}</select></label>
      <label>User question<textarea className="lab-prompt" rows={3} maxLength={600} value={prompt} onChange={event => setPrompt(event.target.value)} /></label>
    </fieldset>
    <div className="lab-controls"><button disabled={busy} onClick={() => void resolve()}>Resolve host settings</button>
      <button disabled={busy} onClick={() => void compare()}>Compare three layers</button>
      <button disabled={busy} onClick={() => void run('scripted')}>Run offline environment exercise</button>
      {busy && <button onClick={() => running.current?.abort()}>Cancel experiment</button>}</div>
    <LiveActionButton busy={busy} available={Boolean(manifest?.liveReady)} checkAvailability={readManifest} onRun={() => void run('live')} keyIsolated
      setup="Configure the isolated server API key, base agent, cloud environment and MANAGED_LIVE_ENABLED=true. Upload a reviewed fictional file separately, then set server-only CLAUDE_MANAGED_LAB16_FILE_ID to its file ID. Check again. Run live creates one billed session with only that approved mount." />
    <p role="status" aria-label="Configuration experiment status">{status}</p>
    <h3>Approved manifest and readiness</h3>
    {manifest && <><p>Credential name: {manifest.credentialNames.join(', ')}. Server credential: {manifest.credentialReady ? 'configured (redacted)' : 'missing'}. Environment ID: {manifest.environmentConfigured ? 'configured (redacted)' : 'missing'}. Approved file ID: {manifest.remoteFixtureConfigured ? 'configured (redacted)' : 'missing'}.</p>
      <p>Authored cloud example: limited networking; no allowed hosts, MCP egress or package managers; no packages. This is an example definition, not a provider read.</p>
      <ul>{manifest.files.map(file => <li key={file.name}>{file.name} → <code>{file.mountPath}</code> ({file.approved ? 'approved' : 'denied'})</li>)}</ul>
      <details><summary>Unsupported Agent SDK configuration fields</summary><p>{manifest.unsupported.join(', ')} are not Managed session options.</p></details></>}
    <h3>Host and remote provenance</h3>
    {resolution ? <><p>{resolution.precedence}. Credential readiness: {resolution.credentialReady ? 'fictionally configured' : 'fictionally missing'}. Remote mount: {resolution.remoteMountReady ? 'fixture present' : 'fixture absent'}.</p>
      <div className="provenance-grid">{resolution.rows.map(row => <article className="provenance-card" aria-label={row.name} key={row.name}>
        <h4>{row.name}</h4><p><strong>Host:</strong> {row.hostValue} <span>({row.hostSource})</span></p>
        <p><strong>Remote:</strong> {row.remoteValue} <span>({row.remoteSource})</span></p><p>{row.note}</p>
      </article>)}</div>
      <ul>{resolution.evidence.map(line => <li key={line}>{line}</li>)}</ul></> : <p>Resolve settings to compare host and sandbox context.</p>}
    {layers.length > 0 && <><h3>Layer comparison</h3><ol>{layers.map((item, index) => <li key={index}>Case {index + 1}: {item.rows[0]?.hostValue} from {item.rows[0]?.hostSource}.</li>)}</ol></>}
    <h3>Path boundary</h3><label>Candidate path<select aria-label="Candidate path" value={path} onChange={event => setPath(event.target.value as typeof path)}><option value="/mnt/session/uploads/field-guide.txt">Approved fixture mount</option><option value="/etc/passwd">Outside mount</option><option value="../field-guide.txt">Traversal</option></select></label>
    <button disabled={busy} onClick={() => void inspectPath()}>Inspect host path policy</button>{access && <p aria-label="Path policy result">{access}</p>}
    {report && <><h3>Session and mount evidence</h3><p>Source: {report.source}. Requested mount: {report.requestedMount ?? 'none'}. Observed mount: {report.observedMount}. Resolved environment: {report.resolvedEnvironment ? `${report.resolvedEnvironment.kind}, ${report.resolvedEnvironment.networking} network, ${report.resolvedEnvironment.packageCount} package entries` : 'unavailable'}.</p>
      <p>Session: {report.session?.sessionId ?? 'not returned'}. Outcome: {report.session?.outcome.kind ?? 'not started'}. Cleanup: {report.session?.cleanup ?? 'not needed'}.</p>
      {report.session?.messages?.length ? <div className="table-wrap"><table><thead><tr><th>Agent response evidence</th></tr></thead><tbody>{report.session.messages.map(message => <tr key={message.eventId}><td>{message.text}</td></tr>)}</tbody></table></div> : null}
      <p>{report.message}</p></>}
  </section>;
}
