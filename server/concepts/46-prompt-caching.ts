import { Router, json } from 'express';
import { lab46RequestSchema } from '../../shared/lab46-prompt-caching.js';
import { Lab46CacheObservations, Lab46Error } from '../lib/lab46-cache-observations.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab46Router(manager = new Lab46CacheObservations()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const status = error instanceof Lab46Error ? error.statusCode : 500;
      response.status(status).json(apiError('INVALID_REQUEST', error instanceof Lab46Error ? error.message : 'Cache observation failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'managed-usage-types-and-authored-counters', files: [
    'shared/lab46-prompt-caching.ts', 'server/lib/lab46-cache-observations.ts', 'server/lib/lab15-accounting.ts', 'server/concepts/46-prompt-caching.ts'], cacheControlOption: false }));
  router.get('/facts', (_request, response) => response.json(manager.facts()));
  router.post('/anatomy', (request, response) => { if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'Anatomy takes no fields.')); return; }
    response.json(manager.anatomy()); });
  const routes = { '/switches': ['reused-content', 'changed-prefix'], '/breakers': ['changed-tools', 'short-input', 'missing-usage'], '/model-switch': ['changed-model'] } as const;
  for (const [path, scenarios] of Object.entries(routes)) router.post(path, (request, response) => { const parsed = lab46RequestSchema.safeParse(request.body);
    if (!parsed.success || !scenarios.includes(parsed.data.scenario as never)) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid cache comparison.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('INVALID_REQUEST', 'Live cache comparison requires explicit separately budgeted sessions.')); return; }
    reply(response, () => manager.run(parsed.data.scenario)); });
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
