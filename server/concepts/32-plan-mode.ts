import { Router, json } from 'express';
import { lab32DecisionSchema, lab32RunSchema, lab32WhoSchema } from '../../shared/lab32-plan-mode.js';
import { Lab32Error, Lab32PlanGate } from '../lib/lab32-plan-gate.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab32Router(manager = new Lab32PlanGate()) {
  const router = Router();
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const status = error instanceof Lab32Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab32Error ? error.message : 'Plan operation failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'host-workflow-fixture',
    files: ['shared/lab32-plan-mode.ts', 'server/lib/lab32-plan-gate.ts', 'server/concepts/32-plan-mode.ts'],
    historicalOnly: ['EnterPlanMode', 'ExitPlanMode', 'setPermissionMode'],
    phases: { planning: ['read'], execution: ['append_checklist'] } }));
  router.post('/run', (request, response) => { const parsed = lab32RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid plan experiment.')); return; }
    reply(response, () => manager.run(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/decide', (request, response) => { const parsed = lab32DecisionSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid closed plan decision.')); return; }
    reply(response, () => manager.decide(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/who', (request, response) => { const parsed = lab32WhoSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid phase operation.')); return; }
    reply(response, () => manager.who(String(request.headers['x-lab-owner']), parsed.data)); });
  router.use(apiErrorHandler);
  return { router, close: async () => manager.close() };
}
