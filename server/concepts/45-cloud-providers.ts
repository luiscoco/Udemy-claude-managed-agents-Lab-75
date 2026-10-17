import { Router, json } from 'express';
import { lab45ScenarioSchema, lab45TargetSchema } from '../../shared/lab45-cloud-providers.js';
import { Lab45Error, Lab45Providers } from '../lib/lab45-providers.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab45Router(manager = new Lab45Providers()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = async (response: import('express').Response, action: () => unknown | Promise<unknown>) => { try { response.json(await action()); }
    catch (error) { const status = error instanceof Lab45Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab45Error ? error.message : 'Provider catalog operation failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'official-catalog-and-installed-sdk', files: [
    'shared/lab45-cloud-providers.ts', 'server/lib/lab45-providers.ts', 'server/concepts/45-cloud-providers.ts'], noProviderCalls: true }));
  router.get('/facts', (_request, response) => response.json(manager.facts()));
  router.post('/aws/check', (request, response) => { if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'AWS resource check takes no fields.')); return; }
    void reply(response, () => manager.checkAws()); });
  router.post('/catalog', (request, response) => { if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'Catalog takes no fields.')); return; }
    response.json(manager.catalog()); });
  router.post('/same', (request, response) => { const parsed = lab45TargetSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid provider target.')); return; }
    response.json(manager.same(parsed.data.target)); });
  for (const route of ['/auth', '/models', '/failures']) router.post(route, (request, response) => {
    const parsed = lab45ScenarioSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid provider emulator request.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('INVALID_REQUEST', 'Live provider checks require separately reviewed credentials and explicit opt-in.')); return; }
    void reply(response, () => manager.emulate(parsed.data.target, parsed.data.scenario)); });
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
