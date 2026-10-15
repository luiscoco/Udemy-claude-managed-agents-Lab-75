import { Router, json } from 'express';
import { lab27CallSchema, lab27OpenSchema } from '../../shared/lab27-background-tasks.js';
import { Lab27Error, Lab27Ledger } from '../lib/lab27-ledger.js';
import { apiError } from '../lib/errors.js';

export function createLab27Router(ledger = new Lab27Ledger()) {
  const router = Router();
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '';
    const owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const code = error instanceof Lab27Error ? error.statusCode : 500;
      response.status(code).json(apiError(code === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab27Error ? error.message : 'Task control failed.')); } };
  router.post('/open', (request, response) => { const parsed = lab27OpenSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid task request.')); return; }
    reply(response, () => ledger.open(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/oneshot', (request, response) => { const parsed = lab27OpenSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid one-shot request.')); return; }
    reply(response, () => ledger.oneshot(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/call', (request, response) => { const parsed = lab27CallSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Unknown task operation.')); return; }
    reply(response, () => ledger.call(String(request.headers['x-lab-owner']), parsed.data)); });
  router.get('/code', (_request, response) => response.json({ source: 'installed-sdk-and-authored-events',
    files: ['shared/lab27-background-tasks.ts', 'server/lib/lab27-ledger.ts', 'server/concepts/27-background-tasks.ts'],
    boundaries: ['primary-turn', 'child-thread-activity', 'remote-session', 'browser-connection'],
    unsupportedAgentSdkEvents: ['task_started', 'task_notification', 'background_tasks_changed'],
    note: 'A workflow run needs its own run-aware stop adapter; user.interrupt alone does not end an open run.' }));
  return { router, close: async () => ledger.close() };
}
