import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { DocgenWorkshop, authoredSpec, inspectDocx } from '../server/lib/lab72-docgen';
// Deliberately load the public deterministic builder separately from the host inspector.
const builder = await import('../docgen-skills/atmira-docx/scripts/build-docx.mjs' as string);
test('deterministic bytes, real package styles and independently restarting numbered lists', async () => {
  const spec = authoredSpec('ordinary'); const first: Buffer = builder.buildDocx(spec), second: Buffer = builder.buildDocx(spec);
  assert.deepEqual(first, second); const check = inspectDocx(first, spec); assert.equal(check.valid, true); assert.equal(check.parts, 9); assert.equal(check.incidentApplicable, false);
  assert.equal((first.toString().match(/<w:startOverride w:val="1"\/>/g) ?? []).length, 2);
  await mkdir('artifacts/lab72', { recursive: true }); await writeFile('artifacts/lab72/ordinary.docx', first);
  assert.equal(createHash('sha256').update(first).digest('hex'), check.sha256);
});
test('markup is literal XML-escaped text, not an active document element', () => {
  const spec = authoredSpec(); spec.blocks.push({ type: 'paragraph', text: '<script> & "quotes" and \'single\'' });
  const bytes = builder.buildDocx(spec); assert.ok(bytes.toString().includes('&lt;script&gt; &amp; &quot;quotes&quot; and &apos;single&apos;'));
  assert.equal(inspectDocx(bytes, spec).valid, true);
  const corrupt = Buffer.from(bytes); corrupt[100] = corrupt[100]! ^ 1; assert.equal(inspectDocx(corrupt, spec).valid, false);
});
test('invalid structures, extra fields and incident sections are SPEC errors, CLI exits 2', async () => {
  for (const spec of [{ ...authoredSpec(), extra: true }, { ...authoredSpec(), blocks: [] }, { ...authoredSpec(), date: '2026-02-30' }, { ...authoredSpec(), blocks: authoredSpec().blocks.slice(2) }]) assert.throws(() => builder.buildDocx(spec), /SPEC ERROR/);
  await mkdir('artifacts/lab72', { recursive: true }); await writeFile('artifacts/lab72/invalid.json', '{}');
  const child = spawnSync(process.execPath, ['docgen-skills/atmira-docx/scripts/build-docx.mjs', '--spec', 'artifacts/lab72/invalid.json', '--out', 'artifacts/lab72/invalid.docx']);
  assert.equal(child.status, 2); assert.match(child.stderr.toString(), /SPEC ERROR \$/);
});
test('closed custom tools, owner boundaries, ordinary vs incident contract and opaque downloads', async () => {
  const workshop = new DocgenWorkshop(); const created = await workshop.create('owner', 'incident'); const result = await workshop.scripted('owner', created.id);
  assert.equal(result.state, 'verified'); assert.equal(result.events.length, 4); assert.ok(result.fileId); assert.equal(result.verification?.incidentApplicable, true);
  const bytes = await workshop.file('owner', created.id, result.fileId!); await writeFile('artifacts/lab72/incident.docx', bytes);
  assert.throws(() => workshop.get('other', created.id), /not found/);
  await assert.rejects(workshop.file('owner', created.id, 'document.docx'), /not found/);
  await assert.rejects(workshop.tool('owner', created.id, { name: 'build_document', input: { command: 'echo unsafe' } }));
  assert.deepEqual(workshop.policy('build_document && echo unsafe').executed, false);
  assert.equal(inspectDocx(builder.buildDocx(authoredSpec('ordinary')), { ...authoredSpec('ordinary'), kind: 'incident' }).incidentValid, false);
  assert.equal(workshop.cancel('owner', created.id).remoteSession, false); workshop.close();
});
test('injection is treated as notes, placeholders and skill tampering cannot get download IDs', async () => {
  const workshop = new DocgenWorkshop();
  for (const scenario of ['injection', 'placeholder', 'skill-tamper', 'invalid-spec'] as const) {
    const created = await workshop.create('owner', scenario), result = await workshop.scripted('owner', created.id);
    assert.equal(result.state, scenario === 'injection' ? 'verified' : 'rejected');
    if (scenario === 'injection') { assert.doesNotMatch(result.verification!.text, /DEMO_TOKEN|Ignore the contract/); assert.match(result.verification!.text, /120.*145/); }
    else assert.equal(result.fileId, undefined);
  }
  workshop.close();
});
test('skill ZIP packaging is deterministic and never uploads', async () => {
  execFileSync(process.execPath, ['scripts/lab72-skill-package.mjs']); const first = await readFile('artifacts/lab72/atmira-docx.zip');
  execFileSync(process.execPath, ['scripts/lab72-skill-package.mjs']); assert.deepEqual(await readFile('artifacts/lab72/atmira-docx.zip'), first);
});
