import { Router, json } from 'express';
import { lab38ChatSchema, lab38IdSchema, lab38SendSchema, lab38SwitchSchema, lab38WhenSchema } from '../../shared/lab38-prompt-suggestions.js';
import { Lab38Error, Lab38Suggestions } from '../lib/lab38-suggestions.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab38Router(manager = new Lab38Suggestions()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = async (response: import('express').Response, action: () => unknown | Promise<unknown>) => { try { response.json(await action()); }
    catch (error) { const status = error instanceof Lab38Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab38Error ? error.message : 'Suggestion operation failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'host-suggestion-fixture',
    files: ['shared/lab38-prompt-suggestions.ts', 'server/lib/lab38-suggestions.ts', 'server/concepts/38-prompt-suggestions.ts'],
    nativePromptSuggestionEventAssumed: false }));
  router.post('/dry', (_request, response) => response.json({ source: 'host-only', answerUsage: 'separate from optional suggestion usage', autoSendCount: 0 }));
  router.post('/chat', (request, response) => { const parsed = lab38ChatSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid suggestion experiment.')); return; }
    void reply(response, () => manager.chat(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/send', (request, response) => { const parsed = lab38SendSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid explicit user send.')); return; }
    void reply(response, () => manager.send(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/when', (request, response) => { const parsed = lab38WhenSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid suggestion timing request.')); return; }
    void reply(response, async () => { if (parsed.data.waitMs) await new Promise(resolve => setTimeout(resolve, parsed.data.waitMs));
      return manager.when(String(request.headers['x-lab-owner']), parsed.data.conversationId); }); });
  router.post('/switches', (request, response) => { const parsed = lab38SwitchSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid suggestion switch.')); return; }
    void reply(response, () => manager.switches(String(request.headers['x-lab-owner']), parsed.data.conversationId, parsed.data.enabled)); });
  for (const path of ['/cache', '/end']) router.post(path, (request, response) => { const parsed = lab38IdSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid conversation lookup.')); return; }
    void reply(response, () => path === '/cache' ? manager.inspect(String(request.headers['x-lab-owner']), parsed.data.conversationId)
      : manager.end(String(request.headers['x-lab-owner']), parsed.data.conversationId)); });
  router.use(apiErrorHandler);
  return { router, close: async () => manager.close() };
}
