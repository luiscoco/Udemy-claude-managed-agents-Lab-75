import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { once } from 'node:events';
import { registerConcepts } from '../server/concepts/registry';
import { reservedLessonIds } from '../shared/lessons';
test('final course mounts exactly IDs 1 to 75 with real facts/code routes and no Lab 00', async () => {
  const concepts = registerConcepts(); assert.deepEqual(concepts.map(lesson => lesson.id), reservedLessonIds);
  assert.equal(new Set(concepts.map(lesson => lesson.serverPrefix)).size, 75);
  const app = express(); for (const lesson of concepts) app.use(lesson.serverPrefix, lesson.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    for (const lesson of concepts) {
      assert.ok(lesson.title && lesson.topic && lesson.objective && lesson.steps.length && lesson.inspect.length && lesson.challenge);
      const paths = lesson.router.stack.flatMap((layer: { route?: { path?: unknown } }) => typeof layer.route?.path === 'string' ? [layer.route.path] : []);
      assert.ok(paths.length > 0, `${lesson.id} has actual operations`);
      const route = paths.includes('/facts') ? '/facts' : paths[0]!.replace(/:[A-Za-z]+/g, 'audit');
      const response = await fetch(`${base}${lesson.serverPrefix}${route}`, { method: 'OPTIONS', headers: { 'X-Lab-Owner': 'course-audit' }, signal: AbortSignal.timeout(10000) });
      assert.notEqual(response.status, 404, `${lesson.id}${route} must be mounted`);
    }
    assert.equal((await fetch(`${base}/api/c0/facts`)).status, 404);
  } finally { for (const lesson of concepts) await lesson.close?.(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
