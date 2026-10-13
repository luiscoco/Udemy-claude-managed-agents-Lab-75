import { Router, json } from 'express';
import { lab02RequestSchema } from '../../shared/lab02-options.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { createFixtureLab02Port, createLiveLab02Port } from '../lib/lab02-port.js';
import type { Lab02Port } from '../lib/lab02-port.js';
import type { Lab02Request } from '../../shared/lab02-options.js';
import { runLab02 } from '../lib/lab02-run.js';
import { openSse } from '../sse.js';

const cleanupWaitMs = 10_000;

/**
 * POST /api/c2/query: "query" is this lesson's local operation (one session turn).
 * Cancellation is the platform mechanism: the browser aborts its POST, the SSE host
 * aborts the controller, and the runner attempts user.interrupt for this request's session.
 */
export function createLab02Router(livePort: (input: Lab02Request) => Lab02Port = createLiveLab02Port, fixtureStepMs = 80) {
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
  router.post('/query', json({ limit: '8kb', strict: true }), async (request, response) => {
    // Validation comes first: nothing below may touch a provider for an invalid request.
    const parsed = lab02RequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Check prompt, model, system setting, integer-cent budget and deadline bounds.', parsed.error)); return; }
    const settings = managedSettings();
    if (closing || active.size >= settings.maxConcurrent) {
      response.status(429).json(apiError('CAPACITY', 'Wait for an active query to finish.')); return;
    }
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server MANAGED_DEADLINE_MS policy.')); return; }
    const { mode } = parsed.data;
    let port: Lab02Port;
    if (mode === 'live') {
      try { port = livePort(parsed.data); }
      catch { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Configure the server API key, agent ID, environment ID, valid limits and MANAGED_LIVE_ENABLED=true first.')); return; }
    } else port = createFixtureLab02Port(parsed.data, fixtureStepMs);
    const deadlineMs = parsed.data.deadlineSeconds * 1000;
    const controller = new AbortController();
    // The SSE host's own deadline sits beyond run deadline + cleanup so the runner always reports first.
    const stream = openSse(request, response, { controller, heartbeatMs: 5_000, idleMs: 20_000,
      deadlineMs: deadlineMs + cleanupWaitMs + 20_000, quiet: true });
    const work = (async () => {
      try {
        const result = await runLab02(parsed.data, port, controller.signal, (frame) => { stream.send('progress', frame); }, cleanupWaitMs);
        if (!controller.signal.aborted) stream.send('result', result);
      } catch { if (!controller.signal.aborted) stream.send('error', { message: 'The query could not be completed.' }); }
      finally { await stream.end(); active.delete(controller); }
    })();
    active.set(controller, work);
    await work;
  });
  router.use(apiErrorHandler);
  return { router, async close() { closing = true; for (const controller of active.keys()) controller.abort('shutdown'); await Promise.allSettled(active.values()); } };
}

