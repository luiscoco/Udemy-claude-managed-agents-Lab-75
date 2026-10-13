import { Router, json } from 'express';
import { factsSchema, runIdSchema, runRequestSchema } from '../../shared/contracts.js';
import { apiError, apiErrorHandler } from '../../server/lib/errors.js';
import { checkScriptedPolicy } from '../../server/lib/policy.js';
import type { RunStore } from '../../server/lib/run-store.js';
import { openSse } from '../../server/sse.js';

export const testStreamPolicy = Object.freeze({ heartbeatMs: 250, idleMs: 1_500, deadlineMs: 5_000 });

export const testFacts = Object.freeze(factsSchema.parse({ id: 0, path: 'deterministic', liveAvailable: false,
  modelCalls: 0, description: 'Authored fixture; no measured model behavior and no SDK execution.' }));
export function createTestRouter(store: RunStore, router = Router()) {
  router.use((_request, response, next) => { response.setHeader('Cache-Control', 'no-store'); next(); });
  router.get('/facts', (_request, response) => response.json(testFacts));
  router.post('/stream', json({ limit: '8kb', strict: true }), async (request, response) => {
    const input = runRequestSchema.safeParse(request.body);
    if (!input.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Check the request fields.', input.error)); return; }
    const rejection = checkScriptedPolicy(input.data);
    if (rejection) { response.status(422).json(rejection); return; }
    const controller = new AbortController();
    const run = store.createStream(input.data, controller);
    if (!run) { response.status(429).json(apiError('CAPACITY', 'Run capacity is full. Wait for an active run to finish.')); return; }
    const stream = openSse(request, response, { ...testStreamPolicy, controller, quiet: process.env.SSE_LOG_LEVEL === 'quiet' });
    try {
      const result = await run.execute((event) => { stream.send('progress', event); });
      if (!controller.signal.aborted) {
        if (result.status === 'succeeded') stream.send('result', result);
        else if (result.status === 'cancelled') stream.send('canceled', { reason: result.outcome?.status === 'cancelled' ? result.outcome.reason : 'user' });
        else stream.send('error', { message: 'The fixture could not be completed.', snapshot: result });
      }
    } finally { await stream.end(); }
  });
  router.post('/runs', json({ limit: '8kb', strict: true }), (request, response) => {
    const input = runRequestSchema.safeParse(request.body);
    if (!input.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Check the request fields.', input.error)); return; }
    const rejection = checkScriptedPolicy(input.data);
    if (rejection) { response.status(422).json(rejection); return; }
    const run = store.start(input.data);
    if (!run) { response.status(429).json(apiError('CAPACITY', 'Run capacity is full. Retry after a run finishes or expires.')); return; }
    response.status(202).json(run);
  });
  router.route('/runs/:runId').all((request, response, next) => {
    const id = runIdSchema.safeParse(request.params.runId);
    if (!id.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid run ID.', id.error)); return; }
    next();
  }).get((request, response) => {
    const run = store.get(request.params.runId);
    if (!run) { response.status(404).json(apiError('NOT_FOUND', 'Run not found or expired.')); return; }
    response.json(run);
  }).delete((request, response) => {
    if (!store.cancel(request.params.runId)) { response.status(404).json(apiError('NOT_FOUND', 'Run not found or expired.')); return; }
    response.status(202).json(store.get(request.params.runId));
  });
  router.use(apiErrorHandler);
  return router;
}
