import { useEffect, useId, useRef, useState } from 'react';
import { tutorQuestions, type TutorIntent, type TutorReply, type TutorModel, type CurrentTutorAnswer } from '../../shared/ai-tutor';
import { ReadableMarkdown } from './ReadableMarkdown';
import '../ai-tutor.css';

type Status = { liveAvailable: boolean; savedAnswersAvailable: boolean; maxOutputTokens: number; message: string };
function browserOwner() {
  try {
    let owner = localStorage.getItem('managed-agents-ai-tutor-owner');
    if (!owner || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(owner)) {
      owner = crypto.randomUUID(); localStorage.setItem('managed-agents-ai-tutor-owner', owner);
    }
    return owner;
  } catch { return null; }
}
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/ai-tutor${path}`, options);
  let data: T & { message?: string };
  try { data = await response.json() as T & { message?: string }; }
  catch { throw Error('The tutor service is unavailable. Check that the backend is running and try again.'); }
  if (!response.ok) throw Error(data.message ?? 'The tutor request could not complete.');
  return data;
}
export function AiTutor({ lessonId, title }: { lessonId: number; title: string }) {
  const id = useId(), [owner] = useState(browserOwner);
  const [intent, setIntent] = useState<TutorIntent>('explain'), [question, setQuestion] = useState<string>(tutorQuestions[0].question);
  const [mode, setMode] = useState<'prepared' | 'live'>('prepared'), [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>(), [reply, setReply] = useState<TutorReply>(), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), [models, setModels] = useState<TutorModel[]>([]), [model, setModel] = useState('');
  const [modelsBusy, setModelsBusy] = useState(false), [modelsError, setModelsError] = useState(''), [catalogAttempt, setCatalogAttempt] = useState(0);
  const [saved, setSaved] = useState<CurrentTutorAnswer[]>([]), [selected, setSelected] = useState('');
  const [savedError, setSavedError] = useState(''), [savedBusy, setSavedBusy] = useState(false), [savedMessage, setSavedMessage] = useState('');
  const [savedLoading, setSavedLoading] = useState(Boolean(owner));
  const controller = useRef<AbortController | null>(null), result = useRef<HTMLElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (reply) result.current?.focus(); }, [reply]);
  useEffect(() => {
    const signal = new AbortController();
    void request<Status>('/status', { signal: signal.signal }).then(setStatus).catch(cause => {
      if (!signal.signal.aborted) setError(cause instanceof Error ? cause.message : 'The tutor service is unavailable.');
    });
    if (owner) void request<{ answers: CurrentTutorAnswer[] }>(`/${lessonId}/saved`, { headers: { 'x-ai-tutor-owner': owner }, signal: signal.signal })
      .then(data => setSaved(data.answers)).catch(cause => { if (!signal.signal.aborted) setSavedError(cause instanceof Error ? cause.message : 'Saved answers could not load.'); })
      .finally(() => { if (!signal.signal.aborted) setSavedLoading(false); });
    return () => signal.abort();
  }, [lessonId, owner]);
  useEffect(() => {
    if (mode !== 'live') return;
    const signal = new AbortController(); setModelsBusy(true); setModelsError('');
    void request<{ models: TutorModel[]; message?: string }>('/models', { signal: signal.signal }).then(data => {
      setModels(data.models); setModel(current => data.models.some(row => row.id === current) ? current : '');
      if (!data.models.length) setModelsError(data.message ?? 'No Claude models are available for this server key.');
    }).catch(cause => { if (!signal.signal.aborted) { setModels([]); setModel(''); setModelsError(cause instanceof Error ? cause.message : 'Models could not load.'); } })
      .finally(() => { if (!signal.signal.aborted) setModelsBusy(false); });
    return () => signal.abort();
  }, [mode, catalogAttempt]);
  function clearAnswer() { setReply(undefined); setError(''); setConsent(false); setSavedMessage(''); }
  async function ask() {
    const abort = new AbortController(); controller.current = abort; setBusy(true); setReply(undefined); setError(''); setSavedMessage('');
    const authorized = consent; setConsent(false);
    try {
      const answer = await request<TutorReply>(`/${lessonId}`, { method: 'POST', signal: abort.signal,
        headers: { 'Content-Type': 'application/json', ...(owner ? { 'x-ai-tutor-owner': owner } : {}) },
        body: JSON.stringify({ mode, intent, question: question.trim(), ...(mode === 'live' ? { model } : {}), consent: authorized }) });
      if (!abort.signal.aborted) setReply(answer);
    } catch (cause) { setError(abort.signal.aborted ? mode === 'live' ? 'Question stopped. A paid request already sent can still incur charges.' : 'Prepared guidance stopped.' : cause instanceof Error ? cause.message : 'The tutor could not answer.'); }
    finally { if (controller.current === abort) { controller.current = null; setBusy(false); } }
  }
  async function saveAnswer() {
    if (!owner || !reply?.pendingToken) return;
    setSavedBusy(true); setSavedError('');
    try {
      const data = await request<{ answer: CurrentTutorAnswer }>(`/${lessonId}/saved`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ai-tutor-owner': owner }, body: JSON.stringify({ pendingToken: reply.pendingToken }) });
      setSaved(current => [data.answer, ...current]);
      setReply(current => { if (!current) return current; const { pendingToken: _token, ...rest } = current; return rest; });
      setSavedMessage('Answer saved. You can reopen it below without another model request.');
    } catch (cause) { setSavedError(cause instanceof Error ? cause.message : 'The answer could not be saved.'); }
    finally { setSavedBusy(false); }
  }
  async function removeAnswer(answerId: string) {
    if (!owner) return;
    setSavedBusy(true); setSavedError('');
    try {
      const response = await fetch(`/api/ai-tutor/${lessonId}/saved/${answerId}`, { method: 'DELETE', headers: { 'x-ai-tutor-owner': owner } });
      if (!response.ok) { const data = await response.json() as { message?: string }; throw Error(data.message ?? 'The saved answer could not be removed.'); }
      setSaved(current => current.filter(item => item.id !== answerId)); setSelected('');
    } catch (cause) { setSavedError(cause instanceof Error ? cause.message : 'The saved answer could not be removed.'); }
    finally { setSavedBusy(false); }
  }
  const opened = saved.find(item => item.id === selected), disabled = busy || savedBusy;
  return <div className="ai-tutor">
    <section className="learning-card" aria-labelledby={`${id}-heading`}>
      <p className="phase-label">Your study companion · Lab {lessonId}</p><h2 id={`${id}-heading`}>AI Tutor</h2>
      <p>Ask about <strong>{title}</strong>. Start with free prepared guidance, or choose Live Claude for an answer tailored to your question.</p>
      <div className="ai-tutor-questions" role="group" aria-label="Suggested tutor questions">{tutorQuestions.map(item => <button type="button" className="button-secondary" key={item.id} aria-pressed={intent === item.id} disabled={disabled}
        onClick={() => { setIntent(item.id); setQuestion(item.question); clearAnswer(); }}>{item.label}</button>)}</div>
      <form onSubmit={event => { event.preventDefault(); void ask(); }}>
        <label htmlFor={`${id}-question`}>Question for AI Tutor</label><textarea id={`${id}-question`} rows={4} minLength={3} maxLength={2000} required value={question} disabled={disabled}
          onChange={event => { setQuestion(event.target.value); clearAnswer(); }} />
        <label htmlFor={`${id}-mode`}>Answer mode</label><select id={`${id}-mode`} value={mode} disabled={disabled} onChange={event => { setMode(event.target.value as typeof mode); clearAnswer(); }}>
          <option value="prepared">Prepared lesson guidance · free</option><option value="live" disabled={status?.liveAvailable === false}>Live Claude · paid</option></select>
        {mode === 'prepared' ? <p className="muted">Prepared answers follow the selected topic. They do not respond to custom wording. {status?.liveAvailable === false && status.message}</p>
          : <div className="ai-tutor-live-options">
            <label htmlFor={`${id}-model`}>Claude model</label><select id={`${id}-model`} value={model} disabled={disabled || modelsBusy || !models.length} onChange={event => { setModel(event.target.value); clearAnswer(); }}>
              <option value="" disabled>{modelsBusy ? 'Loading models…' : 'Select a model'}</option>{models.map(item => <option key={item.id} value={item.id}>{item.name} ({item.id})</option>)}</select>
            {modelsError && <p role="status">{modelsError} <button type="button" className="button-secondary" disabled={disabled || modelsBusy} onClick={() => setCatalogAttempt(value => value + 1)}>Reload models</button></p>}
            <p className="muted">Prices vary by model. One answer uses at most {status?.maxOutputTokens ?? 4096} output tokens. <a href="https://platform.claude.com/docs/en/about-claude/pricing" target="_blank" rel="noreferrer">Check Claude pricing</a>.</p>
            <label className="ai-tutor-consent"><input type="checkbox" checked={consent} disabled={disabled || !model || modelsBusy} onChange={event => setConsent(event.target.checked)} />I authorize one paid tutor answer using the selected model. Consent resets after sending.</label>
          </div>}
        <div className="ai-tutor-actions"><button type="submit" disabled={disabled || question.trim().length < 3 || mode === 'live' && (!consent || !model || modelsBusy)}>{busy ? 'Asking…' : 'Ask the tutor'}</button>
          <button type="button" className="button-secondary" disabled={!busy} onClick={() => controller.current?.abort()}>Stop</button></div>
      </form>
      {busy && <p role="status">Preparing your {mode === 'live' ? 'Claude answer' : 'lesson guidance'}…</p>}{error && <p role="alert">{error}</p>}
    </section>
    {reply && <section ref={result} tabIndex={-1} className="learning-card ai-tutor-result" aria-label="Tutor answer">
      <div className="ai-tutor-result-heading"><h2>Tutor answer</h2><span className="ai-tutor-badge">{reply.mode === 'live' ? 'Live Claude' : 'Prepared guidance'}</span></div>
      {reply.incomplete && <p role="alert">Partial answer: Claude reached the output limit. You can read the text below, but it cannot be saved as a complete answer. Ask a narrower question if you need more detail. No automatic retry was made.</p>}
      <ReadableMarkdown text={reply.answer} /><p className="muted">{reply.note}</p>
      {reply.mode === 'live' && <p className="muted">Model: {reply.model}. {reply.usage && `${reply.usage.inputTokens} input tokens · ${reply.usage.outputTokens} output tokens.`}</p>}
      {reply.pendingToken && <button type="button" disabled={disabled} onClick={() => void saveAnswer()}>{savedBusy ? 'Saving…' : 'Save this answer'}</button>}{savedMessage && <p role="status">{savedMessage}</p>}
    </section>}
    <section className="learning-card" aria-labelledby={`${id}-saved-heading`}>
      <h2 id={`${id}-saved-heading`}>Saved AI Tutor answers</h2><p className="muted">Reopen saved Claude answers for this lab without another model call. They are stored locally for this browser. Clearing browser storage loses access to its saved answers.</p>
      {!owner && <p role="status">Browser storage is unavailable. You can ask questions, but saved answers cannot be reopened here.</p>}{savedError && <p role="alert">{savedError}</p>}
      {savedLoading ? <p role="status">Loading saved answers…</p> : !saved.length ? <p>No saved answers for this lab yet.</p> : <div className="ai-tutor-saved-list">{saved.map(item => <button type="button" className="button-secondary" key={item.id} aria-pressed={selected === item.id}
        onClick={() => setSelected(item.id)}>{item.question}<small>{item.model} · {new Date(item.savedAt).toLocaleString()}</small></button>)}</div>}
      {opened && <article className="ai-tutor-saved-detail"><h3>Saved answer</h3><p className="muted">{opened.model} · saved {new Date(opened.savedAt).toLocaleString()} · {opened.usage.inputTokens} input / {opened.usage.outputTokens} output tokens</p>
        {!opened.current && <p role="status">The lesson material has changed since this answer was generated. Compare it with the current source.</p>}
        <ReadableMarkdown text={opened.answer} /><button type="button" className="button-secondary" disabled={disabled} onClick={() => void removeAnswer(opened.id)}>Remove saved answer</button></article>}
    </section>
  </div>;
}
