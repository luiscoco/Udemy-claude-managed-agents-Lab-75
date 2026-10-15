import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { lab36SnapshotSchema } from '../../shared/lab36-process-spawning.js';
import type { Lab36Run } from '../../shared/lab36-process-spawning.js';

export class Lab36Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
export interface Lab36Port { create(): Promise<string>; events(id: string): AsyncIterable<string>; interrupt(id: string): Promise<boolean>;
  archive(id: string): Promise<boolean>; lifecycle(): string[]; close(): Promise<void> }
const workerPath = fileURLToPath(new URL('../../mcp-servers/lab36-worker.mjs', import.meta.url));
export async function createLoopbackLab36Port(scenario: Lab36Run['scenario']): Promise<Lab36Port> {
  const lifecycle: string[] = []; const token = randomUUID(), sessionId = `sesn_${randomUUID().replaceAll('-', '')}`;
  let server: Server | undefined;
  if (scenario !== 'connection-failure') {
    server = createServer((request, response) => {
      if (request.headers['x-fixture-token'] !== token) { response.writeHead(403).end(); return; }
      response.setHeader('Content-Type', 'application/x-ndjson');
      if (request.url === '/sessions' && request.method === 'POST') {
        lifecycle.push('created'); response.end(JSON.stringify({ sessionId })); return;
      }
      if (request.url === `/sessions/${sessionId}/events` && request.method === 'GET') {
        lifecycle.push('stream-open');
        if (scenario === 'cancel-pending-cleanup') { response.write(`${JSON.stringify({ id: 'sevt_1', type: 'agent.message' })}\n`);
          lifecycle.push('stream-pending'); response.on('close', () => lifecycle.push('browser-stream-closed'));
          const timer = setTimeout(() => response.end(), 5000); timer.unref?.(); return; }
        const events = scenario === 'early-stream-close' ? [{ id: 'sevt_1', type: 'agent.message' }] :
          [{ id: 'sevt_1', type: 'agent.message' }, { id: 'sevt_2', type: 'session.idle' }, { id: 'sevt_3', type: 'turn.completed' }];
        for (const event of events) response.write(`${JSON.stringify(event)}\n`);
        response.end(); lifecycle.push(scenario === 'early-stream-close' ? 'stream-closed-early' : 'stream-complete'); return;
      }
      if (request.url === `/sessions/${sessionId}/interrupt` && request.method === 'POST') {
        lifecycle.push('interrupt-requested'); response.end(JSON.stringify({ idleConfirmed: scenario !== 'cancel-pending-cleanup' })); return;
      }
      if (request.url === `/sessions/${sessionId}/archive` && request.method === 'POST') {
        lifecycle.push('archive-requested'); response.end(JSON.stringify({ archived: true })); return;
      }
      response.writeHead(404).end();
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
  }
  const address = server?.address(); const base = address && typeof address !== 'string' ? `http://127.0.0.1:${address.port}` : null;
  const call = async (method: string, path: string) => { if (!base) throw new Lab36Error(502, 'Loopback connection unavailable.');
    const response = await fetch(`${base}${path}`, { method, headers: { 'X-Fixture-Token': token }, signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Lab36Error(502, 'Loopback protocol request failed.'); return response; };
  return { async create() { const response = await call('POST', '/sessions'); const value = await response.json() as { sessionId: string };
      if (value.sessionId !== sessionId) throw new Lab36Error(502, 'Session correlation failed.'); return value.sessionId; },
    async *events(id) { const response = await call('GET', `/sessions/${id}/events`); const reader = response.body?.getReader();
      if (!reader) throw new Lab36Error(502, 'Missing event stream.'); let buffer = '', bytes = 0;
      try { for (;;) { const part = await reader.read(); if (part.done) break; bytes += part.value.length;
          if (bytes > 16_384) throw new Lab36Error(502, 'Event stream exceeded bound.');
          buffer += new TextDecoder().decode(part.value, { stream: true });
          for (;;) { const at = buffer.indexOf('\n'); if (at < 0) break;
            const line = buffer.slice(0, at); buffer = buffer.slice(at + 1); yield line; }
        } if (buffer.trim()) throw new Lab36Error(502, 'Partial event at stream end.'); }
      finally { await reader.cancel().catch(() => {}); } },
    async interrupt(id) { const response = await call('POST', `/sessions/${id}/interrupt`);
      return Boolean((await response.json() as { idleConfirmed?: boolean }).idleConfirmed); },
    async archive(id) { const response = await call('POST', `/sessions/${id}/archive`);
      return Boolean((await response.json() as { archived?: boolean }).archived); },
    lifecycle: () => [...lifecycle], async close() { if (server) await new Promise<void>(resolve => server.close(() => resolve())); } };
}
export function consumeLab36Events(lines: readonly string[]) {
  if (lines.length > 4) throw new Lab36Error(429, 'Event queue exceeded the host bound.');
  return lines.map(line => { const value = JSON.parse(line) as { id?: unknown; type?: unknown };
    if (typeof value.id !== 'string' || !/^sevt_/.test(value.id) || typeof value.type !== 'string') throw new Lab36Error(502, 'Invalid event.');
    return value; });
}
export class Lab36Runner {
  private entries = new Map<string, { owner: string; snapshot: ReturnType<typeof lab36SnapshotSchema.parse> }>(); private closed = false;
  constructor(private factory = createLoopbackLab36Port) {}
  async run(owner: string, input: Lab36Run) {
    if (input.mode === 'live') throw new Lab36Error(422, 'Live transport requires a configured Managed agent and opt-in.');
    if (this.closed || this.entries.size >= 16) throw new Lab36Error(429, 'Host runner capacity reached.');
    const runId = randomUUID(); let sessionId: string | null = null; let outcome: 'completed' | 'connection-error' | 'incomplete' | 'worker-error' | 'canceled' = 'incomplete';
    let eventCount = 0, queuePeak = 0, localAbort = false, remoteStopConfirmed = false;
    let cleanup: 'not-needed' | 'confirmed' | 'pending' = 'not-needed';
    const worker = { started: false, exitCount: 0, killed: false, stderrRedacted: false };
    const port = await this.factory(input.scenario);
    try {
      try { sessionId = await port.create(); } catch { outcome = 'connection-error'; cleanup = 'not-needed'; }
      if (sessionId) {
        const pending: string[] = [];
        for await (const line of port.events(sessionId)) { pending.push(line); queuePeak = Math.max(queuePeak, pending.length);
          const events = consumeLab36Events(pending); eventCount += events.length; pending.length = 0;
          if (input.scenario === 'cancel-pending-cleanup') break; }
        if (input.scenario === 'cancel-pending-cleanup') {
          localAbort = true; outcome = 'canceled'; remoteStopConfirmed = await port.interrupt(sessionId);
          cleanup = remoteStopConfirmed && await port.archive(sessionId) ? 'confirmed' : 'pending';
        } else if (input.scenario === 'early-stream-close' || eventCount < 3) {
          outcome = 'incomplete'; remoteStopConfirmed = await port.interrupt(sessionId);
          cleanup = remoteStopConfirmed && await port.archive(sessionId) ? 'confirmed' : 'pending';
        } else if (input.scenario === 'handler-worker-failure') {
          worker.started = true; const child = spawn(process.execPath, [workerPath], { windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'],
            env: { SystemRoot: process.env.SystemRoot ?? '', PATH: process.env.PATH ?? '', TEMP: process.env.TEMP ?? '' } });
          child.stderr.on('data', () => { worker.stderrRedacted = true; });
          child.stdout.on('data', () => {}); child.stdin.end(`${JSON.stringify({ op: 'format-note', requestId: runId })}\n`);
          await once(child, 'exit'); worker.exitCount = 1;
          outcome = 'worker-error'; remoteStopConfirmed = await port.interrupt(sessionId);
          cleanup = remoteStopConfirmed && await port.archive(sessionId) ? 'confirmed' : 'pending';
        } else { outcome = 'completed'; cleanup = await port.archive(sessionId) ? 'confirmed' : 'pending'; remoteStopConfirmed = cleanup === 'confirmed'; }
      }
    } finally { await port.close(); }
    const snapshot = lab36SnapshotSchema.parse({ source: 'loopback-emulator', runId, scenario: input.scenario, outcome,
      sessionId, hostRequest: 'POST /sessions; GET /sessions/{id}/events', remoteLifecycle: port.lifecycle(),
      eventCount, queuePeak, worker, localAbort, remoteStopConfirmed, cleanup, providerCalls: 0,
      note: 'Loopback transport is not a production remote sandbox. Killing a host worker alone does not prove remote stop.' });
    this.entries.set(runId, { owner, snapshot }); return snapshot;
  }
  state(owner: string) { return [...this.entries.values()].filter(item => item.owner === owner).map(item => item.snapshot); }
  reset(owner: string, runId: string) { const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab36Error(404, 'Unknown or unowned host run.'); this.entries.delete(runId); return { deleted: true }; }
  close() { this.closed = true; this.entries.clear(); }
}
