import { useRef, useState } from 'react';
import { lab49Scenarios, lab49SnapshotSchema } from '../../shared/lab49-deploy-ci-headless';
import type { Lab49Scenario } from '../../shared/lab49-deploy-ci-headless';

type Snapshot = ReturnType<typeof lab49SnapshotSchema.parse>;
const routeOf = (scenario: Lab49Scenario) => scenario === 'concurrency' || scenario === 'limit' ? 'limits' :
  scenario === 'pass' || scenario === 'validation' ? 'ci' : 'headless';
export default function Concept49DeployCiHeadless() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<Lab49Scenario>('pass');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Offline verdicts need no TTY or API key.');
  async function run() { setBusy(true); try {
    const response = await fetch(`/api/c49/${routeOf(scenario)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ mode: 'scripted', scenario }), signal: AbortSignal.timeout(7000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab49SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`${checked.outcome}; CI exit code ${checked.exitCode}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Headless fixture failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab49-heading"><h2 id="lab49-heading">Headless host and CI outcomes</h2>
    <p>Run local machine-readable verdict fixtures for a bounded Managed session host. The authored Dockerfile and GitHub workflow are samples; no deployment or live provider run starts here.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as Lab49Scenario)}>
      {lab49Scenarios.map(value => <option key={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Run headless fixture</button></div>
    {snapshot && <><h3>Machine verdict</h3><p>Outcome: <strong>{snapshot.outcome}</strong>. CI exit code: {snapshot.exitCode}.
      Session: <code>{snapshot.sessionId ?? 'none'}</code>. Provider calls: {snapshot.providerCalls}.</p>
      <p>Validated report: <code>{snapshot.report ? JSON.stringify(snapshot.report) : 'none'}</code>.</p>
      <p>Interruption: {snapshot.interruption}. Cleanup: {snapshot.cleanup}. Host limits: {JSON.stringify(snapshot.hostLimits)}.</p>
      <ul>{snapshot.evidence.map(item => <li key={item}>{item}</li>)}</ul></>}
    <p role="status" aria-label="Lab 49 status">{status}</p>
    <p>A local abort without confirmed idle and archive leaves remote cleanup pending. Only a completed, validated and archived live result should pass CI.</p>
  </section>;
}
