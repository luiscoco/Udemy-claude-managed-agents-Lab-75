import { randomUUID } from 'node:crypto';
import { fixtureWait, type FixtureWait } from './scripted-adapter.js';
import { browserEventSchema, evidenceSchema, runSnapshotSchema } from '../../shared/contracts.js';
import type { EventInput, RunRequest, RunSnapshot, TerminalOutcome } from '../../shared/contracts.js';
import type { BrowserEvent } from '../../shared/contracts.js';
import type { QueryPort } from './query-port.js';
import { checkScriptedPolicy, scriptedPolicy } from './policy.js';

type Session = { snapshot: RunSnapshot; controller: AbortController; expiresAt: number; done: Promise<void> };
export class RunStore {
  private readonly sessions = new Map<string, Session>();
  private readonly tasks = new Set<Promise<void>>();
  private readonly streams = new Set<AbortController>();
  private closed = false;
  constructor(private readonly port: QueryPort, private readonly now = Date.now,
    private readonly policy: typeof scriptedPolicy = scriptedPolicy, private readonly wait: FixtureWait = fixtureWait,
    private readonly effect: { verify: (input: RunRequest, output: string) => boolean; result: (input: RunRequest, output: string) => Record<string, unknown> } = { verify: (_input, output) => output.length > 0, result: (_input, output) => ({ output }) }) {}
  private prune() {
    for (const [id, session] of this.sessions) if (session.expiresAt <= this.now()) {
      session.controller.abort('expired'); this.sessions.delete(id);
    }
  }
  start(input: RunRequest): RunSnapshot | null {
    if (checkScriptedPolicy(input)) return null;
    this.prune();
    if (this.closed || this.sessions.size >= this.policy.maxSessions ||
      this.tasks.size + this.streams.size >= this.policy.maxConcurrent) return null;
    const runId = randomUUID();
    const session: Session = { snapshot: { runId, status: 'running', events: [], evidence: [], outcome: null },
      controller: new AbortController(), expiresAt: this.now() + this.policy.ttlMs, done: Promise.resolve() };
    this.sessions.set(runId, session);
    const emit = (event: EventInput) => {
      if (session.snapshot.events.length >= this.policy.maxEvents) throw new Error('Event bound exceeded');
      session.snapshot.events.push(browserEventSchema.parse({ ...event, runId,
        seq: session.snapshot.events.length + 1, timestamp: new Date(this.now()).toISOString() }));
    };
    emit({ type: 'started', payload: { mode: 'scripted' } });
    session.done = (async () => {
      const timer = setTimeout(() => session.controller.abort('deadline'), this.policy.deadlineMs);
      const usage = { modelCalls: 0, billedUsd: 0 } as const;
      let outcome: TerminalOutcome;
      try {
        const output = await this.port.execute(input, session.controller.signal, (event) => {
          session.controller.signal.throwIfAborted();
          if (!['output', 'tool-fixture'].includes(event.type) || session.snapshot.events.length >= this.policy.maxEvents - 1) throw new Error('Invalid adapter event');
          emit(event);
        }, (evidence) => {
          session.controller.signal.throwIfAborted();
          if (session.snapshot.evidence.length >= this.policy.maxEvidence) throw new Error('Evidence bound exceeded');
          session.snapshot.evidence.push(evidenceSchema.parse(evidence));
        });
        session.controller.signal.throwIfAborted();
        if (!this.effect.verify(input, output)) throw new Error('Effect verification failed');
        outcome = { status: 'succeeded', output, result: this.effect.result(input, output), usage };
      } catch {
        outcome = session.controller.signal.aborted
          ? { status: 'cancelled', reason: session.controller.signal.reason as 'user' | 'deadline' | 'expired' | 'shutdown', usage }
          : { status: 'failed', message: 'The fixture could not be completed.', usage };
      } finally { clearTimeout(timer); }
      session.snapshot.status = outcome.status;
      session.snapshot.outcome = outcome;
      emit({ type: 'terminal', payload: outcome });
    })();
    this.tasks.add(session.done);
    void session.done.finally(() => this.tasks.delete(session.done));
    return this.get(runId) ?? null;
  }
  get(id: string): RunSnapshot | undefined {
    this.prune();
    const snapshot = this.sessions.get(id)?.snapshot;
    return snapshot ? runSnapshotSchema.parse(structuredClone(snapshot)) : undefined;
  }
  /** Connection-owned run. Unlike the F02 polling example it retains no replay session. */
  createStream(input: RunRequest, controller: AbortController) {
    if (this.closed || checkScriptedPolicy(input) || this.tasks.size + this.streams.size >= this.policy.maxConcurrent) return null;
    this.streams.add(controller);
    let invoked = false;
    const runId = randomUUID();
    return { runId, execute: async (notify: (event: BrowserEvent) => void): Promise<RunSnapshot> => {
      if (invoked) throw new Error('Stream execution can only be started once');
      invoked = true;
      const snapshot: RunSnapshot = { runId, status: 'running', events: [], evidence: [], outcome: null };
      const emit = (event: EventInput) => {
        controller.signal.throwIfAborted();
        if (snapshot.events.length >= this.policy.maxEvents - 1) throw new Error('Event bound exceeded');
        const parsed = browserEventSchema.parse({ ...event, runId, seq: snapshot.events.length + 1, timestamp: new Date(this.now()).toISOString() });
        snapshot.events.push(parsed); notify(parsed);
      };
      const task = (async () => {
        try {
          emit({ type: 'started', payload: { mode: 'scripted' } });
          for (const [index, text] of ['Request validated.', 'Host limits accepted.', 'Authored fixture selected.'].entries()) {
            await this.wait(100, controller.signal);
            emit({ type: 'progress', payload: { step: index + 1, text } });
          }
          const output = await this.port.execute(input, controller.signal, (event) => {
            if (!['output', 'tool-fixture'].includes(event.type)) throw new Error('Invalid adapter event'); emit(event);
          }, (evidence) => {
            controller.signal.throwIfAborted();
            if (snapshot.evidence.length >= this.policy.maxEvidence) throw new Error('Evidence bound exceeded');
            snapshot.evidence.push(evidenceSchema.parse(evidence));
          });
          controller.signal.throwIfAborted();
          if (!this.effect.verify(input, output)) throw new Error('Effect verification failed');
          snapshot.outcome = { status: 'succeeded', output, result: this.effect.result(input, output), usage: { modelCalls: 0, billedUsd: 0 } };
        } catch {
          snapshot.outcome = controller.signal.aborted
            ? { status: 'cancelled', reason: controller.signal.reason === 'shutdown' ? 'shutdown' : controller.signal.reason === 'deadline' || controller.signal.reason === 'idle' ? 'deadline' : 'user', usage: { modelCalls: 0, billedUsd: 0 } }
            : { status: 'failed', message: 'The fixture could not be completed.', usage: { modelCalls: 0, billedUsd: 0 } };
        }
        snapshot.status = snapshot.outcome.status;
        snapshot.events.push(browserEventSchema.parse({ runId, seq: snapshot.events.length + 1,
          timestamp: new Date(this.now()).toISOString(), type: 'terminal', payload: snapshot.outcome }));
      })();
      // Streams are counted separately while their completion is awaited during shutdown.
      const done = task.finally(() => this.streams.delete(controller));
      this.streamTasks.add(done);
      try { await done; return runSnapshotSchema.parse(snapshot); }
      finally { this.streamTasks.delete(done); }
    } };
  }
  private readonly streamTasks = new Set<Promise<void>>();
  cancel(id: string): boolean {
    this.prune();
    const session = this.sessions.get(id);
    if (!session) return false;
    if (session.snapshot.status === 'running') session.controller.abort('user');
    return true;
  }
  async settle(id: string) { await this.sessions.get(id)?.done; }
  async close() {
    this.closed = true;
    for (const session of this.sessions.values()) session.controller.abort('shutdown');
    for (const controller of this.streams) controller.abort('shutdown');
    await Promise.all([...this.tasks, ...this.streamTasks]);
    this.streams.clear();
    this.sessions.clear();
  }
}
