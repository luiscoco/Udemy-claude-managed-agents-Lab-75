import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import type { LessonRecord } from '../src/lessons/registry';
import type * as Resources from '../src/lessons/resources';

export async function auditLessonGuides() {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const resources = await server.ssrLoadModule('/src/lessons/resources.ts') as typeof Resources;
    const { lessons } = await server.ssrLoadModule('/src/lessons/registry.ts') as { lessons: LessonRecord[] };
    const { content } = await server.ssrLoadModule('/src/lessons/content.ts');
    for (const lesson of lessons) {
      assert.ok(content[lesson.id]?.objective.trim(), `Missing objective: ${lesson.id}`);
      assert.equal(content[lesson.id].objective, lesson.objective);
      const guide = await resources.loadGuide(lesson.id);
      for (const section of ['Prerequisites', 'Controls', 'Evidence to inspect', 'Troubleshooting', 'Limitations', 'Challenge'])
        assert.match(guide, new RegExp(`^## ${section}\\s*$`, 'm'), `Missing ${section}: ${lesson.id}`);
      const main = resources.mainSources(resources.sources, lesson.id);
      assert.ok(main.some((path) => path.startsWith('src/concepts/')), `Missing UI source: ${lesson.id}`);
      assert.ok(main.some((path) => path.startsWith('server/concepts/')), `Missing server source: ${lesson.id}`);
      for (const path of new Set([...main, ...lesson.inspect]))
        assert.ok((await resources.loadText(resources.sources, path)).trim(), `Empty source: ${path}`);
      assert.equal(lesson.serverPrefix, `/api/c${lesson.id}`);
    }
    assert.equal(Object.keys(content).length, lessons.length, 'Content must match completed lessons');
    assert.equal(Object.keys(resources.guides).length, lessons.length, 'One guide per completed lesson');
    return lessons.map(({ id }) => id);
  } finally { await server.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(`Guide/objective/UI/server source audit passed for IDs: ${(await auditLessonGuides()).join(', ')}`);
