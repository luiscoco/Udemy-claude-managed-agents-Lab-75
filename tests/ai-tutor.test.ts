import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { content } from '../shared/learning-content.js';
import { tutorQuestions, type TutorLesson } from '../shared/ai-tutor.js';
import { createAiTutorRouter } from '../server/routes/ai-tutor.js';
import { createTutorProvider, tutorMaxOutputTokens, type TutorProvider } from '../server/lib/ai-tutor-provider.js';

const lessons: TutorLesson[] = Object.entries(content).map(([id, lesson]) => ({ id: Number(id), title: `Topic ${id}`, ...lesson }));
const model = 'claude-test-model', env = { ANTHROPIC_API_KEY: 'test-key-never-sent', AI_TUTOR_LIVE_ENABLED: 'true' };
const result = { answer: '## A grounded answer\n\nInspect the recorded outcome.\n\n```typescript\nconst completed = true;\n```',
  stopReason: 'end_turn', usage: { inputTokens: 120, outputTokens: 40 } };
const fake = (): TutorProvider => ({ models: async () => [{ id: model, name: 'Test Claude' }], answer: async () => result });
const question = { mode: 'live', intent: 'explain', question: 'Explain this exercise', model, consent: true };
const headers = (owner: string = randomUUID()) => ({ 'Content-Type': 'application/json', 'x-ai-tutor-owner': owner });
const send = (base: string, path: string, body: unknown, owner?: string) => fetch(base + path, { method: 'POST', headers: headers(owner), body: JSON.stringify(body) });
type Options = Parameters<typeof createAiTutorRouter>[0];
async function withRouter(options: Partial<Options>, run: (base: string) => Promise<void>) {
  const app = express(); app.use('/tutor', createAiTutorRouter({ lessons, env: {}, ...options }));
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(done => server.once('listening', done));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try { await run(`http://127.0.0.1:${address.port}/tutor`); }
  finally { await new Promise<void>(done => server.close(() => done())); }
}
async function cleanup(path: string) {
  assert.equal(dirname(resolve(path)), resolve(tmpdir())); assert.ok(basename(path).startsWith('managed-tutor-'));
  await rm(path, { recursive: true, force: true });
}

