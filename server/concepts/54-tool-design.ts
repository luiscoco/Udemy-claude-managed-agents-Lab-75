import { Router, json } from 'express';
import { lab54CallSchema, lab54RunSchema } from '../../shared/lab54-tool-design.js';
import { callLab54, lintToolContract, runLab54 } from '../tool-design/lab54.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab54Router() {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '2kb' }));
  router.get('/facts', (_request, response) => response.json({ source: 'offline-authored-workshop', providerCalls: 0,
    vague: lintToolContract('vague'), explicit: lintToolContract('explicit'),
    installedSdk: '@anthropic-ai/sdk 1.7.0 custom tools expose name, description and input_schema; host metadata is separate.',
    maxConcurrentRuns: 2 }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab54-tool-design.ts',
    'server/tool-design/lab54.ts', 'server/concepts/54-tool-design.ts',
    'server/capstone/tools.ts', 'server/capstone/store.ts'],
    note: 'Zod generates closed schemas; only the host handler may create an approval or refund.' }));
  let active = 0;
  const execute = (response: import('express').Response, action: () => unknown) => {
    if (active >= 2) { response.status(429).json(apiError('CAPACITY', 'Workshop capacity reached.')); return; }
    active++; try { response.json(action()); } catch {
      response.status(500).json(apiError('INTERNAL', 'Offline workshop failed.')); } finally { active--; } };
  router.post('/call', (request, response) => { const parsed = lab54CallSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported tool and scenario.')); return; }
    execute(response, () => callLab54(parsed.data.variant, parsed.data.scenario)); });
  router.post('/run', (request, response) => { const parsed = lab54RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported tool design.')); return; }
    execute(response, () => runLab54(parsed.data.variant)); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
