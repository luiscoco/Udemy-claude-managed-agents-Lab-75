import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import express from 'express';
import { createLearningGuideRouter } from '../server/routes/learning-guide.js';

if (!process.argv.includes('--execute-authorized-narration-test')) throw new Error('Explicit authorized narration flag required.');
if (!process.env.INWORLD_API_KEY || process.env.INWORLD_NARRATION_ENABLED !== '1') throw new Error('Configure server-only Inworld credentials and narration opt-in.');
const voiceId = process.env.INWORLD_VOICE_ID || 'Yash';
const app = express(); app.use('/guide', createLearningGuideRouter());
const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
try {
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No local port.');
  const response = await fetch(`http://127.0.0.1:${address.port}/guide/audio`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Learning-Guide': '1' }, body: JSON.stringify({ lessonId: 65, stepId: 'goal' }) });
  if (!response.ok) { console.error(`Narration test returned HTTP ${response.status}. Check local setup; no provider details or credentials were printed.`); process.exitCode = 1; }
  else {
    const audio = Buffer.from(await response.arrayBuffer());
    // MP3 normally starts with ID3 or an MPEG frame sync; do not label arbitrary bytes verified audio.
    const mp3 = audio.subarray(0, 3).toString() === 'ID3' || audio[0] === 0xff && ((audio[1] ?? 0) & 0xe0) === 0xe0;
    if (!mp3) throw new Error('Response was not recognized as MP3.');
    await mkdir('artifacts/learning-guide', { recursive: true });
    await writeFile('artifacts/learning-guide/live-narration.mp3', audio);
    const evidence = { at: new Date().toISOString(), provider: 'inworld', voiceId, modelId: process.env.INWORLD_MODEL_ID || 'inworld-tts-2',
      lessonId: 65, stepId: 'goal', bytes: audio.length, sha256: createHash('sha256').update(audio).digest('hex'),
      mp3HeaderVerified: true, requests: 1, modelAgentCalls: 0, note: 'Synthesis transport and MP3 header verified; playback listening is a separate check.' };
    await writeFile('artifacts/learning-guide/live-evidence.json', JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence));
  }
} catch { console.error('Narration test did not complete; no credentials were printed. Inspect local setup before retrying.'); process.exitCode = 1; }
finally { await new Promise<void>(resolve => server.close(() => resolve())); }
