import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { lab12SnapshotSchema } from '../../shared/lab12-streaming-input.js';
import type { Lab12Command, Lab12Input, Lab12Message, Lab12Snapshot } from '../../shared/lab12-streaming-input.js';
import type { Lab12Port, Lab12Session } from './lab12-port.js';
import { createEventConsumer } from './session-events.js';
import type { StreamEvent } from './session-events.js';
import { raceAbort } from './lab01-run.js';

export class Lab12Error extends Error { constructor(public readonly status: number, message: string) { super(message); } }
type Job = { message: Lab12Message; command: Lab12Command };
type Active = Job & { controller: AbortController; consumer: ReturnType<typeof createEventConsumer>; buffered: StreamEvent[]; correlated: boolean; resolve(): void; reject(error: unknown): void };
export interface Lab12Entry {
  runId: string; owner: string; input: Lab12Input; port: Lab12Port; session: Lab12Session; snapshot: Lab12Snapshot;
  queue: Job[]; active: Active | null; worker: Promise<void> | null; upstream: AbortController; pump: Promise<void>;
  subscribers: Set<(value: Lab12Snapshot) => void>; seen: Set<string>; closing: boolean; control: Promise<void> | null;
  expiresAt: number; payloads: Map<string, string>;
  updating: Promise<void> | null;
}
const timestamp = () => new Date().toISOString();
const encodedBytes = (text: string) => Buffer.byteLength(JSON.stringify(text), 'utf8');
export function boundedLab12Text(text: string, remainingBytes: number) {
  let low = 0; let high = Math.min(16000, text.length);
  while (low < high) { const middle = Math.ceil((low + high) / 2); if (encodedBytes(text.slice(0, middle)) <= remainingBytes) low = middle; else high = middle - 1; }
  return text.slice(0, low);
}
export class Lab12Queues {
  readonly entries = new Map<string, Lab12Entry>();
  private creating = 0; private closed = false;
  private creations = new Set<Promise<void>>();
  constructor(private readonly capacity = 2, private readonly pollMs = 50) {}
  publish(e: Lab12Entry) {
    e.snapshot.revision++;
    e.snapshot.queueDepth = e.queue.length;
    const value = this.readSnapshot(e); for (const callback of e.subscribers) callback(value);
  }
  readSnapshot(e: Lab12Entry): Lab12Snapshot { return lab12SnapshotSchema.parse(e.snapshot); }
  read(id: string, owner: string) {
    const e = this.entries.get(id); if (!e) throw new Lab12Error(404, 'Unknown queue.');
    if (e.owner !== owner) throw new Lab12Error(403, 'Queue belongs to another exercise owner.');
    if (e.expiresAt < Date.now() && e.snapshot.state !== 'closed') { void this.end(e); throw new Lab12Error(409, 'Queue expired; cleanup requested.'); }
    e.expiresAt = Date.now() + 15 * 60_000; return e;
  }
  async create(owner: string, input: Lab12Input, port: Lab12Port, model?: string, effort?: 'low' | 'medium' | 'high') {
    if (this.closed || this.creating + [...this.entries.values()].filter(e => e.snapshot.state !== 'closed').length >= this.capacity) throw new Lab12Error(429, 'Close an existing queue before creating another.');
    this.creating++;
    let created!: () => void; const creation = new Promise<void>(resolve => { created = resolve; }); this.creations.add(creation);
    let session: Lab12Session | undefined;
    let e: Lab12Entry | undefined;
    try {
      session = await port.create(input, model, effort);
      const upstream = new AbortController();
      e = { runId: randomUUID(), owner, input, port, session, upstream, queue: [], active: null, worker: null, updating: null,
        pump: Promise.resolve(), subscribers: new Set(), seen: new Set(), closing: false, control: null, expiresAt: Date.now() + 15 * 60_000, payloads: new Map(),
        snapshot: { runId: '', sessionId: session.id, mode: input.mode, source: port.source, revision: 0, state: 'idle', queueDepth: 0, commands: [],
          model: session.model, effort: session.effort, tools: 'none', mcpServers: 0, contextEventIds: [], handoffFrom: null,
          interruption: 'not-needed', cleanup: 'not-needed', events: [], message: 'One session and one event stream are ready. No user message has been sent.' } };
      e.snapshot.runId = e.runId;
      for (const [id, item] of this.entries) if (this.entries.size >= 20 && item.snapshot.state === 'closed') this.entries.delete(id);
      this.entries.set(e.runId, e);
      if (!session.configurationValid) throw new Lab12Error(422, 'Resolved session differs from requested capabilities, model, effort or base configuration. No message sent.');
      const events = await port.open(session.id, upstream.signal);
      e.pump = this.pump(e, events);
      if (this.closed) await this.end(e);
      return e;
    } catch (error) {
      if (e) { await this.end(e); throw new Lab12Error(422, `Session setup failed. No prompt sent. Checkpoint ${e.runId}; session ${e.session.id}; cleanup ${e.snapshot.cleanup}.`); }
      if (session) await port.archive(session.id).catch(() => {}); throw error;
    } finally { this.creating--; created(); this.creations.delete(creation); }
  }
  private async pump(e: Lab12Entry, events: AsyncIterable<StreamEvent>) {
    try {
      for await (const event of events) {
        if ('id' in event) {
          if (e.seen.has(event.id)) continue;
          if (e.seen.size >= 2000) throw new Error('Session event bound exceeded.');
          e.seen.add(event.id);
          e.snapshot.events = [...e.snapshot.events.slice(-99), { id: event.id, type: event.type, commandId: null }];
        }
        const active = e.active;
        if (active) {
          if (!active.command.userEventId) {
            if (active.buffered.length >= 300) throw new Error('Pre-acceptance event bound exceeded.');
            active.buffered.push(event);
          } else this.consume(e, active, event);
        }
        this.publish(e);
      }
      if (!e.closing) throw new Error('Event stream ended before queue close.');
    } catch (error) {
      if (!e.closing) {
        if (e.active) { e.active.command.state = 'failed'; e.active.command.outcome = 'stream-ended-or-error'; e.active.reject(error); }
        e.snapshot.message = 'Event stream ended or failed; cleanup requested. No automatic reconnect or resubmission.'; void this.end(e);
      }
    }
  }
  private consume(e: Lab12Entry, active: Active, event: StreamEvent) {
    // A returned submission ID must also be observed on this stream before turn evidence is attributed.
    if (!active.correlated) {
      if (event.type !== 'user.message' || event.id !== active.command.userEventId) return;
      active.correlated = true;
    }
    if ('id' in event) { const retained = e.snapshot.events.find(item => item.id === event.id); if (retained) retained.commandId = active.command.commandId; }
    const result = active.consumer.push(event);
    const snapshot = active.consumer.snapshot();
    active.command.agentEventIds = snapshot.messages.map(m => m.eventId).slice(-100);
    const output = snapshot.messages.map(m => m.text).join('\n');
    const alreadyRetained = e.snapshot.commands.filter(command => command !== active.command).reduce((total, command) => total + encodedBytes(command.output), 0);
    active.command.output = boundedLab12Text(output, Math.max(0, 64000 - alreadyRetained)); active.command.outputTruncated = output.length > active.command.output.length;
    if (result.done) active.resolve();
  }
  admit(e: Lab12Entry, messages: Lab12Message[]) {
    if (e.closing || e.control || !['idle', 'running'].includes(e.snapshot.state)) throw new Lab12Error(409, 'Queue is closed, updating or awaiting cleanup.');
    const fresh: Lab12Message[] = []; const batch = new Map<string, string>();
    for (const message of messages) {
      if (e.input.mode === 'live' && message.scenario !== 'normal') throw new Lab12Error(400, 'Authored scenarios are offline only.');
      const payload = JSON.stringify(message); const old = e.payloads.get(message.commandId) ?? batch.get(message.commandId);
      if (old && old !== payload) throw new Lab12Error(409, 'Command ID already used with different input.');
      if (!old) { fresh.push(message); batch.set(message.commandId, payload); }
    }
    if (e.queue.length + (e.active ? 1 : 0) + fresh.length > 3) throw new Lab12Error(429, 'Queue allows one active command and two waiting commands.');
    if (e.snapshot.commands.length + fresh.length > 20) throw new Lab12Error(429, 'Command history limit reached; close this queue.');
    // Reserve the entire script before any asynchronous provider effect.
    for (const message of fresh) {
      e.payloads.set(message.commandId, JSON.stringify(message));
      const command: Lab12Command = { commandId: message.commandId, text: message.text, hasImage: Boolean(message.image), state: 'admitted', userEventId: null,
        agentEventIds: [], output: '', outputTruncated: false, outcome: 'pending', admittedAt: timestamp(), startedAt: null, finishedAt: null };
      e.snapshot.commands.push(command); e.queue.push({ message, command });
    }
    e.snapshot.message = fresh.length ? `${fresh.length} command(s) admitted to the host queue. Admission is not provider acceptance.` : 'Matching command IDs already exist; no new command or provider effect was created.';
    this.publish(e); this.startWorker(e); return this.readSnapshot(e);
  }
  private startWorker(e: Lab12Entry) {
    if (e.worker || e.closing) return;
    e.worker = this.drain(e).finally(() => { e.worker = null; if (e.queue.length && !e.closing) this.startWorker(e); });
  }
  private async drain(e: Lab12Entry) {
    while (e.queue.length && !e.closing) {
      const job = e.queue.shift()!; const controller = new AbortController();
      let resolve!: () => void; let reject!: (error: unknown) => void;
      const done = new Promise<void>((yes, no) => { resolve = yes; reject = no; }); done.catch(() => {});
      const active: Active = { ...job, controller, consumer: createEventConsumer(), buffered: [], correlated: false, resolve, reject };
      e.active = active; e.snapshot.state = 'running'; job.command.state = 'submitting'; job.command.startedAt = timestamp();
      e.snapshot.message = `Processing command ${job.command.commandId}; provider submission is pending.`; this.publish(e);
      const timer = setTimeout(() => controller.abort('deadline'), e.input.deadlineSeconds * 1000);
      try {
        const id = await raceAbort(e.port.send(e.session.id, job.message, controller.signal), controller.signal);
        job.command.userEventId = id; job.command.state = 'accepted';
        e.snapshot.message = `Command ${job.command.commandId} accepted by the provider. Waiting for correlated turn evidence.`;
        for (const event of active.buffered) this.consume(e, active, event); active.buffered = [];
        this.publish(e); await raceAbort(done, controller.signal);
        const outcome = active.consumer.finish(); job.command.outcome = outcome.kind;
        job.command.state = outcome.kind === 'completed' ? 'completed' : 'failed';
        // Serialize by observed lifecycle AND a confirmed remote idle state, not just by message text.
        if (outcome.kind !== 'completed' || await e.port.status(e.session.id) !== 'idle') throw new Error('No reusable completed idle turn.');
      } catch {
        if (!(e.closing && ['failed', 'completed'].includes(job.command.state))) {
          job.command.state = e.closing ? 'cancelled' : 'failed';
          job.command.outcome = e.closing ? 'cancelled' : controller.signal.reason === 'deadline' ? 'deadline' : 'incomplete-or-error';
        }
        if (!e.closing) await this.end(e);
      } finally {
        clearTimeout(timer); job.command.finishedAt = timestamp(); e.active = null;
        if (!e.closing) { e.snapshot.state = 'idle'; e.snapshot.message = `Command ${job.command.commandId}: ${job.command.state} (${job.command.outcome}). ${e.queue.length} waiting command(s).`; }
        this.publish(e);
      }
    }
  }
  async idleUpdate(e: Lab12Entry, action: () => Promise<void>) {
    if (e.closing || e.worker || e.queue.length || e.control || e.snapshot.state !== 'idle') throw new Lab12Error(409, 'Updates require an idle queue with no pending commands.');
    e.snapshot.state = 'updating'; this.publish(e);
    const work = (async () => {
      try { if (await e.port.status(e.session.id) !== 'idle') throw new Lab12Error(409, 'Remote idle was not confirmed.'); await action(); }
      catch (error) { e.updating = null; if (!(error instanceof Lab12Error)) { if (!e.closing) await this.end(e); throw new Lab12Error(502, 'Update failed or is uncertain; cleanup requested.'); } throw error; }
      finally { if (!e.closing) e.snapshot.state = 'idle'; this.publish(e); }
    })();
    e.updating = work; try { await work; } finally { e.updating = null; }
    return this.readSnapshot(e);
  }
  async end(e: Lab12Entry): Promise<void> {
    if (e.snapshot.state === 'closed') return;
    if (e.control) return e.control;
    e.closing = true; e.snapshot.state = 'stopping'; e.active?.controller.abort('cancelled');
    if (e.active && !['completed', 'failed'].includes(e.active.command.state)) { e.active.command.state = 'cancelled'; e.active.command.outcome = 'cancelled'; }
    for (const job of e.queue.splice(0)) { job.command.state = 'cancelled'; job.command.outcome = 'cancelled-before-submission'; job.command.finishedAt = timestamp(); }
    this.publish(e);
    e.control = (async () => {
      if (e.updating) await e.updating.catch(() => {});
      let status = await e.port.status(e.session.id).catch(() => 'unknown');
      if (status !== 'idle') {
        try { await e.port.interrupt(e.session.id); e.snapshot.interruption = 'acknowledged'; } catch { e.snapshot.interruption = 'unconfirmed'; }
        for (let i = 0; i < 5; i++) { status = await e.port.status(e.session.id).catch(() => 'unknown'); if (status === 'idle') break; await delay(this.pollMs); }
        e.snapshot.interruption = status === 'idle' ? 'idle-confirmed' : 'unconfirmed';
      }
      e.upstream.abort();
      if (status === 'idle') {
        try { await e.port.archive(e.session.id); e.snapshot.state = 'closed'; e.snapshot.cleanup = e.port.source === 'authored-fixture' ? 'simulated' : 'archived'; }
        catch { e.snapshot.state = 'cleanup-pending'; e.snapshot.cleanup = 'pending'; }
      } else { e.snapshot.state = 'cleanup-pending'; e.snapshot.cleanup = 'pending'; }
      e.snapshot.message = e.snapshot.state === 'closed' ? 'Queue closed. Waiting work was cancelled and confirmed-idle session archived.' : 'Remote cleanup is pending. Local cancellation does not prove a remote stop.';
      this.publish(e);
    })();
    try { await e.control; } finally { e.control = null; }
  }
  async sweep() { await Promise.allSettled([...this.entries.values()].filter(e => e.expiresAt < Date.now() && e.snapshot.state !== 'closed').map(e => this.end(e))); }
  async close() { this.closed = true; await Promise.allSettled([...this.creations]); await Promise.allSettled([...this.entries.values()].map(e => this.end(e))); }
}
