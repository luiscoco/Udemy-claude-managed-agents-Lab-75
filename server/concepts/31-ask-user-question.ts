import { Router, json } from 'express';
import { z } from 'zod';
import { lab31AnswerSchema, lab31AskUserShape, lab31RunSchema, lab31ToolsSchema } from '../../shared/lab31-ask-user-question.js';
import { Lab31Error, Lab31Questions } from '../lib/lab31-questions.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab31Router(questions = new Lab31Questions()) {
  const router = Router();
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const status = error instanceof Lab31Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab31Error ? error.message : 'Question control failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'installed-sdk-1.7.0-and-authored-pause',
    files: ['shared/lab31-ask-user-question.ts', 'server/lib/lab31-questions.ts', 'server/concepts/31-ask-user-question.ts'],
    toolInputSchema: z.toJSONSchema(lab31AskUserShape, { target: 'draft-2020-12', io: 'input' }),
    resultType: 'user.custom_tool_result', unsupported: ['canUseTool mutation', 'built-in AskUserQuestion'] }));
  router.post('/run', (request, response) => { const parsed = lab31RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid question scenario.')); return; }
    reply(response, () => questions.run(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/answer', (request, response) => { const parsed = lab31AnswerSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid correlated answer.')); return; }
    reply(response, () => questions.answer(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/tools', (request, response) => { const parsed = lab31ToolsSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid question operation.')); return; }
    const owner = String(request.headers['x-lab-owner']);
    if (parsed.data.operation === 'inspect') { reply(response, () => questions.inspect(owner, parsed.data.runId)); return; }
    if (parsed.data.operation === 'cancel') { reply(response, () => questions.cancel(owner, parsed.data.runId)); return; }
    const controller = new AbortController(), onClose = () => { if (!response.writableEnded) controller.abort(); };
    response.once('close', onClose);
    void questions.wait(owner, parsed.data.runId, parsed.data.timeoutMs, controller.signal).then(snapshot => { if (!response.destroyed) response.json(snapshot); })
      .catch(error => { if (!response.destroyed) response.status(error instanceof Lab31Error ? error.statusCode : 500).json(apiError('INVALID_REQUEST', 'Question wait ended.')); })
      .finally(() => response.off('close', onClose));
  });
  router.use(apiErrorHandler);
  return { router, close: async () => questions.close() };
}
