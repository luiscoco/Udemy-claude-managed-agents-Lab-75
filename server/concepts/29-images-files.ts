import { Router, json } from 'express';
import { lab29Names, lab29RequestSchema } from '../../shared/lab29-images-files.js';
import { Lab29Error, readLab29Fixture, runLab29 } from '../lib/lab29-files.js';
import { apiError, apiErrorHandler } from '../lib/errors.js';

export function createLab29Router(run = runLab29) {
  const router = Router(), active = new Set<string>(); let closing = false;
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); const host = request.headers.host ?? '';
    const owner = request.headers['x-lab-owner']; if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) ||
      request.headers.origin && request.headers.origin !== `http://${host}` || request.method !== 'GET' &&
      (typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner))) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; } next(); });
  router.get('/files', async (_request, response) => { try { const files = await Promise.all(lab29Names.map(async name => {
      const item = await readLab29Fixture(name); return { name, mime: item.mime, bytes: item.bytes.length, sha256: item.sha256 }; }));
    response.json({ source: 'authored-fixtures', files, providerCalls: 0 }); }
    catch { response.status(500).json(apiError('INVALID_REQUEST', 'Reviewed fixture inventory is unavailable.')); } });
  router.get('/file/:name', async (request, response) => { const name = request.params.name;
    if (!name || !lab29Names.includes(name as typeof lab29Names[number])) { response.status(404).json(apiError('NOT_FOUND', 'Unknown fixture.')); return; }
    try { const fixture = await readLab29Fixture(name as typeof lab29Names[number]);
      response.type(fixture.mime).set('Content-Disposition', `inline; filename="${name}"`).send(fixture.bytes); }
    catch { response.status(404).json(apiError('NOT_FOUND', 'Fixture unavailable.')); } });
  router.get('/code', (_request, response) => response.json({ source: 'installed-sdk-0.133.0',
    files: ['shared/lab29-images-files.ts', 'server/lib/lab29-files.ts', 'server/concepts/29-images-files.ts'],
    blockUnion: ['text', 'image', 'document'], fileResource: 'BetaManagedAgentsFileResourceParams',
    note: 'Host file paths are not sandbox mount paths. Fixture previews never upload files.' }));
  const handler = (route: 'inline' | 'upload' | 'disk') => [json({ strict: true, limit: route === 'inline' ? '150kb' : '4kb' }),
    (request: import('express').Request, response: import('express').Response) => {
      const parsed = lab29RequestSchema.safeParse(request.body), owner = String(request.headers['x-lab-owner']);
      if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Invalid file experiment.')); return; }
      if (parsed.data.mode === 'live') { response.status(422).json(apiError('UNSUPPORTED_MODE', 'Live upload needs a separately configured explicit Files API adapter.')); return; }
      if (closing || active.has(owner) || active.size >= 4) { response.status(429).json(apiError('CAPACITY', 'Wait for the active file experiment.')); return; }
      active.add(owner); void run(route, parsed.data).then(result => response.json(result))
        .catch(error => { const status = error instanceof Lab29Error ? error.statusCode : 500;
          response.status(status).json(apiError('INVALID_REQUEST', error instanceof Lab29Error ? error.message : 'File experiment failed.')); })
        .finally(() => active.delete(owner));
    }] as const;
  router.post('/inline', ...handler('inline')); router.post('/upload', ...handler('upload')); router.post('/disk', ...handler('disk'));
  router.use(apiErrorHandler);
  return { router, close: async () => { closing = true; active.clear(); } };
}
