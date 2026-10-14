import { useEffect, useRef, useState } from 'react';
import { lab06ConversationSchema, lab06FollowUp, lab06FrameSchema, lab06Prompt, lab06ResultSchema } from '../../shared/lab06-sessions';
import type { Lab06Action, Lab06Conversation, Lab06Frame, Lab06Result, Lab06Scenario } from '../../shared/lab06-sessions';
import { LiveActionButton } from '../components/LiveActionButton';
import { redact } from '../lib/presentation';
import { streamPost } from '../lib/sse';
import { request } from '../lib/api';
import { z } from 'zod';

type Mode = 'scripted' | 'live';
const closeSchema = z.strictObject({ closed: z.literal(true), conversationId: z.uuid(), sessionId: z.string() });
const scenarioLabels: Record<Lab06Scenario, string> = { normal: 'Normal retained session', 'stream-eof': 'Stream ends before idle', hang: 'Hang until cancel or deadline' };

export default function Concept06Sessions() {
  const [mode, setMode] = useState<Mode>('scripted'); const [scenario, setScenario] = useState<Lab06Scenario>('normal');
  const [prompt, setPrompt] = useState(lab06Prompt); const [conversationId, setConversationId] = useState('');
  const [frames, setFrames] = useState<Lab06Frame[]>([]); const [result, setResult] = useState<Lab06Result>();
  const [conversation, setConversation] = useState<Lab06Conversation>(); const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('Ready. Start a new offline session, then continue it with the follow-up.');
  const [liveReady, setLiveReady] = useState(false); const controller = useRef<AbortController | null>(null);
  useEffect(() => { void fetch('/api/managed/setup').then((r) => r.json()).then((v: { liveReady?: boolean }) => setLiveReady(v.liveReady === true)).catch(() => {});
    return () => controller.current?.abort(); }, []);

  async function run(action: Lab06Action, chosen: Mode = mode) {
    if (pending) return; const needsId = action !== 'new';
    if (needsId && !conversationId) { setStatus('Start a conversation first.'); return; }
    const abort = new AbortController(); controller.current = abort; setPending(true); setFrames([]); setResult(undefined); setConversation(undefined); setMode(chosen);
    try {
      const outcome = await streamPost('/api/c6/query', { mode: chosen, action, ...(needsId ? { conversationId } : {}),
        prompt: action === 'reconnect' ? '' : prompt, scenario: chosen === 'scripted' ? scenario : 'normal', deadlineSeconds: 30,
        ...(chosen === 'live' ? { budgetCents: 50 } : {}) }, { signal: abort.signal, idleMs: 25_000, deadlineMs: 45_000,
        resultSchema: lab06ResultSchema, onEvent: (type, data) => { if (type === 'progress') setFrames((all) => [...all, lab06FrameSchema.parse(data)]); } });
      if (outcome.kind === 'success') { setResult(outcome.result); setConversationId(outcome.result.conversationId); setStatus(outcome.result.message); }
      else setStatus('Cancelled locally. The server attempted a bounded remote interrupt; local cancellation alone is not proof that remote work stopped.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'The session request failed.'); }
    finally { controller.current = null; setPending(false); }
  }
  async function inspect() {
    if (!conversationId) return;
    try { const value = await request(`/api/c6/conversation?conversationId=${encodeURIComponent(conversationId)}`, lab06ConversationSchema); setConversation(value); setStatus('Loaded the server-owned conversation index.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not inspect the conversation.'); }
  }
  async function close() {
    if (!conversationId) return;
    try { await request('/api/c6/close', closeSchema, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId, mode }) });
      setStatus('The confirmed-idle session was archived. Continue and reconnect now reject it.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not close the conversation.'); }
  }
  const messages = result?.history ?? [];
  return <section aria-labelledby="c6-heading">
    <h2 id="c6-heading">Retain context in one Managed session</h2>
    <p><strong>New</strong> creates one remote <code>sesn_</code> session. <strong>Continue</strong> retrieves that owned session, opens its event stream, and then sends another <code>user.message</code>. <strong>Reconnect</strong> opens the stream before paginated history hydration and deduplicates persisted <code>sevt_</code> IDs.</p>
    <fieldset disabled={pending}><legend>Session experiment</legend>
      <label htmlFor="c6-prompt">Prompt</label><textarea id="c6-prompt" rows={3} maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div className="lab-controls"><button type="button" onClick={() => setPrompt(lab06Prompt)}>Use introduction</button><button type="button" onClick={() => setPrompt(lab06FollowUp)}>Use follow-up</button></div>
      <label htmlFor="c6-scenario">Offline scenario</label><select id="c6-scenario" value={scenario} onChange={(e) => setScenario(e.target.value as Lab06Scenario)}>
        {Object.entries(scenarioLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </fieldset>
    <div className="lab-controls"><button disabled={pending} onClick={() => void run('new', 'scripted')}>New offline</button>
      <button disabled={pending || !conversationId} onClick={() => void run('continue')}>Continue</button>
      <button disabled={pending || !conversationId} onClick={() => void run('reconnect')}>Reconnect</button>
      {pending && <button onClick={() => controller.current?.abort()}>Cancel query</button>}</div>
    <div className="lab-live"><LiveActionButton busy={pending} available={liveReady} keyIsolated
      setup={liveReady ? 'Live setup is ready. New creates a billed retained session.' : 'Live Managed setup is not ready.'}
      checkAvailability={async () => liveReady} onRun={() => void run('new', 'live')} /></div>
    <p role="status" aria-live="polite">{redact(status)}</p>

    <h3>Session identity</h3>
    <p>Conversation: <code>{(result?.conversationId ?? conversationId) || 'not created'}</code><br />Managed session: <code>{result?.sessionId ?? 'not observed in this request'}</code><br />Local turn: <code>{result?.localTurnId ?? 'not started'}</code><br />Sent event: <code>{result?.sentEventId ?? 'none'}</code></p>
    <h3>Retained history</h3>
    {messages.length ? <ol>{messages.map((event) => <li key={event.id}><strong>{event.type}</strong> <code>{event.id}</code><p>{redact(event.text)}</p></li>)}</ol> : <p className="muted">No hydrated messages yet.</p>}
    {result && <p><strong>Outcome:</strong> {result.outcome}. Duplicates ignored during hydration: {result.duplicatesIgnored}. Session archived: {String(result.archived)}.</p>}
    <h3>Stream evidence</h3>
    {frames.length ? <ul>{frames.map((frame) => <li key={`${frame.seq}-${'id' in frame ? frame.id : frame.localTurnId}`}><code>{frame.kind}</code> {'eventType' in frame ? frame.eventType : frame.kind === 'session' ? frame.action : 'persisted event ignored'}</li>)}</ul> : <p className="muted">Run an action to see stream ordering.</p>}
    <div className="lab-controls"><button disabled={!conversationId || pending} onClick={() => void inspect()}>Inspect server index</button><button disabled={!conversationId || pending} onClick={() => void close()}>Close and archive</button></div>
    {conversation && <p>Server index: {conversation.turnCount} turn(s), {conversation.history.length} messages, expires {conversation.expiresAt}. The index is bound to the browser exercise owner.</p>}
  </section>;
}

