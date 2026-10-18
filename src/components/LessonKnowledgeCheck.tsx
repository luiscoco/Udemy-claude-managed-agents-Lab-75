import { useId, useState } from 'react';
import { lessonKnowledgeCheck, knowledgeVersion } from '../../shared/learning-quizzes';
import { knowledgeKey, knowledgePassed, readKnowledgeAttempt, type KnowledgeAttempt } from '../lib/learning-knowledge';
import { notifyLearningProgress } from '../lib/learning-progress';

export function LessonKnowledgeCheck({ lessonId, onReviewSource }: { lessonId: number; onReviewSource: () => void }) {
  const question = lessonKnowledgeCheck(lessonId), id = useId();
  const [attempt, setAttempt] = useState<KnowledgeAttempt | null>(() => readKnowledgeAttempt({ getItem: key => localStorage.getItem(key) }, lessonId));
  const [selected, setSelected] = useState<number | null>(attempt?.selected ?? null), [status, setStatus] = useState('');
  const [showFeedback, setShowFeedback] = useState(attempt !== null);
  const passed = knowledgePassed(lessonId, attempt);
  return <details className="lesson-knowledge-check" id={`knowledge-check-${lessonId}`} tabIndex={-1}>
    <summary>Knowledge check / Lab {String(lessonId).padStart(2, '0')}{attempt ? passed ? ' / correct' : ' / review needed' : ''}</summary>
    <p>Check the lesson concept, then read the explanation. This local answer check is separate from your learning checklist and does not prove that an exercise or live run passed.</p>
    <fieldset><legend>{question.question}</legend>{question.choices.map((choice, index) => <label className="knowledge-choice" key={choice}>
      <input type="radio" name={`${id}-answer`} value={index} checked={selected === index} onChange={() => { setSelected(index); setShowFeedback(false); setStatus('Answer selected. Choose Check answer when ready.'); }} />{choice}
    </label>)}</fieldset>
    <div className="guide-toolbar"><button disabled={selected === null} type="button" onClick={() => {
      if (selected === null) return;
      const next: KnowledgeAttempt = { version: knowledgeVersion, selected, checkedAt: new Date().toISOString() };
      setAttempt(next); setShowFeedback(true);
      try { localStorage.setItem(knowledgeKey(lessonId), JSON.stringify(next)); setStatus('Answer checked and saved in this browser.'); notifyLearningProgress(); }
      catch { setStatus('Answer checked locally, but browser storage could not save it.'); }
    }}>Check answer</button><button type="button" onClick={onReviewSource}>Review lesson source</button></div>
    {showFeedback && attempt && <div className={passed ? 'knowledge-feedback knowledge-correct' : 'knowledge-feedback'} role="status" aria-label="Knowledge check feedback">
      <h3>{passed ? 'Correct' : 'Review this concept'}</h3><p>{question.explanation}</p>
      {!passed && <p><strong>Correct answer:</strong> {question.choices[question.correctIndex]}</p>}
      <p>You can change your choice and check again. This records your latest checked answer.</p>
    </div>}
    <p role="status" aria-label="Knowledge check status">{status}</p>
  </details>;
}
