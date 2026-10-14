import { Router, json } from 'express';
import { lab09RequestSchema } from '../../shared/lab09-system-prompts.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { createFixtureLab09Port, createLiveLab09Port } from '../lib/lab09-port.js';
import type { Lab09Port } from '../lib/lab09-port.js';
import type { Lab09Request } from '../../shared/lab09-system-prompts.js';
import { runLab09 } from '../lib/lab09-run.js';
import { openSse } from '../sse.js';
import { lab09ProjectContext } from '../lib/lab09-composer.js';

const cleanupWaitMs = 10_000;

/**
 * POST /api/c9/query: "query" is this lesson's local operation (one session turn).
 * Cancellation is the platform mechanism: the browser aborts its POST, the SSE host
 * aborts the controller, and the runner attempts user.interrupt for this request's session.
 */
export function createLab09Router(livePort: (input: Lab09Request) => Lab09Port = createLiveLab09Port, fixtureStepMs = 80) {
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
  router.get('/context', (_request, response) => response.json(lab09ProjectContext));
  router.post('/query', json({ limit: '8kb', strict: true }), async (request, response) => {
    // Validation comes first: nothing below may touch a provider for an invalid request.
    const parsed = lab09RequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Check variant, explicit instructions, authored context ID, budget and deadline. SDK presets and arbitrary project context are unsupported.', parsed.error)); return; }
    const settings = managedSettings();
    if (closing || active.size >= Math.min(2, settings.maxConcurrent)) {
      response.status(429).json(apiError('CAPACITY', 'Wait for an active query to finish.')); return;
    }
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server MANAGED_DEADLINE_MS policy.')); return; }
    const { mode } = parsed.data;
    let port: Lab09Port;
    if (mode === 'live') {
      try { port = livePort(parsed.data); }
      catch { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Configure the server API key, agent ID, environment ID, valid limits and MANAGED_LIVE_ENABLED=true first.')); return; }
    } else port = createFixtureLab09Port(parsed.data, fixtureStepMs);
    const deadlineMs = parsed.data.deadlineSeconds * 1000;
    const controller = new AbortController();
    // The SSE host's own deadline sits beyond run deadline + cleanup so the runner always reports first.
    const stream = openSse(request, response, { controller, heartbeatMs: 5_000, idleMs: 20_000,
      deadlineMs: deadlineMs + cleanupWaitMs + 20_000, quiet: true });
    const work = (async () => {
      try {
        const result = await runLab09(parsed.data, port, controller.signal, (frame) => { stream.send('progress', frame); }, cleanupWaitMs);
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


