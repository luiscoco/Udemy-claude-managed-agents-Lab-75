import { Router, json } from 'express';
import { lab42IdSchema, lab42RequestSchema } from '../../shared/lab42-web-tools.js';
import { Lab42Error, Lab42Research } from '../lib/lab42-research.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab42Router(manager = new Lab42Research()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const status = error instanceof Lab42Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab42Error ? error.message : 'Research exercise failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'installed-sdk-1.7.0-and-host-fixture', files: [
    'shared/lab42-web-tools.ts', 'server/lib/lab42-research.ts', 'server/concepts/42-web-tools.ts'], liveNetworkFetch: false }));
  router.get('/facts', (_request, response) => response.json(manager.facts()));
  router.get('/state', (request, response) => { const parsed = lab42IdSchema.safeParse(request.query);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid research state lookup.')); return; }
    reply(response, () => manager.state(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  const scenarios = { '/basics': 'basics', '/fetch-lab': 'fetch', '/injection': 'injection', '/guard': 'blocked-host', '/research': 'research' } as const;
  for (const [path, expected] of Object.entries(scenarios)) router.post(path, (request, response) => {
    const parsed = lab42RequestSchema.safeParse(request.body);
    if (!parsed.success || parsed.data.scenario !== expected && !(path === '/guard' && parsed.data.scenario === 'redirect')) {
      response.status(400).json(apiError('INVALID_REQUEST', 'Invalid research scenario.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('INVALID_REQUEST', 'Live network fetch is not configured for this lab.')); return; }
    reply(response, () => manager.run(String(request.headers['x-lab-owner']), parsed.data.scenario)); });
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
