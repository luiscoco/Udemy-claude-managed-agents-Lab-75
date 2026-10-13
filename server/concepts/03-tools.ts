import { Router, json } from 'express';
import { agentSdkOnlyFields, lab03RequestSchema } from '../../shared/lab03-tools.js';
import type { Lab03Request } from '../../shared/lab03-tools.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { createFixtureLab03Port, createLiveLab03Port } from '../lib/lab03-port.js';
import type { Lab03Port } from '../lib/lab03-port.js';
import { runLab03 } from '../lib/lab03-run.js';
import { createSandbox } from '../lib/lab03-sandbox.js';
import type { Sandbox } from '../lib/lab03-sandbox.js';
import { openSse } from '../sse.js';

const cleanupWaitMs = 10_000;
export type LivePortFactory = (input: Lab03Request, sandbox: Sandbox) => Lab03Port;

/**
 * /api/c3: POST /query runs one session turn (SSE); GET /files lists the latest host sandbox;
 * POST /reset restores its fixtures. Each query gets a fresh disposable sandbox under the OS temp dir.
 */
export function createLab03Router(livePort: LivePortFactory = createLiveLab03Port, fixtureStepMs = 80, sandboxBase?: string) {
  const router = Router();
  const active = new Map<AbortController, { work: Promise<void>; sandbox: Sandbox }>();
  let latest: Sandbox | null = null, closing = false;
  const busy = (sandbox: Sandbox | null) => [...active.values()].some((run) => run.sandbox === sandbox);
  async function current() {
    latest ??= await createSandbox(sandboxBase);
    return latest;
  }
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '';
    const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return;
    }
    next();
  });
  router.get('/files', async (_request, response, next) => {
    try { const sandbox = await current(); response.json({ sandbox: sandbox.dir.split(/[\\/]/).pop(), files: await sandbox.list() }); }
    catch (error) { next(error); }
  });
  router.post('/reset', async (_request, response, next) => {
    try {
      if (busy(latest)) { response.status(429).json(apiError('CAPACITY', 'Wait for the active query to finish before resetting its sandbox.')); return; }
      const sandbox = await current(); await sandbox.reset();
      response.json({ sandbox: sandbox.dir.split(/[\\/]/).pop(), files: await sandbox.list() });
    } catch (error) { next(error); }
  });
  router.post('/query', json({ limit: '8kb', strict: true }), async (request, response) => {
    // Validation comes first: nothing below may touch a provider or the disk for an invalid request.
    const body: unknown = request.body;
    const sdkOnly = typeof body === 'object' && body !== null ? agentSdkOnlyFields.filter((key) => Object.hasOwn(body, key)) : [];
    const parsed = lab03RequestSchema.safeParse(body);
    if (!parsed.success) {
      response.status(400).json(apiError('INVALID_REQUEST', sdkOnly.length
        ? `${sdkOnly.join(', ')} are Agent SDK options. Managed Agents uses the session toolset (enabled), permission_policy and user.tool_confirmation; nothing was translated or sent.`
        : 'Check mode, preset, prompt, removeTools, budget cents and deadline bounds.', parsed.error)); return;
    }
    const settings = managedSettings();
    if (closing || active.size >= settings.maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'Wait for an active query to finish.')); return; }
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server MANAGED_DEADLINE_MS policy.')); return; }
    const controller = new AbortController();
    const slot = { work: Promise.resolve(), sandbox: null as unknown as Sandbox };
    active.set(controller, slot); // reserve capacity before any await
    let port: Lab03Port;
    try {
      slot.sandbox = await createSandbox(sandboxBase);
      if (parsed.data.mode === 'live') {
        try { port = livePort(parsed.data, slot.sandbox); }
        catch {
          active.delete(controller); await slot.sandbox.dispose();
          response.status(422).json(apiError('UNSUPPORTED_MODE', 'Configure the server API key, agent ID, environment ID, valid limits and MANAGED_LIVE_ENABLED=true first.')); return;
        }
      } else port = createFixtureLab03Port(parsed.data, slot.sandbox, fixtureStepMs);
    } catch {
      active.delete(controller);
      response.status(500).json(apiError('INTERNAL', 'The lab sandbox could not be created.')); return;
    }
    // The new run's sandbox becomes the one GET /files shows; an idle previous one is disposed.
    const previous = latest; latest = slot.sandbox;
    if (previous && !busy(previous)) void previous.dispose().catch(() => {});
    const stream = openSse(request, response, { controller, heartbeatMs: 5_000, idleMs: 20_000,
      deadlineMs: parsed.data.deadlineSeconds * 1000 + cleanupWaitMs + 20_000, quiet: true });
    slot.work = (async () => {
      try {
        const result = await runLab03(parsed.data, port, slot.sandbox, controller.signal, (frame) => { stream.send('progress', frame); }, cleanupWaitMs);
        if (!controller.signal.aborted) stream.send('result', result);
      } catch { if (!controller.signal.aborted) stream.send('error', { message: 'The query could not be completed.' }); }
      finally {
        await stream.end(); active.delete(controller);
        if (latest !== slot.sandbox) await slot.sandbox.dispose().catch(() => {});
      }
    })();
    await slot.work;
  });
  router.use(apiErrorHandler);
  return { router, async close() {
    closing = true;
    for (const controller of active.keys()) controller.abort('shutdown');
    await Promise.allSettled([...active.values()].map((run) => run.work));
    await latest?.dispose().catch(() => {}); latest = null;
  } };
}
