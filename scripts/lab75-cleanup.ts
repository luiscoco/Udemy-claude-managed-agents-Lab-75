import { readdir, lstat, realpath, rm } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { Journal } from '../server/team/journal.js';
const root = resolve('team-lab/runs'); let removed = 0;
async function noLinks(path: string): Promise<boolean> { for (const entry of await readdir(path, { withFileTypes: true })) {
  if (entry.isSymbolicLink()) return false; if (entry.isDirectory() && !await noLinks(resolve(path, entry.name))) return false;
} return true; }
for (const name of await readdir(root).catch(() => [] as string[])) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(name)) continue;
  const target = resolve(root, name), part = relative(root, target);
  if (part.startsWith('..') || isAbsolute(part) || (await lstat(target)).isSymbolicLink() || await realpath(target) !== target || !await noLinks(target)) continue;
  try {
    const entries = await new Journal(resolve(target, 'journal.jsonl')).load(); const saved = entries.findLast(entry => entry.type === 'checkpoint')?.data as { expires?: unknown; state?: unknown } | undefined;
    if (!saved || typeof saved.expires !== 'number' || saved.expires >= Date.now() || ['running', 'pending'].includes(String(saved.state))) continue;
    // Absolute resolved target is checked above and is exactly one owned UUID directory under the workspace run root.
    await rm(target, { recursive: true, force: false }); removed++;
  } catch { /* Corrupt or uncertain state is retained for a person; never delete it automatically. */ }
}
console.log(`Removed ${removed} expired, inactive, verified local team fixtures. Active/uncertain journals and link trees were retained.`);
