import { Router, json } from 'express';
import { lab53RunSchema } from '../../shared/lab53-debugging.js';
import { Lab53TraceStore } from '../debugging/lab53.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab53Router(store = new Lab53TraceStore()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '2kb' })); const ownerOf = (request: import('express').Request) =>
    request.headers['x-lab-owner'] as string;
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { response.status(error instanceof Error && /capacity/.test(error.message) ? 429 : 404)
      .json(apiError('NOT_FOUND', error instanceof Error ? error.message : 'Trace unavailable.')); } };
  router.get('/facts', (_request, response) => response.json(store.facts()));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab53-debugging.ts',
    'server/debugging/lab53.ts', 'server/concepts/53-debugging.ts', 'server/lib/session-events.ts',
    'server/capstone/tools.ts', 'server/capstone/store.ts'],
    note: 'The recorded event summaries are redacted; replay uses the actual shared event consumer.' }));
  router.post('/run', (request, response) => { const parsed = lab53RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported trace scenario.')); return; }
    reply(response, () => store.run(ownerOf(request), parsed.data.scenario)); });
  router.get('/runs/:id', (request, response) => { const id = request.params.id;
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) {
      response.status(400).json(apiError('INVALID_REQUEST', 'Invalid trace run ID.')); return; }
    reply(response, () => store.get(ownerOf(request), id)); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
