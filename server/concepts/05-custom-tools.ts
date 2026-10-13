import { randomUUID } from 'node:crypto';
import { Router, json } from 'express';
import { z } from 'zod';
import { lab05RequestSchema, lab05SdkOnlyFields, lab05Tools } from '../../shared/lab05-custom-tools.js';
import type { Lab05Request } from '../../shared/lab05-custom-tools.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { createFixtureLab05Port, createLiveLab05Port, lab05AgentEnv, lab05AgentId } from '../lib/lab05-port.js';
import type { Lab05Port } from '../lib/lab05-port.js';
import { runLab05 } from '../lib/lab05-run.js';
import { TaskStoreRegistry } from '../lib/lab05-tasks.js';
import { openSse } from '../sse.js';

const cleanupWaitMs = 10_000;
export type Lab05LivePortFactory = (input: Lab05Request) => Lab05Port;
const sdkOnlyIn = (body: unknown) => typeof body === 'object' && body !== null
  ? lab05SdkOnlyFields.filter((key) => Object.hasOwn(body, key)) : [];
const sdkOnlyMessage = (fields: readonly string[]) => `${fields.join(', ')} ${fields.length === 1 ? 'is an Agent SDK option' : 'are Agent SDK options'}. `
  + 'Managed Agents custom tools are declared on the persisted Lab 05 agent (managed/lab05-agent.json), and the host answers each '
  + 'agent.custom_tool_use with user.custom_tool_result; a request cannot add, remove or replace tools. Nothing was translated or sent.';

/**
 * /api/c5: GET /tools lists the custom tool definitions; GET /tasks?runId= reads one run's task store;
 * POST /query runs one session turn (SSE) and answers every custom tool call on the host.
 */
export function createLab05Router(livePort: Lab05LivePortFactory = createLiveLab05Port, fixtureStepMs = 80,
  options: { stores?: TaskStoreRegistry } = {}) {
  const router = Router();
  const stores = options.stores ?? new TaskStoreRegistry();
  const active = new Map<AbortController, Promise<void>>();
  let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '';
    const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return;
    }
    next();
  });
  router.get('/tools', (_request, response) => {
    response.json({ tools: lab05Tools, liveAgent: { envVar: lab05AgentEnv, configured: Boolean(lab05AgentId()) } });
  });
  router.get('/tasks', (request, response) => {
    const runId = z.strictObject({ runId: z.uuid() }).safeParse(request.query);
    if (!runId.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Send ?runId= with the UUID from the run frame.', runId.error)); return; }
    const entry = stores.get(runId.data.runId);
    if (!entry) { response.status(404).json(apiError('NOT_FOUND', 'No task store for this run. It may be unknown or replaced by newer runs.')); return; }
    response.json({ runId: runId.data.runId, active: entry.active, tasks: entry.store.snapshot(), handlerCalls: { ...entry.store.handlerCalls } });
  });
  router.post('/query', json({ limit: '8kb', strict: true }), async (request, response) => {
    // Validation comes first: nothing below may touch a provider or a task store for an invalid request.
    const sdkOnly = sdkOnlyIn(request.body);
    const parsed = lab05RequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json(apiError('INVALID_REQUEST', sdkOnly.length ? sdkOnlyMessage(sdkOnly)
        : 'Check mode, prompt, scenario, handler deadline (100–5000 ms), challenge input, budget cents and deadline bounds.', parsed.error)); return;
    }
    const settings = managedSettings();
    if (closing || active.size >= settings.maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'Wait for an active query to finish.')); return; }
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server MANAGED_DEADLINE_MS policy.')); return; }
    const controller = new AbortController();
    let port: Lab05Port;
    try { port = parsed.data.mode === 'live' ? livePort(parsed.data) : createFixtureLab05Port(parsed.data, fixtureStepMs); }
    catch {
      response.status(422).json(apiError('UNSUPPORTED_MODE', `Configure the server API key, environment ID, ${lab05AgentEnv}, valid limits and MANAGED_LIVE_ENABLED=true first.`)); return;
    }
    const runId = randomUUID();
    const stream = openSse(request, response, { controller, heartbeatMs: 5_000, idleMs: 20_000,
      deadlineMs: parsed.data.deadlineSeconds * 1000 + cleanupWaitMs + 20_000, quiet: true });
    const work = (async () => {
      try {
        const result = await runLab05(parsed.data, port, stores, runId, controller.signal, (frame) => { stream.send('progress', frame); }, cleanupWaitMs);
        if (!controller.signal.aborted) stream.send('result', result);
      } catch { if (!controller.signal.aborted) stream.send('error', { message: 'The query could not be completed.' }); }
      finally { await stream.end(); active.delete(controller); }
    })();
    active.set(controller, work);
    await work;
  });
  router.use(apiErrorHandler);
  return { router, stores, async close() {
    closing = true;
    for (const controller of active.keys()) controller.abort('shutdown');
    await Promise.allSettled(active.values());
  } };
}
