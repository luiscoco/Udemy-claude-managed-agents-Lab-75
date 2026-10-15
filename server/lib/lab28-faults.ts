import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Lab28Request, Lab28Result } from '../../shared/lab28-errors-retries.js';
import { lab28ResultSchema } from '../../shared/lab28-errors-retries.js';

export const sideEffectRequestOptions = { maxRetries: 0 } as const;
export interface Lab28Port { read(signal: AbortSignal): Promise<{ status: number; events: string[] }>;
  mutate(operation: 'create' | 'send' | 'confirm' | 'result' | 'interrupt', signal: AbortSignal, options: typeof sideEffectRequestOptions): Promise<{ id: string | null }> }
export const invokeSideEffect = (port: Lab28Port, operation: Parameters<Lab28Port['mutate']>[0], signal: AbortSignal) =>
  port.mutate(operation, signal, sideEffectRequestOptions);
export class Lab28Ledger { private effects = new Set<string>(); applyOnce(key: string) { if (this.effects.has(key)) return false; this.effects.add(key); return true; }
  get count() { return this.effects.size; } }
export async function createLoopbackFaultServer(scenario: 'read-rate-limit' | 'missing-create-response' | 'tool-result-failure') {
  let reads = 0, writes = 0;
  const server = createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/history') {
      reads++; response.setHeader('Content-Type', 'application/json');
      response.statusCode = scenario === 'read-rate-limit' && reads < 3 ? 429 : 200;
      response.end(JSON.stringify({ events: ['e1', 'e1', 'e2'] })); return;
    }
    if (request.method === 'POST' && (request.url === '/create' || request.url === '/result')) {
      writes++; if (scenario === 'missing-create-response' || scenario === 'tool-result-failure') { request.socket.destroy(); return; }
      response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ id: 'sesn_fixture_known' })); return;
    }
    response.statusCode = 404; response.end();
  });
  server.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${address.port}`, counts: () => ({ reads, writes }), close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}
export async function boundedRead<T>(read: () => Promise<T & { status: number }>, wait: (ms: number) => Promise<void>, random: () => number,
  signal: AbortSignal, maxAttempts = 3) {
  let attempts = 0;
  for (;;) { signal.throwIfAborted(); attempts++;
    const result = await read(); if (result.status < 400 || ![429, 503].includes(result.status) || attempts >= maxAttempts) return { result, attempts };
    const backoff = Math.floor((20 * 2 ** (attempts - 1)) + random() * 10);
    await new Promise<void>((resolve, reject) => { const aborted = () => reject(signal.reason ?? new Error('Canceled'));
      signal.addEventListener('abort', aborted, { once: true });
      if (signal.aborted) { aborted(); signal.removeEventListener('abort', aborted); return; }
      void wait(backoff).then(() => { signal.removeEventListener('abort', aborted); resolve(); },
        error => { signal.removeEventListener('abort', aborted); reject(error); }); });
    signal.throwIfAborted(); }
}
const knownSession = 'sesn_fixture_known';
export async function runLab28(input: Lab28Request, signal: AbortSignal, wait: (ms: number) => Promise<void> = async () => {}, random = () => 0): Promise<Lab28Result> {
  if (input.mode === 'live') throw new Error('Live fault injection requires a separately configured Managed port.');
  const common = { source: 'authored-loopback-fixture' as const, scenario: input.scenario, readAttempts: 0, mutationAttempts: 0,
    effectCount: 0, sessionId: null as string | null, reconcile: 'not-needed' as Lab28Result['reconcile'], retryAllowed: false,
    remoteStopped: null as boolean | null, cleanup: 'not-needed' as Lab28Result['cleanup'], evidence: [] as string[], guidance: '' };
  if (input.scenario === 'read-rate-limit') {
    const server = await createLoopbackFaultServer('read-rate-limit'); try {
      const { result, attempts } = await boundedRead(async () => {
        const response = await fetch(`${server.url}/history`, { signal }); return { status: response.status, events: (await response.json() as { events: string[] }).events }; }, wait, random, signal);
      return lab28ResultSchema.parse({ ...common, classification: 'transient-read', readAttempts: attempts, retryAllowed: true,
        evidence: [`GET statuses: 429, 429, ${result.status}`, `History event IDs deduplicated: ${[...new Set(result.events)].join(', ')}`], guidance: 'Only the bounded GET was retried.' });
    } finally { await server.close(); }
  }
  if (input.scenario === 'missing-create-response') {
    const server = await createLoopbackFaultServer(input.scenario); try { try { await fetch(`${server.url}/create`, { method: 'POST', signal }); } catch {}
      return lab28ResultSchema.parse({ ...common, classification: 'uncertain-create', mutationAttempts: server.counts().writes,
        reconcile: 'unknown-create-id', cleanup: 'pending', evidence: ['POST reached the loopback server; response disappeared before an ID was observed.'],
        guidance: 'Do not resend create. Search a bounded owned inventory or operator logs; without a confirmed ID, quarantine the attempt and seek recovery.' });
    } finally { await server.close(); }
  }
  if (input.scenario === 'tool-result-failure') {
    const ledger = new Lab28Ledger(); ledger.applyOnce('tool-call-1'); ledger.applyOnce('tool-call-1');
    const server = await createLoopbackFaultServer(input.scenario); try { try { await fetch(`${server.url}/result`, { method: 'POST', signal }); } catch {}
      return lab28ResultSchema.parse({ ...common, classification: 'uncertain-result', mutationAttempts: server.counts().writes,
        effectCount: ledger.count, sessionId: knownSession, reconcile: 'host-ledger', cleanup: 'pending',
        evidence: ['Host effect key tool-call-1 applied once.', 'Result send reached loopback; acknowledgment was lost.'],
        guidance: 'Inspect known session history and the idempotency ledger before any deliberate result resend.' });
    } finally { await server.close(); }
  }
  if (input.scenario === 'reconnect-duplicates') {
    const ledger = new Lab28Ledger(); for (const id of ['e1', 'e1', 'e2']) ledger.applyOnce(id);
    return lab28ResultSchema.parse({ ...common, classification: 'reconciled', sessionId: knownSession, reconcile: 'known-session-history',
      effectCount: ledger.count, evidence: ['Stream opened before bounded history.', 'History IDs e1, e1, e2 deduplicated to e1, e2.'],
      guidance: 'Resume the known session and reconcile events; do not create a replacement task.' });
  }
  const classification = { invalid: 'invalid', auth: 'denied', 'event-error': 'remote-error', 'handler-error': 'handler-error',
    cancel: 'canceled', eof: 'incomplete-stream', disconnect: 'local-disconnect' } as const;
  return lab28ResultSchema.parse({ ...common, classification: classification[input.scenario], remoteStopped: input.scenario === 'cancel' ? null : null,
    cleanup: input.scenario === 'cancel' || input.scenario === 'disconnect' ? 'pending' : 'not-needed',
    evidence: [input.scenario === 'disconnect' ? 'Browser stream closed; remote session status was not observed.' : `Authored ${input.scenario} fault observed.`],
    guidance: input.scenario === 'disconnect' ? 'Reconnect a known session and inspect status/history before interpreting remote outcome.'
      : 'No side-effecting operation is retried automatically.' });
}
