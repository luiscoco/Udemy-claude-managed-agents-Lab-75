import { useRef, useState } from 'react';
import { prScenarioSchema, type PrScenario } from '../../shared/lab73-pr-reviewer-fixer';
type Snapshot = { id: string; state: string; source: string; numberedDiff: string; base: string; feature: string; commits: string[]; rounds: number;
  findings: { automated: { file: string; line: number; message: string }[]; human: { message: string }[] } | null; gates: { name: string; pass: boolean; detail: string }[]; report: string };
export default function Concept73PrReviewerFixer() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<PrScenario>('good-fix'); const [session, setSession] = useState<Snapshot>();
  const [status, setStatus] = useState('Ready. The host reviews and fixes a disposable local Git fixture.'), [busy, setBusy] = useState(false), [patch, setPatch] = useState('');
  async function api(path: string, body?: unknown) { const response = await fetch(`/api/c73/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? 'PR operation failed.'); return data; }
  async function run() { setBusy(true); setPatch(''); try { const created = await api('sessions', { scenario }) as Snapshot; setSession(created); setStatus('Running host review, path checks and actual tests.');
    const result = await api(`sessions/${created.id}/run`, {}) as Snapshot; setSession(result); setPatch((await api(`sessions/${created.id}/patch`)).patch); setStatus(`PR ${result.state}. ${result.commits.length} verified local fix commits.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'PR operation failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab73-heading"><h2 id="lab73-heading">An autonomous PR reviewer and fixer</h2><p>Review changed lines, route eligible findings, and verify a fix through host gates. Agent prose cannot authorize protected changes or Git commands.</p>
    <div className="lab-controls"><label>Scenario <select aria-label="Scenario" value={scenario} onChange={event => setScenario(event.target.value as PrScenario)}>{prScenarioSchema.options.map(value => <option key={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void run()}>Run PR review and fix</button><button disabled={!busy || !session} onClick={() => { if (session) void api(`sessions/${session.id}/cancel`, {}); }}>Cancel local work</button></div>
    <p role="status" aria-label="Lab 73 status">{status}</p>{session && <><p>Source: {session.source}. Session {session.id}. Rounds {session.rounds}/2.</p>
      <h3>Numbered changed lines</h3><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{session.numberedDiff}</pre>
      <h3>Findings disposition</h3><ul>{session.findings?.automated.map((finding, index) => <li key={index}>Fixer: {finding.file}:{finding.line} — {finding.message}</li>)}{session.findings?.human.map((finding, index) => <li key={index}>Human: {finding.message}</li>)}</ul>
      <h3>Host verification gates</h3><div style={{ overflowX: 'auto' }}><table style={{ minWidth: '36rem' }}><thead><tr><th>Gate</th><th>Outcome</th><th>Evidence</th></tr></thead><tbody>{session.gates.map((gate, index) => <tr key={index}><td>{gate.name}</td><td>{gate.pass ? 'PASS' : 'FAIL'}</td><td><pre style={{ whiteSpace: 'pre-wrap' }}>{gate.detail}</pre></td></tr>)}</tbody></table></div>
      <p>Local fix commits: {session.commits.join(', ') || 'none'}. Main base: <code style={{ overflowWrap: 'anywhere' }}>{session.base}</code>.</p>
      <details><summary>Reviewable local patch</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{patch}</pre></details><details><summary>Handoff report and suggested commands</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{session.report}</pre></details></>}
    <p>Offline scripted roles use real Git and Node tests. No remote push, PR publication or Anthropic call occurs. Fixture worktrees remain available for inspection. Local owner headers are not production authentication.</p></section>;
}
