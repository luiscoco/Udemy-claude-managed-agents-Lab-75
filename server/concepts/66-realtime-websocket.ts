import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage, Server as HttpServer } from 'node:http';
import type { Socket } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { Router } from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import { z } from 'zod';
import { lab66CommandSchema, lab66ToolInputSchema, type Lab66Frame } from '../../shared/lab66-realtime-websocket.js';
import { apiError } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { createLiveLab01Port } from '../lib/lab01-port.js';
import { runLab01 } from '../lib/lab01-run.js';

type Run = { id: string; owner: string; mode: 'offline' | 'live'; state: Lab66Frame['state']; seq: number;
  frames: Lab66Frame[]; sockets: Set<WebSocket>; controller: AbortController; work?: Promise<void>;
  lastActivity: number; messageCommand?: string; acked: Map<WebSocket, number> };
export const slowConsumer = (bufferedAmount: number, maxBytes = 32768) => bufferedAmount > maxBytes;
const toolSchema = (() => { const { $schema: _dialect, ...schema } = z.toJSONSchema(lab66ToolInputSchema,
  { target: 'draft-2020-12', io: 'input' }); return schema; })();
export const lab66ToolDefinition = { type: 'custom' as const, name: 'compose_fixture_reply',
  description: 'Compose one offline teaching reply; no host effect.', input_schema: toolSchema };
function fixtureTool(event: { id: string; name: string; input: unknown }) {
  if (!/^sevt_[A-Za-z0-9_-]{1,80}$/.test(event.id) || event.name !== lab66ToolDefinition.name)
    throw new Error('Invalid fixture custom-tool event.');
  const input = lab66ToolInputSchema.parse(event.input);
  return { type: 'user.custom_tool_result' as const, custom_tool_use_id: event.id,
    content: [{ type: 'text' as const, text: `Aurora Finch field assistant: ${input.text}` }], is_error: false };
}
const hostOkay = (request: IncomingMessage) => {
  const host = request.headers.host ?? '', origin = request.headers.origin;
  return /^(localhost|127\.0\.0\.1):\d+$/.test(host) && (!origin || origin === `http://${host}`);
};

