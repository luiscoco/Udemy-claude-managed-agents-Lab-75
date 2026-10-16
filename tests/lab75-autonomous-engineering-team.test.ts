import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { goodPlan, validatePlan, planPreset } from '../server/team/team';
import { Board, decide, createHandlers } from '../server/team/policy';
import { TeamWorkshop } from '../server/team/orchestrator';
import { hostGit } from '../server/lib/lab73-prbot';
import { Journal } from '../server/team/journal';
test('closed plans enforce graph, ownership, protected paths and existing tests before workers', () => {
  assert.deepEqual(validatePlan(goodPlan).waves, [['T1'], ['T2', 'T3']]); assert.deepEqual(validatePlan(planPreset('sequential')).waves, [['T1'], ['T2'], ['T3']]);
  for (const preset of ['protected-deletion', 'duplicate-owner', 'cycle', 'existing-test', 'malformed']) { const result = validatePlan(planPreset(preset)); assert.equal(result.valid, false, preset); assert.ok(result.errors.length); }
  assert.match(validatePlan(planPreset('cycle')).errors.join(' '), /T1 -> T2 -> T1/);
});
test('role and board policies reject cross-owner/protected writes, unknown peers, duplicates and limits', () => {
  assert.equal(decide('reviewer', 'write_file', { path: 'src/tags.mjs' }, goodPlan.tasks[0]).allowed, false);
  assert.equal(decide('developer', 'write_file', { path: 'src/search.mjs' }, goodPlan.tasks[0]).allowed, false);
  assert.equal(decide('developer', 'write_file', { path: '.github/workflows/ci.yml' }, goodPlan.tasks[0]).allowed, false);
  assert.equal(decide('developer', 'read_file', { path: '../.env' }).allowed, false);
  const board = new Board(['T1', 'T2']); const message = { id: 'one', to: 'T2', text: 'Untrusted peer text' };
  board.send('T1', message); board.send('T1', message); assert.equal(board.snapshot().length, 1); assert.equal(board.read('T2')[0]?.untrusted, true);
  assert.throws(() => board.send('T1', { ...message, text: 'different' }), /conflicts/); assert.throws(() => board.send('T1', { ...message, id: 'two', to: 'T9' }), /Unknown/);
  for (let i = 2; i <= 6; i++) board.send('T1', { ...message, id: String(i) }); assert.throws(() => board.send('T1', { ...message, id: '7' }), /limit/);
});
test('happy path uses real Git/Node, review rework, commit trailers and independent holdouts', async () => {
  const store = new TeamWorkshop(), created = await store.create('owner', { mode: 'scripted', scenario: 'happy-rework', maxParallel: 2, budgetCents: 30 }); const result = await store.start('owner', created.id);
  assert.equal(result.releaseGate.ready, true, JSON.stringify(result)); assert.equal(result.tasks.find(task => task.id === 'T3')?.reworks, 1);
  assert.equal(result.holdouts.length, 4); assert.ok(result.holdouts.every(probe => probe.pass)); assert.equal(result.totalCents, 7);
  const root = resolve('team-lab/runs', created.id); assert.equal(await hostGit(resolve(root, 'repo'), 'rev-parse', 'main'), result.base);
  const log = await hostGit(resolve(root, 'int'), 'log', '--format=%an%n%B', 'main..HEAD'); assert.match(log, /team-dev-T1/); assert.match(log, /Task: T3/); assert.match(log, /Plan-hash:/);
  assert.throws(() => store.get('foreign', created.id), /not found/);
  const handlers = createHandlers(resolve(root, 'int'), 'reviewer', undefined, new Board(['T1']), new AbortController().signal, () => {}); await assert.rejects(handlers('read_file', { path: 'src' }), /glob_files/);
  store.close();
});
test('crash after first wave resumes durably without repeating planner/T1 and retains exact costs', async () => {
  let store = new TeamWorkshop(); const created = await store.create('owner', { mode: 'scripted', scenario: 'crash-resume', maxParallel: 2, budgetCents: 30 }); const stopped = await store.start('owner', created.id);
  assert.equal(stopped.state, 'interrupted'); assert.equal(stopped.totalCents, 2); store.close(); store = new TeamWorkshop();
  const result = await store.resume('owner', created.id); assert.equal(result.releaseGate.ready, true, JSON.stringify(result)); assert.equal(result.totalCents, 5);
  assert.equal(result.calls.filter(call => call.role === 'planner').length, 1); assert.equal(result.calls.filter(call => call.role === 'developer:T1').length, 1);
  const root = resolve('team-lab/runs', created.id); const journal = new Journal(resolve(root, 'journal.jsonl')); assert.ok((await journal.load()).length > 10);
  await appendFile(resolve(root, 'journal.jsonl'), '{corrupt}\n'); await assert.rejects(journal.load()); store.close();
});
test('remaining scripted scenarios correct safe mistakes or fail release gates with retained evidence', async () => {
  const store = new TeamWorkshop();
  for (const scenario of ['injected-plan', 'cross-owner', 'test-gaming', 'hidden-boundary', 'budget-exhaustion'] as const) {
    const created = await store.create('owner', { mode: 'scripted', scenario, maxParallel: 2, budgetCents: 30 }), result = await store.start('owner', created.id);
    assert.equal(result.releaseGate.ready, ['injected-plan', 'cross-owner'].includes(scenario), JSON.stringify(result));
    if (scenario === 'test-gaming') { assert.ok(result.tasks.some(task => task.state === 'blocked')); assert.match(result.handoff, /team:needs-human/); }
    if (scenario === 'hidden-boundary') { assert.equal(result.integrationPass, true); assert.equal(result.holdouts.find(probe => probe.label === 'tag length boundary')?.pass, false); }
    if (scenario === 'budget-exhaustion') assert.equal(result.totalCents, 2);
    const ci = await readFile(resolve('team-lab/runs', created.id, 'repo/.github/workflows/ci.yml'), 'utf8'); assert.match(ci, /notes fixture/);
  } store.close();
});
