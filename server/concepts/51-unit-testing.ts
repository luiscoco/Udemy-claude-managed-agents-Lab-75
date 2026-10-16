import { Router, json } from 'express';
import { lab51ReplaySchema, lab51RunSchema } from '../../shared/lab51-unit-testing.js';
import { replayLab51, runLab51Scenario } from '../unit-testing/lab51.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab51Router() {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '2kb' }));
  let active = 0;
  router.get('/facts', (_request, response) => response.json({ source: 'offline-injected-host', providerCalls: 0,
    uses: ['Lab 50 store', 'Lab 50 typed handlers', 'Lab 50 retained session port', 'shared event consumer', 'closed report schema'],
    mutation: 'A 60-day refund window is intentionally substituted under a virtual clock; the 30-day assertion must fail.',
    noEnvironmentLoading: true, maxConcurrentRuns: 2 }));
  router.get('/code', (_request, response) => response.json({ files: [
    'shared/lab51-unit-testing.ts', 'server/unit-testing/lab51.ts', 'server/concepts/51-unit-testing.ts',
    'server/capstone/store.ts', 'server/capstone/tools.ts', 'server/capstone/desk.ts', 'server/lib/session-events.ts'],
    note: 'Offline scenarios import the actual application modules; no SDK hooks or provider calls.' }));
  router.post('/run', (request, response) => { const parsed = lab51RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported offline scenario.')); return; }
    if (active >= 2) { response.status(429).json(apiError('CAPACITY', 'Two offline runs are already active.')); return; }
    active++; const local = new AbortController(), timer = setTimeout(() => local.abort('deadline'), 10000);
    response.on('close', () => { if (!response.writableEnded) local.abort('disconnect'); });
    void runLab51Scenario(parsed.data.scenario, local.signal).then(result => { if (!response.destroyed) response.json(result); },
      () => { if (!response.destroyed) response.status(500).json(apiError('INTERNAL', 'Offline test did not finish.')); })
      .finally(() => { clearTimeout(timer); active--; }); });
  router.post('/replay', (request, response) => { const parsed = lab51ReplaySchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported replay.')); return; }
    response.json({ source: 'offline-injected-host', providerCalls: 0, scenario: parsed.data.scenario,
      assertions: replayLab51(parsed.data.scenario) }); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
