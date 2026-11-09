import { Router, json } from 'express';
import { lab26CallSchema, lab26OpenSchema, lab26Operations } from '../../shared/lab26-query-control.js';
import { Lab26Controls, Lab26Error } from '../lib/lab26-controls.js';
import { apiError } from '../lib/errors.js';

export function createLab26Router(controls = new Lab26Controls()) {
  const router = Router();
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', origin = request.headers.origin, owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const respond = (response: import('express').Response, operation: () => unknown) => {
    try { response.json(operation()); } catch (error) { const status = error instanceof Lab26Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab26Error ? error.message : 'Session control failed.')); }
  };
  router.get('/catalog', (_request, response) => response.json({ source: 'installed-sdk-1.7.0', operations: lab26Operations,
    updateFields: ['title', 'metadata', 'agent.tools', 'agent.mcp_servers', 'budget'],
    idleAgentUpdate: 'Full replacement; only on a confirmed-idle session with no open workflow run.',
    disabled: ['model', 'system', 'skills', 'dynamic-workflow-controls'],
    budgetNote: 'Raising a budget can resume work and requires an explicit opt-in.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab26-query-control.ts', 'server/lib/lab26-controls.ts', 'server/concepts/26-query-control.ts'],
    sdkType: 'SessionUpdateParams', source: 'installed-sdk-1.7.0',
    connection: 'Closing a browser request only closes that request; interrupt and idle confirmation are separate operations.' }));
  router.post('/open', (request, response) => { const parsed = lab26OpenSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid open request.')); return; }
    respond(response, () => controls.open(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/call', (request, response) => { const parsed = lab26CallSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Unknown or invalid catalog operation.')); return; }
    respond(response, () => controls.call(String(request.headers['x-lab-owner']), parsed.data)); });
  return { router, close: async () => controls.close() };
}
