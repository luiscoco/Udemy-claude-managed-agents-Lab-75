import { Router, json } from 'express';
import { lab01RequestSchema } from '../../shared/lab01-events.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { createFixturePort, createLiveLab01Port } from '../lib/lab01-port.js';
import type { Lab01Port } from '../lib/lab01-port.js';
import { runLab01 } from '../lib/lab01-run.js';
import { openSse } from '../sse.js';

export const scriptedDeadlineMs = { default: 5_000, cancel: 30_000, deadline: 1_500 } as const;
const cleanupWaitMs = 10_000;

/**
 * POST /api/c1/query: "query" is this lesson's local operation (one session turn).
 * Cancellation is the platform mechanism: the browser aborts its POST, the SSE host
 * aborts the controller, and the runner attempts user.interrupt for this request's session.
 */
export function createLab01Router(livePort: () => Lab01Port = createLiveLab01Port, fixtureStepMs = 80) {
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
    const parsed = lab01RequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Check the prompt and mode.', parsed.error)); return; }
    const settings = managedSettings();
    if (closing || active.size >= settings.maxConcurrent) {
      response.status(429).json(apiError('CAPACITY', 'Wait for an active query to finish.')); return;
    }
    const { mode, prompt, scenario } = parsed.data;
    let port: Lab01Port;
    if (mode === 'live') {
      try { port = livePort(); }
      catch { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Configure the server API key, agent ID, environment ID, valid limits and MANAGED_LIVE_ENABLED=true first.')); return; }
    } else port = createFixturePort(scenario, fixtureStepMs);
    const deadlineMs = mode === 'live' ? settings.deadlineMs
      : scenario === 'cancel' ? scriptedDeadlineMs.cancel : scenario === 'deadline' ? scriptedDeadlineMs.deadline : scriptedDeadlineMs.default;
    const controller = new AbortController();
    // The SSE host's own deadline sits beyond run deadline + cleanup so the runner always reports first.
    const stream = openSse(request, response, { controller, heartbeatMs: 5_000, idleMs: 20_000,
      deadlineMs: deadlineMs + cleanupWaitMs + 8_000, quiet: true });
    const work = (async () => {
      try {
        const result = await runLab01({ mode, prompt, port, signal: controller.signal, deadlineMs, cleanupWaitMs,
          emit: (frame) => { stream.send('progress', frame); } });
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
