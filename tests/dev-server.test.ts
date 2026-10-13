import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile, utimes } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import { childEnvironment, sourceFingerprint, supervise } from '../scripts/dev-server.mjs';

test('content supervisor restarts once for source edits, ignores reads and generated outputs, and closes children', { timeout: 15_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'f01-watch-'));
  let supervisor: Awaited<ReturnType<typeof supervise>> | undefined;
  const children: ReturnType<typeof spawn>[] = [];
  const logs: string[] = [];
  const waitForStarts = async (count: number) => {
    const deadline = Date.now() + 3_000;
    while (children.length < count && Date.now() < deadline) await delay(25);
    assert.equal(children.length, count);
  };
  try {
    await mkdir(join(root, 'server'));
    const source = join(root, 'server', 'fixture.ts');
    await writeFile(source, 'export const value = 1;');
    const original = await sourceFingerprint(root);
    supervisor = await supervise({ root, pollMs: 80, log: message => logs.push(message), startChild: () => {
      const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
      children.push(child);
      return child;
    } });
    await readFile(source);
    await utimes(source, new Date(), new Date());
    await mkdir(join(root, 'server', 'sample-lab'));
    await writeFile(join(root, 'server', 'sample-lab', 'generated.ts'), 'generated');
    await mkdir(join(root, 'server', 'sandbox'));
    await writeFile(join(root, 'server', 'sandbox', 'output.ts'), 'output');
    await writeFile(join(root, 'server', 'output.log'), 'output');
    assert.equal(await sourceFingerprint(root), original);
    await delay(350);
    assert.equal(children.length, 1);
    await writeFile(source, 'export const value = 2;');
    await waitForStarts(2);
    await delay(350);
    assert.equal(children.length, 2);
    assert.equal(logs.filter(line => line.includes('restarting')).length, 1);
    assert(children[0]?.exitCode !== null || children[0]?.signalCode !== null);

    await mkdir(join(root, 'mcp-servers'));
    const mcp = join(root, 'mcp-servers', 'fixture.ts');
    await writeFile(mcp, 'export {};');
    await waitForStarts(3);
    await rm(mcp);
    await waitForStarts(4);
    await Promise.all([supervisor.close(), supervisor.close()]);
    assert(children.every(child => child.exitCode !== null || child.signalCode !== null));
  } finally {
    await supervisor?.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('child environment strips dependency reporting without mutating the parent', () => {
  const input = { WATCH_REPORT_DEPENDENCIES: '1', watch_report_dependencies: '1', F01_FAKE_CANARY: 'fictional' };
  assert.deepEqual(childEnvironment(input), { F01_FAKE_CANARY: 'fictional' });
  assert.equal(input.WATCH_REPORT_DEPENDENCIES, '1');
});
