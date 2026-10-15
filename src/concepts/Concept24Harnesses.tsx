import { useRef, useState } from 'react';
import { lab24HarnessSchema, lab24ResultSchema, lab24ScenarioSchema } from '../../shared/lab24-harnesses';
import type { Lab24Result } from '../../shared/lab24-harnesses';
import { LiveActionButton } from '../components/LiveActionButton';

const names = { 'manual-messages': 'Manual Messages loop', 'messages-tool-runner': 'Messages SDK tool runner',
  'managed-session': 'Managed session custom tools' } as const;
export default function Concept24Harnesses() {
  const owner = useRef(crypto.randomUUID());
  const [harness, setHarness] = useState<(typeof lab24HarnessSchema.options)[number]>('manual-messages');
  const [scenario, setScenario] = useState<(typeof lab24ScenarioSchema.options)[number]>('reserve');
  const [callLimit, setCallLimit] = useState(2), [results, setResults] = useState<Lab24Result[]>([]);
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Ready. Offline runs use authored typed events and the real host inventory handler.');
  async function run(selected = harness) { if (busy) return; setBusy(true);
    try { const response = await fetch('/api/c24/run', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify({ mode: 'scripted', harness: selected, scenario, callLimit }), signal: AbortSignal.timeout(10000) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
      const result = lab24ResultSchema.parse(data); setResults(previous => [result, ...previous].slice(0, 3));
      setStatus(`${names[selected]}: ${result.outcome}. Provider calls: 0; host effects below.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Run failed.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="lab24-heading"><h2 id="lab24-heading">Who owns the agent loop?</h2>
    <p>Compare the same fictional NOTEBOOK reservation across three control flows. Each offline path invokes the checked host handler. Authored model events are fixtures, not a live Claude run.</p>
    <div className="lab-controls"><label>Harness<select aria-label="Harness" value={harness} disabled={busy}
      onChange={event => setHarness(lab24HarnessSchema.parse(event.target.value))}>{lab24HarnessSchema.options.map(value => <option key={value} value={value}>{names[value]}</option>)}</select></label>
      <label>Scenario<select aria-label="Scenario" value={scenario} disabled={busy}
        onChange={event => setScenario(lab24ScenarioSchema.parse(event.target.value))}>
        <option value="reserve">Reserve 2</option><option value="large-reservation">Reject 5</option><option value="call-limit">Read then limit</option></select></label>
      <label>Host call limit<select aria-label="Host call limit" value={callLimit} disabled={busy} onChange={event => setCallLimit(Number(event.target.value))}>
        {[1, 2, 3].map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>
    <div className="lab-controls"><button disabled={busy} onClick={() => void run()}>Run offline harness</button>
      <button disabled={busy} onClick={() => { setResults([]); setStatus('Local comparisons cleared.'); }}>Clear comparisons</button></div>
    <LiveActionButton busy={busy} available={false} checkAvailability={async () => false} onRun={async () => {}}
      setup="Live Messages and Managed paths require separate explicit opt-in, API configuration, and a reviewed Managed agent with exactly the inventory custom tools. This lab does not auto-provision or bill either API." />
    <p role="status" aria-label="Harness status">{status}</p>
    <div className="lab-controls"><strong>Ownership</strong><span>Manual: application iterates, appends results and cleans up.</span>
      <span>Tool runner: SDK iterates; host callback validates and executes tools.</span>
      <span>Managed: session harness iterates; host answers custom-tool pauses and archives sessions.</span></div>
    {results.map((result, index) => <section key={index} aria-label={`${names[result.harness]} result`}><h3>{names[result.harness]}: {result.outcome}</h3>
      <p>Loop owner: {result.loopOwner}. Tool calls: {result.toolCalls}. Provider calls: {result.providerCalls}. Final host stock: {result.stock}.</p>
      <ol>{result.trace.map((entry, at) => <li key={at}><strong>{entry.stage}</strong> · {entry.adapter}: {entry.detail}</li>)}</ol>
      <h4>Checked effects</h4><ul>{result.effects.map((effect, at) => <li key={at}>{effect.tool}: {effect.before} → {effect.after}; {effect.reason}</li>)}</ul>
      <p>Fixture answer: {result.answer}</p></section>)}
  </section>;
}
