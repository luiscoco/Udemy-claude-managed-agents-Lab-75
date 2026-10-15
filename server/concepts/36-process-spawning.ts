import { Router, json } from 'express';
import { lab36ActionSchema, lab36FailureSchema, lab36RunSchema } from '../../shared/lab36-process-spawning.js';
import { Lab36Error, Lab36Runner } from '../lib/lab36-transport.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab36Router(manager = new Lab36Runner()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = async (response: import('express').Response, action: () => unknown | Promise<unknown>) => { try { response.json(await action()); }
    catch (error) { const status = error instanceof Lab36Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab36Error ? error.message : 'Host transport failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'loopback-managed-port-and-fixed-host-worker',
    files: ['shared/lab36-process-spawning.ts', 'server/lib/lab36-transport.ts', 'server/concepts/36-process-spawning.ts'],
    localClaudeBinaryRequired: false, toolAliasRequired: false }));
  router.get('/state', (request, response) => response.json({ runs: manager.state(String(request.headers['x-lab-owner'])) }));
  router.post('/dry', (_request, response) => response.json({ source: 'host-only', request: 'POST /sessions; GET /sessions/{id}/events',
    childProcess: 'fixed authored tool worker only', providerCalls: 0 }));
  router.post('/run', (request, response) => { const parsed = lab36RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid transport experiment.')); return; }
    void reply(response, () => manager.run(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/reset', (request, response) => { const parsed = lab36ActionSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid reset request.')); return; }
    void reply(response, () => manager.reset(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  router.post('/alias', (_request, response) => response.status(400).json(apiError('INVALID_REQUEST', 'A local Claude toolAlias is not required by Managed Agents.')));
  router.post('/debug', (request, response) => response.json({ runs: manager.state(String(request.headers['x-lab-owner'])) }));
  router.post('/failures', (request, response) => { const parsed = lab36FailureSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid failure scenario.')); return; }
    response.json({ scenario: parsed.data.scenario, providerCalls: 0, available: true }); });
  router.use(apiErrorHandler);
  return { router, close: async () => manager.close() };
}
