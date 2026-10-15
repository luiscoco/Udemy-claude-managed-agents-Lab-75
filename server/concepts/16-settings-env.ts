import { Router, json } from 'express';
import { lab16AccessSchema, lab16LayersSchema, lab16RequestSchema, lab16ResolutionSchema, lab16RunSchema } from '../../shared/lab16-settings-env.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { createFixturePort } from '../lib/lab01-port.js';
import { runLab01 } from '../lib/lab01-run.js';
import { createLiveLab16Port } from '../lib/lab16-port.js';
import { checkLab16Access, fixtureMount, lab16Manifest, resolveLab16 } from '../lib/lab16-provenance.js';
import { managedSettings } from '../lib/managed-config.js';
import { openSse } from '../sse.js';

export function createLab16Router() {
  const router = Router(), active = new Map<string, AbortController>();
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      request.method !== 'GET' && !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '8kb' }));
  router.get('/files', (_request, response) => response.json(lab16Manifest()));
  router.post('/resolve', (request, response) => {
    const parsed = lab16RequestSchema.safeParse(request.body);
    if (!parsed.success || parsed.data.mode !== 'scripted') { response.status(400).json(apiError('INVALID_REQUEST', 'Use a bounded offline resolver request.')); return; }
    response.json(lab16ResolutionSchema.parse(resolveLab16(parsed.data)));
  });
  router.post('/layers-run', (request, response) => {
    const parsed = lab16RequestSchema.safeParse(request.body);
    if (!parsed.success || parsed.data.mode !== 'scripted') { response.status(400).json(apiError('INVALID_REQUEST', 'Use a bounded offline layer request.')); return; }
    const cases = [
      { ...parsed.data, userRegion: null, sessionRegion: null },
      { ...parsed.data, userRegion: parsed.data.userRegion ?? 'south' as const, sessionRegion: null },
      { ...parsed.data, userRegion: parsed.data.userRegion ?? 'south' as const, sessionRegion: parsed.data.sessionRegion ?? 'north' as const },
    ];
    response.json(lab16LayersSchema.parse({ comparisons: cases.map(resolveLab16),
      note: 'Synthetic application precedence; no process or personal settings were inspected.' }));
  });
  router.post('/access-run', (request, response) => {
    const parsed = lab16AccessSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose an authored path and scenario.')); return; }
    const check = checkLab16Access(parsed.data.path, parsed.data.scenario !== 'absent-remote-mount');
    response.json({ path: parsed.data.path, ...check, effect: 'no file opened; host-policy demonstration' });
  });
  router.post('/env-run', async (request, response) => {
    const parsed = lab16RequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid experiment or unsupported Managed settings.')); return; }
    const input = parsed.data, owner = String(request.headers['x-lab-owner']), settings = managedSettings();
    if (input.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    if (input.mode === 'live' && !lab16Manifest().liveReady) { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Live base setup or approved file ID is unavailable.')); return; }
    if (active.has(owner) || active.size >= settings.maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'A prior experiment is active.')); return; }
    const controller = new AbortController(); active.set(owner, controller);
    const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 25000, deadlineMs: input.deadlineSeconds * 1000 + 20000, quiet: true });
    try {
      const port = input.mode === 'live' ? createLiveLab16Port() : createFixturePort('normal', 15);
      const session = await runLab01({ mode: input.mode, prompt: input.prompt, port, signal: controller.signal,
        deadlineMs: input.deadlineSeconds * 1000, cleanupWaitMs: 4000, emit: frame => {
          if (frame.kind === 'notice' || frame.kind === 'session') stream.send('progress', frame);
        } });
      const live = input.mode === 'live' ? port as ReturnType<typeof createLiveLab16Port> : null;
      const report = lab16RunSchema.parse({ source: session.source, resolution: resolveLab16(input), requestedMount: live?.evidence.requestedMount ??
        (input.scenario === 'absent-remote-mount' ? null : fixtureMount),
        observedMount: live?.evidence.observedMount ?? (input.scenario === 'absent-remote-mount' ? 'absent' : 'fixture'),
        resolvedEnvironment: live?.evidence.resolvedEnvironment ?? (input.mode === 'scripted' ? { kind: 'authored-fixture', archived: false,
          networking: 'limited', packageCount: 0 } : null), session,
        message: input.mode === 'live' ? 'Remote environment metadata and resource listing are API observations; the answer alone does not prove a file read.'
          : 'All host layers, credentials, mounts and response text are authored offline evidence.' });
      if (!controller.signal.aborted) stream.send('result', report);
    } catch { if (!controller.signal.aborted) stream.send('error', { message: 'Experiment failed. Inspect local setup and reconcile any remote session before retrying.' }); }
    finally { active.delete(owner); await stream.end(); }
  });
  router.use(apiErrorHandler);
  return { router, close: async () => { for (const controller of active.values()) controller.abort('server-close'); active.clear(); } };
}
