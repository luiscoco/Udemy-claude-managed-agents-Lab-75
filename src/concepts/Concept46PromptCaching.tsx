import { useRef, useState } from 'react';
import { lab46Scenarios, lab46SnapshotSchema } from '../../shared/lab46-prompt-caching';

type Snapshot = ReturnType<typeof lab46SnapshotSchema.parse>;
const routeOf = (scenario: (typeof lab46Scenarios)[number]) => scenario === 'changed-model' ? 'model-switch' :
  scenario === 'reused-content' || scenario === 'changed-prefix' ? 'switches' : 'breakers';
export default function Concept46PromptCaching() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab46Scenarios)[number]>('reused-content');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Authored counters are observations, not savings measurements.');
  async function run() { setBusy(true); try {
    const response = await fetch(`/api/c46/${routeOf(scenario)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ mode: 'scripted', scenario }), signal: AbortSignal.timeout(7000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab46SnapshotSchema.parse(data); setSnapshot(checked);
    setStatus(`${checked.comparable ? 'Equal-scope comparison' : 'Not comparable'}; ${checked.uncertainty}`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Usage comparison failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab46-heading"><h2 id="lab46-heading">Observed cache usage and cost</h2>
    <p>Compare supported Managed usage counters for stable handbook text and dynamic suffixes. Managed Agents owns internal prompt composition, so this lesson offers no cache-control, TTL or prompt-boundary session switch.</p>
    <div className="lab-controls"><label>Offline comparison<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab46Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Compare usage fixtures</button></div>
    {snapshot && <><p>Stable handbook: {snapshot.handbook}</p><p>Dynamic suffix 1: {snapshot.dynamicSuffixes[0]}. Suffix 2: {snapshot.dynamicSuffixes[1]}.</p>
      <h3>Observed usage records</h3><div className="lab-results">{snapshot.readings.map((reading, index) => <section key={index}>
        <h4>Reading {index + 1}</h4><p>Session <code>{reading.sessionId}</code>; model {reading.model}; tools {reading.toolsVersion}; turn {reading.turn}.</p>
        <p>Scope: {reading.scope}; source: {reading.via}; content hash <code>{reading.contentHash}</code>.</p>
        <p>Input {reading.counters.inputTokens ?? 'unknown'}; output {reading.counters.outputTokens ?? 'unknown'};
          cache read {reading.counters.cacheReadTokens ?? 'unknown'}; cache creation {reading.counters.cacheCreationTokens ?? 'unknown'}.
          List cost: {reading.listCostCents ?? 'unknown at model-request scope'}.</p></section>)}</div>
      <p>Comparable: {String(snapshot.comparable)}. Per-reading difference: {snapshot.delta ? JSON.stringify(snapshot.delta) : 'not calculated'}.</p>
      <p>{snapshot.uncertainty} Savings claim: {String(snapshot.savingsClaim)}. Controllable cache boundary: {String(snapshot.controllableCacheBoundary)}. Provider calls: {snapshot.providerCalls}.</p>
      <h3>Evidence</h3><ul>{snapshot.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
    <p role="status" aria-label="Lab 46 status">{status}</p>
    <p>Short inputs or missing usage may show no cache counters. A host Managed HTTP tap cannot reveal the harness's internal Messages requests.</p>
  </section>;
}
