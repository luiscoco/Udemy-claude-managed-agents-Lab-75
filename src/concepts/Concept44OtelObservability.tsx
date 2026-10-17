import { useEffect, useRef, useState } from 'react';
import { lab44SnapshotSchema } from '../../shared/lab44-otel-observability';

type Snapshot = ReturnType<typeof lab44SnapshotSchema.parse>;
const scenarios = ['successful-tool', 'denied-tool', 'failed-tool', 'missing-provider-span'] as const;
export default function Concept44OtelObservability() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof scenarios)[number]>('successful-tool');
  const [record, setRecord] = useState(false); const [snapshot, setSnapshot] = useState<Snapshot>();
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. Fictional prompt/tool content is redacted by default.');
  const [setup, setSetup] = useState<{ ready: boolean; enabled: boolean; missing: string[]; invalid: string[] }>();
  const [azureSetup, setAzureSetup] = useState<typeof setup>();
  useEffect(() => { void fetch('/api/c44/facts', { headers: { 'X-Lab-Owner': owner.current } }).then(response => response.json()).then(data => { setSetup(data.remoteSetup); setAzureSetup(data.azureSetup); }).catch(() => {}); }, []);
  async function post(route: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c44/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(route === 'export-azure' ? 20000 : 7000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    if (route === 'tracing' || route === 'rich') { const checked = lab44SnapshotSchema.parse(data); setSnapshot(checked);
      setStatus(`${checked.hostSpans.length} host spans; ${checked.providerEvents.length} provider event fixtures; effects ${checked.effectCount}.`); }
    else setStatus(JSON.stringify(data).slice(0, 800));
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Telemetry request failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab44-heading"><h2 id="lab44-heading">Host telemetry and provider event traces</h2>
    <p>A host exporter sends OTLP JSON spans to a bounded loopback collector. Managed model-span events are separate provider evidence; neither their presence nor absence proves remote OTLP export.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label><input type="checkbox" checked={record} onChange={event => { const value = event.target.checked; setRecord(value); void post('privacy', { recordFictionalContent: value }); }} /> Record fictional content</label>
      <button disabled={busy} onClick={() => void post('tracing', { mode: 'scripted', scenario })}>Run trace fixture</button>
      <button disabled={busy} onClick={() => void post('collector', {})}>Inspect collector</button></div>
    <h3>Remote collector setup</h3><p>Exports contain redacted authored host spans. Provider event fixtures are excluded.</p>
    {setup && <p>{setup.ready ? 'Configured; collector acceptance is checked only on export.' : `Setup required. ${!setup.enabled ? 'Set LAB44_REMOTE_EXPORT_ENABLED=1. ' : ''}Missing: ${setup.missing.join(', ') || 'none'}. Invalid: ${setup.invalid.join(', ') || 'none'}.`}</p>}
    <button disabled={busy || !snapshot || !setup?.ready} onClick={() => void post('export-remote', { runId: snapshot!.runId })}>Export redacted host trace</button>
    <h3>Azure Monitor setup</h3><p>The official Azure exporter sends authored span metadata only; it excludes recorded content and provider event fixtures.</p>
    {azureSetup && <p>{azureSetup.ready ? 'Configured; export starts only on your explicit click.' : `Setup required. ${!azureSetup.enabled ? 'Set LAB44_AZURE_EXPORT_ENABLED=1. ' : ''}Missing: ${azureSetup.missing.join(', ') || 'none'}. Invalid: ${azureSetup.invalid.join(', ') || 'none'}.`}</p>}
    <button disabled={busy || !snapshot || !azureSetup?.ready} onClick={() => void post('export-azure', { runId: snapshot!.runId })}>Export authored trace to Azure Monitor</button>
    {snapshot && <><p>Session <code>{snapshot.sessionId}</code>; thread <code>{snapshot.threadId}</code>; tool event <code>{snapshot.toolEventId}</code>.</p>
      <p>Host collector: {snapshot.collector.spanCount}/{snapshot.collector.maxSpans} spans; rejected batches {snapshot.collector.rejectedBatches}. Effect count: {snapshot.effectCount}. Provider calls: {snapshot.providerCalls}.</p>
      <h3>Host OpenTelemetry spans</h3><ul>{snapshot.hostSpans.map(item => <li key={item.spanId}>
        <strong>{item.name}</strong> ({item.status}) trace <code>{item.traceId}</code>, span <code>{item.spanId}</code>, parent <code>{item.parentSpanId ?? 'none'}</code>.
        Attributes: {Object.entries(item.attributes).map(([key, value]) => `${key}=${value}`).join('; ')}.</li>)}</ul>
      <h3>Provider event evidence</h3>{snapshot.providerEvents.length ? <ul>{snapshot.providerEvents.map(item => <li key={item.id}>
        {item.type} <code>{item.id}</code>; start ID {item.modelRequestStartId ?? 'none'} ({item.source}).</li>)}</ul> : <p>No provider model-span signal observed.</p>}
      <p>Remote OTLP export observed: {String(snapshot.remoteOtlpExportObserved)}. Fictional content recorded: {String(snapshot.recordFictionalContent)}.</p>
      <h3>Evidence</h3><ul>{snapshot.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
    <p role="status" aria-label="Lab 44 status">{status}</p>
    <p>Claude Code child telemetry environment settings do not apply to the cloud Managed harness.</p>
  </section>;
}
