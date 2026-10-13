import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { approvalExpiredMessage, approvalLimits } from '../../shared/lab04-permissions.js';
import type { Lab04Decision } from '../../shared/lab04-permissions.js';

/** How a pending approval ended. `deny` always carries the message the agent will receive. */
export interface ApprovalOutcome {
  decision: 'allow' | 'deny'; denyMessage: string | null; decidedBy: 'reviewer' | 'expiry'; latencyMs: number;
}
export interface AbandonedApproval { toolUseId: string; tool: string; latencyMs: number }
/** The waiter of an approval rejects with this when its run is cancelled, times out or disconnects. */
export class ApprovalAbandoned extends Error {}
/** The run or the whole host already holds the maximum number of pending approvals. */
export class ApprovalQueueFull extends Error {}

/** Schedules `fn` after `ms` and returns a cancel function. Injected so tests control expiry exactly. */
export type Schedule = (fn: () => void, ms: number) => () => void;
const realSchedule: Schedule = (fn, ms) => { const timer = setTimeout(fn, ms); timer.unref?.(); return () => clearTimeout(timer); };

interface Pending {
  toolUseId: string; tool: string; input: Record<string, unknown>; createdAt: number; expiresAt: number;
  resolve: (outcome: ApprovalOutcome) => void; reject: (error: Error) => void; cancelTimer: () => void;
}
type Ended = 'consumed' | 'expired' | 'abandoned';
interface RunState { token: Buffer; pending: Map<string, Pending>; ended: Map<string, Ended>; closed: boolean }

export type DecideResult =
  | { status: 200; outcome: ApprovalOutcome; tool: string }
  | { status: 404 | 409 | 422; message: string };

/**
 * Pending approvals keyed by run and tool-use ID. An entry is removed before its waiter resolves,
 * so a decision applies exactly once; replays, expired and abandoned entries answer 409.
 */
export class ApprovalRegistry {
  private readonly runs = new Map<string, RunState>();
  private readonly now: () => number;
  private readonly schedule: Schedule;
  private readonly maxPerRun: number;
  private readonly maxTotal: number;
  private readonly keepClosedRuns: number;
  constructor(options: { now?: () => number; schedule?: Schedule; maxPerRun?: number; maxTotal?: number; keepClosedRuns?: number } = {}) {
    this.now = options.now ?? Date.now;
    this.schedule = options.schedule ?? realSchedule;
    this.maxPerRun = options.maxPerRun ?? approvalLimits.maxPendingPerRun;
    this.maxTotal = options.maxTotal ?? approvalLimits.maxPendingTotal;
    this.keepClosedRuns = options.keepClosedRuns ?? 32;
  }

  /** A fresh run ID and a one-time decision token, sent only in that run's first SSE frame. */
  openRun(): { runId: string; decisionToken: string } {
    const runId = randomUUID();
    const decisionToken = randomBytes(24).toString('base64url');
    this.runs.set(runId, { token: Buffer.from(decisionToken), pending: new Map(), ended: new Map(), closed: false });
    return { runId, decisionToken };
  }

  /** Registers one paused call. The returned promise settles exactly once: decision, expiry or abandonment. */
  request(runId: string, call: { toolUseId: string; tool: string; input: Record<string, unknown> }, approvalMs: number) {
    const run = this.runs.get(runId);
    if (!run || run.closed) throw new ApprovalAbandoned('The run is no longer accepting approvals.');
    if (run.pending.size >= this.maxPerRun || this.pendingCount() >= this.maxTotal)
      throw new ApprovalQueueFull('The review queue is full.');
    const createdAt = this.now(), expiresAt = createdAt + approvalMs;
    let entry!: Pending;
    const outcome = new Promise<ApprovalOutcome>((resolve, reject) => {
      entry = { ...call, createdAt, expiresAt, resolve, reject, cancelTimer: () => {} };
    });
    outcome.catch(() => {}); // A run that stops waiting must not leave an unhandled rejection behind.
    entry.cancelTimer = this.schedule(() => this.expire(run, call.toolUseId), approvalMs);
    run.pending.set(call.toolUseId, entry);
    return { expiresAt, outcome };
  }

  /**
   * Applies one reviewer decision. `validate` runs only for allow; when it reports a problem the
   * entry stays pending (422) so the reviewer can still deny.
   */
  decide(decision: Lab04Decision, validate?: (call: { tool: string; input: Record<string, unknown> }) => string | null): DecideResult {
    const run = this.runs.get(decision.runId);
    const token = Buffer.from(decision.decisionToken);
    // Another run's token, or an unknown run, look the same: nothing about other runs leaks.
    if (!run || token.length !== run.token.length || !timingSafeEqual(token, run.token))
      return { status: 404, message: 'Unknown run or decision token.' };
    const entry = run.pending.get(decision.toolUseId);
    if (!entry) {
      const ended = run.ended.get(decision.toolUseId);
      return ended ? { status: 409, message: `This approval was already ${ended}; a decision applies only once.` }
        : { status: 404, message: 'No pending approval with this tool use ID in this run.' };
    }
    if (this.now() >= entry.expiresAt) { this.expire(run, decision.toolUseId); return { status: 409, message: 'This approval already expired.' }; }
    if (decision.decision === 'allow' && validate) {
      const problem = validate({ tool: entry.tool, input: entry.input });
      if (problem) return { status: 422, message: `Host validation blocked allow: ${problem} Deny it instead.` };
    }
    const outcome: ApprovalOutcome = { decision: decision.decision, decidedBy: 'reviewer', latencyMs: this.now() - entry.createdAt,
      denyMessage: decision.decision === 'deny' ? decision.denyMessage ?? 'The reviewer denied this call.' : null };
    this.consume(run, entry, 'consumed');
    entry.resolve(outcome);
    return { status: 200, outcome, tool: entry.tool };
  }

  /** Releases every waiter of a run: no confirmation is sent for these. Safe to call more than once. */
  releaseRun(runId: string, reason = 'The run ended before the reviewer answered.'): AbandonedApproval[] {
    const run = this.runs.get(runId);
    if (!run) return [];
    const abandoned = [...run.pending.values()];
    for (const entry of abandoned) this.consume(run, entry, 'abandoned');
    for (const entry of abandoned) entry.reject(new ApprovalAbandoned(reason));
    if (!run.closed) {
      run.closed = true;
      // Closed runs are kept briefly so late decisions answer 409 instead of 404.
      const closed = [...this.runs.entries()].filter(([, state]) => state.closed);
      for (const [id] of closed.slice(0, Math.max(0, closed.length - this.keepClosedRuns))) this.runs.delete(id);
    }
    const now = this.now();
    return abandoned.map((entry) => ({ toolUseId: entry.toolUseId, tool: entry.tool, latencyMs: now - entry.createdAt }));
  }

  pendingCount(runId?: string): number {
    if (runId) return this.runs.get(runId)?.pending.size ?? 0;
    let total = 0;
    for (const run of this.runs.values()) total += run.pending.size;
    return total;
  }

  private consume(run: RunState, entry: Pending, ended: Ended) {
    run.pending.delete(entry.toolUseId);
    entry.cancelTimer();
    run.ended.set(entry.toolUseId, ended);
  }
  private expire(run: RunState, toolUseId: string) {
    const entry = run.pending.get(toolUseId);
    if (!entry) return;
    this.consume(run, entry, 'expired');
    entry.resolve({ decision: 'deny', denyMessage: approvalExpiredMessage, decidedBy: 'expiry', latencyMs: this.now() - entry.createdAt });
  }
}
