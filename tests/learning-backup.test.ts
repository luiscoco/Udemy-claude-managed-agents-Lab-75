import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exportLearningBackup, maxBackupBytes, parseLearningBackup, restoreLearningBackup } from '../src/lib/learning-backup';
import { bookmarkKey, checklistKey, noteKey, positionKey } from '../src/lib/learning-progress';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function sample() {
  const store = new MemoryStorage();
  store.setItem(checklistKey(65), '[true,true,true,true]'); store.setItem(positionKey(65), 'evidence');
  store.setItem(noteKey(65), '<script>plain study note</script>'); store.setItem(bookmarkKey(65), '1');
  store.setItem('managed-learning-visited-65', '1'); store.setItem('managed-learning-last-lesson', '65');
  store.setItem('unrelated-private-value', 'must-not-export'); return store;
}

test('backup round trip preserves learning fields and excludes unrelated storage', () => {
  const source = sample(), backup = exportLearningBackup(source, [65]);
  assert.equal(JSON.stringify(backup).includes('must-not-export'), false);
  const restored = new MemoryStorage(); restored.setItem('unrelated-private-value', 'preserve-me');
  assert.equal(restoreLearningBackup(restored, parseLearningBackup(JSON.stringify(backup), [65]), [65]), 1);
  for (const key of [checklistKey(65), positionKey(65), noteKey(65), bookmarkKey(65), 'managed-learning-visited-65', 'managed-learning-last-lesson'])
    assert.equal(restored.getItem(key), source.getItem(key));
  assert.equal(restored.getItem('unrelated-private-value'), 'preserve-me');
});

test('closed schema rejects duplicates, oversized text, unknown lessons and extra settings before writes', () => {
  const valid = exportLearningBackup(sample(), [65]);
  for (const candidate of [
    { ...valid, version: 2 }, { ...valid, course: 'another-course' }, { ...valid, apiKey: 'unexpected' },
    { ...valid, lessons: [...valid.lessons, ...valid.lessons] },
    { ...valid, lessons: [{ ...valid.lessons[0], note: 'x'.repeat(4001) }] },
    { ...valid, lessons: [{ ...valid.lessons[0], savedStep: 'unknown' }] },
    { ...valid, lessons: [{ ...valid.lessons[0], checklist: ['true', true, true, true] }] },
  ]) assert.throws(() => parseLearningBackup(JSON.stringify(candidate), [65]));
  assert.throws(() => parseLearningBackup(JSON.stringify(valid), [1]));
  assert.throws(() => parseLearningBackup('x'.repeat(maxBackupBytes + 1), [65]), /2 MB/);
  const store = sample(), before = [...store.values];
  assert.throws(() => restoreLearningBackup(store, { ...valid, version: 2 } as never, [65]));
  assert.deepEqual([...store.values], before);
});

test('partial restore updates included lessons only, including clearing old notes and positions', () => {
  const store = sample(); store.setItem(noteKey(1), 'keep other lesson');
  const backup = exportLearningBackup(new MemoryStorage(), [65]);
  restoreLearningBackup(store, backup, [1, 65]);
  assert.equal(store.getItem(noteKey(1)), 'keep other lesson');
  assert.equal(store.getItem(noteKey(65)), null); assert.equal(store.getItem(positionKey(65)), null);
  assert.equal(store.getItem(bookmarkKey(65)), null);
});

test('failed restore rolls back the learning values already changed', () => {
  const store = sample(), before = [...store.values].sort();
  const backup = exportLearningBackup(new MemoryStorage(), [65]);
  const original = store.removeItem.bind(store); let rejectOnce = true;
  store.removeItem = key => { if (key === noteKey(65) && rejectOnce) { rejectOnce = false; throw new Error('Quota denied.'); } original(key); };
  assert.throws(() => restoreLearningBackup(store, backup, [65]), /Previous values were restored/);
  assert.deepEqual([...store.values].sort(), before);
});

test('rollback refusal is reported explicitly rather than claiming a successful restore', () => {
  const store = sample(), backup = exportLearningBackup(new MemoryStorage(), [65]);
  store.setItem = () => { throw new Error('Persistent storage denial.'); };
  assert.throws(() => restoreLearningBackup(store, backup, [65]), /Some learning values may have changed/);
});
