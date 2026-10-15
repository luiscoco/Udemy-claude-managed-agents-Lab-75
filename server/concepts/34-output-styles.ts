import { Router, json } from 'express';
import { lab34CompareSchema, lab34WhoSchema } from '../../shared/lab34-output-styles.js';
import { Lab34Error, Lab34Styles } from '../lib/lab34-styles.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab34Router(manager = new Lab34Styles()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const status = error instanceof Lab34Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab34Error ? error.message : 'Style operation failed.')); } };
  router.get('/styles', (_request, response) => reply(response, () => ({ source: 'trusted-host-registry', styles: manager.styles() })));
  router.get('/code', (_request, response) => response.json({ source: 'trusted-host-files',
    files: ['shared/lab34-output-styles.ts', 'server/lib/lab34-styles.ts', 'server/concepts/34-output-styles.ts'],
    unsupported: ['settings.outputStyle', 'reloadStyles', 'keep-coding-instructions', 'plugin precedence'] }));
  router.post('/compare', (request, response) => { const parsed = lab34CompareSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid style comparison.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('INVALID_REQUEST', 'Live style comparison needs a dedicated configured Managed agent.')); return; }
    reply(response, () => manager.compare(String(request.headers['x-lab-owner']), parsed.data.style)); });
  router.post('/live', (_request, response) => response.status(422).json(apiError('INVALID_REQUEST', 'Live style comparison is unavailable until a dedicated Managed agent is configured.')));
  router.post('/who', (request, response) => { const parsed = lab34WhoSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid style run operation.')); return; }
    reply(response, () => parsed.data.operation === 'inspect' ? manager.inspect(String(request.headers['x-lab-owner']), parsed.data.runId)
      : manager.closeRun(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  router.use(apiErrorHandler);
  return { router, close: async () => manager.close() };
}
