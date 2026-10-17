import { Router, json } from 'express';
import { lab44PrivacySchema, lab44RunSchema, lab44IdSchema } from '../../shared/lab44-otel-observability.js';
import { Lab44Error, Lab44Telemetry } from '../lib/lab44-telemetry.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab44Router(manager = new Lab44Telemetry()) {
  const router = Router(); router.use((request, response, next) => { response.set('Cache-Control', 'no-store');
    const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.use(json({ strict: true, limit: '4kb' }));
  const reply = async (response: import('express').Response, action: () => unknown | Promise<unknown>) => { try { response.json(await action()); }
    catch (error) { const status = error instanceof Lab44Error ? error.statusCode : 500;
      response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST', error instanceof Lab44Error ? error.message : 'Telemetry exercise failed.')); } };
  router.get('/code', (_request, response) => response.json({ source: 'host-otlp-fixture', files: [
    'shared/lab44-otel-observability.ts', 'server/lib/lab44-telemetry.ts', 'server/concepts/44-otel-observability.ts'], remoteExportObserved: false }));
  router.get('/facts', (_request, response) => response.json(manager.facts()));
  router.post('/export-remote', (request, response) => { const parsed = lab44IdSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose one owned trace run.')); return; }
    void reply(response, () => manager.exportRemote(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  router.post('/export-azure', (request, response) => { const parsed = lab44IdSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose one owned trace run.')); return; }
    void reply(response, () => manager.exportAzure(String(request.headers['x-lab-owner']), parsed.data.runId)); });
  for (const path of ['/signals', '/exporters', '/collector']) router.post(path, (request, response) => {
    if (Object.keys(request.body ?? {}).length) { response.status(400).json(apiError('INVALID_REQUEST', 'Inspection takes no fields.')); return; }
    response.json(path === '/signals' ? { source: 'host-only', hostSignals: ['express.request', 'managed-port.send', 'host.approval.wait', 'host.custom-tool', 'host.cleanup'],
      providerEvents: manager.facts().providerModelSpanEventTypes, remoteExportObserved: false } :
      path === '/exporters' ? { source: 'host-only', protocol: 'OTLP HTTP JSON', destination: 'bounded loopback collector', externalExport: false } : manager.state()); });
  router.post('/privacy', (request, response) => { const parsed = lab44PrivacySchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid content recording setting.')); return; }
    response.json(manager.privacy(String(request.headers['x-lab-owner']), parsed.data.recordFictionalContent)); });
  for (const path of ['/tracing', '/rich']) router.post(path, (request, response) => { const parsed = lab44RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid trace scenario.')); return; }
    if (parsed.data.mode === 'live') { response.status(422).json(apiError('INVALID_REQUEST', 'Live telemetry requires a separately configured Managed session.')); return; }
    void reply(response, () => manager.run(String(request.headers['x-lab-owner']), parsed.data.scenario)); });
  router.use(apiErrorHandler); return { router, close: async () => manager.close() };
}
