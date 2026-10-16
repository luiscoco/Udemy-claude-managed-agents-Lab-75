import { Router, json } from 'express';
import { lab63BlockedSqlSchema, lab63DecisionSchema, lab63FixtureSchema, lab63QuerySchema,
  lab63SessionSchema } from '../../shared/lab63-safe-database-agent.js';
import { lab63ToolDefinitions, SafeDatabaseStore } from '../database/lab63.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab63Router(store = new SafeDatabaseStore()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '3kb' })); const owner = (request: import('express').Request) =>
    request.headers['x-lab-owner'] as string;
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const message = error instanceof Error && /capacity|foreign|tenant|status|decided|open/.test(error.message) ?
      error.message : 'Host database operation rejected.';
      response.status(/capacity/.test(message) ? 429 : 409).json(apiError('CONFLICT', message)); } };
  router.get('/facts', (_request, response) => response.json({ source: 'offline-sqlite', database: 'node:sqlite DatabaseSync',
    toolDefinitions: lab63ToolDefinitions, policy: 'fixed parameterized SELECT plus host-reviewed cancellation',
    providerCalls: 0, note: 'No arbitrary SQL or caller-selected workspace reaches DatabaseSync.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab63-safe-database-agent.ts',
    'server/database/lab63.ts', 'server/concepts/63-safe-database-agent.ts'],
    note: 'The host owns tenant predicates, read-only connection and approval transaction.' }));
  router.post('/sessions', (request, response) => { if (!lab63SessionSchema.safeParse(request.body).success) {
    response.status(400).json(apiError('INVALID_REQUEST', 'Create an offline session only.')); return; }
    reply(response, () => store.create(owner(request))); });
  router.get('/sessions/:id', (request, response) => reply(response, () => store.snapshot(request.params.id as string, owner(request))));
  router.post('/sessions/:id/blocked-sql', (request, response) => { if (!lab63BlockedSqlSchema.safeParse(request.body).success) {
    response.status(400).json(apiError('INVALID_REQUEST', 'Supply SQL text as blocked teaching data only.')); return; }
    reply(response, () => store.blockedSql(request.params.id as string, owner(request))); });
  router.post('/sessions/:id/query', (request, response) => { const parsed = lab63QuerySchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a fixed read or proposal tool.')); return; }
    reply(response, () => store.query(request.params.id as string, owner(request), parsed.data)); });
  router.post('/sessions/:id/decision', (request, response) => { const parsed = lab63DecisionSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a pending proposal and decision.')); return; }
    reply(response, () => store.decision(request.params.id as string, owner(request), parsed.data.proposalId, parsed.data.decision)); });
  router.post('/sessions/:id/fixture', (request, response) => { const parsed = lab63FixtureSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported offline fixture.')); return; }
    reply(response, () => store.fixture(request.params.id as string, owner(request), parsed.data.action)); });
  router.use(apiErrorHandler); return { router, close: async () => store.close() };
}
