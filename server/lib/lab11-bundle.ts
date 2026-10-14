import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { bundleRevisions, bundleSchema, pinManifestSchema } from '../../shared/lab11-skills.js';
import type { SkillBundle } from '../../shared/lab11-skills.js';

export const lab11ManifestUrl = new URL('../../managed/lab11-skills.local.json', import.meta.url);
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
/** Authored allowlist: never accepts a host directory or file path from a request. */
export async function readSkillBundle(revision: SkillBundle['revision']): Promise<SkillBundle> {
  if (!bundleRevisions.includes(revision)) throw new Error('Unknown bundle revision.');
  const root = new URL(`../../skills/lab11/${revision}/format-observation/`, import.meta.url);
  for (const path of ['../', './', ...(revision === 'missing-reference' ? [] : ['references/'])]) {
    const stat = await lstat(new URL(path, root)); if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Bundle directories must be ordinary directories.');
  }
  const files = [];
  for (const path of revision === 'missing-reference' ? ['SKILL.md'] : ['SKILL.md', 'references/format.md']) {
    const url = new URL(path, root); const stat = await lstat(url);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 12000) throw new Error('Invalid authored bundle file.');
    const text = (await readFile(url, 'utf8')).replace(/\r\n/g, '\n'); files.push({ path, text, sha256: sha256(text) });
  }
  const frontmatter = /^---\nname: format-observation\ndescription: ([^\n]+)\n---\n/.exec(files[0]!.text);
  if (!frontmatter) throw new Error('Invalid SKILL.md frontmatter.');
  return bundleSchema.parse({ revision, name: 'format-observation', description: frontmatter[1], files,
    hash: sha256(JSON.stringify(files.map(f => [f.path, f.sha256]))) });
}
export async function readSkillPins(url = lab11ManifestUrl) {
  try { return pinManifestSchema.parse(JSON.parse(await readFile(url, 'utf8'))); }
  catch (e) { if (e instanceof Error && 'code' in e && e.code === 'ENOENT') return pinManifestSchema.parse({ schemaVersion: 1, pins: {} }); throw new Error('Invalid local Lab 11 pin manifest.'); }
}
