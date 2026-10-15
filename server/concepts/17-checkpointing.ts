import { Router, json } from 'express';
import { lab17ControlSchema, lab17OneShotSchema, lab17RestoreSchema, lab17SendSchema, lab17SessionSchema } from '../../shared/lab17-checkpointing.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { Lab17Error, Lab17Manager } from '../lib/lab17-run.js';
import { openSse } from '../sse.js';

export function createLab17Router(manager = new Lab17Manager()) {
  const router = Router();
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '8kb' }));
  router.post('/session', async (request, response) => {
    const parsed = lab17SessionSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid bounded session settings.')); return; }
    try { response.json(await manager.session(String(request.headers['x-lab-owner']), parsed.data)); }
    catch (error) { response.status(error instanceof Lab17Error ? error.status : 422).json(apiError('INVALID_REQUEST', error instanceof Lab17Error ? error.message : 'Session setup unavailable.')); }
  });
  for (const operation of ['send', 'oneshot'] as const) router.post(`/${operation}`, async (request, response) => {
    const parsed = operation === 'send' ? lab17SendSchema.safeParse(request.body) : lab17OneShotSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid bounded host action or session request.')); return; }
    const owner = String(request.headers['x-lab-owner']), controller = new AbortController();
    const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 25000, deadlineMs: 160000, quiet: true });
    try {
      const report = operation === 'send' ? await manager.send(owner, lab17SendSchema.parse(parsed.data), controller.signal,
        snapshot => { if (!controller.signal.aborted) stream.send('progress', snapshot); })
        : await manager.oneshot(owner, lab17OneShotSchema.parse(parsed.data), controller.signal);
      if (!controller.signal.aborted) stream.send('result', report);
    } catch (error) { if (!controller.signal.aborted) stream.send('error', { message: error instanceof Lab17Error ? error.message : 'Host action failed; inspect session and files before retrying.' }); }
    finally { await stream.end(); }
  });
  router.post('/snapshot', async (request, response) => {
    const parsed = lab17ControlSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid fixture session ID.')); return; }
    try { response.json(await manager.snapshot(parsed.data.runId, String(request.headers['x-lab-owner']))); }
    catch (error) { response.status(error instanceof Lab17Error ? error.status : 422).json(apiError('INVALID_REQUEST', error instanceof Lab17Error ? error.message : 'Snapshot unavailable.')); }
  });
  router.post('/restore', async (request, response) => {
    const parsed = lab17RestoreSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Dry-run or confirmed restore requires closed fields and a matching plan ID.')); return; }
    try { response.json(await manager.restore(String(request.headers['x-lab-owner']), parsed.data)); }
    catch (error) { response.status(error instanceof Lab17Error ? error.status : 422).json(apiError('INVALID_REQUEST', error instanceof Lab17Error ? error.message : 'Restore unavailable.')); }
  });
  router.post('/end', async (request, response) => {
    const parsed = lab17ControlSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid fixture session ID.')); return; }
    try { response.json(await manager.end(parsed.data.runId, String(request.headers['x-lab-owner']))); }
    catch (error) { response.status(error instanceof Lab17Error ? error.status : 422).json(apiError('INVALID_REQUEST', error instanceof Lab17Error ? error.message : 'Close unavailable.')); }
  });
  router.use(apiErrorHandler);
  return { router, close: () => manager.close() };
}
