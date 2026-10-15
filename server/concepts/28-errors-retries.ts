import { Router, json } from 'express';
import { lab28RequestSchema } from '../../shared/lab28-errors-retries.js';
import { runLab28, sideEffectRequestOptions } from '../lib/lab28-faults.js';
import { apiError } from '../lib/errors.js';

export function createLab28Router(run = runLab28) {
  const router = Router(), active = new Map<string, AbortController>(); let closing = false;
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '';
    const owner = request.headers['x-lab-owner']; if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) ||
      request.headers.origin && request.headers.origin !== `http://${host}` || typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/code', (_request, response) => response.json({ source: 'installed-sdk-0.133.0-and-authored-loopback',
    files: ['shared/lab28-errors-retries.ts', 'server/lib/lab28-faults.ts', 'server/concepts/28-errors-retries.ts'],
    sideEffectRequestOptions, note: 'SDK defaults can retry 408, 409, 429, >=500 and connection errors. Side-effecting calls set maxRetries:0.' }));
  const handler = (request: import('express').Request, response: import('express').Response) => {
    const parsed = lab28RequestSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid bounded fault scenario.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Live fault injection requires an explicitly configured port.')); return; }
    if (closing || active.has(owner) || active.size >= 4) { response.status(429).json(apiError('CAPACITY', 'Wait for the active fault run.')); return; }
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), parsed.data.deadlineMs);
    active.set(owner, controller);
    const onClose = () => { if (!response.writableEnded) controller.abort(); };
    response.once('close', onClose);
    void run(parsed.data, controller.signal).then(result => { if (!response.destroyed) response.json(result); })
      .catch(() => { if (!response.destroyed) response.status(controller.signal.aborted ? 504 : 500).json(apiError('INVALID_REQUEST', 'Fault experiment stopped before evidence was complete.')); })
      .finally(() => { clearTimeout(timer); response.off('close', onClose); active.delete(owner); });
  };
  router.post('/api', handler); router.post('/run', handler);
  return { router, close: async () => { closing = true; for (const controller of active.values()) controller.abort(); active.clear(); } };
}
