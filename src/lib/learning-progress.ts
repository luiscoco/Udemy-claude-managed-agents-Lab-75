const checkpointCount = 4;
const stepIds = new Set(['goal', 'preparation', 'example', 'controls', 'evidence', 'source', 'practice']);
export const progressEvent = 'managed-learning-progress-changed';
export const checklistKey = (id: number) => `managed-learning-checklist-${id}`;
export const positionKey = (id: number) => `managed-learning-position-${id}`;
export const noteKey = (id: number) => `managed-learning-note-${id}`;
export const bookmarkKey = (id: number) => `managed-learning-bookmark-${id}`;
export type LessonProgress = { id: number; checked: number; completed: boolean; started: boolean; savedStep: string | null; hasNotes: boolean; bookmarked: boolean };
export type LearningProgress = { lessons: LessonProgress[]; completed: number; started: number; lastLesson: number | null; storageAvailable: boolean };

/** Read only known progress keys. Never inspect unrelated browser settings. */
export function readLearningProgress(storage: Pick<Storage, 'getItem'>, ids: readonly number[]): LearningProgress {
  let storageAvailable = true;
  const get = (key: string) => { try { return storage.getItem(key); } catch { storageAvailable = false; return null; } };
  const lessons = ids.map(id => {
    let checked = 0;
    try { const value: unknown = JSON.parse(get(checklistKey(id)) ?? 'null');
      if (Array.isArray(value)) checked = value.slice(0, checkpointCount).filter(item => item === true).length;
    } catch { /* Corrupt browser progress cannot mark a lesson complete. */ }
    const saved = get(positionKey(id)), savedStep = saved && stepIds.has(saved) ? saved : null;
    const visited = get(`managed-learning-visited-${id}`) === '1';
    const hasNotes = !!get(noteKey(id))?.trim(), bookmarked = get(bookmarkKey(id)) === '1';
    return { id, checked, completed: checked === checkpointCount, started: visited || checked > 0 || savedStep !== null || hasNotes || bookmarked, savedStep, hasNotes, bookmarked };
  });
  const last = get('managed-learning-last-lesson');
  const lastLesson = last && /^\d{1,2}$/.test(last) && ids.includes(Number(last)) ? Number(last) : null;
  return { lessons, completed: lessons.filter(item => item.completed).length,
    started: lessons.filter(item => item.started && !item.completed).length, lastLesson, storageAvailable };
}

export function nextLearningLesson(progress: LearningProgress): number | undefined {
  const last = progress.lessons.find(item => item.id === progress.lastLesson);
  if (last && !last.completed) return last.id;
  return progress.lessons.find(item => item.started && !item.completed)?.id
    ?? progress.lessons.find(item => !item.completed)?.id;
}

export function notifyLearningProgress() { window.dispatchEvent(new Event(progressEvent)); }
export function recordLessonVisit(id: number) {
  try { localStorage.setItem(`managed-learning-visited-${id}`, '1'); localStorage.setItem('managed-learning-last-lesson', String(id)); } catch { /* Storage is optional. */ }
  notifyLearningProgress();
}
