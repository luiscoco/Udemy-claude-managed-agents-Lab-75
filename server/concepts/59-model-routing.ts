import { Router, json } from 'express';
import { lab59DelegateSchema, lab59ResolutionSchema, lab59RunSchema } from '../../shared/lab59-model-routing.js';
import { delegateTask, modelFacts, planRouting, resolveReport, runRouting, tasks } from '../routing/lab59.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab59Router() {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/facts', (_request, response) => response.json({ source: 'offline-routing-fixture', tasks: 13,
    strategies: 7, providerCalls: 0, liveAvailable: false, noQuerySetModel: true,
    note: 'Optional live model availability, price and spending must be checked before any actual session.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab59-model-routing.ts',
    'server/routing/lab59.ts', 'server/routing/lab59-keys.ts', 'server/concepts/59-model-routing.ts'] }));
  router.get('/plan', (_request, response) => response.json(planRouting()));
  router.get('/models', (_request, response) => response.json(modelFacts()));
  router.post('/run', (request, response) => { const parsed = lab59RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported strategy and bounded budget.')); return; }
    response.json(runRouting(parsed.data.strategy, parsed.data.budgetUnits)); });
  router.post('/delegate', (request, response) => { const parsed = lab59DelegateSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a known task and strategy.')); return; }
    const task = tasks.find(item => item.id === parsed.data.taskId)!;
    response.json({ source: 'offline-routing-fixture', taskId: task.id, strategy: parsed.data.strategy,
      plannedTiers: delegateTask(task, parsed.data.strategy),
      result: runRouting(parsed.data.strategy, 10000, [task]) }); });
  router.post('/resolution', (request, response) => { const parsed = lab59ResolutionSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Provide a closed JSON report for a known task.')); return; }
    response.json(resolveReport(parsed.data.taskId, parsed.data.reportText)); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
