import { Router, json } from 'express';
import { z } from 'zod';
import { lab20FileSchema, lab20FilesSchema, lab20ResetSchema, lab20RunSchema } from '../../shared/lab20-hooks-in-depth.js';
import type { Lab20Result } from '../../shared/lab20-hooks-in-depth.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import type { Sandbox } from '../lib/lab03-sandbox.js';
import { lab07AgentId } from '../lib/lab07-port.js';
import { runLab20 } from '../lib/lab20-run.js';
import type { Lab20PortFactory } from '../lib/lab20-run.js';
import { managedSettings } from '../lib/managed-config.js';
import { openSse } from '../sse.js';

type Entry = { owner: string; sandbox: Sandbox; result: Lab20Result };
export function createLab20Router(portFactory?: Lab20PortFactory) {
  const router = Router(), entries = new Map<string, Entry>();
  const active = new Map<string, { controller: AbortController; work: Promise<void> }>(); let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and an experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '8kb' }));
  router.get('/availability', (_request, response) => response.json({ liveReady: managedSettings().liveReady && Boolean(lab07AgentId()),
    note: 'Server configuration only; no Managed session started.' }));
  router.get('/files', async (request, response) => {
    const parsed = z.strictObject({ runId: z.uuid() }).safeParse(request.query), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Use one runId UUID.')); return; }
    const entry = entries.get(parsed.data.runId);
    if (!entry || entry.owner !== owner) { response.status(404).json(apiError('NOT_FOUND', 'Unknown or unowned run.')); return; }
    response.json(lab20FilesSchema.parse({ runId: parsed.data.runId, files: await entry.sandbox.list() }));
  });
  router.get('/file', async (request, response) => {
    const parsed = z.strictObject({ runId: z.uuid(), name: z.enum(['draft.md', 'protected.md']) }).safeParse(request.query);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Use an owned runId and a named fixture file.')); return; }
    const entry = entries.get(parsed.data.runId), owner = String(request.headers['x-lab-owner']);
    if (!entry || entry.owner !== owner) { response.status(404).json(apiError('NOT_FOUND', 'Unknown or unowned run.')); return; }
    const file = (await entry.sandbox.list()).find(item => item.path === `workspace/${parsed.data.name}`);
    if (!file) { response.status(404).json(apiError('NOT_FOUND', 'Fixture file is absent.')); return; }
    response.json(lab20FileSchema.parse({ runId: parsed.data.runId, file }));
  });
  router.post('/run', async (request, response) => {
    const parsed = lab20RunSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Use a bounded Lab 20 request; Agent SDK hook callbacks are unsupported.')); return; }
    const settings = managedSettings();
    if (parsed.data.deadlineSeconds * 1000 > settings.deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    if (parsed.data.mode === 'live' && (!settings.liveReady || !lab07AgentId())) {
      response.status(422).json(apiError('UNSUPPORTED_MODE', 'Configure isolated live setup and the Lab 07 custom-tool agent first.')); return;
    }
    if (closing || active.has(owner) || active.size >= settings.maxConcurrent || entries.size >= 20) {
      response.status(429).json(apiError('CAPACITY', 'Wait for the active run or reset a retained fixture.')); return;
    }
    const controller = new AbortController(), slot = { controller, work: Promise.resolve() }; active.set(owner, slot);
    const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 25000,
      deadlineMs: parsed.data.deadlineSeconds * 1000 + 20000, quiet: true });
    slot.work = (async () => { try {
      const { result, sandbox } = await runLab20(parsed.data, controller.signal, event => {
        if (!controller.signal.aborted) stream.send('progress', event);
      }, portFactory);
      entries.set(result.runId, { owner, sandbox, result });
      if (!controller.signal.aborted) stream.send('result', result);
    } catch { if (!controller.signal.aborted) stream.send('error', { message: 'Run failed; inspect any remote cleanup before repeating a live request.' }); }
    finally { active.delete(owner); await stream.end(); } })();
    await slot.work;
  });
  router.post('/reset', async (request, response) => {
    const parsed = lab20ResetSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Select one run and confirm reset.')); return; }
    if (active.has(owner)) { response.status(429).json(apiError('CAPACITY', 'Wait for the active run.')); return; }
    const entry = entries.get(parsed.data.runId);
    if (!entry || entry.owner !== owner) { response.status(404).json(apiError('NOT_FOUND', 'Unknown or unowned run.')); return; }
    entries.delete(parsed.data.runId); await entry.sandbox.dispose(); response.json({ reset: true, runId: parsed.data.runId });
  });
  router.use(apiErrorHandler);
  return { router, entries, async close() { closing = true; for (const slot of active.values()) slot.controller.abort('server-close');
    await Promise.allSettled([...active.values()].map(slot => slot.work));
    await Promise.allSettled([...entries.values()].map(entry => entry.sandbox.dispose())); entries.clear(); } };
}
