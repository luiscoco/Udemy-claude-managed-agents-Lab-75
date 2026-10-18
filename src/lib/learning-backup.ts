import { z } from 'zod';
import { bookmarkKey, checklistKey, noteKey, positionKey } from './learning-progress';
import { knowledgeKey, readKnowledgeAttempt, validKnowledgeAttempt } from './learning-knowledge';

export const maxBackupBytes = 2 * 1024 * 1024;
const backupSchema = z.strictObject({ version: z.union([z.literal(1), z.literal(2)]), course: z.literal('claude-managed-agents'),
  exportedAt: z.iso.datetime(), lastLesson: z.number().int().min(1).max(75).nullable(),
  lessons: z.array(z.strictObject({ lessonId: z.number().int().min(1).max(75),
    checklist: z.tuple([z.boolean(), z.boolean(), z.boolean(), z.boolean()]),
    savedStep: z.enum(['goal', 'preparation', 'example', 'controls', 'evidence', 'source', 'practice']).nullable(),
    visited: z.boolean(), note: z.string().max(4000), bookmarked: z.boolean(),
    knowledge: z.strictObject({ version: z.literal(1), selected: z.number().int().min(0).max(2), checkedAt: z.iso.datetime() }).refine(validKnowledgeAttempt).nullable().optional() })).min(1).max(75),
}).superRefine((backup, context) => {
  for (const [index, item] of backup.lessons.entries()) {
    if (backup.version === 2 && item.knowledge === undefined || backup.version === 1 && item.knowledge !== undefined)
      context.addIssue({ code: 'custom', path: ['lessons', index, 'knowledge'], message: 'Knowledge field must match backup version.' });
  }
});
export type LearningBackup = z.infer<typeof backupSchema>;

export function parseLearningBackup(text: string, allowedIds: readonly number[]): LearningBackup {
  if (new TextEncoder().encode(text).length > maxBackupBytes) throw new Error('Backup exceeds the 2 MB limit.');
  let backup: LearningBackup;
  try { backup = backupSchema.parse(JSON.parse(text)); } catch { throw new Error('Choose a valid version 1 or 2 Managed Agents learning backup.'); }
  const ids = backup.lessons.map(item => item.lessonId);
  if (new Set(ids).size !== ids.length || ids.some(id => !allowedIds.includes(id)) || backup.lastLesson !== null && !allowedIds.includes(backup.lastLesson))
    throw new Error('Backup has duplicate or unavailable lesson IDs.');
  return backup;
}

export function exportLearningBackup(storage: Pick<Storage, 'getItem'>, ids: readonly number[]): LearningBackup {
  const lessons = ids.map(lessonId => {
    let values: unknown; try { values = JSON.parse(storage.getItem(checklistKey(lessonId)) ?? 'null'); } catch { values = null; }
    const checklist = [0, 1, 2, 3].map(i => Array.isArray(values) && values[i] === true);
    const saved = storage.getItem(positionKey(lessonId));
    return { lessonId, checklist, savedStep: ['goal', 'preparation', 'example', 'controls', 'evidence', 'source', 'practice'].includes(saved ?? '') ? saved : null,
      visited: storage.getItem(`managed-learning-visited-${lessonId}`) === '1', note: (storage.getItem(noteKey(lessonId)) ?? '').slice(0, 4000),
      bookmarked: storage.getItem(bookmarkKey(lessonId)) === '1', knowledge: readKnowledgeAttempt(storage, lessonId) };
  });
  const last = storage.getItem('managed-learning-last-lesson');
  const backup = { version: 2, course: 'claude-managed-agents', exportedAt: new Date().toISOString(),
    lastLesson: last && /^\d{1,2}$/.test(last) && ids.includes(Number(last)) ? Number(last) : null, lessons };
  return parseLearningBackup(JSON.stringify(backup), ids);
}

export function restoreLearningBackup(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, backup: LearningBackup, allowedIds: readonly number[]) {
  // Validate again at the write boundary; callers cannot bypass preview validation.
  const validated = parseLearningBackup(JSON.stringify(backup), allowedIds);
  const changes = new Map<string, string | null>();
  for (const item of validated.lessons) {
    changes.set(checklistKey(item.lessonId), JSON.stringify(item.checklist)); changes.set(positionKey(item.lessonId), item.savedStep);
    changes.set(noteKey(item.lessonId), item.note || null); changes.set(bookmarkKey(item.lessonId), item.bookmarked ? '1' : null);
    changes.set(`managed-learning-visited-${item.lessonId}`, item.visited ? '1' : null);
    if (item.knowledge !== undefined) changes.set(knowledgeKey(item.lessonId), item.knowledge === null ? null : JSON.stringify(item.knowledge));
  }
  changes.set('managed-learning-last-lesson', validated.lastLesson === null ? null : String(validated.lastLesson));
  const previous = new Map([...changes.keys()].map(key => [key, storage.getItem(key)]));
  const apply = (key: string, value: string | null) => value === null ? storage.removeItem(key) : storage.setItem(key, value);
  try { for (const [key, value] of changes) apply(key, value); }
  catch {
    let rolledBack = true;
    for (const [key, value] of previous) { try { apply(key, value); } catch { rolledBack = false; } }
    throw new Error(rolledBack ? 'Storage refused the restore. Previous values were restored.' : 'Storage refused the restore and rollback. Some learning values may have changed; inspect your progress before retrying.');
  }
  return validated.lessons.length;
}
