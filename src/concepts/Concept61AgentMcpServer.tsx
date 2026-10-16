import { useRef, useState } from 'react';
import { lab61DemoSchema } from '../../shared/lab61-agent-mcp-server';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab61DemoSchema>['scenario'];
type Result = { scenario: Scenario; transportRequestIds: number[]; mcpSessionId: string; agentSessionId: string | null;
  toolNames: string[]; progressEvents: number; structuredResponse: { caseStatus: string; eligible: boolean;
    amountCents: number; summary: string } | null; cancellation: boolean; concurrentRejected: boolean;
  timeout: boolean; providerCalls: number; note: string };
export default function Concept61AgentMcpServer() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<Scenario>('normal');
  const [result, setResult] = useState<Result>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. The local MCP client uses a server-held bearer token.');
  async function run() { setBusy(true); try { const response = await fetch('/api/c61/demo', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, body: JSON.stringify({ scenario }),
    signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    setResult(data as Result); setStatus(`${scenario}: local MCP client completed; provider calls ${data.providerCalls}.`); }
  catch (error) { setStatus(error instanceof Error ? error.message : 'Local MCP demo failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab61-heading"><h2 id="lab61-heading">Exposing an agent as an MCP server</h2>
    <p>Use a local MCP client to initialize, list one typed support/refund tool, call it, inspect progress and close the transport.</p>
    <div className="lab-controls"><label>Client scenario<select value={scenario}
      onChange={event => setScenario(lab61DemoSchema.shape.scenario.parse(event.target.value))}>
      <option value="normal">Normal review</option><option value="timeout">Timed-out review</option>
      <option value="cancel">Cancelled call</option><option value="concurrent">Concurrent call</option></select></label>
      <button disabled={busy} onClick={() => void run()}>Run local MCP client</button></div>
    {result && <><p>Transport request IDs: {result.transportRequestIds.join(', ')}; MCP session: <code>{result.mcpSessionId}</code>;
      agent session: <code>{result.agentSessionId ?? 'none'}</code>. Progress events: {result.progressEvents}.
      Cancelled: {String(result.cancellation)}; concurrent rejected: {String(result.concurrentRejected)};
      timeout: {String(result.timeout)}; provider calls: {result.providerCalls}.</p>
      <p>Listed tool: {result.toolNames.join(', ')}.</p>
      {result.structuredResponse && <pre className="lab-json">{JSON.stringify(result.structuredResponse, null, 2)}</pre>}
      <p>{result.note}</p></>}
    <p role="status" aria-label="Lab 61 status">{status}</p>
    <p>Bearer tokens and tenant identity stay on the host. No general shell, caller-selected workspace or actual refund is exposed.</p>
  </section>;
}
