import { setTimeout as delay } from 'node:timers/promises';
import { foundationPrompt, managedResultSchema, verifyFoundation } from '../../shared/managed.js';
import type { ManagedProgress, ManagedResult } from '../../shared/managed.js';
import type { ManagedPort } from './managed-port.js';
import { managedErrorMessage } from './managed-config.js';

export const fixtureOutput = 'MANAGED_AGENTS_READY\nAgent defines the model, instructions and tools.\nEnvironment defines where work runs.\nSession is a running agent instance.\nEvent carries a message or status update.';
export async function runFoundation(mode: 'scripted' | 'live', port: ManagedPort | undefined,
  signal: AbortSignal, emit: (event: ManagedProgress) => void, cleanupWaitMs = 10000): Promise<ManagedResult> {
  const result: ManagedResult = { mode, source: mode === 'live' ? 'managed-api' : 'authored-fixture',
    status: 'failed', output: '', verified: false, sessionId: null, stopReason: null,
    usage: null, cleanup: 'not-needed', message: '' };
  let events: AsyncIterable<import('./managed-port.js').RemoteEvent> | undefined;
  const streamController = new AbortController();
  const abortStream = () => streamController.abort(signal.reason);
  signal.addEventListener('abort', abortStream, { once: true });
  if (signal.aborted) abortStream();
  try {
    signal.throwIfAborted();
    if (mode === 'scripted') {
      for (const type of ['session.created', 'session.status_running', 'agent.message', 'session.status_idle']) {
        await delay(120, undefined, { signal });
        emit({ source: 'authored-fixture', type, text: type === 'agent.message' ? fixtureOutput : '', sessionId: null });
      }
      result.output = fixtureOutput; result.status = 'succeeded'; result.stopReason = 'end_turn';
      result.message = 'Authored fixture completed; no API calls, tokens or charges.';
    } else {
      if (!port) throw new Error('No managed port');
      result.sessionId = await port.create();
      result.cleanup = 'pending';
      emit({ source: 'managed-api', type: 'session.created', text: '', sessionId: result.sessionId });
      signal.throwIfAborted();
      // Open the upstream stream before sending work; otherwise early events can be lost.
      events = await port.stream(result.sessionId, streamController.signal);
      await port.send(result.sessionId, foundationPrompt, streamController.signal);
      let count = 0, stopped = false;
      for await (const event of events) {
        signal.throwIfAborted();
        if (++count > 500) throw new Error('Event limit');
        const text = (event.text ?? '').slice(0, 16000);
        emit({ source: 'managed-api', type: event.type.slice(0, 100), text, sessionId: result.sessionId });
        if (event.type === 'agent.message') {
          result.output += text + '\n';
          if (result.output.length > 32000) { result.output = result.output.slice(0, 32000); throw new Error('Output limit'); }
        }
        if (event.type.startsWith('workflow_run.')) throw new Error('Workflow runs are outside this foundation check');
        if (event.type === 'session.error' || event.type === 'session.status_terminated') throw new Error('Remote session failed');
        if (event.type === 'session.status_idle') {
          result.stopReason = event.stopReason ?? 'unknown';
          result.status = result.stopReason === 'end_turn' ? 'succeeded' : 'paused';
          stopped = true; break;
        }
      }
      if (!stopped) throw new Error('Stream ended before idle');
      result.message = result.status === 'paused' ? `Session paused: ${result.stopReason}.` : 'Managed turn completed.';
    }
    result.verified = result.status === 'succeeded' && verifyFoundation(result.output);
    if (result.status === 'succeeded' && !result.verified) {
      result.status = 'failed'; result.message = 'Output did not satisfy the foundation check.';
    }
  } catch (error) {
    result.status = signal.aborted ? 'cancelled' : 'failed';
    result.message = signal.aborted ? 'Cancellation requested.' : managedErrorMessage(error);
  } finally {
    signal.removeEventListener('abort', abortStream);
    if (result.sessionId && port) {
      // Independent, bounded requests: an aborted browser signal must not abort cleanup.
      try {
        if (!['succeeded', 'paused'].includes(result.status)) await port.interrupt(result.sessionId);
        const deadline = Date.now() + cleanupWaitMs;
        let inspected = await port.inspect(result.sessionId);
        while (inspected.status !== 'idle' && inspected.status !== 'terminated' && Date.now() < deadline) {
          await delay(Math.min(250, Math.max(1, deadline - Date.now())));
          inspected = await port.inspect(result.sessionId);
        }
        result.usage = inspected.usage;
        if (inspected.status === 'idle') { await port.archive(result.sessionId); result.cleanup = 'archived'; }
      } catch { /* Keep session ID and pending status for manual recovery. */ }
      if (result.cleanup === 'pending') {
        result.message += ' Remote cleanup is unconfirmed; inspect the session in Claude Console.';
        console.warn(`Managed session cleanup pending: ${result.sessionId}`);
      }
    }
    streamController.abort();
  }
  return managedResultSchema.parse(result);
}
