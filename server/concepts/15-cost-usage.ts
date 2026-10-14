import { Router, json } from 'express';
import { lab15BudgetSchema, lab15ContextSchema, lab15ControlSchema, lab15RequestSchema, lab15SendSchema } from '../../shared/lab15-usage.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { Lab15Error, Lab15Sessions } from '../lib/lab15-sessions.js';
import { openSse } from '../sse.js';

export function createLab15Router(sessions = new Lab15Sessions()) {
  const router = Router();
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` || !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '8kb' }));
  router.post('/session', (request, response) => {
    const data = lab15RequestSchema.safeParse(request.body); if (!data.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid bounded session settings.', data.error)); return; }
    try { response.json(sessions.prepare(String(request.headers['x-lab-owner']), data.data)); }
    catch (error) { response.status(error instanceof Lab15Error ? error.status : 422).json(apiError('INVALID_REQUEST', error instanceof Lab15Error ? error.message : 'Live setup is unavailable.')); }
  });
  for (const operation of ['run', 'send', 'budget'] as const) router.post(`/${operation}`, async (request, response) => {
    const data = operation === 'run' ? lab15RequestSchema.safeParse(request.body) : operation === 'send' ? lab15SendSchema.safeParse(request.body) : lab15BudgetSchema.safeParse(request.body);
    if (!data.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid request. Budget raises require an explicit resume acknowledgment.', data.error)); return; }
    const owner = String(request.headers['x-lab-owner']), controller = new AbortController(); let stream: ReturnType<typeof openSse> | undefined;
    try {
      const runId = operation === 'run' ? sessions.prepare(owner, lab15RequestSchema.parse(data.data)).runId : lab15ControlSchema.parse({ runId: request.body.runId }).runId;
      const action = operation === 'budget' ? { type: 'raise' as const, cents: lab15BudgetSchema.parse(data.data).budgetCents } : { type: 'send' as const, prompt: operation === 'run' ? lab15RequestSchema.parse(data.data).prompt : lab15SendSchema.parse(data.data).prompt };
      const work = sessions.execute(runId, owner, action, controller.signal, snapshot => { stream?.send('progress', snapshot); });
      stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 25000, deadlineMs: 200000, quiet: true });
      stream.send('prepared', { runId });
      const result = await work; if (!controller.signal.aborted) stream.send('result', result);
    } catch (error) {
      const message = error instanceof Lab15Error ? error.message : 'Operation unavailable. Inspect setup and reconcile earlier work.';
      if (stream) { if (!controller.signal.aborted) stream.send('error', { message }); }
      else response.status(error instanceof Lab15Error ? error.status : 422).json(apiError('INVALID_REQUEST', message));
    } finally { await stream?.end(); }
  });
  for (const operation of ['context', 'usage', 'end'] as const) router.post(`/${operation}`, async (request, response) => {
    const data = operation === 'context' ? lab15ContextSchema.safeParse(request.body) : lab15ControlSchema.safeParse(request.body);
    if (!data.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid owned experiment request.', data.error)); return; }
    const owner = String(request.headers['x-lab-owner']);
    try { const result = operation === 'context' ? await sessions.context(data.data.runId, owner, lab15ContextSchema.parse(data.data).text)
      : operation === 'usage' ? await sessions.usage(data.data.runId, owner) : await sessions.end(data.data.runId, owner); response.json(result); }
    catch (error) { response.status(error instanceof Lab15Error ? error.status : 500).json(apiError('INVALID_REQUEST', error instanceof Lab15Error ? error.message : 'Cannot complete this operation.')); }
  });
  router.use(apiErrorHandler); return { router, close: () => sessions.close() };
}
