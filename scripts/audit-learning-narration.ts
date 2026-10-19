import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { learningGuide } from '../shared/learning-guide.js';
import { narrationSegments, narrationTimelineSchema } from '../shared/learning-narration.js';
import { includedRecording, narrationManifestSchema } from '../shared/learning-recordings.js';
import { isNarrationMp3 } from '../server/lib/learning-narration-cache.js';

export async function auditLearningNarration(root = resolve('public')) {
  const manifest = narrationManifestSchema.parse(JSON.parse(await readFile(resolve(root, 'audio/guides/manifest.json'), 'utf8')));
  const expected = new Set(['manifest.json']);
  let clips = 0, bytes = 0, seconds = 0;
  for (let lessonId = 1; lessonId <= 75; lessonId++) for (const step of learningGuide(lessonId)) {
    const clip = includedRecording(manifest, lessonId, step);
    if (!clip) throw new Error(`Missing or stale recording: ${lessonId}:${step.id}`);
    for (const path of [clip.file, clip.timingFile]) {
      if (!(await lstat(resolve(root, path))).isFile()) throw new Error('Recording must be a regular file.');
      expected.add(path.slice('audio/guides/'.length));
    }
    const audio = await readFile(resolve(root, clip.file));
    if (!isNarrationMp3(audio) || createHash('sha256').update(audio).digest('hex') !== clip.sha256) throw new Error(`Recording integrity: ${lessonId}:${step.id}`);
    const timing = narrationTimelineSchema.parse(JSON.parse(await readFile(resolve(root, clip.timingFile), 'utf8')));
    const segments = narrationSegments(step);
    if (timing.lessonId !== lessonId || timing.stepId !== step.id || timing.source !== 'inworld-word' ||
      timing.cues.length !== segments.length || timing.cues.some((cue, index) => cue.id !== segments[index]?.id || cue.end > clip.durationSeconds + 0.25))
      throw new Error(`Recording timing: ${lessonId}:${step.id}`);
    if (clip.file.replace(/\.mp3$/, '.json') !== clip.timingFile || !clip.file.includes(clip.sha256.slice(0, 16))) throw new Error('Recording identity mismatch.');
    clips++; bytes += audio.length; seconds += clip.durationSeconds;
  }
  if (Object.keys(manifest.clips).length !== clips) throw new Error('Unexpected manifest clip.');
  const files = await readdir(resolve(root, 'audio/guides'));
  if (files.length !== expected.size || files.some(file => !expected.has(file))) throw new Error('Unexpected or missing recording file.');
  return { clips, files: expected.size, bytes, minutes: Math.round(seconds / 60), providerRequests: 0 };
}
if (process.argv[1]?.endsWith('audit-learning-narration.ts')) console.log(JSON.stringify(await auditLearningNarration()));
