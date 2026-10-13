import { setTimeout as delay } from 'node:timers/promises';
import Anthropic from '@anthropic-ai/sdk';
import { lab01ResultSchema } from '../../shared/lab01-events.js';
import type { Lab01Frame, Lab01Outcome, Lab01Result, Lab01Session } from '../../shared/lab01-events.js';
import { managedErrorMessage } from './managed-config.js';
import type { Lab01Port } from './lab01-port.js';
import { createEventConsumer } from './session-events.js';
import type { FrameInput } from './session-events.js';

/** Safe to show: the message is authored here, never copied from a provider error. */
export class LabError extends Error {}
export function raceAbort<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) { work.catch(() => {}); reject(signal.reason); return; }
    const onAbort = () => { work.catch(() => {}); reject(signal.reason); };
    signal.addEventListener('abort', onAbort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

export interface Lab01RunOptions {
  mode: 'scripted' | 'live'; prompt: string; port: Lab01Port; signal: AbortSignal;
  deadlineMs: number; cleanupWaitMs?: number; emit: (frame: Lab01Frame) => void;
}

export async function runLab01(options: Lab01RunOptions): Promise<Lab01Result> {
  const { port, mode, prompt } = options;
  const consumer = createEventConsumer();
  let seq = 0;
  const emit = (frame: FrameInput) => options.emit({ ...frame, seq: ++seq } as Lab01Frame);
  // `local` ends our own waiting; `upstream` closes the provider stream, and only after interrupt was attempted.
  const local = new AbortController();
  const upstream = new AbortController();
  let cause: 'cancelled' | 'deadline' | null = null;
  const stop = (reason: 'cancelled' | 'deadline') => { cause ??= reason; local.abort(reason); };
  const onExternalAbort = () => stop('cancelled');
  options.signal.addEventListener('abort', onExternalAbort, { once: true });
  if (options.signal.aborted) onExternalAbort();
  const timer = setTimeout(() => stop('deadline'), options.deadlineMs);
  let promptSent = false;
  let sessionId: string | null = null, session: Lab01Session | null = null, failure: string | null = null;
  try {
    if (!prompt.trim()) throw new LabError('Enter a prompt.');
    // create() is deliberately not abortable: the returned ID is needed to interrupt and clean up.
    session = await port.create(); sessionId = session.id;
    emit({ kind: 'session', session });
    if (session.toolCount > 0 || session.mcpServerCount > 0)
      throw new LabError('The configured agent has tools or MCP servers, skills or orchestration. This lesson needs a text-only agent; no prompt was sent.');
    local.signal.throwIfAborted();
    const events = await raceAbort(port.open(sessionId, upstream.signal), local.signal);
    emit({ kind: 'notice', text: 'Event stream established with event_deltas=agent.message. Sending user.message next.' });
    // Set before the call: a request that is aborted in flight may still have been delivered.
    promptSent = true;
    await port.send(sessionId, prompt, local.signal);
    emit({ kind: 'notice', text: 'user.message accepted. Reading events until the turn ends.' });
    const iterator = events[Symbol.asyncIterator]();
    for (;;) {
      const next = await raceAbort(iterator.next(), local.signal);
      if (next.done) break;
      const { frames, done } = consumer.push(next.value);
      for (const frame of frames) emit(frame);
      if (done) break;
    }
  } catch (error) {
    if (!local.signal.aborted) failure = error instanceof LabError ? error.message : `${managedErrorMessage(error)}${error instanceof Anthropic.APIError ? ` (provider HTTP ${error.status ?? 'n/a'})` : ` (${error instanceof Error ? error.name : 'unknown error'} before any provider response)`}`;
  } finally {
    clearTimeout(timer);
    options.signal.removeEventListener('abort', onExternalAbort);
  }

  const provider = consumer.finish();
  let outcome: Lab01Outcome = provider;
  if (cause && (provider.kind === 'completed' || provider.kind === 'incomplete')) {
    // A turn that ended after we stopped is not reported as a clean completion.
    outcome = cause === 'deadline'
      ? { kind: 'deadline', stopReason: null, detail: 'The local deadline expired before the turn was confirmed finished.' }
      : { kind: 'cancelled', stopReason: null, detail: 'Cancelled locally before the turn was confirmed finished.' };
  } else if (failure && provider.kind === 'incomplete') outcome = { kind: 'error', stopReason: null, detail: failure };

  // Cleanup uses fresh bounded requests: the aborted run signal must never cancel them.
  const simulated = port.source === 'authored-fixture';
  // Nothing to interrupt if no prompt ever left this process.
  const needsInterrupt = promptSent && outcome.kind !== 'completed' && outcome.kind !== 'paused';
  let interruption: Lab01Result['interruption'] = needsInterrupt ? 'not-attempted' : 'not-needed';
  let cleanup: Lab01Result['cleanup'] = 'not-needed';
  try {
    if (sessionId) {
      let interrupted = false;
      if (needsInterrupt) {
        try { await port.interrupt(sessionId); interrupted = true; } catch { /* Reported as unconfirmed below. */ }
        emit({ kind: 'notice', text: interrupted ? 'user.interrupt accepted for this session.' : 'user.interrupt could not be sent.' });
      }
      upstream.abort('closed');
      const until = Date.now() + (options.cleanupWaitMs ?? 10_000);
      let settled = false, stopped = false;
      try {
        for (;;) {
          const status = await port.status(sessionId);
          if (status === 'idle' || status === 'terminated') { stopped = true; settled = status === 'idle'; break; }
          if (Date.now() >= until) break;
          await delay(250);
        }
      } catch { /* Status unknown. */ }
      if (needsInterrupt) interruption = simulated ? 'simulated' : interrupted && stopped ? 'confirmed' : 'unconfirmed';
      if (settled) {
        try { await port.archive(sessionId); cleanup = simulated ? 'simulated' : 'archived'; } catch { cleanup = 'pending'; }
      } else cleanup = 'pending';
    }
  } finally { upstream.abort('closed'); }

  const notes: string[] = [outcome.detail];
  if (interruption === 'unconfirmed') notes.push('Remote interruption is unconfirmed: aborting the local connection does not stop remote work. Check the session in Claude Console.');
  if (interruption === 'simulated') notes.push('Interrupt was simulated by the authored fixture.');
  if (cleanup === 'pending' && sessionId && !simulated) notes.push(`Cleanup pending for ${sessionId}.`);
  const snapshot = consumer.snapshot();
  return lab01ResultSchema.parse({ mode, source: port.source, sessionId, session, outcome,
    ...snapshot, interruption, cleanup, message: notes.join(' ').slice(0, 600) });
}
