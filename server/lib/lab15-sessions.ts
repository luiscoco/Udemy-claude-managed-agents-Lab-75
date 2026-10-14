import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { lab15RequestSchema, lab15SnapshotSchema } from '../../shared/lab15-usage.js';
import type { Lab15Input, Lab15Snapshot } from '../../shared/lab15-usage.js';
import { createLab15Ledger, normalizeLab15Usage, parseUsdCents } from './lab15-accounting.js';
import { createFixtureLab15Port, createLiveLab15Port } from './lab15-port.js';
import type { Lab15Port } from './lab15-port.js';
import { createEventConsumer } from './session-events.js';
import { raceAbort } from './lab01-run.js';
import { managedSettings } from './managed-config.js';

export class Lab15Error extends Error { constructor(public status: number, message: string) { super(message); } }
type Entry = { owner: string; input: Lab15Input; port: Lab15Port; report: Lab15Snapshot; ledger: ReturnType<typeof createLab15Ledger>;
  controller: AbortController | null; work: Promise<Lab15Snapshot> | null; closing: boolean; expiresAt: number };
export class Lab15Sessions {
  private entries = new Map<string, Entry>(); private closed = false;
  constructor(private factory: (input: Lab15Input) => Lab15Port = input => input.mode === 'live' ? createLiveLab15Port(input) : createFixtureLab15Port(input), private env = process.env) {}
  private get(id: string, owner: string) {
    const e = this.entries.get(id); if (!e || e.owner !== owner) throw new Lab15Error(404, 'Unknown or unowned experiment.');
    return e;
  }
  private snapshot(e: Entry) { Object.assign(e.report, e.ledger.snapshot()); return lab15SnapshotSchema.parse(e.report); }
  prepare(owner: string, raw: unknown) {
    const input = lab15RequestSchema.parse(raw), settings = managedSettings(this.env);
    if (input.deadlineSeconds * 1000 > settings.deadlineMs) throw new Lab15Error(400, 'Deadline exceeds server policy.');
    // Expired remote sessions are cleaned up, not silently forgotten or replaced.
    for (const e of this.entries.values()) if (e.expiresAt < Date.now() && !e.work && !['closed', 'cleanup-pending'].includes(e.report.state)) void this.end(e.report.runId, e.owner);
    for (const [id, e] of this.entries) if (e.report.state === 'closed') this.entries.delete(id);
    if (this.closed || this.entries.size >= settings.maxConcurrent || [...this.entries.values()].some(e => e.owner === owner)) throw new Lab15Error(429, 'Close the previous experiment or reconcile pending cleanup before another session.');
    const port = this.factory(input), runId = randomUUID();
    const report: Lab15Snapshot = { runId, source: port.source, sessionId: null, state: 'prepared', model: null, budgetCents: input.budgetCents,
      maxTurns: input.maxTurns, turnsUsed: 0, maxMessages: input.maxMessages, messagesUsed: 0, contextsUsed: 0, toolCallsAllowed: 0, budgetRaisesUsed: 0,
      outcome: null, response: '', readings: [], history: [], duplicateEvents: 0, staleSnapshots: 0, threadsNote: 'No usage retrieved yet.', interruption: 'not-needed', cleanup: 'not-needed',
      message: 'Prepared locally. Sending creates one budgeted session; no provider calls have occurred.' };
    const entry: Entry = { owner, input, port, report, ledger: createLab15Ledger(), controller: null, work: null, closing: false, expiresAt: Date.now() + 900000 };
    this.entries.set(runId, entry); return this.snapshot(entry);
  }
  private assertIdle(e: Entry, allowPrepared = false, allowPaused = false) {
    if (e.closing || e.work || e.expiresAt < Date.now() || !(e.report.state === 'idle' || allowPrepared && e.report.state === 'prepared' || allowPaused && e.report.state === 'budget-paused')) throw new Lab15Error(409, 'Operation requires an owned, unexpired idle experiment; close uncertain work first.');
  }
  private async refresh(e: Entry) {
    if (!e.report.sessionId) return;
    const read = await e.port.read(e.report.sessionId), asOf = new Date().toISOString();
    e.ledger.replace({ scope: 'session', identity: e.report.sessionId, via: 'retrieval', asOf, metrics: normalizeLab15Usage(read.usage), agentName: null });
    for (const thread of read.threads.slice(0, 8)) e.ledger.replace({ scope: 'thread', identity: thread.id.slice(0, 200), via: 'retrieval', asOf,
      metrics: normalizeLab15Usage(thread.usage), agentName: thread.agentName.slice(0, 100) });
    e.report.threadsNote = read.threadsNote.slice(0, 300);
    if (parseUsdCents(read.budget) !== e.report.budgetCents) throw new Error('Budget changed externally or is unavailable.');
  }
  private async cleanup(e: Entry, interrupt: boolean) {
    if (!e.report.sessionId) {
      const unknown = e.port.creation === 'uncertain' || e.port.creation === 'confirmed';
      e.report.state = unknown ? 'cleanup-pending' : 'closed'; e.report.cleanup = unknown ? 'pending' : 'not-needed'; return;
    }
    const id = e.report.sessionId; let stopped = false;
    if (interrupt) { try { await e.port.interrupt(id); } catch { /* Still confirm status independently. */ } }
    try {
      for (let attempt = 0; attempt < 3; attempt++) { const status = await e.port.status(id); if (status === 'idle') { stopped = true; break; }
        if (!interrupt && attempt === 0) { try { await e.port.interrupt(id); interrupt = true; } catch { /* Unknown remains pending. */ } }
        await delay(100);
      }
      if (stopped) { await e.port.archive(id); e.report.cleanup = e.port.source === 'managed-api' ? 'archived' : 'simulated'; e.report.state = 'closed'; }
      else { e.report.cleanup = 'pending'; e.report.state = 'cleanup-pending'; }
    } catch { e.report.cleanup = 'pending'; e.report.state = 'cleanup-pending'; }
    if (interrupt) e.report.interruption = e.port.source === 'authored-fixture' ? 'simulated' : stopped ? 'confirmed' : 'unconfirmed';
  }
  execute(id: string, owner: string, operation: { type: 'send'; prompt: string } | { type: 'raise'; cents: number }, signal: AbortSignal, emit: (snapshot: Lab15Snapshot) => void) {
    const e = this.get(id, owner); this.assertIdle(e, operation.type === 'send', operation.type === 'raise');
    if (e.report.turnsUsed >= e.report.maxTurns) throw new Lab15Error(409, 'Local turn limit reached. No work-starting request was sent.');
    if (operation.type === 'send' && (e.report.state === 'budget-paused' || e.report.messagesUsed >= e.report.maxMessages)) throw new Lab15Error(409, 'Local message limit or session budget blocks another message.');
    if (operation.type === 'raise' && (e.report.state !== 'budget-paused' || !e.report.sessionId || e.report.budgetRaisesUsed >= 1 || operation.cents <= e.report.budgetCents)) throw new Lab15Error(409, 'One explicit budget raise is allowed only for an originally budgeted paused session. Removal and adding a late budget are disabled.');
    const controller = new AbortController(), upstream = new AbortController(); e.controller = controller;
    const onAbort = () => controller.abort(signal.reason); signal.addEventListener('abort', onAbort, { once: true }); if (signal.aborted) onAbort();
    const timer = setTimeout(() => controller.abort('deadline'), e.input.deadlineSeconds * 1000);
    e.report.state = 'running'; e.expiresAt = Date.now() + 900000; e.report.response = ''; e.report.outcome = null;
    const consumer = createEventConsumer(); let mayHaveStarted = false;
    const work = (async () => {
      try {
        if (e.report.sessionId && operation.type === 'send') {
          await this.refresh(e);
          if (await e.port.status(e.report.sessionId) !== 'idle') throw new Error('Remote idle not confirmed before sending.');
        }
        if (!e.report.sessionId) { const session = await e.port.create(); e.report.sessionId = session.id; e.report.model = session.model;
          if (!session.verified) throw new Error('Resolved session configuration mismatch.'); }
        controller.signal.throwIfAborted();
        if (e.closing) throw new Error('Experiment closing.');
        if (operation.type === 'raise') {
          await this.refresh(e);
          const metrics = e.report.sessionId && e.ledger.snapshot().readings.find(row => row.scope === 'session' && row.via === 'retrieval')?.metrics;
          if (!metrics || metrics.listCostCents === null || operation.cents <= metrics.listCostCents) throw new Lab15Error(409, 'New cap must exceed known consumed list cost; unknown cost cannot be used to authorize a raise.');
        }
        const events = await raceAbort(e.port.open(e.report.sessionId, upstream.signal), controller.signal);
        controller.signal.throwIfAborted();
        // Reserve host limits before a potentially accepted request; uncertain sends are never replayed.
        e.report.turnsUsed++; mayHaveStarted = true; let marker: string | undefined;
        if (operation.type === 'send') { e.report.messagesUsed++; marker = await e.port.send(e.report.sessionId, operation.prompt, controller.signal); }
        else { e.report.budgetRaisesUsed++; await e.port.raise(e.report.sessionId, operation.cents, controller.signal); e.report.budgetCents = operation.cents; }
        emit(this.snapshot(e));
        let correlated = false, observed = 0; const publicIds = new Set<string>(); const iterator = events[Symbol.asyncIterator]();
        for (;;) {
          const next = await raceAbort(iterator.next(), controller.signal); if (next.done) break;
          let event = next.value; if (++observed > 500) throw new Error('Turn event limit reached.');
          if (!correlated) correlated = operation.type === 'send' ? event.type === 'user.message' && event.id === marker
            : event.type === 'session.updated' && parseUsdCents(event.budget?.max_list_cost) === operation.cents;
          if (!correlated) continue;
          e.ledger.event(event, e.report.sessionId);
          if (event.type === 'agent.tool_use' || event.type === 'agent.custom_tool_use' || event.type === 'agent.mcp_tool_use') throw new Error('Zero-tool host policy violated. No tool handler was invoked.');
          if (event.type === 'agent.thinking' || event.type === 'event_delta' || event.type === 'event_start') continue;
          if (event.type === 'agent.message') {
            if (publicIds.has(event.id)) continue;
            publicIds.add(event.id);
            const remaining = 8000 - e.report.response.length;
            const text = event.content.flatMap(block => block.type === 'text' ? [block.text] : []).join('\n').slice(0, Math.min(2000, remaining));
            event = { ...event, content: [{ type: 'text', text }] }; e.report.response = (e.report.response + text + '\n').slice(0, 8000);
          }
          if (event.type === 'session.error') event = { ...event, error: { ...event.error, message: 'Provider reported a session error; inspect Console.' } };
          const result = consumer.push(event);
          if (event.type === 'session.usage') emit(this.snapshot(e));
          if (result.done) break;
        }
        e.report.outcome = consumer.finish(); upstream.abort();
        if (!['completed', 'paused'].includes(e.report.outcome.kind) || e.report.outcome.kind === 'paused' && e.report.outcome.stopReason !== 'budget_reached') throw new Error('Turn did not reach a reusable idle state.');
        if (await e.port.status(e.report.sessionId) !== 'idle') throw new Error('Remote idle not confirmed.');
        await this.refresh(e);
        e.report.state = e.report.outcome.stopReason === 'budget_reached' ? 'budget-paused' : 'idle'; e.report.cleanup = 'retained';
        e.report.message = e.report.state === 'budget-paused' ? 'Paused at the platform budget. Usage reads do not resume work. Raising the cap is a separate explicit action.' : 'Idle session retained. Retrieved totals replace earlier retrieved totals; scopes are not summed.';
      } catch (error) {
        upstream.abort();
        if (!e.report.outcome || controller.signal.aborted) e.report.outcome = { kind: controller.signal.aborted ? controller.signal.reason === 'deadline' ? 'deadline' : 'cancelled' : 'error', stopReason: null,
          detail: error instanceof Lab15Error ? error.message : controller.signal.aborted ? 'Local waiting stopped; remote cleanup is handled separately.' : 'Operation failed or is uncertain; inspect the session before retrying.' };
        await this.cleanup(e, mayHaveStarted);
        e.report.message = e.report.state === 'cleanup-pending' ? 'Cleanup or creation is uncertain. Capacity remains reserved; inspect Claude Console.' : 'Experiment stopped and known remote work was reconciled.';
      } finally { clearTimeout(timer); signal.removeEventListener('abort', onAbort); upstream.abort(); e.controller = null; }
      return this.snapshot(e);
    })();
    e.work = work;
    return work.finally(() => { e.work = null; });
  }
  async usage(id: string, owner: string) { const e = this.get(id, owner); this.assertIdle(e, false, true);
    const work = (async () => { try { await this.refresh(e); } catch { e.report.state = 'cleanup-pending'; e.report.cleanup = 'pending'; e.report.message = 'Usage refresh unavailable or budget configuration changed. Close and reconcile before sending; no work resumed.'; } return this.snapshot(e); })();
    e.work = work; try { return await work; } finally { e.work = null; }
  }
  async context(id: string, owner: string, text: string) {
    const e = this.get(id, owner); this.assertIdle(e); if (e.report.contextsUsed >= 1 || !e.report.sessionId) throw new Lab15Error(409, 'One context message is allowed on an established idle session.');
    e.report.contextsUsed++;
    const work = (async () => { try { if (await e.port.status(e.report.sessionId!) !== 'idle') throw new Error('Not idle');
      await this.refresh(e);
      await e.port.context(e.report.sessionId!, text, AbortSignal.timeout(5000)); e.report.message = 'One explicit system context message accepted. No user turn or budget update was sent.';
    } catch { await this.cleanup(e, true); e.report.message = 'Context submission failed or is uncertain; no automatic replay.'; } return this.snapshot(e); })();
    e.work = work; try { return await work; } finally { e.work = null; }
  }
  async end(id: string, owner: string) {
    const e = this.get(id, owner); e.closing = true; e.controller?.abort('close'); if (e.work) await e.work.catch(() => {});
    if (e.report.state !== 'closed') { await this.cleanup(e, e.report.state === 'running'); e.report.message = this.snapshot(e).state === 'closed' ? 'Idle session archived; experiment closed.' : 'Remote cleanup is pending. Local abort does not prove a remote stop.'; }
    return this.snapshot(e);
  }
  async close() { this.closed = true; await Promise.allSettled([...this.entries.values()].map(e => this.end(e.report.runId, e.owner))); }
}
