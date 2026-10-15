import { useRef, useState } from 'react';
import { lab43SnapshotSchema } from '../../shared/lab43-remote-mcp-resources';

type Snapshot = ReturnType<typeof lab43SnapshotSchema.parse>;
const scenarios = ['versioned-resource', 'allowed-template', 'known-prompt', 'bad-token', 'expired-token', 'unknown-uri'] as const;
export default function Concept43RemoteMcp() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof scenarios)[number]>('versioned-resource');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Start with local consent. The bridge token stays on the server.');
  async function post(route: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c43/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(7000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    if (route === 'host-read') { const checked = lab43SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`${checked.status}: ${checked.reason}`); }
    else setStatus(route === 'auth' ? `Local consent: ${data.consent}; token ${data.tokenStatus}; ${data.transport}.` : JSON.stringify(data).slice(0, 900));
  } catch (error) { setStatus(error instanceof Error ? error.message : 'MCP bridge request failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab43-heading"><h2 id="lab43-heading">MCP resources through a host bridge</h2>
    <p>A loopback MCP server lists tools, versioned resources, a template and a prompt. A host client reads only approved URIs, then returns bounded data through a typed Managed custom-tool result.</p>
    <div className="lab-controls"><button disabled={busy} onClick={() => void post('auth', { consent: true })}>Grant local consent</button>
      <button disabled={busy} onClick={() => void post('auth', { consent: true, refresh: true })}>Refresh bridge token</button>
      <button disabled={busy} onClick={() => void post('resources', {})}>List resources</button>
      <button disabled={busy} onClick={() => void post('toolsets', {})}>Inspect toolsets</button></div>
    <div className="lab-controls"><label>Offline case<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post('host-read', { scenario })}>Read through host bridge</button></div>
    {snapshot && <><p>Transport: {snapshot.transport}. Consent: {String(snapshot.consent)}. Token: {snapshot.tokenPreview ?? 'none'} ({snapshot.tokenStatus}).</p>
      <p>Method: {snapshot.method}; URI: {snapshot.uri ?? 'prompt name'}; status: {snapshot.status}; reason: {snapshot.reason}.</p>
      <p>Resource version: {snapshot.resourceVersion ?? 'none'}. Result bytes: {snapshot.resultBytes}.</p>
      {snapshot.result && <pre>{snapshot.result}</pre>}
      <p>Custom tool result: {snapshot.customToolResult ? `${snapshot.customToolResult.type}, ${snapshot.customToolResult.tool_use_id}, is_error ${snapshot.customToolResult.is_error}` : 'none'}.</p>
      <p>Direct Managed URL MCP configured: {String(snapshot.directMcpConfigured)}. Provider calls: {snapshot.providerCalls}.</p>
      <h3>Host evidence</h3><ul>{snapshot.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
    <p role="status" aria-label="Lab 43 status">{status}</p>
    <p>Direct URL MCP requires a reachable server and separately reviewed credentials. It does not automatically expose every resource, prompt or local callback.</p>
  </section>;
}
