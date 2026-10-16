import { useRef, useState } from 'react';
import { lab57ResultSchema, lab57ScenarioSchema } from '../../shared/lab57-parallel-worktrees';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab57ScenarioSchema>;
type Result = z.infer<typeof lab57ResultSchema>;
const labels: Record<Scenario, string> = { 'serial-integration': 'Serial integration',
  'competing-edits': 'Competing greeting edits', 'failed-worker': 'Failed worker',
  'cancel-worker': 'Cancelled worker' };
export default function Concept57ParallelWorktrees() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<Scenario>('serial-integration');
  const [result, setResult] = useState<Result>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. This fixture uses local Git and authored worker actions.');
  async function run() { setBusy(true); try { const response = await fetch('/api/c57/run', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
    body: JSON.stringify({ scenario }), signal: AbortSignal.timeout(120000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab57ResultSchema.parse(data); setResult(checked);
    setStatus(`${scenario}: integration ${checked.integration}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Fixture failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab57-heading"><h2 id="lab57-heading">Workers in host Git worktrees</h2>
    <p>Rehearse separate worker checkouts, host path and behavior checks, serialized Git integration and conflict preservation.</p>
    <div className="lab-controls"><label>Worktree scenario<select value={scenario} disabled={busy}
      onChange={event => setScenario(lab57ScenarioSchema.parse(event.target.value))}>
      {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Run local worktrees</button></div>
    {result && <><p>Base SHA: <code>{result.baseSha}</code>. Integration: <strong>{result.integration}</strong>.
      Combined tests passed: {String(result.combinedTestsPassed)}. Branches preserved: {String(result.branchesPreserved)}.
      Provider calls: {result.providerCalls}.</p>
      <h3>Worker evidence</h3><ul>{result.workers.map(worker => <li key={worker.branch}>
        <strong>{worker.role}</strong> ({worker.branch}): changed {worker.changedPaths.join(', ') || 'none'};
        untracked {worker.untrackedPaths.join(', ') || 'none'}; tests {worker.testPassed ? 'passed' : 'failed'};
        commit {worker.committed ? 'created' : 'blocked'}. {worker.hostEvidence}</li>)}</ul>
      <h3>Host timeline</h3><ol>{result.timeline.map((item, index) => <li key={index}>{item}</li>)}</ol>
      <p>{result.note}</p></>}
    <p role="status" aria-label="Lab 57 status">{status}</p>
    <p>Git worktrees separate files and refs; they are not OS or tenant isolation. The local fixture never passes an API key to worker tests.</p>
  </section>;
}
