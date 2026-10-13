import { Router, json } from 'express';
import { managedRequestSchema } from '../../shared/managed.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { createManagedPort, managedSettings } from '../lib/managed-port.js';
import type { ManagedPort } from '../lib/managed-port.js';
import { runFoundation } from '../lib/managed-run.js';
import { openSse } from '../sse.js';

export function createManagedRouter(portFactory: () => ManagedPort = createManagedPort) {
  const router = Router();
  const active = new Map<AbortController, Promise<void>>();
  let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '';
    const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return;
    }
    next();
  });
  router.get('/setup', (_request, response) => response.json(managedSettings()));
  router.post('/stream', json({ limit: '2kb', strict: true }), async (request, response) => {
    const parsed = managedRequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose scripted or live mode.', parsed.error)); return; }
    const settings = managedSettings();
    if (closing || active.size >= (Number.isFinite(settings.maxConcurrent) ? settings.maxConcurrent : 2)) { response.status(429).json(apiError('CAPACITY', 'Wait for an active check to finish.')); return; }
    let port: ManagedPort | undefined;
    if (parsed.data.mode === 'live') {
      try { port = portFactory(); }
      catch { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Configure the server API key, agent ID, environment ID, valid limits and MANAGED_LIVE_ENABLED=true first.')); return; }
    }
    const controller = new AbortController();
    const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 20000,
      deadlineMs: settings.configured ? settings.deadlineMs : 120000, quiet: true });
    const work = (async () => {
      try {
        const result = await runFoundation(parsed.data.mode, port, controller.signal, event => { stream.send('progress', event); });
        if (!controller.signal.aborted) stream.send('result', result);
      } finally { await stream.end(); active.delete(controller); }
    })();
    active.set(controller, work);
    await work;
  });
  router.use(apiErrorHandler);
  return { router, async close() { closing = true; for (const controller of active.keys()) controller.abort('shutdown'); await Promise.allSettled(active.values()); } };
}
