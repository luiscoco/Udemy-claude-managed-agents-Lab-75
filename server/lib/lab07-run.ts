import { lab07RequestSchema, lab07ResultSchema } from '../../shared/lab07-hooks.js';
import type { Lab07Audit, Lab07Frame, Lab07Request, Lab07Result } from '../../shared/lab07-hooks.js';
import type { Sandbox } from './lab03-sandbox.js';
import type { Lab07Port } from './lab07-port.js';
import { executePolicy } from './lab07-policy.js';
import { runToolSession } from './tool-session-run.js';
import type { HostAnswer, ToolFrameInput } from './tool-session-run.js';

type Extra = Lab07Frame extends infer F ? F extends Lab07Frame ? F extends { kind: 'audit' } ? Omit<F, 'seq'> : never : never : never;
export async function runLab07(input: Lab07Request, port: Lab07Port, sandbox: Sandbox, runId: string, signal: AbortSignal,
  emitFrame: (frame: Lab07Frame) => void, cleanupWaitMs = 5000): Promise<Lab07Result> {
  const requested = lab07RequestSchema.parse(input); let seq = 0, resultsSent = 0; const audits: Lab07Audit[] = [];
  const emit = (frame: ToolFrameInput | Extra) => emitFrame({ ...frame, seq: ++seq } as Lab07Frame);
  const counted: Lab07Port = { ...port, async respond(id, results, s) { await port.respond(id, results, s); resultsSent += results.length; } };
  const core = await runToolSession<Extra>({ mode: requested.mode, prompt: requested.prompt, deadlineMs: requested.deadlineSeconds * 1000,
    cleanupWaitMs, maxConfirmations: 20, port: counted, sandbox, signal, emit: (frame) => emit(frame),
    answer: async (pending, context) => {
      const answers: HostAnswer[] = [];
      for (const call of pending) {
        const audit = call.custom ? await executePolicy({ id: call.id, name: call.custom.name, raw: call.custom.input, policy: requested.policy,
          sandbox, timeoutMs: requested.handlerTimeoutMs, signal: context.signal, forceException: requested.scenario === 'handler-exception' })
          : { id: call.id, tool: 'unknown', policy: requested.policy, originalInput: '{}', effectiveInput: null, decision: 'deny' as const,
            reason: 'No custom tool event was observed.', validation: 'rejected' as const, handlerRan: false, outcome: 'denied' as const,
            before: null, after: null, result: { isError: true, text: 'No custom tool event was observed.' } };
        audits.push(audit); context.emit({ kind: 'audit', audit });
        answers.push({ customToolUseId: call.id, tool: audit.tool, isError: audit.result.isError, text: audit.result.text });
      }
      return answers;
    } });
  return lab07ResultSchema.parse({ mode: requested.mode, source: core.source, requested, runId, sessionId: core.sessionId, session: core.session,
    outcome: core.outcome, audits, files: core.files, resultsSent, interruption: core.interruption, cleanup: core.cleanup,
    message: `${core.notes.join(' ')} Host audit recorded ${audits.length} call(s); post-execution evidence cannot undo an effect.`.slice(0, 1000) });
}

