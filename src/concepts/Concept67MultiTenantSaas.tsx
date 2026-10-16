import { useEffect, useRef, useState } from 'react';

type Tenant = 'acme' | 'birch';
type Run = { id: string; sessionId: string; tenant: string; project: string; state: string; reservation: number };
type Usage = { tenant: string; limit: number; spent: number; reserved: number; active: number;
  ledger: { runId: string; event: string; units: number }[] };
export default function Concept67MultiTenantSaas() {
  const tokens = useRef<Partial<Record<Tenant, string>>>({}); const [signed, setSigned] = useState(false);
  const [runs, setRuns] = useState<Partial<Record<Tenant, Run>>>({}); const [usage, setUsage] = useState<Partial<Record<Tenant, Usage>>>({});
  const [scenario, setScenario] = useState('normal'); const [status, setStatus] = useState('Ready. Principal selectors simulate authentication locally.');
  const [checks, setChecks] = useState<string[]>([]); const [busy, setBusy] = useState(false);
  async function request(tenant: Tenant, path: string, body?: unknown) { const response = await fetch(`/api/c67/${path}`,
    { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.current[tenant] ?? ''}` }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json(); return { response, data };
  }
  useEffect(() => { if (!signed) return;
    let alive = true;
    const refresh = async () => { for (const tenant of ['acme', 'birch'] as const) {
      const result = await request(tenant, 'usage'); if (alive && result.response.ok) setUsage(current => ({ ...current, [tenant]: result.data as Usage }));
      if (runs[tenant]) { const result = await request(tenant, `runs/${runs[tenant]!.id}`);
        if (alive && result.response.ok) setRuns(current => ({ ...current, [tenant]: result.data as Run })); }
    } };
    const timer = setInterval(() => { void refresh().catch(() => {}); }, 500); void refresh().catch(() => {});
    return () => { alive = false; clearInterval(timer); };
  }, [signed, runs.acme?.id, runs.birch?.id]);
  async function login() { setBusy(true); try {
    for (const [tenant, principal] of [['acme', 'alice'], ['birch', 'bob']] as const) {
      const response = await fetch('/api/c67/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ principal }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? 'Authentication failed.');
      tokens.current[tenant] = data.token;
    }
    setSigned(true); setStatus('Synthetic Alice/Acme and Bob/Birch principals authenticated by host token mapping.');
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Authentication failed.'); } finally { setBusy(false); } }
  async function start(tenant: Tenant) { const result = await request(tenant, 'runs', { requestId: crypto.randomUUID(), scenario });
    if (!result.response.ok) throw new Error(`${tenant}: ${result.data.error?.message ?? result.response.status}`);
    setRuns(current => ({ ...current, [tenant]: result.data as Run })); return result.data as Run;
  }
  async function act(action: 'both' | 'acme' | 'cross' | 'cancel') { setBusy(true); try {
    if (action === 'both') { await Promise.all([start('acme'), start('birch')]); setStatus('Both tenants started with separate reservations.'); }
    else if (action === 'acme') { await start('acme'); setStatus('Acme run admitted.'); }
    else if (action === 'cancel') { if (!runs.acme) return; const result = await request('acme', `runs/${runs.acme.id}/cancel`, {});
      setStatus(result.response.ok ? 'Acme cancellation requested by its own principal.' : result.data.error?.message); }
    else { if (!runs.birch) return; const target = runs.birch;
      const paths = [`runs/${target.id}`, `sessions/${target.sessionId}`, 'sources/policy-birch', `runs/${target.id}/transcript`, `runs/${target.id}/cancel`];
      const results: string[] = [];
      for (const [index, path] of paths.entries()) { const result = await request('acme', path, path.endsWith('/cancel') ? {} : undefined);
        results.push(`${['run', 'session', 'source', 'transcript', 'cancellation'][index]}: HTTP ${result.response.status}`); }
      setChecks(results); setStatus('Cross-tenant probes completed; inspect the five refusals.');
    }
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Workshop action failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab67-heading"><h2 id="lab67-heading">A multi-tenant SaaS architecture</h2>
    <p>Use two synthetic principals to inspect tenant-scoped sessions, project sources, transcripts, cancellation and quota reservations.</p>
    <div className="lab-controls"><button disabled={busy || signed} onClick={() => void login()}>Simulate both sign-ins</button>
      <label>Runner scenario <select value={scenario} onChange={event => setScenario(event.target.value)}>
        <option value="normal">Normal</option><option value="failure">Failure releases reservation</option><option value="hold">Hold for concurrency probes</option></select></label>
      <button disabled={busy || !signed} onClick={() => void act('both')}>Run both tenants</button>
      <button disabled={busy || !signed} onClick={() => void act('acme')}>Try another Acme run</button>
      <button disabled={busy || !runs.birch} onClick={() => void act('cross')}>Probe Birch as Acme</button>
      <button disabled={busy || !runs.acme} onClick={() => void act('cancel')}>Cancel own Acme run</button></div>
    <p role="status" aria-label="Lab 67 status">{status}</p>
    {(['acme', 'birch'] as const).map(tenant => <article key={tenant}><h3>{tenant === 'acme' ? 'Alice / Acme' : 'Bob / Birch'}</h3>
      {runs[tenant] && <p>Run: <code>{runs[tenant]!.id}</code>; session: <code>{runs[tenant]!.sessionId}</code>;
        state: {runs[tenant]!.state}; reservation: {runs[tenant]!.reservation}.</p>}
      {usage[tenant] && <><p>Quota: {usage[tenant]!.spent} spent + {usage[tenant]!.reserved} reserved / {usage[tenant]!.limit}; active: {usage[tenant]!.active}.</p>
        <ol>{usage[tenant]!.ledger.map((entry, index) => <li key={index}>{entry.event}: {entry.units} units, run {entry.runId}.</li>)}</ol></>}
    </article>)}
    <ul>{checks.map(check => <li key={check}>{check}</li>)}</ul>
    <p>These selectors simulate login. Production identity, durable stores and distributed reservations replace the local workshop mapping.</p>
  </section>;
}
