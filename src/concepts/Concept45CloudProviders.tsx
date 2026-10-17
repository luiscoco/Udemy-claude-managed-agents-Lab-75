import { useEffect, useRef, useState } from 'react';
import { lab45CapabilitySchema, lab45Targets, lab45SnapshotSchema } from '../../shared/lab45-cloud-providers';

type Capability = ReturnType<typeof lab45CapabilitySchema.parse>;
type Snapshot = ReturnType<typeof lab45SnapshotSchema.parse>;
const scenarios = ['ready', 'bad-auth', 'model-mismatch', 'missing-config', 'missing-feature'] as const;
export default function Concept45CloudProviders() {
  const owner = useRef(crypto.randomUUID()); const [target, setTarget] = useState<(typeof lab45Targets)[number]>('claude-api');
  const [scenario, setScenario] = useState<(typeof scenarios)[number]>('ready'); const [catalog, setCatalog] = useState<Capability[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Catalog facts and emulator requests never contact a cloud provider.');
  const [awsSetup, setAwsSetup] = useState<{ ready: boolean; enabled: boolean; missing: string[]; invalid: string[] }>();
  useEffect(() => { void fetch('/api/c45/facts', { headers: { 'X-Lab-Owner': owner.current } }).then(response => response.json()).then(data => setAwsSetup(data.awsSetup)).catch(() => {}); }, []);
  async function post(route: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c45/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(route === 'aws/check' ? 15000 : 7000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    if (route === 'catalog') { setCatalog(data.targets.map((item: unknown) => lab45CapabilitySchema.parse(item))); setStatus(`${data.targets.length} provider paths cataloged from official documentation.`); }
    else if (route === 'same') setStatus(data.distinction);
    else if (route === 'aws/check') setStatus(`AWS agent and environment accessible: ${data.resourcesAccessible}. No session created; model execution remains unverified.`);
    else { const checked = lab45SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`${checked.status}: ${checked.reason}`); }
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Provider request failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab45-heading"><h2 id="lab45-heading">Provider availability and configuration</h2>
    <p>Managed-session support differs from Messages API access. The direct Claude API is the installed baseline; Claude Platform on AWS is documented separately, while Bedrock, Vertex and Foundry Messages clients do not establish Managed support.</p>
    <div className="lab-controls"><button disabled={busy} onClick={() => void post('catalog', {})}>Load capability catalog</button>
      <label>Target<select value={target} onChange={event => setTarget(event.target.value as typeof target)}>
        {lab45Targets.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post('same', { target })}>Compare APIs</button></div>
    {catalog.length > 0 && <div className="lab-results"><h3>Documented provider catalog</h3><ul>{catalog.map(item => <li key={item.id}>
      <strong>{item.label}</strong>: Messages {String(item.messagesApi)}; Managed documented {String(item.managedDocumented)}; installed Managed client verified {String(item.installedManagedClientVerified)}; route enabled {String(item.managedRouteEnabled)}.
      <p>Auth: {item.authShape}. Prerequisites: {item.prerequisites.join(', ')}.</p><p>{item.limitations.join(' ')}</p>
      <a href={item.documentation} target="_blank" rel="noreferrer">Official documentation</a></li>)}</ul></div>}
    <div className="lab-controls"><label>Offline mismatch<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post('failures', { mode: 'scripted', target, scenario })}>Run loopback preflight</button></div>
    {snapshot && <><p>Target: {snapshot.target}; status: {snapshot.status}; emulator HTTP {snapshot.httpStatus}. {snapshot.reason}</p>
      <p>Endpoint: {snapshot.endpoint}. Credential: {snapshot.syntheticCredential}. Model: {snapshot.model}. Managed route enabled: {String(snapshot.managedRouteEnabled)}.</p>
      <p>Session created: {String(snapshot.sessionCreated)}. Provider calls: {snapshot.providerCalls}.</p>
      <h3>Host evidence</h3><ul>{snapshot.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
    <p role="status" aria-label="Lab 45 status">{status}</p>
    <p>Emulated wire shapes stay labeled offline. No cloud account, deployment or billable test starts automatically.</p>
    <h3>AWS resource setup</h3><p>The official AWS client is installed. The explicit check reads two existing resources and creates no model session.</p>
    {awsSetup && <p>{awsSetup.ready ? 'Configured; account access has not been verified by this inspection.' : `Setup required. ${!awsSetup.enabled ? 'Set LAB45_AWS_LIVE_ENABLED=1. ' : ''}Missing: ${awsSetup.missing.join(', ') || 'none'}. Invalid: ${awsSetup.invalid.join(', ') || 'none'}.`}</p>}
    <button disabled={busy || !awsSetup?.ready} onClick={() => void post('aws/check', {})}>Check AWS resources (read-only)</button>
  </section>;
}
