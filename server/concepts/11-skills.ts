import { Router, json } from 'express';
import { lab11RequestSchema, lab11LoadSchema, bundleRevisions, lab11CatalogSchema } from '../../shared/lab11-skills.js';
import type { Lab11Request } from '../../shared/lab11-skills.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { readSkillBundle, readSkillPins } from '../lib/lab11-bundle.js';
import { createFixtureLab11Port, createLiveLab11Port } from '../lib/lab11-port.js';
import type { Lab11Port } from '../lib/lab11-port.js';
import { runLab11 } from '../lib/lab11-run.js';
import { LabError } from '../lib/lab01-run.js';
import { openSse } from '../sse.js';

export function createLab11Router(live: (input: Lab11Request) => Promise<Lab11Port> = createLiveLab11Port, fixtureStepMs = 30) {
  const router = Router(); const active = new Map<AbortController, Promise<void>>(); const owners = new Set<string>(); let closing = false;
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? ''; const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) { response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return; } next(); });
  router.get('/skills', async (_request, response) => {
    const bundles = await Promise.all(bundleRevisions.map(readSkillBundle)); let manifestValid = true;
    const pins = await readSkillPins().catch(() => { manifestValid = false; return { pins: {} } as Awaited<ReturnType<typeof readSkillPins>>; });
    response.json(lab11CatalogSchema.parse({ source: 'authored-host-bundles', bundles, manifestValid, liveReady: managedSettings().liveReady,
      configuredPins: bundles.map(b => ({ revision: b.revision, configured: Boolean(pins.pins[b.revision]), matchesBundle: pins.pins[b.revision]?.bundleHash === b.hash })) }));
  });
  router.post('/load', json({ limit: '2kb', strict: true }), async (request, response) => {
    const parsed = lab11LoadSchema.safeParse(request.body); if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Select an authored revision and file.')); return; }
    const bundle = await readSkillBundle(parsed.data.revision); const file = bundle.files.find(f => f.path === parsed.data.file);
    if (!file) { response.status(404).json(apiError('NOT_FOUND', 'The selected authored bundle omits this reference.')); return; }
    response.json({ source: 'host-preview', revision: bundle.revision, file: file.path, text: file.text, agentRead: false });
  });
  for (const action of ['invoke', 'new-session']) router.post(`/${action}`, json({ limit: '8kb', strict: true }), async (request, response) => {
    const parsed = lab11RequestSchema.safeParse(request.body); const owner = request.headers['x-lab-owner'];
    if (!parsed.success || typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) { response.status(400).json(apiError('INVALID_REQUEST', 'Check the exercise owner, variant, prompt and limits. Agent SDK skill fields are unsupported.')); return; }
    if (closing || owners.has(owner) || active.size >= Math.min(2, managedSettings().maxConcurrent)) { response.status(429).json(apiError('CAPACITY', 'Wait for the active exercise to finish.')); return; }
    if (parsed.data.deadlineSeconds * 1000 > managedSettings().deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    const controller = new AbortController(); owners.add(owner);
    // Reserve before asynchronous pin reads. Each request owns a fresh session; no client-supplied remote ID is accepted.
    const disconnected = () => controller.abort('disconnect'); response.on('close', disconnected);
    const work = (async () => { let stream: ReturnType<typeof openSse> | undefined;
      try {
        const port = await (parsed.data.mode === 'live' ? live(parsed.data) : createFixtureLab11Port(parsed.data, fixtureStepMs));
        if (controller.signal.aborted || closing) return;
        stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 20000, deadlineMs: parsed.data.deadlineSeconds * 1000 + 30000, quiet: true });
        const result = await runLab11(parsed.data, port, controller.signal, frame => { stream?.send('progress', frame); });
        if (!controller.signal.aborted) stream.send('result', result);
      } catch (error) {
        if (!controller.signal.aborted) { const message = error instanceof LabError ? error.message : 'Check Lab 11 pin configuration and server connectivity. No automatic retry was made.';
          if (stream) stream.send('error', { message }); else response.status(422).json(apiError('UNSUPPORTED_MODE', message)); }
      } finally { response.off('close', disconnected); await stream?.end(); if (!stream && !response.writableEnded && !response.destroyed) response.end(); active.delete(controller); owners.delete(owner); }
    })(); active.set(controller, work); await work;
  });
  router.use(apiErrorHandler);
  return { router, async close() { closing = true; for (const c of active.keys()) c.abort('shutdown'); await Promise.allSettled(active.values()); } };
}
