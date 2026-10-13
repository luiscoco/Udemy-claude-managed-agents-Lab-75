import { RunStore as HostRunStore } from '../server/lib/run-store.js';
import { testLesson, fixtureResponse } from './support/lesson.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import express from 'express';
import { reservedLessonIds, validateLessonRecords, validateLessonRegistry } from '../shared/lessons.js';
import { apiErrorSchema, factsSchema, runRequestSchema, runSnapshotSchema } from '../shared/contracts.js';
import { createTestRouter } from './support/router.js';
import { createHealthRouter } from '../server/routes/health.js';
import { RunStore } from './support/run-store.js';
import { scriptedPolicy, checkScriptedPolicy } from '../server/lib/policy.js';
import type { QueryPort } from '../server/lib/query-port.js';
import { createTestAdapter } from './support/adapter.js';

const verifyTestEffect = (name: string, output: string) => output === fixtureResponse(name);
const input = runRequestSchema.parse({ mode: 'scripted', learnerName: 'Ada' });
test('explicit registry reserves 1–75, validates metadata and rejects duplicate IDs', () => {
  assert.deepEqual(validateLessonRegistry([]), []);
  assert.deepEqual(validateLessonRecords([]), []);
  assert.deepEqual(validateLessonRegistry([testLesson]).map((lesson) => lesson.id), [0]);
  assert.equal(reservedLessonIds.length, 75);
  assert.deepEqual([reservedLessonIds[0], reservedLessonIds[74]], [1, 75]);
  assert.throws(() => validateLessonRegistry([testLesson, testLesson]), /Duplicate/);
  for (const key of ['id', 'title', 'topic', 'objective', 'steps', 'inspect', 'challenge', 'serverPrefix']) {
    const incomplete: Record<string, unknown> = { ...testLesson }; delete incomplete[key];
    assert.throws(() => validateLessonRegistry([incomplete]), key);
  }
  assert.throws(() => validateLessonRecords([{ ...testLesson, component: undefined }]), /component/);
});
test('numeric IDs, lowercase slugs and unpadded route prefixes are independent', () => {
  assert.equal(validateLessonRegistry([{ ...testLesson, id: 1, serverPrefix: '/api/c1' }])[0]?.id, 1);
  for (const serverPrefix of ['/api/c01', '/api/c1', '/api/dummy', '/api/c0/'])
    assert.throws(() => validateLessonRegistry([{ ...testLesson, serverPrefix }]));
  assert.throws(() => validateLessonRegistry([{ ...testLesson, slug: 'Dummy-00' }]));
  assert.throws(() => validateLessonRegistry([{ ...testLesson, id: 76, serverPrefix: '/api/c76' }]));
});
test('strict requests reject unsupported selectors and invalid names; host policy and verifier are callable', () => {
  for (const value of [null, {}, { mode: 'unknown', learnerName: 'Ada' },
    { mode: 'scripted', learnerName: ' ' }, { mode: 'scripted', learnerName: 'x'.repeat(41) }])
    assert.equal(runRequestSchema.safeParse(value).success, false);
  for (const key of ['command', 'file', 'module', 'identity', 'budgetUsd', 'maxModelTurns'])
    assert.equal(runRequestSchema.safeParse({ ...input, [key]: 'untrusted' }).success, false);
  assert.equal(checkScriptedPolicy(input), null);
  assert.equal(checkScriptedPolicy({ ...input, mode: 'live' })?.error.code, 'UNSUPPORTED_MODE');
  assert.equal(verifyTestEffect('Ada', 'Hello, Ada.'), true);
  assert.equal(verifyTestEffect('Ada', 'Hello, someone else.'), false);
});

async function withApi(port: QueryPort, action: (url: string, store: RunStore) => Promise<void>) {
  const store = new RunStore(port);
  const app = express();
  app.use('/api', createHealthRouter());
  app.use('/api/c0', createTestRouter(store));
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address(); assert(address && typeof address !== 'string');
    await action(`http://127.0.0.1:${address.port}`, store);
  } finally {
    await store.close(); server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}
