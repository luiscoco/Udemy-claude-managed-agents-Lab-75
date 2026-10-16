import { useRef, useState } from 'react';
import { lab59StrategySchema } from '../../shared/lab59-model-routing';
import type { z } from 'zod';

type Strategy = z.infer<typeof lab59StrategySchema>;
type Result = { strategy: Strategy; tasksTotal: number; tasksAttempted: number; correctCount: number;
  sessionsCreated: number; spendUnits: number; costPerCorrect: number | null; medianTimeMs: number;
  assumedTokens: number; stoppedByBudget: boolean; providerCalls: number; note: string;
  taskResults: { taskId: string; difficulty: string; correct: boolean; complete: boolean;
    attempts: { sessionId: string; role: string; tier: string; model: string; effort: string;
      answer: string; confidence: number; verified: boolean; assumedSpendUnits: number }[] }[] };
export default function Concept59ModelRouting() {
  const owner = useRef(crypto.randomUUID()); const [strategy, setStrategy] = useState<Strategy>('rule');
  const [budget, setBudget] = useState(1000); const [result, setResult] = useState<Result>();
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. Routing figures are authored offline assumptions.');
  async function run() { setBusy(true); try { const response = await fetch('/api/c59/run', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
    body: JSON.stringify({ strategy, budgetUnits: budget }), signal: AbortSignal.timeout(10000) }); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    setResult(data as Result); setStatus(`${strategy}: ${data.correctCount} of ${data.tasksTotal} correct; ${data.sessionsCreated} sessions counted.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Routing fixture failed.'); } finally { setBusy(false); } }
  return <section aria-labelledby="lab59-heading"><h2 id="lab59-heading">Routing with verified outcomes</h2>
    <p>Compare seven offline strategies over 13 checkable tasks. The host answer key verifies outcomes independently of model confidence.</p>
    <div className="lab-controls"><label>Routing strategy<select value={strategy}
      onChange={event => setStrategy(lab59StrategySchema.parse(event.target.value))}>
      {lab59StrategySchema.options.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Assumed spend-unit budget<input type="number" min={100} max={10000} value={budget}
        onChange={event => setBudget(Number(event.target.value))} /></label>
      <button disabled={busy} onClick={() => void run()}>Run routing fixture</button></div>
    {result && <><p>Correct: {result.correctCount}/{result.tasksTotal}; sessions: {result.sessionsCreated}; assumed spend: {result.spendUnits};
      cost per correct: {result.costPerCorrect?.toFixed(2) ?? 'n/a'} units; median task time: {result.medianTimeMs} ms;
      assumed tokens: {result.assumedTokens}; budget stopped: {String(result.stoppedByBudget)}; provider calls: {result.providerCalls}.</p>
      <ol>{result.taskResults.map(task => <li key={task.taskId}><strong>{task.taskId}</strong> ({task.difficulty}):
        {task.complete ? task.correct ? ' verified correct' : ' verified incorrect' : ' incomplete'};
        {task.attempts.map(attempt => <span key={attempt.sessionId}> {attempt.role} {attempt.tier} in {attempt.sessionId},
          answer {attempt.answer}, confidence {attempt.confidence}, key check {String(attempt.verified)};</span>)}</li>)}</ol>
      <p>{result.note}</p></>}
    <p role="status" aria-label="Lab 59 status">{status}</p>
    <p>Each tier represents a separately identified hypothetical Managed session. No query model switch or live price guarantee is claimed.</p>
  </section>;
}
