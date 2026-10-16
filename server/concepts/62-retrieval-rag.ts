import { Router, json } from 'express';
import { lab62QuerySchema, lab62SearchSchema } from '../../shared/lab62-retrieval-rag.js';
import { chunks, knowledgeToolDefinition, queryKnowledge, retrievalEval, searchKnowledge } from '../retrieval/lab62.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab62Router() {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '2kb' }));
  router.get('/facts', (_request, response) => response.json({ source: 'offline-lexical-retrieval',
    currentAcmeChunks: chunks.filter(item => item.tenant === 'acme' && item.version === 'current').length,
    archivedExcluded: 1, foreignTenantExcluded: 1, tool: knowledgeToolDefinition,
    providerCalls: 0, note: 'Current Acme return policy is 30 days; lexical scoring uses no embeddings.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab62-retrieval-rag.ts',
    'server/retrieval/lab62.ts', 'server/concepts/62-retrieval-rag.ts'],
    note: 'Stable heading IDs and filtered host retrieval are authoritative.' }));
  router.post('/search', (request, response) => { const parsed = lab62SearchSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Provide a bounded lexical query.')); return; }
    response.json(searchKnowledge(parsed.data)); });
  router.get('/eval', (_request, response) => response.json({ cases: retrievalEval(), providerCalls: 0 }));
  router.post('/query', (request, response) => { const parsed = lab62QuerySchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported offline query.')); return; }
    response.json(queryKnowledge(parsed.data.question, parsed.data.scenario)); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
