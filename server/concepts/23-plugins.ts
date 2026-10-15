import { Router, json } from 'express';
import { lab23ReloadSchema, lab23ResetSchema, lab23RunSchema, lab23SelectionSchema } from '../../shared/lab23-plugins.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { Lab23Bundles, Lab23Error } from '../lib/lab23-bundles.js';

export function createLab23Router(bundles = new Lab23Bundles()) {
  const router = Router(), active = new Set<string>(); let closing = false;
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || origin && origin !== `http://${host}` ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(String(request.headers['x-lab-owner'] ?? ''))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local application origin and experiment owner.')); return;
    } next();
  });
  router.use(json({ strict: true, limit: '4kb' }));
  function failure(response: import('express').Response, error: unknown) {
    response.status(error instanceof Lab23Error ? error.status : 422).json(apiError('INVALID_REQUEST',
      error instanceof Lab23Error ? error.message : 'Bundle validation failed; no inventory change was accepted.'));
  }
  router.get('/plugins', async (request, response) => {
    try { response.json(await bundles.catalog(String(request.headers['x-lab-owner']))); }
    catch (error) { failure(response, error); }
  });
  router.post('/reload', async (request, response) => {
    const parsed = lab23ReloadSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Unknown local reload variant.')); return; }
    try { response.json(await bundles.reload(parsed.data.variant)); }
    catch (error) { failure(response, error); }
  });
  router.post('/inventory', async (request, response) => {
    const parsed = lab23SelectionSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid capability selection.')); return; }
    try { response.json(await bundles.inventory(parsed.data)); }
    catch (error) { failure(response, error); }
  });
  router.post('/run', async (request, response) => {
    const parsed = lab23RunSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid bounded bundle run.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('UNSUPPORTED_MODE', 'No pinned Managed resources are configured for Lab 23. Provisioning requires a separate explicit setup.')); return; }
    if (closing || active.has(owner) || active.size >= 4) { response.status(429).json(apiError('CAPACITY', 'Wait for the active bundle run.')); return; }
    active.add(owner);
    try { const { mode: _mode, ...selection } = parsed.data; response.json(await bundles.run(owner, selection)); }
    catch (error) { failure(response, error); }
    finally { active.delete(owner); }
  });
  router.post('/reset', (request, response) => {
    const parsed = lab23ResetSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Explicit reset confirmation is required.')); return; }
    response.json(bundles.reset(String(request.headers['x-lab-owner'])));
  });
  router.use(apiErrorHandler);
  return { router, close: async () => { closing = true; await bundles.close(); } };
}
