import { Router, json } from 'express';
import { lab21RunSchema, lab21SessionSchema } from '../../shared/lab21-slash-commands.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { Lab15Error } from '../lib/lab15-sessions.js';
import { Lab21Commands } from '../lib/lab21-commands.js';

export function createLab21Router(commands = new Lab21Commands()) {
  const router = Router();
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    }
    next();
  });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/commands', (_request, response) => response.json({ commands: commands.commands() }));
  router.post('/session', async (request, response) => {
    const data = lab21SessionSchema.safeParse(request.body);
    if (!data.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid command session action.')); return; }
    try { response.json(data.data.action === 'prepare' ? commands.prepare(String(request.headers['x-lab-owner']), data.data.mode)
      : await commands.close(data.data.runId, String(request.headers['x-lab-owner']))); }
    catch (error) { response.status(error instanceof Lab15Error ? error.status : 422).json(apiError('INVALID_REQUEST', error instanceof Error ? error.message : 'Session action failed.')); }
  });
  router.post('/run', async (request, response) => {
    const data = lab21RunSchema.safeParse(request.body);
    if (!data.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid host command.')); return; }
    try { response.json(await commands.run(data.data.runId, String(request.headers['x-lab-owner']), data.data.command,
      data.data.args, AbortSignal.timeout(40000))); }
    catch (error) { response.status(error instanceof Lab15Error ? error.status : 400).json(apiError('INVALID_REQUEST', error instanceof Lab15Error ? error.message : 'Invalid command arguments or operation failed.')); }
  });
  router.use(apiErrorHandler);
  return { router, close: () => commands.shutdown() };
}
