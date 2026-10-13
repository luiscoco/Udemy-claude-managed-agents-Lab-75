import type { Request, Response } from 'express';

export interface SseOptions {
  controller?: AbortController;
  heartbeatMs: number;
  idleMs: number;
  deadlineMs: number;
  maxQueuedBytes?: number;
  log?: (line: string) => void;
  quiet?: boolean;
}
export interface SseEvent { event: string; data: unknown }
const safeLog = (text: string) => text.replace(/\b(?:sk-ant-|sk-)[\w-]+/g, '[REDACTED]')
  .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
  .replace(/((?:api[_-]?key|token|password|secret|authorization)\s*[:=]\s*)\S+/gi, '$1[REDACTED]');

/** One POST connection, one controller. No replay, reconnect or retained run queue. */
export function openSse(req: Request, res: Response, options: SseOptions) {
  for (const value of [options.heartbeatMs, options.idleMs, options.deadlineMs])
    if (!Number.isInteger(value) || value < 1 || value > 3_600_000) throw new Error('Invalid SSE deadline');
  if (options.heartbeatMs >= options.idleMs) throw new Error('Heartbeat must be shorter than idle deadline');
  const controller = options.controller ?? new AbortController();
  const queue: string[] = [];
  const bound = options.maxQueuedBytes ?? 262_144;
  let queuedBytes = 0, sequence = 0, ending = false, closed = false;
  let writer: Promise<void> | undefined;
  let idle: ReturnType<typeof setTimeout>;
  let flushDeadline: ReturnType<typeof setTimeout> | undefined;
  const log = (event: string) => { if (!options.quiet) {
    try { (options.log ?? console.info)(safeLog(JSON.stringify({ scope: 'sse', event }))); } catch { /* Logging cannot break cancellation. */ }
  } };
  const clearTimers = () => { clearInterval(heartbeat); clearTimeout(idle); clearTimeout(deadline); if (flushDeadline) clearTimeout(flushDeadline); };
  function cleanup(reason: string) {
    if (closed) return;
    closed = true; clearTimers(); queue.length = 0; queuedBytes = 0;
    req.off('aborted', disconnect); res.off('close', disconnect); res.off('error', disconnect); res.off('finish', finished);
    if (reason !== 'finished') controller.abort(reason);
    log(reason);
  }
  function disconnect() { cleanup('disconnect'); if (!res.destroyed) res.destroy(); }
  function finished() { cleanup('finished'); }
  function resetIdle() { clearTimeout(idle); idle = setTimeout(() => timeout('idle'), options.idleMs); }
  function drain(): Promise<void> {
    return new Promise((resolve) => {
      const done = () => { res.off('drain', done); res.off('close', done); res.off('error', done); resolve(); };
      res.once('drain', done); res.once('close', done); res.once('error', done);
      if (res.destroyed || closed) done();
    });
  }
  function pump() {
    if (writer || closed) return;
    writer = (async () => {
      while (queue.length && !closed && !res.destroyed && !res.writableEnded) {
        const frame = queue.shift()!; queuedBytes -= Buffer.byteLength(frame);
        try { const ready = res.write(frame, 'utf8'); resetIdle(); if (!ready) await drain(); }
        catch { disconnect(); }
      }
    })().finally(() => { writer = undefined; if (queue.length && !closed) pump(); });
  }
  function enqueue(frame: string): boolean {
    if (ending || closed || res.destroyed || res.writableEnded) return false;
    if (queuedBytes + Buffer.byteLength(frame) + res.writableLength > bound) {
      cleanup('queue-limit'); res.destroy(); return false;
    }
    queue.push(frame); queuedBytes += Buffer.byteLength(frame); pump(); return true;
  }
  function send(event: string, data: unknown): boolean {
    if (!/^[a-z][a-z0-9_-]*$/.test(event)) throw new Error('Invalid SSE event name');
    const json = JSON.stringify(data);
    if (json === undefined) throw new Error('SSE data must be JSON');
    const accepted = enqueue(`id: ${++sequence}\nevent: ${event}\n${json.split(/\r\n|\r|\n/).map((line) => `data: ${line}`).join('\n')}\n\n`);
    if (accepted && ['result', 'error', 'canceled'].includes(event)) log(event);
    return accepted;
  }
  async function end() {
    if (ending || closed) return;
    ending = true; clearInterval(heartbeat); clearTimeout(idle); clearTimeout(deadline);
    // A peer that stops reading must not retain the queue or adapter forever.
    flushDeadline = setTimeout(() => { cleanup('flush-deadline'); res.destroy(); }, 250);
    while (writer && !closed) await writer;
    if (!closed && !res.destroyed && !res.writableEnded) res.end();
  }
  function timeout(reason: 'idle' | 'deadline') {
    if (ending || closed) return;
    send('canceled', { reason }); controller.abort(reason); log(reason); void end();
  }
  async function pipe(events: AsyncIterable<SseEvent>) {
    try {
      for await (const frame of events) {
        controller.signal.throwIfAborted();
        if (!send(frame.event, frame.data)) break;
        if (writer) await writer;
      }
    } finally { await end(); }
  }
  const heartbeat = setInterval(() => { enqueue(': heartbeat\n\n'); }, options.heartbeatMs);
  const deadline = setTimeout(() => timeout('deadline'), options.deadlineMs);
  resetIdle();
  req.once('aborted', disconnect); res.once('close', disconnect); res.once('error', disconnect); res.once('finish', finished);
  res.status(200).set({ 'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders(); log('open');
  if (req.aborted || res.destroyed) disconnect();
  return { controller, send, pipe, end, get closed() { return closed; },
    get queuedBytes() { return queuedBytes; } };
}
