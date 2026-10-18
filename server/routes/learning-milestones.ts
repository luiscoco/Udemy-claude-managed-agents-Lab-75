import { lstat, readFile, realpath } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { learningMilestones, milestoneStarterFiles } from '../../shared/learning-milestones.js';

export async function learningMilestoneArchive(id: string): Promise<Buffer> {
  if (!learningMilestones.some(item => item.id === id)) throw new Error('Unknown milestone.');
  const root = await realpath(fileURLToPath(new URL('../../fixtures/learning-milestones/', import.meta.url)));
  const directory = await realpath(join(root, id));
  if (relative(root, directory) !== id) throw new Error('Invalid milestone directory.');
  const files: Record<string, Buffer> = {};
  for (const name of milestoneStarterFiles) {
    const path = join(directory, name), info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 65536) throw new Error('Invalid milestone source.');
    files[`${id}/${name}`] = await readFile(path);
  }
  const moduleUrl = new URL('../../docgen-skills/atmira-docx/scripts/build-docx.mjs', import.meta.url).href;
  const { zipFiles } = await import(moduleUrl) as { zipFiles: (files: Record<string, Buffer>) => Buffer };
  return zipFiles(files);
}

export function createLearningMilestonesRouter() {
  const router = Router();
  router.get('/:id/starter.zip', async (request, response) => {
    const id = request.params.id;
    if (!learningMilestones.some(item => item.id === id)) { response.status(404).json({ message: 'Unknown learning milestone.' }); return; }
    try { const zip = await learningMilestoneArchive(id);
      response.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${id}-starter.zip"`, 'Cache-Control': 'no-store' }).send(zip);
    } catch { response.status(503).json({ message: 'The authored milestone starter could not be loaded. Check the local installation.' }); }
  });
  return router;
}
