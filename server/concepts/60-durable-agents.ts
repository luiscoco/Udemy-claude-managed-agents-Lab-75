import { Router, json } from 'express';
import { lab60RecoverSchema, lab60ResetSchema, lab60RunSchema } from '../../shared/lab60-durable-agents.js';
import { DurableStore, eligible, items, toolDefinitions } from '../durable/lab60.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab60Router(store = new DurableStore()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '3kb' }));
  const owner = (request: import('express').Request) => request.headers['x-lab-owner'] as string;
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { const message = error instanceof Error && /capacity|owner|terminal/.test(error.message) ? error.message :
      'Durable fixture could not complete a local journal operation.';
      response.status(/capacity/.test(message) ? 429 : 409).json(apiError('CONFLICT', message)); } };
  router.get('/facts', (_request, response) => response.json({ source: 'offline-durable-fixture', items: 8,
    toolDefinitions, providerCalls: 0, liveConfigured: false,
    builtInTools: 'disabled', mcp: 'disabled', skills: 'disabled',
    note: 'Custom-tool schemas are Zod-generated. The host ledger, not a transcript, owns effects.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab60-durable-agents.ts',
    'server/durable/lab60.ts', 'server/concepts/60-durable-agents.ts'],
    note: 'The host owns atomic journals, effect keys, ledger, lease and supervisor.' }));
  router.get('/simulate', (_request, response) => response.json({ scenarios: ['crash-after-third', 'lease-loss', 'no-progress'],
    strategies: ['naive-restart', 'journal-only', 'journal-idempotency'],
    expectedDuplicates: { 'naive-restart': 3, 'journal-only': 1, 'journal-idempotency': 0 },
    note: 'Preview only; no job created.' }));
  router.get('/policy', (_request, response) => response.json({ days: 30, maxCents: 20000, unusedRequired: true,
    items: items.map(item => ({ ...item, eligible: eligible(item) })), currency: 'EUR', actualPayments: false }));
  router.get('/jobs', (request, response) => reply(response, () => ({ jobs: store.jobs(owner(request)) })));
  router.post('/reset', (request, response) => { const parsed = lab60ResetSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Explicit reset confirmation required.')); return; }
    reply(response, () => store.reset(owner(request))); });
  router.post('/run', (request, response) => { const parsed = lab60RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported failure scenario.')); return; }
    reply(response, () => store.start(owner(request), parsed.data.scenario)); });
  router.post('/recover', (request, response) => { const parsed = lab60RecoverSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose an owned job and recovery strategy.')); return; }
    reply(response, () => store.recover(parsed.data.jobId, owner(request), parsed.data.strategy)); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
