import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { learningMilestones, milestoneStarterFiles } from '../shared/learning-milestones.js';

const exec = promisify(execFile), root = `artifacts/learning-guide/milestone-checks/${crypto.randomUUID()}`;
const results: { project: string; starterFailsAsExpected: boolean; referencePasses: boolean }[] = [];
const environment = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP, NODE_NO_WARNINGS: '1' };
for (const project of learningMilestones) {
  const source = join('fixtures/learning-milestones', project.id), destination = join(root, project.id);
  await mkdir(destination, { recursive: true });
  for (const name of milestoneStarterFiles) await copyFile(join(source, name), join(destination, name));
  const execute = async () => { try { await exec(process.execPath, ['--test', 'starter.test.mjs'], { cwd: destination, timeout: 15000, maxBuffer: 1024 * 1024, env: environment }); return true; }
    catch (error) { const failure = error as { code?: unknown; killed?: boolean }; if (failure.code === 1 && !failure.killed) return false; throw new Error('Milestone test process could not complete.'); } };
  const starterPasses = await execute();
  const reference = await readFile(join(source, 'reference.ts')); await writeFile(join(destination, 'starter.ts'), reference);
  const referencePasses = await execute();
  results.push({ project: project.id, starterFailsAsExpected: !starterPasses, referencePasses });
}
await mkdir(root, { recursive: true }); await writeFile(join(root, 'results.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify({ results, providerCalls: 0, learnerFilesExecuted: false }));
if (results.some(item => !item.starterFailsAsExpected || !item.referencePasses)) process.exitCode = 1;
