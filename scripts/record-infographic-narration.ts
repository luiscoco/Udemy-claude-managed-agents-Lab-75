import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { allLessonInfographics, infographicKey, infographicText, infographicSegments, infographicPrompt } from '../shared/learning-infographics.js';
import { alignNarrationSegments } from '../shared/learning-narration.js';
import { infographicManifestSchema, type InfographicManifest } from '../shared/infographic-assets.js';
import { isNarrationMp3, readNarrationRecording, writeNarrationRecording } from '../server/lib/learning-narration-cache.js';

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const args = process.argv.slice(2);
if (args.some(arg => !['--plan', '--execute-authorized-infographic-recording'].includes(arg) && !/^--lessons=\d+(?:,\d+)*$/.test(arg))) throw new Error('Unknown infographic recording option.');
const selection = args.find(arg => arg.startsWith('--lessons='))?.slice(10).split(',').map(Number);
if (selection?.some(id => id < 1 || id > 75)) throw new Error('Invalid lesson selection.');
const plan = allLessonInfographics.filter(visual => !selection || selection.includes(visual.lessonId)).map(visual => ({ visual, text: infographicText(visual) }));
if (!plan.length || plan.length > 150 || plan.some(item => item.text.length > 2000)) throw new Error('Review narration bounds.');
if (args.includes('--plan')) { console.log(JSON.stringify({ images: plan.length, recordings: plan.length, regions: plan.length * 6, characters: plan.reduce((n, p) => n + p.text.length, 0), providerRequests: 0 })); process.exit(0); }
if (!args.includes('--execute-authorized-infographic-recording') || !process.env.INWORLD_API_KEY?.trim() || process.env.INWORLD_NARRATION_ENABLED !== '1') throw new Error('Explicit author opt-in and Inworld configuration required.');
const voiceId = process.env.INWORLD_VOICE_ID || 'Yash', modelId = process.env.INWORLD_MODEL_ID || 'inworld-tts-2';
const directory = resolve('public/infographics'), output = resolve('public/audio/infographics'), cache = resolve('artifacts/learning-guide/infographic-cache');
await mkdir(output, { recursive: true }); await mkdir(resolve(directory, 'prompts'), { recursive: true });
const manifestFile = resolve(directory, 'pilot-manifest.json');
let manifest: InfographicManifest;
try { manifest = infographicManifestSchema.parse(JSON.parse(await readFile(manifestFile, 'utf8'))); }
catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw new Error('Invalid existing manifest; preserved for review.'); manifest = { version: 1, provider: 'inworld', voiceId, modelId, assets: {} }; }
if (manifest.voiceId !== voiceId || manifest.modelId !== modelId) throw new Error('Existing voice or model differs. Review before replacing.');
const environment: NodeJS.ProcessEnv = {};
for (const name of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP']) if (process.env[name]) environment[name] = process.env[name];
let generated = 0, reused = 0;
for (const { visual, text } of plan) {
  const key = infographicKey(visual.lessonId, visual.kind), segments = infographicSegments(visual);
  const imageFile = `infographics/lab-${String(visual.lessonId).padStart(2, '0')}-${visual.kind}.png`, image = await readFile(resolve('public', imageFile));
  if (image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || image.length > 8 * 1024 * 1024) throw new Error('Invalid infographic PNG.');
  const imageHash = hash(image), contentSha256 = hash(JSON.stringify(visual)), existing = manifest.assets[key];
  if (existing?.text === text && existing.image.sha256 === imageHash && existing.contentSha256 === contentSha256) {
    if (hash(await readFile(resolve('public', existing.recording.file))) !== existing.recording.sha256) throw new Error('Existing narration hash mismatch.');
    reused++; continue;
  }
  const cacheKey = hash(JSON.stringify({ version: 1, key, text, voiceId, modelId, timestampType: 'WORD' }));
  let recording = await readNarrationRecording(cache, cacheKey);
  if (!recording) {
    const response = await fetch('https://api.inworld.ai/tts/v1/voice', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Basic ${process.env.INWORLD_API_KEY!.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId, modelId, timestampType: 'WORD', applyTextNormalization: 'OFF', audioConfig: { audioEncoding: 'MP3', bitRate: 64000 } }) });
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Recording HTTP ${response.status}; review before retrying.`); }
    const reader = response.body?.getReader(); if (!reader) throw new Error('Empty recording response.');
    let size = 0; const chunks: Uint8Array[] = [];
    try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 6 * 1024 * 1024) throw new Error('Recording response too large.'); chunks.push(value); } }
    finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    let payload; try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('Invalid recording response.'); }
    if (typeof payload.audioContent !== 'string') throw new Error('Missing recording.');
    const audio = Buffer.from(payload.audioContent, 'base64'); if (!isNarrationMp3(audio)) throw new Error('Invalid MP3.');
    // Raw timestamps are retained privately for review if alignment needs correction.
    await mkdir(cache, { recursive: true });
    await writeFile(resolve(cache, `${cacheKey}-timestamps.json`), JSON.stringify(payload.timestampInfo ?? null));
    recording = { audio, timeline: alignNarrationSegments(visual.lessonId, visual.kind, segments, payload.timestampInfo) };
    await writeNarrationRecording(cache, cacheKey, recording); generated++;
  } else reused++;
  if (recording.timeline.source !== 'inworld-word' || recording.timeline.cues.length !== 6 || recording.timeline.cues.some((cue, i) => cue.id !== segments[i]?.id)) throw new Error('Region timing needs review; recording preserved privately.');
  const sha256 = hash(recording.audio), stem = `audio/infographics/visual-${visual.lessonId}-${visual.kind}-${sha256.slice(0, 16)}`;
  await writeFile(resolve('public', `${stem}.mp3`), recording.audio);
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', resolve('public', `${stem}.mp3`)], { env: environment, encoding: 'utf8', windowsHide: true });
  const durationSeconds = Number(probe.stdout.trim());
  const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', resolve('public', `${stem}.mp3`), '-f', 'null', '-'], { env: environment, encoding: 'utf8', windowsHide: true });
  if (probe.status !== 0 || decode.status !== 0 || decode.stderr.trim() || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 600 || recording.timeline.cues.some(cue => cue.end > durationSeconds + 0.25)) throw new Error('MP3 decode or duration verification failed.');
  await writeFile(resolve('public', `${stem}.json`), JSON.stringify(recording.timeline, null, 2) + '\n');
  manifest.assets[key] = { image: { file: imageFile, sha256: imageHash, width: image.readUInt32BE(16), height: image.readUInt32BE(20) },
    text, contentSha256, recording: { file: `${stem}.mp3`, timingFile: `${stem}.json`, sha256, durationSeconds } };
  infographicManifestSchema.parse(manifest);
  await writeFile(resolve(directory, 'pilot-manifest.authoring.tmp'), JSON.stringify(manifest, null, 2) + '\n');
  await rename(resolve(directory, 'pilot-manifest.authoring.tmp'), manifestFile);
  const promptFile = resolve(directory, `prompts/lab-${String(visual.lessonId).padStart(2, '0')}-${visual.kind}.txt`);
  try { await writeFile(promptFile, infographicPrompt(visual) + '\n', { flag: 'wx' }); } catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error; }
  console.log(JSON.stringify({ key, generated, reused, bytes: recording.audio.length, seconds: durationSeconds, cues: recording.timeline.cues.length }));
}
console.log(JSON.stringify({ recordings: Object.keys(manifest.assets).length, generated, reused, provider: 'inworld' }));
