import { useEffect, useRef, useState } from 'react';

type Result = { outcome: string; source: string; verified: boolean; calls: number; events: string[];
  product?: string; price?: string; confirmation?: string | null; proofId?: string };
export default function Concept64BrowserPlaywrightMcp() {
  const owner = useRef(crypto.randomUUID()); const [result, setResult] = useState<Result>();
  const [proofUrl, setProofUrl] = useState<string>();
  const [status, setStatus] = useState('Ready to run the local fixture browser.'); const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (proofUrl) URL.revokeObjectURL(proofUrl); }, [proofUrl]);
  async function run(scenario: string) { setBusy(true); setResult(undefined); setProofUrl(undefined);
    setStatus(`Running ${scenario} in a fresh local browser…`);
    try { const response = await fetch('/api/c64/run', { method: 'POST', headers: { 'Content-Type': 'application/json',
      'X-Lab-Owner': owner.current }, body: JSON.stringify({ scenario }), signal: AbortSignal.timeout(30000) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
      setResult(data as Result); setStatus(`${data.outcome}: ${data.verified ? 'browser state verified' : 'no verified browser proof'}.`);
      if (data.proofId) { const proof = await fetch(`/api/c64/artifacts/${data.proofId}/proof.png`,
        { headers: { 'X-Lab-Owner': owner.current } });
        if (proof.ok) setProofUrl(URL.createObjectURL(await proof.blob())); }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Browser experiment failed.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="lab64-heading"><h2 id="lab64-heading">Browser tools across host and cloud</h2>
    <p>Run a real local fixture browser through pinned Playwright MCP. The host checks the DOM and captures a screenshot.</p>
    <div className="lab-controls"><button disabled={busy} onClick={() => void run('inspect-product')}>Inspect product</button>
      <button disabled={busy} onClick={() => void run('fill-form')}>Fill fictional form</button>
      <button disabled={busy} onClick={() => void run('blocked-navigation')}>Try blocked navigation</button>
      <button disabled={busy} onClick={() => void run('missing-browser')}>Missing browser</button></div>
    <p role="status" aria-label="Lab 64 status">{status}</p>
    {result && <><p>Source: {result.source}; MCP calls: {result.calls}; verified: {String(result.verified)}.</p>
      {result.product && <p>Product: {result.product}; {result.price}.</p>}{result.confirmation && <p>{result.confirmation}</p>}
      <ol>{result.events.map((event, index) => <li key={index}>{event}</li>)}</ol>
      {proofUrl && <figure><img style={{ maxWidth: '100%' }} alt="Screenshot of the verified local fixture page" src={proofUrl} />
        <figcaption>Fixture screenshot captured after host DOM checks.</figcaption></figure>}</>}
    <p>Cloud Managed sessions cannot reach host localhost or spawn this host MCP connection. A separately reachable remote browser would require separate configuration.</p>
  </section>;
}
