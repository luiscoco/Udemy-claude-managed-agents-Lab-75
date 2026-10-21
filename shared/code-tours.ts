import { z } from 'zod';

const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const codeSectionSchema = z.strictObject({
  id: z.string().regex(/^code-[0-9]+$/), title: z.string().min(1).max(160),
  text: z.string().min(1).max(1800), startLine: z.number().int().positive(), endLine: z.number().int().positive(),
}).refine(value => value.endLine >= value.startLine);
export const codeTourSchema = z.strictObject({
  lessonId: z.number().int().min(1).max(75), path: z.string().regex(/^server\/concepts\/\d{2}-[a-z0-9-]+\.ts$/),
  sourceSha256: digest, sections: z.array(codeSectionSchema).min(1).max(12),
}).superRefine((value, ctx) => {
  const ids = new Set<string>();
  for (const section of value.sections) {
    if (ids.has(section.id)) ctx.addIssue({ code: 'custom', message: 'Duplicate code section.' });
    ids.add(section.id);
  }
});
export const codeCatalogSchema = z.strictObject({ version: z.literal(1), tours: z.array(codeTourSchema).max(75) });
const stem = 'audio/code/code-(?:[1-9]|[1-6][0-9]|7[0-5])-[a-f0-9]{16}';
export const codeRecordingSchema = z.strictObject({
  sourceSha256: digest, textSha256: digest, sha256: digest,
  file: z.string().regex(new RegExp(`^${stem}\\.mp3$`)),
  timingFile: z.string().regex(new RegExp(`^${stem}\\.json$`)),
  timingSha256: digest, durationSeconds: z.number().finite().positive().max(600),
});
export const codeManifestSchema = z.strictObject({
  version: z.literal(1), provider: z.literal('inworld'), voiceId: z.string().min(1).max(200), modelId: z.string().min(1).max(100),
  recordings: z.record(z.string().regex(/^(?:[1-9]|[1-6][0-9]|7[0-5])$/), codeRecordingSchema),
});
export type CodeTour = z.infer<typeof codeTourSchema>;
export type CodeManifest = z.infer<typeof codeManifestSchema>;
export type CodeRecording = z.infer<typeof codeRecordingSchema>;
export const codeTourText = (tour: CodeTour) => tour.sections.map(section => section.text).join(' ');
export const normalizedCode = (source: string) => source.replaceAll('\r\n', '\n');
