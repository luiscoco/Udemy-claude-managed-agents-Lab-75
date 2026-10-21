import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { codeCatalogSchema, codeManifestSchema, codeTourText, normalizedCode, type CodeManifest } from '../shared/code-tours.js';
import { alignNarrationSegments } from '../shared/learning-narration.js';
import { isNarrationMp3, readNarrationRecording, writeNarrationRecording } from '../server/lib/learning-narration-cache.js';

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const args = process.argv.slice(2);
if (args.some(arg => !/^(--plan|--execute-authorized-code-recording|--lessons=\d+(?:,\d+)*)$/.test(arg))) throw new Error('Unknown code recording option.');
const selected = args.find(arg => arg.startsWith('--lessons='))?.slice(10).split(',').map(Number);
if (selected?.some(id => id < 1 || id > 75)) throw new Error('Invalid lesson selection.');
const catalog = codeCatalogSchema.parse(JSON.parse(await readFile('public/code-tours/catalog.json', 'utf8')));
const plan = catalog.tours.filter(tour => !selected || selected.includes(tour.lessonId));
if (!plan.length || plan.length > 75 || plan.some(tour => codeTourText(tour).length > 2000)) throw new Error('Review code narration bounds.');
for (const tour of plan) {
  if (hash(normalizedCode(await readFile(tour.path, 'utf8'))) !== tour.sourceSha256) throw new Error(`Source changed: ${tour.path}`);
}
if (args.includes('--plan')) {
  console.log(JSON.stringify({ recordings: plan.length, filesPerLab: 1, characters: plan.reduce((n, tour) => n + codeTourText(tour).length, 0), providerRequests: 0 })); process.exit(0);
}
if (!args.includes('--execute-authorized-code-recording') || !process.env.INWORLD_API_KEY?.trim() || process.env.INWORLD_NARRATION_ENABLED !== '1') throw new Error('Explicit author opt-in and Inworld configuration required.');
const voiceId = process.env.INWORLD_VOICE_ID || 'Yash', modelId = process.env.INWORLD_MODEL_ID || 'inworld-tts-2';
const output = resolve('public/audio/code'), cache = resolve('artifacts/learning-guide/code-cache'), manifestFile = resolve(output, 'manifest.json');
await mkdir(output, { recursive: true });
let manifest: CodeManifest;
try { manifest = codeManifestSchema.parse(JSON.parse(await readFile(manifestFile, 'utf8'))); }
catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; manifest = { version: 1, provider: 'inworld', voiceId, modelId, recordings: {} }; }
if (manifest.voiceId !== voiceId || manifest.modelId !== modelId) throw new Error('Review voice/model change before replacing existing recordings.');
const environment: NodeJS.ProcessEnv = {};
for (const name of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP']) if (process.env[name]) environment[name] = process.env[name];
let generated = 0, reused = 0, cursor = 0, stopped = false, persist = Promise.resolve();
async function worker() {
  while (!stopped && cursor < plan.length) {
    const tour = plan[cursor++]!, text = codeTourText(tour), textSha256 = hash(text), existing = manifest.recordings[String(tour.lessonId)];
    if (existing?.sourceSha256 === tour.sourceSha256 && existing.textSha256 === textSha256) {
      if (hash(await readFile(resolve('public', existing.file))) !== existing.sha256 || hash(await readFile(resolve('public', existing.timingFile))) !== existing.timingSha256) throw new Error('Existing code media hash mismatch.');
      reused++; continue;
    }
    const cacheKey = hash(JSON.stringify({ version: 1, text, voiceId, modelId, timestampType: 'WORD' }));
    let recording = await readNarrationRecording(cache, cacheKey);
    if (!recording) {
      const response = await fetch('https://api.inworld.ai/tts/v1/voice', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(90000),
        headers: { Authorization: `Basic ${process.env.INWORLD_API_KEY!.trim()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId, modelId, timestampType: 'WORD', applyTextNormalization: 'OFF', audioConfig: { audioEncoding: 'MP3', bitRate: 64000 } }) });
      if (!response.ok) { await response.body?.cancel(); throw new Error(`Recording HTTP ${response.status}; no automatic retry.`); }
      const reader = response.body?.getReader(); if (!reader) throw new Error('Empty recording response.');
      const chunks: Uint8Array[] = []; let size = 0;
      try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 6 * 1024 * 1024) throw new Error('Recording response too large.'); chunks.push(value); } }
      finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (typeof payload.audioContent !== 'string') throw new Error('Missing recording.');
      const audio = Buffer.from(payload.audioContent, 'base64'); if (!isNarrationMp3(audio)) throw new Error('Invalid MP3.');
      await mkdir(cache, { recursive: true });
      await writeFile(resolve(cache, `${cacheKey}-timestamps.json`), JSON.stringify(payload.timestampInfo ?? null));
      recording = { audio, timeline: alignNarrationSegments(tour.lessonId, 'code', tour.sections.map(section => ({ id: section.id, text: section.text, kind: 'explanation' })), payload.timestampInfo) };
      await writeNarrationRecording(cache, cacheKey, recording); generated++;
    } else reused++;
    if (recording.timeline.source !== 'inworld-word' || recording.timeline.cues.length !== tour.sections.length || recording.timeline.cues.some((cue, i) => cue.id !== tour.sections[i]?.id)) throw new Error(`Code timing needs review for Lab ${tour.lessonId}; cached without re-billing.`);
    const sha256 = hash(recording.audio), stem = `audio/code/code-${tour.lessonId}-${sha256.slice(0, 16)}`;
    await writeFile(resolve('public', `${stem}.mp3`), recording.audio);
    const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', resolve('public', `${stem}.mp3`)], { env: environment, encoding: 'utf8', windowsHide: true });
    const durationSeconds = Number(probe.stdout?.trim());
    const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', resolve('public', `${stem}.mp3`), '-f', 'null', '-'], { env: environment, encoding: 'utf8', windowsHide: true });
    if (probe.status !== 0 || decode.status !== 0 || decode.stderr?.trim() || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 600 || recording.timeline.cues.some(cue => cue.end > durationSeconds + .25)) throw new Error('MP3 decode or duration verification failed.');
    const timing = JSON.stringify(recording.timeline, null, 2) + '\n';
    await writeFile(resolve('public', `${stem}.json`), timing);
    manifest.recordings[String(tour.lessonId)] = { sourceSha256: tour.sourceSha256, textSha256, sha256, file: `${stem}.mp3`, timingFile: `${stem}.json`, timingSha256: hash(timing), durationSeconds };
    persist = persist.then(async () => {
      codeManifestSchema.parse(manifest);
      await writeFile(`${manifestFile}.authoring.tmp`, JSON.stringify(manifest, null, 2) + '\n');
      await rename(`${manifestFile}.authoring.tmp`, manifestFile);
    });
    await persist;
    console.log(JSON.stringify({ lessonId: tour.lessonId, generated, reused, seconds: durationSeconds, cues: tour.sections.length }));
  }
}
const outcomes = await Promise.allSettled([worker().catch(error => { stopped = true; throw error; }), worker().catch(error => { stopped = true; throw error; })]);
await persist;
for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason;
console.log(JSON.stringify({ recordings: Object.keys(manifest.recordings).length, generated, reused, provider: 'inworld' }));
