import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnswerMarkdown } from './AnswerMarkdown.mjs';
import { DisplayControls } from './DisplayControls.jsx';
import { categoryForConcept, conceptsForRoute, guidedConcepts, guidedRoutes, promptsForConcept, topicCategories, topicSections } from './guided-concepts.mjs';
import './style.css';
import './appearance.css';

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? 'Request failed');
  return value;
}

function App() {
  const [categoryId, setCategoryId] = useState(() => {
    const saved = localStorage.getItem('study-coach-category');
    return topicCategories.some((category) => category.id === saved) ? saved : 'all';
  });
  const [routeId, setRouteId] = useState(() => {
    const saved = localStorage.getItem('study-coach-route');
    return guidedRoutes.some((route) => route.id === saved) ? saved : 'all';
  });
  const [sectionId, setSectionId] = useState(() => {
    const saved = localStorage.getItem('study-coach-section');
    return topicSections.some((section) => section.id === saved) ? saved : 'all';
  });
  const [conceptId, setConceptId] = useState(() => {
    const saved = localStorage.getItem('study-coach-concept');
    return guidedConcepts.some((concept) => concept.id === saved) ? saved : guidedConcepts[0].id;
  });
  const [practiceDone, setPracticeDone] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('study-coach-practice') || '[]');
      return Array.isArray(saved) ? saved.filter((id) => guidedConcepts.some((concept) => concept.id === id)) : [];
    } catch { return []; }
  });
  const [quizChoice, setQuizChoice] = useState(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const questionRef = useRef(null);
  const [mode, setMode] = useState('prepared');
  const [liveAvailable, setLiveAvailable] = useState(null);
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const routeConcepts = conceptsForRoute(routeId, categoryId, sectionId);
  const concept = routeConcepts.find((item) => item.id === conceptId) ?? routeConcepts[0];
  const conceptIndex = routeConcepts.indexOf(concept);

  useEffect(() => {
    localStorage.setItem('study-coach-route', routeId);
  }, [routeId]);

  useEffect(() => {
    localStorage.setItem('study-coach-category', categoryId);
  }, [categoryId]);

  useEffect(() => {
    localStorage.setItem('study-coach-section', sectionId);
  }, [sectionId]);

  useEffect(() => {
    localStorage.setItem('study-coach-concept', conceptId);
  }, [conceptId]);
  useEffect(() => {
    localStorage.setItem('study-coach-practice', JSON.stringify(practiceDone));
  }, [practiceDone]);

  function chooseConcept(id) {
    setConceptId(id);
    setQuizChoice(null);
    setQuizChecked(false);
  }

  function chooseRoute(id) {
    const nextConcepts = conceptsForRoute(id, categoryId, sectionId);
    if (!nextConcepts.length) return;
    setRouteId(id);
    chooseConcept(nextConcepts[0].id);
  }

  function chooseCategory(id) {
    const nextSection = conceptsForRoute('all', id, sectionId).length ? sectionId : 'all';
    const nextRoute = conceptsForRoute(routeId, id, nextSection).length ? routeId : 'all';
    setCategoryId(id);
    setSectionId(nextSection);
    setRouteId(nextRoute);
    chooseConcept(conceptsForRoute(nextRoute, id, nextSection)[0].id);
  }

  function chooseSection(id) {
    const nextCategory = conceptsForRoute('all', categoryId, id).length ? categoryId : 'all';
    const nextRoute = conceptsForRoute(routeId, nextCategory, id).length ? routeId : 'all';
    const nextConcepts = conceptsForRoute(nextRoute, nextCategory, id);
    if (!nextConcepts.length) return;
    setSectionId(id);
    setCategoryId(nextCategory);
    setRouteId(nextRoute);
    chooseConcept(nextConcepts[0].id);
  }

  function choosePrompt(prompt) {
    setQuestion(prompt);
    questionRef.current?.focus();
  }

  function checkConcept() {
    if (quizChoice === null) return;
    setQuizChecked(true);
    if (quizChoice === concept.check.correct) {
      setPracticeDone((current) => current.includes(concept.id) ? current : [...current, concept.id]);
    }
  }


  useEffect(() => {
    let active = true;
    api('/health').then((health) => {
      if (!active) return;
      setLiveAvailable(health.liveAvailable === true);
    }).catch(() => {
      if (active) setError('Cannot reach the Study Coach server. Restart the mini-project and reload this page.');
    });
    return () => { active = false; };
  }, []);

  async function start() {
    setBusy(true);
    setError('');
    try {
      const nextSession = await api('/conversations', {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      setSession(nextSession);
      setTurns([]);
      setConsent(false);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  function newConversation() {
    setSession(null);
    setTurns([]);
    setConsent(false);
    setError('');
  }

  async function ask(event) {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    setError('');
    try {
      const turn = await api(`/conversations/${session.id}/turns`, {
        method: 'POST',
        body: JSON.stringify({ question, consent, conceptId: concept.id }),
      });
      setTurns((current) => [...current, turn]);
      setQuestion('');
      setConsent(false);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <><header className="milestone-topbar"><div className="milestone-brand"><img src="/claude-icon.svg" alt="" width="40" height="40"/><div><strong>Study Coach</strong><small>Claude Managed Agents milestone project</small></div></div><DisplayControls/></header><main>
      <header className="page-header">
        <p className="eyebrow">Milestone project · 1 of 3</p>
        <h1>Study Coach</h1>
        <p className="intro">Learn Claude Managed Agents from your first session to production systems. Start with Managed API concepts, then explore build patterns and project walkthroughs. The full catalog contains {guidedConcepts.length} learning topics.</p>
      </header>

      <section className="card guide-card" aria-labelledby="guide-heading">
        <div className="guide-heading-row">
          <div><p className="eyebrow">From first session to agent teams</p><h2 id="guide-heading">Guided learning path</h2></div>
          <p className="guide-progress">{routeConcepts.filter(item => practiceDone.includes(item.id)).length} of {routeConcepts.length} checks passed in this route</p>
        </div>
        <p className="muted">The {guidedConcepts.length} learning topics span all 75 lessons in {topicSections.length} sections. They include Managed API concepts, build patterns, and project walkthroughs. Reading and checking cards makes no model call, and coach practice remains separate from course lesson completion.</p>
        <div className="topic-categories" role="group" aria-label="Learning topic group">
          {topicCategories.map((category) => <button type="button" key={category.id} className={'topic-category' + (categoryId === category.id ? ' active' : '')} aria-pressed={categoryId === category.id} onClick={() => chooseCategory(category.id)}><strong>{category.title}</strong><small>{guidedConcepts.filter(item => category.id === 'all' || categoryForConcept(item) === category.id).length} topics</small><span>{category.description}</span></button>)}
        </div>
        <div className="guide-levels" aria-label="Learning routes">
          {guidedRoutes.map((route) => <button type="button" key={route.id} aria-pressed={routeId === route.id} disabled={conceptsForRoute(route.id, categoryId, sectionId).length === 0} className={'guide-level' + (routeId === route.id ? ' active' : '')} onClick={() => chooseRoute(route.id)}>{route.title}<small>{conceptsForRoute(route.id, categoryId, sectionId).length} topics</small></button>)}
        </div>
        <label htmlFor="guide-section">Choose a learning section</label>
        <select id="guide-section" value={sectionId} onChange={(event) => chooseSection(event.target.value)}>
          <option value="all">All {topicSections.length} sections</option>
          {topicSections.map((section) => <option key={section.id} value={section.id}>{section.title} - lessons {section.firstLesson}-{section.lastLesson}</option>)}
        </select>
        <label htmlFor="guide-concept">Choose a {categoryId === 'managed' ? 'Managed API concept' : 'learning topic'}</label>
        <select id="guide-concept" value={concept.id} onChange={(event) => chooseConcept(event.target.value)}>
          {routeConcepts.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.title}{practiceDone.includes(item.id) ? ' ✓' : ''}</option>)}
        </select>
          <div className="guide-navigation"><button type="button" className="secondary-button" disabled={conceptIndex === 0} onClick={() => chooseConcept(routeConcepts[conceptIndex - 1].id)}>← Previous concept</button><button type="button" className="secondary-button" disabled={conceptIndex === routeConcepts.length - 1} onClick={() => chooseConcept(routeConcepts[conceptIndex + 1].id)}>Next concept →</button></div>
        <div className="concept-panel" aria-live="polite">
          <div className="concept-meta"><span>{topicCategories.find(item => item.id === categoryForConcept(concept)).title}</span><span>{concept.source ? 'Reviewed source' : concept.officialUrl ? 'Official documentation' : 'Simple introduction'}</span><span>Step {conceptIndex + 1} of {routeConcepts.length}</span><span>Course lesson {concept.lesson}</span></div>
          <h3>{concept.title}</h3>
          <p>{concept.explanation}</p>
          <p className="code-intro">{concept.source ? `Illustrative TypeScript based on the Managed Agents course · ${concept.source.file}:${concept.source.startLine}–${concept.source.endLine}` : 'A small illustrative TypeScript example'}</p>
          {concept.source && <p><a className="course-link" href={`https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/blob/main/${concept.source.file}#L${concept.source.startLine}`} target="_blank" rel="noopener noreferrer">Inspect the Managed Agents source ↗</a></p>}
          {concept.officialUrl && <p><a className="course-link" href={concept.officialUrl} target="_blank" rel="noopener noreferrer">Read the official Managed Agents guide ↗</a></p>}
          <AnswerMarkdown text={`\`\`\`typescript\n${concept.code}\n\`\`\``} />
          {concept.challenge && <p className="concept-challenge"><strong>Try in the full lab:</strong> {concept.challenge}</p>}
          <a className="course-link" href={`${import.meta.env.VITE_COURSE_URL || 'http://127.0.0.1:5174'}/?lesson=${concept.lesson}`} target="_blank" rel="noopener noreferrer">Open related Managed Agents lab {concept.lesson} ↗</a>
          <div className="concept-check">
            <h4>{concept.source ? 'Check your reading' : 'Check your understanding'}</h4>
            <p>{concept.check.question}</p>
            <div className="check-options">{concept.check.choices.map((choice, index) => <label key={choice}><input type="radio" name={`check-${concept.id}`} checked={quizChoice === index} onChange={() => { setQuizChoice(index); setQuizChecked(false); }} />{choice}</label>)}</div>
            <button type="button" className="secondary-button" onClick={checkConcept} disabled={quizChoice === null}>Check answer</button>
            {quizChecked && <p className={quizChoice === concept.check.correct ? 'check-result correct' : 'check-result'} role="status">{quizChoice === concept.check.correct ? 'Correct. ' : 'Try again. '}{concept.check.why}</p>}
          </div>
          <div className="guide-prompts"><h4>Ask the coach</h4><p>Choose a question to add to the box below, then edit it if you like. Prepared mode shows fixed teaching; a tailored answer needs Live mode and separate authorization.</p>
            {promptsForConcept(concept).map((prompt) => <button type="button" className="prompt-button" key={prompt.label} title={prompt.question} onClick={() => choosePrompt(prompt.question)}>{prompt.label}</button>)}
          </div>
        </div>
      </section>

      <section className="card" aria-labelledby="conversation-heading">
        <h2 id="conversation-heading">Start a conversation</h2>
        <label htmlFor="mode">Mode</label>
        <select id="mode" value={mode} onChange={(event) => setMode(event.target.value)} disabled={!!session}>
          <option value="prepared">Prepared example (fixed)</option>
          <option value="live" disabled={liveAvailable !== true}>Live agent (paid)</option>
        </select>
        {liveAvailable === false && <p className="mode-note">Live mode needs server credentials, Managed agent/environment IDs and <code>MANAGED_LIVE_ENABLED=true</code>. Prepared mode returns a fixed practice reply.</p>}
        {mode === 'prepared' && <p className="mode-note">Prepared mode uses authored concept explanations and code examples. It makes no model call and cannot generate a new answer to an arbitrary question.</p>}
        {mode === 'live' && <p className="mode-note">Live agent is ready. Starting a conversation is free; each question needs your explicit paid-call authorization.</p>}
        {!session ? <button type="button" disabled={busy || liveAvailable === null} onClick={start}>Start {mode === 'live' ? 'live agent' : 'practice'} conversation</button> : (
          <div className="session-actions">
            <p className="muted session-id">Conversation {session.id} · {session.mode === 'live' ? 'live agent' : 'prepared practice'}</p>
            <button type="button" className="secondary-button" onClick={newConversation}>New conversation or change mode</button>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="follow-up-heading">
        <h2 id="follow-up-heading">Ask and follow up</h2>
        <form onSubmit={ask}>
          <label htmlFor="question">Question</label>
          <textarea id="question" ref={questionRef} value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1000} placeholder="Choose a guided prompt above or ask your own question." />
          {mode === 'live' && session && (
            <label className="check" htmlFor="turn-consent">
              <input id="turn-consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              I authorize this turn.
            </label>
          )}
          <button disabled={!session || busy || question.trim().length < 8 || (mode === 'live' && !consent)}>{busy ? 'Waiting for answer…' : mode === 'live' ? 'Ask live agent' : 'Show practice reply'}</button>
        </form>
        {error && <p role="alert">{error}</p>}
        {busy && <p role="status">The coach is working on your question. Please wait for the completed answer.</p>}
        <div className="turns" aria-live="polite">
          {turns.map((turn) => (
            <article className="turn" key={turn.id}>
              <h3 className="question-heading">{turn.question}</h3>
              <AnswerMarkdown text={turn.answer} />
              <p className="muted answer-meta">{turn.source === 'live Managed Agents' ? 'Live Managed Agents answer' : 'Prepared practice reply'} · {turn.modelCalls ?? 'Unknown'} observed model requests</p>
              {turn.sessionId && <p className="muted">Managed session: {turn.sessionId} · Cleanup: {turn.cleanup} · List cost: {turn.costUsd == null ? 'unknown' : `$${turn.costUsd.toFixed(2)}`}</p>}
              <details>
                <summary>Inspect a study plan</summary>
                <ol>{turn.plan.map((step) => <li key={step}>{step}</li>)}</ol>
              </details>
            </article>
          ))}
        </div>
      </section>
      <footer>Student evidence stays separate from model output. A prepared answer is not a live result.</footer>
    </main></>
  );
}

createRoot(document.getElementById('root')).render(<App />);
