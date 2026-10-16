import { Router, json, type Request } from 'express';
import { z } from 'zod';
import { scenarioSchema } from '../../shared/lab72-document-generation-skills.js';
import { DocgenWorkshop, incidentNotes, skillFiles } from '../lib/lab72-docgen.js';
import { apiError } from '../lib/errors.js';
export function createLab72Router(store = new DocgenWorkshop()) {
  const router = Router(); router.use(json({ strict: true, limit: '24kb' }));
  router.use((request, response, next) => { const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` || typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Local document owner required.')); return; } response.set('Cache-Control', 'no-store'); next(); });
  const owner = (request: Request) => request.headers['x-lab-owner'] as string;
  router.get('/facts', (_request, response) => response.json({ source: 'offline-host-docgen', liveReady: false, providerCalls: 0,
    skillFiles, notes: incidentNotes, tools: ['read_spec_reference', 'write_spec', 'build_document'],
    reason: 'Deterministic local exercise. Cloud skill upload and a dedicated Managed custom-tool adapter are separate explicit setup; no upload occurs here.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab72-document-generation-skills.ts', 'server/lib/lab72-docgen.ts', 'server/concepts/72-document-generation-skills.ts'] }));
  router.post('/sessions', async (request, response, next) => { try { const input = z.strictObject({ scenario: scenarioSchema }).parse(request.body); response.status(201).json(await store.create(owner(request), input.scenario)); } catch (error) { next(error); } });
  router.get('/sessions/:id', (request, response, next) => { try { response.json(store.get(owner(request), request.params.id as string)); } catch (error) { next(error); } });
  router.post('/sessions/:id/build', async (request, response, next) => { try { z.strictObject({}).parse(request.body); response.json(await store.scripted(owner(request), request.params.id as string)); } catch (error) { next(error); } });
  router.post('/sessions/:id/tool', async (request, response, next) => { try { response.json(await store.tool(owner(request), request.params.id as string, request.body)); } catch (error) { next(error); } });
  router.post('/sessions/:id/cancel', (request, response, next) => { try { z.strictObject({}).parse(request.body); response.json(store.cancel(owner(request), request.params.id as string)); } catch (error) { next(error); } });
  router.post('/sessions/:id/policy', (request, response, next) => { try { store.get(owner(request), request.params.id as string); const input = z.strictObject({ command: z.string().max(500) }).parse(request.body); response.json(store.policy(input.command)); } catch (error) { next(error); } });
  router.post('/sessions/:id/query', async (request, response, next) => { try { const input = z.strictObject({ mode: z.enum(['offline', 'live']), question: z.string().min(1).max(500) }).parse(request.body);
    store.get(owner(request), request.params.id as string); if (input.mode === 'live') { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Dedicated live document adapter is not configured. No cloud session or skill upload started.')); return; }
    response.json(await store.scripted(owner(request), request.params.id as string)); } catch (error) { next(error); } });
  router.get('/sessions/:id/files/:name', async (request, response, next) => { try { const id = z.uuid().parse(request.params.name); const bytes = await store.file(owner(request), request.params.id as string, id);
    response.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': 'attachment; filename="verified-report.docx"', 'X-Content-Type-Options': 'nosniff' }).send(bytes); } catch (error) { next(error); } });
  router.use((error: unknown, _request: Request, response: import('express').Response, _next: import('express').NextFunction) => {
    const missing = error instanceof Error && /not found/.test(error.message); response.status(missing ? 404 : 400).json(apiError('INVALID_REQUEST', missing ? 'Document resource not found.' : 'Closed document request rejected.')); });
  return { router, close: async () => store.close() };
}
