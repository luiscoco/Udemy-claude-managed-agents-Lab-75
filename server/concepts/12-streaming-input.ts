import { Router, json } from 'express';
import type { Request, Response } from 'express';
import { lab12ControlSchema, lab12CreateSchema, lab12SendSchema, lab12ScriptSchema, lab12ToolsSchema, lab12ContextSchema, lab12ModelSchema } from '../../shared/lab12-streaming-input.js';
import { Lab12Error, Lab12Queues } from '../lib/lab12-queue.js';
import type { Lab12Entry } from '../lib/lab12-queue.js';
import { createFixtureLab12Port, createLiveLab12Port } from '../lib/lab12-port.js';
import type { Lab12Port } from '../lib/lab12-port.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings } from '../lib/managed-config.js';
import { openSse } from '../sse.js';

export function createLab12Router(options: { queues?: Lab12Queues; fixture?: () => Lab12Port; live?: () => Lab12Port } = {}) {
  const router = Router(); const queues = options.queues ?? new Lab12Queues(Math.min(2, managedSettings().maxConcurrent));
  const fixture = options.fixture ?? createFixtureLab12Port; const live = options.live ?? createLiveLab12Port;
  let closing = false; const sweep = setInterval(() => void queues.sweep(), 60_000); sweep.unref();
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? ''; const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) { response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return; } next();
  });
  router.use(json({ limit: '24kb', strict: true }));
  function owner(request: Request) { const value = request.headers['x-lab-owner']; if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw new Lab12Error(400, 'Send a valid X-Lab-Owner identifier.'); return value; }
  const fail = (response: Response, error: unknown) => {
    const status = error instanceof Lab12Error ? error.status : 422;
    response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : status === 429 ? 'CAPACITY' : status >= 500 ? 'INTERNAL' : 'INVALID_REQUEST', error instanceof Lab12Error ? error.message : 'Managed session operation failed. Check server setup and connectivity; no automatic retry.'));
  };
  const entry = (request: Request, id: string) => queues.read(id, owner(request));
  router.get('/capabilities', (_request, response) => response.json({ maxPending: 3, maxCommands: 20, image: 'base64 PNG, at most 4096 bytes and 256 × 256 pixels', idleUpdates: ['agent.tools', 'agent.mcp_servers'], modelChange: 'new session with explicit context', stream: 'one provider stream per session', setupCallsProvider: false }));
  router.get('/state', (request, response) => { try { const parsed = lab12ControlSchema.parse(request.query); response.json(queues.readSnapshot(entry(request, parsed.runId))); } catch (error) { fail(response, error instanceof Lab12Error ? error : new Lab12Error(400, 'Send only runId.')); } });
  router.post('/session', async (request, response) => {
    let e: Lab12Entry | undefined; let disconnected = false; const onClose = () => { disconnected = true; if (e) void queues.end(e); }; response.on('close', onClose);
    try {
      const parsed = lab12CreateSchema.safeParse(request.body); if (!parsed.success) throw new Lab12Error(400, 'Use mode, deadlineSeconds and budgetCents only. SDK generator and setter fields are unsupported.');
      if (closing) throw new Lab12Error(429, 'Server is closing.');
      const policy = managedSettings(); if (parsed.data.deadlineSeconds * 1000 > policy.deadlineMs || parsed.data.budgetCents > Number(policy.budgetCents)) throw new Lab12Error(400, 'Limits exceed server policy.');
      e = await queues.create(owner(request), parsed.data, parsed.data.mode === 'live' ? live() : fixture());
      if (disconnected) { await queues.end(e); return; }
      response.removeListener('close', onClose); response.json(queues.readSnapshot(e));
    } catch (error) { if (e) await queues.end(e); if (!response.destroyed) fail(response, error); }
    finally { response.removeListener('close', onClose); }
  });
  router.post('/events', async (request, response) => {
    let stream: ReturnType<typeof openSse> | undefined; let e: Lab12Entry | undefined; let publish: ((value: ReturnType<Lab12Queues['readSnapshot']>) => void) | undefined;
    const controller = new AbortController();
    try {
      const parsed = lab12ControlSchema.parse(request.body); e = entry(request, parsed.runId);
      if (e.subscribers.size) throw new Lab12Error(409, 'Only one browser event subscriber is allowed per queue.');
      stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 20_000, deadlineMs: 15 * 60_000, quiet: true });
      await new Promise<void>(resolve => {
        publish = value => { stream!.send('progress', value); if (value.state === 'closed') { stream!.send('result', value); resolve(); } };
        e!.subscribers.add(publish); controller.signal.addEventListener('abort', () => resolve(), { once: true });
        publish(queues.readSnapshot(e!)); if (controller.signal.aborted) resolve();
      });
    } catch (error) { if (!stream) fail(response, error instanceof Lab12Error ? error : new Lab12Error(400, 'Send only runId.')); }
    finally { if (e && publish) e.subscribers.delete(publish); if (e && controller.signal.aborted) await queues.end(e); await stream?.end(); }
  });
  for (const action of ['send', 'script', 'tools', 'context', 'end', 'new-model-session'] as const) router.post(`/${action}`, async (request, response) => {
    let acquired: Lab12Entry | undefined; let disconnected = false;
    const onClose = () => { disconnected = true; if (acquired) void queues.end(acquired); };
    if (action === 'new-model-session') response.on('close', onClose);
    try {
      const schema = action === 'send' ? lab12SendSchema : action === 'script' ? lab12ScriptSchema : action === 'tools' ? lab12ToolsSchema : action === 'context' ? lab12ContextSchema : action === 'new-model-session' ? lab12ModelSchema : lab12ControlSchema;
      const parsed = schema.safeParse(request.body); if (!parsed.success) throw new Lab12Error(400, 'Invalid or unsupported command fields; check text, image size and local identifiers.');
      const e = entry(request, parsed.data.runId);
      if (action === 'send') { const { runId: _id, ...message } = lab12SendSchema.parse(request.body); response.json(queues.admit(e, [message])); }
      else if (action === 'script') response.json(queues.admit(e, lab12ScriptSchema.parse(request.body).messages));
      else if (action === 'end') { if (e.snapshot.state === 'updating') throw new Lab12Error(409, 'Wait for the idle update to finish.'); await queues.end(e); response.json(queues.readSnapshot(e)); }
      else if (action === 'tools') {
        const { preset } = lab12ToolsSchema.parse(request.body);
        response.json(await queues.idleUpdate(e, async () => { await e.port.tools(e.session.id, preset); e.snapshot.tools = preset; e.snapshot.message = `Idle update confirmed: ${preset}; MCP server list cleared. Model is unchanged.`; }));
      } else if (action === 'context') {
        const { text } = lab12ContextSchema.parse(request.body);
        if (e.snapshot.contextEventIds.length >= 20) throw new Lab12Error(429, 'Context event limit reached.');
        response.json(await queues.idleUpdate(e, async () => { e.snapshot.contextEventIds.push(await e.port.context(e.session.id, text)); e.snapshot.message = 'Explicit system context appended. This is not a model change or a user turn.'; }));
      } else {
        const { model, effort, context } = lab12ModelSchema.parse(request.body); let next: Lab12Entry | undefined;
        await queues.idleUpdate(e, async () => {
          try {
            next = await queues.create(owner(request), e.input, e.input.mode === 'live' ? live() : fixture(), model, effort);
            acquired = next;
            if (disconnected) throw new Lab12Error(409, 'Browser disconnected; new session cleanup requested. No handoff prompt sent.');
            next.snapshot.handoffFrom = e.session.id;
          } catch (error) { if (next) await queues.end(next); throw error; }
        });
        try {
          await queues.end(e);
          if (disconnected) throw new Lab12Error(409, 'Browser disconnected; no handoff prompt sent.');
          if (e.snapshot.state !== 'closed') throw new Lab12Error(409, 'Previous session cleanup is pending; no handoff prompt sent.');
          queues.admit(next!, [{ commandId: crypto.randomUUID(), text: context, scenario: 'normal' }]);
        } catch (error) { if (next) await queues.end(next); throw error; }
        response.removeListener('close', onClose); response.json(queues.readSnapshot(next!));
      }
    } catch (error) { if (!response.destroyed) fail(response, error); }
    finally { response.removeListener('close', onClose); }
  });
  router.use(apiErrorHandler);
  return { router, queues, async close() { closing = true; clearInterval(sweep); await queues.close(); } };
}
