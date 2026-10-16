import { Router, json } from 'express';
import { z } from 'zod';
import { lab58RunSchema, lab58SearchSchema } from '../../shared/lab58-tool-search.js';
import { invokeCatalogTool, measureCatalog, planCatalog, searchCatalog, tools } from '../tool-search/lab58.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

const measureSchema = z.strictObject({ query: z.string().trim().min(2).max(120) });
export function createLab58Router() {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/facts', (_request, response) => response.json({ source: 'offline-host-scorer', totalTools: tools.length,
    domains: 8, loadedAtInit: 0, providerCalls: 0, nativeToolSearch: 'unsupported-unverified',
    sdkSettings: ['searchHint', 'alwaysLoad', 'false', 'true', 'auto:N'].map(name => ({ name, status: 'unsupported-unverified' })),
    note: 'search_catalog and fixed-schema invoke_catalog_tool are application simulation surfaces.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab58-tool-search.ts',
    'server/tool-search/lab58.ts', 'server/concepts/58-tool-search.ts'],
    note: 'Definitions are application catalog data; returned search results do not register new native custom tools.' }));
  router.post('/plan', (request, response) => { if (!z.strictObject({}).safeParse(request.body).success) {
    response.status(400).json(apiError('INVALID_REQUEST', 'Plan has no client settings.')); return; }
    response.json(planCatalog()); });
  router.post('/search', (request, response) => { const parsed = lab58SearchSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a bounded search query.')); return; }
    response.json(searchCatalog(parsed.data)); });
  router.post('/measure', (request, response) => { const parsed = measureSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a bounded measure query.')); return; }
    response.json(measureCatalog(parsed.data.query)); });
  router.post('/run', (request, response) => { const parsed = lab58RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a closed dispatcher request.')); return; }
    response.json(invokeCatalogTool(parsed.data, request.headers['x-lab-owner'] as string)); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
