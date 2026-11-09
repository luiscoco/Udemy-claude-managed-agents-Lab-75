import { lstat, readFile, realpath } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router, json } from 'express';
import { z } from 'zod';
import { miniProjects } from '../../shared/mini-projects.js';
import { MiniProjectManager } from '../lib/mini-project-manager.js';
import { configuredLearningOriginAllowed } from '../lib/learning-origin.js';

const projectRoot = fileURLToPath(new URL('../../mini-projects/', import.meta.url));
async function sourceFiles(): Promise<string[]> {
  const value: unknown = JSON.parse(await readFile(new URL('../../shared/mini-project-files.json', import.meta.url), 'utf8'));
  if (!Array.isArray(value) || value.length > 200 || value.some(name => typeof name !== 'string' || name.includes('..') ||
    !/^[a-zA-Z0-9_./-]+$/.test(name) || /(?:^|\/)(?:node_modules|dist|artifacts|\.git)(?:\/|$)/.test(name) || /(?:^|\/)\.env$/.test(name))) throw Error('Invalid source manifest.');
  return value as string[];
}
export async function miniProjectArchive(id: string) {
  if (!miniProjects.some(item => item.id === id)) throw Error('Unknown project.');
  const root = await realpath(projectRoot), files: Record<string, Buffer> = {};
  for (const name of (await sourceFiles()).filter(name => name.startsWith(id + '/'))) {
    const path = join(root, name), info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 400000 || relative(root, await realpath(path)).replaceAll('\\', '/') !== name) throw Error('Invalid project source.');
    files[name] = await readFile(path);
  }
  const moduleUrl = new URL('../../docgen-skills/atmira-docx/scripts/build-docx.mjs', import.meta.url).href;
  const { zipFiles } = await import(moduleUrl) as { zipFiles: (files: Record<string, Buffer>) => Buffer };
  return zipFiles(files);
}
export function createMiniProjectsRouter(manager: MiniProjectManager) {
  const router = Router();
  router.use((request, response, next) => {
    const local = (value: string) => { try { const url = new URL(value); return url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname); } catch { return false; } };
    const localRequest = local(`http://${request.headers.host ?? ''}`) && (!request.headers.origin || local(request.headers.origin));
    if (!localRequest && !configuredLearningOriginAllowed(request.headers)) {
      response.status(403).json({ message: 'Milestone controls are available only from the local course app.' }); return;
    }
    response.setHeader('Cache-Control', 'no-store'); next();
  });
  router.use(json({ limit: '2kb' }));
  router.get('/', (_request, response) => response.json({ projects: manager.list() }));
  router.param('id', (_request, response, next, id: string) => {
    if (!miniProjects.some(item => item.id === id)) { response.status(404).json({ message: 'Unknown project.' }); return; }
    next();
  });
  router.get('/:id/starter.zip', async (request, response) => {
    try { response.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${request.params.id}-starter.zip"` }).send(await miniProjectArchive(request.params.id)); }
    catch { response.status(503).json({ message: 'The project source could not be packaged. Check the local installation.' }); }
  });
  router.get('/:id/stages', async (request, response) => {
    const id = request.params.id;
    try {
      const names = (await sourceFiles()).filter(name => name.startsWith(id + '/prompts/')).sort();
      const stages = await Promise.all(names.map(async name => {
        const prompt = await readFile(join(projectRoot, name), 'utf8');
        return { id: name.split('/').at(-1)!.replace('.md', ''), title: prompt.split('\n')[0]!.replace(/^#\s*/, ''), prompt };
      }));
      response.json({ stages });
    } catch { response.status(503).json({ message: 'The project build prompts could not be loaded.' }); }
  });
  router.post('/:id/start', async (request, response) => {
    const body = z.strictObject({ mode: z.enum(['learner', 'reference']) }).safeParse(request.body);
    if (!body.success) { response.status(400).json({ message: 'Choose learner or reference mode.' }); return; }
    try { response.json(await manager.start(request.params.id, body.data.mode)); }
    catch (error) { response.status(409).json({ message: error instanceof Error ? error.message : 'Project startup failed.' }); }
  });
  router.post('/:id/stop', async (request, response) => { await manager.stop(request.params.id); response.json({ stopped: true }); });
  return router;
}
