import { Router, json } from 'express';
import { lab43AuthSchema, lab43ReadSchema } from '../../shared/lab43-remote-mcp-resources.js';
import { Lab43Bridge, Lab43Error } from '../lib/lab43-mcp-bridge.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab43Router(manager = new Lab43Bridge()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = async (response: import('express').Response, action: () => unknown | Promise<unknown>) => { try { response.json(await action()); }
    catch (error) { const status = error instanceof Lab43Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab43Error ? error.message : 'MCP bridge request failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'loopback-mcp-bridge-fixture', files: [
    'shared/lab43-remote-mcp-resources.ts', 'mcp-servers/lab43-resources.ts', 'server/lib/lab43-mcp-bridge.ts', 'server/concepts/43-remote-mcp-resources.ts'], directManagedUrlMcp: false }));
  router.get('/facts', (_request, response) => response.json(manager.facts()));
  router.post('/auth', (request, response) => { const parsed = lab43AuthSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid local consent.')); return; }
    void reply(response, () => manager.auth(String(request.headers['x-lab-owner']), parsed.data.consent, parsed.data.refresh)); });
  router.post('/cache', (request, response) => { if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'Cache inspection takes no fields.')); return; }
    void reply(response, () => manager.cacheView(String(request.headers['x-lab-owner']))); });
  router.post('/transports', (request, response) => { if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'Transport inspection takes no fields.')); return; }
    void reply(response, () => manager.inventory(String(request.headers['x-lab-owner']), 'tools/list')); });
  router.post('/toolsets', (request, response) => { if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'Toolset inspection takes no fields.')); return; }
    void reply(response, () => manager.toolsets(String(request.headers['x-lab-owner']))); });
  router.post('/resources', (request, response) => { if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'Resource listing takes no fields.')); return; }
    void reply(response, async () => ({ resources: await manager.inventory(String(request.headers['x-lab-owner']), 'resources/list'),
      templates: await manager.inventory(String(request.headers['x-lab-owner']), 'resources/templates/list'),
      prompts: await manager.inventory(String(request.headers['x-lab-owner']), 'prompts/list') })); });
  router.post('/host-read', (request, response) => { const parsed = lab43ReadSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid host resource read.')); return; }
    void reply(response, () => manager.run(String(request.headers['x-lab-owner']), parsed.data.scenario, parsed.data.uri)); });
  router.post('/live', (_request, response) => response.status(422).json(apiError('INVALID_REQUEST', 'Direct Managed URL MCP needs reachable service and reviewed credentials; live is not configured.')));
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
