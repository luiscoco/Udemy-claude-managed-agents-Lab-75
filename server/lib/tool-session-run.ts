import { setTimeout as delay } from 'node:timers/promises';
import Anthropic from '@anthropic-ai/sdk';
import { deriveDenials, initialToolState } from '../../shared/lab03-tools.js';
import type { Confirmation, Denial, Lab03Frame, SandboxFile, ToolUseRecord } from '../../shared/lab03-tools.js';
import type { Lab01Outcome, Lab01Session } from '../../shared/lab01-events.js';
import { managedErrorMessage } from './managed-config.js';
import { LabError, raceAbort } from './lab01-run.js';
import type { Sandbox } from './lab03-sandbox.js';
import type { CustomToolResult, EffectiveTool, OutputReport, ToolSessionPort } from './tool-session-port.js';
import { createEventConsumer } from './session-events.js';
import type { FrameInput } from './session-events.js';

/** Frames this runner produces itself, before a sequence number is added. */
export type ToolFrameInput = FrameInput | (Lab03Frame extends infer F ? F extends Lab03Frame ? F extends { kind: 'tool_use' | 'tool_result' | 'confirmation' } ? Omit<F, 'seq'> : never : never : never);
/** The agent.custom_tool_use behind a pause. `input` is exactly what the agent sent; nothing is validated here. */
export interface CustomUse { name: string; input: unknown; raw: string }
/**
 * One call the session is waiting on. `use` is the matching agent.tool_use and `custom` the matching
 * agent.custom_tool_use; both are null when neither was seen on this stream.
 */
export interface PendingCall { id: string; use: ToolUseRecord | null; input: Record<string, unknown> | null; custom: CustomUse | null }
export interface AnswerContext<X> { signal: AbortSignal; emit: (frame: X) => void }
/** A confirmation for a paused built-in call, or a result for a custom tool call. */
export type HostAnswer = Confirmation | CustomToolResult;
const isCustomResult = (answer: HostAnswer): answer is CustomToolResult => 'customToolUseId' in answer;
const answerId = (answer: HostAnswer) => isCustomResult(answer) ? answer.customToolUseId : answer.toolUseId;

export interface ToolRunOptions<X extends { kind: string }> {
  mode: 'scripted' | 'live'; prompt: string; deadlineMs: number; cleanupWaitMs: number; maxConfirmations: number;
  port: ToolSessionPort; signal: AbortSignal;
  /** Host files to report after the turn. Labs without host files leave it out. */
  sandbox?: Sandbox;
  /** Retained-session labs keep only a completed, confirmed-idle session. Default is archive. */
  retainOnCompleted?: boolean;
  emit: (frame: (ToolFrameInput | X) & { seq: number }) => void;
  /**
   * Answers one requires_action pause. Returns at most one answer per call: a confirmation for a paused
   * built-in call, or a custom tool result. A call left out gets no answer. Each sevt_ ID is offered to
   * this hook at most once per run. Rejects (for example on abort) to stop the run.
   */
  answer: (calls: PendingCall[], context: AnswerContext<X>) => Promise<HostAnswer[]>;
}
export interface ToolRunCore {
  source: ToolSessionPort['source']; sessionId: string | null; session: Lab01Session | null;
  effectiveTools: EffectiveTool[] | null; outcome: Lab01Outcome;
  messages: { eventId: string; text: string }[]; toolUses: ToolUseRecord[]; confirmations: Confirmation[]; denials: Denial[];
  files: SandboxFile[]; outputs: OutputReport | { status: 'not-attempted'; detail: string };
  uploads: 'not-needed' | 'deleted' | 'pending'; duplicatesIgnored: number; eventCount: number;
  interruption: 'not-needed' | 'not-attempted' | 'simulated' | 'confirmed' | 'unconfirmed';
  cleanup: 'not-needed' | 'retained' | 'simulated' | 'archived' | 'pending'; notes: string[];
}

const textOf = (content: readonly { type: string; text?: string }[] | undefined) =>
  (content ?? []).map((block) => block.type === 'text' ? block.text ?? '' : `[${block.type} block]`).join('\n').slice(0, 4000);

/**
 * One tool-using turn. Tool events and requires_action pauses are handled here; everything else goes
 * through the shared event consumer. The lab's `answer` hook decides each pause, and every answer is
 * sent as user.tool_confirmation keyed by the sevt_ event ID.
 */
