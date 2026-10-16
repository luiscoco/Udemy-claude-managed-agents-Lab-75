import { Router, json } from 'express';
import { lab52CalibrateSchema, lab52PairwiseSchema, lab52PromoteSchema, lab52RunSchema } from '../../shared/lab52-evals.js';
import { Lab52EvalStore } from '../evals/lab52.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab52Router(store = new Lab52EvalStore()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '2kb' }));
  const ownerOf = (request: import('express').Request) => request.headers['x-lab-owner'] as string;
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { response.status(error instanceof Error && /capacity/.test(error.message) ? 429 : 409)
      .json(apiError('CONFLICT', error instanceof Error ? error.message : 'Eval failed.')); } };
  router.get('/facts', (_request, response) => response.json(store.facts()));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab52-evals.ts', 'server/evals/lab52.ts',
    'server/concepts/52-evals.ts', 'server/capstone/tools.ts', 'server/capstone/store.ts'],
    note: 'Offline evaluator invokes the same typed host tools. Live identity and usage remain unknown.' }));
  router.get('/baseline', (request, response) => reply(response, () => store.baseline(ownerOf(request))));
  router.post('/demo', (request, response) => { if (Object.keys(request.body ?? {}).length) {
    response.status(400).json(apiError('INVALID_REQUEST', 'Demo takes no fields.')); return; }
    response.json(store.demo()); });
  router.post('/calibrate', (request, response) => { const parsed = lab52CalibrateSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid calibration scenario.')); return; }
    response.json(store.calibrate(parsed.data.scenario)); });
  router.post('/run', (request, response) => { const parsed = lab52RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid eval request.')); return; }
    reply(response, () => store.run(ownerOf(request), parsed.data.variant, parsed.data.trials, parsed.data.judge)); });
  router.post('/promote', (request, response) => { const parsed = lab52PromoteSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid promotion request.')); return; }
    reply(response, () => store.promote(ownerOf(request), parsed.data.runId)); });
  router.post('/pairwise', (request, response) => { const parsed = lab52PairwiseSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid report pair.')); return; }
    reply(response, () => store.pairwise(ownerOf(request), parsed.data.baselineRunId, parsed.data.candidateRunId)); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
