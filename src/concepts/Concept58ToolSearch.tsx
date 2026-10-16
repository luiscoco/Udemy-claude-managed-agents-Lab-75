import { useRef, useState } from 'react';
import { lab58SearchResultSchema, lab58VariantSchema } from '../../shared/lab58-tool-search';
import type { z } from 'zod';

type Result = z.infer<typeof lab58SearchResultSchema>;
type Variant = z.infer<typeof lab58VariantSchema>;
export default function Concept58ToolSearch() {
  const owner = useRef(crypto.randomUUID()); const [query, setQuery] = useState('refund invoice INV-2042');
  const [variant, setVariant] = useState<Variant>('good'); const [result, setResult] = useState<Result>();
  const [run, setRun] = useState<unknown>(); const [status, setStatus] = useState('Ready. Search is a host simulator.');
  const [busy, setBusy] = useState(false);
  async function post(path: string, body: unknown) { const response = await fetch(`/api/c58/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`); return data; }
  async function search() { setBusy(true); try { const data = lab58SearchResultSchema.parse(await post('search', { query, variant, limit: 5 }));
    setResult(data); setStatus(`${data.results.length} definitions returned; no native tools loaded.`); }
  catch (error) { setStatus(error instanceof Error ? error.message : 'Search failed.'); } finally { setBusy(false); } }
  async function dispatch(scenario: 'authorized' | 'unauthorized') { setBusy(true); try {
    const data = await post('run', { scenario, name: 'billing_refund_invoice', input: { invoiceId: 'INV-2042', amountCents: 1250 } });
    setRun(data); setStatus(`${scenario}: ${(data as { reason: string }).reason}`); }
  catch (error) { setStatus(error instanceof Error ? error.message : 'Dispatch failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab58-heading"><h2 id="lab58-heading">Tool catalogs and bounded discovery</h2>
    <p>Search 64 authored definitions with a transparent host scorer, then dispatch through a fixed closed-schema host tool.</p>
    <div className="lab-controls"><label>Search query<input value={query} maxLength={120} onChange={event => setQuery(event.target.value)} /></label>
      <label>Metadata<select value={variant} onChange={event => setVariant(lab58VariantSchema.parse(event.target.value))}>
        <option value="good">Good</option><option value="vague">Vague</option></select></label>
      <button disabled={busy} onClick={() => void search()}>Search catalog</button>
      <button disabled={busy} onClick={() => void dispatch('unauthorized')}>Try unauthorized refund</button>
      <button disabled={busy} onClick={() => void dispatch('authorized')}>Run authorized fixture</button></div>
    {result && <><p>Initial names estimate: {result.estimatedInitialTokens} tokens. Returned definitions estimate: {result.estimatedReturnedTokens} tokens. Provider calls: {result.providerCalls}.</p>
      <ol>{result.results.map(tool => <li key={tool.name}><strong>{tool.name}</strong> (score {tool.score}): {tool.hint}. {tool.description}</li>)}</ol>
      <p>{result.note}</p></>}
    {run !== undefined && <pre className="lab-json">{JSON.stringify(run, null, 2)}</pre>}
    <p role="status" aria-label="Lab 58 status">{status}</p>
    <p>Search results are data. They neither register native tools nor grant permission; the dispatcher validates the selected schema and trusted host context.</p>
  </section>;
}