const http = (url: string, options: RequestInit = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(2_000) });
const post = (body: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('health and immutable facts never invoke the injected port', async () => {
  let calls = 0;
  await withApi({ async execute() { calls++; throw new Error('Must not execute'); } }, async (url) => {
    assert.equal((await http(`${url}/api/health`)).status, 200);
    const response = await http(`${url}/api/c0/facts`);
    assert.equal(response.status, 200); assert.equal(factsSchema.parse(await response.json()).modelCalls, 0);
    assert.equal(calls, 0);
  });
});
test('focused router rejects invalid fields, live mode, malformed JSON and oversized bodies before execution', async () => {
  let calls = 0;
  await withApi({ async execute() { calls++; throw new Error('Must not execute'); } }, async (url) => {
    const invalid = await http(`${url}/api/c0/runs`, post({ ...input, learnerName: '' }));
    assert.equal(invalid.status, 400);
    assert.equal(apiErrorSchema.parse(await invalid.json()).error.fieldErrors[0]?.path, 'learnerName');
    assert.equal((await http(`${url}/api/c0/runs`, post({ ...input, command: 'do-something' }))).status, 400);
    assert.equal((await http(`${url}/api/c0/runs`, post({ ...input, mode: 'live' }))).status, 422);
    for (const [body, status] of [['{', 400], ['"' + 'x'.repeat(9_000) + '"', 413]] as const) {
      const response = await http(`${url}/api/c0/runs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      assert.equal(response.status, status); apiErrorSchema.parse(await response.json());
    }
    assert.equal((await http(`${url}/api/c0/runs/not-a-uuid`)).status, 400);
    assert.equal(calls, 0);
  });
});
test('HTTP lifecycle returns normalized events, raw fixture evidence and a verified outcome', async () => {
  await withApi(createTestAdapter(5), async (url, store) => {
    const response = await http(`${url}/api/c0/runs`, post(input)); assert.equal(response.status, 202);
    const started = runSnapshotSchema.parse(await response.json());
    await store.settle(started.runId);
    const done = runSnapshotSchema.parse(await (await http(`${url}/api/c0/runs/${started.runId}`)).json());
    assert.equal(done.outcome?.status, 'succeeded');
    assert.deepEqual(done.events.map((event) => event.seq), [1, 2, 3, 4]);
    assert.deepEqual(done.events.map((event) => event.type), ['started', 'tool-fixture', 'output', 'terminal']);
    assert(done.events.every((event) => event.runId === done.runId));
    assert.equal(done.evidence[0]?.source, 'authored-fixture');
    assert.equal(done.outcome?.usage.modelCalls, 0);
  });
});
test('HTTP cancellation reaches the adapter signal and produces a terminal outcome', async () => {
  await withApi(createTestAdapter(500), async (url, store) => {
    const run = runSnapshotSchema.parse(await (await http(`${url}/api/c0/runs`, post(input))).json());
    assert.equal((await http(`${url}/api/c0/runs/${run.runId}`, { method: 'DELETE' })).status, 202);
    await store.settle(run.runId);
    assert.deepEqual(store.get(run.runId)?.outcome, { status: 'cancelled', reason: 'user', usage: { modelCalls: 0, billedUsd: 0 } });
  });
});
test('capacity, concurrency, expiry, snapshot isolation and per-run output are bounded', async () => {
  let now = Date.now();
  const store = new RunStore(createTestAdapter(10), () => now, { ...scriptedPolicy, maxSessions: 2, ttlMs: 100 });
  try {
    const first = store.start(input); const second = store.start({ ...input, learnerName: 'Grace' });
    assert(first && second); assert.equal(store.start(input), null);
    first.events.length = 0; assert.equal(store.get(first.runId)?.events.length, 1);
    await Promise.all([store.settle(first.runId), store.settle(second.runId)]);
    assert.equal(store.get(first.runId)?.outcome?.status, 'succeeded');
    assert.equal(store.get(second.runId)?.events[2]?.type, 'output');
    assert.equal(store.get(second.runId)?.evidence[0]?.raw.includes('Grace'), true);
    assert.equal(store.get(first.runId)?.evidence[0]?.raw.includes('Grace'), false);
    assert.equal(store.start(input), null); // Completed sessions still consume bounded storage.
    now += 101; assert.equal(store.get(first.runId), undefined);
    assert(store.start(input));
  } finally { await store.close(); }
});
test('host deadline and shutdown abort pending execution and close resources', async () => {
  const store = new RunStore(createTestAdapter(500), Date.now, { ...scriptedPolicy, deadlineMs: 10 });
  try {
    const run = store.start(input); assert(run); await store.settle(run.runId);
    const outcome = store.get(run.runId)?.outcome;
    assert(outcome?.status === 'cancelled'); assert.equal(outcome.reason, 'deadline');
    const pending = store.start(input); assert(pending); await store.close();
    assert.equal(store.get(pending.runId), undefined); assert.equal(store.start(input), null);
  } finally { await store.close(); }
});
test('concurrency is enforced independently of session storage capacity', async () => {
  await withApi(createTestAdapter(500), async (url) => {
    assert.equal((await http(`${url}/api/c0/runs`, post(input))).status, 202);
    assert.equal((await http(`${url}/api/c0/runs`, post(input))).status, 202);
    const response = await http(`${url}/api/c0/runs`, post(input));
    assert.equal(response.status, 429); assert.equal(apiErrorSchema.parse(await response.json()).error.code, 'CAPACITY');
  });
});
test('expiry aborts active work and close waits for pruned execution to release resources', async () => {
  let now = Date.now(); let released = false; let reason: unknown;
  const adapter = createTestAdapter(500);
  const store = new RunStore({ async execute(value, signal, emit, inspect) {
    try { return await adapter.execute(value, signal, emit, inspect); }
    finally { reason = signal.reason; released = true; }
  } }, () => now, { ...scriptedPolicy, ttlMs: 10 });
  try {
    const run = store.start(input); assert(run);
    now += 11; assert.equal(store.get(run.runId), undefined);
    await store.close(); assert.equal(released, true); assert.equal(reason, 'expired');
  } finally { await store.close(); }
});
test('adapter event and evidence flooding cannot exceed host bounds or forge lifecycle events', async () => {
  for (const port of [
    { async execute(_input, _signal, emit) {
      for (let i = 0; i < 20; i++) emit({ type: 'output', payload: { text: 'fixture' } });
      return 'Hello, Ada.';
    } },
    { async execute(_input, _signal, _emit, inspect) {
      for (let i = 0; i < 20; i++) inspect({ source: 'authored-fixture', raw: '{}' });
      return 'Hello, Ada.';
    } },
    { async execute(_input, _signal, emit) {
      emit({ type: 'started', payload: { mode: 'scripted' } }); return 'Hello, Ada.';
    } },
  ] satisfies QueryPort[]) {
    const store = new RunStore(port);
    try {
      const run = store.start(input); assert(run); await store.settle(run.runId);
      const snapshot = store.get(run.runId); assert(snapshot);
      assert.equal(snapshot.status, 'failed'); assert(snapshot.events.length <= scriptedPolicy.maxEvents);
      assert(snapshot.evidence.length <= scriptedPolicy.maxEvidence);
      assert.equal(snapshot.events.at(-1)?.type, 'terminal');
    } finally { await store.close(); }
  }
});
test('adapter errors, wrong effects and oversized evidence produce sanitized failures', async () => {
  const ports: QueryPort[] = [
    { async execute() { throw new Error('fake-private-canary'); } },
    { async execute() { return 'wrong greeting'; } },
    { async execute(_input, _signal, _emit, inspect) { inspect({ source: 'authored-fixture', raw: 'x'.repeat(2049) }); return 'Hello, Ada.'; } },
  ];
  for (const port of ports) {
    const store = new RunStore(port);
    try {
      const run = store.start(input); assert(run); await store.settle(run.runId);
      const snapshot = store.get(run.runId); assert.equal(snapshot?.status, 'failed');
      assert.equal(JSON.stringify(snapshot).includes('fake-private-canary'), false);
    } finally { await store.close(); }
  }
});

test('reusable host accepts a lab-authored result and verifier without a greeting fixture', async () => {
  const store = new HostRunStore({ async execute() { return '42'; } }, Date.now, scriptedPolicy, undefined, {
    verify: (_request, output) => output === '42', result: (_request, output) => ({ answer: Number(output) }),
  });
  try {
    const run = store.start(input); assert(run); await store.settle(run.runId);
    const outcome = store.get(run.runId)?.outcome; assert(outcome?.status === 'succeeded');
    assert.deepEqual(outcome.result, { answer: 42 });
  } finally { await store.close(); }
});
