import { randomUUID } from 'node:crypto';
import { Router, json } from 'express';
import { z } from 'zod';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { createSandbox } from '../lib/lab03-sandbox.js';
import type { Sandbox } from '../lib/lab03-sandbox.js';
import { createFixtureLab07Port, createLiveLab07Port, lab07AgentEnv, lab07AgentId } from '../lib/lab07-port.js';
import type { Lab07Port } from '../lib/lab07-port.js';
import { runLab07 } from '../lib/lab07-run.js';
import { managedSettings } from '../lib/managed-config.js';
import { openSse } from '../sse.js';
import { lab07RequestSchema, lab07SdkOnlyFields, lab07Tools } from '../../shared/lab07-hooks.js';
import type { Lab07ParsedRequest } from '../../shared/lab07-hooks.js';

type Entry = { sandbox: Sandbox; active: boolean };
export function createLab07Router(options: { live?: (input: Lab07ParsedRequest) => Lab07Port; fixtureStepMs?: number } = {}) {
  const router = Router(); const live = options.live ?? createLiveLab07Port; const entries = new Map<string, Entry>();
  const active = new Map<AbortController, Promise<void>>(); let closing = false;
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? ''; const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) { response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return; } next(); });
  router.get('/tools', (_request, response) => response.json({ tools: lab07Tools, liveAgent: { envVar: lab07AgentEnv, configured: Boolean(lab07AgentId()) } }));
  router.get('/file', async (request, response) => {
    const parsed = z.strictObject({ runId: z.uuid(), name: z.enum(['draft.md', 'protected.md', 'proposed.md']) }).safeParse(request.query);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Send runId and a supported fixture name.')); return; }
    const entry = entries.get(parsed.data.runId); if (!entry) { response.status(404).json(apiError('NOT_FOUND', 'Unknown or expired Lab 07 run.')); return; }
    const file = (await entry.sandbox.list()).find((item) => item.path === `workspace/${parsed.data.name}`);
    if (!file) { response.status(404).json(apiError('NOT_FOUND', 'That fixture file does not exist.')); return; }
    response.json({ runId: parsed.data.runId, file });
  });
  router.post('/query', json({ limit: '8kb', strict: true }), async (request, response) => {
    const sdkFields = typeof request.body === 'object' && request.body ? lab07SdkOnlyFields.filter((key) => Object.hasOwn(request.body, key)) : [];
    const parsed = lab07RequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', sdkFields.length ? `${sdkFields.join(', ')} are Agent SDK hook fields. Managed Agents uses the Lab 07 host pipeline; nothing was translated or sent.` : 'Check policy, scenario, prompt and limits.', parsed.error)); return; }
    const settings = managedSettings(); if (closing || active.size >= settings.maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'Wait for an active query to finish.')); return; }
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    let port: Lab07Port; try { port = parsed.data.mode === 'live' ? live(parsed.data) : createFixtureLab07Port(parsed.data, options.fixtureStepMs ?? 20); }
    catch { response.status(422).json(apiError('UNSUPPORTED_MODE', `Configure live mode and ${lab07AgentEnv} first.`)); return; }
    const runId = randomUUID(); const sandbox = await createSandbox(); await sandbox.writeText('workspace/draft.md', '# Draft\n\nStatus: draft\n');
    await sandbox.writeText('workspace/protected.md', '# Protected\n\nlocked\n'); entries.set(runId, { sandbox, active: true });
    while (entries.size > 20) { const oldest = entries.entries().next().value as [string, Entry] | undefined; if (!oldest || oldest[1].active) break; entries.delete(oldest[0]); await oldest[1].sandbox.dispose(); }
    const controller = new AbortController(); const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 20_000,
      deadlineMs: parsed.data.deadlineSeconds * 1000 + 15_000, quiet: true });
    const work = (async () => { try { const result = await runLab07(parsed.data, port, sandbox, runId, controller.signal, (frame) => stream.send('progress', frame));
        if (!controller.signal.aborted) stream.send('result', result);
      } catch { if (!controller.signal.aborted) stream.send('error', { message: 'The Lab 07 run could not be completed.' }); }
      finally { const entry = entries.get(runId); if (entry) entry.active = false; await stream.end(); active.delete(controller); } })();
    active.set(controller, work); await work;
  });
  router.use(apiErrorHandler);
  return { router, entries, async close() { closing = true; for (const controller of active.keys()) controller.abort('shutdown'); await Promise.allSettled(active.values());
    await Promise.allSettled([...entries.values()].map((entry) => entry.sandbox.dispose())); entries.clear(); } };
}

