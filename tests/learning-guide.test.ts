import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { learningGuide } from '../shared/learning-guide.js';
import { content } from '../shared/learning-content.js';
import { createLearningGuideRouter } from '../server/routes/learning-guide.js';

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

async function withRouter(env: NodeJS.ProcessEnv, transport: typeof fetch, run: (base: string) => Promise<void>) {
  const app = express(); app.use('/guide', createLearningGuideRouter(env, transport));
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
    return Response.json({ audioContent: Buffer.from('ID3-test-audio').toString('base64') });
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
      assert.equal(await response.text(), 'ID3-test-audio');
    }
    assert.equal(calls, 1);
  });
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
