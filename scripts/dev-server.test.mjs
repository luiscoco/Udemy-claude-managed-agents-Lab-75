import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, stat, utimes, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { sourceFingerprint, supervise, stopChild } from './dev-server.mjs';

test('workspace aliases preserve source tracking while linked source roots stay excluded', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'foundation-alias-'));
  const root = join(parent, 'actual'), alias = join(parent, 'alias'), empty = join(parent, 'empty');
  try {
    await mkdir(join(root, 'server'), { recursive: true }); await mkdir(empty);
    await writeFile(join(root, 'server', 'fixture.ts'), 'export const value = 1;');
    await symlink(root, alias, process.platform === 'win32' ? 'junction' : 'dir');
    const before = await sourceFingerprint(alias);
    assert.equal(before, await sourceFingerprint(root));
    assert.notEqual(before, await sourceFingerprint(empty));
    await writeFile(join(root, 'server', 'fixture.ts'), 'export const value = 2;');
    assert.notEqual(await sourceFingerprint(alias), before);
    await symlink(join(root, 'server'), join(empty, 'server'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal(await sourceFingerprint(empty), await sourceFingerprint(join(parent, 'absent')));
  } finally {
    const target = resolve(parent);
    assert.equal(dirname(target), resolve(tmpdir()));
    assert.ok(basename(target).startsWith('foundation-alias-'));
    await rm(target, { recursive: true, force: true });
  }
});

test('reads and sandbox outputs are inert; same-size, same-mtime source edit restarts and closes children', { timeout: 15000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'foundation-watch-'));
  const children = [];
  let supervisor;
  try {
    await mkdir(join(root, 'server', 'sandbox'), { recursive: true });
    const source = join(root, 'server', 'fixture.ts');
    await writeFile(source, 'export const value = 1;');
    const metadata = await stat(source);
    const original = await sourceFingerprint(root);
    supervisor = await supervise({ root, pollMs: 50, log: () => {}, startChild() {
      const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
      children.push(child);
      return child;
    } });
    await readFile(source);
    await writeFile(join(root, 'server', 'sandbox', 'generated.ts'), 'generated output');
    assert.equal(await sourceFingerprint(root), original);
    await delay(250);
    assert.equal(children.length, 1);
    await writeFile(source, 'export const value = 2;');
    await utimes(source, metadata.atime, metadata.mtime);
    assert.equal((await stat(source)).size, metadata.size);
    assert.notEqual(await sourceFingerprint(root), original);
    const deadline = Date.now() + 4000;
    while (children.length < 2 && Date.now() < deadline) await delay(25);
    assert.equal(children.length, 2, 'content edit must restart');
    assert(children[0].exitCode !== null || children[0].signalCode !== null);
    await delay(250);
    assert.equal(children.length, 2, 'only one restart');
    await supervisor.close();
    assert(children.every(child => child.exitCode !== null || child.signalCode !== null));
  } finally {
    await supervisor?.close();
    await Promise.all(children.map(stopChild));
    await rm(root, { recursive: true, force: true });
  }
});
