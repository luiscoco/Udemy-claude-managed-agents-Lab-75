import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, symlink, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrWorkshop, routeFindings, parseDiff, numberedDiff, checkedPath, runProcess, testGaming, hostGit } from '../server/lib/lab73-prbot';
const diff = 'diff --git a/src/a.mjs b/src/a.mjs\n--- a/src/a.mjs\n+++ b/src/a.mjs\n@@ -1,2 +1,2 @@\n old\n-bad\n+good\n';
test('changed line mapping routes only eligible findings; questions and unrelated lines need a human', () => {
  assert.deepEqual(parseDiff(diff), [{ file: 'src/a.mjs', line: 2, text: 'good' }]); assert.equal(numberedDiff(diff), 'src/a.mjs:2 + good');
  const finding = { file: 'src/a.mjs', line: 2, severity: 'high', confidence: 'high', message: 'Bug', question: false };
  const result = routeFindings({ findings: [finding, { ...finding, line: 1 }, { ...finding, question: true }, { ...finding, confidence: 'low' }] }, diff);
  assert.equal(result.automated.length, 1); assert.equal(result.human.length, 3); assert.throws(() => routeFindings({ findings: [{ ...finding, extra: true }] }, diff));
});
test('real fixture fix commits only after tests, preserves main and owner boundaries', async () => {
  const store = new PrWorkshop(), created = await store.create('owner', 'good-fix'); const result = await store.run('owner', created.id);
  assert.equal(result.state, 'ready'); assert.equal(result.commits.length, 1); assert.ok(result.gates.every(gate => gate.pass));
  const root = resolve('prbot-lab/runs', created.id); assert.equal(await hostGit(root, 'rev-parse', 'main'), created.base);
  assert.match(await store.patch('owner', created.id), /Math.round.*100/); assert.throws(() => store.get('foreign', created.id), /not found/);
  assert.equal(store.policy('reviewer', 'write_assigned_file', 'src/price.mjs').allowed, false);
  await assert.rejects(store.tool('owner', created.id, { name: 'write_assigned_file', input: { file: 'src/price.mjs', text: 'bad' } }, 'reviewer'));
  store.close();
});
test('out-of-scope, gaming, unresolved, malformed review and timeout stop with draft and no fix commit', async () => {
  const store = new PrWorkshop();
  for (const scenario of ['out-of-scope', 'skipped-tests', 'unresolved', 'malformed-review', 'timeout'] as const) {
    const created = await store.create('owner', scenario), result = await store.run('owner', created.id);
    assert.equal(result.state, 'draft', scenario); assert.equal(result.commits.length, 0); assert.ok(result.gates.some(gate => !gate.pass)); assert.match(result.report, /Status: draft/);
  } store.close();
});
test('fixed process runner scrubs provider credentials, enforces timeout, path and gaming policies', async () => {
  await mkdir('artifacts/lab73', { recursive: true }); const root = await mkdtemp(resolve('artifacts/lab73/check-'));
  const child = await runProcess(process.execPath, ['-e', "process.stdout.write(String(Object.keys(process.env).some(k=>/ANTHROPIC|API_KEY/.test(k))))"], root); assert.equal(child.text, 'false');
  const timeout = await runProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], root, 30); assert.equal(timeout.timedOut, true);
  await mkdir(resolve(root, 'src')); await writeFile(resolve(root, 'src/a.mjs'), '');
  await assert.rejects(checkedPath(root, '../outside', ['../outside'])); await assert.rejects(checkedPath(root, '.git/config', ['src/a.mjs']));
  assert.equal(await checkedPath(root, 'src/a.mjs', ['src/a.mjs']), resolve(root, 'src/a.mjs'));
  await symlink(resolve(root, 'src'), resolve(root, 'link'), process.platform === 'win32' ? 'junction' : 'dir');
  try { await assert.rejects(checkedPath(root, 'link/a.mjs', ['link/a.mjs']), /Link path rejected/); } finally { await unlink(resolve(root, 'link')); }
  for (const source of ['test.skip(', 'test . only(', 'it.todo(', 'test("x",{skip:true},fn)']) assert.equal(testGaming(source), true);
});
