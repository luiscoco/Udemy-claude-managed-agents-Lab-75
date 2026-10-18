import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reduceFrames } from './starter.ts';

test('separates answer, session and terminal outcome', () => {
  assert.deepEqual(reduceFrames([{ id: '1', kind: 'session', value: 'session-fixture' }, { id: '2', kind: 'text', value: 'Hello' },
    { id: '3', kind: 'outcome', value: 'completed' }]), { sessionId: 'session-fixture', text: 'Hello', outcome: 'completed', eventCount: 3 });
});
test('deduplicates frames and leaves an unterminated stream incomplete', () => {
  const frame = { id: '1', kind: 'text', value: 'One' };
  assert.deepEqual(reduceFrames([frame, frame]), { sessionId: null, text: 'One', outcome: 'incomplete', eventCount: 1 });
});
test('first outcome wins and later frames cannot rewrite it', () => {
  assert.deepEqual(reduceFrames([{ id: '1', kind: 'outcome', value: 'error' }, { id: '2', kind: 'text', value: 'pretend success' }]),
    { sessionId: null, text: '', outcome: 'error', eventCount: 1 });
});
test('rejects unexpected event kinds and conflicting sessions', () => {
  assert.throws(() => reduceFrames([{ id: '1', kind: 'unknown', value: 'x' }]));
  assert.throws(() => reduceFrames([{ id: '1', kind: 'session', value: 'a' }, { id: '2', kind: 'session', value: 'b' }]));
});
