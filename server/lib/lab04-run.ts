import { lab04RequestSchema, lab04ResultSchema, lab04Toolset } from '../../shared/lab04-permissions.js';
import type { DecisionLogEntry, Lab04Frame, Lab04Request, Lab04Result } from '../../shared/lab04-permissions.js';
import type { Confirmation } from '../../shared/lab03-tools.js';
import { redact } from '../../src/lib/presentation.js';
import { ApprovalQueueFull } from './lab04-approvals.js';
import type { ApprovalRegistry } from './lab04-approvals.js';
import type { Lab04Port } from './lab04-port.js';
import { hostAllowCheck, pathOf, resolveContainerPath } from './lab03-sandbox.js';
import type { Sandbox } from './lab03-sandbox.js';
import { runToolSession } from './tool-session-run.js';
import type { PendingCall, ToolFrameInput } from './tool-session-run.js';

export const maxConfirmations = 12;
type Lab04ExtraFrame = Lab04Frame extends infer F ? F extends Lab04Frame ? F extends { kind: 'run' | 'review' | 'decision' | 'expired' } ? Omit<F, 'seq'> : never : never : never;

function containerPathOf(input: Record<string, unknown>) {
  const target = pathOf(input);
  if (target === undefined) return null;
  try { return resolveContainerPath(target).path; } catch { return null; }
}

/**
 * One Lab 04 turn. Every requires_action pause becomes a pending approval in the registry; the
 * reviewer resolves it through POST /decide, expiry denies it, and abandonment releases it with no
 * confirmation. Preallowed calls never get here, so they are never reviewed.
 */
export async function runLab04(input: Lab04Request, port: Lab04Port, sandbox: Sandbox, registry: ApprovalRegistry,
  run: { runId: string; decisionToken: string }, signal: AbortSignal,
  emitFrame: (frame: Lab04Frame) => void, cleanupWaitMs = 10_000): Promise<Lab04Result> {
  const requested = lab04RequestSchema.parse(input);
  const approvalMs = requested.approvalSeconds * 1000;
  let seq = 0;
  const emit = (frame: ToolFrameInput | Lab04ExtraFrame) => emitFrame({ ...frame, seq: ++seq } as Lab04Frame);
  const decisions: DecisionLogEntry[] = [];
  const log = (entry: DecisionLogEntry) => { decisions.push(entry); emit({ kind: 'decision', entry }); };
  // Abandonment releases every waiter at once and sends no confirmation for them.
  const release = () => {
    for (const item of registry.releaseRun(run.runId, 'The run was cancelled, timed out or disconnected.'))
      log({ toolUseId: item.toolUseId, tool: item.tool, decision: 'abandoned', decidedBy: 'cancellation', denyMessage: null,
        latencyMs: item.latencyMs, confirmationSent: false });
  };
  let releaseBound = false;

  emit({ kind: 'run', runId: run.runId, decisionToken: run.decisionToken, approvalSeconds: requested.approvalSeconds });
  async function review(call: PendingCall, emitExtra: (frame: Lab04ExtraFrame) => void): Promise<Confirmation | null> {
    // Only "ask" calls can be confirmed; the API rejects a confirmation for anything else.
    if (call.use && call.use.evaluatedPermission !== 'ask') return null;
    const tool = call.use?.name ?? 'unknown', input = call.input ?? {};
    let pending;
    try { pending = registry.request(run.runId, { toolUseId: call.id, tool, input }, approvalMs); }
    catch (error) {
      if (!(error instanceof ApprovalQueueFull)) throw error;
      const denyMessage = 'The host review queue is full; this call was denied without review.';
      log({ toolUseId: call.id, tool, decision: 'deny', decidedBy: 'host-limit', denyMessage, latencyMs: 0, confirmationSent: true });
      return { toolUseId: call.id, tool, result: 'deny', reason: 'Review queue full.', denyMessage };
    }
    emitExtra({ kind: 'review', toolUseId: call.id, tool, input: redact(JSON.stringify(input)).slice(0, 2000),
      containerPath: containerPathOf(input), guard: hostAllowCheck(tool, input), expiresAt: new Date(pending.expiresAt).toISOString() });
    const outcome = await pending.outcome;
    log({ toolUseId: call.id, tool, decision: outcome.decision, decidedBy: outcome.decidedBy, denyMessage: outcome.denyMessage,
      latencyMs: outcome.latencyMs, confirmationSent: true });
    if (outcome.decidedBy === 'expiry') emitExtra({ kind: 'expired', toolUseId: call.id, tool });
    const reason = outcome.decidedBy === 'expiry' ? 'Approval expired; the host denied the call.'
      : outcome.decision === 'allow' ? 'Allowed by the reviewer.' : 'Denied by the reviewer.';
    return { toolUseId: call.id, tool, result: outcome.decision, reason, denyMessage: outcome.denyMessage };
  }

  try {
    const core = await runToolSession<Lab04ExtraFrame>({ mode: requested.mode, prompt: requested.prompt,
      deadlineMs: requested.deadlineSeconds * 1000, cleanupWaitMs, maxConfirmations, port, sandbox, signal,
      emit: (frame) => emit(frame),
      answer: async (calls, context) => {
        if (!releaseBound) { releaseBound = true; context.signal.addEventListener('abort', release, { once: true }); if (context.signal.aborted) release(); }
        const answers = await Promise.all(calls.map((call) => review(call, context.emit)));
        return answers.filter((answer): answer is Confirmation => answer !== null);
      } });
    release(); // Normally empty; covers a stream that ended while a review was still open.
    const { notes, ...rest } = core;
    const abandoned = decisions.filter((entry) => entry.decision === 'abandoned').length;
    if (abandoned) notes.push(`${abandoned} pending approval(s) abandoned without a confirmation.`);
    return lab04ResultSchema.parse({ ...rest, mode: requested.mode, requested, runId: run.runId, toolset: lab04Toolset,
      decisions, message: notes.join(' ').slice(0, 800) });
  } finally { release(); }
}
