import { Router, json } from 'express';
import { lab24RequestSchema } from '../../shared/lab24-harnesses.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { runLab24 } from '../lib/lab24-harnesses.js';
import { installedHarnessMethods } from '../lib/lab24-sdk-contracts.js';

export function createLab24Router(run = runLab24) {
  const router = Router(), active = new Map<string, AbortController>(); let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '4kb' }));
  router.get('/tools', (_request, response) => response.json({ source: 'host-contract', tools: [
    { name: 'get_stock', input: { sku: 'NOTEBOOK' }, effect: 'read-only' },
    { name: 'reserve_stock', input: { sku: 'NOTEBOOK', quantity: 'integer 1..2' }, effect: 'decrement host-local stock' }],
    initialStock: 5, providerCalls: 0 }));
  router.get('/code', (_request, response) => response.json({ source: 'installed-sdk-1.7.0-and-host-source', sdk: installedHarnessMethods(),
    manual: 'Messages API messages.create: application repeats requests and appends tool_result blocks.',
    runner: 'Installed beta.messages.toolRunner: SDK iterates, application callback still owns the checked effect.',
    managed: 'Managed sessions emit agent.custom_tool_use; client sends user.custom_tool_result. Managed harness owns iteration.',
    files: ['shared/lab24-harnesses.ts', 'server/lib/lab24-harnesses.ts', 'server/lib/lab24-sdk-contracts.ts', 'server/concepts/24-harnesses.ts'],
    liveReady: false, note: 'The offline adapters do not call these provider methods. Live execution needs separate opt-in and configuration.' }));
  router.post('/run', async (request, response) => {
    const parsed = lab24RequestSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid bounded harness request.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('UNSUPPORTED_MODE', 'No separately opted-in Messages or Managed harness is configured for Lab 24.')); return; }
    if (closing || active.has(owner) || active.size >= 4) { response.status(429).json(apiError('CAPACITY', 'Wait for the active harness run.')); return; }
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(new Error('Local deadline expired.')), 5000);
    active.set(owner, controller);
    const onClose = () => { if (!response.writableEnded) controller.abort(new Error('Client disconnected.')); };
    response.once('close', onClose);
    try { response.json(await run(parsed.data, controller.signal)); }
    catch { if (!response.headersSent) response.status(controller.signal.aborted ? 504 : 422).json(apiError('INVALID_REQUEST', 'Harness run stopped before a verified result.')); }
    finally { clearTimeout(timer); response.off('close', onClose); active.delete(owner); }
  });
  router.use(apiErrorHandler);
  return { router, close: async () => { closing = true; for (const controller of active.values()) controller.abort(); active.clear(); } };
}
