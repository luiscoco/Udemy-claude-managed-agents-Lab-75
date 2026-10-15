import { useEffect, useRef, useState } from 'react';
import { lab18AvailabilityResultSchema, lab18PlatformSchema, lab18ReportSchema, lab18Scenarios, lab18RunSchema } from '../../shared/lab18-sandbox';
import type { Lab18Availability, Lab18Platform, Lab18Report } from '../../shared/lab18-sandbox';
import { LiveActionButton } from '../components/LiveActionButton';
import { streamPost } from '../lib/sse';

export default function Concept18Sandbox() {
  const owner = useRef(crypto.randomUUID()), controller = useRef<AbortController | null>(null), mounted = useRef(true);
  const [platform, setPlatform] = useState<Lab18Platform>(), [availability, setAvailability] = useState<Lab18Availability>();
  const [report, setReport] = useState<Lab18Report>(), [scenario, setScenario] = useState<(typeof lab18Scenarios)[number]>('allowed-mount');
  const [status, setStatus] = useState('Ready. Platform inspection is local and starts no session.'), [busy, setBusy] = useState(false);
  const headers = { 'X-Lab-Owner': owner.current, 'Content-Type': 'application/json' };
  async function loadPlatform() { const response = await fetch('/api/c18/platform', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Platform HTTP ${response.status}`);
    const data = lab18PlatformSchema.parse(await response.json()); if (mounted.current) setPlatform(data); return data; }
  useEffect(() => { mounted.current = true; void loadPlatform().catch(() => { if (mounted.current) setStatus('Start the backend to inspect platform configuration.'); });
    return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  async function check(mode: 'scripted' | 'live') {
    if (busy) return; setBusy(true);
    try { const response = await fetch('/api/c18/availability', { method: 'POST', headers,
      body: JSON.stringify({ mode, scenario: mode === 'live' ? 'allowed-mount' : scenario }) });
      if (!response.ok) throw new Error(`Availability HTTP ${response.status}`);
      const data = lab18AvailabilityResultSchema.parse(await response.json()); setAvailability(data);
      setStatus(data.reason); return data.ready;
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Availability failed.'); return false; }
    finally { setBusy(false); }
  }
  async function run(mode: 'scripted' | 'live') {
    if (busy || controller.current) return; setBusy(true);
    const abort = new AbortController(); controller.current = abort;
    try {
      const body = lab18RunSchema.parse({ mode, scenario: mode === 'live' ? 'allowed-mount' : scenario, deadlineSeconds: 30, budgetCents: 50 });
      setStatus(mode === 'live' ? 'Rechecking the cloud policy before one billed remote pwd diagnostic…' : 'Running the disposable host policy test…');
      if (mode === 'scripted') {
        const response = await fetch('/api/c18/run', { method: 'POST', headers, body: JSON.stringify(body), signal: abort.signal });
        if (!response.ok) { const data = await response.json(); throw new Error(data.error?.message ?? `Run HTTP ${response.status}`); }
        const data = lab18ReportSchema.parse(await response.json()); setReport(data); setAvailability(data.availability); setStatus(data.message);
      } else {
        const result = await streamPost('/api/c18/run', body, { headers, signal: abort.signal, idleMs: 30000, deadlineMs: 160000,
          resultSchema: lab18ReportSchema });
        if (result.kind === 'success') { setReport(result.result); setAvailability(result.result.availability); setStatus(result.result.message); }
        else setStatus('The local run was cancelled or incomplete. Check remote cleanup before trying again.');
      }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Diagnostic failed.'); }
    finally { controller.current = null; setBusy(false); }
  }
  return <section aria-labelledby="lab18-heading"><h2 id="lab18-heading">Cloud sandbox and host boundaries</h2>
    <p>Inspect server configuration, test a disposable host path policy offline, then optionally check the cloud environment and request one remotely approved command.</p>
    <div className="lab-controls"><label>Offline policy scenario<select aria-label="Offline policy scenario" value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab18Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void check('scripted')}>Check offline availability</button>
      <button disabled={busy} onClick={() => void run('scripted')}>Run offline host test</button>
      <button disabled={busy} onClick={() => void check('live')}>Inspect live environment</button>
      {busy && <button onClick={() => controller.current?.abort()}>Cancel active run</button>}</div>
    <LiveActionButton busy={busy} available={Boolean(platform?.liveReady)} checkAvailability={async () => (await loadPlatform()).liveReady}
      onRun={() => void run('live')} keyIsolated
      setup="Configure the isolated server API key, single-agent base, restricted cloud environment and MANAGED_LIVE_ENABLED=true. Run live creates one billed session and approves only the exact pwd command in the remote sandbox." />
    <p role="status" aria-label="Sandbox experiment status">{status}</p>
    {platform && <div aria-label="Configured platform"><h3>Configured platform, no session</h3><p>Environment ID: <code>{platform.environmentId ?? 'missing'}</code>. Environment version: {platform.environmentVersion}. Agent version pin: {platform.agentVersionPin ?? 'latest resolved on run'}. Live setup: {platform.liveReady ? 'configured' : 'unavailable'}.</p>
      <p>Approved offline host mount: <code>{platform.approvedMounts.join(', ')}</code>. Live diagnostic requests no file mount. Authored network: {platform.authoredNetwork.type}, allowed hosts: {platform.authoredNetwork.allowedHosts.length}, MCP egress: disabled, package managers: disabled.</p><p>{platform.note}</p></div>}
    {availability && <article aria-label="Environment availability"><h3>Availability evidence</h3><p>Source: {availability.source}. Ready: {String(availability.ready)}. Environment: <code>{availability.environmentId ?? 'missing'}</code>. Updated at: {availability.environmentUpdatedAt ?? 'not observed'}. Network: {availability.networking}. Availability check started a session: no.</p><p>{availability.reason}</p></article>}
    {report && <div aria-label="Sandbox evidence"><h3>Effect evidence</h3><p>Source: {report.source}. Scenario: {report.scenario}. Host checked path: <code>{report.host.checkedPath}</code>. Allowed: {String(report.host.allowed)}. Read calls: {report.host.readCalls}. Network calls: {report.host.networkCalls}.</p>
      <p>Host fixture: {report.host.fixtureId ?? 'none'}. SHA-256: <code>{report.host.fileHash ?? 'none'}</code>. {report.host.effect}</p>
      <h3>Remote command evidence</h3><p>Session: <code>{report.remote.sessionId ?? 'not started'}</code>. Outcome: {report.remote.outcome}. Observed pwd: {String(report.remote.commandObserved)}. Successful tool result: {String(report.remote.commandSucceeded)}. Confirmations: {report.remote.confirmations}. Cleanup: {report.remote.cleanup}. Interruption: {report.remote.interruption}.</p>
      {report.remote.toolUses.length ? <ul>{report.remote.toolUses.map((use, index) => <li key={index}>{use.name}: <code>{use.command || '(no command)'}</code>; {use.state}; result: {use.result ?? 'not observed'}</li>)}</ul> : <p>No remote tool call observed.</p>}
      <p>{report.message}</p></div>}
  </section>;
}
