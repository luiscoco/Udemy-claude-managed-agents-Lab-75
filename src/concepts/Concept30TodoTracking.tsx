import { useRef, useState } from 'react';
import { lab30ResultSchema, lab30Scenarios } from '../../shared/lab30-todo-tracking';
type Board = ReturnType<typeof lab30ResultSchema.parse>;
export default function Concept30TodoTracking() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab30Scenarios)[number]>('three-step');
  const [board, setBoard] = useState<Board>(); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Host task state is independent of agent claims.');
  const [lastCall, setLastCall] = useState<object>();
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  async function post(path: string, input: object, record = false) { setBusy(true); try {
    const response = await fetch(`/api/c30/${path}`, { method: 'POST', headers, body: JSON.stringify(input), signal: AbortSignal.timeout(5000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const { latest, ...view } = data; const checked = lab30ResultSchema.parse(view); setBoard(checked); if (record) setLastCall(input);
    setStatus(latest ? `${latest.name}: ${latest.isError ? 'refused' : 'accepted'}; effect ${latest.effectApplied ? 'applied' : 'not applied'}.`
      : `${scenario}: ${checked.tasks.filter(task => task.status === 'done').length}/${checked.tasks.length} host tasks done.`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Task-board request failed.'); } finally { setBusy(false); } }
  function tool(name: 'update_task' | 'list_tasks' | 'get_task', input: object) { if (!board) return;
    void post('tools', { boardId: board.boardId, eventId: `sevt_${crypto.randomUUID().replaceAll('-', '')}`, name, input }, true); }
  const task = (index: number) => board?.tasks[index];
  const complete = (index: number, evidence: string) => { const selected = task(index); if (selected)
    tool('update_task', { id: selected.id, expectedVersion: selected.version, action: 'complete', evidence }); };
  return <section aria-labelledby="lab30-heading"><h2 id="lab30-heading">Host task board and completion gates</h2>
    <p>The host owns task IDs, versions, dependencies and completion evidence. A model claim cannot mark work complete without a validated tool result.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab30Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post('run', { mode: 'scripted', scenario })}>Start offline board</button></div>
    {board && <><p>Board <code>{board.boardId}</code>, version {board.boardVersion}. Agent claim: {board.agentClaim}</p>
      <div className="lab-controls"><button disabled={busy} onClick={() => complete(1, 'review-approved')}>Attempt review completion</button>
        <button disabled={busy} onClick={() => complete(0, 'draft-checked')}>Complete draft with evidence</button>
        <button disabled={busy} onClick={() => complete(2, 'published-link')}>Complete publish with evidence</button>
        <button disabled={busy} onClick={() => tool('list_tasks', {})}>List tasks</button>
        <button disabled={busy || !lastCall} onClick={() => lastCall && void post('tools', lastCall)}>Replay last event ID</button></div>
      <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Task</th><th>Depends on</th><th>Status</th><th>Version</th><th>Evidence</th></tr></thead><tbody>
        {board.tasks.map(item => <tr key={item.id}><td>{item.id}: {item.title}</td><td>{item.dependsOn.join(', ') || 'none'}</td>
          <td>{item.status}</td><td>{item.version}</td><td>{item.evidence ?? 'none'}</td></tr>)}</tbody></table></div>
      <h3>Correlated host results</h3><ol>{board.results.map(result => <li key={result.eventId}>
        <code>{result.eventId}</code> {result.name}: {result.isError ? 'is_error' : 'ok'}; effect {result.effectApplied ? 'applied' : 'blocked'}.
        <details><summary>Inspect result text</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{result.text}</pre></details></li>)}</ol>
      <p>Provider calls: {board.providerCalls}. {board.note}</p></>}
    <p role="status" aria-label="Lab 30 status">{status}</p>
    <p>TodoWrite and Claude Code task hooks are historical labels here. Live custom-tool execution needs a separately configured dedicated Managed agent.</p>
  </section>;
}
