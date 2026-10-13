import { buildToolset, lab03RequestSchema, lab03ResultSchema } from '../../shared/lab03-tools.js';
import type { Lab03Frame, Lab03Request, Lab03Result } from '../../shared/lab03-tools.js';
import type { Lab03Port } from './lab03-port.js';
import { decideConfirmation } from './lab03-sandbox.js';
import type { Sandbox } from './lab03-sandbox.js';
import { runToolSession } from './tool-session-run.js';

/** More pauses than this means the agent is looping on denied calls; the lab stops answering. */
export const maxConfirmations = 12;

/**
 * One Lab 03 turn. The shared tool-session runner handles the stream; this lab answers every
 * requires_action pause automatically, through the host policy and path guards.
 */
export async function runLab03(input: Lab03Request, port: Lab03Port, sandbox: Sandbox, signal: AbortSignal,
  emitFrame: (frame: Lab03Frame) => void, cleanupWaitMs = 10_000): Promise<Lab03Result> {
  const requested = lab03RequestSchema.parse(input);
  const toolset = buildToolset(requested.preset, requested.removeTools);
  const core = await runToolSession<never>({ mode: requested.mode, prompt: requested.prompt, deadlineMs: requested.deadlineSeconds * 1000,
    cleanupWaitMs, maxConfirmations, port, sandbox, signal, emit: (frame) => emitFrame(frame as Lab03Frame),
    answer: async (calls) => calls.map(({ id, use, input: callInput }) => use && callInput
      ? decideConfirmation(requested.preset, id, use.name, callInput)
      : { toolUseId: id, tool: use?.name ?? 'unknown', result: 'deny' as const,
        reason: 'No matching agent.tool_use was seen on this stream.', denyMessage: 'Unknown tool call.' }) });
  const { notes, ...rest } = core;
  return lab03ResultSchema.parse({ ...rest, mode: requested.mode, requested, toolset, message: notes.join(' ').slice(0, 800) });
}
