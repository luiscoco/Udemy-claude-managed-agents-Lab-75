import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { lab55ResultSchema, lab55ScenarioSchema } from '../../shared/lab55-upgrading-sdk.js';
import type { z } from 'zod';

type Scenario = z.infer<typeof lab55ScenarioSchema>;
type Result = z.infer<typeof lab55ResultSchema>;
const installed = JSON.parse(readFileSync(new URL('../../node_modules/@anthropic-ai/sdk/package.json', import.meta.url), 'utf8')) as { version: string };
if (installed.version !== '1.3.0') throw new Error('Lab 55 baseline requires the locked installed SDK 1.3.0.');
const betaHeader = 'managed-agents-2026-04-01';
const pins = { agentVersion: 'fixture:agent-v1', environmentVersion: 'fixture:env-v1',
  skillVersion: 'fixture:skill-v1' };
const baseline = {
  npmVersion: installed.version, betaHeader,
  sessionEvents: ['agent.message', 'agent.custom_tool_use', 'session.status_idle', 'session.error'],
  sendEvents: ['user.message', 'user.custom_tool_result', 'user.interrupt'],
  streamOrder: 'open-before-send', configuration: 'pinned-agent-and-restricted-toolset',
  permission: 'host-owned-approval', usage: 'observed-or-unknown', eval: 'host-safety-passed',
  pins,
};
const checksFor = (scenario: Scenario) => {
  const failures: Record<Exclude<Scenario, 'compatible-change'>, string> = {
    'removed-type': 'event-union', 'stream-change': 'stream-order', 'policy-drift': 'permission-policy',
    'missing-usage': 'usage-evidence', 'quality-regression': 'eval-gate', 'missing-evidence': 'candidate-evidence',
  };
  const target = scenario === 'compatible-change' ? null : failures[scenario];
  const entries = [
    ['locked-npm-baseline', 'Installed package manifest is @anthropic-ai/sdk 1.3.0; package files remain unchanged.'],
    ['beta-header', `Managed API header remains ${betaHeader}.`],
    ['event-union', 'Required session and custom-tool result event types remain available.'],
    ['stream-order', 'Event stream opens before user.message is sent; terminal idle remains explicit.'],
    ['configuration', 'Agent/toolset and environment rules remain pinned and restricted.'],
    ['permission-policy', 'Host approval and customer ownership cannot be replaced by client hints.'],
    ['usage-evidence', 'Usage is observed or explicitly unknown, never invented.'],
    ['eval-gate', 'Host safety and regression baseline cases pass.'],
    ['candidate-evidence', 'Candidate manifest and isolated contract/eval evidence are complete.'],
    ['resource-pins', 'Agent, environment and skill versions are recorded separately from npm/API compatibility.'],
  ] as const;
  return entries.map(([name, evidence]) => ({ name, pass: name !== target,
    evidence: name === target ? `${evidence} Authored ${scenario} fixture violates this check.` : evidence }));
};
export class Lab55UpgradeStore {
  private owners = new Map<string, Map<string, Result>>();
  private space(owner: string) { let space = this.owners.get(owner); if (!space) {
    if (this.owners.size >= 12) throw new Error('Upgrade owner capacity reached.');
    space = new Map(); this.owners.set(owner, space); } return space; }
  facts() { return { source: 'offline-upgrade-rehearsal', baseline,
    candidateNpmVersion: null, candidateIsInstalled: false, providerCalls: 0,
    note: 'Candidate manifests are authored in isolated local tooling. Eligibility and canary are simulated, not real release evidence.' }; }
  run(owner: string, scenario: Scenario, _clientEligible?: boolean): Result {
    const space = this.space(owner); if (space.size >= 10) throw new Error('Upgrade run capacity reached.');
    const checks = checksFor(scenario), eligible = checks.every(check => check.pass);
    const apiCompatibility = scenario === 'removed-type' || scenario === 'stream-change' || scenario === 'policy-drift' ?
      'incompatible' : scenario === 'missing-evidence' ? 'unknown' : 'compatible';
    const result = lab55ResultSchema.parse({ id: randomUUID(), source: 'offline-upgrade-rehearsal', scenario,
      baselineNpmVersion: '1.3.0', candidateNpmVersion: null, apiCompatibility, pinnedResources: pins,
      checks, eligible, state: 'candidate', canaryEvidence: 'not-run', remoteSessionsRewound: false, providerCalls: 0,
      note: 'Server-computed rehearsal only. A client eligible flag grants no promotion; no real candidate SDK or release was validated.' });
    space.set(result.id, result); return result;
  }
  transition(owner: string, runId: string, action: 'canary' | 'promote' | 'rollback', _clientEligible?: boolean): Result {
    const space = this.space(owner), current = space.get(runId); if (!current) throw new Error('Upgrade run unavailable.');
    let next: Result;
    if (action === 'canary') { if (!current.eligible || current.state !== 'candidate')
      throw new Error('Server evidence does not permit a canary.');
      next = { ...current, state: 'canary', canaryEvidence: 'authored-pass',
        note: 'Authored canary fixture passed. This is not evidence that a real release passed.' };
    } else if (action === 'promote') { if (!current.eligible || current.state !== 'canary' || current.canaryEvidence !== 'authored-pass')
      throw new Error('Promotion requires server eligibility and a passed canary rehearsal.');
      next = { ...current, state: 'promoted', note: 'Simulated host-code promotion only; no npm upgrade or remote deployment occurred.' };
    } else { if (current.state !== 'canary' && current.state !== 'promoted')
      throw new Error('Only a canary or promoted rehearsal can roll back.');
      next = { ...current, state: 'rolled-back',
        note: 'Host-code rollback rehearsed. Already-created remote sessions would remain and require separate reconciliation.' }; }
    const checked = lab55ResultSchema.parse(next); space.set(runId, checked); return checked;
  }
}
