import assert from 'node:assert/strict';
import { test } from 'node:test';
import { availablePathLessons, findLearningPath, learningPaths, nextPathLesson, pathNeighbors, reviewQueue } from '../src/lessons/learning-paths';
import { bookmarkKey, checklistKey, readLearningProgress } from '../src/lib/learning-progress';
import { knowledgeKey } from '../src/lib/learning-knowledge';
import { lessonKnowledgeCheck } from '../shared/learning-quizzes';

test('curated paths are unique internally and the complete path covers every lab', () => {
  assert.equal(new Set(learningPaths.map(path => path.id)).size, learningPaths.length);
  for (const path of learningPaths) {
    assert.equal(new Set(path.lessons).size, path.lessons.length);
    assert.ok(path.lessons.every(id => id >= 1 && id <= 75));
  }
  assert.deepEqual(findLearningPath('complete-course')?.lessons, Array.from({ length: 75 }, (_, i) => i + 1));
  assert.equal(findLearningPath('unknown'), null);
});

test('path recommendations and neighbors respect available lessons and existing completion', () => {
  const path = findLearningPath('applications')!;
  const values = new Map<string, string>([[checklistKey(1), '[true,true,true,true]']]);
  const progress = readLearningProgress({ getItem: key => values.get(key) ?? null }, [1, 65]);
  assert.deepEqual(availablePathLessons(path, [1, 65]), [1, 65]);
  assert.equal(nextPathLesson(path, progress, [1, 65]), 65);
  assert.deepEqual(pathNeighbors(path, 65, [1, 65]), { position: 2, total: 2, previous: 1, next: undefined });
  assert.equal(pathNeighbors(path, 75, [1, 65, 75]), null);
  progress.lessons[1]!.completed = true;
  assert.equal(nextPathLesson(path, progress, [1, 65]), undefined);
});

test('review queue prioritizes incorrect answers, deduplicates bookmarks and keeps bookmarks after a correct retry', () => {
  const values = new Map<string, string>([[bookmarkKey(1), '1'], [bookmarkKey(65), '1'],
    [knowledgeKey(65), JSON.stringify({ version: 1, selected: (lessonKnowledgeCheck(65).correctIndex + 1) % 3, checkedAt: '2026-10-18T08:00:00.000Z' })]]);
  const read = () => readLearningProgress({ getItem: key => values.get(key) ?? null }, [1, 65]);
  assert.deepEqual(reviewQueue(read()).map(item => item.id), [65, 1]);
  values.set(knowledgeKey(65), JSON.stringify({ version: 1, selected: lessonKnowledgeCheck(65).correctIndex, checkedAt: '2026-10-18T08:00:00.000Z' }));
  assert.deepEqual(reviewQueue(read()).map(item => item.id), [1, 65]);
  values.delete(bookmarkKey(65)); assert.deepEqual(reviewQueue(read()).map(item => item.id), [1]);
});
