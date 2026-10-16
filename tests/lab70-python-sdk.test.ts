import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runLab70Python, selectLab70Python } from '../server/lib/lab70-python.js';
import { Lab70Workshop } from '../server/concepts/70-python-sdk.js';

const available = Boolean(selectLab70Python()); const skip = available ? false : 'No allowlisted Python interpreter; missing-interpreter boundary remains tested.';
const run = (scenario = 'normal') => runLab70Python({ mode: 'offline', operation: 'one-shot', scenario,
  prompt: 'Describe fictional finches.' }, { signal: new AbortController().signal });
test('missing interpreter is actionable and cannot invoke a shell', async () => {
  await assert.rejects(runLab70Python({ mode: 'readiness' }, { signal: new AbortController().signal, interpreter: null }), /allowlisted Python/);
  assert.equal(selectLab70Python({ PYTHON_SDK_EXECUTABLE: 'python -c arbitrary' }), null);
});
test('isolated readiness and offline worker use a bounded JSON-lines protocol', { skip }, async () => {
  const readiness = await runLab70Python({ mode: 'readiness' }, { signal: new AbortController().signal });
  assert.equal(readiness.protocolError, null); assert.equal(readiness.frames[0]?.type, 'readiness');
  const reply = await run(); assert.equal(reply.protocolError, null);
  const result = reply.frames.find(frame => frame.type === 'result'); assert.ok(result && result.type === 'result');
  assert.equal(result.outcome, 'completed'); assert.equal(result.cleanup, 'simulated-archive');
  const custom = await run('custom-tool'); const tool = custom.frames.find(frame => frame.type === 'tool_use');
  assert.ok(tool && tool.type === 'tool_use' && tool.id.startsWith('sevt_'));
  const final = custom.frames.find(frame => frame.type === 'result'); assert.ok(final && final.type === 'result');
  assert.match(final.text, /3 fictional Aurora Finch/);
});
test('malformed stdout, bounded stderr and graceful local cancellation stay distinct', { skip }, async () => {
  const malformed = await run('malformed-stdout'); assert.match(malformed.protocolError ?? '', /Malformed/);
  const noisy = await run('stderr-flood'); assert.equal(noisy.protocolError, null); assert.equal(noisy.stderrTruncated, true);
  assert.ok(noisy.stderrBytes > 4096); assert.ok(noisy.stderrPreview.length <= 300);
  const controller = new AbortController();
  const pending = runLab70Python({ mode: 'offline', operation: 'one-shot', scenario: 'hang', prompt: 'Wait.' },
    { signal: controller.signal, emit: frame => { if (frame.type === 'progress') controller.abort('test'); } });
  const cancelled = await pending; const final = cancelled.frames.find(frame => frame.type === 'result');
  assert.ok(final && final.type === 'result'); assert.equal(final.outcome, 'cancelled');
  assert.equal(final.cleanup, 'simulated-archive'); assert.equal(cancelled.killed, false);
});
test('host owns retained handles, confirms idle reuse and closes the same session', { skip }, async () => {
  const store = new Lab70Workshop({}); try {
    const first = store.start('owner-a', { mode: 'offline', operation: 'retained-start', scenario: 'custom-tool', prompt: 'Format birds.' });
    const completed = await store.settle('owner-a', first.id); assert.equal(completed.state, 'completed'); assert.ok(completed.sessionHandle);
    const remoteId = store.sessionList('owner-a')[0]!.remoteId;
    assert.throws(() => store.start('other-owner', { mode: 'offline', operation: 'retained-turn', scenario: 'normal', prompt: 'Continue.', sessionHandle: completed.sessionHandle }), /Owned/);
    const next = store.start('owner-a', { mode: 'offline', operation: 'retained-turn', scenario: 'normal', prompt: 'Continue.', sessionHandle: completed.sessionHandle });
    assert.equal((await store.settle('owner-a', next.id)).state, 'completed');
    assert.equal(store.sessionList('owner-a')[0]!.remoteId, remoteId);
    const close = store.start('owner-a', { mode: 'offline', operation: 'close', scenario: 'normal', prompt: 'Close.', sessionHandle: completed.sessionHandle });
    await store.settle('owner-a', close.id); assert.equal(store.sessionList('owner-a')[0]!.state, 'closed');
    assert.equal(store.facts().liveReady, false);
  } finally { await store.close(); }
});
