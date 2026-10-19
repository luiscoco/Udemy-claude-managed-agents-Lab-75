import { z } from 'zod';
import type { GuideStep } from './learning-guide.js';

export type NarrationSegment = { id: string; text: string; kind: 'title' | 'explanation' | 'action' };
export function narrationSegments(step: GuideStep): NarrationSegment[] {
  const sentences = [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(step.text)]
    .map(item => item.segment.trim()).filter(Boolean);
  return [
    { id: `${step.id}-title`, text: `${step.title}.`, kind: 'title' },
    ...sentences.map((text, index) => ({ id: `${step.id}-text-${index}`, text, kind: 'explanation' as const })),
    { id: `${step.id}-action`, text: `Your turn. ${step.action}`, kind: 'action' },
  ];
}
export const narrationText = (step: GuideStep) => narrationSegments(step).map(item => item.text).join(' ');
const cueSchema = z.strictObject({ id: z.string().max(60), start: z.number().finite().min(0).max(600), end: z.number().finite().min(0).max(600) });
export const narrationTimelineSchema = z.strictObject({
  version: z.literal(1), lessonId: z.number().int().min(1).max(75), stepId: z.string().max(30),
  source: z.enum(['inworld-word', 'section']), cues: z.array(cueSchema).max(40),
}).superRefine((value, context) => {
  if (value.source === 'section' && value.cues.length || value.source === 'inworld-word' && !value.cues.length)
    context.addIssue({ code: 'custom', message: 'Timing source does not match its cues.' });
  const ids = new Set<string>();
  value.cues.forEach((cue, index) => {
    if (cue.end <= cue.start || index && cue.start < value.cues[index - 1]!.end || ids.has(cue.id))
      context.addIssue({ code: 'custom', message: 'Narration cues must be unique, ordered and non-overlapping.' });
    ids.add(cue.id);
  });
});
export type NarrationTimeline = z.infer<typeof narrationTimelineSchema>;
export const sectionTimeline = (lessonId: number, stepId: string): NarrationTimeline => ({ version: 1, lessonId, stepId, source: 'section', cues: [] });
const words = (text: string) => text.normalize('NFKC').toLocaleLowerCase('en').match(/[\p{L}\p{N}]+/gu) ?? [];
const wordAlignmentSchema = z.object({
  words: z.array(z.string().max(200)).min(1).max(2000),
  wordStartTimeSeconds: z.array(z.number().finite().min(0).max(600)).max(2000),
  wordEndTimeSeconds: z.array(z.number().finite().min(0).max(600)).max(2000),
});

/** Accept provider timing only when its words match the exact authored narration. */
export function alignNarration(lessonId: number, step: GuideStep, timestampInfo: unknown): NarrationTimeline {
  const fallback = sectionTimeline(lessonId, step.id);
  const info = z.object({ wordAlignment: wordAlignmentSchema }).safeParse(timestampInfo);
  if (!info.success) return fallback;
  const alignment = info.data.wordAlignment;
  if (alignment.words.length !== alignment.wordStartTimeSeconds.length || alignment.words.length !== alignment.wordEndTimeSeconds.length) return fallback;
  const tokens: { text: string; start: number; end: number }[] = [];
  for (let index = 0; index < alignment.words.length; index++) {
    const start = alignment.wordStartTimeSeconds[index]!, end = alignment.wordEndTimeSeconds[index]!;
    if (end < start || index && start < alignment.wordStartTimeSeconds[index - 1]!) return fallback;
    for (const text of words(alignment.words[index]!)) tokens.push({ text, start, end });
  }
  const segments = narrationSegments(step), expected = segments.flatMap(segment => words(segment.text));
  if (tokens.length !== expected.length || tokens.some((token, index) => token.text !== expected[index])) return fallback;
  let offset = 0;
  const cues = segments.map(segment => {
    const length = words(segment.text).length;
    const start = tokens[offset]?.start ?? 0, end = tokens[offset + length - 1]?.end ?? 0;
    offset += length;
    return { id: segment.id, start, end };
  });
  const timeline = narrationTimelineSchema.safeParse({ version: 1, lessonId, stepId: step.id, source: 'inworld-word', cues });
  return timeline.success ? timeline.data : fallback;
}

export function narrationCueAt(timeline: NarrationTimeline | undefined, seconds: number): string | undefined {
  if (!timeline || !Number.isFinite(seconds) || seconds < 0) return undefined;
  // During silence between paragraphs, prepare the next paragraph rather than
  // dropping its outline and exposing the whole-section fallback. Keep the
  // final paragraph selected through the audio tail and until navigation.
  return (timeline.cues.find(cue => seconds < cue.end) ?? timeline.cues.at(-1))?.id;
}
