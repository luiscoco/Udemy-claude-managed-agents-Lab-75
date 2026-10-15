import { Router, json } from 'express';
import { lab39IdSchema, lab39StartSchema, lab39TrySchema } from '../../shared/lab39-project-config-root.js';
import { Lab39Error, Lab39ProjectConfigRoot } from '../lib/lab39-project-config-root.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab39Router(manager = new Lab39ProjectConfigRoot()) {
  const router = Router();
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const status = error instanceof Lab39Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab39Error ? error.message : 'Configuration exercise failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'host-fixture', files: [
    'shared/lab39-project-config-root.ts', 'server/lib/lab39-project-config-root.ts', 'server/concepts/39-project-config-root.ts'],
    automaticBranchDiscovery: false }));
  router.post('/dry', (_request, response) => reply(response, () => manager.dry()));
  router.post('/where', (request, response) => { const parsed = lab39IdSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid worktree lookup.')); return; }
    reply(response, () => manager.where(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  router.post('/takeover', (request, response) => { const parsed = lab39IdSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid takeover probe.')); return; }
    reply(response, () => manager.takeover(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  router.post('/try', (request, response) => { const parsed = lab39TrySchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid checked tool request.')); return; }
    reply(response, () => manager.attempt(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/start', (request, response) => { const parsed = lab39StartSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid manifest experiment.')); return; }
    reply(response, () => manager.start(String(request.headers['x-lab-owner']), parsed.data)); });
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
