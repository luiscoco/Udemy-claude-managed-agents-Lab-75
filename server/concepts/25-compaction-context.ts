import { Router, json } from 'express';
import { lab25RequestSchema } from '../../shared/lab25-compaction-context.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { knownContextMetrics, readLab25Report, runLab25 } from '../lib/lab25-compaction-context.js';

export function createLab25Router(run = runLab25) {
  const router = Router(), active = new Map<string, AbortController>(); let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/window', async (_request, response) => {
    try { response.json({ source: 'installed-sdk-and-authored-reports', metrics: knownContextMetrics(null),
      reports: await Promise.all((['r1', 'r2', 'r3'] as const).map(readLab25Report)),
      eventType: 'agent.thread_context_compacted', liveReady: false,
      note: 'The pinned thread type exposes cumulative usage and timing statistics, not exact free window capacity or the compaction threshold.' }); }
    catch { response.status(500).json(apiError('INVALID_REQUEST', 'Reviewed report inventory is unavailable.')); }
  });
  router.get('/code', (_request, response) => response.json({ source: 'installed-sdk-0.133.0',
    event: 'agent.thread_context_compacted has id and processed_at; it does not contain a token threshold.',
    thread: 'Session thread usage is cumulative and may be null until first idle; stats may be null.',
    hostHandoff: 'The application writes an explicit summary into a new session input. This is separate from platform compaction.',
    unsupported: ['/compact', 'PreCompact', 'PostCompact', 'automatic-compaction query setting'],
    files: ['shared/lab25-compaction-context.ts', 'server/lib/lab25-compaction-context.ts', 'server/concepts/25-compaction-context.ts'] }));
  router.post('/run', async (request, response) => {
    const parsed = lab25RequestSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid bounded context experiment.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Lab 25 live report observations require a separately configured and opted-in Managed agent.')); return; }
    if (closing || active.has(owner) || active.size >= 4) { response.status(429).json(apiError('CAPACITY', 'Wait for the active context replay.')); return; }
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(new Error('Local deadline expired.')), parsed.data.deadlineSeconds * 1000);
    active.set(owner, controller);
    const onClose = () => { if (!response.writableEnded) controller.abort(new Error('Client disconnected.')); };
    response.once('close', onClose);
    try { response.json(await run(parsed.data, controller.signal)); }
    catch { if (!response.headersSent) response.status(controller.signal.aborted ? 504 : 422).json(apiError('INVALID_REQUEST', 'Context replay stopped before verified evidence.')); }
    finally { clearTimeout(timer); response.off('close', onClose); active.delete(owner); }
  });
  router.use(apiErrorHandler);
  return { router, close: async () => { closing = true; for (const controller of active.values()) controller.abort(); active.clear(); } };
}
