import { useState } from 'react';
import type { MouseEvent } from 'react';
import type { LessonMetadata } from '../../shared/lessons';
import type { LearningProgress } from '../lib/learning-progress';
import { availablePathLessons, learningPaths, nextPathLesson, reviewQueue } from '../lessons/learning-paths';
import { routeHref } from '../lessons/navigation';

export function LearningPaths({ lessons, progress, selectedId, onSelect, status, onNavigate }: {
  lessons: readonly LessonMetadata[]; progress: LearningProgress; selectedId: string | null;
  onSelect: (id: string | null) => void; status: string; onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: number) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'knowledge' | 'bookmarks'>('all');
  const availableIds = lessons.map(lesson => lesson.id), queue = reviewQueue(progress);
  const filtered = queue.filter(item => filter === 'all' || filter === 'knowledge' && item.knowledgeAttempted && !item.knowledgeCorrect || filter === 'bookmarks' && item.bookmarked);
  return <>
    <section id="course-learning-paths" className="learning-paths" aria-labelledby="learning-paths-heading" tabIndex={-1}><h3 id="learning-paths-heading">Choose a learning path</h3>
      <p>Suggested sequences adapted for Managed Agents. No lesson is locked. Paths reuse your existing checklist progress; completing a path is self-assessment, not certification.</p>
      <div className="learning-path-grid">{learningPaths.map(path => {
        const ids = availablePathLessons(path, availableIds); if (!ids.length) return null;
        const done = ids.filter(id => progress.lessons.find(item => item.id === id)?.completed).length;
        const next = nextPathLesson(path, progress, availableIds);
        return <article className={selectedId === path.id ? 'learning-path-card path-selected' : 'learning-path-card'} key={path.id}>
          <h4>{path.title}</h4><p>{path.description}</p><p>{done} / {ids.length} checklists complete.</p>
          <button type="button" aria-pressed={selectedId === path.id} onClick={() => onSelect(path.id)}>{selectedId === path.id ? 'Selected: ' : 'Choose: '}{path.title}</button>
          {selectedId === path.id && (next !== undefined ? <p><a href={routeHref(next)} onClick={event => onNavigate(event, next)}>Continue path: Lab {String(next).padStart(2, '0')}</a></p> : <p>All checklists in this path are complete. Revisit its lessons for practice.</p>)}
          <details><summary>Lessons in this path</summary><ol>{ids.map(id => <li key={id}><a href={routeHref(id)} onClick={event => onNavigate(event, id)}>Lab {String(id).padStart(2, '0')}: {lessons.find(lesson => lesson.id === id)?.title}</a></li>)}</ol></details>
        </article>;
      })}</div>
      {selectedId && <button type="button" onClick={() => onSelect(null)}>Clear selected path</button>}
      <p role="status" aria-label="Learning path status">{status}</p>
    </section>
    <section id="course-review-queue" className="learning-review-queue" aria-labelledby="review-queue-heading" tabIndex={-1}><h3 id="review-queue-heading">Your review queue</h3>
      <p>Latest incorrect knowledge answers appear first, followed by your bookmarks. Open a listed lab, then choose Open knowledge check or its Learning Guide notebook. A correct retry removes the knowledge-review reason; bookmarks stay until you remove them.</p>
      <div className="guide-toolbar" role="group" aria-label="Review queue filter">{(['all', 'knowledge', 'bookmarks'] as const).map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All review items' : value === 'knowledge' ? 'Knowledge checks' : 'Bookmarks'}</button>)}</div>
      {filtered.length ? <ul className="lesson-progress-list">{filtered.map(item => <li key={item.id}>
        <a href={routeHref(item.id)} onClick={event => onNavigate(event, item.id)}>Review Lab {String(item.id).padStart(2, '0')}: {lessons.find(lesson => lesson.id === item.id)?.title}</a>
        <span>{item.knowledgeAttempted && !item.knowledgeCorrect ? 'Knowledge check needs review' : ''}{item.bookmarked ? `${item.knowledgeAttempted && !item.knowledgeCorrect ? ' / ' : ''}Bookmarked for review` : ''}</span>
      </li>)}</ul> : <p>No review items match this filter. Use a knowledge check or bookmark a lesson to add one.</p>}
    </section>
  </>;
}
