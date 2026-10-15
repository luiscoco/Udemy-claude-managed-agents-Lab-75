import { Router, json } from 'express';
import { lab33LogSchema, lab33RespondSchema, lab33RunSchema, lab33WhoSchema } from '../../shared/lab33-mcp-elicitation.js';
import { Lab33Elicitation, Lab33Error } from '../lib/lab33-elicitation.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab33Router(manager = new Lab33Elicitation()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = async (response: import('express').Response, action: () => unknown | Promise<unknown>) => { try { response.json(await action()); }
    catch (error) { const status = error instanceof Lab33Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab33Error ? error.message : 'Elicitation operation failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'local-mcp-stdio-and-host-bridge',
    files: ['mcp-servers/lab33-form.mjs', 'server/lib/lab33-elicitation.ts', 'server/concepts/33-mcp-elicitation.ts'],
    cloudCallbackAssumed: false, consentOrigin: 'same-origin-only' }));
  router.post('/run', (request, response) => { const parsed = lab33RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid elicitation experiment.')); return; }
    void reply(response, () => manager.run(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/respond', (request, response) => { const parsed = lab33RespondSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid closed form response.')); return; }
    void reply(response, () => manager.respond(String(request.headers['x-lab-owner']), parsed.data)); });
  router.post('/who', (request, response) => { const parsed = lab33WhoSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid form operation.')); return; }
    void reply(response, () => parsed.data.operation === 'inspect' ? manager.inspect(String(request.headers['x-lab-owner']), parsed.data.runId)
      : manager.abort(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  for (const path of ['/log', '/hooklog']) router.post(path, (request, response) => { const parsed = lab33LogSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid log request.')); return; }
    void reply(response, () => manager.inspect(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  router.get('/consent/:id/status', (request, response) => void reply(response,
    () => manager.byConsent(String(request.headers['x-lab-owner']), String(request.params.id))));
  router.get('/consent/:id', (request, response) => void reply(response,
    () => manager.byConsent(String(request.headers['x-lab-owner']), String(request.params.id))));
  router.post('/consent/:id', (request, response) => { const parsed = lab33RespondSchema.safeParse(request.body);
    if (!parsed.success || parsed.data.consentId !== request.params.id) {
      response.status(400).json(apiError('INVALID_REQUEST', 'Consent response does not match this fixed local page.')); return; }
    void reply(response, () => manager.respond(String(request.headers['x-lab-owner']), parsed.data)); });
  router.use(apiErrorHandler);
  return { router, close: async () => manager.close() };
}
