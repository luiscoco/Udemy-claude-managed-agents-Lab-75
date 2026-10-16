import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { after, test } from 'node:test';
import express from 'express';
import WebSocket from 'ws';
import { createLab66Router, slowConsumer } from '../server/concepts/66-realtime-websocket.js';

const app = express(); const feature = createLab66Router(8); app.use('/api/c66', feature.router);
const server = createServer(app); feature.attach(server); server.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const address = server.address(); if (!address || typeof address === 'string') throw new Error('No test port');
const origin = `http://127.0.0.1:${address.port}`; const wsUrl = `ws://127.0.0.1:${address.port}/api/c66/ws`;
after(async () => { await feature.close(); await new Promise<void>(resolve => server.close(() => resolve())); });
type Frame = { kind: string; runId?: string; seq?: number; text?: string; state?: string; duplicate?: boolean; commandId?: string };
function collector(ws: WebSocket) { const frames: Frame[] = []; const waiters: (() => void)[] = [];
  ws.on('message', data => { frames.push(JSON.parse(data.toString()) as Frame); for (const wake of waiters.splice(0)) wake(); });
  async function until(predicate: (frame: Frame) => boolean, timeoutMs = 3000): Promise<Frame> {
    const deadline = Date.now() + timeoutMs;
    for (;;) { const found = frames.find(predicate); if (found) return found;
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for frame; saw ${JSON.stringify(frames)}`);
      await Promise.race([new Promise<void>(resolve => waiters.push(resolve)), new Promise(resolve => setTimeout(resolve, 20))]); }
  }
  return { frames, until };
}
async function connect(cookie: string, customOrigin = origin) { const ws = new WebSocket(wsUrl, { headers: { Cookie: cookie,
  Origin: customOrigin } }); const feed = collector(ws);
  await new Promise<void>((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  return { ws, feed }; }

test('upgrade requires local same-origin cookie and bounded payload', async () => {
  assert.equal(slowConsumer(32768), false); assert.equal(slowConsumer(32769), true);
  const denied = new WebSocket(wsUrl, { headers: { Origin: origin } });
  denied.on('error', () => {});
  const status = await new Promise<number>(resolve => denied.once('unexpected-response', (_request, response) => {
    response.resume(); resolve(response.statusCode ?? 0); }));
  assert.equal(status, 403);
  const response = await fetch(`${origin}/api/c66/code`); assert.equal(response.status, 200);
  assert.equal((await response.json()).liveReady, false);
  const cookie = response.headers.get('set-cookie')?.split(';')[0] ?? ''; assert.match(cookie, /^lab66_auth=/);
  const reused = await fetch(`${origin}/api/c66/code`, { headers: { Cookie: cookie } });
  assert.equal(reused.headers.get('set-cookie'), null, 'source inspection preserves active run identity');
  const foreign = new WebSocket(wsUrl, { headers: { Cookie: cookie, Origin: 'http://evil.example' } });
  foreign.on('error', () => {});
  assert.equal(await new Promise<number>(resolve => foreign.once('unexpected-response', (_request, res) => {
    res.resume(); resolve(res.statusCode ?? 0); })), 403);
  const { ws, feed } = await connect(cookie); await feed.until(frame => frame.kind === 'ready');
  ws.on('error', () => {});
  const closed = new Promise<number>(resolve => ws.once('close', code => resolve(code)));
  ws.send('x'.repeat(3000)); assert.equal(await closed, 1009);
});

test('ordered stream, disconnect/replay and duplicate commands retain one run', async () => {
  const response = await fetch(`${origin}/api/c66/code`); const cookie = response.headers.get('set-cookie')!.split(';')[0]!;
  const first = await connect(cookie); const startId = randomUUID(); const messageId = randomUUID();
  first.ws.send(JSON.stringify({ kind: 'start', commandId: startId, mode: 'offline', afterSeq: 0 }));
  const ack = await first.feed.until(frame => frame.kind === 'command-ack' && frame.commandId === startId);
  const runId = ack.runId!; await first.feed.until(frame => frame.kind === 'started' && frame.runId === runId);
  first.ws.send(JSON.stringify({ kind: 'message', commandId: messageId, runId, text: 'Observe three fictional birds.' }));
  await first.feed.until(frame => frame.kind === 'chunk' && frame.runId === runId);
  const before = Math.max(...first.feed.frames.filter(frame => frame.runId === runId && frame.seq).map(frame => frame.seq!));
  first.ws.close(); await new Promise<void>(resolve => first.ws.once('close', resolve));
  const second = await connect(cookie); second.ws.send(JSON.stringify({ kind: 'start', commandId: startId,
    mode: 'offline', afterSeq: before }));
  const resumed = await second.feed.until(frame => frame.kind === 'command-ack' && frame.commandId === startId);
  assert.equal(resumed.runId, runId); assert.equal(resumed.duplicate, true);
  const terminal = await second.feed.until(frame => frame.kind === 'terminal' && frame.runId === runId);
  assert.equal(terminal.state, 'completed');
  const events = second.feed.frames.filter(frame => frame.runId === runId && frame.seq && frame.kind !== 'gap');
  assert.deepEqual(events.map(frame => frame.seq), [...events.map(frame => frame.seq)].sort((a, b) => a! - b!));
  second.ws.send(JSON.stringify({ kind: 'message', commandId: messageId, runId, text: 'Changed text must not run.' }));
  assert.equal((await second.feed.until(frame => frame.kind === 'command-ack' && frame.commandId === messageId && frame.duplicate === true)).duplicate, true);
  second.ws.close();
});

test('cancel stops a running fixture; invalid and foreign commands are refused', async () => {
  const response = await fetch(`${origin}/api/c66/code`); const cookie = response.headers.get('set-cookie')!.split(';')[0]!;
  const { ws, feed } = await connect(cookie);
  ws.send(JSON.stringify({ kind: 'start', commandId: randomUUID(), mode: 'offline', afterSeq: 0, extra: true }));
  await feed.until(frame => frame.kind === 'error');
  const startId = randomUUID(); ws.send(JSON.stringify({ kind: 'start', commandId: startId, mode: 'offline', afterSeq: 0 }));
  const runId = (await feed.until(frame => frame.kind === 'command-ack' && frame.commandId === startId)).runId!;
  ws.send(JSON.stringify({ kind: 'message', commandId: randomUUID(), runId, text: 'A long fictional observation with many words to stream.' }));
  await feed.until(frame => frame.kind === 'chunk' && frame.runId === runId);
  ws.send(JSON.stringify({ kind: 'cancel', commandId: randomUUID(), runId }));
  assert.equal((await feed.until(frame => frame.kind === 'terminal' && frame.runId === runId)).state, 'cancelled');
  ws.close();
});

test('long runs expose an explicit gap before the bounded terminal replay', async () => {
  const response = await fetch(`${origin}/api/c66/code`); const cookie = response.headers.get('set-cookie')!.split(';')[0]!;
  const first = await connect(cookie); const startId = randomUUID();
  first.ws.send(JSON.stringify({ kind: 'start', commandId: startId, mode: 'offline', afterSeq: 0 }));
  const runId = (await first.feed.until(frame => frame.kind === 'command-ack' && frame.commandId === startId)).runId!;
  first.ws.send(JSON.stringify({ kind: 'message', commandId: randomUUID(), runId, text: 'a '.repeat(240).trim() }));
  await first.feed.until(frame => frame.kind === 'terminal' && frame.runId === runId, 7000);
  first.ws.close(); await new Promise<void>(resolve => first.ws.once('close', resolve));
  const second = await connect(cookie); second.ws.send(JSON.stringify({ kind: 'start', commandId: startId,
    mode: 'offline', afterSeq: 0 }));
  const gap = await second.feed.until(frame => frame.kind === 'gap' && frame.runId === runId);
  const terminal = await second.feed.until(frame => frame.kind === 'terminal' && frame.runId === runId);
  assert.ok(gap.seq! > 1); assert.equal(terminal.state, 'completed');
  assert.ok(second.feed.frames.filter(frame => frame.runId === runId && frame.seq && frame.kind !== 'gap').length <= 64);
  second.ws.close();
});