test('all 75 labs have six grounded prepared answers without model or catalog calls', async () => {
  const provider: TutorProvider = { models: async () => { throw Error('Unexpected model listing'); }, answer: async () => { throw Error('Unexpected paid call'); } };
  await withRouter({ provider }, async base => {
    for (const lesson of lessons) {
      for (const intent of tutorQuestions) {
        const response = await send(base, `/${lesson.id}`, { mode: 'prepared', intent: intent.id, question: intent.question });
        assert.equal(response.status, 200, `Lab ${lesson.id} ${intent.id}`);
        const answer = await response.json(); assert.equal(answer.modelCalls, 0); assert.equal(answer.mode, 'prepared');
        assert.match(answer.answer, new RegExp(`Lab ${lesson.id}: Topic ${lesson.id}`));
        if (intent.id === 'explain') assert.ok(answer.answer.includes(lesson.objective));
        if (intent.id === 'code') { assert.match(answer.answer, /```typescript/); assert.ok(answer.answer.includes(lesson.inspect[0]!.startsWith('server/') ? lesson.inspect[0]! : lesson.inspect.find(p => p.startsWith('server/'))!)); }
      }
    }
    assert.equal((await send(base, '/76', {})).status, 404);
    assert.equal((await send(base, '/1', { ...question, mode: 'prepared', arbitraryPath: '.env' })).status, 400);
    assert.equal((await send(base, '/1', question)).status, 403);
    assert.equal((await (await fetch(base + '/status')).json()).liveAvailable, false);
  });
});

test('live consent, strict input, origin and model validation precede one grounded provider call', async () => {
  let calls = 0, listings = 0;
  const provider: TutorProvider = { models: async () => { listings++; return [{ id: model, name: 'Test Claude' }]; }, answer: async input => {
    calls++; const context = JSON.parse(input.context); assert.equal(context.lessonId, 50); assert.equal(context.objective, content[50]!.objective);
    assert.ok(context.source.path.startsWith('server/')); assert.ok(context.source.excerpt); assert.equal(input.model, model); return result;
  } };
  await withRouter({ env, provider }, async base => {
    assert.equal((await send(base, '/50', { ...question, consent: false })).status, 403); assert.equal(calls, 0); assert.equal(listings, 0);
    assert.equal((await send(base, '/50', { ...question, extra: true })).status, 400);
    const hostile = await fetch(base + '/50', { method: 'POST', headers: { ...headers(), Origin: 'https://evil.test' }, body: JSON.stringify(question) });
    assert.equal(hostile.status, 403); assert.equal(calls, 0);
    assert.equal((await send(base, '/50', { ...question, model: 'claude-unlisted' })).status, 400);
    await fetch(base + '/models'); await fetch(base + '/models'); assert.equal(listings, 1);
    const response = await send(base, '/50', question); assert.equal(response.status, 200);
    const answer = await response.json(); assert.equal(answer.answer, result.answer); assert.equal(answer.modelCalls, 1); assert.deepEqual(answer.usage, result.usage);
    assert.equal(calls, 1); assert.equal('costUsd' in answer, false, 'No invented monetary cost');
    const oversized = await fetch(base + '/50', { method: 'POST', headers: headers(), body: JSON.stringify({ ...question, question: 'x'.repeat(20000) }) });
    assert.equal(oversized.status, 413); assert.equal(calls, 1);
  });
});

test('saved answers are immutable owner-scoped records, single-use even under concurrent saves, and durable across restarts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'managed-tutor-')), owner = randomUUID(), other = randomUUID(); let calls = 0;
  const provider = fake(); provider.answer = async () => { calls++; return result; };
  try {
    await mkdir(join(directory, 'server')); await writeFile(join(directory, 'server/example.ts'), 'export const value = 1;\n' + '\n'.repeat(30));
    const lesson = { ...lessons.find(item => item.id === 1)!, inspect: ['server/example.ts'] };
    let savedId = '';
    await withRouter({ lessons: [lesson], env, provider, storageDirectory: join(directory, 'answers'), sourceRoot: directory }, async base => {
      const answer = await (await send(base, '/1', question, owner)).json(); assert.ok(answer.pendingToken);
      assert.equal((await send(base, '/1/saved', { pendingToken: answer.pendingToken, answer: 'Forged content' }, owner)).status, 400);
      assert.equal((await send(base, '/1/saved', { pendingToken: answer.pendingToken }, other)).status, 404);
      const saves = await Promise.all([send(base, '/1/saved', { pendingToken: answer.pendingToken }, owner), send(base, '/1/saved', { pendingToken: answer.pendingToken }, owner)]);
      assert.deepEqual(saves.map(r => r.status).sort(), [201, 404]);
      const saved = (await saves.find(r => r.status === 201)!.json()).answer; savedId = saved.id;
      assert.equal(saved.answer, result.answer); assert.equal(saved.current, true);
      assert.deepEqual((await (await fetch(base + '/1/saved', { headers: headers(other) })).json()).answers, []);
    });
    // Change content beyond the displayed excerpt: the full source digest still detects it.
    await writeFile(join(directory, 'server/example.ts'), 'export const value = 1;\n' + '\n'.repeat(30) + '// Updated lesson material\n');
    await withRouter({ lessons: [lesson], env: {}, provider, storageDirectory: join(directory, 'answers'), sourceRoot: directory }, async base => {
      const listed = await (await fetch(base + '/1/saved', { headers: headers(owner) })).json(); assert.equal(listed.answers.length, 1);
      assert.equal(listed.answers[0].answer, result.answer); assert.equal(listed.answers[0].current, false); assert.equal(calls, 1);
      assert.equal((await fetch(base + '/1/saved/' + savedId, { method: 'DELETE', headers: headers(other) })).status, 404);
      assert.equal((await fetch(base + '/1/saved/' + savedId, { method: 'DELETE', headers: headers(owner) })).status, 204);
      assert.deepEqual((await (await fetch(base + '/1/saved', { headers: headers(owner) })).json()).answers, []);
      assert.equal(calls, 1, 'Saved reads and deletion make no model calls');
    });
  } finally { await cleanup(directory); }
});

test('output-limit text is returned as partial without a save token or automatic retry', async () => {
  let calls = 0;
  const provider = fake(); provider.answer = async () => { calls++; return { ...result, stopReason: 'max_tokens' }; };
  const directory = await mkdtemp(join(tmpdir(), 'managed-tutor-partial-'));
  try {
    await withRouter({ env, provider, storageDirectory: directory }, async base => {
      const response = await send(base, '/1', question); assert.equal(response.status, 200);
      const body = await response.json(); assert.equal(body.answer, result.answer); assert.equal(body.incomplete, true);
      assert.equal('pendingToken' in body, false); assert.equal(calls, 1); assert.deepEqual(body.usage, result.usage);
      provider.answer = async () => ({ ...result, answer: '', stopReason: 'max_tokens' });
      assert.equal((await send(base, '/1', question)).status, 502);
      provider.answer = async () => ({ ...result, stopReason: 'refusal' });
      assert.equal((await send(base, '/1', question)).status, 502);
    });
  } finally { await cleanup(directory); }
});

test('bounded admission and deadlines abort outstanding provider calls and release the slots', async () => {
  let started = 0, aborted = 0;
  const provider = fake(); provider.answer = async input => new Promise((_done, reject) => {
    started++; input.signal.addEventListener('abort', () => { aborted++; reject(Error('Aborted')); }, { once: true });
  });
  await withRouter({ env, provider, deadlineMs: 1000 }, async base => {
    const first = send(base, '/1', question), second = send(base, '/2', question);
    for (let n = 0; started < 2 && n < 100; n++) await delay(5);
    assert.equal(started, 2); assert.equal((await send(base, '/3', question)).status, 429);
    assert.deepEqual((await Promise.all([first, second])).map(r => r.status), [504, 504]); assert.equal(aborted, 2);
    provider.answer = async () => result;
    assert.equal((await send(base, '/1', question)).status, 200);
  });
});

test('closing the browser request aborts the provider operation', async () => {
  let began = false, aborted = false; const provider = fake();
  provider.answer = async input => new Promise((_done, reject) => { began = true;
    input.signal.addEventListener('abort', () => { aborted = true; reject(Error('Aborted')); }, { once: true });
  });
  await withRouter({ env, provider }, async base => {
    const controller = new AbortController();
    const pending = fetch(base + '/1', { method: 'POST', headers: headers(), body: JSON.stringify(question), signal: controller.signal });
    for (let n = 0; !began && n < 100; n++) await delay(2);
    assert.ok(began); controller.abort(); await assert.rejects(pending);
    for (let n = 0; !aborted && n < 100; n++) await delay(2);
    assert.ok(aborted);
  });
});

test('the real SDK adapter uses no tools, bounded output and no automatic paid retry', async () => {
  let requests = 0;
  const transport = (async (_url, options) => {
    requests++; const body = JSON.parse(String(options?.body)); assert.deepEqual(body.tools, []); assert.equal(body.max_tokens, tutorMaxOutputTokens);
    assert.ok(body.system.includes('Managed Agents')); assert.equal(body.model, model);
    return Response.json({ id: 'msg_test', type: 'message', role: 'assistant', model,
      content: [{ type: 'text', text: 'A completed answer.' }], stop_reason: 'end_turn', stop_sequence: null,
      usage: { input_tokens: 20, output_tokens: 10 } });
  }) as typeof fetch;
  const provider = createTutorProvider('test-key-never-sent', transport);
  const answer = await provider.answer({ model, context: '{}', intent: 'explain', question: 'Explain', signal: AbortSignal.timeout(1000) });
  assert.equal(answer.answer, 'A completed answer.'); assert.equal(requests, 1);
  requests = 0;
  const failing = createTutorProvider('test-key-never-sent', (async () => { requests++; return Response.json({ error: { type: 'rate_limit_error', message: 'Fixture rate limit' } }, { status: 429 }); }) as typeof fetch);
  await assert.rejects(failing.answer({ model, context: '{}', intent: 'hint', question: 'Hint', signal: AbortSignal.timeout(1000) }));
  assert.equal(requests, 1);
});
