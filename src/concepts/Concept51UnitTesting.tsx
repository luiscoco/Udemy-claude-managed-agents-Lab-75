import { useRef, useState } from 'react';
import { lab51ResultSchema, lab51ScenarioSchema } from '../../shared/lab51-unit-testing';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab51ScenarioSchema>;
type Result = z.infer<typeof lab51ResultSchema>;
const labels: Record<Scenario, string> = {
  all: 'Run complete offline suite', 'malformed-order': 'Malformed tool input', 'foreign-order': 'Foreign customer order',
  denial: 'Review denial', cancellation: 'Cancellation', 'missing-terminal': 'Missing idle event',
  'child-thread': 'Child-thread event', 'duplicate-events': 'Duplicate and preview events',
  'invalid-report': 'Invalid final report', 'retained-session': 'Retained session', 'policy-mutation': 'Virtual-time policy mutation',
};
export default function Concept51UnitTesting() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<Scenario>('all');
  const [result, setResult] = useState<Result>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. This suite uses injected offline ports and makes zero provider calls.');
  async function run(path: 'run' | 'replay') { setBusy(true); setResult(undefined);
    try { const response = await fetch(`/api/c51/${path}`, { method: 'POST', headers: {
      'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ scenario }), signal: AbortSignal.timeout(12000) }); const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
      if (path === 'run') { const checked = lab51ResultSchema.parse(data); setResult(checked);
        setStatus(checked.pass ? 'Host tests met their expectations. The deliberate policy mutation was detected.' :
          'A host assertion failed; inspect the evidence.'); }
      else { const assertions = data.assertions as Result['assertions']; setResult({ source: 'offline-injected-host', scenario,
        providerCalls: 0, assertions, pass: assertions.every(item => item.pass), mutationDetected: null });
        setStatus('Recorded events replayed through the shared consumer.'); }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Offline test failed.'); } finally { setBusy(false); } }
  const canReplay = ['child-thread', 'duplicate-events', 'missing-terminal'].includes(scenario);
  return <section aria-labelledby="lab51-heading"><h2 id="lab51-heading">Test the Managed host offline</h2>
    <p>Run assertions against the Acme Support Desk's actual store, custom handlers, retained session and event consumer. No API key, environment loading, provisioning or model request is involved.</p>
    <div className="lab-controls"><label>Test scenario<select value={scenario} disabled={busy}
      onChange={event => setScenario(lab51ScenarioSchema.parse(event.target.value))}>
      {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run('run')}>Run offline host tests</button>
      <button disabled={busy || !canReplay} onClick={() => void run('replay')}>Replay recorded events</button></div>
    {result && <><p>Suite: <strong>{result.pass ? 'passed' : 'failed'}</strong>; provider calls: {result.providerCalls};
      policy mutation detected: {result.mutationDetected === null ? 'not selected' : String(result.mutationDetected)}.</p>
      <div className="lab-results"><h3>Assertions and effect evidence</h3><ol>{result.assertions.map((item, index) =>
        <li key={`${item.name}-${index}`}><strong>{item.name}: {item.pass ? 'pass' : item.expectedFailure ? 'expected failure' : 'fail'}</strong>
          <p>Expected: {item.expected}. Observed: {item.observed}.</p><p>Evidence: {item.evidence}</p></li>)}</ol></div></>}
    <p role="status" aria-label="Lab 51 status">{status}</p>
    <p>The intentional 60-day refund-policy mutation should fail the 30-day boundary assertion. The unmodified host handler must still reject the old order.</p>
  </section>;
}
