import { randomUUID } from 'node:crypto';
import type { BetaManagedAgentsMultiagent20261001Params } from '@anthropic-ai/sdk/resources/beta/agents/agents';
import { lab47SalesReportSchema, lab47SnapshotSchema } from '../../shared/lab47-multi-agent.js';
import type { Lab47Route, Lab47Scenario } from '../../shared/lab47-multi-agent.js';

export class Lab47Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
const fixture = { north: { region: 'north', sales: 120, orders: 4, fixtureId: 'sales-2026-north' },
  south: { region: 'south', sales: 80, orders: 2, fixtureId: 'sales-2026-south' } } as const;
const config: BetaManagedAgentsMultiagent20261001Params = { type: 'multiagent_20261001' };
const nativeRoutes: readonly Lab47Route[] = ['orchestrator', 'hierarchy'];
export class Lab47MultiAgent {
  private active = 0; private closed = false;
  facts() { return { sdkConfiguration: config.type, nativeThreadField: 'session_thread_id', nativeDepthLimit: 1,
    nativeRoutes, hostRoutes: ['pipeline', 'fanout', 'evaluator'], accountCapability: 'not checked offline',
    liveEnabled: false, providerCalls: 0, note: 'Native configuration support in the installed SDK does not prove account entitlement.' }; }
  run(route: Lab47Route, scenario: Lab47Scenario, signal?: AbortSignal) {
    if (this.closed || this.active >= 4) throw new Lab47Error(429, 'Coordinator capacity reached.');
    if (signal?.aborted) throw new Lab47Error(499, 'Local request cancelled before execution.');
    this.active++; try {
      const native = nativeRoutes.includes(route), parentSessionId = native ? `sesn_fixture_${randomUUID().slice(0, 8)}` : null;
      const workers = (['north', 'south'] as const).map((region, index) => {
        const id = native ? { sessionId: parentSessionId, threadId: `thread_fixture_${index + 1}` } :
          { sessionId: `sesn_fixture_${randomUUID().slice(0, 8)}`, threadId: null };
        const invalid = scenario === 'incorrect-total' && region === 'south';
        const delayed = scenario === 'delayed-worker' && region === 'south';
        const blocked = scenario === 'dependency-failure' && region === 'north';
        const authored = invalid ? { ...fixture.south, sales: 800 } : fixture[region];
        const rawReport = blocked ? 'Worker dependency failed before report.' : JSON.stringify(authored);
        const first = lab47SalesReportSchema.safeParse(blocked ? null : JSON.parse(rawReport));
        const matches = first.success && JSON.stringify(first.data) === JSON.stringify(fixture[region]);
        const corrected = invalid && !delayed && !blocked;
        const verifiedReport = delayed || blocked ? null : matches || corrected ? lab47SalesReportSchema.parse(fixture[region]) : null;
        return { role: region, ...id, state: blocked ? 'blocked' as const : delayed ? 'delayed' as const : corrected ? 'corrected' as const :
          verifiedReport ? 'verified' as const : 'rejected' as const,
          attempts: blocked ? 0 : corrected ? 2 : 1, rawReport,
          verifiedReport, usageScope: native ? 'session-shared' as const : 'independent-session' as const,
          inputTokens: blocked ? null : 25 + index, outputTokens: blocked ? null : 12 + index,
          evidence: blocked ? 'Dependency failure; no report accepted.' : delayed ? 'Deadline reached; late text cannot satisfy the gate.' :
            corrected ? 'First total 800 contradicted fixture 80; one corrective round returned 80.' : 'Closed schema and fixture values verified.' };
      });
      const gate = workers.some(worker => worker.state === 'blocked') ? 'blocked' :
        workers.some(worker => worker.state === 'delayed') ? 'waiting' :
          workers.every(worker => worker.verifiedReport) ? 'passed' : 'rejected';
      const parentFinalText = gate === 'passed' ? 'The two regions sold 200 units across 6 orders.' :
        'I believe the sales report is complete.';
      const hostAggregate = native ? null : { inputTokens: workers.reduce((sum, worker) => sum + (worker.inputTokens ?? 0), 0) + 18,
        outputTokens: workers.reduce((sum, worker) => sum + (worker.outputTokens ?? 0), 0) + 11 };
      return lab47SnapshotSchema.parse({ source: 'authored-offline-fixture', scenario, route,
        architecture: native ? 'native' : 'host', nativeCapability: true, depthLimit: 1, parentSessionId, workers,
        parentFinalText, gate, sessionUsage: native ? { inputTokens: 86, outputTokens: 43 } : null, hostAggregate,
        providerCalls: 0, notes: [native ? 'Worker thread IDs share one parent session and budget; do not sum illustrative worker counters.' :
          'Each worker has an independent Managed session; host aggregate includes an editor fixture.',
          'Parent prose is distinct from closed worker reports and cannot satisfy the verification gate.',
          'Host dependency graphs may be deeper than the pinned native configuration depth limit.'] });
    } finally { this.active--; }
  }
  close() { this.closed = true; }
}
