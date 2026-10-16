import { Router, json } from 'express';
import { readFileSync } from 'node:fs';
import { lab49RequestSchema } from '../../shared/lab49-deploy-ci-headless.js';
import { Lab49Error, Lab49Headless } from '../lib/lab49-headless.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab49Router(manager = new Lab49Headless()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/facts', (_request, response) => response.json(manager.facts()));
  router.get('/code', (_request, response) => response.json({ source: 'headless-host-kit', files: [
    'shared/lab49-deploy-ci-headless.ts', 'server/lib/lab49-headless.ts', 'server/concepts/49-deploy-ci-headless.ts',
    'ci-kit/runner.mjs', 'ci-kit/worker.mjs', 'ci-kit/Dockerfile', 'ci-kit/sample-workflow.yml'], providerCalls: 0 }));
  router.get('/files', (_request, response) => {
    try { response.json({ source: 'authored-files', files: Object.fromEntries([
      'ci-kit/runner.mjs', 'ci-kit/worker.mjs', 'ci-kit/Dockerfile', 'ci-kit/sample-workflow.yml'].map(path =>
        [path, readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8').slice(0, 12000)])) }); }
    catch { response.status(500).json(apiError('INVALID_REQUEST', 'CI kit files unavailable.')); }
  });
  for (const route of ['headless', 'ci', 'limits', 'deploy'] as const) router.post(`/${route}`, async (request, response) => {
    const parsed = lab49RequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid offline headless request.')); return; }
    try { response.json(await manager.run(parsed.data.scenario, request.signal)); }
    catch (error) { response.status(error instanceof Lab49Error ? error.statusCode : 500).json(apiError('INVALID_REQUEST',
      error instanceof Lab49Error ? error.message : 'Headless fixture failed.')); }
  });
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
