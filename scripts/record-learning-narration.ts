import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { learningGuide } from '../shared/learning-guide.js';
import { alignNarration, narrationText, narrationSegments } from '../shared/learning-narration.js';
import { narrationClipKey, narrationManifestSchema, type NarrationManifest } from '../shared/learning-recordings.js';
import { isNarrationMp3, readNarrationRecording, writeNarrationRecording } from '../server/lib/learning-narration-cache.js';

const args = process.argv.slice(2), allowed = /^(--plan|--execute-authorized-narration-recording|--limit=\d+|--concurrency=[1-4])$/;
if (args.some(arg => !allowed.test(arg))) throw new Error('Unsupported recording option.');
const limit = Number(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] ?? 525);
if (!Number.isInteger(limit) || limit < 1 || limit > 525) throw new Error('Invalid recording limit.');
const concurrency = Number(args.find(arg => arg.startsWith('--concurrency='))?.split('=')[1] ?? 2);
const plan = Array.from({ length: 75 }, (_, index) => learningGuide(index + 1).map(step => ({ lessonId: index + 1, step, text: narrationText(step) }))).flat();
const characters = plan.reduce((total, item) => total + item.text.length, 0);
if (plan.length !== 525 || characters > 400000 || plan.some(item => item.text.length > 2000)) throw new Error('Review changed recording bounds.');
if (args.includes('--plan')) { console.log(JSON.stringify({ clips: plan.length, characters, selectedLimit: limit, concurrency, providerRequests: 0 })); process.exit(0); }
if (!args.includes('--execute-authorized-narration-recording')) throw new Error('Explicit authorized recording flag required.');
if (!process.env.INWORLD_API_KEY?.trim() || process.env.INWORLD_NARRATION_ENABLED !== '1') throw new Error('Configure the author Inworld key and opt-in.');
const voiceId = process.env.INWORLD_VOICE_ID || 'Yash', modelId = process.env.INWORLD_MODEL_ID || 'inworld-tts-2';
const output = resolve('public/audio/guides'), work = resolve('artifacts/learning-guide/narration-cache');
await mkdir(output, { recursive: true });
const manifestPath = resolve(output, 'manifest.json');
let manifest: NarrationManifest;
try { manifest = narrationManifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8'))); }
catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw new Error('Existing audio manifest is invalid; preserved for review.');
  manifest = { version: 1, provider: 'inworld', voiceId, modelId, recordedOn: new Date().toISOString(), clips: {} };
}
if (manifest.voiceId !== voiceId || manifest.modelId !== modelId) throw new Error('Existing recordings use another voice/model; review before replacing them.');
let cursor = 0, generated = 0, reused = 0, completed = 0, failed = false;
let writes = Promise.resolve();
const environment: NodeJS.ProcessEnv = {};
for (const name of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP']) if (process.env[name]) environment[name] = process.env[name];
function duration(file: string) {
  const result = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], { encoding: 'utf8', env: environment, windowsHide: true });
  const seconds = Number(result.stdout?.trim());
  if (result.status !== 0 || !Number.isFinite(seconds) || seconds <= 0 || seconds > 600) throw new Error('MP3 duration could not be verified.');
  const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { encoding: 'utf8', env: environment, windowsHide: true });
  if (decode.status !== 0 || decode.stderr.trim()) throw new Error('MP3 decode validation failed.');
  return seconds;
}
async function saveManifest() {
  const text = JSON.stringify({ ...manifest, recordedOn: new Date().toISOString() }, null, 2) + '\n';
  writes = writes.then(async () => {
    const temporary = resolve(output, 'manifest.authoring.tmp');
    await writeFile(temporary, text);
    await rename(temporary, manifestPath);
  }); await writes;
}
async function record(item: typeof plan[number]) {
  const key = narrationClipKey(item.lessonId, item.step.id), existing = manifest.clips[key];
  if (existing?.text === item.text) {
    const audio = await readFile(resolve('public', existing.file));
    if (createHash('sha256').update(audio).digest('hex') !== existing.sha256) throw new Error('Existing recording hash mismatch.');
    reused++; completed++; return;
  }
  const cacheKey = createHash('sha256').update(JSON.stringify({ version: 3, lessonId: item.lessonId, stepId: item.step.id, text: item.text, voiceId, modelId, timestampType: 'WORD' })).digest('hex');
  let recording = await readNarrationRecording(work, cacheKey);
  if (!recording) {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 4; attempt++) {
      response = await fetch('https://api.inworld.ai/tts/v1/voice', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60000),
        headers: { Authorization: `Basic ${process.env.INWORLD_API_KEY!.trim()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, voiceId, modelId, timestampType: 'WORD', applyTextNormalization: 'OFF', audioConfig: { audioEncoding: 'MP3', bitRate: 64000 } }) });
      if (response.status !== 429 || attempt === 3) break;
      const delay = Math.min(30000, Math.max(1000, Number(response.headers.get('Retry-After') || 5) * 1000));
      await response.body?.cancel(); await new Promise(resolve => setTimeout(resolve, delay));
    }
    if (!response?.ok) { await response?.body?.cancel(); throw new Error(`Inworld rejected recording with HTTP ${response?.status ?? 'unknown'}.`); }
    const reader = response.body?.getReader(); if (!reader) throw new Error('Empty recording response.');
    const chunks: Uint8Array[] = []; let size = 0;
    try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 6 * 1024 * 1024) throw new Error('Recording response exceeds bounds.'); chunks.push(value); } }
    finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    let payload;
    try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new Error('Invalid recording JSON response.'); }
    if (typeof payload.audioContent !== 'string') throw new Error('Missing recording audio.');
    const audio = Buffer.from(payload.audioContent, 'base64'); if (!isNarrationMp3(audio)) throw new Error('Invalid recording MP3.');
    recording = { audio, timeline: alignNarration(item.lessonId, item.step, payload.timestampInfo) };
    await writeNarrationRecording(work, cacheKey, recording); generated++;
  } else reused++;
  if (recording.timeline.source !== 'inworld-word' || recording.timeline.cues.length !== narrationSegments(item.step).length)
    throw new Error(`Lab ${item.lessonId} ${item.step.id}: word timing needs review; audio preserved in author cache.`);
  const hash = createHash('sha256').update(recording.audio).digest('hex');
  const stem = `audio/guides/tour-${item.lessonId}-${item.step.id}-${hash.slice(0, 16)}`;
  const file = `${stem}.mp3`, timingFile = `${stem}.json`, absolute = resolve('public', file);
  await writeFile(absolute, recording.audio);
  const seconds = duration(absolute);
  if (recording.timeline.cues.some(cue => cue.end > seconds + 0.25)) throw new Error('Provider timing extends beyond its recording.');
  await writeFile(resolve('public', timingFile), JSON.stringify(recording.timeline, null, 2) + '\n');
  manifest.clips[key] = { file, timingFile, text: item.text, sha256: hash, durationSeconds: seconds };
  await saveManifest(); completed++;
  console.log(JSON.stringify({ completed, selected: limit, generated, reused, lessonId: item.lessonId, stepId: item.step.id, bytes: recording.audio.length, cues: recording.timeline.cues.length }));
}
async function worker() {
  while (!failed && cursor < Math.min(limit, plan.length)) {
    const item = plan[cursor++]!;
    try { await record(item); }
    catch (error) { failed = true; console.error(JSON.stringify({ lessonId: item.lessonId, stepId: item.step.id, error: error instanceof Error && !/key|credential|authorization/i.test(error.message) ? error.message : 'Recording did not complete; inspect author setup.' })); process.exitCode = 1; }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker)); await writes;
console.log(JSON.stringify({ completed, selected: limit, manifestClips: Object.keys(manifest.clips).length, generated, reused, failed }));
