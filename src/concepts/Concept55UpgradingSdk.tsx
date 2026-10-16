import { useRef, useState } from 'react';
import { lab55ResultSchema, lab55ScenarioSchema } from '../../shared/lab55-upgrading-sdk';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab55ScenarioSchema>;
type Result = z.infer<typeof lab55ResultSchema>;
const labels: Record<Scenario, string> = {
  'compatible-change': 'Compatible change', 'removed-type': 'Removed event type',
  'stream-change': 'Stream ordering change', 'policy-drift': 'Permission policy drift',
  'missing-usage': 'Missing usage evidence', 'quality-regression': 'Quality regression',
  'missing-evidence': 'Missing candidate evidence',
};
export default function Concept55UpgradingSdk() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<Scenario>('compatible-change');
  const [result, setResult] = useState<Result>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Baseline SDK 0.133.0 remains locked; candidates are authored fixtures.');
  async function post(path: 'run' | 'transition', body: object) { const response = await fetch(`/api/c55/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
    body: JSON.stringify(body), signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    return lab55ResultSchema.parse(data); }
  async function run() { setBusy(true); try { const checked = await post('run', { scenario, clientEligible: true });
    setResult(checked); setStatus(checked.eligible ? 'Server checks permit the authored canary rehearsal.' :
      'Server checks block advancement, regardless of the client eligible hint.');
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Rehearsal failed.'); } finally { setBusy(false); } }
  async function transition(action: 'canary' | 'promote' | 'rollback') { if (!result) return; setBusy(true);
    try { const checked = await post('transition', { runId: result.id, action, clientEligible: true });
      setResult(checked); setStatus(checked.note);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Transition blocked.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab55-heading"><h2 id="lab55-heading">Rehearse an SDK and API upgrade</h2>
    <p>Compare a locked installed SDK baseline with authored candidate manifests. The server evaluates API contracts, policy, usage, quality and evidence separately from npm and pinned resource versions.</p>
    <div className="lab-controls"><label>Candidate fixture<select value={scenario} disabled={busy}
      onChange={event => setScenario(lab55ScenarioSchema.parse(event.target.value))}>
      {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Analyze candidate</button>
      <button disabled={busy || !result?.eligible || result.state !== 'candidate'} onClick={() => void transition('canary')}>Rehearse canary</button>
      <button disabled={busy || result?.state !== 'canary'} onClick={() => void transition('promote')}>Rehearse promotion</button>
      <button disabled={busy || !['canary', 'promoted'].includes(result?.state ?? '')} onClick={() => void transition('rollback')}>Rehearse rollback</button></div>
    {result && <><p>State: <strong>{result.state}</strong>; server eligible: {String(result.eligible)};
      API compatibility: {result.apiCompatibility}; canary evidence: {result.canaryEvidence}; provider calls: {result.providerCalls}.</p>
      <p>Installed npm baseline {result.baselineNpmVersion}; candidate npm version unknown because no candidate package is installed.
        Agent pin {result.pinnedResources.agentVersion}; environment pin {result.pinnedResources.environmentVersion};
        skill pin {result.pinnedResources.skillVersion}.</p>
      <div className="lab-results"><h3>Server-computed compatibility checks</h3><ul>{result.checks.map(check =>
        <li key={check.name}><strong>{check.name}: {check.pass ? 'pass' : 'blocked'}</strong> — {check.evidence}</li>)}</ul></div>
      <p>Remote sessions rewound by host rollback: {String(result.remoteSessionsRewound)}. {result.note}</p></>}
    <p role="status" aria-label="Lab 55 status">{status}</p>
    <p>Sending <code>eligible: true</code> from a client grants nothing. This exercise does not run npm upgrade, provision an agent, or prove that a real SDK release passed.</p>
  </section>;
}
