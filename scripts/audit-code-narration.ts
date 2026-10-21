import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { codeCatalogSchema, codeManifestSchema, normalizedCode, codeTourText } from '../shared/code-tours.js';
import { narrationTimelineSchema } from '../shared/learning-narration.js';
import { isNarrationMp3 } from '../server/lib/learning-narration-cache.js';

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const catalog = codeCatalogSchema.parse(JSON.parse(await readFile('public/code-tours/catalog.json', 'utf8')));
const manifest = codeManifestSchema.parse(JSON.parse(await readFile('public/audio/code/manifest.json', 'utf8')));
if (catalog.tours.length !== 75 || new Set(catalog.tours.map(item => item.lessonId)).size !== 75 || Object.keys(manifest.recordings).length !== 75) throw new Error('All 75 labs must have one main-file recording.');
const expectedFiles = new Set(['manifest.json', ...Object.values(manifest.recordings).flatMap(recording => [recording.file, recording.timingFile].map(path => path.replace(/^audio\/code\//, '')))]);
const actualFiles = await readdir('public/audio/code');
if (actualFiles.length !== expectedFiles.size || actualFiles.some(path => !expectedFiles.has(path))) throw new Error('Code media inventory has missing or obsolete files.');
let cues = 0, seconds = 0;
for (const tour of catalog.tours) {
  const recording = manifest.recordings[String(tour.lessonId)]!, source = normalizedCode(await readFile(tour.path, 'utf8'));
  if (!recording || hash(source) !== tour.sourceSha256 || recording.sourceSha256 !== tour.sourceSha256 || recording.textSha256 !== hash(codeTourText(tour))) throw new Error(`Code/text changed for Lab ${tour.lessonId}.`);
  const audio = await readFile(`public/${recording.file}`), timing = await readFile(`public/${recording.timingFile}`);
  if (!isNarrationMp3(audio) || hash(audio) !== recording.sha256 || hash(timing) !== recording.timingSha256) throw new Error('Code media integrity failed.');
  const timeline = narrationTimelineSchema.parse(JSON.parse(timing.toString('utf8')));
  if (timeline.lessonId !== tour.lessonId || timeline.stepId !== 'code' || timeline.source !== 'inworld-word' || timeline.cues.length !== tour.sections.length ||
    timeline.cues.some((cue, i) => cue.id !== tour.sections[i]?.id || cue.end > recording.durationSeconds + .25) || tour.sections.some(section => section.endLine > source.split('\n').length)) throw new Error('Code source anchors or word timing mismatch.');
  cues += timeline.cues.length; seconds += recording.durationSeconds;
}
console.log(JSON.stringify({ labs: 75, recordings: 75, filesPerLab: 1, timedCodeSections: cues, seconds: Math.round(seconds), providerRequests: 0 }));
