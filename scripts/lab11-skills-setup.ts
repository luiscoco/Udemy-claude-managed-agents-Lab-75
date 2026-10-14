import { lstat, open, rename, unlink, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { toFile } from '@anthropic-ai/sdk';
import type Anthropic from '@anthropic-ai/sdk';
import { bundleRevisions, pinManifestSchema, pinSchema } from '../shared/lab11-skills.js';
import type { SkillBundle } from '../shared/lab11-skills.js';
import { readSkillBundle, readSkillPins, lab11ManifestUrl } from '../server/lib/lab11-bundle.js';
import { createManagedClient, managedErrorMessage } from '../server/lib/managed-config.js';

/** Explicit CLI only. No route imports this upload operation. Full snapshots, never latest pins. */
export async function uploadSkillBundle(client: Anthropic, bundle: SkillBundle, skillId?: string) {
  const files = await Promise.all(bundle.files.map(f => toFile(Buffer.from(f.text), `${bundle.name}/${f.path}`, { type: 'text/markdown' })));
  if (skillId) { const version = await client.beta.skills.versions.create(skillId, { files }, { timeout: 15000 });
    return pinSchema.parse({ skillId: version.skill_id, version: version.id, bundleHash: bundle.hash }); }
  const skill = await client.beta.skills.create({ files, display_name: 'Lab 11 observation formatting' }, { timeout: 15000 });
  return pinSchema.parse({ skillId: skill.id, version: skill.latest_version_id, bundleHash: bundle.hash });
}
export async function skillSetup(command: string, revision: SkillBundle['revision']) {
  const bundle = await readSkillBundle(revision); const manifest = await readSkillPins();
  if (command === 'check') { console.info(`Authored ${revision} bundle verified: ${bundle.files.length} file(s). Pin ${manifest.pins[revision]?.bundleHash === bundle.hash ? 'matches' : 'absent or outdated'}. No provider request.`); return; }
  if (command !== 'upload') throw new Error('Use check or upload and v1, missing-reference or v2.');
  const lockUrl = new URL('../managed/lab11-skills.local.lock', import.meta.url);
  const tempUrl = new URL('../managed/lab11-skills.local.tmp', import.meta.url);
  const lock = await open(lockUrl, 'wx');
  try {
    const current = await readSkillPins();
    if (current.pins[revision]) throw new Error('Revision already has a pin. Keep it immutable; deliberately add a new revision for another upload.');
    if (revision !== 'v1' && !current.pins.v1) throw new Error('Upload v1 before another snapshot.');
    try { await lstat(tempUrl); throw new Error('Reconcile the pending pin record before uploading again.'); }
    catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
    const client = createManagedClient();
    const pin = await uploadSkillBundle(client, bundle, current.pins.v1?.skillId);
    // Report the returned resource before persistence: if local writing fails, never retry the POST blindly.
    console.info(`Uploaded ${revision}: ${pin.skillId}, pinned version ${pin.version}. No session or model run started.`);
    current.pins[revision] = pin; pinManifestSchema.parse(current);
    await writeFile(tempUrl, JSON.stringify(current, null, 2), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(tempUrl, lab11ManifestUrl);
  } finally { await lock.close(); await unlink(lockUrl); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const revision = process.argv[3];
  if (!bundleRevisions.includes(revision as SkillBundle['revision'])) { console.error('Select v1, missing-reference or v2.'); process.exitCode = 1; }
  else try { await skillSetup(process.argv[2] ?? 'check', revision as SkillBundle['revision']); }
  catch (error) { console.error(managedErrorMessage(error), 'Check the authored bundle and local pin manifest. If an upload succeeded but recording failed, reconcile its printed ID/version before retrying.'); process.exitCode = 1; }
}
