import { useRef, useState } from 'react';
import { lab38Scenarios, lab38SnapshotSchema } from '../../shared/lab38-prompt-suggestions';
type Snapshot = ReturnType<typeof lab38SnapshotSchema.parse>;
export default function Concept38PromptSuggestions() {
  const owner = useRef(crypto.randomUUID()); const [scenario, setScenario] = useState<(typeof lab38Scenarios)[number]>('normal');
  const [snapshot, setSnapshot] = useState<Snapshot>(); const [draft, setDraft] = useState(''); const [selectedId, setSelectedId] = useState<string>();
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. Suggestions are optional application output.');
  async function post(path: string, body: object) { setBusy(true); try {
    const response = await fetch(`/api/c38/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner.current },
      body: JSON.stringify(body), signal: AbortSignal.timeout(7000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    const checked = lab38SnapshotSchema.parse(data); setSnapshot(checked); setStatus(`${checked.suggestions.length} suggestion(s); ${checked.sentCount} explicit user send(s); auto-sends ${checked.autoSendCount}.`);
    if (path === 'send' || path === 'chat') { setDraft(''); setSelectedId(undefined); }
  } catch (error) { setStatus(error instanceof Error ? error.message : 'Suggestion request failed.'); } finally { setBusy(false); } }
  const send = () => { if (!snapshot || !draft.trim()) return;
    void post('send', { conversationId: snapshot.conversationId, text: draft.trim(), expectedTurn: snapshot.turn,
      expectedResponseVersion: snapshot.responseVersion, ...(selectedId ? { suggestionId: selectedId } : {}) }); };
  return <section aria-labelledby="lab38-heading"><h2 id="lab38-heading">Application follow up suggestions</h2>
    <p>Suggestions are bound to a conversation, turn and response version. Copying one fills the input only; a separate Send action submits it. The answer and suggestion usage are shown separately.</p>
    <div className="lab-controls"><label>Offline scenario<select value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>
      {lab38Scenarios.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={() => void post('chat', { mode: 'scripted', scenario })}>Start conversation</button></div>
    {snapshot && <><p>Conversation <code>{snapshot.conversationId}</code>; turn {snapshot.turn}; response v{snapshot.responseVersion}.</p>
      <p>Agent answer: {snapshot.response}</p>
      <div className="lab-controls"><button disabled={busy || snapshot.status !== 'open'} onClick={() => void post('when', { conversationId: snapshot.conversationId, waitMs: scenario === 'delayed' ? 1400 : 0 })}>Check suggestions</button>
        <button disabled={busy || snapshot.status !== 'open'} onClick={() => void post('switches', { conversationId: snapshot.conversationId, enabled: !snapshot.enabled })}>
          {snapshot.enabled ? 'Disable suggestions' : 'Enable suggestions'}</button>
        <button disabled={busy || snapshot.status !== 'open'} onClick={() => void post('end', { conversationId: snapshot.conversationId })}>Close conversation</button></div>
      <section aria-label="Follow up suggestions"><h3>Follow up suggestions</h3>
        {snapshot.suggestions.length ? snapshot.suggestions.map(item => <button key={item.id} disabled={busy || snapshot.status !== 'open'}
          onClick={() => { setDraft(item.text); setSelectedId(item.id); setStatus('Suggestion copied to input; no message sent.'); }}>
          Copy: {item.text}</button>) : <p>No suggestion available. This is a valid outcome.</p>}</section>
      <label>Your next message<textarea value={draft} maxLength={500} onChange={event => { setDraft(event.target.value); setSelectedId(undefined); }} /></label>
      <button disabled={busy || snapshot.status !== 'open' || !draft.trim()} onClick={send}>Send message</button>
      <p>Explicit sends: {snapshot.sentCount}. Auto-sends: {snapshot.autoSendCount}. Stale suggestion rejected: {String(snapshot.staleRejected)}.</p>
      <p>Answer usage: {snapshot.answerUsage.inputTokens} input / {snapshot.answerUsage.outputTokens} output ({snapshot.answerUsage.source}).
        Suggestion usage: {snapshot.suggestionUsage ? `${snapshot.suggestionUsage.inputTokens} input / ${snapshot.suggestionUsage.outputTokens} output (${snapshot.suggestionUsage.source})` : 'not reported'}.
        Provider calls: {snapshot.providerCalls}.</p><p>{snapshot.note}</p></>}
    <p role="status" aria-label="Lab 38 status">{status}</p>
    <p>No native <code>prompt_suggestion</code> event is assumed. The offline fixture does not start a separately billed suggestion session.</p>
  </section>;
}
