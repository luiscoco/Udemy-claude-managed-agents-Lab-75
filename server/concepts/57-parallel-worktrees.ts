import { Router, json } from 'express';
import { lab57RunSchema } from '../../shared/lab57-parallel-worktrees.js';
import { runWorktreeScenario } from '../worktrees/lab57.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab57Router() {
  const router = Router(); let runs = 0; router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '2kb' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab57-parallel-worktrees.ts',
    'server/worktrees/lab57.ts', 'server/concepts/57-parallel-worktrees.ts'],
    note: 'Host Git, path checks and behavioral tests run against disposable local worktrees.' }));
  router.post('/run', (request, response) => { const parsed = lab57RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported worktree scenario.')); return; }
    if (runs >= 8) { response.status(429).json(apiError('CAPACITY', 'Local worktree run capacity reached; restart the lesson server.')); return; }
    try { runs++; response.json(runWorktreeScenario(parsed.data.scenario)); }
    catch { response.status(409).json(apiError('CONFLICT', 'Disposable Git fixture failed; inspect local Git availability.')); } });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
