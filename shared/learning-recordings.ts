import { z } from 'zod';
import type { GuideStep } from './learning-guide.js';
import { narrationText } from './learning-narration.js';

const stem = 'audio/guides/tour-(?:[1-9]|[1-6][0-9]|7[0-5])-(?:goal|preparation|example|controls|evidence|source|practice)-[a-f0-9]{16}';
export const narrationRecordingSchema = z.strictObject({
  file: z.string().regex(new RegExp(`^${stem}\\.mp3$`)),
  timingFile: z.string().regex(new RegExp(`^${stem}\\.json$`)),
  text: z.string().min(1).max(2000), sha256: z.string().regex(/^[a-f0-9]{64}$/),
  durationSeconds: z.number().finite().positive().max(600),
});
export const narrationManifestSchema = z.strictObject({
  version: z.literal(1), provider: z.literal('inworld'), voiceId: z.string().min(1).max(200), modelId: z.string().min(1).max(100),
  recordedOn: z.string().max(40),
  clips: z.record(z.string().regex(/^(?:[1-9]|[1-6][0-9]|7[0-5]):(?:goal|preparation|example|controls|evidence|source|practice)$/), narrationRecordingSchema),
});
export type NarrationManifest = z.infer<typeof narrationManifestSchema>;
export const narrationClipKey = (lessonId: number, stepId: string) => `${lessonId}:${stepId}`;
export function includedRecording(manifest: NarrationManifest | undefined, lessonId: number, step: GuideStep) {
  const clip = manifest?.clips[narrationClipKey(lessonId, step.id)];
  return clip?.text === narrationText(step) ? clip : undefined;
}