export function createLab66Router(stepMs = 70) {
  const router = Router(); const tokens = new Map<string, number>(); const runs = new Map<string, Run>();
  const commands = new Map<string, string>(); const wss = new WebSocketServer({ noServer: true, maxPayload: 2048,
    perMessageDeflate: false, clientTracking: true });
  let server: HttpServer | undefined; let closing = false;
  const error = (socket: WebSocket, commandId: string | undefined, message: string) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ kind: 'error', commandId, message })); };
  const send = (socket: WebSocket, value: unknown) => {
    if (socket.readyState !== WebSocket.OPEN) return;
    if (slowConsumer(socket.bufferedAmount)) { socket.close(1013, 'Slow consumer'); return; }
    socket.send(JSON.stringify(value));
  };
  const emit = (run: Run, kind: Lab66Frame['kind'], text: string) => {
    const frame: Lab66Frame = { kind, runId: run.id, seq: ++run.seq, text: text.slice(0, 2000), state: run.state,
      source: run.mode === 'offline' ? 'authored-fixture' : 'managed-api' };
    run.frames.push(frame); if (run.frames.length > 64) run.frames.shift(); run.lastActivity = Date.now();
    for (const socket of run.sockets) { if (socket.readyState !== WebSocket.OPEN) { run.sockets.delete(socket); continue; }
      send(socket, frame); } return frame;
  };
  const replay = (run: Run, socket: WebSocket, afterSeq: number) => {
    const first = run.frames[0]?.seq ?? run.seq + 1;
    if (afterSeq < first - 1) send(socket, { kind: 'gap', runId: run.id, seq: first - 1,
      text: `Replay begins at ${first}; earlier frames were evicted.`, state: run.state,
      source: run.mode === 'offline' ? 'authored-fixture' : 'managed-api' });
    for (const frame of run.frames) if (frame.seq > afterSeq) send(socket, frame);
  };
  const commandKey = (owner: string, commandId: string) => `${owner}:${commandId}`;
  const remember = (key: string, runId: string) => { commands.set(key, runId);
    if (commands.size > 100) commands.delete(commands.keys().next().value!); };
  async function perform(run: Run, text: string) {
    try {
      if (run.mode === 'offline') {
        const eventId = `sevt_${randomUUID().replaceAll('-', '')}`;
        const result = fixtureTool({ id: eventId, name: lab66ToolDefinition.name, input: { text } });
        emit(run, 'notice', `Custom-tool result correlated to ${result.custom_tool_use_id}; no host effect.`);
        const answer = result.content[0]!.text;
        for (const word of answer.split(/(?<=\s)/)) { await delay(stepMs, undefined, { signal: run.controller.signal });
          run.controller.signal.throwIfAborted(); emit(run, 'chunk', word); }
        run.state = 'completed'; emit(run, 'terminal', 'Offline turn completed.');
      } else {
        const port = createLiveLab01Port();
        const result = await runLab01({ mode: 'live', prompt: text, port, signal: run.controller.signal,
          deadlineMs: 30000, cleanupWaitMs: 5000,
          emit: frame => { if (frame.kind === 'preview' || frame.kind === 'message') emit(run, 'chunk', frame.text);
            else if (frame.kind === 'notice') emit(run, 'notice', frame.text); } });
        run.state = result.outcome.kind === 'completed' ? 'completed' : result.outcome.kind === 'cancelled' ? 'cancelled' : 'error';
        emit(run, 'terminal', result.outcome.detail);
      }
    } catch (cause) { run.state = run.controller.signal.aborted && run.controller.signal.reason !== 'deadline' ? 'cancelled' : 'error';
      emit(run, 'terminal', run.state === 'cancelled' ? 'Run cancelled.' : run.controller.signal.reason === 'deadline' ? 'Run deadline expired.' :
        cause instanceof Error && run.mode === 'offline' ? cause.message : 'Agent run failed.'); }
  }
  function attach(http: HttpServer) { if (server) throw new Error('Lab 66 WebSocket already attached.'); server = http;
    http.on('upgrade', onUpgrade); }
  function onUpgrade(request: IncomingMessage, socket: Socket, head: Buffer) {
    if (new URL(request.url ?? '/', 'http://localhost').pathname !== '/api/c66/ws') return;
    const token = /(?:^|; )lab66_auth=([A-Za-z0-9_-]+)/.exec(request.headers.cookie ?? '')?.[1];
    if (closing || !hostOkay(request) || request.headers.origin !== `http://${request.headers.host}` ||
      !token || (tokens.get(token) ?? 0) <= Date.now() || wss.clients.size >= 8) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); socket.destroy(); return; }
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, token));
  }
  wss.on('connection', (socket: WebSocket, owner: string) => {
    socket.on('error', () => { socket.terminate(); });
    send(socket, { kind: 'ready', protocol: 'lab66-v1', source: 'host', maxReplay: 64 });
    socket.on('message', data => {
      let parsed; try { parsed = lab66CommandSchema.parse(JSON.parse(data.toString())); }
      catch { error(socket, undefined, 'Invalid closed WebSocket command.'); return; }
      const key = 'commandId' in parsed ? commandKey(owner, parsed.commandId) : '';
      if (parsed.kind === 'start') {
        const oldId = commands.get(key); if (oldId) { const old = runs.get(oldId);
          if (!old) { error(socket, parsed.commandId, 'Run expired.'); return; }
          old.sockets.add(socket); send(socket, { kind: 'command-ack', commandId: parsed.commandId, runId: old.id,
            duplicate: true }); replay(old, socket, parsed.afterSeq); return; }
        if (parsed.mode === 'live' && !managedSettings().liveReady) {
          error(socket, parsed.commandId, 'Live Managed setup is not ready.'); return; }
        if (runs.size >= 30) { for (const [id, run] of runs) if (run.state !== 'running' && Date.now() - run.lastActivity > 300000) runs.delete(id); }
        if (runs.size >= 30) { error(socket, parsed.commandId, 'Run capacity reached.'); return; }
        const run: Run = { id: randomUUID(), owner, mode: parsed.mode, state: 'idle', seq: 0, frames: [],
          sockets: new Set([socket]), controller: new AbortController(), lastActivity: Date.now(), acked: new Map() };
        runs.set(run.id, run); remember(key, run.id);
        send(socket, { kind: 'command-ack', commandId: parsed.commandId, runId: run.id, duplicate: false });
        emit(run, 'started', `${parsed.mode} run created; no prompt sent yet.`); return;
      }
      const run = runs.get(parsed.runId);
      if (!run || run.owner !== owner) { error(socket, 'commandId' in parsed ? parsed.commandId : undefined, 'Run unavailable.'); return; }
      if (parsed.kind === 'ack') { run.acked.set(socket, Math.min(parsed.seq, run.seq)); return; }
      run.sockets.add(socket);
      if (parsed.kind === 'cancel') {
        if (commands.has(key)) { if (commands.get(key) !== run.id) { error(socket, parsed.commandId, 'Command belongs to another run.'); return; }
          send(socket, { kind: 'command-ack', commandId: parsed.commandId, runId: run.id, duplicate: true }); return; }
        remember(key, run.id); send(socket, { kind: 'command-ack', commandId: parsed.commandId, runId: run.id, duplicate: false });
        if (run.state === 'idle') { run.state = 'cancelled'; emit(run, 'terminal', 'Run cancelled before a message.'); }
        else if (run.state === 'running') run.controller.abort('cancelled'); return;
      }
      if (commands.has(key)) { if (commands.get(key) !== run.id) { error(socket, parsed.commandId, 'Command belongs to another run.'); return; }
        send(socket, { kind: 'command-ack', commandId: parsed.commandId, runId: run.id, duplicate: true });
        replay(run, socket, run.seq > 64 ? run.seq - 64 : 0); return; }
      if (run.state !== 'idle') { error(socket, parsed.commandId, 'Run already has a message. Start another run.'); return; }
      if ([...runs.values()].filter(item => item.state === 'running').length >= 2) {
        error(socket, parsed.commandId, 'Active run capacity reached.'); return; }
      remember(key, run.id); run.messageCommand = parsed.commandId; run.state = 'running';
      send(socket, { kind: 'command-ack', commandId: parsed.commandId, runId: run.id, duplicate: false });
      emit(run, 'notice', 'Message accepted once by the host.');
      const deadline = setTimeout(() => run.controller.abort('deadline'), 30000); deadline.unref();
      run.work = perform(run, parsed.text).finally(() => clearTimeout(deadline));
    });
    socket.on('close', () => { for (const run of runs.values()) { run.sockets.delete(socket); run.acked.delete(socket); } });
  });
  router.get('/code', (request, response) => { if (!hostOkay(request)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return; }
    const existing = /(?:^|; )lab66_auth=([A-Za-z0-9_-]+)/.exec(request.headers.cookie ?? '')?.[1];
    if (!existing || (tokens.get(existing) ?? 0) <= Date.now()) {
      const token = randomBytes(24).toString('base64url'); tokens.set(token, Date.now() + 1200000);
      if (tokens.size > 100) tokens.delete(tokens.keys().next().value!);
      response.cookie('lab66_auth', token,
        { httpOnly: true, sameSite: 'strict', secure: false, path: '/api/c66', maxAge: 1200000 });
    }
    response.set('Cache-Control', 'no-store');
    response.json({ files: ['shared/lab66-realtime-websocket.ts', 'server/concepts/66-realtime-websocket.ts'],
      endpoint: '/api/c66/ws', protocol: 'lab66-v1', source: 'local-websocket', liveReady: managedSettings().liveReady,
      note: 'GET grants only a short-lived local WebSocket fixture session; it never starts a Managed run.' });
  });
  return { router, attach, async close() { closing = true; if (server) server.off('upgrade', onUpgrade);
    for (const run of runs.values()) run.controller.abort('shutdown');
    await Promise.allSettled([...runs.values()].map(run => run.work));
    for (const socket of wss.clients) socket.terminate();
    await new Promise<void>(resolve => wss.close(() => resolve())); tokens.clear(); runs.clear(); commands.clear(); } };
}
