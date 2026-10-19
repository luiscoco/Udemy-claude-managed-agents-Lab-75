import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { learningGuide } from '../shared/learning-guide.js';
import { content } from '../shared/learning-content.js';
import { createLearningGuideRouter } from '../server/routes/learning-guide.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('all 75 guides use lesson-specific content and provider-sized authored transcripts', () => {
  for (let id = 1; id <= 75; id++) {
    const steps = learningGuide(id);
    assert.equal(steps.length, 7); assert.equal(new Set(steps.map(step => step.id)).size, 7);
    assert.ok(steps[0]!.text.includes(content[id]!.objective));
    assert.equal(steps[2]!.action, content[id]!.steps[0]);
    assert.equal(steps[6]!.action, content[id]!.challenge);
    for (const step of steps) assert.ok(`${step.title}. ${step.text} Your turn. ${step.action}`.length <= 2000, `Lab ${id}: ${step.id}`);
    assert.ok(steps.filter(step => step.view === 1).every(step => step.waitForStudent));
  }
  assert.throws(() => learningGuide(76)); assert.throws(() => learningGuide(1.5));
});

async function withRouter(env: NodeJS.ProcessEnv, transport: typeof fetch, run: (base: string) => Promise<void>, options: { cacheDirectory?: string } = {}) {
  const app = express(); app.use('/guide', createLearningGuideRouter(env, transport, options));
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try { await run(`http://127.0.0.1:${address.port}/guide`); }
  finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
const env = { INWORLD_API_KEY: 'fake-inworld-credential', INWORLD_NARRATION_ENABLED: '1', INWORLD_VOICE_ID: 'test-voice' };
const headers = { 'Content-Type': 'application/json', 'X-Learning-Guide': '1' };
const body = JSON.stringify({ lessonId: 65, stepId: 'goal' });

test('guide synthesis is explicit, closed, server-authenticated and caches identical authored audio', async () => {
  let calls = 0;
  await withRouter(env, (async (url, options) => {
    calls++; assert.equal(url, 'https://api.inworld.ai/tts/v1/voice');
    assert.equal((options?.headers as Record<string, string>).Authorization, 'Basic fake-inworld-credential');
    const sent = JSON.parse(options?.body as string);
    assert.ok(sent.text.includes(content[65]!.objective)); assert.equal(sent.voiceId, 'test-voice');
    assert.equal(sent.modelId, 'inworld-tts-2'); assert.equal(options?.redirect, 'error');
    assert.equal(sent.timestampType, 'WORD'); assert.equal(sent.applyTextNormalization, 'OFF');
    const words = sent.text.split(/\s+/);
    return Response.json({ audioContent: Buffer.from('ID3-test-audio').toString('base64'), timestampInfo: { wordAlignment: {
      words, wordStartTimeSeconds: words.map((_: string, i: number) => i * 0.1), wordEndTimeSeconds: words.map((_: string, i: number) => i * 0.1 + 0.08),
    } } });
  }) as typeof fetch, async base => {
    const status = await (await fetch(`${base}/status`)).json(); assert.equal(status.ready, true);
    assert.equal(JSON.stringify(status).includes(env.INWORLD_API_KEY), false); assert.equal(calls, 0);
    assert.equal((await fetch(`${base}/audio`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })).status, 403);
    assert.equal((await fetch(`${base}/audio`, { method: 'POST', headers: { ...headers, Origin: 'https://untrusted.example' }, body })).status, 403);
    assert.equal((await fetch(`${base}/audio`, { method: 'POST', headers, body: JSON.stringify({ lessonId: 65, stepId: 'goal', text: 'arbitrary text' }) })).status, 400);
    assert.equal((await fetch(`${base}/audio`, { method: 'POST', headers, body: JSON.stringify({ lessonId: 65, stepId: 'missing' }) })).status, 400);
    assert.equal(calls, 0);
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}/audio`, { method: 'POST', headers, body });
      assert.equal(response.status, 200); assert.match(response.headers.get('Content-Type')!, /audio\/mpeg/);
      const key = response.headers.get('X-Narration-Key'); assert.match(key!, /^[a-f0-9]{64}$/);
      const timing = await (await fetch(`${base}/timing/${key}`)).json();
      assert.equal(timing.source, 'inworld-word'); assert.equal(timing.lessonId, 65); assert.equal(timing.stepId, 'goal');
      assert.ok(timing.cues.length > 2); assert.equal(JSON.stringify(timing).includes(env.INWORLD_API_KEY), false);
      assert.equal(await response.text(), 'ID3-test-audio');
    }
    assert.equal(calls, 1);
  });
});

test('authored recording cache survives router restart without another provider request', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'guide-audio-cache-'));
  let calls = 0;
  try {
    const transport = (async () => { calls++; return Response.json({ audioContent: Buffer.from('ID3-persistent-test').toString('base64') }); }) as typeof fetch;
    for (let restart = 0; restart < 2; restart++) await withRouter(env, transport, async base => {
      const response = await fetch(`${base}/audio`, { method: 'POST', headers, body });
      assert.equal(response.status, 200); assert.equal(await response.text(), 'ID3-persistent-test');
      const timeline = await (await fetch(`${base}/timing/${response.headers.get('X-Narration-Key')}`)).json();
      assert.equal(timeline.source, 'section'); assert.deepEqual(timeline.cues, []);
      assert.equal((await fetch(`${base}/timing/${'0'.repeat(64)}`)).status, 404);
    }, { cacheDirectory: directory });
    assert.equal(calls, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('missing opt-in and provider failure leave transcripts usable and never expose credentials', async () => {
  await withRouter({ INWORLD_API_KEY: env.INWORLD_API_KEY }, (async () => { throw new Error('Must not call.'); }) as typeof fetch, async base => {
    assert.equal((await fetch(`${base}/audio`, { method: 'POST', headers, body })).status, 503);
  });
  await withRouter(env, (async () => { throw new Error(`Provider failure ${env.INWORLD_API_KEY}`); }) as typeof fetch, async base => {
    const response = await fetch(`${base}/audio`, { method: 'POST', headers, body });
    assert.equal(response.status, 502); assert.equal((await response.text()).includes(env.INWORLD_API_KEY), false);
  });
});

test('concurrent uncached play requests do not start a second synthesis', async () => {
  let entered!: () => void, finish!: () => void, calls = 0;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const released = new Promise<void>(resolve => { finish = resolve; });
  await withRouter(env, (async () => {
    calls++; entered(); await released;
    return Response.json({ audioContent: Buffer.from('ID3-concurrent-test').toString('base64') });
  }) as typeof fetch, async base => {
    const first = fetch(`${base}/audio`, { method: 'POST', headers, body }); await started;
    try {
      const second = await fetch(`${base}/audio`, { method: 'POST', headers, body });
      assert.equal(second.status, 429); assert.equal(calls, 1);
    } finally { finish(); }
    assert.equal((await first).status, 200);
  });
});
