import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { unlink, rmdir } from 'node:fs/promises';
import { validateLiveEvidence, failedLiveEvidence } from './live-audit-evidence.mjs';

const turn = { outcome: 'verified', reportPresent: true };
const course = () => [
  ...[['completion', 'completed'], ['cancel-after-send', 'cancelled'], ['deadline', 'deadline']].map(([scenario, outcome]) => ({
    lesson: 1, scenario, outcome, source: 'managed-api', cleanup: 'archived', usage: { archived: true },
    markerVerified: scenario === 'completion', interruption: scenario === 'completion' ? 'not-needed' : 'confirmed',
  })),
  { scenario: 'first-report', sessionId: 'fixture-session', turns: [turn] },
  { scenario: 'validated-report-continuation-and-close', source: 'managed-api', sessionId: 'fixture-session', sameSession: true,
    stateBeforeClose: 'idle', stateAfterClose: 'closed', cleanup: 'archived', usage: { archived: true }, turns: [turn, turn] },
];
const learning = () => [[2, 'previews-true'], [2, 'previews-false'], [9, 'custom-instructions'], [11, 'without-skill'],
  [11, 'with-skill'], [11, 'revised-version']].map(([lesson, scenario]) => ({ lesson, scenario, passed: true,
  source: 'managed-api', outcome: 'completed', cleanup: 'archived', archivalVerified: true }));
const host = () => [
  { scenario: 'backend-patch', state: 'completed', patchValidated: true, cleanup: 'archived' },
  { scenario: 'host-apply', appliedOnce: true },
  ...['retained-start', 'retained-turn', 'close', 'one-shot'].map(operation => ({ operation, state: 'completed', toolCalls: 1,
    result: { cleanup: ['close', 'one-shot'].includes(operation) ? 'archived' : 'confirmed-idle-retained' } })),
  { scenario: 'final-cleanup-audit', allArchived: true, sessions: Array.from({ length: 3 }, () => ({ archived: true })) },
];
const team = () => [{ finished: true, state: 'ready', releaseGate: { ready: true }, allArchived: true,
  sessions: 5, tasks: Array.from({ length: 3 }, () => ({ state: 'merged' })), questions: [] }];

test('accepts complete observed evidence for each distinct live suite', () => {
  for (const [suite, records, sessions] of [['course', course(), 4], ['learning', learning(), 6], ['host', host(), 3], ['team', team(), 5]]) {
    assert.deepEqual(validateLiveEvidence(suite, records).sessions, sessions);
  }
});
test('green process output cannot conceal missing or failed course outcomes', () => {
  const failed = course(); failed[0].outcome = 'error'; assert.throws(() => validateLiveEvidence('course', failed));
  assert.throws(() => validateLiveEvidence('course', course().slice(1)));
  assert.throws(() => validateLiveEvidence('course', [...course(), course()[0]]));
});
test('requires confirmed interruption and independent archival', () => {
  const interrupted = course(); interrupted[1].interruption = 'unconfirmed'; assert.throws(() => validateLiveEvidence('course', interrupted));
  const retained = course(); retained.at(-1).usage.archived = false; assert.throws(() => validateLiveEvidence('course', retained));
  const skill = learning(); skill[4].archivalVerified = false; assert.throws(() => validateLiveEvidence('learning', skill));
  const python = host(); python.at(-1).sessions[1].archived = false; assert.throws(() => validateLiveEvidence('host', python));
});
test('retained reports must be verified in the same closed session', () => {
  const reports = course(); reports.at(-1).sessionId = 'different-session'; assert.throws(() => validateLiveEvidence('course', reports));
  const unverified = course(); unverified.at(-1).turns = [{ outcome: 'error', reportPresent: false }, turn]; assert.throws(() => validateLiveEvidence('course', unverified));
});
test('team completion requires host acceptance, all merged work and no unresolved review', () => {
  for (const change of [r => { r.releaseGate.ready = false; }, r => { r.allArchived = false; }, r => { r.questions = ['review']; },
    r => { r.tasks[0].state = 'blocked'; }]) {
    const records = team(); change(records[0]); assert.throws(() => validateLiveEvidence('team', records));
  }
});
test('live entrypoint refuses missing opt-in and invalid suite before provider work', () => {
  for (const args of [[], ['--execute-authorized-live-tests', '--suite=unknown']]) {
    const result = spawnSync(process.execPath, ['scripts/run-live-audit.mjs', ...args], { encoding: 'utf8', env: {}, windowsHide: true });
    assert.notEqual(result.status, 0); assert.doesNotMatch(result.stdout, /Starting bounded live suite/);
  }
});
test('failed team summaries retain gate and cleanup evidence while excluding raw content', () => {
  const secret = 'private-report-canary';
  const result = failedLiveEvidence('team', [{ finished: true, state: 'draft', allArchived: true, sessions: 5,
    questions: [secret], releaseGate: { ready: false, unmet: ['unresolved questions', secret] },
    tasks: [{ id: 'T2', state: 'merged', checks: [{ pass: false, detail: secret }], report: secret }], sessionId: secret }], 1);
  assert.equal(result.passed, false); assert.equal(result.allArchived, true); assert.equal(result.questionCount, 1);
  assert.deepEqual(result.unmet, ['unresolved questions', 'other gate']); assert.equal(result.tasks[0].failedChecks, 1);
  assert.ok(!JSON.stringify(result).includes(secret));
  const absent = failedLiveEvidence('team', [], null); assert.equal(absent.completionObserved, false); assert.equal(absent.allArchived, false);
});
test('invalid shared settings and team versions stop during preflight without starting a suite', async () => {
  const base = { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'offline-probe',
    CLAUDE_MANAGED_AGENT_ID: 'fixture-agent', CLAUDE_MANAGED_ENVIRONMENT_ID: 'fixture-environment' };
  const roles = Object.fromEntries(['PLANNER', 'DEVELOPER', 'REVIEWER'].flatMap(role => [
    [`LAB75_${role}_AGENT_ID`, 'fixture-role'], [`LAB75_${role}_AGENT_VERSION`, 'invalid'],
  ]));
  for (const [suite, extra] of [['course', { MANAGED_DEADLINE_MS: 'invalid' }], ['team', { LAB75_ANTHROPIC_API_KEY: 'offline-probe', ...roles }]]) {
    const env = { ...base, ...extra };
    if (suite === 'team') { delete env.ANTHROPIC_API_KEY; delete env.CLAUDE_MANAGED_AGENT_ID; }
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/run-live-audit.mjs', '--execute-authorized-live-tests', `--suite=${suite}`], {
      encoding: 'utf8', env, windowsHide: true,
    });
    const summary = JSON.parse(result.stdout.trim());
    assert.match(summary.evidenceDirectory, /^artifacts\/ci\/live-[0-9a-f-]+$/);
    try {
      assert.equal(result.status, 1); assert.doesNotMatch(result.stdout, /Starting bounded live suite/);
      assert.equal(summary.passed, false); assert.equal(summary.failureAt, 'preflight'); assert.deepEqual(summary.results, []);
    } finally {
      // Do not leave deliberately failed fixture summaries in the CI upload glob.
      await unlink(`${summary.evidenceDirectory}/summary.json`);
      await unlink(`${summary.evidenceDirectory}/runner.error.log`);
      await rmdir(summary.evidenceDirectory);
    }
  }
});
