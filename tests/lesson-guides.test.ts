import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { auditLessonGuides } from '../scripts/audit-lesson-guides';
import { resolveImport, supportingImports, mainSources, loadText } from '../src/lessons/catalog';
import { selectGuide } from '../src/lib/presentation';
import { LessonGuide } from '../src/components/LessonGuide';
import type * as Resources from '../src/lessons/resources';

test('every completed ID has an authored guide, objective and real UI/server sources', async () => {
  assert.deepEqual(await auditLessonGuides(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52]);
});
test('actual Vite raw catalog excludes acceptance probes and private/runtime files', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const resources = await server.ssrLoadModule('/src/lessons/resources.ts') as typeof Resources;
    const paths = Object.keys(resources.sources);
    assert.ok(paths.length > 10);
    assert.equal(paths.some(path => /dummy|tests\//i.test(path)), false);
    const { registerConcepts } = await server.ssrLoadModule('/server/concepts/registry.ts');
    assert.deepEqual(registerConcepts().map(({ id, serverPrefix }: { id: number; serverPrefix: string }) => [id, serverPrefix]), Array.from({ length: 52 }, (_, index) => [index + 1, `/api/c${index + 1}`]));
    for (const path of paths) {
      assert.match(path, /^(server\/(?:index\.ts|sse\.ts|concepts\/[^/]+\.(?:ts|mjs)|lib\/[^/]+\.ts|routes\/[^/]+\.ts|capstone\/[^/]+\.ts|unit-testing\/[^/]+\.ts|evals\/[^/]+\.ts)|src\/(?:concepts\/[^/]+\.tsx?|components\/[^/]+\.tsx|lib\/[^/]+\.ts)|shared\/(?:contracts|health|lessons|lab\d{2}-[a-z0-9-]+)\.ts|mcp-servers\/[^/]+\.(?:ts|mjs))$/);
      assert.doesNotMatch(path, /(?:test\.|spec\.|browser|live-check|credential|secret|private|(?:^|\/)(?:logs|workspaces?|sandbox)\/|\.env)/i);
      if (!path.includes('lab39-project-config-root') && !path.includes('39-project-config-root') && !path.includes('Concept39ProjectConfigRoot')) assert.doesNotMatch(path, /config/i);
    }
    for (const path of ['tests/architecture.test.ts', '.env', 'server/testing/acceptance.test.ts', 'scripts/dev-server.mjs', 'sandbox/private.ts', '../shared/contracts.ts', 'missing.ts', 'toString'])
      await assert.rejects(resources.loadText(resources.sources, path), /No bundled teaching resource/);
    const ui = await resources.loadText(resources.sources, 'src/components/LessonGuide.tsx');
    assert.match(ui, /export function LessonGuide/);
    assert.ok(supportingImports(resources.sources, 'src/components/LessonGuide.tsx', ui).includes('src/lib/presentation.ts'));
    assert.match(await resources.loadGuide(1), /^# Lab 01: Session event streaming/);
    assert.match(await resources.loadGuide(2), /^# Lab 02: Session options/);
    assert.match(await resources.loadGuide(3), /^# Lab 03: Built-in tools/);
    assert.match(await resources.loadGuide(4), /^# Lab 04: Permissions/);
    assert.match(await resources.loadGuide(5), /^# Lab 05: Custom tools/);
    assert.match(await resources.loadGuide(6), /^# Lab 06: Sessions and retained context/);
    assert.match(await resources.loadGuide(7), /^# Lab 07: Tool policy and execution audit/);
    assert.match(await resources.loadGuide(8), /^# Lab 08: Delegation and session threads/);
    assert.match(await resources.loadGuide(9), /^# Lab 09: System instructions and explicit context/);
    assert.match(await resources.loadGuide(11), /^# Lab 11: Managed skills and progressive loading/);
    assert.match(await resources.loadGuide(10), /^# Lab 10: Validated reports and interruption/);
    assert.match(await resources.loadText(resources.sources, 'shared/lab01-events.ts'), /lab01RequestSchema/);
  } finally { await server.close(); }
});
test('padded filename selection and relative resolution stay inside catalog', async () => {
  let executed = false;
  const catalog = {
    'src/concepts/Concept01Demo.tsx': async () => 'throw new Error("must never execute");',
    'src/concepts/Concept10Demo.tsx': async () => '',
    'server/concepts/01-demo.ts': async () => '',
    'src/lib/helper.ts': async () => { executed = true; return 'helper'; },
  };
  assert.deepEqual(mainSources(catalog, 1), ['src/concepts/Concept01Demo.tsx', 'server/concepts/01-demo.ts'].sort());
  assert.equal(resolveImport(catalog, 'src/concepts/Concept01Demo.tsx', '../lib/helper.js'), 'src/lib/helper.ts');
  for (const specifier of ['../../../.env', '../lib/private', 'react', '/src/lib/helper.ts'])
    assert.equal(resolveImport(catalog, 'src/concepts/Concept01Demo.tsx', specifier), undefined);
  assert.equal(executed, false, 'resolving imports does not load supporting modules');
  assert.match(await loadText(catalog, 'src/concepts/Concept01Demo.tsx'), /must never execute/);
});
test('guide boundaries reject ambiguity and malformed fences, rendering escapes hostile Markdown', () => {
  assert.equal(selectGuide('# Lab 00\n```ts\n# Lab 01\nprivate', 0), undefined);
  assert.equal(selectGuide('# Lab 00\n~~~ts\n```\n# Lab 01', 0), undefined);
  assert.equal(selectGuide('# Lab 00\na\n# Lab 0\nb', 0), undefined);
  assert.equal(selectGuide('# Lab 00\nzero\n# Lab 01\none', 0), '# Lab 00\nzero');
  const html = renderToStaticMarkup(createElement(LessonGuide, {
    lessonId: 0, markdown: '# Lab 00\n<script>alert(1)</script>\n[x](javascript:evil)\n**unfinished\n| malformed table',
  }));
  assert.doesNotMatch(html, /<script|href="javascript/);
  assert.match(html, /&lt;script&gt;|unfinished/);
});
