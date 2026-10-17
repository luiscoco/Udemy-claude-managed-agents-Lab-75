import { createHash } from 'node:crypto';
import { Router, json } from 'express';
import { z } from 'zod';
import { learningGuide } from '../../shared/learning-guide.js';

const requestSchema = z.strictObject({ lessonId: z.number().int().min(1).max(75), stepId: z.string().max(30) });
const maximumAudioBytes = 4 * 1024 * 1024;

async function boundedJson(response: Response) {
  const reader = response.body?.getReader(); if (!reader) throw new Error('Empty narration response.');
  const chunks: Uint8Array[] = []; let size = 0;
  try { for (;;) { const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength; if (size > 6 * 1024 * 1024) throw new Error('Narration response too large.'); chunks.push(value);
  } } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as { audioContent?: unknown };
}

export function createLearningGuideRouter(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch) {
  const router = Router(), cache = new Map<string, Buffer>();
  let cacheBytes = 0, active = false;
  const calls: number[] = [];
  const ready = () => env.INWORLD_NARRATION_ENABLED === '1' && !!env.INWORLD_API_KEY?.trim();
  router.use((_request, response, next) => { response.set('Cache-Control', 'no-store'); next(); });
  router.get('/status', (_request, response) => response.json({ ready: ready(), provider: 'Inworld',
    voiceId: env.INWORLD_VOICE_ID || 'Yash', modelId: env.INWORLD_MODEL_ID || 'inworld-tts-2',
    missing: [...(!env.INWORLD_API_KEY?.trim() ? ['INWORLD_API_KEY'] : []), ...(env.INWORLD_NARRATION_ENABLED !== '1' ? ['INWORLD_NARRATION_ENABLED=1'] : [])] }));
  router.post('/audio', (request, response, next) => {
    const host = request.headers.host ?? '';
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      request.headers['x-learning-guide'] !== '1') { response.status(403).json({ message: 'Local learning guide request required.' }); return; }
    next();
  }, json({ limit: '1kb', strict: true }), async (request, response) => {
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: 'Choose an authored lesson and guide step.' }); return; }
    const step = learningGuide(parsed.data.lessonId).find(item => item.id === parsed.data.stepId);
    if (!step) { response.status(400).json({ message: 'Unknown guide step.' }); return; }
    if (!ready()) { response.status(503).json({ message: 'Inworld narration is not configured. Read the transcript or configure the server settings.' }); return; }
    const voiceId = env.INWORLD_VOICE_ID || 'Yash', modelId = env.INWORLD_MODEL_ID || 'inworld-tts-2';
    const text = `${step.title}. ${step.text} Your turn. ${step.action}`;
    if (text.length > 2000) { response.status(400).json({ message: 'This authored narration exceeds the provider text limit.' }); return; }
    const key = createHash('sha256').update(JSON.stringify({ text, voiceId, modelId })).digest('hex');
    const send = (audio: Buffer) => response.type('audio/mpeg').set('X-Narration-Source', 'inworld').send(audio);
    const cached = cache.get(key); if (cached) { send(cached); return; }
    const now = Date.now(); while (calls.length && calls[0]! < now - 60000) calls.shift();
    if (active || calls.length >= 12) { response.status(429).json({ message: 'Narration is busy. Wait briefly before playing another uncached section.' }); return; }
    active = true; calls.push(now);
    const abort = new AbortController(), timeout = setTimeout(() => abort.abort(), 30000);
    const disconnect = () => { if (!response.writableEnded) abort.abort(); };
    response.once('close', disconnect);
    try {
      const result = await fetcher('https://api.inworld.ai/tts/v1/voice', { method: 'POST',
        headers: { Authorization: `Basic ${env.INWORLD_API_KEY!.trim()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId, modelId, audioConfig: { audioEncoding: 'MP3', bitRate: 64000 } }),
        signal: abort.signal, redirect: 'error' });
      if (!result.ok) { await result.body?.cancel(); response.status(502).json({ message: `Inworld returned HTTP ${result.status}. Check the server key, voice and account quota. The transcript remains available.` }); return; }
      const payload = await boundedJson(result);
      if (typeof payload.audioContent !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload.audioContent)) throw new Error('Invalid audio.');
      const audio = Buffer.from(payload.audioContent, 'base64');
      if (!audio.length || audio.length > maximumAudioBytes) throw new Error('Invalid audio size.');
      if (audio.subarray(0, 3).toString() !== 'ID3' && !(audio[0] === 0xff && ((audio[1] ?? 0) & 0xe0) === 0xe0)) throw new Error('Invalid MP3 header.');
      while (cacheBytes + audio.length > 24 * 1024 * 1024 && cache.size) {
        const first = cache.keys().next().value!; cacheBytes -= cache.get(first)!.length; cache.delete(first);
      }
      cache.set(key, audio); cacheBytes += audio.length; if (!response.destroyed) send(audio);
    } catch { if (!response.destroyed) response.status(502).json({ message: 'Narration could not complete. Read the transcript and try again when ready.' }); }
    finally { active = false; clearTimeout(timeout); response.off('close', disconnect); }
  });
  return router;
}
