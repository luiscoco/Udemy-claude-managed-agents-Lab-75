import { Router, json } from 'express';
import { lab55RunSchema, lab55TransitionSchema } from '../../shared/lab55-upgrading-sdk.js';
import { Lab55UpgradeStore } from '../upgrades/lab55.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab55Router(store = new Lab55UpgradeStore()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '2kb' })); const ownerOf = (request: import('express').Request) =>
    request.headers['x-lab-owner'] as string;
  const reply = (response: import('express').Response, action: () => unknown) => { try { response.json(action()); }
    catch (error) { response.status(error instanceof Error && /capacity/.test(error.message) ? 429 : 409)
      .json(apiError('CONFLICT', error instanceof Error ? error.message : 'Upgrade rehearsal failed.')); } };
  router.get('/facts', (_request, response) => response.json(store.facts()));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab55-upgrading-sdk.ts',
    'server/upgrades/lab55.ts', 'server/concepts/55-upgrading-sdk.ts', 'server/lib/session-events.ts'],
    note: 'The teaching application keeps the installed and lockfile SDK at 0.133.0.' }));
  router.post('/run', (request, response) => { const parsed = lab55RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported compatibility fixture.')); return; }
    reply(response, () => store.run(ownerOf(request), parsed.data.scenario, parsed.data.clientEligible)); });
  router.post('/transition', (request, response) => { const parsed = lab55TransitionSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported transition.')); return; }
    reply(response, () => store.transition(ownerOf(request), parsed.data.runId, parsed.data.action, parsed.data.clientEligible)); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
