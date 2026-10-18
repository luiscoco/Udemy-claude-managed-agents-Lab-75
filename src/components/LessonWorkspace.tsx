import { useEffect, useId, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import type { LessonMetadata } from '../../shared/lessons';
import { LessonGuide } from './LessonGuide';
import { SourceViewer } from './SourceViewer';
import { TextResource } from './TextResource';
import { LearningGuide } from './LearningGuide';
import { GuideExplanation } from './GuideExplanation';
import { LessonExperiment } from './LessonExperiment';
import { learningGuide } from '../../shared/learning-guide';
import { LessonKnowledgeCheck } from './LessonKnowledgeCheck';
import type { TextCatalog, TextLoader } from '../lessons/catalog';

export type ExerciseLoader = () => Promise<{ default: ComponentType }>;
export function LessonWorkspace({ lesson, loadGuide, sources, mainSources, loadExercise }: {
  lesson: LessonMetadata; loadGuide: TextLoader; sources: TextCatalog; mainSources: readonly string[]; loadExercise: ExerciseLoader;
}) {
  const id = useId(); const tabs = ['Learn', 'Run the exercise', 'TypeScript source'];
  const tabId = (index: number) => index === 1 ? `lesson-exercise-${lesson.id}` : `${id}-tab-${index}`;
  const workspace = useRef<HTMLDivElement>(null);
  const tour = learningGuide(lesson.id);
  const [active, setActive] = useState(() => {
    try {
      if (sessionStorage.getItem('lesson-exercise-retry') === String(lesson.id)) return 1;
      const retry = sessionStorage.getItem('lesson-resource-retry');
      return retry && Object.hasOwn(sources, retry) ? 2 : 0;
    } catch { return 0; }
  });
  const [visited, setVisited] = useState(active === 1);
  const [guidanceOpen, setGuidanceOpen] = useState(true);
  const [Exercise, setExercise] = useState<ComponentType>(); const [error, setError] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [reopenGuide] = useState(() => { try { return sessionStorage.getItem('lesson-resource-retry') === 'guide'; } catch { return false; } });
  useEffect(() => { try { sessionStorage.removeItem('lesson-exercise-retry'); sessionStorage.removeItem('lesson-resource-retry'); } catch { /* Storage is optional. */ } }, []);
  useEffect(() => {
    if (!visited) return;
    let alive = true; setError(false);
    void loadExercise().then((module) => { if (alive) setExercise(() => module.default); }, () => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [visited, loadExercise]);
  function retry() {
    // Browsers cache rejected module imports. A fresh document also recovers stale deployment chunks.
    // No exercise has mounted yet, so there are no exercise inputs or results to lose.
    try { sessionStorage.setItem('lesson-exercise-retry', String(lesson.id)); } catch { /* The learner can reopen Run after reload. */ }
    window.location.reload();
  }
  function activate(index: number, focus = false) {
    setActive(index); if (index === 1) setVisited(true); if (focus) buttons.current[index]?.focus();
  }
  return <div className="lesson-workspace" ref={workspace}>
    <LearningGuide lessonId={lesson.id} view={active} onView={activate} workspace={workspace} />
    <LessonKnowledgeCheck lessonId={lesson.id} onReviewSource={() => activate(2, true)} />
    <div role="tablist" aria-label={`${lesson.title} views`} className="workspace-tabs">
      {tabs.map((name, index) => <button type="button" key={name} id={tabId(index)} role="tab" data-lesson-shortcut={index === 1 ? 'exercise' : undefined}
        ref={(element) => { buttons.current[index] = element; }} aria-selected={active === index}
        aria-controls={`${id}-panel-${index}`} tabIndex={active === index ? 0 : -1}
        onClick={() => activate(index)} onKeyDown={(event) => {
          const target = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : undefined;
          if (target !== undefined) { event.preventDefault(); activate(target, true); }
        }}>{name}</button>)}
    </div>
    <div role="tabpanel" id={`${id}-panel-0`} aria-labelledby={`${id}-tab-0`} hidden={active !== 0} tabIndex={0}>
      <section className="learning-card"><p className="phase-label">01 / Understand</p><h2>Your lab path</h2><p><strong>Objective:</strong> {lesson.objective}</p>
        <GuideExplanation step={tour[0]!} /><GuideExplanation step={tour[1]!} /><LessonExperiment lessonId={lesson.id} />
        <ol>{lesson.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <p><strong>Inspect:</strong> {lesson.inspect.join(', ')}</p><p><strong>Challenge:</strong> {lesson.challenge}</p>
        <button type="button" onClick={() => activate(1, true)}>Open exercise</button>
        <details open={reopenGuide || undefined}><summary>Detailed guide</summary><TextResource load={loadGuide} label="guide">{(markdown) => <LessonGuide lessonId={lesson.id} markdown={markdown} />}</TextResource></details></section>
    </div>
    <div role="tabpanel" id={`${id}-panel-1`} aria-labelledby={tabId(1)} hidden={active !== 1} tabIndex={0}>
      <div className="guided-workspace">
        <aside className="learning-card exercise-guide" aria-label="Exercise guidance">
          <p className="phase-label">01 / Understand</p><h2>Understand the lesson</h2>
          <button type="button" className="guidance-toggle" aria-expanded={guidanceOpen} aria-controls={`${id}-guidance`} onClick={() => setGuidanceOpen(!guidanceOpen)}>{guidanceOpen ? 'Hide guidance' : 'Show guidance'}</button>
          <div id={`${id}-guidance`} hidden={!guidanceOpen}>
          <p>{lesson.objective}</p>
          <details open><summary>Your steps</summary><ol className="learning-steps">{lesson.steps.map((step) => <li key={step}>{step}</li>)}</ol></details>
          <p><strong>Your turn:</strong> Start with the exercise’s offline path. Compare its evidence with the steps above.</p>
          <details><summary>Recovery tips</summary><p>If the backend cannot be reached, check that the local development server is running. Live execution requires the server setup described in the exercise.</p><p>Use the Learn tab for the detailed guide. Changing tabs keeps your current experiment; leaving the lesson cancels its local request.</p></details>
          <button type="button" onClick={() => activate(0, true)}>Open detailed guide</button>
          </div>
        </aside>
        <div className="exercise-content">
          <div className="exercise-frame"><p className="phase-label">02 / Do the exercise</p>
      <GuideExplanation step={tour[2]!} /><GuideExplanation step={tour[3]!} />
      <div data-guide-exercise>{visited && (Exercise ? <Exercise /> : error ? <section role="alert"><h2>Exercise could not load</h2><p>Check your connection and that the local web server is running. Your lesson is still available.</p><p>Retry refreshes the page and reopens the exercise.</p><button onClick={retry}>Retry loading exercise</button></section> : <p role="status">Loading exercise…</p>)}</div>
          </div>
          <section className="review-card"><p className="phase-label">03 / Review</p><h2>Check your result</h2><GuideExplanation step={tour[4]!} /><p><strong>Inspect:</strong> {lesson.inspect.join(', ')}</p><p><strong>Challenge:</strong> {lesson.challenge}</p><GuideExplanation step={tour[6]!} /><p>Compare the reported outcome and evidence with the lesson objective.</p></section>
        </div>
      </div>
    </div>
    <div role="tabpanel" id={`${id}-panel-2`} aria-labelledby={`${id}-tab-2`} hidden={active !== 2} tabIndex={0}><GuideExplanation step={tour[5]!} /><div data-guide-source><SourceViewer sources={sources} mainSources={mainSources} /></div></div>
  </div>;
}
