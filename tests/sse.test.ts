import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { RequestListener } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import express from 'express';
import { z } from 'zod';
import { SseParser, StreamFailure, streamPost } from '../src/lib/sse.js';
import { openSse } from '../server/sse.js';
import { createTestRouter } from './support/router.js';
import { scriptedPolicy } from '../server/lib/policy.js';
import { RunStore } from './support/run-store.js';
import { createTestAdapter } from './support/adapter.js';
import { runRequestSchema, runSnapshotSchema } from '../shared/contracts.js';

const schema = z.object({ value: z.string() });
const settings = { idleMs: 500, deadlineMs: 2_000, resultSchema: schema };
const input = runRequestSchema.parse({ mode: 'scripted', learnerName: 'Ada' });
const frame = (event: string, value: unknown, id = 1) => `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(value)}\n\n`;
async function socket(handler: RequestListener, action: (url: string, disconnect: () => void) => Promise<void>) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string');
  try { await action(`http://127.0.0.1:${address.port}`, () => server.closeAllConnections()); }
  finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}
async function rejects(kind: string, task: Promise<unknown>, status?: number) {
  await assert.rejects(task, (error: unknown) => error instanceof StreamFailure && error.kind === kind && (status === undefined || error.status === status));
}

test('parser handles CRLF, CR, multiline data, BOM, split Unicode, partial frames and fields', () => {
  const parser = new SseParser(); const chunks = new TextEncoder().encode('\ufeff: heartbeat\r\nid: 1\r\nevent: result\r\ndata: {"value":\r\ndata: "Olá 🧪"}\r\n\r\nid: 2\revent: result\rdata: {"value":"second"}\r\r');
  const frames = Array.from(chunks).flatMap((byte) => parser.push(Uint8Array.of(byte)));
  assert.equal(frames.length, 2); assert.equal(frames[0]?.id, '1');
  assert.deepEqual(JSON.parse(frames[0]!.data), { value: 'Olá 🧪' });
  assert.deepEqual(JSON.parse(frames[1]!.data), { value: 'second' });
  const partial = new SseParser(); assert.deepEqual(partial.push(new TextEncoder().encode('event: result\ndata: {}')), []);
  assert.deepEqual(partial.push(new Uint8Array(), true), []);
  assert.throws(() => new SseParser(8).push(new TextEncoder().encode('data: too long')), /size/);
});

test('real POST socket splits frames, CRLF and multibyte UTF-8, and dispatches progress before result', async () => {
  let posts = 0; const seen: unknown[] = [];
  await socket((req, res) => {
    assert.equal(req.method, 'POST'); posts++; req.resume();
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8' });
    void (async () => {
      const bytes = Buffer.from(': heartbeat\r\n\r\nid: 1\r\nevent: progress\r\ndata: {"step":1}\r\n\r\nid: 2\r\nevent: result\r\ndata: {"value":\r\ndata: "Olá 🧪"}\r\n\r\n');
      for (let i = 0; i < bytes.length; i += 2) { res.write(bytes.subarray(i, i + 2)); await delay(1); }
      res.end();
    })();
  }, async (url) => {
    assert.deepEqual(await streamPost(url, input, { ...settings, onEvent: (event, data, id) => seen.push([event, data, id]) }), { kind: 'success', result: { value: 'Olá 🧪' } });
  });
  assert.equal(posts, 1); assert.deepEqual(seen, [['progress', { step: 1 }, 1]]);
});

test('HTTP 400 and proxy 502 preserve URL/status and explain backend startup', async () => {
  for (const status of [400, 502]) await socket((req, res) => {
    req.resume(); res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'INVALID_REQUEST', message: 'Check the request fields.', fieldErrors: [{ path: 'learnerName', message: 'Enter a name.' }] } }));
  }, async (url) => {
    await assert.rejects(streamPost(url, input, settings), (error: unknown) => {
      assert(error instanceof StreamFailure); assert.equal(error.kind, 'http'); assert.equal(error.status, status);
      assert(error.message.includes(url)); if (status === 502) assert.match(error.message, /Start the local API backend/);
      assert(error.detail); return true;
    });
  });
});

test('malformed JSON, server error, invalid result, missing result, partial EOF and bad IDs are distinct failures without retry', async () => {
  for (const [body, kind] of [
    ['id: 1\nevent: result\ndata: {broken}\n\n', 'stream'],
    [frame('error', { message: 'fake-secret-canary' }), 'stream'],
    [frame('result', { other: 'value' }), 'stream'],
    [frame('progress', { step: 1 }), 'missing-result'],
    ['id: 1\nevent: result\ndata: {"value":"partial"}', 'missing-result'],
    [frame('result', { value: 'bad sequence' }, 2), 'stream'],
  ]) {
    let posts = 0;
    await socket((req, res) => { posts++; req.resume(); res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.end(body); }, async (url) => {
      await rejects(kind!, streamPost(url, input, settings));
    }); assert.equal(posts, 1);
  }
});

