import { useRef, useState } from 'react';
import { lab53ResultSchema, lab53ScenarioSchema } from '../../shared/lab53-debugging';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab53ScenarioSchema>;
type Result = z.infer<typeof lab53ResultSchema>;
const labels: Record<Scenario, string> = {
  'valid-control': 'Valid control', 'malformed-report': 'Malformed report', 'denied-tool': 'Denied tool',
  'missing-idle': 'Missing idle event', 'local-turn-limit': 'Local turn limit', 'stream-eof': 'Stream EOF',
  'cleanup-timeout': 'Cleanup timeout',
};
export default function Concept53Debugging() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<Scenario>('malformed-report');
  const [result, setResult] = useState<Result>(); const [status, setStatus] = useState('Ready. Trace fixtures make zero provider calls.');
  const [busy, setBusy] = useState(false);
  async function run() { setBusy(true); try { const response = await fetch('/api/c53/run', { method: 'POST', headers: {
    'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, body: JSON.stringify({ scenario }),
    signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab53ResultSchema.parse(data); setResult(checked); setStatus(checked.cause);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Trace run failed.'); } finally { setBusy(false); } }
  async function reload() { if (!result) return; setBusy(true); try { const response = await fetch(`/api/c53/runs/${result.id}`, {
    headers: { 'X-Lab-Owner': owner.current }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Trace lookup HTTP ${response.status}`);
    setResult(lab53ResultSchema.parse(await response.json())); setStatus('Owned trace retrieved without replaying effects.');
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Trace lookup failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab53-heading"><h2 id="lab53-heading">Debug session and host traces</h2>
    <p>Locate the first useful event or host decision in an authored Managed-shaped trace. Redacted event summaries, handler decisions and ledger effects stay separate.</p>
    <div className="lab-controls"><label>Failure scenario<select value={scenario} disabled={busy}
      onChange={event => setScenario(lab53ScenarioSchema.parse(event.target.value))}>
      {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Run trace</button>
      <button disabled={busy || !result} onClick={() => void reload()}>Inspect saved run</button></div>
    {result && <><p>Local run <code>{result.localRunId}</code>; remote fixture session <code>{result.remoteSessionId}</code>;
      event outcome {result.eventOutcome}; remote stop {result.remoteStop}; cleanup {result.cleanup}.</p>
      <p>Resolved fixture tools: {result.resolvedConfig.tools.join(', ')}. Agent version unknown offline; built-ins, MCP and skills disabled.</p>
      <p><strong>First useful evidence: trace #{result.firstUsefulSequence}.</strong> {result.cause}</p>
      <p>History gap: {String(result.historyGap)}; final report valid: {result.reportValid === null ? 'not evaluated' : String(result.reportValid)};
        host refund ledger: {result.refundLedgerCount}; provider calls: {result.providerCalls}.</p>
      <div className="lab-results"><h3>Bounded redacted trace</h3><ol>{result.trace.map(entry =>
        <li key={entry.sequence} style={entry.sequence === result.firstUsefulSequence ? { borderLeft: '3px solid #dc7b32', paddingLeft: 8 } : undefined}>
          <strong>{entry.kind}</strong> · <code>{entry.id}</code> · {entry.summary}
          {entry.threadId && <span> · thread <code>{entry.threadId}</code></span>}</li>)}</ol></div>
      <p>Replay through the shared consumer: {result.replay.outcome}; authoritative messages {result.replay.authoritativeMessages};
        recorded effects match host ledger: {String(result.replay.effectsMatch)}.</p></>}
    <p role="status" aria-label="Lab 53 status">{status}</p>
    <p>Stream EOF and local cleanup timeout leave the remote stop unconfirmed. Neither proves that the remote turn completed or failed.</p>
  </section>;
}
