import type { MouseEvent } from 'react';
import type { LessonMetadata } from '../../shared/lessons';
import { nextLearningLesson, type LearningProgress } from '../lib/learning-progress';
import { routeHref } from '../lessons/navigation';

export function CourseProgress({ progress, lessons, onNavigate }: {
  progress: LearningProgress; lessons: readonly LessonMetadata[];
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: number) => void;
}) {
  const next = lessons.find(item => item.id === nextLearningLesson(progress));
  const topicNames = [...new Set(lessons.map(item => item.topic))];
  return <section className="course-progress learning-card" aria-labelledby="course-progress-heading">
    <p className="phase-label">Your learning journey</p><h2 id="course-progress-heading">Course progress</h2>
    <p>Self-assessment saved in this browser. Checklists do not certify exercise results or live execution.</p>
    {!progress.storageAvailable && <p role="status">Browser storage is unavailable. Your progress cannot be restored after leaving this page.</p>}
    <div className="progress-summary"><p><strong>{progress.completed} / {lessons.length}</strong><span>checklists complete</span></p><p><strong>{progress.started}</strong><span>in progress</span></p><p><strong>{lessons.length - progress.completed - progress.started}</strong><span>not started</span></p></div>
    <progress max={Math.max(lessons.length, 1)} value={progress.completed} aria-label="Self-assessed course completion" />
    {next ? <div className="continue-learning"><a className="button" href={routeHref(next.id)} onClick={event => onNavigate(event, next.id)}>Continue learning: Lab {String(next.id).padStart(2, '0')}</a>
      <p>{next.title}. {progress.lessons.find(item => item.id === next.id)?.savedStep ? 'Open its Learning Guide and choose Resume saved tour to return to your section.' : 'Open its Learning Guide to choose your next step.'}</p></div>
      : lessons.length > 0 && <p>All learning checklists are complete. Revisit any lesson to practice or review its evidence.</p>}
    <details><summary>Progress by topic</summary><ul className="topic-progress-list">{topicNames.map(topic => {
      const ids = lessons.filter(item => item.topic === topic).map(item => item.id);
      const count = progress.lessons.filter(item => ids.includes(item.id) && item.completed).length;
      return <li key={topic}><span>{topic}</span><strong>{count} / {ids.length} checklists</strong></li>;
    })}</ul></details>
    <details><summary>Review lesson checklists</summary><ul className="lesson-progress-list">{lessons.map(lesson => {
      const item = progress.lessons.find(item => item.id === lesson.id);
      return <li key={lesson.id}><a href={routeHref(lesson.id)} onClick={event => onNavigate(event, lesson.id)}>Lab {String(lesson.id).padStart(2, '0')}: {lesson.title}</a>
        <span>{item?.completed ? 'Self-assessed complete' : item?.started ? `${item.checked} / 4 checkpoints` : 'Not started'}</span></li>;
    })}</ul></details>
  </section>;
}