test('invalid UTF-8 and wrong content type fail without exposing wire contents', async () => {
  await socket((req, res) => { req.resume(); res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.end(Buffer.from([0xff])); }, async (url) => {
    await rejects('stream', streamPost(url, input, settings));
  });
  await socket((req, res) => { req.resume(); res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('proxy page'); }, async (url) => {
    await rejects('stream', streamPost(url, input, settings));
  });
});

test('heartbeat traffic prevents false idle expiry but never extends whole-run deadline', async () => {
  await socket((req, res) => {
    req.resume(); res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.flushHeaders();
    const timer = setInterval(() => res.write(': heartbeat\n\n'), 25);
    res.on('close', () => clearInterval(timer));
    const done = setTimeout(() => res.end(frame('result', { value: 'done' })), 350);
    res.on('close', () => clearTimeout(done));
  }, async (url) => assert.equal((await streamPost(url, input, { ...settings, idleMs: 150 })).kind, 'success'));
  await socket((req, res) => {
    req.resume(); res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.flushHeaders();
    const timer = setInterval(() => res.write(': heartbeat\n\n'), 25); res.on('close', () => clearInterval(timer));
  }, async (url) => rejects('deadline', streamPost(url, input, { ...settings, idleMs: 150, deadlineMs: 300 })));
  await socket((req, res) => { req.resume(); res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.flushHeaders(); }, async (url) => {
    await rejects('idle', streamPost(url, input, { ...settings, idleMs: 150 }));
  });
});

test('cancel before headers and during streaming aborts the socket immediately', async () => {
  for (const headers of [false, true]) {
    let closed = false;
    await socket((req, res) => {
      req.resume(); res.on('close', () => { closed = true; });
      if (headers) { res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.write(': heartbeat\n\n'); }
    }, async (url) => {
      const controller = new AbortController(); const pending = streamPost(url, input, { ...settings, signal: controller.signal });
      await delay(70); controller.abort(); assert.deepEqual(await pending, { kind: 'canceled', reason: 'user' });
      for (let i = 0; i < 20 && !closed; i++) await delay(10); assert(closed);
    });
  }
});

test('abrupt server disconnect is a stream failure and never resubmits the POST', async () => {
  let calls = 0;
  await socket((req, res) => { calls++; req.resume(); res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.write(frame('progress', {}));
    const timer = setTimeout(() => res.destroy(), 70); res.on('close', () => clearTimeout(timer));
  }, async (url) => rejects('stream', streamPost(url, input, settings)));
  assert.equal(calls, 1);
});

test('openSse flushes headers, sends heartbeats and sequential IDs; pipe ends cleanly', async () => {
  let stream: ReturnType<typeof openSse> | undefined; const logs: string[] = [];
  const app = express(); app.post('/', (req, res) => {
    stream = openSse(req, res, { heartbeatMs: 25, idleMs: 150, deadlineMs: 1_000, log: (line) => logs.push(line) });
    void stream.pipe((async function* () { await delay(200); yield { event: 'progress', data: { step: 1 } }; yield { event: 'result', data: { value: 'done' } }; })());
  });
  await socket(app, async (url) => {
    const response = await fetch(url, { method: 'POST' });
    assert.match(response.headers.get('content-type')!, /text\/event-stream; charset=utf-8/);
    assert.match(response.headers.get('cache-control')!, /no-store/); const text = await response.text();
    assert.match(text, /: heartbeat/); assert.match(text, /id: 1\nevent: progress/); assert.match(text, /id: 2\nevent: result/);
    await delay(30); assert(stream?.closed); assert.equal(stream.queuedBytes, 0); assert.equal(stream.controller.signal.aborted, false);
    const length = logs.length; assert.equal(stream.send('progress', {}), false); await delay(200); assert.equal(logs.length, length);
  });
});

test('server deadline emits canceled, aborts controller and clears all timers; quiet logs are optional', async () => {
  let stream: ReturnType<typeof openSse> | undefined; const logs: string[] = [];
  const app = express(); app.post('/', (req, res) => { stream = openSse(req, res, { heartbeatMs: 25, idleMs: 150, deadlineMs: 200, quiet: true, log: (line) => logs.push(line) }); });
  await socket(app, async (url) => {
    assert.deepEqual(await streamPost(url, input, settings), { kind: 'canceled', reason: 'deadline' });
    await delay(30); assert(stream?.closed); assert.equal(stream.controller.signal.reason, 'deadline'); assert.deepEqual(logs, []);
  });
});

