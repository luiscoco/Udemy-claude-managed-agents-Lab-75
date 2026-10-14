import { Router, json } from 'express';
import { lab14ControlSchema, lab14NewSchema, lab14RequestSchema, lab14SendSchema } from '../../shared/lab14-models.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { lab14Catalog } from '../lib/lab14-port.js';
import { createLab14Manager } from '../lib/lab14-run.js';
import { openSse } from '../sse.js';
export function createLab14Router(manager = createLab14Manager()) {
  const router = Router();
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}`) { response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return; }
    if (request.method !== 'GET' && !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) { response.status(403).json(apiError('INVALID_REQUEST', 'Missing experiment owner.')); return; }
    next();
  });
  router.use(json({ limit: '8kb', strict: true }));
  router.get('/models', (_request, response) => response.json(lab14Catalog()));
  router.post('/session', (request, response) => {
    const input = lab14RequestSchema.safeParse(request.body); if (!input.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid model, effort or experiment settings.', input.error)); return; }
    try { response.json(manager.prepare(String(request.headers['x-lab-owner']), input.data)); }
    catch { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Check readiness, ownership, capacity and deadline policy.')); }
  });
  for (const operation of ['run', 'send'] as const) router.post(`/${operation}`, async (request, response) => {
    const input = operation === 'run' ? lab14RequestSchema.safeParse(request.body) : lab14SendSchema.safeParse(request.body);
    if (!input.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid experiment.', input.error)); return; }
    const owner = String(request.headers['x-lab-owner']); let runId: string, prompt: string;
    try {
      if (operation === 'run') { const prepared = manager.prepare(owner, lab14RequestSchema.parse(input.data)); runId = prepared.runId; prompt = lab14RequestSchema.parse(input.data).prompt; }
      else { const data = lab14SendSchema.parse(input.data); runId = data.runId; prompt = data.prompt; if (manager.inspect(runId, owner).state !== 'prepared') throw new Error('state'); }
    } catch { response.status(409).json(apiError('INVALID_REQUEST', 'Experiment is unavailable or requires a new configuration.')); return; }
    const controller = new AbortController();
    const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 25000, deadlineMs: 300000, quiet: true });
    stream.send('prepared', { runId });
    try { const result = await manager.send(runId, owner, prompt, controller.signal, frame => {
      // Lifecycle and notices suffice for progress; public messages arrive in the bounded final result.
      if (frame.kind === 'notice' || frame.kind === 'session') stream.send('progress', frame);
    }); if (!controller.signal.aborted) stream.send('result', result); }
    catch { if (!controller.signal.aborted) stream.send('error', { message: 'Experiment failed; close it and inspect remote work before retrying.' }); }
    finally { await stream.end(); }
  });
  router.post('/end', async (request, response) => {
    const data = lab14ControlSchema.safeParse(request.body); if (!data.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid experiment ID.')); return; }
    try { response.json(await manager.end(data.data.runId, String(request.headers['x-lab-owner']))); }
    catch { response.status(404).json(apiError('INVALID_REQUEST', 'Unknown experiment.')); }
  });
  router.post('/new-configuration', async (request, response) => {
    const data = lab14NewSchema.safeParse(request.body); if (!data.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid new configuration.')); return; }
    try { response.json(await manager.newConfiguration(data.data.runId, String(request.headers['x-lab-owner']), data.data.request)); }
    catch { response.status(409).json(apiError('INVALID_REQUEST', 'Reconcile earlier work and check the new configuration first.')); }
  });
  router.use(apiErrorHandler); return { router, close: manager.close };
}
