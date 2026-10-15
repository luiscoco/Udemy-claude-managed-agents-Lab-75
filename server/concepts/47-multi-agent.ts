import { Router, json } from 'express';
import { lab47RequestSchema } from '../../shared/lab47-multi-agent.js';
import { Lab47Error, Lab47MultiAgent } from '../lib/lab47-multi-agent.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab47Router(manager = new Lab47MultiAgent()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/facts', (_request, response) => response.json(manager.facts()));
  router.get('/code', (_request, response) => response.json({ source: 'installed-sdk-types-and-offline-fixtures', files: [
    'shared/lab47-multi-agent.ts', 'server/lib/lab47-multi-agent.ts', 'server/concepts/47-multi-agent.ts'], providerCalls: 0 }));
  for (const route of ['orchestrator', 'hierarchy', 'pipeline', 'fanout', 'evaluator'] as const) router.post(`/${route}`, (request, response) => {
    const parsed = lab47RequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid offline coordinator request.')); return; }
    try { response.json(manager.run(route, parsed.data.scenario, request.signal)); }
    catch (error) { response.status(error instanceof Lab47Error ? error.statusCode : 500).json(apiError('INVALID_REQUEST',
      error instanceof Lab47Error ? error.message : 'Coordinator failed.')); }
  });
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
