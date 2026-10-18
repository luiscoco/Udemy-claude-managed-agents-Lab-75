import type { LearningProgress } from '../lib/learning-progress';

export const learningPathKey = 'managed-learning-selected-path';
export type LearningPath = { id: string; title: string; description: string; lessons: readonly number[] };
export const learningPaths: readonly LearningPath[] = [
  { id: 'foundations', title: 'Managed Agents foundations', description: 'Build confidence with sessions, tools, permission boundaries, instructions, reports and offline host tests.',
    lessons: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 14, 15, 51] },
  { id: 'applications', title: 'Application builder', description: 'Connect agent sessions to a usable application with MCP, human review, browser tools and scoped data.',
    lessons: [1, 3, 4, 5, 6, 7, 10, 12, 13, 28, 31, 47, 48, 50, 51, 54, 61, 62, 63, 64, 65, 66, 67, 71, 72] },
  { id: 'orchestration', title: 'Reliable orchestration', description: 'Study recovery, observability, evaluation, durable work, constrained integration and the engineering-team capstone.',
    lessons: [1, 3, 4, 5, 7, 8, 10, 15, 19, 28, 35, 44, 47, 48, 49, 51, 52, 55, 56, 57, 58, 59, 60, 68, 73, 74, 75] },
  { id: 'complete-course', title: 'Complete course', description: 'Work through every implemented lesson in numeric order, from the first event stream to the final team capstone.',
    lessons: Array.from({ length: 75 }, (_, index) => index + 1) },
];
export function findLearningPath(id: string | null) { return learningPaths.find(path => path.id === id) ?? null; }
export function availablePathLessons(path: LearningPath, availableIds: readonly number[]) { return path.lessons.filter(id => availableIds.includes(id)); }
export function nextPathLesson(path: LearningPath, progress: LearningProgress, availableIds: readonly number[]) {
  const ids = availablePathLessons(path, availableIds);
  const incomplete = (id: number) => !progress.lessons.find(item => item.id === id)?.completed;
  if (progress.lastLesson !== null && ids.includes(progress.lastLesson) && incomplete(progress.lastLesson)) return progress.lastLesson;
  return ids.find(incomplete);
}
export function pathNeighbors(path: LearningPath, id: number, availableIds: readonly number[]) {
  const ids = availablePathLessons(path, availableIds), index = ids.indexOf(id);
  return index < 0 ? null : { position: index + 1, total: ids.length, previous: ids[index - 1], next: ids[index + 1] };
}
export function reviewQueue(progress: LearningProgress) {
  return progress.lessons.filter(item => item.bookmarked || item.knowledgeAttempted && !item.knowledgeCorrect)
    .sort((a, b) => Number(b.knowledgeAttempted && !b.knowledgeCorrect) - Number(a.knowledgeAttempted && !a.knowledgeCorrect) || a.id - b.id);
}
