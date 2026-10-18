import assert from 'node:assert/strict';

// Keep failed-run evidence useful without uploading reports, prompts, IDs or tool output.
export function failedLiveEvidence(suite, records, exitCode) {
  const result = { suite, passed: false, exitCode: Number.isInteger(exitCode) ? exitCode : null };
  if (suite !== 'team') return result;
  const final = records.findLast(record => record.finished === true);
  const states = new Set(['ready', 'draft', 'completed', 'running', 'cancelled', 'interrupted', 'failed', 'blocked', 'merged', 'verified', 'pending']);
  const gates = new Set(['valid plan', 'unresolved questions', 'all tasks merged', 'protected files unchanged', 'integration tests',
    'host acceptance probes', 'review without open high findings', 'known costs within budget']);
  return { ...result, completionObserved: Boolean(final), state: states.has(final?.state) ? final.state : 'unknown',
    releaseReady: final?.releaseGate?.ready === true, allArchived: final?.allArchived === true,
    sessions: Number.isSafeInteger(final?.sessions) && final.sessions >= 0 && final.sessions <= 12 ? final.sessions : null,
    questionCount: Array.isArray(final?.questions) ? final.questions.length : null,
    unmet: Array.isArray(final?.releaseGate?.unmet) ? final.releaseGate.unmet.map(gate => gates.has(gate) ? gate : 'other gate') : [],
    tasks: Array.isArray(final?.tasks) ? final.tasks.slice(0, 4).map(task => ({
      id: /^T[1-9]$/.test(task.id) ? task.id : 'unknown', state: states.has(task.state) ? task.state : 'unknown',
      failedChecks: Array.isArray(task.checks) ? task.checks.filter(check => check.pass !== true).length : null,
    })) : [],
  };
}

// A zero process exit code alone does not prove a live scenario or its cleanup passed.
export function validateLiveEvidence(suite, records) {
  const one = (predicate, label) => {
    const found = records.filter(predicate);
    assert.equal(found.length, 1, `Missing or duplicate ${label}`);
    return found[0];
  };
  const archived = values => {
    assert.ok(values.length > 0 && values.every(value => value.archived === true), 'Remote archival must be confirmed');
  };
  if (suite === 'course') {
    for (const [scenario, outcome] of [['completion', 'completed'], ['cancel-after-send', 'cancelled'], ['deadline', 'deadline']]) {
      const result = one(r => r.lesson === 1 && r.scenario === scenario, scenario);
      assert.equal(result.source, 'managed-api'); assert.equal(result.outcome, outcome);
      assert.equal(result.cleanup, 'archived'); archived([result.usage]);
      if (scenario === 'completion') assert.equal(result.markerVerified, true);
      else assert.equal(result.interruption, 'confirmed');
    }
    const first = one(r => r.scenario === 'first-report', 'first report');
    const last = one(r => r.scenario === 'validated-report-continuation-and-close', 'retained report');
    assert.ok(first.sessionId && first.sessionId === last.sessionId && last.sameSession === true);
    assert.equal(last.source, 'managed-api'); assert.equal(last.stateBeforeClose, 'idle');
    assert.equal(last.stateAfterClose, 'closed'); assert.equal(last.cleanup, 'archived'); archived([last.usage]);
    assert.equal(first.turns?.length, 1); assert.equal(last.turns?.length, 2);
    assert.ok([...first.turns, ...last.turns].every(turn => turn.outcome === 'verified' && turn.reportPresent === true));
    return { suite, passed: true, sessions: 4 };
  }
  if (suite === 'learning') {
    const expected = [[2, 'previews-true'], [2, 'previews-false'], [9, 'custom-instructions'],
      [11, 'without-skill'], [11, 'with-skill'], [11, 'revised-version']];
    for (const [lesson, scenario] of expected) {
      const result = one(r => r.lesson === lesson && r.scenario === scenario, scenario);
      assert.equal(result.passed, true); assert.equal(result.source, 'managed-api');
      assert.equal(result.outcome, 'completed'); assert.equal(result.cleanup, 'archived');
      assert.equal(result.archivalVerified, true);
    }
    return { suite, passed: true, sessions: 6 };
  }
  if (suite === 'host') {
    const patch = one(r => r.scenario === 'backend-patch', 'backend patch');
    assert.equal(patch.state, 'completed'); assert.equal(patch.patchValidated, true); assert.equal(patch.cleanup, 'archived');
    assert.equal(one(r => r.scenario === 'host-apply', 'host apply').appliedOnce, true);
    for (const operation of ['retained-start', 'retained-turn', 'close', 'one-shot']) {
      const result = one(r => r.operation === operation, operation);
      assert.equal(result.state, 'completed');
      assert.equal(result.result?.cleanup, ['close', 'one-shot'].includes(operation) ? 'archived' : 'confirmed-idle-retained');
      if (operation === 'one-shot') assert.ok(result.toolCalls > 0);
    }
    const audit = one(r => r.scenario === 'final-cleanup-audit', 'host cleanup audit');
    assert.equal(audit.allArchived, true); assert.equal(audit.sessions?.length, 3); archived(audit.sessions);
    assert.ok(!records.some(r => r.outcome === 'failed'));
    return { suite, passed: true, sessions: 3 };
  }
  if (suite === 'team') {
    const result = one(r => r.finished === true, 'team completion');
    assert.equal(result.state, 'ready'); assert.equal(result.releaseGate?.ready, true);
    assert.equal(result.allArchived, true); assert.ok(result.sessions >= 5 && result.sessions <= 9);
    assert.equal(result.tasks?.length, 3); assert.ok(result.tasks.every(task => task.state === 'merged'));
    assert.equal(result.questions?.length, 0);
    return { suite, passed: true, sessions: result.sessions, reportedListCents: result.reportedListCents };
  }
  throw new Error('Unknown live suite');
}
