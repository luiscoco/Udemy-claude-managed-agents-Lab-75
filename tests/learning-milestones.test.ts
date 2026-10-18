import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import express from 'express';
import { learningMilestones } from '../shared/learning-milestones';
import { createLearningMilestonesRouter, learningMilestoneArchive } from '../server/routes/learning-milestones';

function zipMembers(bytes: Buffer) {
  const files = new Map<string, Buffer>(); let offset = 0;
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    assert.equal(bytes.readUInt16LE(offset + 8), 0);
    const length = bytes.readUInt16LE(offset + 26), extra = bytes.readUInt16LE(offset + 28), size = bytes.readUInt32LE(offset + 18);
    const name = bytes.subarray(offset + 30, offset + 30 + length).toString('utf8');
    const start = offset + 30 + length + extra; files.set(name, bytes.subarray(start, start + size)); offset = start + size;
  }
  assert.equal(bytes.readUInt32LE(offset), 0x02014b50); return files;
}

test('each downloadable project contains only its four authored starter files, never the reference solution', async () => {
  for (const project of learningMilestones) {
    const zip = await learningMilestoneArchive(project.id), files = zipMembers(zip);
    const names = ['README.md', 'package.json', 'starter.ts', 'starter.test.mjs'];
    assert.deepEqual([...files.keys()].sort(), names.map(name => `${project.id}/${name}`).sort());
    for (const name of names) assert.deepEqual(files.get(`${project.id}/${name}`), await readFile(`fixtures/learning-milestones/${project.id}/${name}`));
    assert.match(files.get(`${project.id}/starter.ts`)!.toString(), /Not implemented/);
    assert.equal([...files.keys()].some(name => /reference|\.env|credential/i.test(name)), false);
    assert.equal(JSON.parse(files.get(`${project.id}/package.json`)!.toString()).dependencies, undefined);
  }
  await assert.rejects(learningMilestoneArchive('../.env'), /Unknown/);
});

test('download route serves ZIP attachments and does not expose references or execution endpoints', async () => {
  const app = express(); app.use('/milestones', createLearningMilestonesRouter());
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try { const base = `http://127.0.0.1:${address.port}/milestones`;
    const response = await fetch(`${base}/event-viewer/starter.zip`);
    assert.equal(response.status, 200); assert.match(response.headers.get('content-type')!, /application\/zip/);
    assert.match(response.headers.get('content-disposition')!, /attachment/);
    assert.equal(zipMembers(Buffer.from(await response.arrayBuffer())).size, 4);
    for (const path of ['unknown/starter.zip', 'event-viewer/reference.ts']) assert.equal((await fetch(`${base}/${path}`)).status, 404);
    assert.equal((await fetch(`${base}/event-viewer/run`, { method: 'POST', body: 'arbitrary code' })).status, 404);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('reference downloads contain runnable solutions and walkthroughs without changing starters', async () => {
  for (const project of learningMilestones) {
    const files = zipMembers(await learningMilestoneArchive(project.id, 'reference'));
    assert.deepEqual([...files.keys()].sort(), ['README.md', 'WALKTHROUGH.md', 'package.json', 'starter.ts', 'starter.test.mjs'].map(name => `${project.id}/${name}`).sort());
    assert.deepEqual(files.get(`${project.id}/starter.ts`), await readFile(`fixtures/learning-milestones/${project.id}/reference.ts`));
    assert.deepEqual(files.get(`${project.id}/starter.test.mjs`), await readFile(`fixtures/learning-milestones/${project.id}/starter.test.mjs`));
    assert.match(files.get(`${project.id}/README.md`)!.toString(), /Expected:/);
    assert.match(files.get(`${project.id}/WALKTHROUGH.md`)!.toString(), /passed, 0 failed/);
    assert.doesNotMatch(files.get(`${project.id}/starter.ts`)!.toString(), /Not implemented/);
  }
  await assert.rejects(learningMilestoneArchive('event-viewer', '../reference' as 'reference'), /Unknown milestone variant/);
});
