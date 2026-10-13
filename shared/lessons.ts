import { z } from 'zod';

const text = z.string().trim().min(1);
export const lessonMetadataSchema = z.strictObject({
  id: z.number().int().min(0).max(75),
  slug: z.string().regex(/^[a-z]+(?:-[a-z]+)*$/).optional(),
  title: text, topic: text, serverPrefix: text, objective: text,
  steps: z.array(text).min(1), inspect: z.array(text).min(1), challenge: text,
}).superRefine((lesson, ctx) => {
  if (lesson.serverPrefix !== `/api/c${lesson.id}`)
    ctx.addIssue({ code: 'custom', path: ['serverPrefix'], message: 'Use /api/c followed by the unpadded numeric ID.' });
});
export type LessonMetadata = z.infer<typeof lessonMetadataSchema>;
export function validateLessonRegistry(entries: readonly unknown[]): LessonMetadata[] {
  const lessons = entries.map((entry) => lessonMetadataSchema.parse(entry));
  if (new Set(lessons.map(({ id }) => id)).size !== lessons.length) throw new Error('Duplicate lesson ID');
  return lessons;
}
export function validateLessonRecords<C>(entries: readonly (LessonMetadata & { component: C })[]) {
  const metadata = validateLessonRegistry(entries.map(({ component: _component, ...entry }) => entry));
  return entries.map((entry, index) => {
    if (typeof entry.component !== 'function') throw new Error('Missing lesson component');
    return { ...metadata[index]!, component: entry.component };
  });
}
export const reservedLessonIds: readonly number[] = Object.freeze(Array.from({ length: 75 }, (_, i) => i + 1));