export async function runToolSession<X extends { kind: string }>(options: ToolRunOptions<X>): Promise<ToolRunCore> {
  const { port, sandbox, signal } = options;
  const consumer = createEventConsumer();
  let seq = 0;
  const emit = (frame: ToolFrameInput | X) => options.emit({ ...frame, seq: ++seq } as (ToolFrameInput | X) & { seq: number });
  const local = new AbortController(), upstream = new AbortController();
  let cause: 'cancelled' | 'deadline' | null = null;
  const stop = (reason: 'cancelled' | 'deadline') => { cause ??= reason; local.abort(reason); };
  const onExternalAbort = () => stop('cancelled');
  signal.addEventListener('abort', onExternalAbort, { once: true });
  if (signal.aborted) onExternalAbort();
  const timer = setTimeout(() => stop('deadline'), options.deadlineMs);

  const toolUses = new Map<string, ToolUseRecord>();
  const customUses = new Map<string, CustomUse>();
  const confirmations: Confirmation[] = [];
  const seen = new Set<string>();
  // Every sevt_ ID gets at most one answer, even if a requires_action idle is repeated.
  const answered = new Set<string>();
  let answerCount = 0;
  let promptSent = false, sessionId: string | null = null, session: Lab01Session | null = null;
  let effectiveTools: EffectiveTool[] | null = null, failure: string | null = null, paused: Lab01Outcome | null = null;
  try {
    const created = await port.create(); // not abortable: the ID is needed for interrupt and cleanup
    session = created.session; sessionId = session.id; effectiveTools = created.effectiveTools;
    emit({ kind: 'session', session });
    local.signal.throwIfAborted();
    const events = await raceAbort(port.open(sessionId, upstream.signal), local.signal);
    emit({ kind: 'notice', text: 'Event stream established. Sending user.message next.' });
    promptSent = true;
    await port.send(sessionId, options.prompt, local.signal);
    const iterator = events[Symbol.asyncIterator]();
    for (;;) {
      const next = await raceAbort(iterator.next(), local.signal);
      if (next.done) break;
      const event = next.value;
      if (event.type === 'agent.tool_use') {
        if (seen.has(event.id)) { emit({ kind: 'duplicate', eventType: event.type, id: event.id }); continue; }
        seen.add(event.id);
        const evaluationType = event.evaluation?.type ?? null;
        const reasonCode = event.evaluation?.type === 'auto' && event.evaluation.evaluated_permission.type !== 'allow'
          ? event.evaluation.evaluated_permission.reason_code : null;
        const record: ToolUseRecord = { id: event.id, name: event.name.slice(0, 60), input: JSON.stringify(event.input).slice(0, 4000),
          evaluatedPermission: event.evaluated_permission ?? null, evaluationType, reasonCode,
          state: initialToolState(event.evaluated_permission ?? null, evaluationType), result: null };
        toolUses.set(event.id, record);
        emit({ kind: 'tool_use', id: record.id, name: record.name, input: record.input, evaluatedPermission: record.evaluatedPermission,
          evaluationType, reasonCode, state: record.state, raw: JSON.stringify(event).slice(0, 4000) });
        continue;
      }
      if (event.type === 'agent.tool_result') {
        if (seen.has(event.id)) { emit({ kind: 'duplicate', eventType: event.type, id: event.id }); continue; }
        seen.add(event.id);
        const text = textOf(event.content), isError = Boolean(event.is_error);
        const use = toolUses.get(event.tool_use_id);
        if (use) use.result = { isError, text };
        emit({ kind: 'tool_result', id: event.id, toolUseId: event.tool_use_id, isError, text, raw: JSON.stringify(event).slice(0, 4000) });
        continue;
      }
      if (event.type === 'agent.custom_tool_use' && !customUses.has(event.id)) {
        // Recorded for the answer hook; the shared consumer still reports and dedupes the raw event.
        customUses.set(event.id, { name: event.name, input: event.input, raw: JSON.stringify(event).slice(0, 4000) });
      }
      if (event.type === 'session.status_idle' && event.stop_reason.type === 'requires_action') {
        if (seen.has(event.id)) { emit({ kind: 'duplicate', eventType: event.type, id: event.id }); continue; }
        seen.add(event.id);
        emit({ kind: 'lifecycle', type: event.type, id: event.id, detail: `stop_reason: requires_action for ${event.stop_reason.event_ids.join(', ')}`, raw: JSON.stringify(event) });
        const waiting = [...new Set(event.stop_reason.event_ids)].filter((id) => !answered.has(id));
        const repeated = event.stop_reason.event_ids.filter((id) => answered.has(id));
        if (repeated.length) emit({ kind: 'notice', text: `Already answered ${repeated.join(', ')}; no second answer was sent.` });
        if (!waiting.length) continue;
        if (answerCount + waiting.length > options.maxConfirmations) {
          paused = { kind: 'paused', stopReason: 'requires_action', detail: `More than ${options.maxConfirmations} host answers requested; the host stopped answering.` };
          break;
        }
        const calls: PendingCall[] = waiting.map((id) => {
          const use = toolUses.get(id) ?? null;
          let input: Record<string, unknown> | null = null;
          try { input = use ? JSON.parse(use.input) as Record<string, unknown> : null; } catch { /* Truncated input stays null. */ }
          return { id, use, input, custom: customUses.get(id) ?? null };
        });
        const answers = await raceAbort(options.answer(calls, { signal: local.signal, emit }), local.signal);
        const sendable: HostAnswer[] = [];
        for (const answer of answers) {
          const id = answerId(answer);
          // Only IDs from this pause, once each: a second answer for one call would be rejected by the API.
          if (!waiting.includes(id) || answered.has(id)) { emit({ kind: 'notice', text: `Dropped an extra answer for ${id}.` }); continue; }
          answered.add(id); sendable.push(answer);
        }
        const custom = sendable.filter(isCustomResult);
        const confirmed = sendable.filter((answer): answer is Confirmation => !isCustomResult(answer));
        for (const answer of confirmed) {
          const use = toolUses.get(answer.toolUseId);
          if (use) use.state = answer.result === 'allow' ? 'allowed-by-host' : 'denied-by-host';
          confirmations.push(answer); emit({ kind: 'confirmation', ...answer });
        }
        answerCount += sendable.length;
        if (confirmed.length) await port.confirm(sessionId, confirmed, local.signal);
        if (custom.length) {
          if (!port.respond) throw new LabError('This port cannot send custom tool results; the session stays paused.');
          await port.respond(sessionId, custom, local.signal);
        }
        continue;
      }
      const { frames, done } = consumer.push(event);
      for (const frame of frames) emit(frame);
      if (done) break;
    }
  } catch (error) {
    if (!local.signal.aborted) failure = error instanceof LabError ? error.message : `${managedErrorMessage(error)}${error instanceof Anthropic.APIError ? ` (provider HTTP ${error.status ?? 'n/a'})` : ` (${error instanceof Error ? error.name : 'unknown error'})`}`;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onExternalAbort);
  }

  const provider = consumer.finish();
  let outcome: Lab01Outcome = paused ?? provider;
  if (cause && (outcome.kind === 'completed' || outcome.kind === 'incomplete')) {
    outcome = cause === 'deadline'
      ? { kind: 'deadline', stopReason: null, detail: 'The local deadline expired before the turn was confirmed finished.' }
      : { kind: 'cancelled', stopReason: null, detail: 'Cancelled locally before the turn was confirmed finished.' };
  } else if (failure && outcome.kind === 'incomplete') outcome = { kind: 'error', stopReason: null, detail: failure.slice(0, 500) };

  // Cleanup uses fresh bounded requests: the aborted run signal must never cancel them.
  const simulated = port.source === 'authored-fixture';
  // A paused session is already idle; anything else that did not complete may still be working.
  const needsInterrupt = promptSent && outcome.kind !== 'completed' && outcome.kind !== 'paused';
  let interruption: ToolRunCore['interruption'] = needsInterrupt ? 'not-attempted' : 'not-needed';
  let cleanup: ToolRunCore['cleanup'] = 'not-needed';
  let outputs: ToolRunCore['outputs'] = { status: 'not-attempted', detail: 'No session reached idle, so outputs were not collected.' };
  try {
    if (sessionId) {
      let interrupted = false;
      if (needsInterrupt) {
        try { await port.interrupt(sessionId); interrupted = true; } catch { /* Reported as unconfirmed below. */ }
        emit({ kind: 'notice', text: interrupted ? 'user.interrupt accepted for this session.' : 'user.interrupt could not be sent.' });
      }
      upstream.abort('closed');
      const until = Date.now() + options.cleanupWaitMs;
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
        // Files on disk are the evidence: copy outputs before the session is archived.
        try { outputs = await port.collectOutputs(sessionId); }
        catch (error) { outputs = { status: 'failed', detail: `Outputs could not be collected: ${managedErrorMessage(error)}` }; }
        if (options.retainOnCompleted && outcome.kind === 'completed') cleanup = 'retained';
        else { try { await port.archive(sessionId); cleanup = simulated ? 'simulated' : 'archived'; } catch { cleanup = 'pending'; } }
      } else cleanup = 'pending';
    }
  } finally { upstream.abort('closed'); }
  const uploads = await port.cleanup().catch(() => 'pending' as const);

  const records = [...toolUses.values()];
  const denials = deriveDenials(records, confirmations);
  const notes = [outcome.detail];
  if (denials.length) notes.push(`${denials.length} permission denial(s): ${denials.map((d) => `${d.tool} ${d.kind} by ${d.by}`).join('; ')}.`);
  if (interruption === 'unconfirmed') notes.push('Remote interruption is unconfirmed: aborting the local connection does not stop remote work. Check the session in Claude Console.');
  if (interruption === 'simulated') notes.push('Interrupt was simulated by the authored fixture.');
  if (cleanup === 'pending' && sessionId && !simulated) notes.push(`Cleanup pending for ${sessionId}.`);
  if (uploads === 'pending') notes.push('Uploaded fixture files could not all be deleted; check the Files API.');
  const snapshot = consumer.snapshot();
  return { source: port.source, sessionId, session, effectiveTools, outcome, messages: snapshot.messages, toolUses: records,
    confirmations, denials, files: sandbox ? await sandbox.list() : [], outputs, uploads, duplicatesIgnored: snapshot.duplicatesIgnored,
    eventCount: snapshot.eventCount + seen.size, interruption, cleanup, notes };
}
