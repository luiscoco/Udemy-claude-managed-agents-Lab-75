import { Router, json } from 'express';
import { lab40BuildSchema, lab40CaseSchema, lab40IdSchema, lab40UndoSchema } from '../../shared/lab40-resume-drops-turn.js';
import { Lab40Error, Lab40Recovery } from '../lib/lab40-recovery.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab40Router(manager = new Lab40Recovery()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const status = error instanceof Lab40Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab40Error ? error.message : 'Recovery operation failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'host-fixture', files: [
    'shared/lab40-resume-drops-turn.ts', 'server/lib/lab40-recovery.ts', 'server/concepts/40-resume-drops-turn.ts'], remoteTruncation: false }));
  router.post('/dry', (_request, response) => reply(response, () => manager.dry()));
  router.post('/build', (request, response) => { const parsed = lab40BuildSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid recovery build.')); return; }
    reply(response, () => manager.build(String(request.headers['x-lab-owner']), parsed.data)); });
  router.get('/state', (request, response) => { const parsed = lab40IdSchema.safeParse(request.query);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid recovery state lookup.')); return; }
    reply(response, () => manager.state(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  router.post('/cases', (request, response) => { const parsed = lab40CaseSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid recovery choice.')); return; }
    reply(response, () => manager.choose(String(request.headers['x-lab-owner']), parsed.data.runId, parsed.data.choice)); });
  router.post('/undo', (request, response) => { const parsed = lab40UndoSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid undo request.')); return; }
    reply(response, () => manager.undo(String(request.headers['x-lab-owner']), parsed.data.runId, parsed.data.expectedVersion)); });
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
