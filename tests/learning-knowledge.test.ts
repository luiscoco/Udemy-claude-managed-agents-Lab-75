import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lessonKnowledgeCheck } from '../shared/learning-quizzes';
import { knowledgeKey, knowledgePassed, readKnowledgeAttempt } from '../src/lib/learning-knowledge';
import { exportLearningBackup, restoreLearningBackup } from '../src/lib/learning-backup';
import { readLearningProgress } from '../src/lib/learning-progress';

test('all 75 labs have distinct authored questions, three choices and an explained answer', () => {
  const questions = new Set<string>(), positions = new Set<number>();
  for (let id = 1; id <= 75; id++) {
    const check = lessonKnowledgeCheck(id); questions.add(check.question); positions.add(check.correctIndex);
    assert.equal(check.choices.length, 3); assert.equal(new Set(check.choices).size, 3);
    assert.ok(check.explanation.length > 30); assert.ok(check.choices[check.correctIndex]);
  }
  assert.equal(questions.size, 75); assert.equal(positions.size, 3);
  assert.throws(() => lessonKnowledgeCheck(76));
});

test('stored answers are regraded, stale or forged results rejected, and checklists stay independent', () => {
  const checkedAt = '2026-10-18T08:00:00.000Z', correct = lessonKnowledgeCheck(65).correctIndex;
  const good = { version: 1, selected: correct, checkedAt };
  const read = (value: unknown) => readKnowledgeAttempt({ getItem: () => JSON.stringify(value) }, 65);
  assert.equal(knowledgePassed(65, read(good)), true);
  assert.equal(knowledgePassed(65, read({ ...good, selected: (correct + 1) % 3 })), false);
  for (const bad of [{ ...good, passed: true }, { ...good, version: 0 }, { ...good, selected: 3 }, { ...good, checkedAt: 'invalid' }, { ...good, checkedAt: '2026-10-18T08:00:00+02:00' }]) assert.equal(read(bad), null);
  const progress = readLearningProgress({ getItem: key => key === knowledgeKey(65) ? JSON.stringify(good) : null }, [65]);
  assert.equal(progress.completed, 0); assert.equal(progress.lessons[0]?.knowledgeCorrect, true);
});

test('version 2 backups round trip knowledge while version 1 restores preserve existing answers', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const attempt = { version: 1, selected: lessonKnowledgeCheck(65).correctIndex, checkedAt: '2026-10-18T08:00:00.000Z' };
  storage.setItem(knowledgeKey(65), JSON.stringify(attempt));
  const backup = exportLearningBackup(storage, [65]); assert.equal(backup.version, 2);
  storage.removeItem(knowledgeKey(65)); restoreLearningBackup(storage, backup, [65]);
  assert.equal(knowledgePassed(65, readKnowledgeAttempt(storage, 65)), true);
  const legacy = { ...backup, version: 1 as const, lessons: backup.lessons.map(({ knowledge: _knowledge, ...lesson }) => lesson) };
  restoreLearningBackup(storage, legacy, [65]);
  assert.equal(storage.getItem(knowledgeKey(65)), JSON.stringify(attempt));
});
