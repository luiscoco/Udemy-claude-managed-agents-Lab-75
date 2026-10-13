import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
// @ts-expect-error Standalone distribution utility is JavaScript.
import { forbiddenPath, scanFiles } from '../scripts/scan-distribution.mjs';

test('distribution blocks secret patterns and runtime paths without reading .env', async () => {
  const root = await mkdtemp(join(tmpdir(), 'distribution-'));
  try {
    await writeFile(join(root, 'safe.txt'), 'authored teaching content');
    await writeFile(join(root, 'unsafe.txt'), ['sk', 'ant', 'A'.repeat(40)].join('-'));
    assert.deepEqual(await scanFiles(['safe.txt'], root), []);
    assert.equal((await scanFiles(['unsafe.txt'], root)).length, 1);
    // .env does not exist: rejection must happen before any file read.
    assert.equal((await scanFiles(['.env'], root)).length, 1);
    for (const path of ['sessions/run.json', 'sandbox/result.ts', 'server/demo-lab/output.ts', 'workspaces/run/file.ts']) assert(forbiddenPath(path));
    assert.equal(forbiddenPath('.env.example'), false);
  } finally { await rm(root, { recursive: true, force: true }); }
});
