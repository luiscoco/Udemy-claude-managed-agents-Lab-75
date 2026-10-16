import { createManagedRouter } from './routes/managed.js';
import express from 'express';
import { createHealthRouter } from './routes/health.js';
import { registerConcepts } from './concepts/registry.js';
import { apiError, apiErrorHandler } from './lib/errors.js';

const app = express();
app.disable('x-powered-by');
app.use('/api', createHealthRouter());
const managed = createManagedRouter();
app.use('/api/managed', managed.router);
const concepts = registerConcepts();
for (const lesson of concepts) app.use(lesson.serverPrefix, lesson.router);
app.use((_request, response) => response.status(404).json(apiError('NOT_FOUND', 'Not found.')));
app.use(apiErrorHandler);
const port = Number(process.env.LEARNING_API_PORT ?? 3076);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid LEARNING_API_PORT');
const server = app.listen(port, '127.0.0.1', () => {
  console.info(`Backend ready at http://127.0.0.1:${port}`);
});
for (const lesson of concepts) lesson.attach?.(server);
server.requestTimeout = 10_000;
server.headersTimeout = 10_000;
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  const timer = setTimeout(() => { server.closeAllConnections(); }, 2_000);
  timer.unref();
  void managed.close().catch(() => { console.error('Managed session shutdown did not complete.'); });
  for (const lesson of concepts) void lesson.close?.().catch(() => { console.error('Lesson session shutdown did not complete.'); });
  server.close(() => { clearTimeout(timer); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
