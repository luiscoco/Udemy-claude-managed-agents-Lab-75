import { Router, json } from 'express';
import { lab61DemoSchema } from '../../shared/lab61-agent-mcp-server.js';
import { Lab61McpBridge } from '../mcp-agent/lab61.js';
import { runLocalMcpClient } from '../mcp-agent/lab61-client.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab61Router(bridge = new Lab61McpBridge()) {
  const router = Router();
  // Authentication is checked before JSON decoding or transport session lookup.
  router.use('/mcp', (request, response) => { const identity = bridge.authenticate(request);
    if (!identity) { response.set('Cache-Control', 'no-store').status(403).json({ error: 'Authorization required.' }); return; }
    const host = request.headers.host ?? '';
    if (request.headers.origin && request.headers.origin !== `http://${host}`) {
      response.status(403).json({ error: 'Invalid origin.' }); return; }
    json({ strict: true, limit: '8kb' })(request, response, error => {
      if (error) { response.status(400).json({ error: 'Invalid MCP JSON.' }); return; }
      void bridge.handle(request, response, identity).catch(() => {
        if (!response.headersSent) response.status(500).json({ error: 'MCP transport failed.' }); else response.end(); }); }); });
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '2kb' }));
  router.get('/facts', (_request, response) => response.json(bridge.facts()));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab61-agent-mcp-server.ts',
    'server/mcp-agent/lab61.ts', 'server/mcp-agent/lab61-client.ts', 'server/concepts/61-agent-as-mcp-server.ts'],
    note: 'Only a typed support/refund review tool is exposed; no shell or arbitrary workspace.' }));
  router.post('/demo', async (request, response) => { const parsed = lab61DemoSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a local MCP client scenario.')); return; }
    try { const baseUrl = `http://${request.headers.host}/api/c61/mcp`;
      response.json(await runLocalMcpClient(baseUrl, bridge, request.headers['x-lab-owner'] as string, parsed.data.scenario)); }
    catch { response.status(409).json(apiError('CONFLICT', 'Local MCP client demonstration could not complete.')); } });
  router.use(apiErrorHandler); return { router, close: async () => bridge.close() };
}
