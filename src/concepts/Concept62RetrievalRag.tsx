import { useRef, useState } from 'react';
import { lab62QuerySchema } from '../../shared/lab62-retrieval-rag';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab62QuerySchema>['scenario'];
type Result = { scenario: Scenario; eventId: string; retrieved: { id: string; title: string; heading: string;
  text: string; score: number; trust: string }[]; report: { answer: string; evidence: { id: string; quote: string }[] };
  verification: { verified: boolean; citationsValid: boolean; reason: string }; providerCalls: number; note: string };
export default function Concept62RetrievalRag() {
  const owner = useRef(crypto.randomUUID()); const [question, setQuestion] = useState('What is the return period for unused items?');
  const [scenario, setScenario] = useState<Scenario>('grounded'); const [result, setResult] = useState<Result>();
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. Retrieval is lexical and tenant-filtered.');
  async function run() { setBusy(true); try { const response = await fetch('/api/c62/query', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
    body: JSON.stringify({ question, scenario }), signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    setResult(data as Result); setStatus(`${scenario}: ${data.verification.verified ? 'verified' : 'rejected'} — ${data.verification.reason}`); }
  catch (error) { setStatus(error instanceof Error ? error.message : 'Query failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab62-heading"><h2 id="lab62-heading">Retrieval RAG through custom tools</h2>
    <p>Search current Acme policy chunks and validate final answer citations against evidence returned in the same run.</p>
    <div className="lab-controls"><label>Question<input value={question} maxLength={200}
      onChange={event => setQuestion(event.target.value)} /></label>
      <label>Report scenario<select value={scenario}
        onChange={event => setScenario(lab62QuerySchema.shape.scenario.parse(event.target.value))}>
        {lab62QuerySchema.shape.scenario.options.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Run retrieval fixture</button></div>
    {result && <><p>Tool event: <code>{result.eventId}</code>. Retrieved {result.retrieved.length} chunks;
      citation check: {String(result.verification.citationsValid)}; verified: {String(result.verification.verified)};
      provider calls: {result.providerCalls}.</p>
      <h3>Filtered retrieval</h3>{result.retrieved.length ? <ol>{result.retrieved.map(chunk => <li key={chunk.id}>
        <strong>{chunk.id}</strong> ({chunk.title} / {chunk.heading}, score {chunk.score}, {chunk.trust}): {chunk.text}</li>)}</ol> : <p>No matches.</p>}
      <h3>Answer and cited evidence</h3><p>{result.report.answer}</p><ul>{result.report.evidence.map(item =>
        <li key={item.id}><code>{item.id}</code>: “{item.quote}”</li>)}</ul><p>{result.note}</p></>}
    <p role="status" aria-label="Lab 62 status">{status}</p>
    <p>Archived and foreign-tenant documents are filtered before ranking. Imported instructions remain untrusted text.</p>
  </section>;
}
