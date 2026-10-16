import { Router, json } from 'express';
import { lab56LiveSchema, lab56ReplaySchema } from '../../shared/lab56-agent-teams.js';
import { replayTeam } from '../teams/lab56.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab56Router() {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '2kb' }));
  router.get('/facts', (_request, response) => response.json({ source: 'offline-team-reducer', providerCalls: 0,
    identities: ['researcher', 'reviewer'], expression: '12 + 18 + 7 = 37', maxActions: 24, maxMessages: 8,
    liveConfigured: false, nativeDelegation: 'optional; requires separately verified Managed thread_message events and thread IDs',
    hostDriven: 'separate sessions could use bounded send_message/read_messages custom tools',
    note: 'No Claude Code SendMessage or private mailbox files are assumed.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab56-agent-teams.ts',
    'server/teams/lab56.ts', 'server/concepts/56-agent-teams.ts'],
    note: 'The reducer owns claims, dependencies, envelope state, arithmetic verification and shutdown.' }));
  router.post('/replay', (request, response) => { const parsed = lab56ReplaySchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported replay scenario.')); return; }
    response.json(replayTeam(parsed.data.scenario)); });
  router.post('/live', (request, response) => { const parsed = lab56LiveSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Live request requires a closed mode and confirmation.')); return; }
    response.status(422).json(apiError('UNSUPPORTED_MODE', 'Native or host-driven live delegation is not configured in this offline lesson.')); });
  router.use(apiErrorHandler); return { router, close: async () => {} };
}
