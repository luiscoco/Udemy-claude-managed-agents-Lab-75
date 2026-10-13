import { lab05RequestSchema, lab05ResultSchema } from '../../shared/lab05-custom-tools.js';
import type { CustomCall, Lab05Frame, Lab05Request, Lab05Result } from '../../shared/lab05-custom-tools.js';
import { redact } from '../../src/lib/presentation.js';
import { dispatch } from './lab05-tasks.js';
import type { TaskStoreRegistry } from './lab05-tasks.js';
import type { Lab05Port } from './lab05-port.js';
import { runToolSession } from './tool-session-run.js';
import type { HostAnswer, ToolFrameInput } from './tool-session-run.js';

/** More answers than this means the agent is looping; the host stops answering and the session stays paused. */
export const maxAnswers = 24;
type Lab05ExtraFrame = Lab05Frame extends infer F ? F extends Lab05Frame ? F extends { kind: 'run' | 'custom_call' } ? Omit<F, 'seq'> : never : never : never;

/**
 * One Lab 05 turn. The shared runner reads the stream; at every requires_action pause this lab's hook runs
 * each pending agent.custom_tool_use through the validating dispatcher, against this run's own task store,
 * and returns exactly one user.custom_tool_result per sevt_ ID.
 */
export async function runLab05(input: Lab05Request, port: Lab05Port, stores: TaskStoreRegistry, runId: string, signal: AbortSignal,
  emitFrame: (frame: Lab05Frame) => void, cleanupWaitMs = 10_000): Promise<Lab05Result> {
  const requested = lab05RequestSchema.parse(input);
  const store = stores.open(runId);
  const initial = store.snapshot();
  let seq = 0;
  const emit = (frame: ToolFrameInput | Lab05ExtraFrame) => emitFrame({ ...frame, seq: ++seq } as Lab05Frame);
  // Offline teaching aid only: the add_task handler outlasts its deadline so the timeout result can be seen.
  const slowTools = requested.mode === 'scripted' && requested.scenario === 'slow-handler' ? { add_task: requested.handlerTimeoutMs + 500 } : undefined;
  const calls: CustomCall[] = [];
  let resultsSent = 0;
  const counted: Lab05Port = { ...port, async respond(id, results, respondSignal) { await port.respond(id, results, respondSignal); resultsSent += results.length; } };

  emit({ kind: 'run', runId, tools: ['list_tasks', 'add_task', 'complete_task'] });
  try {
    const core = await runToolSession<Lab05ExtraFrame>({ mode: requested.mode, prompt: requested.prompt,
      deadlineMs: requested.deadlineSeconds * 1000, cleanupWaitMs, maxConfirmations: maxAnswers, port: counted, signal,
      emit: (frame) => emit(frame),
      answer: async (pending, context) => {
        const answers: HostAnswer[] = [];
        // Sequential on purpose: state changes happen in the order the session listed the calls.
        for (const call of pending) {
          if (call.use) {
            // A built-in tool cannot pause here: the agent has none. Deny it rather than leave the session blocked.
            answers.push({ toolUseId: call.id, tool: call.use.name, result: 'deny', reason: 'Lab 05 expects custom tools only.',
              denyMessage: 'This exercise only answers the custom task tools.' });
            continue;
          }
          const record: CustomCall = call.custom
            ? { id: call.id, name: call.custom.name.slice(0, 128), rawInput: redact(JSON.stringify(call.custom.input) ?? 'undefined').slice(0, 2000),
              ...await dispatch(call.custom.name, call.custom.input, store, { timeoutMs: requested.handlerTimeoutMs, signal: context.signal, slowTools }) }
            : { id: call.id, name: 'unknown', rawInput: '', validation: { ok: false, issues: [{ path: 'event', message: 'No agent.custom_tool_use was seen for this ID.' }] },
              handlerRan: false, outcome: 'not-seen', before: store.snapshot(), after: store.snapshot(), durationMs: 0,
              result: { isError: true, text: 'The host did not receive this call\'s input, so nothing ran. Call the tool again.' } };
          calls.push(record);
          context.emit({ kind: 'custom_call', call: record });
          answers.push({ customToolUseId: call.id, tool: record.name, isError: record.result.isError, text: record.result.text });
        }
        return answers;
      } });
    const { notes } = core;
    const rejected = calls.filter((call) => call.outcome === 'rejected').length;
    if (rejected) notes.push(`${rejected} call(s) failed validation; no handler ran for them.`);
    const timedOut = calls.filter((call) => call.outcome === 'timeout').length;
    if (timedOut) notes.push(`${timedOut} handler(s) passed the ${requested.handlerTimeoutMs} ms deadline and saved nothing.`);
    return lab05ResultSchema.parse({ mode: requested.mode, source: core.source, requested, runId,
      sessionTools: core.effectiveTools?.map((tool) => ({ name: tool.name.slice(0, 128), type: 'custom' })) ?? null,
      sessionId: core.sessionId, session: core.session, outcome: core.outcome, messages: core.messages,
      calls, resultsSent, tasks: { initial, final: store.snapshot() }, handlerCalls: { ...store.handlerCalls },
      duplicatesIgnored: core.duplicatesIgnored, eventCount: core.eventCount, interruption: core.interruption, cleanup: core.cleanup,
      message: notes.join(' ').slice(0, 800) });
  } finally { stores.finish(runId); }
}
