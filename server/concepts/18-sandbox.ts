import { Router, json } from 'express';
import { lab18AvailabilitySchema, lab18ReportSchema, lab18RunSchema } from '../../shared/lab18-sandbox.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { Lab18Error, Lab18Service, hostFixtureMount, lab18Confirmation } from '../lib/lab18-sandbox.js';
import { managedSettings } from '../lib/managed-config.js';
import { runToolSession } from '../lib/tool-session-run.js';
import { openSse } from '../sse.js';

export function createLab18Router(service = new Lab18Service()) {
  const router = Router(), active = new Map<string, { controller: AbortController; work: Promise<void> }>();
  let closing = false, inspecting = 0;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      request.method !== 'GET' && !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '8kb' }));
  router.get('/platform', (_request, response) => response.json(service.platform()));
  router.post('/availability', async (request, response) => {
    const parsed = lab18AvailabilitySchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported bounded availability check.')); return; }
    if (closing || inspecting >= managedSettings().maxConcurrent || parsed.data.mode === 'live' && active.size) {
      response.status(429).json(apiError('CAPACITY', 'Wait for the active diagnostic or inspection.')); return;
    }
    inspecting++;
    try { response.json(await service.availability(parsed.data.mode, parsed.data.scenario)); }
    finally { inspecting--; }
  });
  router.post('/run', async (request, response) => {
    const parsed = lab18RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Unsupported fields or invalid bounded diagnostic.')); return; }
    const input = parsed.data, owner = String(request.headers['x-lab-owner']), settings = managedSettings();
    if (input.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    if (closing || active.has(owner) || active.size >= settings.maxConcurrent) {
      response.status(429).json(apiError('CAPACITY', 'A diagnostic is already active.')); return;
    }
    const controller = new AbortController(), slot = { controller, work: Promise.resolve() }; active.set(owner, slot);
    if (input.mode === 'scripted') {
      slot.work = (async () => {
        try { response.json(await service.offline(input)); }
        catch { response.status(422).json(apiError('INVALID_REQUEST', 'Host fixture policy test failed closed.')); }
        finally { active.delete(owner); }
      })();
      await slot.work;
      return;
    }
    const availability = await service.availability('live', input.scenario);
    if (!availability.ready || controller.signal.aborted) { active.delete(owner);
      response.status(422).json(apiError('UNSUPPORTED_MODE', availability.reason)); return; }
    let port;
    try { port = service.livePort(input, availability); }
    catch (error) { active.delete(owner); response.status(error instanceof Lab18Error ? error.status : 422).json(apiError('UNSUPPORTED_MODE', 'Live port unavailable.')); return; }
    const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 25000,
      deadlineMs: input.deadlineSeconds * 1000 + 20000, quiet: true });
    slot.work = (async () => {
      try {
        const core = await runToolSession<never>({ mode: 'live', prompt: 'Request the exact bash command pwd once. Then report its result.',
          deadlineMs: input.deadlineSeconds * 1000, cleanupWaitMs: 5000, maxConfirmations: 2, port, signal: controller.signal,
          emit: frame => { if (!controller.signal.aborted) stream.send('progress', frame); },
          answer: async calls => calls.map(({ id, use, input: callInput }) => lab18Confirmation(id, use?.name ?? null, callInput)) });
        const uses = core.toolUses.slice(0, 12).map(use => {
          let command = ''; try { const parsedInput = JSON.parse(use.input) as { command?: unknown }; if (typeof parsedInput.command === 'string') command = parsedInput.command; } catch {}
          return { name: use.name, command: command.slice(0, 200), state: use.state, result: use.result?.text.slice(0, 500) ?? null };
        });
        const command = core.toolUses.find(use => {
          if (use.name !== 'bash') return false;
          try { return (JSON.parse(use.input) as { command?: unknown }).command === 'pwd'; } catch { return false; }
        });
        const report = lab18ReportSchema.parse({ mode: 'live', source: 'managed-api', scenario: input.scenario, availability,
          host: { fixtureId: null, checkedPath: hostFixtureMount, allowed: false, readCalls: 0, networkCalls: 0, fileHash: null,
            effect: 'No host fixture was opened during the live session.' },
          remote: { sessionId: core.sessionId, outcome: core.outcome.kind, toolUses: uses, confirmations: core.confirmations.length,
            commandObserved: Boolean(command), commandSucceeded: Boolean(command && command.state === 'allowed-by-host' && command.result?.isError === false),
            cleanup: core.cleanup, interruption: core.interruption },
          message: 'Only an observed tool use/result can verify remote pwd execution. The host never runs bash natively on Windows.' });
        if (!controller.signal.aborted) stream.send('result', report);
      } catch { if (!controller.signal.aborted) stream.send('error', { message: 'Live diagnostic failed; inspect remote session and cleanup before retrying.' }); }
      finally { active.delete(owner); await stream.end(); }
    })();
    await slot.work;
  });
  router.use(apiErrorHandler);
  return { router, async close() { closing = true; for (const slot of active.values()) slot.controller.abort('server-close');
    await Promise.allSettled([...active.values()].map(slot => slot.work)); } };
}
