import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { lab49ReportSchema, lab49SnapshotSchema } from '../../shared/lab49-deploy-ci-headless.js';
import type { Lab49Scenario } from '../../shared/lab49-deploy-ci-headless.js';

export class Lab49Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
const hostLimits = { deadlineMs: 3000, maxMessages: 1, maxToolCalls: 0, maxConcurrent: 2, budgetCents: 50 } as const;
export class Lab49Headless {
  private active = 0; private closed = false;
  facts() { return { source: 'host-ci-kit', liveEnabled: false, providerCalls: 0, readiness: 'offline-ready',
    liveRequirements: ['CI_MANAGED_LIVE_OPT_IN=true', 'MANAGED_LIVE_ENABLED=true', 'ANTHROPIC_API_KEY',
      'CLAUDE_MANAGED_AGENT_ID', 'CLAUDE_MANAGED_ENVIRONMENT_ID'],
    limits: hostLimits, approvalPolicy: 'deny unresolved approvals', noTtyRequired: true,
    note: 'Dockerfile and workflow are authored samples, not deployed infrastructure.' }; }
  async run(scenario: Lab49Scenario, signal?: AbortSignal) {
    if (this.closed || this.active >= hostLimits.maxConcurrent) throw new Lab49Error(429, 'Headless capacity reached.');
    if (signal?.aborted) throw new Lab49Error(499, 'Local request cancelled.');
    this.active++; try {
      await delay(scenario === 'concurrency' ? 100 : 5, undefined, { signal });
      const sessionId = scenario === 'concurrency' ? null : `sesn_fixture_${randomUUID().slice(0, 8)}`;
      const raw = scenario === 'validation' ? '{"task":"ci-check","verdict":"pass","summary":"ok","unexpected":true}' :
        '{"task":"ci-check","verdict":"pass","summary":"Fixture checks passed."}';
      const checked = lab49ReportSchema.safeParse(JSON.parse(raw));
      const outcome = scenario === 'pass' ? 'pass' : scenario === 'validation' ? 'validation-failed' :
        scenario === 'limit' ? 'limit-reached' : scenario === 'execution-error' ? 'execution-error' :
          scenario === 'sigterm' ? 'cancelled' : scenario === 'concurrency' ? 'capacity-rejected' : 'remote-stop-unconfirmed';
      const terminalPass = outcome === 'pass';
      const report = terminalPass && checked.success ? checked.data : null;
      const cleanup = scenario === 'unconfirmed-stop' ? 'pending' : sessionId ? 'archived' : 'not-needed';
      const interruption = scenario === 'unconfirmed-stop' ? 'unconfirmed' : scenario === 'sigterm' ? 'attempted' : 'not-needed';
      return lab49SnapshotSchema.parse({ source: 'authored-headless-fixture', scenario, outcome,
        exitCode: terminalPass ? 0 : outcome === 'cancelled' ? 3 : 2, sessionId, report, hostLimits,
        interruption, cleanup, providerCalls: 0,
        evidence: [scenario === 'validation' ? 'Closed report rejected the unexpected field.' : `Host classified ${outcome} from fixture events and policy.`,
          scenario === 'concurrency' ? 'Reservation rejected before session creation.' : 'One message maximum and zero tool calls.',
          scenario === 'unconfirmed-stop' ? 'Local abort alone does not prove remote stop; cleanup remains pending.' :
            scenario === 'sigterm' ? 'SIGTERM-shaped fixture requested abort and cleanup.' : 'No unresolved approval may pass CI.'] });
    } catch (error) {
      if (signal?.aborted) throw new Lab49Error(499, 'Local request cancelled.');
      throw error;
    } finally { this.active--; }
  }
  close() { this.closed = true; }
}
