import { apiErrorSchema } from '../../shared/contracts';
import { redact } from './presentation';

export interface SseFrame { event: string; id: string; data: string }
/** Incremental UTF-8 and line parser. Only a blank line dispatches a frame. */
export class SseParser {
  private readonly decoder = new TextDecoder('utf-8', { fatal: true });
  private line = '';
  private skipLf = false;
  private event = '';
  private id = '';
  private data: string[] = [];
  private size = 0;
  constructor(private readonly maxFrameCharacters = 262_144) {}
  push(chunk: Uint8Array, final = false): SseFrame[] {
    const frames: SseFrame[] = [];
    for (const char of this.decoder.decode(chunk, { stream: !final })) {
      if (this.skipLf) { this.skipLf = false; if (char === '\n') continue; }
      if (++this.size > this.maxFrameCharacters) throw new Error('SSE frame exceeds the allowed size.');
      if (char === '\r' || char === '\n') {
        const line = this.line; this.line = ''; this.skipLf = char === '\r';
        if (!line) {
          if (this.data.length) frames.push({ event: this.event || 'message', id: this.id, data: this.data.join('\n') });
          this.event = ''; this.data = []; this.size = 0;
        } else if (line.startsWith(':')) { if (!this.data.length) this.size = 0; }
        else {
          const colon = line.indexOf(':');
          const key = colon < 0 ? line : line.slice(0, colon);
          let value = colon < 0 ? '' : line.slice(colon + 1);
          if (value.startsWith(' ')) value = value.slice(1);
          if (key === 'event') this.event = value;
          if (key === 'data') this.data.push(value);
          if (key === 'id' && !value.includes('\0')) this.id = value;
        }
      } else this.line += char;
    }
    // EOF does not dispatch a partially received frame.
    return frames;
  }
}
export type StreamFailureKind = 'http' | 'network' | 'stream' | 'missing-result' | 'idle' | 'deadline';
export class StreamFailure extends Error {
  constructor(public readonly kind: StreamFailureKind, public readonly url: string,
    message: string, public readonly status?: number, public readonly detail?: unknown) {
    super(`${url}${status === undefined ? '' : ` (HTTP ${status})`}: ${redact(message)}`);
  }
}
export type StreamOutcome<T> = { kind: 'success'; result: T } | { kind: 'canceled'; reason: string };
export interface StreamPostOptions<T> {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  idleMs: number;
  deadlineMs: number;
  resultSchema: { parse(value: unknown): T };
  onEvent?: (event: string, data: unknown, id: number) => void;
}
/** Exactly one fetch. A broken POST is never retried automatically. */
export async function streamPost<T>(url: string, body: unknown, options: StreamPostOptions<T>): Promise<StreamOutcome<T>> {
  for (const value of [options.idleMs, options.deadlineMs])
    if (!Number.isInteger(value) || value < 1 || value > 3_600_000) throw new Error('Invalid stream deadline');
  const controller = new AbortController();
  let expired: 'idle' | 'deadline' | undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let idle: ReturnType<typeof setTimeout>;
  const expire = (kind: 'idle' | 'deadline') => { expired = kind; controller.abort(); };
  const resetIdle = () => { clearTimeout(idle); idle = setTimeout(() => expire('idle'), options.idleMs); };
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) cancel();
  const deadline = setTimeout(() => expire('deadline'), options.deadlineMs);
  resetIdle();
  try {
    const response = await fetch(url, { method: 'POST', signal: controller.signal,
      headers: { ...options.headers, 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify(body) });
    resetIdle();
    if (!response.ok) {
      // Do not retain an unbounded proxy error page or wait indefinitely for it.
      reader = response.body?.getReader(); let text = '';
      if (reader) while (text.length < 8192) {
        const part = await reader.read(); if (part.done) break; resetIdle();
        text += new TextDecoder().decode(part.value).slice(0, 8192 - text.length);
      }
      let detail: unknown;
      try { detail = apiErrorSchema.parse(JSON.parse(text)); } catch { /* Non-JSON proxy page. */ }
      const message = detail ? apiErrorSchema.parse(detail).error.message : 'The streaming request was rejected.';
      const hint = response.status === 502 ? ' Start the local API backend (npm run dev:server), check its port, and verify the Vite proxy target.' : '';
      throw new StreamFailure('http', url, message + hint, response.status, detail);
    }
    if (!/^text\/event-stream(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '') || !response.body)
      throw new StreamFailure('stream', url, 'Expected a UTF-8 event stream. Check the backend route and proxy.', response.status);
    reader = response.body.getReader(); const parser = new SseParser(); let lastId = 0;
    while (true) {
      const part = await reader.read();
      if (!part.done) resetIdle(); // Heartbeat comments count as traffic, even without a data frame.
      for (const frame of parser.push(part.value ?? new Uint8Array(), part.done)) {
        if (!/^\d+$/.test(frame.id) || Number(frame.id) !== lastId + 1)
          throw new StreamFailure('stream', url, 'Nonsequential event ID. The response cannot be trusted; do not automatically repeat this POST.');
        lastId++;
        let data: unknown;
        try { data = JSON.parse(frame.data); }
        catch { throw new StreamFailure('stream', url, `Invalid JSON in ${frame.event} event ${frame.id}. Check the server SSE serializer.`, response.status); }
        if (frame.event === 'error') throw new StreamFailure('stream', url, 'The backend reported an execution failure. Inspect its redacted lifecycle logs.', response.status, data);
        if (frame.event === 'canceled') {
          const reason = typeof data === 'object' && data !== null && 'reason' in data && typeof data.reason === 'string' ? data.reason : 'server';
          return { kind: 'canceled', reason: redact(reason).slice(0, 200) };
        }
        if (frame.event === 'result') {
          let result: T;
          try { result = options.resultSchema.parse(data); }
          catch { throw new StreamFailure('stream', url, 'The terminal result does not match the lesson contract.', response.status); }
          return { kind: 'success', result };
        }
        options.onEvent?.(frame.event, data, lastId);
      }
      if (part.done) throw new StreamFailure('missing-result', url, 'The stream ended without a terminal result, error or canceled event. The run may be incomplete; it was not resubmitted.');
    }
  } catch (error) {
    if (options.signal?.aborted) return { kind: 'canceled', reason: 'user' };
    if (expired) throw new StreamFailure(expired, url, `${expired === 'idle' ? 'No stream traffic arrived before the idle deadline' : 'The whole-run deadline expired'}. The request was aborted and was not resubmitted.`);
    if (error instanceof StreamFailure) throw error;
    throw new StreamFailure(reader ? 'stream' : 'network', url,
      reader ? 'The stream failed or contained invalid UTF-8/event data. Check the backend logs; this POST was not resubmitted.' : 'Could not reach the backend. Start the local API server and check the proxy/port.');
  } finally {
    clearTimeout(idle!); clearTimeout(deadline); options.signal?.removeEventListener('abort', cancel);
    // Resolving on a terminal frame must not leave the response socket consuming data.
    if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    controller.abort();
  }
}
