import { useRef, useState } from 'react';
import { lab31Scenarios, lab31SnapshotSchema } from '../../shared/lab31-ask-user-question';
type Snapshot = ReturnType<typeof lab31SnapshotSchema.parse>;
export default function Concept31AskUserQuestion() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab31Scenarios)[number]>('deployment-target');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [selected, setSelected] = useState(''); const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. Offline questions never contact Anthropic.');
  const headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current };
  async function post(path: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c31/${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab31SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`${checked.status}; ${checked.resultSendCount} correlated result(s).`);
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Question request failed.'); } finally { setBusy(false); } }
  function answer(invalid = false) { if (!snapshot) return; const choice = invalid ? { selectedOption: 'unknown' } : custom.trim()
    ? { customText: custom.trim() } : { selectedOption: selected };
    void post('answer', { runId: snapshot.runId, sessionId: snapshot.sessionId, eventId: snapshot.eventId, ...choice }); }
  const control = (operation: 'inspect' | 'cancel' | 'wait') => { if (snapshot) void post('tools', { operation, runId: snapshot.runId,
    ...(operation === 'wait' ? { timeoutMs: 3000 } : {}) }); };
  return <section aria-labelledby="lab31-heading"><h2 id="lab31-heading">Host questions and correlated answers</h2>
    <p>An authored <code>agent.custom_tool_use</code> pauses on a closed <code>ask_user</code> tool. The host stores one bounded question and sends exactly one result tied to the event ID after validating the human answer.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab31Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => { setSelected(''); setCustom(''); void post('run', { mode: 'scripted', scenario }); }}>Start question</button></div>
    {snapshot && <><p>Run <code>{snapshot.runId}</code>; session <code>{snapshot.sessionId}</code>; event <code>{snapshot.eventId}</code>.</p>
      <section aria-label="Host question"><h3>{snapshot.question.question}</h3><fieldset disabled={busy || snapshot.status !== 'pending'}>
        <legend>Choose one answer</legend>{snapshot.question.options.map(option => <label key={option.id} style={{ display: 'block' }}>
          <input type="radio" name="lab31-option" value={option.id} checked={selected === option.id}
            onChange={() => { setSelected(option.id); setCustom(''); }} /> {option.label}</label>)}</fieldset>
        {snapshot.question.allowCustom && <label>Custom answer<input value={custom} maxLength={200} disabled={busy || snapshot.status !== 'pending'}
          onChange={event => { setCustom(event.target.value); setSelected(''); }} /></label>}
        <p>Expires: {snapshot.expiresAt}. Custom text: {snapshot.question.allowCustom ? 'allowed' : 'not allowed'}.</p>
        <div className="lab-controls"><button disabled={busy || snapshot.status !== 'pending' || !selected && !custom.trim()} onClick={() => answer()}>Submit answer</button>
          <button disabled={busy || snapshot.status !== 'pending'} onClick={() => answer(true)}>Try invalid answer</button>
          <button disabled={busy || snapshot.status !== 'pending'} onClick={() => control('cancel')}>Cancel question</button>
          <button disabled={busy} onClick={() => control('inspect')}>Inspect state</button>
          <button disabled={busy} onClick={() => control('wait')}>Wait for answer or expiry</button></div></section>
      <p>Answer: {snapshot.answer ?? 'pending'}. Unrelated tool effects: {snapshot.unrelatedToolEffects}. Provider calls: {snapshot.providerCalls}.</p>
      {snapshot.resultEvent && <pre style={{ overflowX: 'auto' }}>{JSON.stringify(snapshot.resultEvent, null, 2)}</pre>}
      <p>{snapshot.note}</p></>}
    <p role="status" aria-label="Lab 31 status">{status}</p>
    <p>Closing the browser wait releases that waiter; it does not approve any unrelated tool call. Live custom-tool execution is unavailable until a dedicated Managed agent is configured.</p>
  </section>;
}
