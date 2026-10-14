import { Router, json } from 'express';
import { lab13ConfigureSchema, lab13ControlSchema, lab13RequestSchema, lab13SendSchema } from '../../shared/lab13-mcp.js';
import { Lab13Error, Lab13Sessions } from '../lib/lab13-sessions.js';
import type { Lab13Entry } from '../lib/lab13-sessions.js';
import { lab13RemoteSettings } from '../lib/lab13-port.js';
import { managedSettings } from '../lib/managed-config.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { openSse } from '../sse.js';

export function createLab13Router(options: { sessions?: Lab13Sessions } = {}) {
  const router = Router(); const sessions = options.sessions ?? new Lab13Sessions(Math.min(2, managedSettings().maxConcurrent)); let closing = false;
  const sweep = setInterval(() => void sessions.sweep(), 60_000); sweep.unref();
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? ''; const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) { response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin.')); return; } next(); });
  router.use(json({ limit: '8kb', strict: true }));
  const owner = (request: import('express').Request) => { const value = request.headers['x-lab-owner']; if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw new Lab13Error(400, 'Send a valid X-Lab-Owner identifier.'); return value; };
  const fail = (response: import('express').Response, error: unknown) => { const status = error instanceof Lab13Error ? error.status : 422;
    response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : status === 429 ? 'CAPACITY' : status >= 500 ? 'INTERNAL' : 'INVALID_REQUEST', error instanceof Lab13Error ? error.message : 'MCP operation failed. Check local transports and server setup.')); };
  router.get('/servers', (_request, response) => { const remote = lab13RemoteSettings(); response.json({ liveReady: managedSettings().liveReady,
    nativeUrlReady: remote.ready, urlConfigured: remote.validUrl, vaultConfigured: remote.validVault, cloudReachability: 'not-tested',
    servers: [{ name: 'notes', transport: 'stdio', hostOnly: true, tools: ['list_notes', 'read_note'] }, { name: 'inventory', transport: 'streamable-http', hostOnly: true, authentication: 'server-side bearer', tools: ['get_stock', 'reserve_stock'] }],
    protocolVersion: '2025-11-25', nativeConfiguration: 'Reviewed HTTPS endpoint and pre-registered matching vault; no automatic tunnel or OAuth.' }); });
  router.get('/stock', (request, response) => { try { const input = lab13ControlSchema.parse(request.query); response.json(sessions.value(sessions.read(input.runId, owner(request)))); }
    catch (error) { fail(response, error instanceof Lab13Error ? error : new Lab13Error(400, 'Send only runId.')); } });
  for (const action of ['configure', 'end', 'stock/reset'] as const) router.post(`/${action}`, async (request, response) => {
    try { const parsed = (action === 'configure' ? lab13ConfigureSchema : lab13ControlSchema).safeParse(request.body); if (!parsed.success) throw new Lab13Error(400, 'Invalid fields. URLs, tokens, commands and provider IDs cannot be supplied by the browser.');
      const e = sessions.read(parsed.data.runId, owner(request));
      if (action === 'end') response.json(await sessions.end(e));
      else if (action === 'configure') response.json(await sessions.configure(e, lab13ConfigureSchema.parse(request.body).config));
      else { if (e.snapshot.state !== 'idle' || e.work || e.input.integration !== 'host-bridge') throw new Lab13Error(409, 'Reset requires idle host-bridge mode.'); e.local.stock.reset(); e.snapshot.message = 'Only the owned fictional host inventory was reset.'; response.json(sessions.value(e)); }
    } catch (error) { fail(response, error); }
  });
  for (const action of ['session', 'query', 'send'] as const) router.post(`/${action}`, async (request, response) => {
    let e: Lab13Entry | undefined; let stream: ReturnType<typeof openSse> | undefined; const controller = new AbortController();
    const disconnected = () => controller.abort('disconnect'); response.on('close', disconnected);
    try {
      if (closing) throw new Lab13Error(429, 'Server is closing.');
      if (action === 'send') { const input = lab13SendSchema.safeParse(request.body); if (!input.success) throw new Lab13Error(400, 'Use runId, prompt and operation only.'); e = sessions.read(input.data.runId, owner(request)); }
      else { const input = lab13RequestSchema.safeParse(request.body); if (!input.success) throw new Lab13Error(400, 'Invalid scenario, integration or limits. SDK MCP commands and arbitrary URLs are unsupported.');
        const policy = managedSettings(); if (input.data.deadlineSeconds * 1000 > policy.deadlineMs || input.data.budgetCents > Number(policy.budgetCents)) throw new Lab13Error(400, 'Limits exceed server policy.');
        e = await sessions.create(owner(request), input.data, () => controller.signal.aborted);
      }
      if (controller.signal.aborted) { await sessions.end(e); return; }
      if (action === 'session') { response.removeListener('close', disconnected); response.json(sessions.value(e)); return; }
      if (e.snapshot.state !== 'idle' || e.work) throw new Lab13Error(409, 'Send requires idle.');
      stream = openSse(request, response, { controller, heartbeatMs: 5000, idleMs: 20_000, deadlineMs: e.input.deadlineSeconds * 1000 + 35_000, quiet: true });
      const send = action === 'send' ? lab13SendSchema.parse(request.body) : e.input;
      const result = await sessions.run(e, send.prompt, send.operation, controller.signal, frame => stream!.send('progress', frame));
      if (!controller.signal.aborted) stream.send('result', result);
    } catch (error) { if (stream) { if (!controller.signal.aborted) stream.send('error', { message: error instanceof Lab13Error ? error.message : 'MCP turn failed.' }); }
      else if (!response.destroyed) fail(response, error); }
    finally { response.removeListener('close', disconnected); if (e && controller.signal.aborted) await sessions.end(e); await stream?.end(); }
  });
  router.use(apiErrorHandler); return { router, sessions, async close() { closing = true; clearInterval(sweep); await sessions.close(); } };
}
