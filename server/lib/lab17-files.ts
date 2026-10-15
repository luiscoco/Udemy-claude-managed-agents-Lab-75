import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, rename, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { lab17FileSchema } from '../../shared/lab17-checkpointing.js';
import type { Lab17File, Lab17Plan } from '../../shared/lab17-checkpointing.js';

export const lab17Tracked = ['notes.md', 'draft.md'] as const;
export const lab17Names = [...lab17Tracked, 'scratch.md'] as const;
export type Lab17Name = (typeof lab17Names)[number];
export const initialNotes = 'Status: draft\nProject: Aurora Finch\n';
const workspace = resolve(process.cwd());
const base = join(workspace, 'generated', 'lab17');
const hash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
export function lab17Hash(text: string) { return hash(text); }
function inside(parent: string, child: string) { const rel = relative(parent, child); return rel === '' || rel !== '..' && !rel.startsWith(`..${requireSeparator()}`) && !isAbsolute(rel); }
function requireSeparator() { return process.platform === 'win32' ? '\\' : '/'; }
async function denyLink(path: string) { try { if ((await lstat(path)).isSymbolicLink()) throw new Error('Symbolic links are outside the fixture scope.'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; } }
async function safeDirectory(path: string) { await denyLink(path); await mkdir(path, { recursive: false }); }

export async function createLab17Tree(runId: string) {
  if (!/^[0-9a-f-]{36}$/.test(runId)) throw new Error('Invalid run ID.');
  const generated = join(workspace, 'generated');
  await denyLink(generated); await mkdir(generated, { recursive: true });
  await denyLink(base); await mkdir(base, { recursive: true });
  const root = join(base, runId); await safeDirectory(root);
  const actual = await realpath(root); if (!inside(workspace, actual)) throw new Error('Fixture directory escaped the workspace.');
  await writeFile(join(root, 'notes.md'), initialNotes, { encoding: 'utf8', flag: 'wx' });
  await mkdir(join(root, 'snapshots'));
  return root;
}

export async function lab17Path(root: string, name: Lab17Name) {
  if (!lab17Names.includes(name)) throw new Error('Path is outside the fixture allowlist.');
  const actualRoot = await realpath(root); if (!inside(base, actualRoot)) throw new Error('Fixture root escaped the workspace.');
  const path = join(actualRoot, name); if (!inside(actualRoot, path)) throw new Error('Path escaped the fixture root.');
  await denyLink(path); return path;
}
export async function readLab17(root: string, name: Lab17Name): Promise<string | null> {
  const path = await lab17Path(root, name);
  try { return await readFile(path, 'utf8'); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
}
export async function writeLab17(root: string, name: Lab17Name, content: string) {
  if (Buffer.byteLength(content, 'utf8') > 500) throw new Error('Fixture content exceeds 500 bytes.');
  const path = await lab17Path(root, name);
  const temporary = join(root, `.${name}.${randomUUID()}.tmp`);
  await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
  try { await rename(temporary, path); } catch (error) { await unlink(temporary).catch(() => {}); throw error; }
}
export async function deleteLab17(root: string, name: Lab17Name) {
  const path = await lab17Path(root, name);
  try { await unlink(path); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
}
export async function lab17Files(root: string): Promise<Lab17File[]> {
  const rows = await Promise.all(lab17Names.map(async name => {
    const content = await readLab17(root, name);
    return lab17FileSchema.parse({ path: name, tracked: name !== 'scratch.md', exists: content !== null,
      hash: content === null ? null : hash(content), content });
  })); return rows;
}
export async function persistLab17Snapshot(root: string, snapshotId: string, contents: Record<'notes.md' | 'draft.md', string | null>) {
  if (!/^[0-9a-f-]{36}$/.test(snapshotId)) throw new Error('Invalid snapshot ID.');
  const folder = join(root, 'snapshots'); await denyLink(folder); const path = join(folder, `${snapshotId}.json`);
  await writeFile(path, JSON.stringify(contents), { encoding: 'utf8', flag: 'wx' });
}
export async function lab17Changes(root: string, contents: Record<'notes.md' | 'draft.md', string | null>): Promise<Lab17Plan['changes']> {
  const changes: Lab17Plan['changes'] = [];
  for (const name of lab17Tracked) {
    const current = await readLab17(root, name), target = contents[name];
    if (current === target) continue;
    changes.push({ path: name, operation: target === null ? 'delete' : 'restore',
      fromHash: current === null ? null : hash(current), toHash: target === null ? null : hash(target) });
  }
  return changes;
}
export async function applyLab17Changes(root: string, plan: Lab17Plan, contents: Record<'notes.md' | 'draft.md', string | null>) {
  const fresh = await lab17Changes(root, contents);
  if (JSON.stringify(fresh) !== JSON.stringify(plan.changes)) throw new Error('Fixture files changed after dry run.');
  for (const change of plan.changes) {
    const content = contents[change.path];
    if (content === null) await deleteLab17(root, change.path);
    else await writeLab17(root, change.path, content);
  }
}
