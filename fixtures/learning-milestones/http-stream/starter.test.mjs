import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTutorServer } from './starter.ts';

async function withServer(run) {
  const server = createTutorServer(); server.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
test('valid prompt produces ordered parseable SSE and an ended response', async () => withServer(async base => {
  const response = await fetch(`${base}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: '  Hello\nworld  ' }) });
  assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /text\/event-stream/);
  const frames = (await response.text()).trim().split('\n\n').map(frame => {
    const [event, data] = frame.split('\n'); return { event: event.slice(7), data: JSON.parse(data.slice(6)) };
  });
  assert.deepEqual(frames, [{ event: 'started', data: { accepted: true } }, { event: 'answer', data: { text: 'You asked: Hello\nworld' } }, { event: 'done', data: { outcome: 'completed' } }]);
}));
test('invalid JSON and extra fields fail before SSE begins', async () => withServer(async base => {
  for (const body of ['{', '{}', '{"prompt":""}', '{"prompt":"hello","approved":true}', JSON.stringify({ prompt: 'x'.repeat(201) })]) {
    const response = await fetch(`${base}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(response.status, 400); assert.match(response.headers.get('content-type'), /application\/json/);
  }
}));
test('bounds body size, content type, route and method', async () => withServer(async base => {
  assert.equal((await fetch(`${base}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'x'.repeat(1100) }) })).status, 413);
  assert.equal((await fetch(`${base}/ask`, { method: 'POST', body: 'hello' })).status, 415);
  assert.equal((await fetch(`${base}/ask`)).status, 405); assert.equal((await fetch(`${base}/other`)).status, 404);
}));
