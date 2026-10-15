import { Router, json } from 'express';
import { z } from 'zod';
import { lab19BranchSchema, lab19DeleteSchema, lab19QuerySchema, lab19RenameSchema, lab19ResetSchema, lab19TagSchema, lab19TurnSchema } from '../../shared/lab19-session-management.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { Lab19Error, Lab19Manager } from '../lib/lab19-sessions.js';
import { managedSettings } from '../lib/managed-config.js';
import { openSse } from '../sse.js';

const localId = z.uuid();
export function createLab19Router(manager = new Lab19Manager()) {
  const router = Router(), active = new Map<string, { controller: AbortController; work: Promise<void> }>(); let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '8kb' }));
  router.get('/availability', (_request, response) => {
    response.json({ liveReady: managedSettings().liveReady, note: 'Server configuration only; no Managed session started.' });
  });
  function failed(response: import('express').Response, error: unknown) {
    response.status(error instanceof Lab19Error ? error.status : 422).json(apiError('INVALID_REQUEST',
      error instanceof Lab19Error ? error.message : 'Session operation failed; inspect state before retrying.'));
  }
  router.get('/sessions', async (request, response) => {
    const query = lab19QuerySchema.safeParse(request.query);
    if (!query.success || query.data.cursor) { response.status(400).json(apiError('INVALID_REQUEST', 'Only provider=yes is supported for inventory verification.')); return; }
    try { response.json(await manager.list(String(request.headers['x-lab-owner']), query.data.provider === 'yes')); }
    catch (error) { failed(response, error); }
  });
  router.get('/sessions/:id', async (request, response) => {
    const id = localId.safeParse(request.params.id), query = lab19QuerySchema.safeParse(request.query);
    if (!id.success || !query.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Use an owned local UUID and a bounded history cursor.')); return; }
    try { response.json(await manager.detail(id.data, String(request.headers['x-lab-owner']), query.data.cursor, query.data.provider === 'yes')); }
    catch (error) { failed(response, error); }
  });
  router.post('/turn', async (request, response) => {
    const parsed = lab19TurnSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'New/continue requires a bounded prompt and the correct local ID.')); return; }
    if (parsed.data.deadlineSeconds * 1000 > managedSettings().deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    if (parsed.data.mode === 'live' && !managedSettings().liveReady) { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Live setup is unavailable.')); return; }
    if (closing || active.has(owner) || active.size >= managedSettings().maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'Wait for the active turn.')); return; }
    const controller = new AbortController(), slot = { controller, work: Promise.resolve() }; active.set(owner, slot);
    const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 25000,
      deadlineMs: parsed.data.deadlineSeconds * 1000 + 20000, quiet: true });
    slot.work = (async () => { try { const result = await manager.turn(owner, parsed.data, controller.signal, snapshot => {
      if (!controller.signal.aborted) stream.send('progress', snapshot);
    }); if (!controller.signal.aborted) stream.send('result', result); }
    catch (error) { if (!controller.signal.aborted) stream.send('error', { message: error instanceof Lab19Error ? error.message : 'Turn failed; inspect owned session cleanup before retrying.' }); }
    finally { active.delete(owner); await stream.end(); } })();
    await slot.work;
  });
  router.post('/sessions/:id/branch', async (request, response) => {
    const id = localId.safeParse(request.params.id), parsed = lab19BranchSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!id.success || !parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Select an owned conversation and host evidence boundary.')); return; }
    if (parsed.data.deadlineSeconds * 1000 > managedSettings().deadlineMs) { response.status(400).json(apiError('INVALID_REQUEST', 'Deadline exceeds server policy.')); return; }
    if (closing || active.has(owner) || active.size >= managedSettings().maxConcurrent) { response.status(429).json(apiError('CAPACITY', 'Wait for the active turn.')); return; }
    const controller = new AbortController(), slot = { controller, work: Promise.resolve() }; active.set(owner, slot);
    const stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 25000,
      deadlineMs: parsed.data.deadlineSeconds * 1000 + 20000, quiet: true });
    slot.work = (async () => { try { const result = await manager.branch(id.data, owner, parsed.data, controller.signal, snapshot => {
      if (!controller.signal.aborted) stream.send('progress', snapshot);
    }); if (!controller.signal.aborted) stream.send('result', result); }
    catch (error) { if (!controller.signal.aborted) stream.send('error', { message: error instanceof Lab19Error ? error.message : 'Branch failed; inspect owned session cleanup before retrying.' }); }
    finally { active.delete(owner); await stream.end(); } })();
    await slot.work;
  });
  for (const operation of ['rename', 'tag', 'archive', 'delete'] as const) router.post(`/sessions/:id/${operation}`, async (request, response) => {
    const id = localId.safeParse(request.params.id), owner = String(request.headers['x-lab-owner']);
    const schema = operation === 'rename' ? lab19RenameSchema : operation === 'tag' ? lab19TagSchema : operation === 'delete' ? lab19DeleteSchema : z.strictObject({});
    const parsed = schema.safeParse(request.body);
    if (!id.success || !parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid owned session action or missing explicit delete selection.')); return; }
    if (active.has(owner)) { response.status(429).json(apiError('CAPACITY', 'Wait for the active turn.')); return; }
    try {
      if (operation === 'rename') response.json(await manager.rename(id.data, owner, lab19RenameSchema.parse(request.body).title));
      else if (operation === 'tag') response.json(await manager.tag(id.data, owner, lab19TagSchema.parse(request.body).tag));
      else if (operation === 'archive') response.json(await manager.archive(id.data, owner));
      else response.json(await manager.delete(id.data, owner));
    } catch (error) { failed(response, error); }
  });
  router.post('/reset', async (request, response) => {
    const parsed = lab19ResetSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Reset requires an explicit offline selection.')); return; }
    if (active.has(owner)) { response.status(429).json(apiError('CAPACITY', 'Wait for the active turn.')); return; }
    try { response.json(await manager.reset(owner)); } catch (error) { failed(response, error); }
  });
  router.use(apiErrorHandler);
  return { router, async close() { closing = true; for (const slot of active.values()) slot.controller.abort('server-close');
    await Promise.allSettled([...active.values()].map(slot => slot.work)); await manager.close(); } };
}
