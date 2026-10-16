import { Router, json } from 'express';
import { lab48RequestSchema } from '../../shared/lab48-security-hardening.js';
import { Lab48Error, Lab48SecurityRange } from '../lib/lab48-security-range.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab48Router(manager = new Lab48SecurityRange()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/facts', (_request, response) => response.json(manager.facts()));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab48-security-hardening.ts',
    'server/lib/lab48-security-range.ts', 'server/concepts/48-security-hardening.ts'], providerCalls: 0 }));
  const permitted = { permissions: ['secret-read', 'out-of-scope-write'], lockdown: ['secret-read', 'out-of-scope-write', 'injected-egress'],
    secrets: ['secret-read'], injection: ['injected-egress'] } as const;
  for (const [route, actions] of Object.entries(permitted)) router.post(`/${route}`, async (request, response) => {
    const parsed = lab48RequestSchema.safeParse(request.body);
    if (!parsed.success || !actions.includes(parsed.data.action as never)) {
      response.status(400).json(apiError('INVALID_REQUEST', 'Invalid security range request.')); return; }
    try { response.json(await manager.run(parsed.data.policy, parsed.data.action, request.signal)); }
    catch (error) { response.status(error instanceof Lab48Error ? error.statusCode : 500).json(apiError('INVALID_REQUEST',
      error instanceof Lab48Error ? error.message : 'Security range failed.')); }
  });
  router.use(apiErrorHandler); return { router, close: () => manager.close() };
}
