import { createManagedRouter } from './routes/managed.js';
import { createLearningGuideRouter } from './routes/learning-guide.js';
import { createLearningMilestonesRouter } from './routes/learning-milestones.js';
import express from 'express';
import { createHealthRouter } from './routes/health.js';
import { registerConcepts } from './concepts/registry.js';
import { apiError, apiErrorHandler } from './lib/errors.js';
import { createAiTutorRouter } from './routes/ai-tutor.js';
import { MiniProjectManager } from './lib/mini-project-manager.js';
import { createMiniProjectsRouter } from './routes/mini-projects.js';
import { resolve } from 'node:path';

const app = express();
app.disable('x-powered-by');
app.use('/api', createHealthRouter());
app.use('/api/learning-guide', createLearningGuideRouter(process.env, fetch, { cacheDirectory: 'artifacts/learning-guide/narration-cache' }));
app.use('/api/learning-milestones', createLearningMilestonesRouter());
const miniProjects = new MiniProjectManager();
app.use('/api/projects', createMiniProjectsRouter(miniProjects));
const managed = createManagedRouter();
app.use('/api/managed', managed.router);
const concepts = registerConcepts();
app.use('/api/ai-tutor', createAiTutorRouter({ lessons: concepts, storageDirectory: 'artifacts/ai-tutor' }));
for (const lesson of concepts) app.use(lesson.serverPrefix, lesson.router);
// Container mode serves the built frontend and API from one origin.
if (process.env.LEARNING_SERVE_STATIC === 'true') {
  app.use(express.static(resolve('dist'), { dotfiles: 'deny' }));
  app.get('/{*path}', (request, response, next) => {
    if (request.path === '/api' || request.path.startsWith('/api/')) { next(); return; }
    response.sendFile(resolve('dist/index.html'));
  });
}
app.use((_request, response) => response.status(404).json(apiError('NOT_FOUND', 'Not found.')));
app.use(apiErrorHandler);
const port = Number(process.env.LEARNING_API_PORT ?? 3076);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid LEARNING_API_PORT');
const host = process.env.LEARNING_HOST ?? '127.0.0.1';
if (!['127.0.0.1', '0.0.0.0'].includes(host)) throw new Error('Invalid LEARNING_HOST');
const server = app.listen(port, host, () => {
  console.info(`Backend ready at http://${host}:${port}`);
});
for (const lesson of concepts) lesson.attach?.(server);
server.requestTimeout = 10_000;
server.headersTimeout = 10_000;
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  void miniProjects.close();
  const timer = setTimeout(() => { server.closeAllConnections(); }, 2_000);
  timer.unref();
  void managed.close().catch(() => { console.error('Managed session shutdown did not complete.'); });
  for (const lesson of concepts) void lesson.close?.().catch(() => { console.error('Lesson session shutdown did not complete.'); });
  server.close(() => { clearTimeout(timer); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
