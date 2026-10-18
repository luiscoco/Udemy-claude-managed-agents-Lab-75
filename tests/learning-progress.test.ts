import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checklistKey, nextLearningLesson, positionKey, readLearningProgress } from '../src/lib/learning-progress';

function storage(values: Record<string, string>) { return { getItem: (key: string) => values[key] ?? null }; }

test('progress reads existing checklists and saved sections without claiming run verification', () => {
  const report = readLearningProgress(storage({
    [checklistKey(1)]: '[true,true,true,true]', [checklistKey(2)]: '[true,false,false,false]',
    [positionKey(3)]: 'evidence', 'managed-learning-last-lesson': '3',
  }), [1, 2, 3, 4]);
  assert.equal(report.completed, 1); assert.equal(report.started, 2);
  assert.equal(report.lessons[3]?.started, false); assert.equal(nextLearningLesson(report), 3);
  assert.equal(report.storageAvailable, true);
});

test('invalid, stale and hostile local values cannot inflate completion or select unknown lessons', () => {
  const report = readLearningProgress(storage({
    [checklistKey(1)]: '{"complete":true}', [checklistKey(2)]: '["true",1,true,null,true,true]',
    [checklistKey(3)]: 'not-json', [positionKey(3)]: '<script>unknown</script>',
    'managed-learning-last-lesson': '75',
  }), [1, 2, 3]);
  assert.equal(report.completed, 0); assert.equal(report.lessons[1]?.checked, 1);
  assert.equal(report.lessons[2]?.savedStep, null); assert.equal(report.lastLesson, null);
  assert.equal(nextLearningLesson(report), 2);
});

test('recommended lesson moves past complete work and handles all-complete or empty courses', () => {
  const report = readLearningProgress(storage({ [checklistKey(1)]: '[true,true,true,true]', 'managed-learning-last-lesson': '1' }), [1, 2]);
  assert.equal(nextLearningLesson(report), 2);
  assert.equal(nextLearningLesson(readLearningProgress(storage({ [checklistKey(1)]: '[true,true,true,true]' }), [1])), undefined);
  assert.equal(nextLearningLesson(readLearningProgress(storage({}), [])), undefined);
});

test('denied storage degrades safely and inspection reads only known progress keys', () => {
  const denied = readLearningProgress({ getItem() { throw new Error('Storage denied.'); } }, [1]);
  assert.equal(denied.storageAvailable, false); assert.equal(denied.completed, 0);
  const keys: string[] = []; readLearningProgress({ getItem(key) { keys.push(key); return null; } }, [1]);
  assert.deepEqual(keys, [checklistKey(1), positionKey(1), 'managed-learning-visited-1', 'managed-learning-note-1', 'managed-learning-bookmark-1', 'managed-learning-last-lesson']);
});
