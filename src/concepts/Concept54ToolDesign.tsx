import { useEffect, useRef, useState } from 'react';
import { lab54ResultSchema } from '../../shared/lab54-tool-design';
import type { z } from 'zod';

type Result = z.infer<typeof lab54ResultSchema>;
type Variant = 'vague' | 'explicit';
type Scenario = Result['scenario'];
type Contract = { tool: { name: string; description: string; input_schema: unknown }; issues: string[];
  hostMetadata: { risk: string; effect: string; idempotency: string; nativeAnnotationsAvailable: boolean } };
export default function Concept54ToolDesign() {
  const owner = useRef(crypto.randomUUID()); const [variant, setVariant] = useState<Variant>('vague');
  const [scenario, setScenario] = useState<Scenario>('invalid-input'); const [contracts, setContracts] = useState<Record<Variant, Contract>>();
  const [result, setResult] = useState<Result>(); const [comparison, setComparison] = useState<Result[]>();
  const [status, setStatus] = useState('Ready. Scripted tool choices make zero provider calls.'); const [busy, setBusy] = useState(false);
  useEffect(() => { void fetch('/api/c54/facts', { headers: { 'X-Lab-Owner': owner.current } }).then(response => response.json())
    .then(data => setContracts({ vague: data.vague, explicit: data.explicit })).catch(() => {}); }, []);
  async function post(path: 'call' | 'run', body: object) { const response = await fetch(`/api/c54/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data; }
  async function call() { setBusy(true); try { const checked = lab54ResultSchema.parse(await post('call', { variant, scenario }));
    setResult(checked); setComparison(undefined); setStatus(`${scenario}: ${checked.steps.length} correlated result(s), ${checked.refundCount} refund effect(s).`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Tool call failed.'); } finally { setBusy(false); } }
  async function run() { setBusy(true); try { const data = await post('run', { variant }) as { cases: unknown[] };
    setComparison(data.cases.map(item => lab54ResultSchema.parse(item))); setResult(undefined);
    setStatus('Four scripted cases completed. These are not measured model choices.');
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Workshop run failed.'); } finally { setBusy(false); } }
  const contract = contracts?.[variant]; const cases = comparison ?? (result ? [result] : []);
  return <section aria-labelledby="lab54-heading"><h2 id="lab54-heading">Design tools the model uses well</h2>
    <p>Compare vague and explicit custom-tool contracts. The scripted choice may be wrong, but the closed host handler still controls every approval and refund effect.</p>
    <div className="lab-controls"><label>Tool contract<select value={variant} disabled={busy} onChange={event => setVariant(event.target.value as Variant)}>
      <option value="vague">Vague name and units</option><option value="explicit">Explicit review tool</option></select></label>
      <label>Scenario<select value={scenario} disabled={busy} onChange={event => setScenario(event.target.value as Scenario)}>
        <option value="invalid-input">Invalid input</option><option value="domain-rejection">Domain rejection</option>
        <option value="missing-prerequisite">Missing prerequisite</option><option value="correct-idempotent">Correct idempotent action</option></select></label>
      <button disabled={busy} onClick={() => void call()}>Call scripted tool</button>
      <button disabled={busy} onClick={() => void run()}>Run all four cases</button></div>
    {contract && <><h3>Authored tool contract</h3><p><code>{contract.tool.name}</code>: {contract.tool.description}</p>
      <details><summary>Closed input schema</summary><pre>{JSON.stringify(contract.tool.input_schema, null, 2)}</pre></details>
      <p>Contract linter: {contract.issues.length ? contract.issues.join(' ') : 'No workshop issues.'}</p>
      <p>Host metadata: risk {contract.hostMetadata.risk}; effect {contract.hostMetadata.effect}; {contract.hostMetadata.idempotency}.
        Native custom-tool annotations: {contract.hostMetadata.nativeAnnotationsAvailable ? 'available' : 'not in the installed SDK type'}.</p></>}
    {cases.length > 0 && <div className="lab-results"><h3>Choice, recovery and host effect evidence</h3>
      {cases.map(item => <section key={item.scenario}><h4>{item.scenario}</h4>
        <p>Approvals {item.approvalCount}; refunds {item.refundCount}; stable business idempotency {item.stableIdempotency === null ? 'not tested' : String(item.stableIdempotency)}.</p>
        <ol>{item.steps.map(step => <li key={step.eventId}><strong>{step.name}</strong> · <code>{step.eventId}</code> ·
          {step.isError ? ' error' : ' accepted'} · {step.effect}.
          <p>Input: <code>{JSON.stringify(step.input)}</code></p><p>Result: <code>{step.resultText}</code></p>
          <p>Action key: {step.actionKey ?? 'none'}; recovery: {step.recovery}</p></li>)}</ol></section>)}</div>}
    <p role="status" aria-label="Lab 54 status">{status}</p>
    <p>The linter evaluates contract clarity. Only a live, opted-in comparison could measure actual model tool choices; this workshop reports scripted traces without synthetic success scores.</p>
  </section>;
}
