import { Router, json } from 'express';
import { lab35FailureSchema, lab35ManageSchema, lab35ResetSchema, lab35RunSchema } from '../../shared/lab35-session-stores.js';
import { Lab35Error, Lab35Mirror } from '../lib/lab35-mirror.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab35Router(manager = new Lab35Mirror()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const status = error instanceof Lab35Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab35Error ? error.message : 'Mirror operation failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'local-file-mirror',
    files: ['shared/lab35-session-stores.ts', 'server/lib/lab35-mirror.ts', 'server/concepts/35-session-stores.ts'],
    sdkSessionStoreAdapterInstalled: false, remoteStateOwner: 'Managed API' }));
  router.get('/db', (request, response) => reply(response, () => ({ source: 'local-file-mirror', entries: manager.entriesFor(String(request.headers['x-lab-owner'])) })));
  router.get('/entries', (request, response) => reply(response, () => ({ source: 'local-file-mirror', entries: manager.entriesFor(String(request.headers['x-lab-owner'])) })));
  router.post('/run', (request, response) => { const parsed = lab35RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid mirror experiment.')); return; }
    reply(response, () => manager.run(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/manage', (request, response) => { const parsed = lab35ManageSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid mirror operation.')); return; }
    reply(response, () => manager.manage(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/failures', (request, response) => { const parsed = lab35FailureSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid failure toggle.')); return; }
    reply(response, () => manager.failures(String(request.headers['x-lab-owner']), parsed.data.conversationId, parsed.data.appendFails)); });
  router.post('/reset', (request, response) => { const parsed = lab35ResetSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid reset request.')); return; }
    reply(response, () => manager.reset(String(request.headers['x-lab-owner']), parsed.data.conversationId)); });
  router.use(apiErrorHandler);
  return { router, close: async () => manager.destroy() };
}
