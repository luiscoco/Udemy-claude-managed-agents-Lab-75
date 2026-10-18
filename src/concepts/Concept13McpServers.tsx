import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { lab13Scenarios, lab13SnapshotSchema } from '../../shared/lab13-mcp';
import type { Lab13Input, Lab13Snapshot, Lab13Config } from '../../shared/lab13-mcp';
import { CodeBlock } from '../components/CodeBlock';
import { LiveActionButton } from '../components/LiveActionButton';
import { streamPost } from '../lib/sse';
import { redact } from '../lib/presentation';

const catalogSchema = z.object({ liveReady: z.boolean(), nativeUrlReady: z.boolean(), cloudReachability: z.literal('not-tested'), protocolVersion: z.string() });
export default function Concept13McpServers() {
  const [snapshot, setSnapshot] = useState<Lab13Snapshot>(); const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('Ready. Offline uses authored agent events with real local MCP transports.');
  const [scenario, setScenario] = useState<Lab13Input['scenario']>('working'); const [integration, setIntegration] = useState<Lab13Input['integration']>('host-bridge');
  const [operation, setOperation] = useState<Lab13Input['operation']>('inspect');
  const [prompt, setPrompt] = useState('List the fictional field notes and check NOTEBOOK stock using the available tools.');
  const [config, setConfig] = useState<Lab13Config>({ notesEnabled: true, inventoryEnabled: true, reserveEnabled: false });
  const [catalog, setCatalog] = useState<z.infer<typeof catalogSchema>>();
  const owner = useRef(crypto.randomUUID()); const mounted = useRef(true); const request = useRef<AbortController | null>(null); const latest = useRef<Lab13Snapshot | undefined>(undefined);
  useEffect(() => { mounted.current = true; void refresh().catch(() => {}); return () => {
    mounted.current = false; request.current?.abort(); const value = latest.current;
    if (value && value.state !== 'closed') void fetch('/api/c13/end', { method: 'POST', keepalive: true, headers: headers(), body: JSON.stringify({ runId: value.runId }) }).catch(() => {});
  }; }, []);
  function headers() { return { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }; }
  function accept(value: Lab13Snapshot) { if (!mounted.current) return; latest.current = value; setSnapshot(value); setStatus(value.message); }
  async function refresh() { const response = await fetch('/api/c13/servers', { signal: AbortSignal.timeout(5000) }); if (!response.ok) throw new Error('Could not read server setup.');
    const value = catalogSchema.parse(await response.json()); if (mounted.current) setCatalog(value); return value.liveReady && (integration === 'host-bridge' || value.nativeUrlReady); }
  async function post(action: string, body: object) {
    const response = await fetch(`/api/c13/${action}`, { method: 'POST', headers: headers(), body: JSON.stringify(body), signal: request.current!.signal });
    const value: unknown = await response.json(); if (!response.ok) throw new Error((value as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`);
    return lab13SnapshotSchema.parse(value);
  }
  async function run(mode: 'scripted' | 'live', createOnly = false) {
    if (request.current) return; const controller = new AbortController(); request.current = controller; setPending(true);
    try {
      if (createOnly) accept(await post('session', { mode, integration: mode === 'scripted' ? 'host-bridge' : integration, scenario: mode === 'live' ? 'working' : scenario, config, prompt, operation }));
      else {
        const retained = latest.current && latest.current.state === 'idle'; const url = retained ? '/api/c13/send' : '/api/c13/query';
        const body = retained ? { runId: latest.current!.runId, prompt, operation } : { mode, integration: mode === 'scripted' ? 'host-bridge' : integration, scenario: mode === 'live' ? 'working' : scenario, config, prompt, operation };
        const value = await streamPost(url, body, { signal: controller.signal, idleMs: 25_000, deadlineMs: 180_000, headers: { 'X-Lab-Owner': owner.current }, resultSchema: lab13SnapshotSchema,
          onEvent: (_type, data) => { if ((data as { kind?: string }).kind === 'checkpoint') accept(lab13SnapshotSchema.parse((data as { snapshot: unknown }).snapshot)); },
        });
        if (value.kind === 'success') accept(value.result); else if (mounted.current) setStatus('Cancelled locally; server cleanup was requested. Inspect the checkpoint before reuse.');
      }
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'MCP experiment failed.'); }
    finally { request.current = null; if (mounted.current) setPending(false); }
  }
  async function control(action: 'configure' | 'end' | 'stock/reset' | 'stock') {
    if (request.current || !snapshot) return; request.current = new AbortController(); setPending(true);
    try {
      if (action === 'stock') { const response = await fetch(`/api/c13/stock?runId=${snapshot.runId}`, { headers: headers(), signal: request.current.signal });
        if (!response.ok) throw new Error(`Inspect failed: HTTP ${response.status}`); accept(lab13SnapshotSchema.parse(await response.json())); }
      else accept(await post(action, { runId: snapshot.runId, ...(action === 'configure' ? { config } : {}) }));
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'Control failed.'); }
    finally { request.current = null; if (mounted.current) setPending(false); }
  }
  const retained = snapshot && snapshot.state !== 'closed'; const idle = retained && snapshot.state === 'idle';
  const native = integration === 'managed-url'; const ready = Boolean(catalog?.liveReady && (!native || catalog.nativeUrlReady));
  return <section aria-labelledby="c13-heading"><h2 id="c13-heading">Connect MCP tools and inspect reachability</h2>
    <p>Local notes run over stdio. The owned inventory server uses authenticated Streamable HTTP. A local success does not prove a Managed sandbox can reach that endpoint.</p>
    <div className="lab-controls"><div className="lab-field"><label htmlFor="c13-scenario">Offline connection scenario</label><select id="c13-scenario" value={scenario} disabled={pending || Boolean(retained)} onChange={event => setScenario(event.target.value as typeof scenario)}>{lab13Scenarios.map(value => <option key={value}>{value}</option>)}</select></div>
      <div className="lab-field"><label htmlFor="c13-integration">Live integration</label><select id="c13-integration" value={integration} disabled={pending || Boolean(retained)} onChange={event => {
        const next = event.target.value as typeof integration; setIntegration(next); if (next === 'managed-url') { setConfig({ notesEnabled: false, inventoryEnabled: true, reserveEnabled: false }); setOperation('inspect'); setPrompt('Use get_stock to check NOTEBOOK inventory.'); }
      }}><option value="host-bridge">Typed host bridge to local MCP</option><option value="managed-url">Native Managed HTTPS MCP + vault</option></select></div></div>
    <fieldset><legend>Server and tool configuration</legend>
      <label><input type="checkbox" checked={config.notesEnabled} disabled={pending || native} onChange={event => setConfig({ ...config, notesEnabled: event.target.checked })} /> Enable notes server</label>
      <label><input type="checkbox" checked={config.inventoryEnabled} disabled={pending} onChange={event => setConfig({ ...config, inventoryEnabled: event.target.checked })} /> Enable inventory server</label>
      <label><input type="checkbox" checked={config.reserveEnabled} disabled={pending || native} onChange={event => setConfig({ ...config, reserveEnabled: event.target.checked })} /> Enable fictional stock reservation tool</label>
      {retained && <><p>These controls are proposed configuration; apply them while idle before running another turn.</p><button disabled={pending || !idle} onClick={() => void control('configure')}>Apply idle MCP configuration</button></>}
    </fieldset>
    <label htmlFor="c13-prompt">User question</label><textarea id="c13-prompt" value={prompt} maxLength={1000} onChange={event => setPrompt(event.target.value)} rows={3} />
    <label htmlFor="c13-operation">Offline authored tool plan</label><select id="c13-operation" value={operation} disabled={pending || native || snapshot?.mode === 'live'} onChange={event => { const next = event.target.value as typeof operation; setOperation(next); if (next === 'reserve') setPrompt('Reserve one fictional NOTEBOOK using reserve_stock.'); }}><option value="inspect">List notes and get stock</option><option value="reserve">Attempt one stock reservation</option></select>
    <div className="lab-controls"><button disabled={pending || Boolean(retained)} onClick={() => void run('scripted', true)}>Create offline MCP session</button>
      <button disabled={pending || (retained && (!idle || snapshot.mode !== 'scripted'))} onClick={() => void run('scripted')}>Run offline MCP experiment</button>
      {idle && snapshot.mode === 'live' && <button disabled={pending} onClick={() => void run('live')}>Send another live turn</button>}
      {pending && <button onClick={() => request.current?.abort()}>Cancel experiment</button>}
      <button disabled={pending || !snapshot || snapshot.state === 'closed'} onClick={() => void control('end')}>Close MCP session</button></div>
    <div className="lab-live"><LiveActionButton busy={pending} available={ready} checkAvailability={refresh} onRun={() => void run('live')}
      {...(retained ? { blockedReason: 'A session is retained. Apply idle configuration, send another turn or close it.' } : {})} keyIsolated
      setup="The host bridge requires the isolated Managed API key, single-agent base, environment and live opt-in. Native URL mode additionally requires CLAUDE_MANAGED_LAB13_INVENTORY_URL and CLAUDE_MANAGED_LAB13_VAULT_ID on the server. Use a reviewed public HTTPS endpoint with a matching existing vault. No tunnel, OAuth or vault provisioning starts from this page." /></div>
    <p role="status" aria-live="polite">{redact(status)}</p>
    <p>Setup metadata: {catalog ? `MCP ${catalog.protocolVersion}; cloud reachability ${catalog.cloudReachability}.` : 'not yet available'}</p>
    {snapshot && <div className="agent-response" aria-label="MCP evidence"><h3>Connection and turn evidence</h3>
      <p>Source: <strong>{snapshot.source}</strong>. Mode: {snapshot.mode}. State: <strong>{snapshot.state}</strong>. Session: <code>{snapshot.sessionId ?? 'not created'}</code>.</p>
      <p>Interruption: {snapshot.interruption}. Cleanup: {snapshot.cleanup}.</p>
      <h4>Last connection observations</h4>{snapshot.connections.map(connection => <article className="report-turn" key={connection.server}><h5>{connection.server} / {connection.transport}: {connection.state}</h5>
        <p>{connection.detail}{connection.httpStatus && ` HTTP status: ${connection.httpStatus}.`}</p><p>Advertised tools: {connection.advertisedTools.join(', ') || 'none observed'}. Effective tools: {connection.effectiveTools.join(', ') || 'none'}.</p></article>)}
      <h4>Actual tool evidence</h4>{snapshot.calls.length === 0 && <p>No tool calls observed.</p>}{snapshot.calls.map(call => <article className="report-turn" key={call.useId}><h5>{call.name}: {call.isError ? 'error' : call.resultId || call.path !== 'native-mcp' ? 'result observed' : 'awaiting result'}</h5>
        <p>Path: {call.path}. Use event: <code>{call.useId}</code>. Result event: <code>{call.resultId ?? 'not observed'}</code>. Host result submission acknowledged: {String(call.resultSent)}. Host handler attempted: {String(call.handlerRan)}.</p><pre>{call.text}</pre></article>)}
      <h4>Agent turns</h4>{snapshot.turns.map(turn => <article key={turn.id}><p>{turn.outcome.kind}: {turn.outcome.detail}</p>{turn.messages.map(message => <AgentMessage key={message.eventId} text={message.text} />)}</article>)}
      <h4>Owned local inventory</h4><p>Scope: {snapshot.stockScope}. This is not a remote inventory measurement.</p><ul>{snapshot.stock.map(item => <li key={item.sku}>{item.sku}: {item.available} available</li>)}</ul>
      <div className="lab-controls"><button disabled={pending} onClick={() => void control('stock')}>Inspect local stock and session</button><button disabled={pending || !idle || native} onClick={() => void control('stock/reset')}>Reset owned local stock</button></div>
      <details><summary>Full MCP transport and session evidence</summary><CodeBlock label="MCP evidence JSON" lineNumbers={false} code={JSON.stringify(snapshot, null, 2)} /></details>
    </div>}
  </section>;
}
import { AgentMessage } from '../components/AgentMessage';
