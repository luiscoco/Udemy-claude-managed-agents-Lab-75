import { useRef, useState } from 'react';
import { lab33Scenarios, lab33SnapshotSchema } from '../../shared/lab33-mcp-elicitation';
type Snapshot = ReturnType<typeof lab33SnapshotSchema.parse>;
export default function Concept33McpElicitation() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab33Scenarios)[number]>('valid-form');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [date, setDate] = useState('2026-10-15'); const [quantity, setQuantity] = useState(3);
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. The fixture uses a local MCP process.');
  async function post(path: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c33/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab33SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`${checked.status}; MCP calls ${checked.mcpCallCount}; answers ${checked.answerCount}.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'MCP form request failed.'); } finally { setBusy(false); } }
  const respond = (action: 'accept' | 'decline', invalid = false) => { if (!snapshot) return;
    const body = { runId: snapshot.runId, mcpRequestId: snapshot.mcpRequestId, customCallId: snapshot.customCallId,
      consentId: snapshot.consentId, action, ...(action === 'accept' ? { content: { date, quantity: invalid ? 99 : quantity } } : {}) };
    void post(snapshot.scenario === 'url-consent' ? `consent/${snapshot.consentId}` : 'respond', body); };
  const who = (operation: 'inspect' | 'abort') => { if (snapshot) void post('who', { operation, runId: snapshot.runId }); };
  return <section aria-labelledby="lab33-heading"><h2 id="lab33-heading">Human forms during tool work</h2>
    <p>A real local MCP stdio server requests a bounded form while its tool call waits. The host validates the reply and correlates the final MCP result to one Managed custom-tool result shape.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab33Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post('run', { mode: 'scripted', scenario })}>Start MCP form</button></div>
    {snapshot && <><section aria-label="Pending MCP form"><h3>{snapshot.question || 'Waiting for MCP request'}</h3>
      <p>Run <code>{snapshot.runId}</code>; MCP request {snapshot.mcpRequestId}; custom call <code>{snapshot.customCallId}</code>; consent <code>{snapshot.consentId}</code>.</p>
      {snapshot.consentPath && <section aria-label="Fixed fictional local consent page"><h4>Fictional local consent page</h4>
        <p>Same-origin route: <code>{snapshot.consentPath}</code>. Your choice is sent only to the local MCP form fixture. This is a demonstration, not OAuth.</p></section>}
      <label>Observation date<input type="date" value={date} disabled={busy || snapshot.status !== 'pending'} onChange={event => setDate(event.target.value)} /></label>
      <label>Quantity (1–10)<input type="number" min={1} max={10} value={quantity} disabled={busy || snapshot.status !== 'pending'}
        onChange={event => setQuantity(Number(event.target.value))} /></label>
      <div className="lab-controls"><button disabled={busy || snapshot.status !== 'pending'} onClick={() => respond('accept')}>Submit form</button>
        <button disabled={busy || snapshot.status !== 'pending'} onClick={() => respond('accept', true)}>Try invalid quantity</button>
        <button disabled={busy || snapshot.status !== 'pending'} onClick={() => respond('decline')}>Decline</button>
        <button disabled={busy || snapshot.status !== 'pending'} onClick={() => who('abort')}>Abort waiting</button>
        <button disabled={busy} onClick={() => who('inspect')}>Inspect state</button></div></section>
      <p>Validated form: {snapshot.form ? `${snapshot.form.date}, quantity ${snapshot.form.quantity}` : 'none'}.</p>
      <p>MCP tool result: {(snapshot.result ?? 'pending').replace(/\.$/, '')}.</p>
      {snapshot.bridgeResult && <pre style={{ overflowX: 'auto' }}>{JSON.stringify(snapshot.bridgeResult, null, 2)}</pre>}
      <h3>Protocol evidence</h3><ul>{snapshot.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul>
      <p>{snapshot.note} Provider calls: {snapshot.providerCalls}.</p></>}
    <p role="status" aria-label="Lab 33 status">{status}</p>
    <p>Direct cloud MCP elicitation callback support is not assumed. No arbitrary consent URL or real OAuth flow is used.</p>
  </section>;
}
