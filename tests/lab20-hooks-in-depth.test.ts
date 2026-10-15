import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { lab20HostAuditSchema, lab20ProviderEventSchema, lab20RunSchema } from '../shared/lab20-hooks-in-depth.js';
import { createLab20Router } from '../server/concepts/20-hooks-in-depth.js';
import { createFixtureLab07Port } from '../server/lib/lab07-port.js';
import { runLab20 } from '../server/lib/lab20-run.js';

const input = lab20RunSchema.parse({ mode: 'scripted', scenario: 'passing-policy', prompt: 'Review the draft fixture.',
  deadlineSeconds: 15, budgetCents: 50 });
const signal = new AbortController().signal;

test('closed contracts reject SDK hooks, invalid correlations and live-only fixture failures', () => {
  for (const field of [{ hooks: {} }, { PreToolUse: true }, { PostToolUse: true }, { callback: 'x' }, { deadlineSeconds: 0 }])
    assert.equal(lab20RunSchema.safeParse({ ...input, ...field }).success, false);
  assert.equal(lab20RunSchema.safeParse({ ...input, mode: 'live', scenario: 'deadline' }).success, false);
  assert.equal(lab20ProviderEventSchema.safeParse({ kind: 'model-span', runId: crypto.randomUUID(), sessionId: null,
    threadId: null, eventId: null, type: 'span.model_request_start', detail: '', extra: true }).success, false);
  assert.equal(lab20HostAuditSchema.safeParse({ kind: 'handler', runId: crypto.randomUUID(), sessionId: null,
    threadId: null, eventId: null, phase: 'after', outcome: 'allow', detail: '' }).success, false);
});

test('passing, denied and tool-failure outcomes correlate actual handler effects', async () => {
  for (const [scenario, expected, changed] of [
    ['passing-policy', 'verified', true], ['denied-pre-execution', 'host-policy-denial', false], ['tool-failure', 'tool-error', false],
  ] as const) {
    const { result, sandbox } = await runLab20({ ...input, scenario }, signal);
    try {
      assert.equal(result.outcome, expected);
      assert.equal((await sandbox.readText('workspace/draft.md')).includes('Status: reviewed'), changed);
      assert.ok(result.sessionId); assert.ok(result.providerEvents.some(entry => entry.kind === 'lifecycle'));
      assert.ok(result.providerEvents.some(entry => entry.kind === 'tool-request'));
      assert.ok(result.providerEvents.some(entry => entry.kind === 'tool-result'));
      assert.ok(result.hostAudit.every(entry => entry.runId === result.runId));
      assert.ok(result.hostAudit.some(entry => entry.kind === 'handler' && entry.outcome === (scenario === 'denied-pre-execution' ? 'skipped'
        : scenario === 'tool-failure' ? 'failed' : 'ran')));
      assert.ok(result.hostAudit.some(entry => entry.kind === 'coverage' && entry.phase === 'child-thread' && entry.outcome === 'not-observed'));
    } finally { await sandbox.dispose(); }
  }
});

test('interceptor exception fails closed, deadline uses virtual ticks, final validation rejects completed turn', async () => {
  for (const [scenario, outcome] of [
    ['interceptor-exception', 'host-instrumentation-error'], ['deadline', 'deadline'],
    ['final-validation-failure', 'final-validation-error'],
  ] as const) {
    const { result, sandbox } = await runLab20({ ...input, scenario }, signal);
    try {
      assert.equal(result.outcome, outcome);
      assert.equal(result.virtualTicks, scenario === 'deadline' ? 5 : null);
      assert.equal(result.sessionId === null, scenario !== 'final-validation-failure');
      assert.equal(result.providerEvents.length === 0, scenario !== 'final-validation-failure');
      assert.equal((await sandbox.readText('workspace/draft.md')).includes('Status: reviewed'), scenario === 'final-validation-failure');
      if (scenario === 'interceptor-exception') assert.ok(result.hostAudit.some(event => event.kind === 'handler' && event.outcome === 'skipped'));
    } finally { await sandbox.dispose(); }
  }
});

test('an injected provider creation error is distinct from host instrumentation and tool errors', async () => {
  const { result, sandbox } = await runLab20(input, signal, () => {}, request => {
    const fixture = createFixtureLab07Port(request);
    return { ...fixture, async create() { throw new Error('Fixture provider unavailable.'); } };
  });
  try { assert.equal(result.outcome, 'provider-error'); assert.equal(result.sessionId, null);
    assert.equal((await sandbox.readText('workspace/draft.md')).includes('Status: reviewed'), false);
  } finally { await sandbox.dispose(); }
});

test('an audit sink exception before port creation cannot authorize a tool', async () => {
  let portsCreated = 0;
  await assert.rejects(runLab20(input, signal, () => { throw new Error('Audit sink failed.'); }, request => {
    portsCreated++; return createFixtureLab07Port(request);
  }), /Audit sink failed/);
  assert.equal(portsCreated, 0);
});

test('HTTP inventory is owner-scoped, reset is explicit, and malformed live/SDK requests fail before work', async () => {
  const concept = createLab20Router(), app = express(); app.use('/api/c20', concept.router);
  const server = app.listen(0); await once(server, 'listening'); const address = server.address(); assert(address && typeof address !== 'string');
  const root = `http://127.0.0.1:${address.port}/api/c20`, headers = (owner = 'alice') => ({ 'Content-Type': 'application/json', 'X-Lab-Owner': owner });
  const post = (path: string, body: unknown, owner = 'alice') => fetch(`${root}/${path}`, { method: 'POST', headers: headers(owner), body: JSON.stringify(body) });
  try {
    assert.equal((await post('run', { ...input, hooks: {} })).status, 400);
    assert.equal((await post('run', { ...input, mode: 'live', scenario: 'deadline' })).status, 400);
    assert.equal((await post('run', { ...input, mode: 'live' })).status, 422);
    const ready = await fetch(`${root}/availability`, { headers: headers() });
    assert.equal((await ready.json()).liveReady, false);
    const response = await post('run', input), body = await response.text(); assert.equal(response.status, 200);
    const frame = /event: result\ndata: ([^\n]+)/.exec(body); assert(frame);
    const result = JSON.parse(frame[1]!) as { runId: string; outcome: string };
    assert.equal(result.outcome, 'verified');
    assert.equal((await fetch(`${root}/files?runId=${result.runId}`, { headers: headers('bob') })).status, 404);
    assert.equal((await fetch(`${root}/file?runId=${result.runId}&name=../draft.md`, { headers: headers() })).status, 400);
    assert.equal((await fetch(`${root}/file?runId=${result.runId}&name=draft.md`, { headers: headers() })).status, 200);
    assert.equal((await post('reset', { runId: result.runId, confirmReset: false })).status, 400);
    assert.equal((await post('reset', { runId: result.runId, confirmReset: true }, 'bob')).status, 404);
    assert.equal((await post('reset', { runId: result.runId, confirmReset: true })).status, 200);
    assert.equal((await fetch(`${root}/files?runId=${result.runId}`, { headers: headers() })).status, 404);
  } finally { await concept.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
