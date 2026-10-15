import { Router, json } from 'express';
import { lab41ContinueSchema, lab41IdSchema, lab41ScenarioSchema } from '../../shared/lab41-v2-session-api.js';
import { Lab41Error, Lab41Lifecycle } from '../lib/lab41-lifecycle.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab41Router(manager = new Lab41Lifecycle()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = async (response: import('express').Response, action: () => unknown | Promise<unknown>) => { try { response.json(await action()); }
    catch (error) { const status = error instanceof Lab41Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab41Error ? error.message : 'Lifecycle experiment failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'current-managed-sdk-adapter', files: [
    'shared/lab41-v2-session-api.ts', 'server/lib/lab41-lifecycle.ts', 'server/lib/lab06-port.ts', 'server/concepts/41-v2-session-api.ts'], legacyRuntimeLoaded: false }));
  router.get('/facts', (_request, response) => response.json(manager.facts()));
  router.get('/state', (request, response) => { const parsed = lab41IdSchema.safeParse(request.query);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid lifecycle state lookup.')); return; }
    void reply(response, () => manager.state(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  for (const path of ['/oneshot', '/compare']) router.post(path, (request, response) => {
    const parsed = lab41ScenarioSchema.safeParse(request.body);
    if (!parsed.success || path === '/oneshot' && parsed.data.scenario !== 'one-shot') { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid lifecycle scenario.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('INVALID_REQUEST', 'Live lifecycle comparison is not configured.')); return; }
    void reply(response, () => manager.start(String(request.headers['x-lab-owner']), parsed.data.scenario)); });
  router.post('/continue', (request, response) => { const parsed = lab41ContinueSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid continuation action.')); return; }
    void reply(response, () => manager.act(String(request.headers['x-lab-owner']), parsed.data.runId, parsed.data.action)); });
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
