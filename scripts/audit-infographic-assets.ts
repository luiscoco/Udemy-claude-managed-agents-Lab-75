import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { lessonInfographics, infographicKey, infographicText } from '../shared/learning-infographics.js';
import { infographicManifestSchema } from '../shared/infographic-assets.js';
import { narrationTimelineSchema } from '../shared/learning-narration.js';
import { isNarrationMp3 } from '../server/lib/learning-narration-cache.js';
const hash = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
export async function auditInfographicAssets(root = resolve('public')) {
  const manifest = infographicManifestSchema.parse(JSON.parse(await readFile(resolve(root, 'infographics/pilot-manifest.json'), 'utf8')));
  let imageBytes = 0, audioBytes = 0, seconds = 0;
  const expectedAudio = new Set<string>();
  for (const visual of lessonInfographics) {
    const key = infographicKey(visual.lessonId, visual.kind), asset = manifest.assets[key];
    if (!asset || asset.text !== infographicText(visual) || asset.contentSha256 !== hash(JSON.stringify(visual))) throw new Error(`Stale visual catalog: ${key}`);
    if (asset.image.file !== `infographics/lab-${String(visual.lessonId).padStart(2, '0')}-${visual.kind}.png`) throw new Error('Image identity mismatch.');
    for (const path of [asset.image.file, asset.recording.file, asset.recording.timingFile]) if (!(await lstat(resolve(root, path))).isFile()) throw new Error('Regular infographic asset required.');
    const image = await readFile(resolve(root, asset.image.file)), audio = await readFile(resolve(root, asset.recording.file));
    if (image.length < 24 || image.length > 8 * 1024 * 1024 || image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || hash(image) !== asset.image.sha256 ||
      image.readUInt32BE(16) !== asset.image.width || image.readUInt32BE(20) !== asset.image.height) throw new Error(`Image integrity: ${key}`);
    if (!isNarrationMp3(audio) || hash(audio) !== asset.recording.sha256 || !asset.recording.file.startsWith(`audio/infographics/visual-${visual.lessonId}-${visual.kind}-`) ||
      !asset.recording.file.includes(asset.recording.sha256.slice(0, 16)) || asset.recording.file.replace(/\.mp3$/, '.json') !== asset.recording.timingFile) throw new Error(`Audio integrity: ${key}`);
    const timeline = narrationTimelineSchema.parse(JSON.parse(await readFile(resolve(root, asset.recording.timingFile), 'utf8')));
    if (timeline.source !== 'inworld-word' || timeline.lessonId !== visual.lessonId || timeline.stepId !== visual.kind || timeline.cues.length !== 6 || timeline.cues.some((cue, index) => cue.id !== visual.regions[index]?.id || cue.end > asset.recording.durationSeconds + 0.25)) throw new Error(`Visual timing: ${key}`);
    if (visual.regions.length !== 6) throw new Error('Six visual regions required.');
    for (const region of visual.regions) {
      const { x, y, width, height } = region.box;
      if (![x, y, width, height].every(Number.isFinite) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 100 || y + height > 100) throw new Error('Region outside its image.');
      if (!/^(?:server|shared)\/[a-zA-Z0-9/-]+\.ts$/.test(region.source) || !(await lstat(resolve(region.source))).isFile()) throw new Error('Missing teaching source.');
    }
    for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) {
      const first = visual.regions[a]!.box, second = visual.regions[b]!.box;
      if (first.x < second.x + second.width && second.x < first.x + first.width && first.y < second.y + second.height && second.y < first.y + first.height) throw new Error('Overlapping study regions.');
    }
    imageBytes += image.length; audioBytes += audio.length; seconds += asset.recording.durationSeconds;
    expectedAudio.add(asset.recording.file.split('/').at(-1)!); expectedAudio.add(asset.recording.timingFile.split('/').at(-1)!);
  }
  const files = await readdir(resolve(root, 'audio/infographics'));
  if (Object.keys(manifest.assets).length !== 6 || files.length !== 12 || files.some(file => !expectedAudio.has(file))) throw new Error('Unexpected pilot recording inventory.');
  if ((await readdir(resolve(root, 'infographics'))).filter(file => file.endsWith('.png')).length !== 6) throw new Error('Unexpected pilot image inventory.');
  return { images: 6, recordings: 6, regions: 36, imageBytes, audioBytes, minutes: Math.round(seconds / 60), providerRequests: 0 };
}
if (process.argv[1]?.endsWith('audit-infographic-assets.ts')) console.log(JSON.stringify(await auditInfographicAssets()));
