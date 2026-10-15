import { useEffect, useRef, useState } from 'react';
import { lab23InventorySchema, lab23RunResultSchema, lab23Variants } from '../../shared/lab23-plugins';
import type { Lab23Inventory, Lab23RunResult } from '../../shared/lab23-plugins';
import { LiveActionButton } from '../components/LiveActionButton';

type Catalog = { namespace: string; hostVersion: string; manifestHash: string;
  contributions: { kind: string; path: string; sha256: string }[]; recent: { runId: string; enabled: boolean }[]; liveReady: false; note: string };
export default function Concept23Plugins() {
  const owner = useRef(crypto.randomUUID());
  const [catalog, setCatalog] = useState<Catalog>(), [inventory, setInventory] = useState<Lab23Inventory | Lab23RunResult>(), [result, setResult] = useState<Lab23RunResult>();
  const [enabled, setEnabled] = useState(true), [includeSkill, setIncludeSkill] = useState(false), [includeMcp, setIncludeMcp] = useState(false);
  const [location, setLocation] = useState<'north marsh' | 'pine grove'>('north marsh');
  const [variant, setVariant] = useState<(typeof lab23Variants)[number]>('valid');
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Ready. Local bundle validation starts no Managed session.');
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  const selection = { enabled, includeSkill, includeMcp, location };
  async function refresh() { const response = await fetch('/api/c23/plugins', { headers, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Bundle inventory HTTP ${response.status}`);
    const data = await response.json() as Catalog; setCatalog(data); return data; }
  useEffect(() => { void refresh().catch(() => setStatus('Start the backend and check the reviewed bundle fixtures.')); }, []);
  async function post(path: string, body: unknown) { const response = await fetch(`/api/c23/${path}`, { method: 'POST', headers,
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data; }
  async function reload() { if (busy) return; setBusy(true);
    try { const data = await post('reload', { variant }) as { manifestHash: string };
      await refresh(); setStatus(`Reviewed local inventory reloaded at ${data.manifestHash.slice(0, 12)}. No remote session changed.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Reload rejected.'); await refresh().catch(() => {}); }
    finally { setBusy(false); }
  }
  async function inspect() { if (busy) return; setBusy(true);
    try { setInventory(lab23InventorySchema.parse(await post('inventory', selection)));
      setStatus('Requested and fixture-resolved capability inventories displayed. No provider call occurred.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Inventory failed.'); }
    finally { setBusy(false); }
  }
  async function run() { if (busy) return; setBusy(true);
    try { const data = lab23RunResultSchema.parse(await post('run', { ...selection, mode: 'scripted' }));
      setResult(data); setInventory(data); await refresh(); setStatus('Offline bundle run completed. Host effects and fixture resolution are shown separately.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Bundle run failed.'); }
    finally { setBusy(false); }
  }
  async function reset() { if (busy) return; setBusy(true);
    try { await post('reset', { confirmReset: true }); setResult(undefined); await refresh();
      setStatus('This owner’s local comparison history was cleared. The reviewed bundle remains loaded.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Reset failed.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="lab23-heading"><h2 id="lab23-heading">Reusable capability bundles</h2>
    <p>This application bundle pins reviewed files. It is a host packaging convention, not an Agent SDK plugin loader or marketplace install.</p>
    <h3>Reviewed local bundle</h3><p>Namespace: <code>{catalog?.namespace ?? 'loading'}</code>. Host version: {catalog?.hostVersion ?? 'unknown'}.
      Manifest SHA-256: <code>{catalog?.manifestHash ?? 'unavailable'}</code>.</p>
    <ul>{catalog?.contributions.map(item => <li key={item.kind}><strong>{item.kind}</strong>: <code>{item.path}</code> — <code>{item.sha256.slice(0, 16)}…</code></li>)}</ul>
    <div className="lab-controls"><label>Reload variant<select aria-label="Reload variant" disabled={busy} value={variant}
      onChange={event => setVariant(event.target.value as typeof variant)}>{lab23Variants.map(value => <option key={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void reload()}>Reload local bundle</button></div>
    <div className="lab-controls"><label><input type="checkbox" checked={enabled} disabled={busy} onChange={event => setEnabled(event.target.checked)} /> Enable bundle</label>
      <label><input type="checkbox" checked={includeSkill} disabled={busy} onChange={event => setIncludeSkill(event.target.checked)} /> Include skill snapshot</label>
      <label><input type="checkbox" checked={includeMcp} disabled={busy} onChange={event => setIncludeMcp(event.target.checked)} /> Include URL MCP declaration</label>
      <label>Location<select aria-label="Sighting location" disabled={busy} value={location} onChange={event => setLocation(event.target.value as typeof location)}>
        <option>north marsh</option><option>pine grove</option></select></label></div>
    <div className="lab-controls"><button disabled={busy} onClick={() => void inspect()}>Inspect composition</button>
      <button disabled={busy} onClick={() => void run()}>Run offline bundle</button>
      <button disabled={busy || !catalog?.recent.length} onClick={() => void reset()}>Clear comparisons</button></div>
    <LiveActionButton busy={busy} available={false} checkAvailability={async () => false} onRun={async () => {}}
      setup="This lab has no provisioned, pinned Managed agent, skill or MCP resource. First review and explicitly provision those resources in a separate setup workflow. Local Reload never provisions or changes a remote session. The exercise is offline only." />
    <p role="status" aria-label="Bundle status">{status}</p>
    {inventory && <section aria-label="Capability inventory"><h3>Capability inventory</h3>
      <p>Requested: commands {inventory.requested.commands.join(', ') || 'none'}; tools {inventory.requested.tools.join(', ') || 'none'};
        skills {inventory.requested.skills.join(', ') || 'none'}; MCP {inventory.requested.mcpServers.join(', ') || 'none'}.</p>
      <p>Fixture-resolved: commands {inventory.resolved.commands.join(', ') || 'none'}; tools {inventory.resolved.tools.join(', ') || 'none'};
        skills {inventory.resolved.skills.join(', ') || 'none'}; MCP {inventory.resolved.mcpServers.join(', ') || 'none'}.</p>
      <p>Worker tools: {inventory.resolved.workerTools.length}. Dynamic delegation: disabled. Remote session: none. Source: {inventory.resolvedSource}.</p>
      <p>{inventory.note}</p></section>}
    {result && <section aria-label="Bundle run result"><h3>Host effect ledger</h3>
      <p>Provider sends: {result.providerSends}. Host handler invocations: {result.handlerInvocations}.
        Skill file read by an agent: {String(result.skillReadObserved)}. MCP contacted: {String(result.mcpContacted)}.</p>
      {result.effectLedger.length ? result.effectLedger.map(row => <article key={row.tool}><p>{row.tool}({row.input.location}) returned {row.result.length} fictional record(s).</p>
        <ul>{row.result.map(item => <li key={item.species}>{item.species}: {item.count} at {item.location}</li>)}</ul></article>) : <p>No host tool effect: the bundle was disabled.</p>}
    </section>}
  </section>;
}