test('disconnect cleanup aborts the same adapter signal and releases stream capacity', async () => {
  let released = false; let adapterSignal: AbortSignal | undefined;
  const store = new RunStore({ async execute(_input, signal) {
    adapterSignal = signal;
    try { await delay(2_000, undefined, { signal }); return 'Hello, Ada.'; }
    finally { released = true; }
  } });
  const app = express(); app.use('/api/c0', createTestRouter(store));
  try { await socket(app, async (url) => {
    const controller = new AbortController();
    const promise = streamPost(`${url}/api/c0/stream`, input, { idleMs: 3_000, deadlineMs: 6_000, resultSchema: runSnapshotSchema, signal: controller.signal });
    void promise.catch(() => {});
    for (let i = 0; i < 300 && !adapterSignal; i++) await delay(10); assert(adapterSignal);
    controller.abort(); assert.equal((await promise).kind, 'canceled');
    for (let i = 0; i < 100 && !released; i++) await delay(10); assert(released); assert(adapterSignal.aborted);
    assert.equal(adapterSignal.reason, 'disconnect');
    const next = store.createStream(input, new AbortController()); assert(next); await next.execute(() => {});
  }); } finally { await store.close(); }
});

test('test router validates before SSE headers, emits exactly three progress steps and a typed verified result', async () => {
  const store = new RunStore(createTestAdapter(5)); const app = express(); app.use('/api/c0', createTestRouter(store));
  try { await socket(app, async (url) => {
    for (const body of [{ ...input, learnerName: '' }, { ...input, extra: 'invalid' }]) {
      const response = await fetch(`${url}/api/c0/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert.equal(response.status, 400); assert.match(response.headers.get('content-type')!, /application\/json/);
    }
    const malformed = await fetch(`${url}/api/c0/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(malformed.status, 400);
    const events: unknown[] = [];
    const result = await streamPost(`${url}/api/c0/stream`, input, { ...settings, resultSchema: runSnapshotSchema, onEvent: (_event, value) => events.push(value) });
    assert.equal(result.kind, 'success'); if (result.kind !== 'success') return;
    assert.deepEqual(result.result.events.filter((event) => event.type === 'progress').map((event) => event.payload.step), [1, 2, 3]);
    assert.deepEqual(result.result.events.map((event) => event.seq), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(events.length, 6); assert.equal(result.result.outcome?.usage.modelCalls, 0);
    assert.equal(result.result.outcome?.usage.billedUsd, 0); assert.equal(result.result.status, 'succeeded');
    assert.equal(store.get(result.result.runId), undefined); // No hidden replay store.
  }); } finally { await store.close(); }
});

test('queue limit closes the connection and rejects writes after destruction', async () => {
  let stream: ReturnType<typeof openSse> | undefined;
  const app = express(); app.post('/', (req, res) => {
    stream = openSse(req, res, { heartbeatMs: 25, idleMs: 150, deadlineMs: 1_000, maxQueuedBytes: 128, quiet: true });
    assert.equal(stream.send('progress', { value: 'x'.repeat(200) }), false);
  });
  await socket(app, async (url) => {
    await fetch(url, { method: 'POST' }).then((res) => res.text()).catch(() => {});
    assert(stream?.closed); assert.equal(stream.controller.signal.reason, 'queue-limit');
    assert.equal(stream.queuedBytes, 0); assert.equal(stream.send('result', {}), false);
  });
});

test('stream failures are sanitized and stream capacity includes the legacy run path', async () => {
  const store = new RunStore({ async execute() { throw new Error('fake-private-canary'); } });
  const app = express(); app.use('/api/c0', createTestRouter(store));
  try { await socket(app, async (url) => {
    await assert.rejects(streamPost(`${url}/api/c0/stream`, input, { ...settings, resultSchema: runSnapshotSchema }), (error: unknown) => {
      assert(error instanceof StreamFailure); assert.equal(error.kind, 'stream'); assert(!error.message.includes('fake-private-canary')); return true;
    });
    const first = store.createStream(input, new AbortController()); const second = store.createStream(input, new AbortController());
    assert(first && second); assert.equal(store.createStream(input, new AbortController()), null); assert.equal(store.start(input), null);
    const response = await fetch(`${url}/api/c0/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    assert.equal(response.status, 429); assert.match(response.headers.get('content-type')!, /application\/json/);
    await Promise.all([first.execute(() => {}), second.execute(() => {})]);
    assert(store.start(input));
  }); } finally { await store.close(); }
});

test('server-side connection destruction aborts adapter and shutdown awaits its cleanup', async () => {
  let signal: AbortSignal | undefined; let released = false;
  const store = new RunStore({ async execute(_input, current) {
    signal = current;
    try { await delay(5_000, undefined, { signal: current }); return 'Hello, Ada.'; }
    finally { released = true; }
  } });
  const app = express(); app.use('/api/c0', createTestRouter(store));
  try { await socket(app, async (url, disconnect) => {
    const pending = streamPost(`${url}/api/c0/stream`, input, { ...settings, idleMs: 3_000, deadlineMs: 6_000, resultSchema: runSnapshotSchema });
    void pending.catch(() => {});
    for (let i = 0; i < 300 && !signal; i++) await delay(10); assert(signal);
    disconnect(); await rejects('stream', pending);
    for (let i = 0; i < 100 && !released; i++) await delay(10); assert(released); assert(signal.aborted);
    await store.close();
  }); } finally { await store.close(); }
});

// Mount the focused router with injected clock/waits; never import server/index.ts.
test('F07 scenarios preserve order, typed prompt response, one wire terminal and useful validation', async () => {
  let tick = Date.parse('2026-01-01T00:00:00Z'); let adapterCalls = 0;
  const wait = async (ms: number, signal: AbortSignal) => { signal.throwIfAborted(); tick += ms; };
  const adapter = createTestAdapter(5, wait);
  const store = new RunStore({ async execute(...args) { adapterCalls++; return adapter.execute(...args); } }, () => tick, scriptedPolicy, wait);
  const app = express(); app.use('/api/c0', createTestRouter(store));
  try { await socket(app, async (url) => {
    const post = (body: unknown) => fetch(`${url}/api/c0/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const facts = await fetch(`${url}/api/c0/facts`); assert.equal(facts.status, 200); assert.equal(adapterCalls, 0);
    for (const prompt of ['', ' ', 'x'.repeat(121), 42]) {
      const response = await post({ ...input, prompt }); assert.equal(response.status, 400);
      const body = await response.json(); assert.equal(body.error.fieldErrors[0].path, 'prompt'); assert(body.error.fieldErrors[0].message);
    }
    assert.equal(adapterCalls, 0);
    for (const scenario of ['success', 'stream-failure']) {
      const response = await post({ ...input, prompt: '  Welcome aboard  ', scenario });
      const frames = new SseParser().push(new TextEncoder().encode(await response.text()), true);
      assert.deepEqual(frames.map((f) => Number(f.id)), frames.map((_, i) => i + 1));
      const terminals = frames.filter((f) => ['result', 'error', 'canceled'].includes(f.event)); assert.equal(terminals.length, 1);
      const snapshot = runSnapshotSchema.parse(scenario === 'success' ? JSON.parse(terminals[0]!.data) : JSON.parse(terminals[0]!.data).snapshot);
      assert.deepEqual(snapshot.events.map((e) => e.type), scenario === 'success'
        ? ['started', 'progress', 'progress', 'progress', 'tool-fixture', 'output', 'terminal']
        : ['started', 'progress', 'progress', 'progress', 'tool-fixture', 'terminal']);
      assert.equal(snapshot.events.filter((e) => e.type === 'terminal').length, 1);
      assert.equal(snapshot.status, scenario === 'success' ? 'succeeded' : 'failed');
      assert.equal(snapshot.evidence.length, 1);
      assert.equal(JSON.parse(snapshot.evidence[0]!.raw).input.prompt, 'Welcome aboard');
      if (snapshot.outcome?.status === 'succeeded') assert.deepEqual(snapshot.outcome.result,
        { fixture: 'test-run', prompt: 'Welcome aboard', response: 'Hello, Ada. Welcome aboard', modelCalls: 0 });
    }
  }); } finally { await store.close(); }
});

test('F07 cancelled slow fixture produces one terminal and no delayed effects even with an uncooperative wait', async () => {
  let release!: () => void; let waiting!: () => void;
  const entered = new Promise<void>((resolve) => { waiting = resolve; });
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const wait = async (ms: number, signal: AbortSignal) => { signal.throwIfAborted(); if (ms === 3_000) { waiting(); await gate; } };
  const store = new RunStore(createTestAdapter(5, wait), () => 0, scriptedPolicy, wait);
  const controller = new AbortController(); const seen: string[] = [];
  try {
    const run = store.createStream({ ...input, scenario: 'slow-cancel' }, controller); assert(run);
    const pending = run.execute((event) => seen.push(event.type)); await entered;
    assert.deepEqual(seen, ['started', 'progress', 'progress', 'progress']);
    controller.abort('user'); const before = [...seen]; release();
    const snapshot = await pending;
    assert.deepEqual(seen, before); assert.equal(snapshot.status, 'cancelled');
    assert.equal(snapshot.evidence.length, 0); assert.equal(snapshot.events.filter((e) => e.type === 'terminal').length, 1);
    assert(!snapshot.events.some((e) => ['output', 'tool-fixture'].includes(e.type)));
    assert.deepEqual(snapshot.outcome, { status: 'cancelled', reason: 'user', usage: { modelCalls: 0, billedUsd: 0 } });
  } finally { release(); await store.close(); }
});
