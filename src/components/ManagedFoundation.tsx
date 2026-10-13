import { useEffect, useRef, useState } from 'react';
import { managedProgressSchema, managedResultSchema } from '../../shared/managed';
import type { ManagedProgress, ManagedResult } from '../../shared/managed';
import { streamPost } from '../lib/sse';
import adapterSource from '../../server/lib/managed-port.ts?raw';
import contractSource from '../../shared/managed.ts?raw';
import configSource from '../../server/lib/managed-config.ts?raw';

export function ManagedFoundation() {
  const [mode, setMode] = useState<'scripted' | 'live'>('scripted');
  const [pending, setPending] = useState(false);
  const [liveReady, setLiveReady] = useState(false);
  const [events, setEvents] = useState<ManagedProgress[]>([]);
  const [result, setResult] = useState<ManagedResult>();
  const [status, setStatus] = useState('Ready. Start with the scripted walkthrough.');
  const [setup, setSetup] = useState('Live execution requires a server API key, agent ID and environment ID.');
  const controller = useRef<AbortController | null>(null);
  const setupController = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); setupController.current?.abort(); }; }, []);
  async function checkSetup() {
    const request = new AbortController(); setupController.current?.abort(); setupController.current = request;
    const timeout = setTimeout(() => request.abort(), 5000);
    try {
      const response = await fetch('/api/managed/setup', { signal: request.signal });
      if (!response.ok) throw new Error();
      const data = await response.json() as { configured: boolean; liveReady: boolean; liveEnabled: boolean; missing: string[]; invalid: string[]; budgetCents: string };
      if (mounted.current && !request.signal.aborted) setLiveReady(data.liveReady);
      if (mounted.current && !request.signal.aborted) setSetup(data.configured
        ? `Configured locally. Live ${data.liveEnabled ? 'enabled' : 'disabled'}. Session budget: ${data.budgetCents} US cents. Provider access has not been verified.`
        : `Missing server settings: ${data.missing.join(', ')}. Invalid settings: ${data.invalid.join(', ')}.`);
    } catch { if (mounted.current && !request.signal.aborted) setSetup('Could not check configuration. Start the backend.'); }
    finally { clearTimeout(timeout); }
  }
  async function run() {
    if (controller.current) return;
    const request = new AbortController(); controller.current = request;
    setPending(true); setResult(undefined); setEvents([]); setStatus('Running foundation check…');
    try {
      const outcome = await streamPost('/api/managed/stream', { mode }, {
        signal: request.signal, idleMs: 25000, deadlineMs: 125000, resultSchema: managedResultSchema,
        onEvent: (type, data) => { if (type === 'progress' && mounted.current) {
          const event = managedProgressSchema.parse(data); setEvents(current => [...current.slice(-99), event]);
        } },
      });
      if (!mounted.current) return;
      if (outcome.kind === 'success') { setResult(outcome.result); setStatus(outcome.result.message); }
      else setStatus('Cancelled locally. The backend requests remote interruption and cleanup; check the session in Claude Console if live.');
    } catch (error) { if (mounted.current) setStatus(error instanceof Error ? error.message : 'Check failed.'); }
    finally { controller.current = null; if (mounted.current) setPending(false); }
  }
  const sessionId = result?.sessionId ?? events.find(event => event.sessionId)?.sessionId;
  return <section aria-labelledby="managed-foundation-heading">
    <p className="eyebrow">FOUNDATION CHECK</p><h2 id="managed-foundation-heading">Follow a managed session.</h2>
    <p>Trace creation, events and the final response before the Labs are added. The check asks Claude to explain agents, environments, sessions and events.</p>
    <label htmlFor="managed-mode">Execution mode</label>{' '}
    <select id="managed-mode" value={mode} disabled={pending} onChange={event => setMode(event.target.value as 'scripted' | 'live')}>
      <option value="scripted">Scripted walkthrough — no API calls</option><option value="live">Live Managed Agents — billed API execution</option>
    </select>
    <p>{mode === 'scripted' ? 'Authored events demonstrate the flow. They do not measure Claude behavior.' : 'Creates a new remote session using server configuration. The budget is checked between model requests and can be exceeded by the final request.'}</p>
    <details><summary>Live setup</summary><p>Follow docs/managed-setup.md to enter your API key locally and configure CLAUDE_MANAGED_AGENT_ID, CLAUDE_MANAGED_ENVIRONMENT_ID and MANAGED_LIVE_ENABLED. Restart the backend. Offline mode needs no credentials.</p><button onClick={() => void checkSetup()}>Check live setup</button><p role="status">{setup}</p></details>
    {mode === 'live' && !liveReady && <p>Configure the server API key, resource IDs, valid limits and MANAGED_LIVE_ENABLED=true, then click Check live setup.</p>}
    <div className="actions"><button disabled={pending || (mode === 'live' && !liveReady)} onClick={() => void run()}>Run foundation check</button>{pending && <button onClick={() => controller.current?.abort()}>Cancel foundation check</button>}</div>
    <p role="status" aria-live="polite">{status}</p>
    {sessionId && <p>Remote session: <code>{sessionId}</code></p>}
    {events.length > 0 && <details open><summary>Session events ({events.length})</summary><ol>{events.map((event, index) => <li key={index}><strong>{event.type}</strong> <span className="muted">{event.source}</span>{event.text && <pre>{event.text}</pre>}</li>)}</ol></details>}
    {result && <><p>Output verification: {result.verified ? 'passed' : 'not passed'}. Session cleanup: {result.cleanup}.</p><details open><summary>Result and usage</summary><pre>{JSON.stringify(result, null, 2)}</pre></details></>}
    <details><summary>Managed API adapter source</summary><pre>{adapterSource}</pre></details>
    <details><summary>Managed configuration source</summary><pre>{configSource}</pre></details>
    <details><summary>Managed execution contracts</summary><pre>{contractSource}</pre></details>
  </section>;
}
