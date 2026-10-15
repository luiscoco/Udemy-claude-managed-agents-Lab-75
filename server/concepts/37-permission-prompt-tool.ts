import { Router, json } from 'express';
import { lab37DecideSchema, lab37RunSchema, lab37WhoSchema } from '../../shared/lab37-permission-prompt-tool.js';
import { Lab37Error, Lab37PolicyGate } from '../lib/lab37-policy-gate.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab37Router(manager = new Lab37PolicyGate()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = async (response: import('express').Response, action: () => unknown | Promise<unknown>) => { try { response.json(await action()); }
    catch (error) { const status = error instanceof Lab37Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab37Error ? error.message : 'Policy operation failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'host-policy-service-fixture',
    files: ['shared/lab37-permission-prompt-tool.ts', 'server/lib/lab37-policy-gate.ts', 'server/concepts/37-permission-prompt-tool.ts'],
    precedence: ['fixed host path limit', 'validated worker or local reviewer decision', 'one exact event confirmation'],
    agentCallable: false }));
  router.post('/run', (request, response) => { const parsed = lab37RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid policy experiment.')); return; }
    void reply(response, () => manager.run(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/decide', (request, response) => { const parsed = lab37DecideSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid exact policy decision.')); return; }
    void reply(response, () => manager.decide(String(request.headers['x-lab-owner']), parsed.data)); });
  for (const path of ['/who', '/answers', '/gate-log']) router.post(path, (request, response) => { const parsed = lab37WhoSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid policy run lookup.')); return; }
    void reply(response, () => manager.inspect(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  router.post('/dry', (_request, response) => response.json({ source: 'host-only', precedence: 'host path limit overrides gate allow', providerCalls: 0 }));
  router.post('/failures', (request, response) => { const parsed = lab37WhoSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid policy cancellation.')); return; }
    void reply(response, () => manager.cancel(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  router.use(apiErrorHandler);
  return { router, close: async () => manager.close() };
}
