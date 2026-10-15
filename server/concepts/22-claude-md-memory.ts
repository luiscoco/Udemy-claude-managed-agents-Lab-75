import { Router, json } from 'express';
import { lab22ResetSchema, lab22RunSchema } from '../../shared/lab22-claude-md-memory.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { lab22Inventory, Lab22ContextRuns, Lab22Error } from '../lib/lab22-context.js';
import { managedSettings } from '../lib/managed-config.js';
import { openSse } from '../sse.js';

export function createLab22Router(runs = new Lab22ContextRuns()) {
  const router = Router(), active = new Map<string, { controller: AbortController; work: Promise<void> }>(); let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/files', async (_request, response) => {
    try { response.json({ files: await lab22Inventory(), cloudMemory: 'not-attached' }); }
    catch { response.status(500).json(apiError('INVALID_REQUEST', 'Authored file inventory is unavailable.')); }
  });
  router.post('/reset', (request, response) => {
    const parsed = lab22ResetSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Select an owned result and confirm reset.')); return; }
    try { response.json(runs.reset(String(request.headers['x-lab-owner']), parsed.data.runId)); }
    catch (error) { response.status(error instanceof Lab22Error ? error.status : 500).json(apiError('INVALID_REQUEST', error instanceof Lab22Error ? error.message : 'Reset failed.')); }
  });
  router.post('/run', async (request, response) => {
    const parsed = lab22RunSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid bounded context selection.')); return; }
    const settings = managedSettings();
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    if (parsed.data.mode === 'live' && !settings.liveReady) { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Live setup is unavailable.')); return; }
    if (closing || active.has(owner) || active.size >= settings.maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'Wait for the active Lab 22 run.')); return; }
    const controller = new AbortController(), slot = { controller, work: Promise.resolve() }; active.set(owner, slot);
    const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 25000,
      deadlineMs: parsed.data.deadlineSeconds * 1000 + 15000, quiet: true });
    slot.work = (async () => { try { const result = await runs.run(owner, parsed.data, controller.signal);
      if (!controller.signal.aborted) stream.send('result', result);
    } catch (error) { if (!controller.signal.aborted) stream.send('error', { message: error instanceof Lab22Error ? error.message :
      'Context run failed; inspect cleanup before retrying.' }); }
    finally { active.delete(owner); await stream.end(); } })();
    await slot.work;
  });
  router.use(apiErrorHandler);
  return { router, close: async () => { closing = true; for (const slot of active.values()) slot.controller.abort('shutdown');
    await Promise.allSettled([...active.values()].map(slot => slot.work)); await runs.close(); } };
}
