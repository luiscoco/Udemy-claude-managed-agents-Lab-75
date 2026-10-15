import { Router, json } from 'express';
import { z } from 'zod';
import { lab30RunSchema, lab30ToolShapes, lab30ToolsRequestSchema } from '../../shared/lab30-todo-tracking.js';
import { Lab30BoardManager, Lab30Error } from '../lib/lab30-board.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab30Router(manager = new Lab30BoardManager()) {
  const router = Router();
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const status = error instanceof Lab30Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab30Error ? error.message : 'Task-board operation failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'host-fixture-and-pinned-sdk-custom-tools',
    files: ['shared/lab30-todo-tracking.ts', 'server/lib/lab30-board.ts', 'server/concepts/30-todo-tracking.ts'],
    inputSchemas: Object.fromEntries(Object.entries(lab30ToolShapes).map(([name, schema]) => [name, z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'input' })])),
    historicalOnly: ['TodoWrite', 'TaskCreate', 'TaskUpdated'] }));
  router.post('/run', (request, response) => { const parsed = lab30RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid task-board experiment.')); return; }
    reply(response, () => manager.run(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/tools', (request, response) => { const parsed = lab30ToolsRequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid closed tool or host plan request.')); return; }
    reply(response, () => 'operation' in parsed.data ? manager.replace(String(request.headers['x-lab-owner']), parsed.data)
      : manager.call(String(request.headers['x-lab-owner']), parsed.data)); });
  router.use(apiErrorHandler);
  return { router, close: async () => manager.close() };
}
